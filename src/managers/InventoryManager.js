import { itemsData } from '../data/items.js';

export default class InventoryManager {
  constructor(game) {
    this.game = game;
    this.itemsData = itemsData;

    // Fixed capacity: 16 inventory slots
    this.slots = Array(16).fill(null); 
    this.gold = 100;

    // Populate starting items for testing Subsystem 1: Item Usage
    this.slots[0] = { id: "rice", quantity: 3 };
    this.slots[1] = { id: "potion", quantity: 2 };
    this.slots[2] = { id: "katana", quantity: 1 };
    this.slots[3] = { id: "iron_ore", quantity: 5 };

    // UI DOM bindings
    this.overlay = null;
    this.gridElement = null;
    this.detailsElement = null;
    this.goldAmountElement = null;
    this.closeBtn = null;

    // States
    this.isInventoryActive = false;
    this.selectedSlotIndex = null;
  }

  init() {
    // Bind UI elements
    this.overlay = document.getElementById('inventory-overlay');
    this.gridElement = document.getElementById('inventory-grid');
    this.detailsElement = document.getElementById('inventory-details');
    this.goldAmountElement = document.getElementById('inventory-gold-amount');
    this.closeBtn = document.getElementById('inventory-close-btn');

    if (this.closeBtn) {
      this.closeBtn.onclick = () => this.toggleInventory(false);
    }

    // Bind click listeners to equipment slot UI boxes to allow unequipping
    const slots = ['weapon', 'armor', 'accessory'];
    slots.forEach(slotName => {
      const slotBox = document.getElementById(`equip-slot-${slotName}`);
      if (slotBox) {
        slotBox.onclick = () => {
          this.unequipItem(slotName);
        };
      }
    });

    // Initial render
    this.renderInventory();
  }

  addItem(itemId, quantity = 1) {
    const itemInfo = this.itemsData[itemId];
    if (!itemInfo) {
      return false;
    }

    let remainingQty = quantity;

    // 1. First fit: try stacking on existing slots if stackable
    if (itemInfo.stackable) {
      for (let i = 0; i < 16; i++) {
        const slot = this.slots[i];
        if (slot && slot.id === itemId && slot.quantity < itemInfo.maxStack) {
          const addAmt = Math.min(remainingQty, itemInfo.maxStack - slot.quantity);
          slot.quantity += addAmt;
          remainingQty -= addAmt;
          
          if (remainingQty <= 0) {
            this.renderInventory();
            return true;
          }
        }
      }
    }

    // 2. Second fit: put in new empty slots
    while (remainingQty > 0) {
      const emptyIndex = this.slots.findIndex(s => s === null);
      if (emptyIndex === -1) {
        // Inventory is full
        this.renderInventory();
        return false;
      }

      const stackQty = itemInfo.stackable ? Math.min(remainingQty, itemInfo.maxStack) : 1;
      this.slots[emptyIndex] = {
        id: itemId,
        quantity: stackQty
      };
      remainingQty -= stackQty;
    }

    this.renderInventory();
    return true;
  }

  removeItem(itemId, quantity = 1) {
    let remainingToDeduct = quantity;

    // Deduct starting from last slot to first
    for (let i = 15; i >= 0; i--) {
      const slot = this.slots[i];
      if (slot && slot.id === itemId) {
        if (slot.quantity > remainingToDeduct) {
          slot.quantity -= remainingToDeduct;
          remainingToDeduct = 0;
          break;
        } else {
          remainingToDeduct -= slot.quantity;
          this.slots[i] = null; // empty slot
        }
      }
    }

    // If we cleared the slot the player was inspecting, deselect it
    if (this.selectedSlotIndex !== null && this.slots[this.selectedSlotIndex] === null) {
      this.selectedSlotIndex = null;
    }

    this.renderInventory();
    return remainingToDeduct === 0;
  }

  hasItem(itemId, quantity = 1) {
    return this.getQuantity(itemId) >= quantity;
  }

  getQuantity(itemId) {
    return this.slots.reduce((total, slot) => {
      if (slot && slot.id === itemId) {
        return total + slot.quantity;
      }
      return total;
    }, 0);
  }

  addGold(amount) {
    this.gold += amount;
    this.renderInventory();
  }

  removeGold(amount) {
    this.gold = Math.max(0, this.gold - amount);
    this.renderInventory();
  }

