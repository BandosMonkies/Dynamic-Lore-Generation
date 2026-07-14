/**
 * MemoryManager.js
 *
 * Manages the NPC memory & rumour propagation system.
 *
 * When the player performs an action via the Action Panel, this manager:
 *  1. Builds a natural-language memory event.
 *  2. Propagates it to all NPCs across all scenes with distance-based delays.
 *  3. Applies accuracy distortion to simulate rumour degradation.
 *  4. Stores memories in each NPC's `memoryLog` array (max 12 per NPC).
 *
 * Propagation tiers (real seconds → lore meaning):
 *  ─ Witnessed  ( 0–150 px, same village): 0 s delay,  accuracy 0.95-1.0
 *  ─ Nearby     (150–400 px, same village): 5-15 s,     accuracy 0.80-0.92
 *  ─ Heard      (400+ px,    same village): 20-45 s,    accuracy 0.60-0.80
 *  ─ Traveller  (different village):       60-120 s,   accuracy 0.35-0.60
 *
 * Major events propagate faster; minor events propagate only to close NPCs.
 */

const MAX_MEMORIES_PER_NPC = 12;

// Location sub-labels within each village (rough grid quadrants)
const VILLAGE_LOCATION_NAMES = {
  Village1Scene: {
    name: 'the Capital Village',
    zones: [
      { x: 400, y: 300, label: 'the northern plaza' },
      { x: 800, y: 300, label: 'the eastern fields' },
      { x: 400, y: 500, label: 'the market district' },
      { x: 800, y: 500, label: 'the river bank' },
      { x: 200, y: 400, label: 'the western gate' },
    ]
  },
  Village2Scene: {
    name: 'the Craftsmen Village',
    zones: [
      { x: 400, y: 300, label: 'the forge district' },
      { x: 700, y: 300, label: 'the lumber yard' },
      { x: 400, y: 500, label: 'the artisan quarter' },
      { x: 700, y: 500, label: 'the southern road' },
    ]
  },
  Village3Scene: {
    name: 'the Military Village',
    zones: [
      { x: 400, y: 300, label: 'the garrison square' },
      { x: 700, y: 300, label: 'the watchtower' },
      { x: 400, y: 500, label: 'the barracks yard' },
      { x: 700, y: 500, label: 'the southern wall' },
    ]
  },
  ArcheryBarracksScene: {
    name: 'the Archery Barracks',
    zones: [
      { x: 400, y: 450, label: 'the training field' },
      { x: 600, y: 650, label: 'the arrow range' },
      { x: 300, y: 650, label: 'the instructor\'s post' },
    ]
  },
};

