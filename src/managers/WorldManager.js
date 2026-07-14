import Phaser from 'phaser';

export default class WorldManager {
  /**
   * Tracks and progress global world state: Time, Day, Weather, and Phase.
   * @param {Phaser.Game} game - The global game instance.
   */
  constructor(game) {
    this.game = game;

    // Time state
    this.day = 1;
    this.hour = 8;     // Start at 8:00 AM
    this.minute = 0;
    
    // 250ms real time = 1 game minute (15 seconds real time = 1 game hour)
    this.msPerGameMinute = 250; 
    this.accumulatedTime = 0;

    // Weather state: 'clear', 'cloudy', 'rain'
    this.weather = 'clear';
    this.weatherTimer = 0;
    this.weatherChangeInterval = 1000 * 60 * 3; // Random check every 3 real-time minutes

    // Cache HUD DOM elements
    this.hudDayVal = null;
    this.hudTimeVal = null;
    this.hudWeatherVal = null;
  }

  init() {
    this.hudDayVal = document.getElementById('hud-day-val');
    this.hudTimeVal = document.getElementById('hud-time-val');
    this.hudWeatherVal = document.getElementById('hud-weather-val');

    // Trigger initial updates
    this.updateHUD();
  }

  update(time, delta) {
    // 1. Progress time automatically
    this.accumulatedTime += delta;
    if (this.accumulatedTime >= this.msPerGameMinute) {
      const minutesToAdvance = Math.floor(this.accumulatedTime / this.msPerGameMinute);
      this.accumulatedTime %= this.msPerGameMinute;
      this.advanceTime(minutesToAdvance);
    }

    // 2. Periodic weather check
    this.weatherTimer += delta;
    if (this.weatherTimer >= this.weatherChangeInterval) {
      this.weatherTimer = 0;
      this.rollWeather();
    }
  }

  advanceTime(minutes) {
    this.minute += minutes;
    
    if (this.minute >= 60) {
      const hoursToAdvance = Math.floor(this.minute / 60);
      this.minute %= 60;
      this.hour += hoursToAdvance;

      if (this.hour >= 24) {
        const daysToAdvance = Math.floor(this.hour / 24);
        this.hour %= 24;
        this.day += daysToAdvance;

        // Emit day change
        this.game.events.emit('day-changed', this.day);
      }
    }

    // Determine current phase
    const phase = this.getPhaseForHour(this.hour);

    // Emit event bus notification
    this.game.events.emit('world-time-changed', {
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      phase: phase,
      weather: this.weather
    });

    this.updateHUD();
  }

  getPhaseForHour(hour) {
    if (hour >= 6 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 20) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  rollWeather() {
    // 30% chance to change weather
    if (Phaser.Math.RND.frac() < 0.3) {
      const states = ['clear', 'cloudy', 'rain'];
      // Weigh states (50% clear, 30% cloudy, 20% rain)
      const roll = Phaser.Math.RND.frac();
      let nextWeather = 'clear';
      if (roll > 0.8) {
        nextWeather = 'rain';
      } else if (roll > 0.5) {
        nextWeather = 'cloudy';
      }

      if (nextWeather !== this.weather) {
        this.setWeather(nextWeather);
      }
    }
  }

  setWeather(newWeather) {
    this.weather = newWeather;
    this.game.events.emit('weather-changed', this.weather);
    this.updateHUD();
  }

  setTime(day, hour, minute) {
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.accumulatedTime = 0;

    const phase = this.getPhaseForHour(hour);
    this.game.events.emit('world-time-changed', {
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      phase: phase,
      weather: this.weather
    });
    this.updateHUD();
  }

  updateHUD() {
    // Format Hour and Minute beautifully
    const formattedHour = String(this.hour).padStart(2, '0');
    const formattedMin = String(this.minute).padStart(2, '0');
    const phaseLabel = this.getPhaseForHour(this.hour).toUpperCase();

    if (this.hudDayVal) {
      this.hudDayVal.textContent = this.day;
    }
    if (this.hudTimeVal) {
      this.hudTimeVal.textContent = `${formattedHour}:${formattedMin} [${phaseLabel}]`;
    }
    if (this.hudWeatherVal) {
      let icon = '☀️';
      if (this.weather === 'cloudy') icon = '☁️';
      if (this.weather === 'rain') icon = '🌧️';
      this.hudWeatherVal.textContent = `${icon} ${this.weather.toUpperCase()}`;
    }
  }
}
