import Phaser from 'phaser';

export default class NPC extends Phaser.GameObjects.Sprite {
  constructor(scene, npcConfig) {
    // Spawn at the coordinates defined in config
    super(scene, npcConfig.x, npcConfig.y, npcConfig.spriteKey || 'npc_placeholder');
    
    // Save properties from the config
    this.id = npcConfig.id;
    this.name = npcConfig.name;
    this.role = npcConfig.role;
    this.village = npcConfig.village;
    this.interactionRadius = npcConfig.interactionRadius || 50;
    this.dialogueId = npcConfig.dialogueId;
    this.active = npcConfig.active !== undefined ? npcConfig.active : true;

    // Reserved properties for future gameplay systems (Dialogue/AI/Quests)
    this.personality = npcConfig.personality || {};
    this.memories = npcConfig.memories || [];
    this.relationships = npcConfig.relationships || [];
    this.schedule = npcConfig.schedule || {};
    this.reputation = npcConfig.reputation !== undefined ? npcConfig.reputation : 0;
    this.emotion = npcConfig.emotion || 'neutral';
    this.questIds = npcConfig.questIds || [];

    // Add this NPC sprite to the scene display list
    scene.add.existing(this);

    // Scale and configure real character sprites (not the placeholder circle)
    // The stand images are native resolution (approx 431x562) and tightly cropped. 
    // Decreased scale slightly based on user feedback.
    this._isRealSprite = !!(npcConfig.spriteKey && npcConfig.spriteKey !== 'npc_placeholder');
    if (this._isRealSprite) {
      this.setScale(0.135);
      // Show idle frame on creation if it's a spritesheet
      if (npcConfig.defaultFrame) {
        this.setFrame(npcConfig.defaultFrame);
      }
    }

    // Set feet-centered origin (0.5 bottom-aligned) for Y-sorting and precise placement
    this.setOrigin(0.5, 0.95);

    // Setup interactive prompt: "Press E" text bubble hovering above the NPC's head
    this.promptText = scene.add.text(npcConfig.x, npcConfig.y - 70, 'Press E', {
      font: 'bold 11px Outfit',
      fill: '#0b0c10',
      backgroundColor: '#66fcf1',
      padding: { x: 5, y: 3 }
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(1000); // Renders above standard map layers

    // Schedule path variables
    this.pathQueue = [];
    this.currentPathTarget = null;
    this.currentAction = npcConfig.currentAction || 'idle';
    this.isSleeping = false;

    // ── Patrol movement state ────────────────────────────────────────────────
    this.patrolEnabled = !!(npcConfig.patrol);
    this.patrolSpeed   = npcConfig.patrolSpeed || 45;   // px per second
    this.patrolTarget  = null;
    this.patrolTimer   = 0;                             // ms until next waypoint pick
    // Animation key prefix: e.g. 'gwansik' → plays 'gwansik_walk_left' etc.
    this._animKey = npcConfig.spriteKey || null;
    // Home position — patrol wanders relative to this
    this._homeX = npcConfig.x;
    this._homeY = npcConfig.y;
    this._patrolRadius = npcConfig.patrolRadius || 130; // max wander distance from home
  }

  // ── Called every frame by BaseVillageScene.update() ─────────────────────
  updateMovement(delta, scene) {
    if (!this.patrolEnabled) return;

    // Pause movement and animation during dialogue/menus
    const isDialogueActive = scene.dialogueManager && scene.dialogueManager.isDialogueActive;
    const isShopActive = scene.game.shopManager && scene.game.shopManager.isShopActive;
    if (isDialogueActive || isShopActive) {
      if (this._isRealSprite && this.anims && this.anims.isPlaying) {
        this.anims.stop();
        this.setFrame(`${this._animKey}_walk_right_0`);
      }
      return;
    }

    if (this.isSleeping) {
      // Stop moving and show idle frame when sleeping
      if (this._isRealSprite && this.anims && this.anims.isPlaying) {
        this.anims.stop();
        this.setFrame(`${this._animKey}_walk_right_0`);
      }
      return;
    }

    this.patrolTimer -= delta;

    // Pick a new waypoint when we've arrived or the timer expired
    if (!this.patrolTarget || this.patrolTimer <= 0) {
      const angle  = Math.random() * Math.PI * 2;
      const dist   = 60 + Math.random() * this._patrolRadius;
      const tx     = this._homeX + Math.cos(angle) * dist;
      const ty     = this._homeY + Math.sin(angle) * dist;

      if (scene.isWalkable(tx, ty)) {
        this.patrolTarget = { x: tx, y: ty };
      } else {
        this.patrolTarget = null;
      }
      this.patrolTimer = 2000 + Math.random() * 3500; // 2–5.5 s per waypoint
    }

    if (!this.patrolTarget) return;

    const dx   = this.patrolTarget.x - this.x;
    const dy   = this.patrolTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 6) {
      // Arrived — stop animation and wait
      this.patrolTarget = null;
      if (this._isRealSprite && this.anims) {
        this.anims.stop();
        this.setFrame(`${this._animKey}_walk_right_0`);
      }
      return;
    }

    // Step toward target
    const speed = this.patrolSpeed * (delta / 1000);
    const newX  = this.x + (dx / dist) * speed;
    const newY  = this.y + (dy / dist) * speed;

    if (!scene.isWalkable(newX, newY)) {
      // Hit a wall — abandon waypoint
      this.patrolTarget = null;
      if (this._isRealSprite && this.anims) {
        this.anims.stop();
        this.setFrame(`${this._animKey}_walk_right_0`);
      }
      return;
    }

    // Move
    this.x = newX;
    this.y = newY;

    // Keep promptText above head
    this.promptText.x = this.x;
    this.promptText.y = this.y - 70;

    // Choose animation based on dominant movement direction
    if (this._isRealSprite && this.anims) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        // Horizontal movement
        const animKey = dx > 0
          ? `${this._animKey}_walk_right`
          : `${this._animKey}_walk_left`;
        if (this.anims.currentAnim?.key !== animKey) this.play(animKey, true);
      } else {
        // Vertical movement
        const animKey = dy < 0
          ? `${this._animKey}_walk_up`
          : `${this._animKey}_walk_right`; // no walk_down — use walk_right (facing viewer)
        if (this.anims.currentAnim?.key !== animKey) this.play(animKey, true);
      }
    }
  }

  showPrompt(visible) {
    if (visible) {
      if (this.isSleeping) {
        this.promptText.setText('Zzz...');
        this.promptText.setStyle({ backgroundColor: '#8f9091', fill: '#ffffff' });
      } else {
        this.promptText.setText('Press E');
        this.promptText.setStyle({ backgroundColor: '#66fcf1', fill: '#0b0c10' });
      }
      this.promptText.setAlpha(1);
    } else {
      this.promptText.setAlpha(0);
    }
  }

  destroy(fromScene) {
    // Prevent memory leaks by cleaning up the hover text object
    if (this.promptText) {
      this.promptText.destroy();
    }
    super.destroy(fromScene);
  }
}
