import Phaser from 'phaser';

export default class NPC extends Phaser.GameObjects.Sprite {
  constructor(scene, npcConfig) {
    // Spawn at the coordinates defined in config
    super(scene, npcConfig.x, npcConfig.y, npcConfig.spriteKey || 'npc_placeholder');
    
    // Save properties from the config
    this.id = npcConfig.id;
    this.name = npcConfig.name;
    this.role = npcConfig.role;
    this.village = npcConfig.village;
    this.interactionRadius = npcConfig.interactionRadius || 50;
    this.dialogueId = npcConfig.dialogueId;
    this.active = npcConfig.active !== undefined ? npcConfig.active : true;

    // Reserved properties for future gameplay systems (Dialogue/AI/Quests)
    this.personality = npcConfig.personality || {};
    this.memories = npcConfig.memories || [];
    this.relationships = npcConfig.relationships || [];
    this.schedule = npcConfig.schedule || {};
    this.reputation = npcConfig.reputation !== undefined ? npcConfig.reputation : 0;
    this.emotion = npcConfig.emotion || 'neutral';
    this.questIds = npcConfig.questIds || [];

    // Add this NPC sprite to the scene display list
    scene.add.existing(this);

    // Set feet-centered origin (0.5 bottom-aligned) for Y-sorting and precise placement
    this.setOrigin(0.5, 0.95);

    // Setup interactive prompt: "Press E" text bubble hovering above the NPC's head
    this.promptText = scene.add.text(npcConfig.x, npcConfig.y - 24, 'Press E', {
      font: 'bold 11px Outfit',
      fill: '#0b0c10',
      backgroundColor: '#66fcf1',
      padding: { x: 5, y: 3 }
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(1000); // Renders above standard map layers

    // Schedule path variables
    this.pathQueue = [];
    this.currentPathTarget = null;
    this.currentAction = npcConfig.currentAction || 'idle';
    this.isSleeping = false;
  }

  showPrompt(visible) {
    if (visible) {
      if (this.isSleeping) {
        this.promptText.setText('Zzz...');
        this.promptText.setStyle({ backgroundColor: '#8f9091', fill: '#ffffff' });
      } else {
        this.promptText.setText('Press E');
        this.promptText.setStyle({ backgroundColor: '#66fcf1', fill: '#0b0c10' });
      }
      this.promptText.setAlpha(1);
    } else {
      this.promptText.setAlpha(0);
    }
  }

  destroy(fromScene) {
    // Prevent memory leaks by cleaning up the hover text object
    if (this.promptText) {
      this.promptText.destroy();
    }
    super.destroy(fromScene);
  }
}
