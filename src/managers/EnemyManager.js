import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import Loot from '../entities/Loot.js';
import { enemyTypes, sceneEnemySpawns } from '../data/enemies.js';

export default class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.game = scene.game;

    this.enemiesGroup = scene.add.group();
    this.lootList = [];

    // Register defeat event handler
    this.scene.events.on('enemy-defeated', this.handleEnemyDefeated, this);
  }

  spawnSceneEnemies() {
    const sceneKey = this.scene.sceneKey;
    const spawns = sceneEnemySpawns[sceneKey];
    if (!spawns) return;

    spawns.forEach((spawn, idx) => {
      const typeConfig = enemyTypes[spawn.type];
      if (!typeConfig) return;

      // Unique identifier per enemy in active scene instance
      const enemyId = `${sceneKey}_${spawn.type}_${idx}`;
      
      const config = {
        ...typeConfig,
        id: enemyId
      };

      // Spawning snaps coordinates to walkable bounds automatically
      const snapped = this.scene.getNearestWalkable(spawn.x, spawn.y);
      const enemy = new Enemy(this.scene, snapped.x, snapped.y, config);
      this.enemiesGroup.add(enemy);
    });
  }

  update(time, delta, player) {
    if (!player) return;

    // 1. Update all alive enemies
    this.enemiesGroup.getChildren().forEach(enemy => {
      if (enemy.active) {
        enemy.update(time, delta, player);
      }
    });

    // 2. Update all active loot items to check proximity/pickup
    // Iterate backwards so we can safely remove picked up items
    for (let i = this.lootList.length - 1; i >= 0; i--) {
      const loot = this.lootList[i];
      if (loot && loot.active) {
        loot.update(player);
      } else {
        this.lootList.splice(i, 1);
      }
    }
  }

  handleEnemyDefeated(enemy) {
    if (!enemy || !enemy.lootTable) return;

    const x = enemy.x;
    const y = enemy.y;

    // Roll Gold Drop
    let goldDropped = 0;
    if (enemy.lootTable.goldRange) {
      const [min, max] = enemy.lootTable.goldRange;
      goldDropped = Phaser.Math.RND.between(min, max);
    }

    // Roll Item Drops
    const itemsDropped = [];
    if (enemy.lootTable.drops) {
      enemy.lootTable.drops.forEach(drop => {
        const roll = Phaser.Math.RND.frac();
        if (roll <= drop.chance) {
          itemsDropped.push({
            id: drop.id,
            quantity: 1
          });
        }
      });
    }

    // Spawn a ground Loot package if any gold or items were rolled
    if (goldDropped > 0 || itemsDropped.length > 0) {
      const loot = new Loot(this.scene, x, y, goldDropped, itemsDropped);
      this.lootList.push(loot);
    }
  }

  destroy() {
    // Unbind listeners
    this.scene.events.off('enemy-defeated', this.handleEnemyDefeated, this);

    // Let Phaser handle group destruction. Null the reference to prevent calls.
    this.enemiesGroup = null;
    this.lootList = [];
  }
}
