import { shopsData } from '../data/shops.js';
import { itemsData } from '../data/items.js';

export default class ShopManager {
  constructor(game) {
    this.game = game;
    this.shopsData = JSON.parse(JSON.stringify(shopsData)); // copy starting values
    this.itemsData = itemsData;

    // UI Bindings
    this.overlay = null;
    this.buyGrid = null;
    this.sellGrid = null;
    this.detailsElement = null;
    this.goldAmountElement = null;
    this.closeBtn = null;
    this.titleElement = null;

    // States
    this.activeMerchantId = null;
    this.isShopActive = false;
    this.selectedItem = null; // { mode: 'buy'|'sell', id: string, index?: number }
  }

  init() {
    this.overlay = document.getElementById('shop-overlay');
    this.buyGrid = document.getElementById('shop-buy-grid');
    this.sellGrid = document.getElementById('shop-sell-grid');
    this.detailsElement = document.getElementById('shop-details');
    this.goldAmountElement = document.getElementById('shop-gold-amount');
    this.closeBtn = document.getElementById('shop-close-btn');
    this.titleElement = document.getElementById('shop-title');

    if (this.closeBtn) {
      this.closeBtn.onclick = () => this.toggleShop(false);
    }
  }

  toggleShop(visible, merchantId = null) {
    this.isShopActive = (visible !== undefined) ? visible : !this.isShopActive;
    
    if (this.isShopActive && merchantId) {
      // Look up merchant in active scene to verify sleep state
      const activeScene = this.game.scene.scenes.find(s => s.sys.isActive() && s.npcs);
      if (activeScene) {
        const npc = activeScene.npcs.getChildren().find(n => n.id === merchantId);
        if (npc && npc.isSleeping) {
          this.isShopActive = false;
          if (this.game.questManager) {
            this.game.questManager.showNotification("Shop", `${npc.name} is sleeping. Shop is closed.`);
          }
          return;
        }
      }

      this.activeMerchantId = merchantId;
      this.selectedItem = null;
      if (this.titleElement) {
        const npcs = this.game.npcsData || [];
        const merchantNpc = npcs.find(n => n.id === merchantId);
        this.titleElement.textContent = merchantNpc ? `${merchantNpc.name}'s Shop` : "Village Shop";
      }
    }

    if (this.overlay) {
      this.overlay.className = this.isShopActive ? 'shop-visible' : 'shop-hidden';
    }

    if (this.isShopActive) {
      this.renderShop();
    }
  }

  renderShop() {
    if (!this.buyGrid || !this.sellGrid || !this.activeMerchantId) return;

    const shop = this.shopsData[this.activeMerchantId];
    if (!shop) return;

    const inventoryManager = this.game.inventoryManager;
    if (!inventoryManager) return;

    // Render Gold
    if (this.goldAmountElement) {
      this.goldAmountElement.textContent = inventoryManager.gold;
    }

    // 1. Render Merchant stock items (BUY)
    this.buyGrid.innerHTML = '';
    shop.inventory.forEach(itemId => {
      const stockCount = shop.stock[itemId] !== undefined ? shop.stock[itemId] : 99;
      if (stockCount <= 0) return;

      const itemInfo = this.itemsData[itemId];
      if (!itemInfo) return;

      const slotDiv = document.createElement('div');
      slotDiv.className = 'shop-item-slot';
      if (this.selectedItem && this.selectedItem.mode === 'buy' && this.selectedItem.id === itemId) {
        slotDiv.classList.add('active-shop-item');
      }

      // Draw canvas thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      slotDiv.appendChild(canvas);

      if (this.game.textures.exists(itemInfo.iconKey)) {
        const ctx = canvas.getContext('2d');
        const srcImg = this.game.textures.get(itemInfo.iconKey).getSourceImage();
        ctx.drawImage(srcImg, 0, 0, 32, 32);
      }

      // Render stock count
      const stockSpan = document.createElement('span');
      stockSpan.className = 'slot-qty';
      stockSpan.textContent = `x${stockCount}`;
      slotDiv.appendChild(stockSpan);

      slotDiv.onclick = () => {
        this.selectedItem = { mode: 'buy', id: itemId };
        this.renderShop();
      };

      this.buyGrid.appendChild(slotDiv);
    });

    // 2. Render Player inventory items (SELL)
    this.sellGrid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const slot = inventoryManager.slots[i];
      const slotDiv = document.createElement('div');
      slotDiv.className = 'shop-item-slot';

      if (slot) {
        const itemInfo = this.itemsData[slot.id];
        if (this.selectedItem && this.selectedItem.mode === 'sell' && this.selectedItem.index === i) {
          slotDiv.classList.add('active-shop-item');
        }

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        slotDiv.appendChild(canvas);

        if (this.game.textures.exists(itemInfo.iconKey)) {
          const ctx = canvas.getContext('2d');
          const srcImg = this.game.textures.get(itemInfo.iconKey).getSourceImage();
          ctx.drawImage(srcImg, 0, 0, 32, 32);
        }

        if (slot.quantity > 1) {
          const qtySpan = document.createElement('span');
          qtySpan.className = 'slot-qty';
          qtySpan.textContent = slot.quantity;
          slotDiv.appendChild(qtySpan);
        }

        slotDiv.onclick = () => {
          this.selectedItem = { mode: 'sell', id: slot.id, index: i };
          this.renderShop();
        };
      }

      this.sellGrid.appendChild(slotDiv);
    }