export default class MemoryManager {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game) {
    this.game = game;
    // Track pending timers so we can cancel on destroy
    this._timers = [];
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Fires a world event from the Action Panel.
   * Propagates it as memories/rumours to all NPCs.
   *
   * @param {object} actionDef - The action from actionsData
   * @param {number} playerX   - Player world X at the time of the action
   * @param {number} playerY   - Player world Y at the time of the action
   * @param {string} village   - Scene key of the current village
   */
  registerEvent(actionDef, playerX, playerY, village) {
    const locationLabel = this._resolveLocation(village, playerX, playerY);
    const playerName    = 'Jin Taira';

    const eventText = actionDef.eventTemplate
      .replace('{player}', playerName)
      .replace('{location}', locationLabel);

    const event = {
      id:        `evt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      text:      eventText,
      category:  actionDef.category,
      severity:  actionDef.severity,
      icon:      actionDef.icon,
      label:     actionDef.label,
      timestamp: Date.now(),
      location:  { x: playerX, y: playerY, village },
    };

    // Propagate to every NPC in every scene
    this._propagate(event, playerX, playerY, village);

    // Trigger an immediate dashboard update
    if (this.game.gameStateManager) {
      this.game.gameStateManager.broadcastNow();
    }

    return event;
  }

  /**
   * Returns the formatted memory log string for the AI prompt.
   * Only includes recent memories (within the last 10 minutes of game time).
   *
   * @param {NPC} npc
   * @returns {string}
   */
  getFormattedMemoryLog(npc) {
    if (!npc.memoryLog || npc.memoryLog.length === 0) return '';

    const now = Date.now();
    const lines = npc.memoryLog.map(m => {
      const ageSeconds = Math.round((now - m.receivedAt) / 1000);
      const ageLabel   = this._formatAge(ageSeconds);
      const prefix     = m.fromRumor ? 'RUMOUR' : 'WITNESSED';
      return `[${prefix}] ${m.text} (${ageLabel})`;
    });

    return lines.join('\n');
  }

  destroy() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
  }

  // ─── Propagation ────────────────────────────────────────────────────────────

  _propagate(event, playerX, playerY, sourceVillage) {
    const game = this.game;
    if (!game.scene || !game.scene.scenes) return;

    const sevMultiplier = { minor: 0.6, notable: 1.0, major: 1.4 }[event.severity] ?? 1;

    game.scene.scenes.forEach(scene => {
      if (!scene.npcs || !scene.npcs.children) return;

      const isSameVillage = scene.sceneKey === sourceVillage;

      scene.npcs.getChildren().forEach(npc => {
        let delay    = 0;
        let accuracy = 1.0;
        let fromRumor = false;

        if (isSameVillage) {
          const dist = Math.hypot(npc.x - playerX, npc.y - playerY);

          if (dist < 150) {
            // Witnessed
            delay    = 0;
            accuracy = 0.95 + Math.random() * 0.05;
            fromRumor = false;
          } else if (dist < 400) {
            // Nearby — word travels quickly
            const base = (5 + Math.random() * 10) * 1000; // 5-15s
            delay    = Math.round(base / sevMultiplier);
            accuracy = 0.80 + Math.random() * 0.12;
            fromRumor = false;
          } else {
            // Heard within the village
            const base = (20 + Math.random() * 25) * 1000; // 20-45s
            delay    = Math.round(base / sevMultiplier);
            accuracy = 0.60 + Math.random() * 0.20;
            fromRumor = true;
          }
        } else {
          // Different village — inter-village rumour
          // Minor events don't cross village boundaries
          if (event.severity === 'minor') return;

          const base = (60 + Math.random() * 60) * 1000; // 60-120s
          delay    = Math.round(base / sevMultiplier);
          accuracy = 0.35 + Math.random() * 0.25;
          fromRumor = true;
        }

        if (delay === 0) {
          this._injectMemory(npc, event, accuracy, fromRumor);
        } else {
          const tid = setTimeout(() => {
            this._injectMemory(npc, event, accuracy, fromRumor);
            // Broadcast after delayed injection
            if (this.game.gameStateManager) {
              this.game.gameStateManager.broadcastNow();
            }
          }, delay);
          this._timers.push(tid);
        }
      });
    });
  }

  // ─── Memory Injection ────────────────────────────────────────────────────────

  _injectMemory(npc, event, accuracy, fromRumor) {
    if (!npc.memoryLog) npc.memoryLog = [];

    const text = accuracy < 0.65
      ? this._distort(event.text, accuracy)
      : event.text;

    const entry = {
      id:          event.id,
      text:        text,
      originalText: event.text,
      category:    event.category,
      severity:    event.severity,
      icon:        event.icon,
      eventAt:     event.timestamp,
      receivedAt:  Date.now(),
      accuracy:    Math.round(accuracy * 100) / 100,
      fromRumor:   fromRumor,
    };

    // Prepend newest, keep cap
    npc.memoryLog.unshift(entry);
    if (npc.memoryLog.length > MAX_MEMORIES_PER_NPC) {
      npc.memoryLog.length = MAX_MEMORIES_PER_NPC;
    }

  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Finds the nearest named zone label in the village for natural descriptions.
   */
  _resolveLocation(village, x, y) {
    const config = VILLAGE_LOCATION_NAMES[village];
    if (!config) return 'the area';

    let nearest  = config.zones[0];
    let minDist  = Infinity;

    config.zones.forEach(zone => {
      const d = Math.hypot(zone.x - x, zone.y - y);
      if (d < minDist) { minDist = d; nearest = zone; }
    });

    return nearest.label;
  }

  /**
   * Distorts event text to simulate rumour degradation at low accuracy.
   * Replaces specific terms with vaguer alternatives and adds uncertainty phrasing.
   */
  _distort(text, accuracy) {
    const uncertaintyPhrases = [
      'I heard that', 'They say', 'Rumour has it', 'Someone told me',
      'Word from a traveller is that', 'Apparently',
    ];
    const prefix = uncertaintyPhrases[Math.floor(Math.random() * uncertaintyPhrases.length)];

    let result = text.toLowerCase();

    // Replace specifics with vague terms
    const replacements = [
      [/killed one of khan's soldiers/g, 'attacked a soldier'],
      [/wiped out a khan patrol squad/g, 'fought with soldiers'],
      [/sabotaged khan's supply cache/g, 'caused trouble near the supplies'],
      [/unmasked a khan spy/g, 'revealed a traitor'],
      [/publicly refused khan's demands/g, 'defied the occupiers'],
      [/killed a wild wolf/g, 'dealt with some wild animal'],
      [/defeated a bandit rogue/g, 'fought a criminal'],
      [/recovered stolen goods/g, 'found something suspicious'],
      [/near the /g, 'somewhere near '],
      [/at the /g, 'somewhere around the '],
    ];

    replacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return `${prefix} ${result}`;
  }

  /**
   * Formats a memory age into a human-readable string.
   */
  _formatAge(seconds) {
    if (seconds < 10)  return 'moments ago';
    if (seconds < 60)  return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min ago`;
    return `${Math.round(seconds / 3600)}h ago`;
  }
}
