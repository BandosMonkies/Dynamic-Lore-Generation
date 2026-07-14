/**
 * GameStateManager.js
 *
 * Broadcasts live game state to the developer dashboard tab.
 * Uses BroadcastChannel (same-origin cross-tab) + localStorage (initial load).
 *
 * Attach once: game.gameStateManager = new GameStateManager(game)
 * The dashboard reads from:
 *   - localStorage key: 'rpg_live_state'
 *   - BroadcastChannel name: 'rpg_state'
 */
export default class GameStateManager {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game) {
    this.game = game;
    this.broadcastChannel = new BroadcastChannel('rpg_state');
    this.intervalId = null;
    this.tickMs = 2000; // Broadcast every 2 seconds

    // Start broadcast loop
    this._startBroadcastLoop();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Forces an immediate state broadcast — call this after significant state changes
   * (e.g., after an AI response updates NPC emotion).
   */
  broadcastNow() {
    this._broadcast();
  }

  /**
   * Stops the broadcast loop and closes the channel.
   * Call on game destroy.
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.broadcastChannel.close();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  _startBroadcastLoop() {
    // Broadcast immediately on init, then on interval
    this._broadcast();
    this.intervalId = setInterval(() => this._broadcast(), this.tickMs);
  }

  /**
   * Collects the full live game state snapshot and broadcasts it.
   */
  _broadcast() {
    try {
      const state = this._buildSnapshot();
      const payload = JSON.stringify(state);
      localStorage.setItem('rpg_live_state', payload);
      this.broadcastChannel.postMessage(state);
    } catch {
      // Swallow broadcast errors silently to avoid console spam
    }
  }

  /**
   * Builds a full snapshot of the current game state.
   * @returns {object}
   */
  _buildSnapshot() {
    const game = this.game;

    // ── World state ────────────────────────────────────────────────────────
    const wm = game.worldManager;
    const worldState = wm
      ? {
          day: wm.day,
          hour: wm.hour,
          minute: wm.minute,
          phase: wm.getPhaseForHour(wm.hour),
          weather: wm.weather,
        }
      : { day: 1, hour: 8, minute: 0, phase: 'morning', weather: 'clear' };

    // ── Player state ───────────────────────────────────────────────────────
    const stats = game.playerStats || { hp: 100, maxHp: 100, atk: 10, def: 5 };

    // ── NPC state: collect from all active scenes ──────────────────────────
    const npcSnapshots = this._collectNPCSnapshots();

    // ── Quest state ────────────────────────────────────────────────────────
    const quests = game.questManager
      ? game.questManager.quests.map(q => ({
          id: q.id,
          title: q.title,
          status: q.status,
          progress: q.progress,
          targetCount: q.targetCount,
          objectiveType: q.objectiveType,
        }))
      : [];

    return {
      timestamp: Date.now(),
      world: worldState,
      player: {
        name: 'Jin Taira',
        hp: stats.hp,
        maxHp: stats.maxHp,
        atk: stats.atk,
        def: stats.def,
        gold: game.inventoryManager ? game.inventoryManager.gold : 0,
      },
      npcs: npcSnapshots,
      quests: quests,
    };
  }

  /**
   * Collects NPC state from any currently active Phaser scene.
   * Works even during scene transitions.
   * @returns {Array}
   */
  _collectNPCSnapshots() {
    const snapshots = [];
    const game = this.game;

    // Walk through all running scenes and grab NPC groups
    if (game.scene && game.scene.scenes) {
      game.scene.scenes.forEach(scene => {
        if (!scene.sys.isActive()) return;
        if (!scene.npcs) return;

        scene.npcs.getChildren().forEach(npc => {
          snapshots.push({
            id: npc.id,
            name: npc.name,
            role: npc.role || 'Villager',
            village: scene.sceneKey,
            x: Math.round(npc.x),
            y: Math.round(npc.y),
            emotion: npc.emotion || 'neutral',
            action: npc.currentAction || 'idle',
            isSleeping: npc.isSleeping || false,
            isVisible: npc.visible,
            movementState: npc.movementState || 'Idle',
            relationships: npc.relationships || [],
            personality: npc.personality?.description || '',
            reputation: npc.reputation ?? 0,
            // Memory log — placeholder for future memory system
            memoryLog: npc.memoryLog || [],
          });
        });
      });
    }

    return snapshots;
  }
}
