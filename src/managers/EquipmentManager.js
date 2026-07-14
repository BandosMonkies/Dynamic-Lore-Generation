export default class EquipmentManager {
  constructor(game) {
    this.game = game;
    // Store equipment dynamically by characterId
    this.equipment = {
      jin_taira: { weapon: null, armor: null, accessory: null },
      lady_yuka: { weapon: null, armor: null, accessory: null },
      monk_daiki: { weapon: null, armor: null, accessory: null },
      blacksmith_nobu: { weapon: null, armor: null, accessory: null },
      gwan_sik: { weapon: null, armor: null, accessory: null },
      yoshi: { weapon: null, armor: null, accessory: null }
    };
  }

  equip(characterId, slotName, item) {
    if (!this.equipment[characterId]) {
      this.equipment[characterId] = { weapon: null, armor: null, accessory: null };
    }

    const oldItem = this.equipment[characterId][slotName];
    
    // Set item owner and place in slot
    item.owner = characterId;
    this.equipment[characterId][slotName] = item;

    // Recalculate stats for the character
    this.updateStats(characterId);

    return oldItem; // Return old item for inventory recovery
  }

  unequip(characterId, slotName) {
    if (!this.equipment[characterId]) return null;

    const item = this.equipment[characterId][slotName];
    if (item) {
      delete item.owner;
      this.equipment[characterId][slotName] = null;
      this.updateStats(characterId);
    }
    return item;
  }

  getEquipped(characterId, slotName) {
    if (!this.equipment[characterId]) return null;
    return this.equipment[characterId][slotName];
  }

  updateStats(characterId) {
    if (characterId === "jin_taira" && this.game.playerStats) {
      const baseStats = { maxHp: 100, atk: 10, def: 5 };
      let addHp = 0;
      let addAtk = 0;
      let addDef = 0;

      const itemsData = (this.game.inventoryManager && this.game.inventoryManager.itemsData) || {};
      const charEquip = this.equipment[characterId];

      for (const slot in charEquip) {
        const item = charEquip[slot];
        if (item) {
          const itemInfo = itemsData[item.id];
          if (itemInfo && itemInfo.stats) {
            addHp += itemInfo.stats.hp || 0;
            addAtk += itemInfo.stats.atk || 0;
            addDef += itemInfo.stats.def || 0;
          }
        }
      }

      this.game.playerStats.maxHp = baseStats.maxHp + addHp;
      this.game.playerStats.atk = baseStats.atk + addAtk;
      this.game.playerStats.def = baseStats.def + addDef;
      this.game.playerStats.hp = Math.min(this.game.playerStats.hp, this.game.playerStats.maxHp);
    }
  }
}
