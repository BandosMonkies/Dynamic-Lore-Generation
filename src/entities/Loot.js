import Phaser from 'phaser';

export default class Loot extends Phaser.GameObjects.Sprite {
  /**
   * Represents a physical loot drop on the ground.
   * @param {Phaser.Scene} scene - The active scene.
   * @param {number} x - Spawn X.
   * @param {number} y - Spawn Y.
   * @param {number} gold - Gold amount.
   * @param {Array} items - List of item drops: [{ id: 'potion', quantity: 1 }].
   */
  constructor(scene, x, y, gold = 0, items = []) {
    super(scene, x, y, 'loot_bag');

    this.scene = scene;
    this.gold = gold;
    this.items = items;

    // Add to scene
    scene.add.existing(this);
    this.setDepth(y);
    this.setScale(0.8);

    // Bounce-in animation on spawn
    this.y -= 15;
    scene.tweens.add({
      targets: this,
      y: y,
      scaleX: { start: 0.2, to: 0.8 },
      scaleY: { start: 0.2, to: 0.8 },
      ease: 'Bounce.easeOut',
      duration: 500
    });

    // Make it rotate gently to stand out
    scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: 'Sine.easeInOut'
    });

    // Magnet/Full check parameters
    this.pickupCooldown = 0;
  }

  update(player) {
    if (!player) return;

    // Check if on pickup cooldown
    if (this.pickupCooldown && this.scene.time.now < this.pickupCooldown) {
      return;
    }

    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

    // Magnetic pull when player is within 90 pixels
    if (dist < 90) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const pullSpeed = 200; // pixels per second
      const dt = this.scene.sys.game.loop.delta / 1000;
      const step = pullSpeed * dt;
      this.x += Math.cos(angle) * step;
      this.y += Math.sin(angle) * step;
      this.setDepth(this.y);
    }

    // Proximity check for pickup (within 20 pixels when pulling)
    const pickupDist = dist < 90 ? 20 : 30;
    if (dist < pickupDist) {
      this.collect();
    }
  }

  collect() {
    const inventory = this.scene.game.inventoryManager;
    if (!inventory) {
      this.destroy();
      return;
    }

    let collectedText = [];
    const remainingItems = [];
    const successfullyCollectedItems = [];

    // Grant gold (always fits)
    if (this.gold > 0) {
      inventory.addGold(this.gold);
      collectedText.push(`+${this.gold} Gold`);
      this.gold = 0; // consumed
    }

    // Try to grant items individually
    if (this.items && this.items.length > 0) {
      this.items.forEach(item => {
        const added = inventory.addItem(item.id, item.quantity);
        if (added) {
          const itemInfo = inventory.itemsData[item.id];
          const name = itemInfo ? itemInfo.name : item.id;
          collectedText.push(`+${item.quantity}x ${name}`);
          successfullyCollectedItems.push(item);
        } else {
          remainingItems.push(item);
        }
      });
    }

    // Show floating feedback text for whatever was collected
    if (collectedText.length > 0) {
      this.showFloatingText(collectedText.join('\n'));
      
      // Emit event
      this.scene.game.events.emit('loot-collected', {
        gold: this.gold,
        items: successfullyCollectedItems
      });
    }

    // Handle full-inventory leftovers
    if (remainingItems.length > 0) {
      this.items = remainingItems;
      this.pickupCooldown = this.scene.time.now + 2000; // 2-second pickup cooldown
      this.scene.game.questManager.showNotification("Inventory Full", "Some items could not fit!");
      
      // Visual bounce away to show it wasn't picked up
      this.scene.tweens.add({
        targets: this,
        y: this.y - 12,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    } else {
      // All items picked up successfully
      this.destroy();
    }
  }

  showFloatingText(text) {
    const txt = this.scene.add.text(this.x, this.y - 20, text, {
      font: 'bold 11px Outfit',
      fill: '#f1c40f', // gold color
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(2000);

    this.scene.tweens.add({
      targets: txt,
      y: this.y - 60,
      alpha: { start: 1, to: 0 },
      duration: 1500,
      onComplete: () => txt.destroy()
    });
  }
}
