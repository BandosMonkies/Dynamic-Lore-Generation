import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import Village1Scene from './scenes/Village1Scene.js';
import Village2Scene from './scenes/Village2Scene.js';
import Village3Scene from './scenes/Village3Scene.js';
import ArcheryBarracksScene from './scenes/ArcheryBarracksScene.js';
//saketh
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,      // Canvas resizes to fill the parent container
    autoCenter: Phaser.Scale.NO_CENTER,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, Village1Scene, Village2Scene, Village3Scene, ArcheryBarracksScene]
};

const game = new Phaser.Game(config);
export default game;
