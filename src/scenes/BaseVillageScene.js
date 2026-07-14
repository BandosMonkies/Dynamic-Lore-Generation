import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { npcsData } from '../data/npcs.js';
import NPC from '../entities/NPC.js';
import DialogueManager from '../managers/DialogueManager.js';
import QuestManager from '../managers/QuestManager.js';
import InventoryManager from '../managers/InventoryManager.js';
import ClanManager from '../managers/ClanManager.js';
import EquipmentManager from '../managers/EquipmentManager.js';
import ShopManager from '../managers/ShopManager.js';
import { shopsData } from '../data/shops.js';
import CombatManager from '../managers/CombatManager.js';
import EnemyManager from '../managers/EnemyManager.js';
import WorldManager from '../managers/WorldManager.js';
import LightingManager from '../managers/LightingManager.js';
import WeatherRenderer from '../managers/WeatherRenderer.js';
import ScheduleManager from '../managers/ScheduleManager.js';
import SaveManager from '../managers/SaveManager.js';
import { interiorsConfig } from '../data/interiors.js';
import NPCAIManager from '../managers/NPCAIManager.js';
import GameStateManager from '../managers/GameStateManager.js';
import MemoryManager from '../managers/MemoryManager.js';
import ActionPanelManager from '../managers/ActionPanelManager.js';

export default class BaseVillageScene extends Phaser.Scene {
  constructor(sceneKey, bgKey, collisionKey) {
    super(sceneKey);
    this.sceneKey = sceneKey;
    this.bgKey = bgKey;
    this.collisionKey = collisionKey;

    // Cached map variables
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.collisionData = null;
    this.transitioning = false;
  }

