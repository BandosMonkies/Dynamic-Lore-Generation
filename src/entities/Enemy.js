import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
  /**
   * Represents an active Enemy entity.
   * @param {Phaser.Scene} scene - The BaseVillageScene.
   * @param {number} x - Spawn X coordinate.
   * @param {number} y - Spawn Y coordinate.
   * @param {object} config - Configuration details from enemies.js.
   */
  constructor(scene, x, y, config) {
    super(scene, x, y);

    this.scene = scene;
    this.id = config.id || `${config.type}_${Phaser.Math.RND.uuid()}`;
    this.name = config.name;
    this.type = config.type;
    this.level = config.level;
    this.maxHp = config.maxHp;
    this.hp = config.hp !== undefined ? config.hp : config.maxHp;
    this.stats = config.stats;
    this.movementSpeed = config.movementSpeed;
    this.detectionRadius = config.detectionRadius;
    this.attackRadius = config.attackRadius;
    this.lootTable = config.lootTable;

    // Home coordinate for return-to-patrol AI behavior
    this.homeX = x;
    this.homeY = y;

    // AI State
    this.aiState = 'idle'; // 'idle', 'patrol', 'chase', 'attack', 'dead'
    this.lastDirection = 'down';

    // AI timers
    this.patrolTargetX = x;
    this.patrolTargetY = y;
    this.patrolTimer = 0;
    this.attackCooldown = 0; // cooldown timestamp
    this.attackRate = 1200; // ms between attacks

    // Invincibility parameters
    this.isInvincible = false;
    this.invincibilityDuration = 250; // ms
    this.invincibilityTimer = 0;

    // Create Visual Components inside the container
    // 1. Sprite representation (drawn in BootScene)
    const textureKey = `enemy_${this.type}`;
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setOrigin(0.5, 0.95);
    this.add(this.sprite);

    // 2. Name & Level Overhead Text
    this.nameText = scene.add.text(0, -42, `${this.name} (Lv.${this.level})`, {
      font: 'bold 9px Outfit',
      fill: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);
    this.add(this.nameText);

    // 3. Health Bar Graphics
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    // Spawn to scene
    scene.add.existing(this);
    this.setDepth(y);
  }

  update(time, delta, player) {
    if (this.aiState === 'dead') return;

    // Depth sort dynamically
    this.setDepth(this.y);

    // Decrement timers
    if (this.isInvincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.sprite.setAlpha(1.0);
      } else {
        // Flash visual effect
        this.sprite.setAlpha(Math.floor(time / 50) % 2 === 0 ? 0.3 : 0.8);
      }
    }

    if (!player || player.stats.hp <= 0) {
      this.transitionTo('idle');
      this.stopMovement();
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // State Decision Engine
    if (dist <= this.attackRadius) {
      this.transitionTo('attack');
    } else if (dist <= this.detectionRadius) {
      this.transitionTo('chase');
    } else {
      if (this.aiState === 'chase' || this.aiState === 'attack') {
        this.transitionTo('patrol');
      }
    }

    // Execute state actions
    switch (this.aiState) {
      case 'idle':
        this.updateIdleState(time, delta);
        break;
      case 'patrol':
        this.updatePatrolState(time, delta);
        break;
      case 'chase':
        this.updateChaseState(time, delta, player);
        break;
      case 'attack':
        this.updateAttackState(time, delta, player);
        break;
    }
  }

  transitionTo(newState) {
    if (this.aiState === newState) return;
    this.aiState = newState;

    // Reset parameters on state entry
    if (newState === 'patrol') {
      this.patrolTimer = 0;
      this.patrolTargetX = this.homeX;
      this.patrolTargetY = this.homeY;
    }
  }

  stopMovement() {
    // Helper to stop movement
  }

  updateIdleState(time, delta) {
    // Occasionally transition to patrol automatically
    this.patrolTimer += delta;
    if (this.patrolTimer > 3000) {
      this.patrolTimer = 0;
      if (Phaser.Math.RND.frac() > 0.5) {
        this.transitionTo('patrol');
      }
    }
  }

  updatePatrolState(time, delta) {
    this.patrolTimer += delta;

    // Choose a new patrol point relative to home coordinate every 4 seconds
    if (this.patrolTimer > 4000) {
      this.patrolTimer = 0;
      const angle = Phaser.Math.RND.angle();
      const radius = Phaser.Math.RND.between(20, 80);
      this.patrolTargetX = this.homeX + Math.cos(angle) * radius;
      this.patrolTargetY = this.homeY + Math.sin(angle) * radius;
    }

    // Move towards patrol target
    const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.patrolTargetX, this.patrolTargetY);
    if (distToTarget > 10) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.patrolTargetX, this.patrolTargetY);
      this.moveTowards(angle, delta);
    } else {
      this.transitionTo('idle');
    }
  }

  updateChaseState(time, delta, player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.moveTowards(angle, delta);
  }

  updateAttackState(time, delta, player) {
    // Face the player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.updateFacingDirection(angle);

    // Check attack cooldown
    if (time >= this.attackCooldown) {
      this.attackCooldown = time + this.attackRate;
      this.executeMeleeAttack(player);
    }
  }

  moveTowards(angle, delta) {
    const speedMultiplier = this.aiState === 'chase' ? 1.0 : 0.6; // walk slower on patrol
    const step = this.movementSpeed * speedMultiplier * (delta / 1000);
    const dx = Math.cos(angle) * step;
    const dy = Math.sin(angle) * step;

    // Slide check collisions
    let nextX = this.x + dx;
    if (this.scene.isFeetWalkable(nextX, this.y)) {
      this.x = nextX;
    }

    let nextY = this.y + dy;
    if (this.scene.isFeetWalkable(this.x, nextY)) {
      this.y = nextY;
    }

    this.updateFacingDirection(angle);
  }

  updateFacingDirection(angle) {
    const deg = Phaser.Math.RadToDeg(angle);
    
    // Convert angle to cardinal direction
    if (deg >= -45 && deg < 45) {
      this.lastDirection = 'right';
      this.sprite.setScale(Math.abs(this.sprite.scaleX), this.sprite.scaleY); // face right
    } else if (deg >= 45 && deg < 135) {
      this.lastDirection = 'down';
    } else if (deg >= -135 && deg < -45) {
      this.lastDirection = 'up';
    } else {
      this.lastDirection = 'left';
      // If visual sprites are left/right, flip X.
      this.sprite.setScale(-Math.abs(this.sprite.scaleX), this.sprite.scaleY); // flip left
    }
  }

  executeMeleeAttack(player) {
    if (this.scene.game.combatManager) {
      // Trigger attack via combat manager
      this.scene.game.combatManager.executeAttack(this, [player], this.lastDirection);
    }
  }

  takeDamage(amount, isCritical = false) {
    if (this.aiState === 'dead') return;

    this.hp = Math.max(0, this.hp - amount);
    this.drawHpBar();

    // Trigger hit visual feedback
    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;

    // Solid red tint flash for feedback
    this.sprite.setTint(0xff3333);
    this.scene.time.delayedCall(120, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });

    // Show floating number
    this.showDamageNumber(amount, isCritical);

    // Check death state
    if (this.hp <= 0) {
      this.die();
    }
  }

  drawHpBar() {
    this.hpBar.clear();
    if (this.hp <= 0) return;

    const width = 28;
    const height = 4;
    const barX = -width / 2;
    const barY = -34;

    // Draw background (black)
    this.hpBar.fillStyle(0x000000, 0.7);
    this.hpBar.fillRect(barX, barY, width, height);

    // Draw life bar (green/red)
    const pct = this.hp / this.maxHp;
    const fillColor = pct > 0.4 ? 0x2ecc71 : 0xe74c3c;
    this.hpBar.fillStyle(fillColor, 1.0);
    this.hpBar.fillRect(barX, barY, width * pct, height);
  }

  showDamageNumber(amount, isCritical = false) {
    const textStr = isCritical ? `CRIT -${amount}` : `-${amount}`;
    const fillStyle = isCritical ? '#f1c40f' : '#e74c3c'; // Yellow for crit, red for normal
    const fontStyle = isCritical ? 'bold 13px Outfit' : 'bold 11px Outfit';

    const text = this.scene.add.text(this.x, this.y - 35, textStr, {
      font: fontStyle,
      fill: fillStyle,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2000);

    this.scene.tweens.add({
      targets: text,
      y: this.y - 65,
      alpha: { start: 1, to: 0 },
      duration: isCritical ? 1300 : 1000,
      onComplete: () => text.destroy()
    });
  }

  die() {
    this.transitionTo('dead');
    this.hpBar.clear();
    this.nameText.destroy();
    
    // Play fall/sink and fade animation
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 90, // Fall over
      alpha: { start: 1, to: 0 },
      scaleY: 0.1,
      y: 10,
      duration: 500,
      onComplete: () => {
        // Emit events so managers react
        this.scene.events.emit('enemy-defeated', this);
        this.destroy();
      }
    });
  }
}
