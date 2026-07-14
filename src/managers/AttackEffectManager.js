import Phaser from 'phaser';

export default class AttackEffectManager {
  /**
   * Spawns a visual effect in the scene at the target position, oriented towards the specified direction.
   * @param {Phaser.Scene} scene - The active Phaser Scene.
   * @param {number} x - Attacker's X coordinate.
   * @param {number} y - Attacker's Y coordinate.
   * @param {string} type - The attack effect type ('sword_slash', 'spear_thrust', 'hammer_swing', etc.).
   * @param {string} direction - Direction of the attack ('left', 'right', 'up', 'down').
   * @param {number} scaleMultiplier - Custom scale adjustment (e.g. for bosses).
   */
  static spawnEffect(scene, x, y, type = 'sword_slash', direction = 'right', scaleMultiplier = 1.0) {
    const graphics = scene.add.graphics();
    graphics.setDepth(y + 50); // Set depth slightly in front of attacker for depth sorting

    // Define color and dimensions based on type
    let color = 0x66fcf1; // Default glowing cyan
    let duration = 200; // 0.2 seconds

    switch (type) {
      case 'spear_thrust':
        color = 0xf5f5dc; // Cream/white thrust
        duration = 150;
        break;
      case 'hammer_swing':
        color = 0xd2b48c; // Tan/gold heavy swing
        duration = 250;
        break;
      case 'arrow':
        color = 0xbdc3c7; // Steel projectile
        duration = 100;
        break;
      case 'magic':
        color = 0x9b59b6; // Purple magic aura
        duration = 250;
        break;
      case 'heal':
        color = 0x2ecc71; // Green healing aura
        duration = 250;
        break;
      case 'sword_slash':
      default:
        color = 0x66fcf1; // Cyan slash
        duration = 180;
        break;
    }

    // Determine angle and offsets based on direction
    let angle = 0;
    let offsetX = 0;
    let offsetY = -20; // Default offset relative to character origin (feet at origin)

    switch (direction) {
      case 'left':
        angle = 180;
        offsetX = -35 * scaleMultiplier;
        break;
      case 'right':
        angle = 0;
        offsetX = 35 * scaleMultiplier;
        break;
      case 'up':
        angle = -90;
        offsetY = -60 * scaleMultiplier;
        break;
      case 'down':
        angle = 90;
        offsetY = 15 * scaleMultiplier;
        break;
    }

    // Position the effect
    graphics.setPosition(x + offsetX, y + offsetY);
    graphics.setAngle(angle);

    // Draw the temporary shape
    this.drawEffectShape(graphics, type, color, scaleMultiplier);

    // Add brief animation: scale up/down and fade out
    scene.tweens.add({
      targets: graphics,
      alpha: { start: 1, to: 0 },
      scaleX: { start: 0.5, to: 1.2 },
      scaleY: { start: 0.5, to: 1.2 },
      duration: duration,
      onComplete: () => {
        graphics.destroy();
      }
    });

    return graphics;
  }

  /**
   * Draws the specific shape onto the graphics object.
   */
  static drawEffectShape(graphics, type, color, scaleMultiplier) {
    graphics.lineStyle(4 * scaleMultiplier, color, 0.9);
    graphics.fillStyle(color, 0.3);

    const size = 25 * scaleMultiplier;

    if (type === 'sword_slash' || type === 'hammer_swing') {
      // Draw a crescent arc
      // Since graphics are rotated, we draw facing "right" (0 degrees)
      graphics.beginPath();
      // Draw arc: center x, center y, radius, startAngle (radians), endAngle (radians)
      const startAngle = Phaser.Math.DegToRad(-60);
      const endAngle = Phaser.Math.DegToRad(60);
      graphics.arc(0, 0, size, startAngle, endAngle, false);
      graphics.strokePath();

      // Draw outer glowing edge line
      graphics.lineStyle(2 * scaleMultiplier, 0xffffff, 0.9);
      graphics.beginPath();
      graphics.arc(0, 0, size + 4, startAngle, endAngle, false);
      graphics.strokePath();
    } 
    else if (type === 'spear_thrust') {
      // Draw a sharp linear burst pointing right
      graphics.beginPath();
      graphics.moveTo(-size / 2, 0);
      graphics.lineTo(size, 0);
      graphics.lineTo(size - 6, -3);
      graphics.moveTo(size, 0);
      graphics.lineTo(size - 6, 3);
      graphics.strokePath();
    } 
    else if (type === 'arrow') {
      // Small narrow tip
      graphics.beginPath();
      graphics.moveTo(-size / 3, -3);
      graphics.lineTo(size / 2, 0);
      graphics.lineTo(-size / 3, 3);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    } 
    else if (type === 'magic') {
      // Pulsing magic circles
      graphics.fillStyle(color, 0.25);
      graphics.fillCircle(0, 0, size * 0.8);
      graphics.strokeCircle(0, 0, size * 0.8);
      graphics.lineStyle(1.5 * scaleMultiplier, 0xffffff, 0.8);
      graphics.strokeCircle(0, 0, size * 0.5);
    } 
    else if (type === 'heal') {
      // Green cross shapes
      graphics.lineStyle(3 * scaleMultiplier, color, 1.0);
      // Vertical bar
      graphics.lineBetween(0, -size / 2, 0, size / 2);
      // Horizontal bar
      graphics.lineBetween(-size / 2, 0, size / 2, 0);
      
      // Floating smaller crosses around
      graphics.lineStyle(1.5 * scaleMultiplier, color, 0.7);
      graphics.lineBetween(-15, -15, -15, -5);
      graphics.lineBetween(-20, -10, -10, -10);
      graphics.lineBetween(15, 10, 15, 20);
      graphics.lineBetween(10, 15, 20, 15);
    }
  }
}