  create(data) {
    // Reset transition state on enter
    this.transitioning = false;

    // Get default spawn points if not passed from transitions
    const spawnX = data.spawnX !== undefined ? data.spawnX : 512;
    const spawnY = data.spawnY !== undefined ? data.spawnY : 400;

    // Add background image at (0, 0)
    const bg = this.add.image(0, 0, this.bgKey).setOrigin(0, 0);

    // Extract map sizes
    this.mapWidth = bg.width;
    this.mapHeight = bg.height;

    // Load and cache the collision map bytes
    this.cacheCollisionMask();

    // Snapping spawn coordinates to the nearest walkable pixel to prevent spawning stuck in collision bounds
    const spawnPoint = this.getNearestWalkable(spawnX, spawnY);
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    // Initialize NPC Group and spawn active NPCs for this village
    this.npcs = this.add.group();
    this.activeInteractableNPC = null;
    npcsData.forEach(config => {
      if (config.village === this.sceneKey && config.active) {
        // Safe check: dynamically snap NPC to nearest walkable coordinate if needed
        const npcSpawn = this.getNearestWalkable(config.x, config.y);
        const snappedConfig = { ...config, x: npcSpawn.x, y: npcSpawn.y };
        const npc = new NPC(this, snappedConfig);
        this.npcs.add(npc);
      }
    });

    // Interaction key binding (Press E to interact)
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyE.on('down', () => this.handleInteraction());

    // Setup portal entrance keys and prompts
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.entrancePrompts = [];
    this.isNearEntranceOrExit = false;

    Object.entries(interiorsConfig).forEach(([interiorKey, config]) => {
      if (config.parentVillage === this.sceneKey) {
        const text = this.add.text(config.entranceTrigger.x, config.entranceTrigger.y - 40, 'Press F to Enter', {
          font: 'bold 11px Outfit',
          fill: '#0b0c10',
          backgroundColor: '#66fcf1',
          padding: { x: 5, y: 3 }
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(1000);

        this.entrancePrompts.push({
          interiorKey,
          config,
          text
        });
      }
    });

    // Dialogue UI manager and key controls for advancing pages
    this.dialogueManager = new DialogueManager();
    this.dialogueManager.init();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Quest Manager registration (persists globally on game instance)
    if (!this.game.questManager) {
      this.game.questManager = new QuestManager(this.game);
    }
    this.game.questManager.init(this.game.events);

    // Key J binds to toggle Quest Log
    this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyJ.on('down', () => this.game.questManager.toggleQuestLog());

    // Inventory Manager registration (persists globally on game instance)
    if (!this.game.inventoryManager) {
      this.game.inventoryManager = new InventoryManager(this.game);
    }
    this.game.inventoryManager.init();

    // Key I binds to toggle Inventory Log
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyI.on('down', () => this.game.inventoryManager.toggleInventory());

    // Clan Manager registration (persists globally on game instance)
    if (!this.game.clanManager) {
      this.game.clanManager = new ClanManager(this.game);
      // Make npcsData globally available on the game instance
      this.game.npcsData = npcsData;
    }

    // Equipment Manager registration (persists globally on game instance)
    if (!this.game.equipmentManager) {
      this.game.equipmentManager = new EquipmentManager(this.game);
    }

    // Shop Manager registration (persists globally on game instance)
    if (!this.game.shopManager) {
      this.game.shopManager = new ShopManager(this.game);
    }
    this.game.shopManager.init();

    // Bind dialogue choice buttons for merchant interactions
    this.choiceOverlay = document.getElementById('choice-overlay');
    this.choiceTradeBtn = document.getElementById('choice-trade-btn');
    this.choiceExitBtn = document.getElementById('choice-exit-btn');

    // NPC AI Manager registration (persists globally on game instance)
    if (!this.game.npcAIManager) {
      this.game.npcAIManager = new NPCAIManager(this.game);
    }

    // Memory Manager — NPC memory & rumour propagation system
    if (!this.game.memoryManager) {
      this.game.memoryManager = new MemoryManager(this.game);
    }

    // Action Panel Manager — interactive action simulation panel
    if (!this.game.actionPanel) {
      this.game.actionPanel = new ActionPanelManager(this.game);
      this.game.actionPanel.init();
    }

    // Tab key: toggle the Action Panel
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.keyTab.on('down', (event) => {
      // Don't open if dialogue is active
      if (this.dialogueManager && this.dialogueManager.isDialogueActive) return;
      // Prevent browser default tab-focus behavior
      event.originalEvent.preventDefault();
      if (this.game.actionPanel) {
        this.game.actionPanel.toggle(this.game);
      }
    });

    // Game State Manager — broadcasts live state to the developer dashboard
    if (!this.game.gameStateManager) {
      this.game.gameStateManager = new GameStateManager(this.game);
    }

    // Combat Manager registration
    if (!this.game.combatManager) {
      this.game.combatManager = new CombatManager(this.game);
    }

    // Enemy Manager registration
    this.enemyManager = new EnemyManager(this);
    this.enemyManager.spawnSceneEnemies();

    // Initialize World Clock if not exists
    if (!this.game.worldManager) {
      this.game.worldManager = new WorldManager(this.game);
      this.game.worldManager.init();
    } else {
      this.game.worldManager.init();
    }

    // Initialize scene-level lighting and weather renderers
    this.lightingManager = new LightingManager(this);
    this.weatherRenderer = new WeatherRenderer(this);

    // Initialize scene schedules and snap NPCs to schedules
    this.scheduleManager = new ScheduleManager(this);
    this.scheduleManager.syncAllNpcsImmediate();

    // Hotkeys K (Save) and L (Load)
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.keyK.on('down', () => {
      SaveManager.saveGame(this.game, this.sceneKey, this.player.x, this.player.y);
    });
    this.keyL.on('down', () => {
      SaveManager.loadGame(this.game, this);
    });

    // Setup HTML Button overrides
    const saveBtn = document.getElementById('hud-save-btn');
    const loadBtn = document.getElementById('hud-load-btn');
    if (saveBtn) {
      saveBtn.onclick = (e) => {
        e.stopPropagation();
        SaveManager.saveGame(this.game, this.sceneKey, this.player.x, this.player.y);
      };
    }
    if (loadBtn) {
      loadBtn.onclick = (e) => {
        e.stopPropagation();
        SaveManager.loadGame(this.game, this);
      };
    }

    // Register player death listener
    this.game.events.on('player-defeated', this.handlePlayerDefeated, this);

    // Click to attack input
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.player.attack();
      }
    });