  toggleInventory(visible) {
    this.isInventoryActive = (visible !== undefined) ? visible : !this.isInventoryActive;
    
    if (this.overlay) {
      this.overlay.className = this.isInventoryActive ? 'inventory-visible' : 'inventory-hidden';
    }

    if (this.isInventoryActive) {
      this.renderInventory();
    }
  }

  selectSlot(index) {
    this.selectedSlotIndex = index;
    this.renderInventory();
  }

  renderInventory() {
    if (!this.gridElement) return;
    this.gridElement.innerHTML = '';

    // Render slots grid
    for (let i = 0; i < 16; i++) {
      const slot = this.slots[i];
      const slotDiv = document.createElement('div');
      slotDiv.className = 'inventory-slot';
      
      if (i === this.selectedSlotIndex) {
        slotDiv.classList.add('active-slot');
      }

      slotDiv.onclick = () => this.selectSlot(i);

      if (slot) {
        // Render dynamic Phaser canvas texture representation
        const canvas = document.createElement('canvas');
        canvas.className = 'slot-canvas';
        canvas.width = 32;
        canvas.height = 32;
        slotDiv.appendChild(canvas);

        const itemInfo = this.itemsData[slot.id];
        if (itemInfo && this.game.textures.exists(itemInfo.iconKey)) {
          const ctx = canvas.getContext('2d');
          const sourceImage = this.game.textures.get(itemInfo.iconKey).getSourceImage();
          ctx.drawImage(sourceImage, 0, 0, 32, 32);
        }

        // Render quantity counts if > 1
        if (slot.quantity > 1) {
          const qtySpan = document.createElement('span');
          qtySpan.className = 'slot-qty';
          qtySpan.textContent = slot.quantity;
          slotDiv.appendChild(qtySpan);
        }
      }

      this.gridElement.appendChild(slotDiv);
    }

    // Update Currency Display
    if (this.goldAmountElement) {
      this.goldAmountElement.textContent = this.gold;
    }

    // Render Side Details
    this.renderDetails();

    // Render Equipment Slots & Stats
    this.renderEquipment();
  }

  renderDetails() {
    if (!this.detailsElement) return;

    const slot = (this.selectedSlotIndex !== null) ? this.slots[this.selectedSlotIndex] : null;

    if (!slot) {
      this.detailsElement.innerHTML = `<p class="empty-inventory-msg">Select an item to view details</p>`;
    } else {
      const itemInfo = this.itemsData[slot.id];
      if (!itemInfo) return;

      const canUse = itemInfo.consumable || itemInfo.equipSlot;
      const buttonLabel = itemInfo.consumable ? 'Use Item' : (itemInfo.equipSlot ? 'Equip Gear' : 'Cannot Use');

      this.detailsElement.innerHTML = `
        <h3 class="item-detail-title">${itemInfo.name}</h3>
        <div class="item-detail-rarity ${itemInfo.rarity}-rarity">${itemInfo.rarity}</div>
        <p class="item-detail-desc">${itemInfo.description}</p>
        
        <div class="item-detail-meta">
          <div class="meta-section">
            <h4>Category</h4>
            <p>${itemInfo.category}</p>
          </div>
          <div class="meta-section">
            <h4>Value</h4>
            <p>${itemInfo.value} Gold</p>
          </div>
          <div class="meta-section">
            <h4>Stack Limit</h4>
            <p>${slot.quantity} / ${itemInfo.stackable ? itemInfo.maxStack : 1}</p>
          </div>
        </div>

        <div class="item-detail-actions" style="margin-top: 20px;">
          <button id="inventory-use-btn" class="item-use-btn ${canUse ? '' : 'disabled-btn'}" ${canUse ? '' : 'disabled'}>
            ${buttonLabel}
          </button>
        </div>
      `;

      // Bind action button
      const useBtn = this.detailsElement.querySelector('#inventory-use-btn');
      if (useBtn) {
        if (itemInfo.consumable) {
          useBtn.onclick = (e) => {
            e.stopPropagation();
            this.useItem(slot.id, this.selectedSlotIndex);
          };
        } else if (itemInfo.equipSlot) {
          useBtn.onclick = (e) => {
            e.stopPropagation();
            this.equipItem(slot.id, this.selectedSlotIndex);
          };
        }
      }
    }
  }

