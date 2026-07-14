import { questsData } from '../data/quests.js';

export default class QuestManager {
  constructor(game) {
    this.game = game; // reference to Phaser Game
    
    // Copy the quest config records
    this.quests = JSON.parse(JSON.stringify(questsData));
    
    // UI DOM bindings
    this.overlay = null;
    this.questListElement = null;
    this.detailsElement = null;
    this.closeBtn = null;
    this.tabActiveBtn = null;
    this.tabCompletedBtn = null;

    // State variables
    this.isLogActive = false;
    this.selectedTab = 'active'; // 'active' or 'completed'
    this.selectedQuestId = null;
    this.gold = 0;

    // Register Event Bus listeners once on Phaser Game Event emitter
    game.events.on('npc-talked', (npcId) => this.handleNpcTalked(npcId));
    game.events.on('dialogue-ended', (data) => this.handleDialogueEnded(data));
    game.events.on('enemy-defeated', (enemy) => this.handleEnemyDefeated(enemy));
  }

  init(events) {
    // Bind to DOM layouts in index.html
    this.overlay = document.getElementById('quest-log-overlay');
    this.questListElement = document.getElementById('quest-list');
    this.detailsElement = document.getElementById('quest-log-details');
    this.closeBtn = document.getElementById('quest-log-close-btn');
    this.tabActiveBtn = document.getElementById('tab-active');
    this.tabCompletedBtn = document.getElementById('tab-completed');

    // Register UI DOM event handlers
    if (this.closeBtn) {
      this.closeBtn.onclick = () => this.toggleQuestLog(false);
    }
    if (this.tabActiveBtn) {
      this.tabActiveBtn.onclick = () => this.switchTab('active');
    }
    if (this.tabCompletedBtn) {
      this.tabCompletedBtn.onclick = () => this.switchTab('completed');
    }

    // Render empty log
    this.renderQuestLog();
  }

  handleEnemyDefeated(enemy) {
    // Event-driven: check if defeating this enemy progresses any active quests
    this.quests.forEach(quest => {
      if (quest.status === 'active' && quest.objectiveType === 'defeat' && quest.targetId === enemy.type) {
        quest.progress = Math.min(quest.targetCount, quest.progress + 1);
        const displayName = enemy.name || enemy.type;
        this.showNotification("Quest Updated", `${quest.title}: Defeat ${displayName} (${quest.progress}/${quest.targetCount})`);

        if (quest.progress >= quest.targetCount) {
          this.completeQuest(quest.id);
        } else {
          this.renderQuestLog();
        }
      }
    });
  }

  handleNpcTalked(npcId) {
    // Event-driven: check if talking to this NPC progresses any active quests
    this.quests.forEach(quest => {
      if (quest.status === 'active' && quest.objectiveType === 'talk' && quest.targetId === npcId) {
        quest.progress = Math.min(quest.targetCount, quest.progress + 1);
        this.showNotification("Quest Updated", `${quest.title}: Talk to ${npcId} (${quest.progress}/${quest.targetCount})`);
        
        if (quest.progress >= quest.targetCount) {
          this.completeQuest(quest.id);
        } else {
          this.renderQuestLog();
        }
      }
    });
  }

  handleDialogueEnded(data) {
    const { npcId } = data;

    // Event-driven: if talking to an NPC completes, accept any available quests they offer
    this.quests.forEach(quest => {
      if (quest.giverNpcId === npcId && quest.status === 'available') {
        this.acceptQuest(quest.id);
      }
    });
  }

  acceptQuest(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'available') return;