    // Clean listeners on shutdown
    this.events.once('shutdown', () => {
      this.game.events.off('player-defeated', this.handlePlayerDefeated, this);
      
      const sBtn = document.getElementById('hud-save-btn');
      const lBtn = document.getElementById('hud-load-btn');
      if (sBtn) sBtn.onclick = null;
      if (lBtn) lBtn.onclick = null;

      if (this.lightingManager) this.lightingManager.destroy();
      if (this.weatherRenderer) this.weatherRenderer.destroy();
      if (this.scheduleManager) this.scheduleManager.destroy();

      if (this.enemyManager) {
        this.enemyManager.destroy();
      }

      if (this.entrancePrompts) {
        this.entrancePrompts.forEach(item => {
          if (item.text) item.text.destroy();
        });
      }
      if (this.portalPrompt) {
        this.portalPrompt.destroy();
      }
    });

    // Setup Camera
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.75);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Optional indicator text for dev/visual reference
    const label = this.sceneKey.replace('Scene', '');
    this.add.text(16, 16, label, {
      font: 'bold 16px Outfit',
      fill: '#66fcf1',
      backgroundColor: '#0b0c10',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);
  }

  update(time, delta) {
    if (this.player) {
      const isChoiceActive = this.choiceOverlay && this.choiceOverlay.classList.contains('choice-visible');
      const isShopActive = this.game.shopManager && this.game.shopManager.isShopActive;

      // If choice prompt or shop is open, freeze inputs
      if (isChoiceActive || isShopActive) {
        this.player.update(time, delta);
        return;
      }

      // If quest log is open, block updates but still run player to update animations
      if (this.game.questManager && this.game.questManager.isLogActive) {
        this.player.update(time, delta);
        return;
      }

      // If action panel is open, block updates but still run player to update animations
      if (this.game.actionPanel && this.game.actionPanel.isPanelActive) {
        this.player.update(time, delta);
        return;
      }

      // If inventory is open, block updates but still run player to update animations
      if (this.game.inventoryManager && this.game.inventoryManager.isInventoryActive) {
        this.player.update(time, delta);
        return;
      }

      // If dialogue is active, block movement/proximity updates and intercept Space/Enter to advance page
      if (this.dialogueManager && this.dialogueManager.isDialogueActive) {
        if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
          this.dialogueManager.advanceDialogue();
        }
        this.player.update(time, delta);
        return;
      }

      // Check space attack trigger
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.player.attack();
      }

      // Update simulation managers
      if (this.game.worldManager) {
        this.game.worldManager.update(time, delta);
      }
      if (this.weatherRenderer) {
        this.weatherRenderer.update(time, delta);
      }
      if (this.scheduleManager) {
        this.scheduleManager.update(time, delta);
      }

      this.player.update(time, delta);
      if (this.enemyManager) {
        this.enemyManager.update(time, delta, this.player);
      }
      this.checkTransitions();
      this.updateNPCProximity();

      // Dynamic Y-sorting for 2D depth (excluding the UI Prompts fixed at depth 1000)
      this.children.each(child => {
        if (child.y && child.depth < 1000) {
          child.depth = child.y;
        }
      });
    }
  }

  cacheCollisionMask() {
    const sourceImage = this.textures.get(this.collisionKey).getSourceImage();

    const canvas = document.createElement('canvas');
    canvas.width = this.mapWidth;
    canvas.height = this.mapHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);

    const imgData = ctx.getImageData(0, 0, this.mapWidth, this.mapHeight);
    this.collisionData = imgData.data;
  }

  isWalkable(x, y) {
    // Clamp to map boundaries
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return false;
    }

    const tx = Math.floor(x);
    const ty = Math.floor(y);

    // Calculate 1D index from 2D coordinates in Uint8ClampedArray
    const index = (ty * this.mapWidth + tx) * 4;

    // Check Red channel. Since it is black/white:
    // White path (>128) is walkable. Black obstacle (<128) is blocked.
    return this.collisionData[index] < 128;
  }

  isFeetWalkable(x, y) {
    // Define size of feet collider box (relative to scaled player origin)
    const halfWidth = 8;
    const feetHeight = 4;

    // We check 6 key boundary points on the feet rectangle
    return (
      this.isWalkable(x - halfWidth, y) &&
      this.isWalkable(x + halfWidth, y) &&
      this.isWalkable(x - halfWidth, y - feetHeight) &&
      this.isWalkable(x + halfWidth, y - feetHeight) &&
      this.isWalkable(x, y) &&
      this.isWalkable(x, y - feetHeight / 2)
    );
  }

  checkTransitions() {
    if (this.transitioning) return;

    // Check interior entrance triggers
    let closeToAnyEntrance = false;
    if (this.entrancePrompts) {
      this.entrancePrompts.forEach(item => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.config.entranceTrigger.x, item.config.entranceTrigger.y);
        if (dist <= item.config.entranceTrigger.radius) {
          closeToAnyEntrance = true;
          item.text.setAlpha(1);

          if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
            this.transitionTo(item.interiorKey, item.config.spawnInside.x, item.config.spawnInside.y);
          }
        } else {
          item.text.setAlpha(0);
        }
      });
    }
    this.isNearEntranceOrExit = closeToAnyEntrance;

    // Village 1: top gate (y < 45) -> Village 2
    if (this.sceneKey === 'Village1Scene' && this.player.y < 45) {
      this.transitionTo('Village2Scene', 512, 970);
    }
    // Village 2: bottom gate (y > height - 45) -> Village 1, top gate (y < 45) -> Village 3
    else if (this.sceneKey === 'Village2Scene') {
      if (this.player.y < 45) {
        this.transitionTo('Village3Scene', 512, 760);
      } else if (this.player.y > this.mapHeight - 45) {
        this.transitionTo('Village1Scene', 512, 80);
      }
    }
    // Village 3: bottom gate (y > height - 45) -> Village 2
    else if (this.sceneKey === 'Village3Scene' && this.player.y > this.mapHeight - 45) {
      this.transitionTo('Village2Scene', 512, 80);
    }
  }

  transitionTo(targetScene, spawnX, spawnY) {
    this.transitioning = true;
    
    // Auto-save game state on scene transition
    SaveManager.autoSave(this.game, targetScene, spawnX, spawnY);

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(targetScene, { spawnX, spawnY });
    });
  }

  getNearestWalkable(startX, startY) {
    if (this.isFeetWalkable(startX, startY)) {
      return { x: startX, y: startY };
    }

    // Spiral search outwards to snap player to nearest open ground
    const maxRadius = 200;
    const step = 4;
    for (let r = step; r <= maxRadius; r += step) {
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = Phaser.Math.DegToRad(angle);
        const x = Math.round(startX + Math.cos(rad) * r);
        const y = Math.round(startY + Math.sin(rad) * r);

        if (this.isFeetWalkable(x, y)) {
          // Log silenced to avoid developer console flooding
          return { x, y };
        }
      }
    }

    // Default fallback
    return { x: startX, y: startY };
  }

  updateNPCProximity() {
    if (!this.player || !this.npcs) return;

    // Prioritize entrance/exit prompt over NPC interactions
    if (this.isNearEntranceOrExit) {
      this.npcs.getChildren().forEach(npc => {
        npc.showPrompt(false);
      });
      this.activeInteractableNPC = null;
      return;
    }

    let closestNPC = null;
    let closestDistance = Infinity;

    // Scan the Phaser NPC Group to find the closest interactable entity
    this.npcs.getChildren().forEach(npc => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist <= npc.interactionRadius) {
        if (dist < closestDistance) {
          closestDistance = dist;
          closestNPC = npc;
        }
      }
      // Reset indicator state by default
      npc.showPrompt(false);
    });

    // Render "Press E" prompt for only the single closest NPC in range
    if (closestNPC) {
      closestNPC.showPrompt(true);
      this.activeInteractableNPC = closestNPC;
    } else {
      this.activeInteractableNPC = null;
    }
  }

  handleInteraction() {
    if (this.activeInteractableNPC && this.dialogueManager) {
      this._handleInteractionAsync(this.activeInteractableNPC);
    }
  }

  /**
   * Async interaction handler.
   * Attempts AI-generated dialogue via NPCAIManager; falls back to static dialogue on failure.
   * Merchants and sleeping NPCs always use static dialogue (no AI call needed).
   *
   * @param {NPC} npc - The NPC the player is interacting with.
   */
  async _handleInteractionAsync(npc) {
    // Hide prompt immediately on start
    npc.showPrompt(false);

    const npcId = npc.id;
    const dialogueId = npc.dialogueId;

    // Emit event indicating player talked to NPC (quest tracking)
    this.game.events.emit('npc-talked', npcId);

    // Shared completion callback used by both AI and static dialogue paths
    const onDialogueComplete = () => {
      // Emit event indicating dialogue completed (quest tracking)
      this.game.events.emit('dialogue-ended', { dialogueId, npcId });

      // Check if the NPC is a merchant to show the trade choices prompt
      if (shopsData[npcId]) {
        this.showMerchantChoice(npcId);
      } else {
        // Restore proximity checking
        this.updateNPCProximity();
      }
    };

    // ── Bypass AI only for merchants and sleeping NPCs ─────────────────────
    // Both always use static dialogue (merchants → shop UI, sleeping → Zzz...)
    // For all other NPCs: always attempt the AI path and fall back on failure.
    const isMerchant = !!shopsData[npcId];
    const isSleeping = npc.isSleeping;
    const aiManager = this.game.npcAIManager;

    if (isMerchant || isSleeping || !aiManager) {
      this.dialogueManager.startDialogue(dialogueId, npc, onDialogueComplete);
      return;
    }

    // ── AI Dialogue Path ──────────────────────────────────────────────────
    // Show the "Thinking..." indicator immediately so the player gets feedback
    this.dialogueManager.showThinking(npc);

    try {
      const aiResponse = await aiManager.requestNPCResponse(npc, this);

      if (aiResponse && aiResponse.dialogue) {
        // ✅ AI succeeded — render the generated dialogue
        this.dialogueManager.startAIDialogue(npc, aiResponse, onDialogueComplete);
      } else {
        // AI returned null or empty — fall back to static dialogue
        this.dialogueManager.hideThinking();
        this.dialogueManager.closeDialogue();
        this.dialogueManager.startDialogue(dialogueId, npc, onDialogueComplete);
      }
    } catch {
      // Network error / timeout — fall back gracefully
      this.dialogueManager.hideThinking();
      this.dialogueManager.closeDialogue();
      this.dialogueManager.startDialogue(dialogueId, npc, onDialogueComplete);
    }
  }

  showMerchantChoice(npcId) {
    if (!this.choiceOverlay) return;
    
    // Freeze player input state while choice is open
    this.choiceOverlay.className = 'choice-visible';

    this.choiceTradeBtn.onclick = () => {
      this.choiceOverlay.className = 'choice-hidden';
      if (this.game.shopManager) {
        this.game.shopManager.toggleShop(true, npcId);
      }
    };

    this.choiceExitBtn.onclick = () => {
      this.choiceOverlay.className = 'choice-hidden';
      this.updateNPCProximity();
    };
  }

  handlePlayerDefeated() {
    if (this.transitioning) return;
    this.transitioning = true;

    // Shake and flash screen red
    this.cameras.main.flash(500, 200, 0, 0);

    // Add overlay text
    const deathText = this.add.text(400, 300, 'YOU WERE DEFEATED', {
      font: 'bold 36px Outfit',
      fill: '#ff3333',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Reset player HP to max
        this.game.playerStats.hp = this.game.playerStats.maxHp;
        if (this.game.inventoryManager) {
          this.game.inventoryManager.renderInventory();
        }
        
        deathText.destroy();
        
        // Respawn at middle of the current scene
        this.scene.start(this.sceneKey, { spawnX: 512, spawnY: 400 });
      });
    });
  }
}