  equipItem(itemId, index) {
    const slotItemObj = this.slots[index];
    if (!slotItemObj || slotItemObj.id !== itemId) return;

    const itemInfo = this.itemsData[itemId];
    if (!itemInfo || !itemInfo.equipSlot) return;

    if (!this.game.equipmentManager) {
      return;
    }

    // Perform equip swap in character ID jin_taira
    const oldItemObj = this.game.equipmentManager.equip("jin_taira", itemInfo.equipSlot, slotItemObj);

    // Place the swapped-out item back or nullify slot
    this.slots[index] = oldItemObj;
    this.selectedSlotIndex = null;

    this.showNotification("Equipment", `Equipped ${itemInfo.name}.`);
    this.renderInventory();
  }

  unequipItem(slotName) {
    if (!this.game.equipmentManager) return;

    const equippedItem = this.game.equipmentManager.getEquipped("jin_taira", slotName);
    if (!equippedItem) return;

    // Check inventory capacity
    const emptyIndex = this.slots.findIndex(s => s === null);
    if (emptyIndex === -1) {
      this.showNotification("Error", "Inventory full! Cannot unequip.");
      return;
    }

    const item = this.game.equipmentManager.unequip("jin_taira", slotName);
    if (item) {
      this.slots[emptyIndex] = item;
      this.selectedSlotIndex = null;

      const itemInfo = this.itemsData[item.id];
      const name = itemInfo ? itemInfo.name : item.id;
      this.showNotification("Equipment", `Unequipped ${name}.`);
      this.renderInventory();
    }
  }

  renderEquipment() {
    if (!this.game.equipmentManager) return;

    const slots = ['weapon', 'armor', 'accessory'];
    slots.forEach(slotName => {
      const itemElement = document.getElementById(`equip-item-${slotName}`);
      const slotBox = document.getElementById(`equip-slot-${slotName}`);
      if (itemElement) {
        const itemObj = this.game.equipmentManager.getEquipped("jin_taira", slotName);
        if (itemObj) {
          const itemInfo = this.itemsData[itemObj.id];
          itemElement.textContent = itemInfo ? itemInfo.name : itemObj.id;
          itemElement.className = "equip-slot-item";
          if (slotBox) slotBox.classList.add("active-equip-slot");
        } else {
          itemElement.textContent = "Empty";
          itemElement.className = "equip-slot-item empty-slot";
          if (slotBox) slotBox.classList.remove("active-equip-slot");
        }
      }
    });

    // Render stats HUD in panel
    if (this.game.playerStats) {
      const hpVal = document.getElementById('stat-val-hp');
      const atkVal = document.getElementById('stat-val-atk');
      const defVal = document.getElementById('stat-val-def');

      if (hpVal) hpVal.textContent = `${this.game.playerStats.hp} / ${this.game.playerStats.maxHp}`;
      if (atkVal) atkVal.textContent = this.game.playerStats.atk;
      if (defVal) defVal.textContent = this.game.playerStats.def;
    }
  }

  useItem(itemId, index) {
    const slot = this.slots[index];
    if (!slot || slot.id !== itemId) return;

    const itemInfo = this.itemsData[itemId];
    if (!itemInfo || !itemInfo.consumable) {
      this.showNotification("Error", "This item cannot be consumed.");
      return;
    }

    // Initialize stats if not present
    if (!this.game.playerStats) {
      this.game.playerStats = {
        hp: 80,
        maxHp: 100,
        atk: 10,
        def: 5
      };
    }

    const stats = this.game.playerStats;

    // Apply effects
    let used = false;
    if (itemInfo.effects) {
      if (itemInfo.effects.hp) {
        if (stats.hp >= stats.maxHp) {
          this.showNotification("Inventory", "Your health is already full!");
          return;
        }
        const oldHp = stats.hp;
        stats.hp = Math.min(stats.maxHp, stats.hp + itemInfo.effects.hp);
        const restored = stats.hp - oldHp;
        this.showNotification("Item Used", `Consumed ${itemInfo.name}. Restored ${restored} HP (Health: ${stats.hp}/${stats.maxHp}).`);
        used = true;
      }
    }

    if (used) {
      // Remove item
      slot.quantity--;
      if (slot.quantity <= 0) {
        this.slots[index] = null;
        this.selectedSlotIndex = null;
      }
      this.renderInventory();
    }
  }

  showNotification(title, message) {
    if (this.game.questManager) {
      this.game.questManager.showNotification(title, message);
    }
    // Silent fallback when questManager not ready
  }
}
