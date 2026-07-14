import Phaser from 'phaser';

export default class SaveManager {
  /**
   * Serializes current game parameters to browser localStorage.
   * @param {Phaser.Game} game - The global game instance.
   * @param {string} sceneKey - Current village scene key.
   * @param {number} x - Player's X coordinate.
   * @param {number} y - Player's Y coordinate.
   */
  static saveGame(game, sceneKey, x, y) {
    if (!game) return false;

    try {
      const saveData = {
        saveVersion: "1.0.0",
        player: {
          x: x,
          y: y,
          sceneKey: sceneKey,
          stats: game.playerStats || { hp: 100, maxHp: 100, atk: 10, def: 5 }
        },
        world: {
          day: game.worldManager ? game.worldManager.day : 1,
          hour: game.worldManager ? game.worldManager.hour : 8,
          minute: game.worldManager ? game.worldManager.minute : 0,
          weather: game.worldManager ? game.worldManager.weather : 'clear'
        },
        inventory: {
          gold: game.inventoryManager ? game.inventoryManager.gold : 100,
          slots: game.inventoryManager ? game.inventoryManager.slots : []
        },
        equipment: game.equipmentManager ? game.equipmentManager.equipment : {},
        clan: game.clanManager ? game.clanManager.recruitedHeroes : [],
        quests: game.questManager ? game.questManager.quests : [],
        npcScheduleState: {}, // future-ready NPC memory placeholder
        enemyState: {},       // future-ready enemy state placeholder
        lootState: {}         // future-ready loot state placeholder
      };

      localStorage.setItem('three_villages_save', JSON.stringify(saveData));
      
      // Emit event
      game.events.emit('game-saved');
      
      if (game.questManager) {
        game.questManager.showNotification("System", "Game saved successfully!");
      }
      return true;
    } catch (err) {
      console.error("[SaveManager] Save failed:", err);
      return false;
    }
  }

  /**
   * Restores game parameters from localStorage and triggers scene starts.
   * @param {Phaser.Game} game - The global game instance.
   * @param {Phaser.Scene} activeScene - The active scene trigger.
   */
  static loadGame(game, activeScene) {
    if (!game) return null;

    try {
      const dataStr = localStorage.getItem('three_villages_save');
      if (!dataStr) {
        if (game.questManager) {
          game.questManager.showNotification("System", "No save file found.");
        }
        return null;
      }

      const saveData = JSON.parse(dataStr);

      // 1. Restore Player stats
      if (saveData.player && saveData.player.stats) {
        game.playerStats = saveData.player.stats;
      }

      // 2. Restore World Clock
      if (saveData.world && game.worldManager) {
        game.worldManager.setTime(saveData.world.day, saveData.world.hour, saveData.world.minute);
        game.worldManager.setWeather(saveData.world.weather);
      }

      // 3. Restore Inventory & gold
      if (saveData.inventory && game.inventoryManager) {
        game.inventoryManager.gold = saveData.inventory.gold;
        game.inventoryManager.slots = saveData.inventory.slots;
        game.inventoryManager.renderInventory();
      }

      // 4. Restore Equipment
      if (saveData.equipment && game.equipmentManager) {
        game.equipmentManager.equipment = saveData.equipment;
        if (game.inventoryManager) {
          game.inventoryManager.renderEquipment(); 
        }
      }

      // 5. Restore Clan recruitment companions
      if (saveData.clan && game.clanManager) {
        game.clanManager.recruitedHeroes = saveData.clan;
      }

      // 6. Restore Quests data
      if (saveData.quests && game.questManager) {
        game.questManager.quests = saveData.quests;
        game.questManager.renderQuestLog();
      }

      // Emit loaded event
      game.events.emit('game-loaded', saveData);

      // 7. Relocate player to active scene
      if (activeScene && saveData.player && saveData.player.sceneKey) {
        activeScene.cameras.main.fadeOut(500, 0, 0, 0);
        activeScene.cameras.main.once('camerafadeoutcomplete', () => {
          activeScene.scene.start(saveData.player.sceneKey, {
            spawnX: saveData.player.x,
            spawnY: saveData.player.y
          });
        });
      }

      if (game.questManager) {
        game.questManager.showNotification("System", "Game loaded successfully!");
      }
      return saveData;
    } catch (err) {
      console.error("[SaveManager] Load failed:", err);
      return null;
    }
  }

  /**
   * Periodic auto-save execution.
   */
  static autoSave(game, sceneKey, x, y) {
    console.log("[SaveManager] Performing auto-save...");
    return this.saveGame(game, sceneKey, x, y);
  }
}
