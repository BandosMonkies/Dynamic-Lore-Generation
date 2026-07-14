export const enemyTypes = {
  wolf: {
    name: "Wild Wolf",
    type: "wolf",
    level: 1,
    maxHp: 25,
    hp: 25,
    stats: { atk: 7, def: 1 },
    movementSpeed: 100,
    detectionRadius: 150,
    attackRadius: 40,
    lootTable: {
      goldRange: [3, 8],
      drops: [
        { id: "rice", chance: 0.35 },
        { id: "potion", chance: 0.10 }
      ]
    }
  },
  bandit: {
    name: "Bandit Rogue",
    type: "bandit",
    level: 2,
    maxHp: 45,
    hp: 45,
    stats: { atk: 11, def: 3 },
    movementSpeed: 80,
    detectionRadius: 160,
    attackRadius: 45,
    lootTable: {
      goldRange: [8, 18],
      drops: [
        { id: "iron_ore", chance: 0.40 },
        { id: "rice", chance: 0.15 },
        { id: "potion", chance: 0.15 }
      ]
    }
  },
  soldier: {
    name: "Khan Soldier",
    type: "soldier",
    level: 3,
    maxHp: 80,
    hp: 80,
    stats: { atk: 18, def: 6 },
    movementSpeed: 70,
    detectionRadius: 180,
    attackRadius: 50,
    lootTable: {
      goldRange: [15, 30],
      drops: [
        { id: "ashigaru_armor", chance: 0.10 },
        { id: "potion", chance: 0.30 },
        { id: "iron_ore", chance: 0.20 }
      ]
    }
  }
};

export const sceneEnemySpawns = {
  Village1Scene: [
    { type: "wolf", x: 300, y: 500 },
    { type: "wolf", x: 700, y: 450 }
  ],
  Village2Scene: [
    { type: "bandit", x: 250, y: 300 },
    { type: "bandit", x: 500, y: 600 },
    { type: "bandit", x: 750, y: 400 }
  ],
  Village3Scene: [
    { type: "soldier", x: 300, y: 350 },
    { type: "soldier", x: 650, y: 550 }
  ]
};