    // 3. Render Details
    this.renderDetails();
  }

  renderDetails() {
    if (!this.detailsElement || !this.activeMerchantId) return;

    if (!this.selectedItem) {
      this.detailsElement.innerHTML = `<p class="empty-shop-msg">Select an item to trade</p>`;
      return;
    }

    const itemInfo = this.itemsData[this.selectedItem.id];
    if (!itemInfo) return;

    const shop = this.shopsData[this.activeMerchantId];
    const inventoryManager = this.game.inventoryManager;

    if (this.selectedItem.mode === 'buy') {
      const price = Math.round(itemInfo.value * shop.buyPriceMultiplier);
      const stock = shop.stock[this.selectedItem.id] || 0;
      const canAfford = inventoryManager.gold >= price;
      const hasRoom = inventoryManager.slots.some(s => s === null);
      const buyDisabled = !canAfford || !hasRoom || stock <= 0;

      this.detailsElement.innerHTML = `
        <h3 class="shop-detail-title">${itemInfo.name}</h3>
        <p class="shop-detail-desc">${itemInfo.description}</p>
        <div class="shop-detail-price">Cost: ${price} Gold</div>
        <p style="font-size: 11px; margin-bottom: 12px; color: #8f9091;">Stock: ${stock}</p>
        <button id="shop-action-btn" class="shop-action-btn" ${buyDisabled ? 'disabled' : ''}>Buy Item</button>
      `;

      const btn = document.getElementById('shop-action-btn');
      if (btn) {
        btn.onclick = () => this.buyItem(this.selectedItem.id, price);
      }
    } else {
      const price = Math.round(itemInfo.value * shop.sellPriceMultiplier);
      this.detailsElement.innerHTML = `
        <h3 class="shop-detail-title">${itemInfo.name}</h3>
        <p class="shop-detail-desc">${itemInfo.description}</p>
        <div class="shop-detail-price">Sell Value: ${price} Gold</div>
        <button id="shop-action-btn" class="shop-action-btn">Sell Item</button>
      `;

      const btn = document.getElementById('shop-action-btn');
      if (btn) {
        btn.onclick = () => this.sellItem(this.selectedItem.index, price);
      }
    }
  }

  buyItem(itemId, price) {
    const shop = this.shopsData[this.activeMerchantId];
    const inventoryManager = this.game.inventoryManager;
    if (!shop || !inventoryManager) return;

    if (shop.stock[itemId] <= 0) return;

    if (inventoryManager.addItem(itemId, 1)) {
      inventoryManager.removeGold(price);
      shop.stock[itemId]--;
      
      const itemInfo = this.itemsData[itemId];
      inventoryManager.showNotification("Shop", `Bought ${itemInfo.name} for ${price} Gold.`);
      
      if (shop.stock[itemId] <= 0) {
        this.selectedItem = null;
      }
      this.renderShop();
    } else {
      inventoryManager.showNotification("Shop", "Inventory full! Cannot buy.");
    }
  }

  sellItem(index, price) {
    const shop = this.shopsData[this.activeMerchantId];
    const inventoryManager = this.game.inventoryManager;
    if (!shop || !inventoryManager) return;

    const slot = inventoryManager.slots[index];
    if (!slot) return;

    const itemId = slot.id;
    const itemInfo = this.itemsData[itemId];

    if (inventoryManager.removeItem(itemId, 1)) {
      inventoryManager.addGold(price);
      if (shop.stock[itemId] !== undefined) {
        shop.stock[itemId]++;
      } else {
        shop.stock[itemId] = 1;
      }

      inventoryManager.showNotification("Shop", `Sold ${itemInfo.name} for ${price} Gold.`);
      
      if (inventoryManager.slots[index] === null) {
        this.selectedItem = null;
      }
      this.renderShop();
    }
  }
}
