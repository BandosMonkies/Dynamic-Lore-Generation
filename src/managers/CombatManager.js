import Phaser from 'phaser';
import AttackEffectManager from './AttackEffectManager.js';

export default class CombatManager {
  constructor(game) {
    this.game = game;
  }

  /**
   * Performs an attack in the specified direction.
   * @param {object} attacker - The attacking entity (Player or Enemy).
   * @param {Array} targets - Potential targets array.
   * @param {string} direction - 'left', 'right', 'up', 'down'.
   */
  executeAttack(attacker, targets, direction) {
    if (!attacker || attacker.scene.transitioning) return;

    // 1. Determine attack visual type
    let effectType = 'sword_slash';
    let attackRange = 50;
    let hitboxWidth = 60;
    let hitboxHeight = 40;

    if (attacker === attacker.scene.player) {
      // Check player weapon type from equipment manager
      const equipManager = this.game.equipmentManager;
      const weapon = equipManager ? equipManager.getEquipped('jin_taira', 'weapon') : null;
      
      if (weapon && this.game.inventoryManager) {
        const itemInfo = this.game.inventoryManager.itemsData[weapon.id];
        if (itemInfo) {
          if (itemInfo.category === 'weapons') effectType = 'sword_slash';
        }
      }
    } else {
      // Enemy attack types
      if (attacker.type === 'wolf') {
        effectType = 'sword_slash'; // claw swipe
        attackRange = 40;
        hitboxWidth = 45;
        hitboxHeight = 45;
      } else if (attacker.type === 'soldier') {
        effectType = 'spear_thrust';
        attackRange = 65;
        hitboxWidth = 75;
        hitboxHeight = 30;
      } else {
        effectType = 'sword_slash'; // bandit
        attackRange = 45;
        hitboxWidth = 50;
        hitboxHeight = 40;
      }
    }

    // 2. Play visual effect
    const scene = attacker.scene;
    // Set vertical offset slightly above feet for center of attack
    const attackerCenterY = attacker.y - 20; 
    AttackEffectManager.spawnEffect(scene, attacker.x, attacker.y, effectType, direction);

    // 3. Compute Hitbox Rect
    let rectX = attacker.x;
    let rectY = attackerCenterY;

    switch (direction) {
      case 'left':
        rectX = attacker.x - attackRange - hitboxWidth / 2;
        rectY = attackerCenterY - hitboxHeight / 2;
        break;
      case 'right':
        rectX = attacker.x + attackRange - hitboxWidth / 2;
        rectY = attackerCenterY - hitboxHeight / 2;
        break;
      case 'up':
        rectX = attacker.x - hitboxWidth / 2;
        rectY = attackerCenterY - attackRange - hitboxHeight / 2;
        break;
      case 'down':
        rectX = attacker.x - hitboxWidth / 2;
        rectY = attackerCenterY + attackRange - hitboxHeight / 2;
        break;
    }

    const hitbox = new Phaser.Geom.Rectangle(rectX, rectY, hitboxWidth, hitboxHeight);

    // Optional debug graphics toggle (uncomment to visualize hitboxes)
    /*
    const debugG = scene.add.graphics();
    debugG.lineStyle(1, 0xff0000, 1);
    debugG.strokeRectShape(hitbox);
    scene.time.delayedCall(150, () => debugG.destroy());
    */

    // 4. Overlap & Damage check
    targets.forEach(target => {
      // Validate target is alive and interactable
      if (!target || target.hp <= 0) return;
      if (target.isInvincible) return;

      // Construct simple rectangular bounding footprint of the target
      const targetBounds = new Phaser.Geom.Rectangle(
        target.x - 16,
        target.y - 35,
        32,
        40
      );

      if (Phaser.Geom.Rectangle.Overlaps(hitbox, targetBounds)) {
        this.processHit(attacker, target);
      }
    });
  }

  processHit(attacker, defender) {
    const isPlayerAttacking = (attacker === attacker.scene.player);

    let damage = 1;
    let isCritical = false;

    if (isPlayerAttacking) {
      // Player -> Enemy
      const playerAtk = this.game.playerStats.atk;
      const enemyDef = defender.stats.def;
      const baseDamage = Math.max(1, playerAtk - enemyDef);
      
      // 15% Critical hit chance
      if (Phaser.Math.RND.frac() <= 0.15) {
        isCritical = true;
        damage = Math.round(baseDamage * 1.5);
      } else {
        damage = baseDamage;
      }
      
      defender.takeDamage(damage, isCritical);

      // Flash camera slightly and shake if critical
      if (isCritical) {
        attacker.scene.cameras.main.shake(150, 0.007);
        // Greenish flash to indicate a clean critical strike
        attacker.scene.cameras.main.flash(100, 241, 196, 15, false); // subtle yellow gold flash
      } else {
        // Normal hit minor shake
        attacker.scene.cameras.main.shake(100, 0.002);
      }

      // Emit event
      this.game.events.emit('enemy-damaged', {
        attacker: attacker,
        target: defender,
        damage: damage,
        isCritical: isCritical
      });
    } else {
      // Enemy -> Player
      if (defender.isInvincible) return;

      const enemyAtk = attacker.stats.atk;
      const playerDef = this.game.playerStats.def;
      damage = Math.max(1, enemyAtk - playerDef);

      // Apply damage to Player
      defender.stats.hp = Math.max(0, defender.stats.hp - damage);
      
      // Update UI panels to keep stats in sync
      if (this.game.inventoryManager) {
        this.game.inventoryManager.renderInventory();
      }

      // Trigger player invincibility state
      defender.isInvincible = true;
      defender.invincibilityTimer = 800; // 0.8s invincibility frames

      // Visual flash and floating number
      this.showPlayerDamageFeedback(defender, damage);

      // Emit event
      this.game.events.emit('player-damaged', {
        attacker: attacker,
        target: defender,
        damage: damage
      });

      // Check death
      if (defender.stats.hp <= 0) {
        this.game.events.emit('player-defeated', defender);
      }
    }
  }

  showPlayerDamageFeedback(player, amount) {
    const scene = player.scene;

    // Flash player sprite red
    scene.tweens.add({
      targets: player,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        player.setAlpha(1.0);
      }
    });

    // Spawn red damage float text
    const text = scene.add.text(player.x, player.y - 45, `-${amount}`, {
      font: 'bold 13px Outfit',
      fill: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: player.y - 75,
      alpha: { start: 1, to: 0 },
      duration: 1000,
      onComplete: () => text.destroy()
    });

    // Make screen shake slightly
    scene.cameras.main.shake(150, 0.005);
  }
}