    quest.status = 'active';
    this.showNotification("Quest Started", `${quest.title}`);
    this.renderQuestLog();
  }

  completeQuest(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'active') return;

    quest.status = 'completed';
    this.showNotification("Quest Completed", `${quest.title}`);
    
    // Check if this quest recruits a hero for our Clan System
    const heroMapping = {
      "quest_yoshi": { id: "hero_yoshi", name: "Yoshi" },
      "quest_daiki": { id: "hero_daiki", name: "Monk Daiki" },
      "quest_nobu": { id: "hero_nobu", name: "Nobu" },
      "quest_gwansik": { id: "hero_gwansik", name: "Gwan Sik" },
      "quest_yuka": { id: "hero_yuka", name: "Lady Yuka" }
    };

    if (heroMapping[questId] && this.game.clanManager) {
      const hero = heroMapping[questId];
      this.game.clanManager.recruitHero(hero.id, hero.name);
    }

    // Grant rewards
    if (quest.rewards) {
      // Grant gold
      if (quest.rewards.gold && this.game.inventoryManager) {
        this.game.inventoryManager.addGold(quest.rewards.gold);
        console.log(`[Rewards] Gained ${quest.rewards.gold} Gold.`);
      }
      // Grant items
      if (quest.rewards.items && this.game.inventoryManager) {
        quest.rewards.items.forEach(item => {
          this.game.inventoryManager.addItem(item.id, item.quantity);
          console.log(`[Rewards] Gained item "${item.id}" x ${item.quantity}.`);
        });
      }
    }

    // Unlock next quest in chain
    if (quest.nextQuestId) {
      const nextQuest = this.quests.find(q => q.id === quest.nextQuestId);
      if (nextQuest && nextQuest.status === 'locked') {
        nextQuest.status = 'available';
        console.log(`[Quests] Next quest unlocked: "${nextQuest.title}"`);
      }
    }

    this.renderQuestLog();
  }

  toggleQuestLog(visible) {
    this.isLogActive = (visible !== undefined) ? visible : !this.isLogActive;

    if (this.overlay) {
      this.overlay.className = this.isLogActive ? 'quest-log-visible' : 'quest-log-hidden';
    }

    if (this.isLogActive) {
      this.renderQuestLog();
    }
  }

  switchTab(tabName) {
    this.selectedTab = tabName;
    
    // Update button visual styles
    if (this.tabActiveBtn && this.tabCompletedBtn) {
      if (tabName === 'active') {
        this.tabActiveBtn.classList.add('active-tab');
        this.tabCompletedBtn.classList.remove('active-tab');
      } else {
        this.tabCompletedBtn.classList.add('active-tab');
        this.tabActiveBtn.classList.remove('active-tab');
      }
    }
    
    // Reset selected quest details
    this.selectedQuestId = null;
    this.renderQuestLog();
  }

  selectQuest(questId) {
    this.selectedQuestId = questId;
    this.renderQuestLog();
  }

  renderQuestLog() {
    if (!this.questListElement || !this.detailsElement) return;

    // 1. Render Quest List
    this.questListElement.innerHTML = '';
    const filteredQuests = this.quests.filter(q => {
      if (this.selectedTab === 'active') {
        return q.status === 'active';
      } else {
        return q.status === 'completed';
      }
    });

    if (filteredQuests.length === 0) {
      this.questListElement.innerHTML = `<li style="font-size: 11px; text-align: center; color: #8f9091; padding: 12px 0;">No quests</li>`;
    } else {
      filteredQuests.forEach(quest => {
        const li = document.createElement('li');
        li.className = 'quest-item';
        if (quest.id === this.selectedQuestId) {
          li.classList.add('active-quest-item');
        }
        li.textContent = quest.title;
        li.onclick = () => this.selectQuest(quest.id);
        this.questListElement.appendChild(li);
      });
    }

    // 2. Render Selected Quest Details
    const currentQuest = this.quests.find(q => q.id === this.selectedQuestId);
    if (!currentQuest || currentQuest.status !== (this.selectedTab === 'active' ? 'active' : 'completed')) {
      this.detailsElement.innerHTML = `<p class="empty-details-msg">Select a quest to see details</p>`;
    } else {
      const isCompleted = currentQuest.status === 'completed';
      const checkText = isCompleted ? '[x]' : '[ ]';
      
      let objectiveLabel = '';
      if (currentQuest.objectiveType === 'talk') {
        const npc = (this.game.npcsData || []).find(n => n.id === currentQuest.targetId);
        const name = npc ? npc.name : currentQuest.targetId;
        objectiveLabel = `Talk to ${name}`;
      } else if (currentQuest.objectiveType === 'defeat') {
        const names = { wolf: "Wild Wolf", bandit: "Bandit Rogue", soldier: "Khan Soldier" };
        const name = names[currentQuest.targetId] || currentQuest.targetId;
        objectiveLabel = `Defeat ${name}`;
      } else {
        objectiveLabel = `Objective: ${currentQuest.targetId}`;
      }

      this.detailsElement.innerHTML = `
        <h3 class="quest-detail-title">${currentQuest.title}</h3>
        <p class="quest-detail-desc">${currentQuest.description}</p>
        
        <div class="quest-detail-section">
          <h4>Objective</h4>
          <div class="objective-item">
            <span class="objective-check">${checkText}</span>
            <span>${objectiveLabel} (${currentQuest.progress}/${currentQuest.targetCount})</span>
          </div>
        </div>

        <div class="quest-detail-section">
          <h4>Rewards</h4>
          <div class="reward-item">
            + ${currentQuest.rewards.gold} Gold
          </div>
        </div>
      `;
    }
  }

  showNotification(title, message) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'quest-notification';
    notif.innerHTML = `
      <div class="notif-title">${title}</div>
      <div class="notif-message">${message}</div>
    `;
    container.appendChild(notif);

    // Fade and slide in
    setTimeout(() => notif.classList.add('notif-visible'), 50);

    // Fade out and remove automatically
    setTimeout(() => {
      notif.classList.remove('notif-visible');
      setTimeout(() => notif.remove(), 350);
    }, 3800);
  }
}
