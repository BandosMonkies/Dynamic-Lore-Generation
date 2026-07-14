import Phaser from 'phaser';

export default class LightingManager {
  /**
   * Dedicated manager to calculate and render day/night overlay tints.
   * @param {Phaser.Scene} scene - The active scene.
   */
  constructor(scene) {
    this.scene = scene;
    this.game = scene.game;

    // Viewport graphic overlay at depth 999
    this.overlay = scene.add.graphics();
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(999);

    // Initial state
    this.currentColor = 0x0c0e29;
    this.currentAlpha = 0.0;

    // Listen to world clock events
    this.game.events.on('world-time-changed', this.handleTimeChanged, this);

    // Clean up when scene changes
    this.scene.events.once('shutdown', this.destroy, this);
  }

  handleTimeChanged(data) {
    const { hour, minute } = data;
    const time = hour + minute / 60;

    let colorHex = 0x0c0e29;
    let alpha = 0.0;

    // Day/Night mathematical color interpolation
    if (time >= 0 && time < 5) {
      // Midnight - 5 AM: Deep dark night blue
      colorHex = 0x0a0c20;
      alpha = 0.45;
    } 
    else if (time >= 5 && time < 8) {
      // Dawn (5 AM - 8 AM): Fade deep night into soft pinkish orange gold, then clear
      const t = (time - 5) / 3;
      const startColor = Phaser.Display.Color.IntegerToColor(0x0a0c20);
      const endColor = Phaser.Display.Color.IntegerToColor(0xe07a5f);
      const interp = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, 1, t);
      colorHex = Phaser.Display.Color.GetColor(interp.r, interp.g, interp.b);
      alpha = 0.45 - t * 0.35; // 0.45 fades down to 0.10
    } 
    else if (time >= 8 && time < 17) {
      // Day (8 AM - 5 PM): Clear bright sunlight
      alpha = 0.0;
    } 
    else if (time >= 17 && time < 20) {
      // Sunset (5 PM - 8 PM): Golden hour fade-in
      const t = (time - 17) / 3;
      colorHex = 0xf39c12; // warm orange/gold
      alpha = t * 0.25; // 0.0 fades up to 0.25
    } 
    else { // 20 to 24
      // Nightfall (8 PM - Midnight): Golden sunset into deep night blue
      const t = (time - 20) / 4;
      const startColor = Phaser.Display.Color.IntegerToColor(0xf39c12);
      const endColor = Phaser.Display.Color.IntegerToColor(0x0a0c20);
      const interp = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, 1, t);
      colorHex = Phaser.Display.Color.GetColor(interp.r, interp.g, interp.b);
      alpha = 0.25 + t * 0.20; // 0.25 fades up to 0.45
    }

    this.currentColor = colorHex;
    this.currentAlpha = alpha;

    this.drawOverlay();
  }

  drawOverlay() {
    if (!this.overlay || !this.overlay.active) return;

    this.overlay.clear();
    
    // Only draw overlay if it has opacity
    if (this.currentAlpha > 0.01) {
      this.overlay.fillStyle(this.currentColor, this.currentAlpha);
      this.overlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
    }
  }

  destroy() {
    this.game.events.off('world-time-changed', this.handleTimeChanged, this);
    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}
