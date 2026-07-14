import Phaser from 'phaser';

export default class WeatherRenderer {
  /**
   * Dedicated renderer for visual weather overlays and particle streaks.
   * @param {Phaser.Scene} scene - The active scene.
   */
  constructor(scene) {
    this.scene = scene;
    this.game = scene.game;

    // Overlay at depth 998 (below lighting overlay at 999)
    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(998);

    // Weather state
    this.currentWeather = 'clear';

    // Particle rain arrays
    this.raindrops = [];
    this.maxRaindrops = 120;
    this.windDrift = -3; // slides left as it falls
    this.fallSpeed = 450; // pixels per second

    // Listen to weather changes
    this.game.events.on('weather-changed', this.handleWeatherChanged, this);

    // Initial weather state lookup
    if (scene.game.worldManager) {
      this.handleWeatherChanged(scene.game.worldManager.weather);
    }

    // Clean up when scene changes
    this.scene.events.once('shutdown', this.destroy, this);
  }

  handleWeatherChanged(weather) {
    this.currentWeather = weather;

    // Reset raindrops if not raining
    if (weather !== 'rain') {
      this.raindrops = [];
    }
  }

  update(time, delta) {
    if (!this.graphics || !this.graphics.active) return;

    this.graphics.clear();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const dt = delta / 1000;

    // 1. Draw overcast shadow overlay if cloudy/rainy
    if (this.currentWeather === 'cloudy' || this.currentWeather === 'rain') {
      const overlayColor = 0x7f8c8d; // gray overcast
      const overlayAlpha = this.currentWeather === 'rain' ? 0.25 : 0.15;
      this.graphics.fillStyle(overlayColor, overlayAlpha);
      this.graphics.fillRect(0, 0, width, height);
    }

    // 2. Draw & progress rain simulation
    if (this.currentWeather === 'rain') {
      // Spawn new raindrops if cap not reached
      const spawnRate = 2; // drops per frame
      for (let s = 0; s < spawnRate; s++) {
        if (this.raindrops.length < this.maxRaindrops) {
          this.raindrops.push({
            x: Phaser.Math.RND.between(-50, width + 50),
            y: Phaser.Math.RND.between(-20, -5),
            speed: Phaser.Math.RND.between(380, 500),
            length: Phaser.Math.RND.between(15, 25),
            alpha: Phaser.Math.RND.frac() * 0.4 + 0.3 // translucent
          });
        }
      }

      // Update and draw active raindrops
      this.graphics.lineStyle(1.5, 0x95a5a6); // rain gray color
      this.raindrops.forEach((drop, idx) => {
        // Apply velocity vectors
        drop.x += this.windDrift * (drop.speed / this.fallSpeed) * (drop.speed * dt);
        drop.y += drop.speed * dt;

        // Draw line streak
        this.graphics.alpha = drop.alpha;
        this.graphics.beginPath();
        this.graphics.moveTo(drop.x, drop.y);
        this.graphics.lineTo(drop.x + this.windDrift * 4, drop.y + drop.length);
        this.graphics.strokePath();

        // Recycle if out of bounds
        if (drop.y > height) {
          drop.y = Phaser.Math.RND.between(-20, -5);
          drop.x = Phaser.Math.RND.between(-50, width + 50);
          drop.speed = Phaser.Math.RND.between(380, 500);
        }
      });
      // reset global alpha
      this.graphics.alpha = 1.0;
    }
  }

  destroy() {
    this.game.events.off('weather-changed', this.handleWeatherChanged, this);
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
