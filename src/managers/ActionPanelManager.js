import { actionCategories, actionsData } from '../data/actions.js';

export default class ActionPanelManager {
  constructor(game) {
    this.game = game;
    this.categories = actionCategories;
    this.actions = actionsData;

    // UI DOM bindings
    this.overlay = null;
    this.categoriesElement = null;
    this.listElement = null;
    this.detailsElement = null;
    this.closeBtn = null;

    // Navigation state
    this.isPanelActive = false;
    this.selectedCategoryIndex = 0;
    this.selectedActionIndex = 0;
    this.focusedSection = 'categories'; // 'categories' or 'actions'

    // Save active game instance reference when panel opens
    this.activeScene = null;
  }

  init() {
    // Bind UI elements
    this.overlay = document.getElementById('action-panel-overlay');
    this.categoriesElement = document.getElementById('action-panel-categories');
    this.listElement = document.getElementById('action-panel-list-container');
    this.detailsElement = document.getElementById('action-panel-details');
    this.closeBtn = document.getElementById('action-panel-close-btn');

    if (this.closeBtn) {
      this.closeBtn.onclick = () => this.toggle(this.game, false);
    }

    // Set globally on window for tab toggling simplicity
    window.actionPanel = this;
  }

  toggle(game, forceState) {
    const nextState = forceState !== undefined ? forceState : !this.isPanelActive;
    if (this.isPanelActive === nextState) return;

    this.isPanelActive = nextState;

    if (this.isPanelActive) {
      // Find currently active scene to locate player coordinates
      this.activeScene = game.scene.scenes.find(s => s.sys.isActive() && s.player);
      if (!this.activeScene) {
        this.isPanelActive = false;
        return;
      }

      this.overlay.className = 'action-panel-visible';
      this.selectedCategoryIndex = 0;
      this.selectedActionIndex = 0;
      this.focusedSection = 'categories';
      this.render();

      // Hook keyboard controls
      this._bindKeyboardEvents();
    } else {
      this.overlay.className = 'action-panel-hidden';
      this._unbindKeyboardEvents();
      this.activeScene = null;
    }
  }

  render() {
    this.renderCategories();
    this.renderActions();
    this.renderDetails();
  }

  renderCategories() {
    this.categoriesElement.innerHTML = '';
    this.categories.forEach((cat, index) => {
      const btn = document.createElement('div');
      btn.className = 'action-category-btn';
      if (index === this.selectedCategoryIndex) {
        btn.classList.add('selected');
        if (this.focusedSection === 'categories') {
          btn.classList.add('focused');
        }
      }
      btn.innerHTML = `<span class="category-icon">${cat.icon}</span> <span class="category-label">${cat.label}</span>`;
      btn.onclick = () => {
        this.selectedCategoryIndex = index;
        this.selectedActionIndex = 0;
        this.focusedSection = 'categories';
        this.render();
      };
      this.categoriesElement.appendChild(btn);
    });
  }

  renderActions() {
    this.listElement.innerHTML = '';
    const currentCatId = this.categories[this.selectedCategoryIndex].id;
    const filteredActions = this.actions.filter(a => a.category === currentCatId);

    if (filteredActions.length === 0) {
      this.listElement.innerHTML = '<div class="action-empty-msg">No actions configured in this category.</div>';
      return;
    }

    filteredActions.forEach((act, index) => {
      const item = document.createElement('div');
      item.className = 'action-list-item';
      if (index === this.selectedActionIndex) {
        item.classList.add('selected');
        if (this.focusedSection === 'actions') {
          item.classList.add('focused');
        }
      }
      item.innerHTML = `<span class="action-icon">${act.icon}</span> <span class="action-label">${act.label}</span>`;
      item.onclick = () => {
        this.selectedActionIndex = index;
        this.focusedSection = 'actions';
        this.render();
      };
      this.listElement.appendChild(item);
    });
  }

