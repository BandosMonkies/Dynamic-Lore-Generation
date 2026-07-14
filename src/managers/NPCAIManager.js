/**
 * NPCAIManager.js
 *
 * Game-side singleton that connects the Phaser engine to the Qwen NPC AI server.
 * Attach once to game.npcAIManager in BaseVillageScene.create().
 *
 * Responsibilities:
 *  - Check if the ML server is alive (/health)
 *  - Assemble a rich JSON context payload from all active game managers
 *  - POST it to the server and return the parsed AI response
 *  - Signal when the server is offline so callers can use fallback dialogue
 */

export default class NPCAIManager {
  /**
   * @param {Phaser.Game} game - The global Phaser game instance.
   */
  constructor(game) {
    this.game = game;

    // ML server base URL (Flask, port 5000)
    this.serverURL = 'http://localhost:5000';

    // Whether the server was reachable at last check
    this.isOnline = false;

    // Timeout for each fetch request (ms) — prevents game freeze
    this.requestTimeoutMs = 15000;

    // Run an initial health check silently
    this._checkHealth();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Checks whether the ML server is reachable.
   * Updates this.isOnline.
   * @returns {Promise<boolean>}
   */
  async isServerAlive() {
    return await this._checkHealth();
  }

  /**
   * Builds the full game-state context payload and sends it to the ML server.
   * Returns the structured AI response, or null if the server is offline/errored.
   *
   * @param {NPC} npc - The NPC entity the player is interacting with.
   * @param {Phaser.Scene} scene - The active scene (for world/player context).
   * @returns {Promise<{thoughts: string, emotion: string, action: string, dialogue: string}|null>}
   */
  async requestNPCResponse(npc, scene) {
    if (!this.isOnline) {
      // Do a fresh check — server might have come online since last attempt
      const alive = await this._checkHealth();
      if (!alive) {
        return null;
      }
    }

    try {
      const payload = this._buildPayload(npc, scene);

      const response = await this._fetchWithTimeout(
        `${this.serverURL}/npc/infer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        this.requestTimeoutMs
      );

      if (!response.ok) {
        await response.json().catch(() => ({}));
        return null;
      }

      const data = await response.json();
      return data.response || null;

    } catch (err) {
      this.isOnline = false;
      return null;
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Pings GET /health and updates this.isOnline.
   * @returns {Promise<boolean>}
   */
  async _checkHealth() {
    try {
      const response = await this._fetchWithTimeout(
        `${this.serverURL}/health`,
        { method: 'GET' },
        3000 // Short timeout for health check
      );
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  /**
   * Builds the complete structured JSON payload from the current game state.
   *
   * @param {NPC} npc - The NPC being interacted with.
   * @param {Phaser.Scene} scene - The active Phaser scene.
   * @returns {object} Full payload matching the server's expected schema.
   */
  _buildPayload(npc, scene) {
    const game = this.game;

    // ── World state ────────────────────────────────────────────────────────
    const worldManager = game.worldManager;
    const worldState = worldManager
      ? {
          day: worldManager.day,
          hour: worldManager.hour,
          minute: worldManager.minute,
          phase: worldManager.getPhaseForHour(worldManager.hour),
          weather: worldManager.weather,
        }
      : { day: 1, hour: 12, minute: 0, phase: 'afternoon', weather: 'clear' };

    // ── Player state ───────────────────────────────────────────────────────
    const playerStats = game.playerStats || { hp: 100, maxHp: 100, atk: 10, def: 5 };
    const playerInfo = {
      name: 'Jin Taira',
      location: scene.sceneKey || 'Unknown Village',
      hp: playerStats.hp,
      maxHp: playerStats.maxHp,
      atk: playerStats.atk,
      def: playerStats.def,
    };

    // ── Inventory context (gold amount only — lightweight) ─────────────────
    const gold = game.inventoryManager ? game.inventoryManager.gold : 0;

    // ── Quest context: active quests involving this NPC ─────────────────────
    const questContext = [];
    if (game.questManager) {
      game.questManager.quests.forEach(quest => {
        if (
          quest.status === 'active' &&
          (quest.giverNpcId === npc.id || quest.targetId === npc.id)
        ) {
          questContext.push(`${quest.title} (${quest.progress}/${quest.targetCount})`);
        }
      });
    }

    // ── Relationship data from NPC config ──────────────────────────────────
    const relationships = Array.isArray(npc.relationships) ? npc.relationships : [];

    // ── NPC context ────────────────────────────────────────────────────────
    const npcInfo = {
      id: npc.id,
      name: npc.name,
      role: npc.role || 'Villager',
      personality: npc.personality?.description || 'calm and reserved',
      emotion: npc.emotion || 'neutral',
      reputation: npc.reputation ?? 0,
      current_action: npc.currentAction || 'idle',
      is_sleeping: npc.isSleeping || false,
    };

    // ── Memory log: live NPC memories from the MemoryManager ─────────────
    const memoryManager = this.game.memoryManager;
    const memoryLog = memoryManager
      ? memoryManager.getFormattedMemoryLog(npc)
      : '';

    // ── Trigger event: describe what the player did ────────────────────────
    const triggerEvent = `${playerInfo.name} approached and initiated conversation with ${npc.name}.`;

    return {
      npc: npcInfo,
      player: playerInfo,
      relationships: relationships,
      memory_log: memoryLog,
      trigger_event: triggerEvent,
      world_state: worldState,
      quest_context: questContext,
      player_gold: gold,
      max_new_tokens: 150,
    };
  }

  /**
   * fetch() wrapper with an AbortController-based timeout.
   *
   * @param {string} url
   * @param {RequestInit} options
   * @param {number} timeoutMs
   * @returns {Promise<Response>}
   */
  async _fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
}
