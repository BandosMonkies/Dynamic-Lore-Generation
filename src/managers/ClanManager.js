export default class ClanManager {
  constructor(game) {
    this.game = game;
    this.recruitedHeroes = []; // Array of hero IDs currently recruited
    this.maxHeroes = 5;
  }

  get clanSize() {
    return this.recruitedHeroes.length;
  }

  recruitHero(heroId, heroName) {
    if (this.recruitedHeroes.includes(heroId)) return;

    this.recruitedHeroes.push(heroId);

    // Update relationship and recruited state in persistent NPC configurations
    const npcs = this.game.npcsData || [];
    const npc = npcs.find(n => n.id === heroId);
    if (npc) {
      npc.recruited = true;
      npc.relationships = [{ character: "Jin Taira", value: 100, status: "Loyal Companion" }];
      npc.emotion = "determined";
      npc.dialogueId = `${heroId}_joined_chat`; // Switch dialogue to companion chats
    }

    // Trigger visual notification
    const displayName = heroName || (npc ? npc.name : heroId);
    this.showNotification("Hero Recruited", `${displayName} has joined Jin Taira's Clan!`);
    this.showNotification("Clan Status", `Clan Size: ${this.clanSize} / ${this.maxHeroes}`);

    // Check if the final mission is ready
    if (this.canStartFinalMission()) {
      this.showNotification("Quest Log", "All five heroes recruited! Prepare to confront Khan.");
    }
  }

  isRecruited(heroId) {
    return this.recruitedHeroes.includes(heroId);
  }

  canStartFinalMission() {
    return this.recruitedHeroes.length >= this.maxHeroes;
  }

  showNotification(title, message) {
    if (this.game.questManager) {
      this.game.questManager.showNotification(title, message);
    } else {
      console.log(`[Clan Manager] ${title}: ${message}`);
    }
  }
}