  renderDetails() {
    this.detailsElement.innerHTML = '';
    const currentCatId = this.categories[this.selectedCategoryIndex].id;
    const filteredActions = this.actions.filter(a => a.category === currentCatId);
    const selectedAction = filteredActions[this.selectedActionIndex];

    if (!selectedAction) {
      this.detailsElement.innerHTML = '<p class="empty-details-msg">Select an action to see details</p>';
      return;
    }

    const severityColors = {
      minor: '#2ecc71',
      notable: '#e67e22',
      major: '#e74c3c'
    };
    const severityColor = severityColors[selectedAction.severity] || '#66fcf1';

    this.detailsElement.innerHTML = `
      <div class="action-details-header">
        <span class="action-details-icon">${selectedAction.icon}</span>
        <div class="action-details-title-block">
          <h3>${selectedAction.label}</h3>
          <span class="action-severity-badge" style="border-color: ${severityColor}; color: ${severityColor};">
            ${selectedAction.severity.toUpperCase()}
          </span>
        </div>
      </div>
      <div class="action-details-body">
        <div class="detail-section">
          <h4>DESCRIPTION</h4>
          <p>${selectedAction.description}</p>
        </div>
        <div class="detail-section">
          <h4>EVENT LOG FORMAT</h4>
          <p class="monospace-text">${selectedAction.eventTemplate}</p>
        </div>
        ${selectedAction.playerEffect ? `
          <div class="detail-section">
            <h4>EXPECTED EFFECT</h4>
            <p style="color: #66fcf1; font-weight: 600;">${selectedAction.playerEffect}</p>
          </div>
        ` : ''}
      </div>
      <div class="action-details-footer">
        <button id="action-execute-btn" class="execute-btn">EXECUTE SIMULATION</button>
      </div>
    `;

    const execBtn = document.getElementById('action-execute-btn');
    if (execBtn) {
      execBtn.onclick = () => this.executeSelectedAction();
    }
  }

  executeSelectedAction() {
    const currentCatId = this.categories[this.selectedCategoryIndex].id;
    const filteredActions = this.actions.filter(a => a.category === currentCatId);
    const selectedAction = filteredActions[this.selectedActionIndex];

    if (!selectedAction || !this.activeScene) return;

    const player = this.activeScene.player;
    const village = this.activeScene.sceneKey;

    if (!player) return;

    // Trigger registration on the MemoryManager
    const memoryManager = this.game.memoryManager;
    if (memoryManager) {
      const event = memoryManager.registerEvent(selectedAction, player.x, player.y, village);

      // Trigger a visual confirmation toast
      this.showToast(selectedAction.icon, selectedAction.label);
    } else {
      // MemoryManager not ready; panel closes anyway
    }

    // Close the panel
    this.toggle(this.game, false);
  }

  showToast(icon, actionLabel) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'quest-notification'; // Reuses the nice quest notifications styles
    toast.innerHTML = `
      <div class="notif-header">
        <span style="color: #66fcf1; font-weight: bold; letter-spacing: 1px;">SIMULATION TRIGGERED</span>
      </div>
      <div class="notif-title">${icon} ${actionLabel}</div>
      <p style="font-size:10px; color:#a5a6a7; margin-top:4px;">Rumour propagation initialized. Check developer dashboard.</p>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // ─── Keyboard Listeners ───────────────────────────────────────────────────

  _bindKeyboardEvents() {
    this._onKeyDownBound = this._handleKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDownBound);
  }

  _unbindKeyboardEvents() {
    if (this._onKeyDownBound) {
      window.removeEventListener('keydown', this._onKeyDownBound);
      this._onKeyDownBound = null;
    }
  }

  _handleKeyDown(event) {
    if (!this.isPanelActive) return;

    const currentCatId = this.categories[this.selectedCategoryIndex].id;
    const filteredActions = this.actions.filter(a => a.category === currentCatId);

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (this.focusedSection === 'categories') {
          this.selectedCategoryIndex = (this.selectedCategoryIndex - 1 + this.categories.length) % this.categories.length;
          this.selectedActionIndex = 0;
        } else {
          if (filteredActions.length > 0) {
            this.selectedActionIndex = (this.selectedActionIndex - 1 + filteredActions.length) % filteredActions.length;
          }
        }
        this.render();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (this.focusedSection === 'categories') {
          this.selectedCategoryIndex = (this.selectedCategoryIndex + 1) % this.categories.length;
          this.selectedActionIndex = 0;
        } else {
          if (filteredActions.length > 0) {
            this.selectedActionIndex = (this.selectedActionIndex + 1) % filteredActions.length;
          }
        }
        this.render();
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (this.focusedSection === 'categories' && filteredActions.length > 0) {
          this.focusedSection = 'actions';
          this.selectedActionIndex = 0;
          this.render();
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (this.focusedSection === 'actions') {
          this.focusedSection = 'categories';
          this.render();
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.focusedSection === 'categories') {
          if (filteredActions.length > 0) {
            this.focusedSection = 'actions';
            this.selectedActionIndex = 0;
            this.render();
          }
        } else {
          this.executeSelectedAction();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.toggle(this.game, false);
        break;
    }
  }
}
