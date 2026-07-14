export const questsData = [
  {
    id: "quest_yoshi",
    title: "Childhood Bonds",
    description: "Yoshi wants to join the fight but needs you to speak with Farmer Kenji in Village 1 to retrieve her family heirloom.",
    giverNpcId: "hero_yoshi",
    objectiveType: "talk",
    targetId: "villager_v1_1",
    targetCount: 1,
    progress: 0,
    rewards: {
      gold: 50,
      items: [
        { id: "rice", quantity: 2 }
      ]
    },
    nextQuestId: null,
    status: "available"
  },
  {
    id: "quest_daiki",
    title: "Spiritual Resolve",
    description: "Monk Daiki requires temple supplies. Speak with Merchant Sado in Village 1 to secure incense packs.",
    giverNpcId: "hero_daiki",
    objectiveType: "talk",
    targetId: "merchant_v1",
    targetCount: 1,
    progress: 0,
    rewards: {
      gold: 50
    },
    nextQuestId: null,
    status: "available"
  },
  {
    id: "quest_nobu",
    title: "The Rebel's Forge",
    description: "Nobu needs the road cleared of bandits to restore rebel blacksmith forge activities. Defeat 3 Bandit Rogues in Village 2.",
    giverNpcId: "hero_nobu",
    objectiveType: "defeat",
    targetId: "bandit",
    targetCount: 3,
    progress: 0,
    rewards: {
      gold: 100,
      items: [
        { id: "iron_ore", quantity: 3 }
      ]
    },
    nextQuestId: null,
    status: "available"
  },
  {
    id: "quest_gwansik",
    title: "The Archery Path",
    description: "Master Gwan Sik wants you to clear out wild wolves nesting nearby to secure the village boundary. Defeat 2 Wild Wolves in Village 1.",
    giverNpcId: "hero_gwansik",
    objectiveType: "defeat",
    targetId: "wolf",
    targetCount: 2,
    progress: 0,
    rewards: {
      gold: 75
    },
    nextQuestId: null,
    status: "available"
  },
  {
    id: "quest_yuka",
    title: "Honor of the Clan",
    description: "Lady Yuka needs the invading scout guards dealt with to preserve the clan's safe passage. Defeat 2 Khan Soldiers in Village 3.",
    giverNpcId: "hero_yuka",
    objectiveType: "defeat",
    targetId: "soldier",
    targetCount: 2,
    progress: 0,
    rewards: {
      gold: 120,
      items: [
        { id: "katana", quantity: 1 }
      ]
    },
    nextQuestId: null,
    status: "available"
  }
];
