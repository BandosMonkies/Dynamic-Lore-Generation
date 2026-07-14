import BaseVillageScene from './BaseVillageScene.js';
import { interiorsConfig } from '../data/interiors.js';

export default class BaseInteriorScene extends BaseVillageScene {
  constructor(sceneKey, bgKey, collisionKey) {
    super(sceneKey, bgKey, collisionKey);
  }

  create(data) {
    super.create(data);

    // Get the interior config
    const config = interiorsConfig[this.sceneKey];
    if (config) {
      // Setup text prompt for portal entry/exit
      this.portalPrompt = this.add.text(config.exitTrigger.x, config.exitTrigger.y - 40, 'Press F to Exit', {
        font: 'bold 11px Outfit',
        fill: '#0b0c10',
        backgroundColor: '#66fcf1',
        padding: { x: 5, y: 3 }
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);
    }
  }

  // Override checkTransitions to handle exiting the interior rather than village gates
  checkTransitions() {
    if (this.transitioning) return;

    const config = interiorsConfig[this.sceneKey];
    if (!config || !this.player) return;

    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      config.exitTrigger.x,
      config.exitTrigger.y
    );

    if (dist <= config.exitTrigger.radius) {
      this.isNearEntranceOrExit = true;
      if (this.portalPrompt) {
        this.portalPrompt.setAlpha(1);
      }

      // Transition to parent village on F press
      if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
        this.transitionTo(config.parentVillage, config.spawnOutside.x, config.spawnOutside.y);
      }
    } else {
      this.isNearEntranceOrExit = false;
      if (this.portalPrompt) {
        this.portalPrompt.setAlpha(0);
      }
    }
  }
}
