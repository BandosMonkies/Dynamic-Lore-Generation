import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    // Start facing left or right (let's default to right)
    super(scene, x, y, 'samurai', 'walk_right_0');

    // Add player to the scene and enable scene updates
    scene.add.existing(this);

    // Set scale to fit the map proportions (samurai.png is large, scale to 0.4)
    this.setScale(0.3);

    // Set origin to the feet (bottom center) for accurate collisions and Y-sorting
    this.setOrigin(0.5, 0.95);

    // Speed in pixels per second
    this.speed = 180;

    // Track movement direction
    this.lastDirection = 'right';

    // Setup controls (Arrow keys + WASD)
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Initialize/Link global persistent stats
    if (!scene.game.playerStats) {
      scene.game.playerStats = {
        name: "Jin Taira",
        hp: 80, // Start at 80/100 to make the healing testable
        maxHp: 100,
        atk: 10,
        def: 5
      };
    }
    this.stats = scene.game.playerStats;

    // Invincibility parameters
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // Combat locks
    this.isAttacking = false;
  }

  attack() {
    if (this.isAttacking) return;

    const dialogueActive = this.scene.dialogueManager && this.scene.dialogueManager.isDialogueActive;
    const questLogActive = this.scene.game.questManager && this.scene.game.questManager.isLogActive;
    const inventoryActive = this.scene.game.inventoryManager && this.scene.game.inventoryManager.isInventoryActive;
    const shopActive = this.scene.game.shopManager && this.scene.game.shopManager.isShopActive;
    const choiceActive = this.scene.choiceOverlay && this.scene.choiceOverlay.classList.contains('choice-visible');

    if (dialogueActive || questLogActive || inventoryActive || shopActive || choiceActive) return;

    this.isAttacking = true;
    this.anims.stop();

    // Trigger Combat execution
    if (this.scene.game.combatManager && this.scene.enemyManager) {
      const targets = this.scene.enemyManager.enemiesGroup.getChildren();
      this.scene.game.combatManager.executeAttack(this, targets, this.lastDirection);
    }

    // Cooldown/duration lock
    this.scene.time.delayedCall(220, () => {
      this.isAttacking = false;
    });
  }

  update(time, delta) {
    // Manage invincibility frames flashing
    if (this.isInvincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1.0);
      } else {
        this.setAlpha(Math.floor(time / 50) % 2 === 0 ? 0.3 : 0.8);
      }
    }

    // Freeze inputs during attack execution
    if (this.isAttacking) {
      return;
    }

    // If dialogue is active, quest log is open, or inventory is active, freeze inputs
    const dialogueActive = this.scene.dialogueManager && this.scene.dialogueManager.isDialogueActive;
    const questLogActive = this.scene.game.questManager && this.scene.game.questManager.isLogActive;
    const inventoryActive = this.scene.game.inventoryManager && this.scene.game.inventoryManager.isInventoryActive;
    const shopActive = this.scene.game.shopManager && this.scene.game.shopManager.isShopActive;
    const choiceActive = this.scene.choiceOverlay && this.scene.choiceOverlay.classList.contains('choice-visible');

    if (dialogueActive || questLogActive || inventoryActive || shopActive || choiceActive) {
      this.anims.stop();
      if (this.lastDirection === 'left') {
        this.setFrame('walk_left_0');
      } else if (this.lastDirection === 'right') {
        this.setFrame('walk_right_0');
      } else if (this.lastDirection === 'up') {
        this.setFrame('walk_up_0');
      }
      return;
    }

    let vx = 0;
    let vy = 0;

    // Read input vectors
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx = 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vy = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vy = 1;
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const moveStep = this.speed * (delta / 1000);
    const dx = vx * moveStep;
    const dy = vy * moveStep;

    let isMoving = (vx !== 0 || vy !== 0);

    if (isMoving) {
      // 1. Resolve X movement with collision check
      const nextX = this.x + dx;
      if (this.scene.isFeetWalkable(nextX, this.y)) {
        this.x = nextX;
      }

      // 2. Resolve Y movement with collision check
      const nextY = this.y + dy;
      if (this.scene.isFeetWalkable(this.x, nextY)) {
        this.y = nextY;
      }

      // Determine movement direction for animations
      if (vx < 0) {
        this.lastDirection = 'left';
        this.anims.play('walk_left', true);
      } else if (vx > 0) {
        this.lastDirection = 'right';
        this.anims.play('walk_right', true);
      } else if (vy < 0) {
        this.lastDirection = 'up';
        this.anims.play('walk_up', true);
      } else if (vy > 0) {
        // Option A: Use Left/Right walking animation when moving down
        // Default to last side direction, or 'right' if none
        if (this.lastDirection !== 'left' && this.lastDirection !== 'right') {
          this.lastDirection = 'right';
        }
        this.anims.play(this.lastDirection === 'left' ? 'walk_left' : 'walk_right', true);
      }
    } else {
      // Idle state: stop animation on frame 0 of the last direction
      this.anims.stop();
      if (this.lastDirection === 'left') {
        this.setFrame('walk_left_0');
      } else if (this.lastDirection === 'right') {
        this.setFrame('walk_right_0');
      } else if (this.lastDirection === 'up') {
        this.setFrame('walk_up_0');
      }
    }
  }
}
