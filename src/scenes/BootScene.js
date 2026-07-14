import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Show a loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Village RPG...', {
      font: '20px Outfit',
      fill: '#ffffff'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1f2833, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 10, 320, 20, 6);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x66fcf1, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 5, 310 * value, 10, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load Village Backgrounds
    this.load.image('village1_bg', 'assets/images/village1_bg.jpg');
    this.load.image('village2_bg', 'assets/images/village2_bg.jpg');
    this.load.image('village3_bg', 'assets/images/village3_bg.jpg');
    this.load.image('barracks_bg', 'assets/images/barracks_bg.jpg');
    this.load.image('build_bg', 'assets/images/build.png');

    // Load Village Collision Masks
    this.load.image('village1_collision', 'assets/images/village1_collision.png');
    this.load.image('village2_collision', 'assets/images/village2_collision.png');
    this.load.image('village3_collision', 'assets/images/village3_collision.png');
    this.load.image('barracks_collision', 'assets/images/barracks_collision.png');
    this.load.image('build_collision', 'assets/images/build_collision.png');

    // No animations for Gwan Sik and Yuka since they are static standing images now

    // Load Gwan Sik (Archery Teacher)
    this.load.image('gwansik', 'assets/images/gwansik_stand.png');

    // Load Lady Yuka
    this.load.image('yuka', 'assets/images/yuka_stand.png');

    // Load Generic Villager
    this.load.image('villager', 'assets/images/villager_stand.png');

    // Load Yoshi
    this.load.image('yoshi', 'assets/images/yoshi_stand.png');

    // Load Monk Daiki
    this.load.image('monk', 'assets/images/monk_stand.png');

    // Load Nobu Blacksmith
    this.load.image('nobu', 'assets/images/nobu_stand.png');

    // Load Samurai spritesheet as single image to slice manually
    this.load.image('samurai', 'assets/images/samurai.png');
  }

  create() {
    // Dynamically generate a placeholder texture for NPCs (golden circle with white outline)
    const npcGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    npcGraphics.fillStyle(0xf1c40f, 1); // bright yellow/gold
    npcGraphics.fillCircle(16, 16, 14);
    npcGraphics.lineStyle(2, 0xffffff, 1); // white outline
    npcGraphics.strokeCircle(16, 16, 14);
    npcGraphics.generateTexture('npc_placeholder', 32, 32);

    // Dynamically generate a placeholder texture for Iron Ore (dark gray pebble)
    const oreGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    oreGraphics.fillStyle(0x7f8c8d, 1); // dark gray
    oreGraphics.fillCircle(16, 16, 11);
    oreGraphics.lineStyle(2, 0xffffff, 0.4); // subtle white border
    oreGraphics.strokeCircle(16, 16, 11);
    oreGraphics.generateTexture('item_iron_ore', 32, 32);

    // Dynamically generate a placeholder texture for Rice Sacks (cream color circle)
    const riceGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    riceGraphics.fillStyle(0xf5f5dc, 1); // beige/cream
    riceGraphics.fillCircle(16, 16, 11);
    riceGraphics.lineStyle(2, 0xd2b48c, 0.6); // tan border
    riceGraphics.strokeCircle(16, 16, 11);
    riceGraphics.generateTexture('item_rice', 32, 32);

    // Dynamically generate a placeholder texture for Healing Potion (red flask)
    const potionGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    potionGraphics.fillStyle(0xe74c3c, 1); // red liquid color
    potionGraphics.fillCircle(16, 18, 9); // bottle base
    potionGraphics.fillRect(13, 6, 6, 7); // bottle neck
    potionGraphics.fillStyle(0xffffff, 0.5); // sheen highlight
    potionGraphics.fillCircle(13, 16, 2);
    potionGraphics.generateTexture('item_potion', 32, 32);

    // Dynamically generate a placeholder texture for Armor (blue metal plate shield shape)
    const armorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    armorGraphics.fillStyle(0x34495e, 1); // dark blue steel
    armorGraphics.beginPath();
    armorGraphics.moveTo(6, 6);
    armorGraphics.lineTo(26, 6);
    armorGraphics.lineTo(26, 18);
    armorGraphics.lineTo(16, 28);
    armorGraphics.lineTo(6, 18);
    armorGraphics.closePath();
    armorGraphics.fill();
    armorGraphics.lineStyle(2, 0x66fcf1, 0.7); // glowing outline
    armorGraphics.stroke();
    armorGraphics.generateTexture('item_armor', 32, 32);

    // Dynamically generate a placeholder texture for Accessory (purple diamond gemstone)
    const accessoryGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    accessoryGraphics.fillStyle(0x9b59b6, 1); // purple gemstone
    accessoryGraphics.beginPath();
    accessoryGraphics.moveTo(16, 6);
    accessoryGraphics.lineTo(26, 16);
    accessoryGraphics.lineTo(16, 26);
    accessoryGraphics.lineTo(6, 16);
    accessoryGraphics.closePath();
    accessoryGraphics.fill();
    accessoryGraphics.lineStyle(1.5, 0xffffff, 0.8);
    accessoryGraphics.stroke();
    accessoryGraphics.generateTexture('item_accessory', 32, 32);

    // Dynamically generate a placeholder texture for Katana (steel diagonal blade)
    const katanaGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    katanaGraphics.lineStyle(3, 0xbdc3c7, 1); // steel color blade
    katanaGraphics.lineBetween(6, 26, 26, 6);
    katanaGraphics.lineStyle(2.5, 0xc0392b, 1); // red handle wrap
    katanaGraphics.lineBetween(6, 26, 11, 21);
    katanaGraphics.generateTexture('item_katana', 32, 32);

    // Dynamically generate a placeholder texture for Ground Loot Bag
    const lootGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    lootGraphics.fillStyle(0xd35400, 1); // rustic brown bag
    lootGraphics.beginPath();
    lootGraphics.arc(16, 19, 9, 0, Math.PI * 2, false);
    lootGraphics.fill();
    lootGraphics.fillStyle(0xe67e22, 1); // bag top neck
    lootGraphics.fillRect(12, 7, 8, 4);
    lootGraphics.lineStyle(2, 0xf1c40f, 1); // gold rope tie
    lootGraphics.lineBetween(11, 10, 21, 10);
    lootGraphics.generateTexture('loot_bag', 32, 32);

    // Dynamically generate a placeholder texture for Bandit Enemy (red/maroon circle with black mask band)
    const banditGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    banditGraphics.fillStyle(0x962d22, 1); // crimson body
    banditGraphics.fillCircle(16, 16, 13);
    banditGraphics.fillStyle(0x1a1a1a, 1); // black band mask
    banditGraphics.fillRect(3, 10, 26, 5);
    banditGraphics.fillStyle(0xffffff, 1); // angry white eyes
    banditGraphics.fillRect(7, 11, 5, 2);
    banditGraphics.fillRect(20, 11, 5, 2);
    banditGraphics.lineStyle(1.5, 0xffffff, 0.4);
    banditGraphics.strokeCircle(16, 16, 13);
    banditGraphics.generateTexture('enemy_bandit', 32, 32);

    // Dynamically generate a placeholder texture for Wolf Enemy (gray-blue circle with white claws)
    const wolfGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    wolfGraphics.fillStyle(0x34495e, 1); // slate gray/blue body
    wolfGraphics.fillCircle(16, 16, 12);
    wolfGraphics.fillStyle(0xf1c40f, 1); // glowing yellow eyes
    wolfGraphics.fillCircle(11, 13, 2);
    wolfGraphics.fillCircle(21, 13, 2);
    wolfGraphics.lineStyle(2, 0xffffff, 0.9); // sharp snout/fangs
    wolfGraphics.lineBetween(13, 21, 16, 25);
    wolfGraphics.lineBetween(19, 21, 16, 25);
    wolfGraphics.strokeCircle(16, 16, 12);
    wolfGraphics.generateTexture('enemy_wolf', 32, 32);

    // Dynamically generate a placeholder texture for Soldier Enemy (steel gray circle with gold helmet visor)
    const soldierGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    soldierGraphics.fillStyle(0x7f8c8d, 1); // steel armor color
    soldierGraphics.fillCircle(16, 16, 14);
    soldierGraphics.fillStyle(0xf39c12, 1); // golden visor line
    soldierGraphics.fillRect(4, 12, 24, 4);
    soldierGraphics.fillStyle(0xc0392b, 1); // red helmet crest
    soldierGraphics.fillRect(13, 1, 6, 4);
    soldierGraphics.lineStyle(1.5, 0xffffff, 0.5);
    soldierGraphics.strokeCircle(16, 16, 14);
    soldierGraphics.generateTexture('enemy_soldier', 32, 32);

    // Programmatically slice the Samurai spritesheet into custom frames in Phaser's Texture Manager
    const texture = this.textures.get('samurai');
    
    const cols = [183, 350, 512, 673, 832];
    const colWidths = [112, 113, 112, 111, 112];

    // Row 1: WALK - LEFT (y = 53 to 208, height = 156)
    for (let i = 0; i < 5; i++) {
      texture.add(`walk_left_${i}`, 0, cols[i], 53, colWidths[i], 156);
    }

    // Row 2: WALK - RIGHT (y = 255 to 419, height = 165)
    for (let i = 0; i < 5; i++) {
      texture.add(`walk_right_${i}`, 0, cols[i], 255, colWidths[i], 165);
    }

    // Row 3: WALK - UP (y = 458 to 624, height = 167)
    for (let i = 0; i < 5; i++) {
      texture.add(`walk_up_${i}`, 0, cols[i], 458, colWidths[i], 167);
    }

    // Create animations
    this.anims.create({
      key: 'walk_left',
      frames: [
        { key: 'samurai', frame: 'walk_left_0' },
        { key: 'samurai', frame: 'walk_left_1' },
        { key: 'samurai', frame: 'walk_left_2' },
        { key: 'samurai', frame: 'walk_left_3' },
        { key: 'samurai', frame: 'walk_left_4' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_right',
      frames: [
        { key: 'samurai', frame: 'walk_right_0' },
        { key: 'samurai', frame: 'walk_right_1' },
        { key: 'samurai', frame: 'walk_right_2' },
        { key: 'samurai', frame: 'walk_right_3' },
        { key: 'samurai', frame: 'walk_right_4' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_up',
      frames: [
        { key: 'samurai', frame: 'walk_up_0' },
        { key: 'samurai', frame: 'walk_up_1' },
        { key: 'samurai', frame: 'walk_up_2' },
        { key: 'samurai', frame: 'walk_up_3' },
        { key: 'samurai', frame: 'walk_up_4' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // (Gwan Sik and Lady Yuka now use single static standing images without any animations)

    // Start Village 1
    this.scene.start('Village1Scene', { spawnX: 512, spawnY: 350 });
  }
}
