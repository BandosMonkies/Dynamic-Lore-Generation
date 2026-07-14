/**
 * actions.js
 * Master list of all player actions available in the Action Panel.
 * Each action fires a world event that propagates through the NPC memory system.
 */

export const actionCategories = [
  { id: 'combat',        label: 'Combat',        icon: '⚔️' },
  { id: 'heroic',        label: 'Heroic',        icon: '🛡️' },
  { id: 'exploration',   label: 'Exploration',   icon: '🗺️' },
  { id: 'stealth',       label: 'Stealth',       icon: '🌑' },
  { id: 'investigation', label: 'Investigation', icon: '🔍' },
  { id: 'suspicious',    label: 'Suspicious',    icon: '💀' },
  { id: 'political',     label: 'Political',     icon: '📜' },
];

/**
 * Action definition schema:
 *  id           — unique key
 *  category     — matches actionCategories.id
 *  icon         — emoji displayed in the panel
 *  label        — short display name
 *  description  — flavour text shown in the detail pane
 *  eventTemplate — the sentence NPCs store in memory
 *                  {player} → player name, {location} → auto-resolved
 *  severity     — 'minor' | 'notable' | 'major'
 *                  affects how far/fast the rumour spreads
 *  playerEffect — optional short text describing effect on player state
 */
export const actionsData = [

  // ── Combat ────────────────────────────────────────────────────────────────
  {
    id: 'kill_wolf',
    category: 'combat', icon: '🐺',
    label: 'Kill a Wild Wolf',
    description: 'Defeat a wolf that has been terrorising the outskirts of the village.',
    eventTemplate: '{player} killed a Wild Wolf at {location}',
    severity: 'notable',
    playerEffect: '+5 reputation with nearby NPCs'
  },
  {
    id: 'kill_bandit',
    category: 'combat', icon: '🗡️',
    label: 'Kill a Bandit Rogue',
    description: 'Take down one of the bandits preying on travellers.',
    eventTemplate: '{player} defeated a Bandit Rogue at {location}',
    severity: 'notable',
    playerEffect: '+8 reputation'
  },
  {
    id: 'kill_soldier',
    category: 'combat', icon: '🎌',
    label: 'Kill a Khan Soldier',
    description: 'Eliminate one of Khan\'s soldiers openly in the street.',
    eventTemplate: '{player} killed one of Khan\'s soldiers at {location}',
    severity: 'major',
    playerEffect: '+15 rebellion rep, Khan forces alerted'
  },
  {
    id: 'defeat_group',
    category: 'combat', icon: '💥',
    label: 'Defeat a Patrol Group',
    description: 'Single-handedly dismantle an entire patrol squad.',
    eventTemplate: '{player} wiped out a Khan patrol squad at {location}',
    severity: 'major',
    playerEffect: 'Major rebellion morale boost'
  },
  {
    id: 'wound_enemy',
    category: 'combat', icon: '🩸',
    label: 'Wound and Drive Off Enemy',
    description: 'Injure an enemy and force them to flee — they\'ll remember you.',
    eventTemplate: '{player} fought and wounded an enemy soldier at {location}, who fled in fear',
    severity: 'notable',
    playerEffect: 'Enemy morale reduced'
  },

  // ── Heroic ────────────────────────────────────────────────────────────────
  {
    id: 'save_villager',
    category: 'heroic', icon: '🙏',
    label: 'Save a Villager',
    description: 'Rescue a trapped or threatened villager from danger.',
    eventTemplate: '{player} saved a villager in danger at {location}',
    severity: 'major',
    playerEffect: '+20 reputation, strong loyalty from locals'
  },
  {
    id: 'drive_invaders',
    category: 'heroic', icon: '🔥',
    label: 'Drive Away Invaders',
    description: 'Force an occupying group of soldiers to retreat from the village.',
    eventTemplate: '{player} drove Khan\'s invaders out of {location}',
    severity: 'major',
    playerEffect: '+25 rebellion rep, massive morale boost'
  },
  {
    id: 'extinguish_fire',
    category: 'heroic', icon: '💧',
    label: 'Extinguish a Fire',
    description: 'Help put out a fire threatening homes or the market.',
    eventTemplate: '{player} helped extinguish a dangerous fire at {location}',
    severity: 'notable',
    playerEffect: '+10 reputation with locals'
  },
  {
    id: 'escort_traveller',
    category: 'heroic', icon: '🚶',
    label: 'Escort a Traveller Safely',
    description: 'Guide a vulnerable traveller through dangerous roads.',
    eventTemplate: '{player} safely escorted a traveller through {location}',
    severity: 'minor',
    playerEffect: '+5 reputation'
  },
  {
    id: 'donate_food',
    category: 'heroic', icon: '🍚',
    label: 'Donate Food to Villagers',
    description: 'Share food with those struggling under occupation taxes.',
    eventTemplate: '{player} gave food to hungry villagers at {location}',
    severity: 'notable',
    playerEffect: '+12 reputation, viewed as compassionate'
  },

  // ── Exploration ───────────────────────────────────────────────────────────
  {
    id: 'climb_mountain',
    category: 'exploration', icon: '🏔️',
    label: 'Climb the Mountain Pass',
    description: 'Scale the treacherous mountain path overlooking the villages.',
    eventTemplate: '{player} was spotted climbing the mountain pass near {location}',
    severity: 'minor',
    playerEffect: 'Discovered new vantage point'
  },
  {
    id: 'cross_river',
    category: 'exploration', icon: '🌊',
    label: 'Cross the River at Night',
    description: 'Cross the fast river in the dark — risky, but it avoids patrols.',
    eventTemplate: '{player} crossed the river at night near {location}',
    severity: 'minor',
    playerEffect: 'Reached restricted area undetected'
  },
  {
    id: 'discover_path',
    category: 'exploration', icon: '🌿',
    label: 'Discover a Hidden Path',
    description: 'Find a secret route through the forest connecting two villages.',
    eventTemplate: '{player} discovered a hidden forest path near {location}',
    severity: 'minor',
    playerEffect: 'New route unlocked'
  },
  {
    id: 'scout_enemy_camp',
    category: 'exploration', icon: '👁️',
    label: 'Scout an Enemy Camp',
    description: 'Sneak close to an enemy encampment to count their numbers.',
    eventTemplate: '{player} was seen scouting near the Khan encampment at {location}',
    severity: 'notable',
    playerEffect: 'Enemy strength revealed'
  },
  {
    id: 'find_secret_cave',
    category: 'exploration', icon: '🕳️',
    label: 'Find a Secret Cave',
    description: 'Uncover an old cave that could serve as a rebel hideout.',
    eventTemplate: '{player} found a hidden cave near {location} that could shelter the rebellion',
    severity: 'notable',
    playerEffect: 'Potential rebel base found'
  },

  // ── Stealth ───────────────────────────────────────────────────────────────
  {
    id: 'sneak_guards',
    category: 'stealth', icon: '🥷',
    label: 'Sneak Past a Guard Post',
    description: 'Slip through a checkpoint without being seen.',
    eventTemplate: '{player} was glimpsed sneaking past the guard post at {location}',
    severity: 'notable',
    playerEffect: 'Bypassed patrol undetected (mostly)'
  },
  {
    id: 'sabotage_supplies',
    category: 'stealth', icon: '🔥',
    label: 'Sabotage Enemy Supplies',
    description: 'Secretly destroy a stockpile of Khan\'s weapons or rations.',
    eventTemplate: '{player} sabotaged Khan\'s supply cache at {location}',
    severity: 'major',
    playerEffect: 'Enemy supplies reduced, soldiers weakened'
  },
  {
    id: 'eavesdrop',
    category: 'stealth', icon: '👂',
    label: 'Eavesdrop on an Enemy Meeting',
    description: 'Listen in on a secret meeting and gather intelligence.',
    eventTemplate: '{player} eavesdropped on a secret meeting near {location}',
    severity: 'minor',
    playerEffect: 'Gained intelligence on enemy plans'
  },
  {
    id: 'slip_barricade',
    category: 'stealth', icon: '🚧',
    label: 'Slip Through a Barricade',
    description: 'Squeeze through a barricade sealing off a village section.',
    eventTemplate: '{player} slipped through the barricade at {location}',
    severity: 'notable',
    playerEffect: 'Access to restricted zone'
  },

  // ── Investigation ─────────────────────────────────────────────────────────
  {
    id: 'find_stolen_goods',
    category: 'investigation', icon: '📦',
    label: 'Find Stolen Goods',
    description: 'Recover items taken by soldiers or bandits from villagers.',
    eventTemplate: '{player} recovered stolen goods and returned them at {location}',
    severity: 'notable',
    playerEffect: '+10 reputation, grateful locals'
  },
  {
    id: 'uncover_spy',
    category: 'investigation', icon: '🕵️',
    label: 'Uncover a Khan Spy',
    description: 'Expose a hidden informant feeding information to the occupiers.',
    eventTemplate: '{player} unmasked a Khan spy who was hiding among the villagers at {location}',
    severity: 'major',
    playerEffect: '+20 trust from rebels, spy network disrupted'
  },
  {
    id: 'inspect_merchant',
    category: 'investigation', icon: '🧐',
    label: 'Inspect a Suspicious Merchant',
    description: 'Question a trader whose goods look like they might be stolen.',
    eventTemplate: '{player} confronted a suspicious merchant at {location} about smuggled goods',
    severity: 'minor',
    playerEffect: 'Gathered information on trade routes'
  },
  {
    id: 'track_movement',
    category: 'investigation', icon: '👣',
    label: 'Track Enemy Troop Movement',
    description: 'Follow patrol routes to understand the enemy\'s strategy.',
    eventTemplate: '{player} was spotted tracking Khan\'s troop movements near {location}',
    severity: 'notable',
    playerEffect: 'Patrol schedule revealed'
  },

  // ── Suspicious ────────────────────────────────────────────────────────────
  {
    id: 'steal_food',
    category: 'suspicious', icon: '🍱',
    label: 'Steal Food from Stores',
    description: 'Take food from the village stores — even if hungry, this damages trust.',
    eventTemplate: '{player} was seen stealing food from the village stores at {location}',
    severity: 'notable',
    playerEffect: '-10 reputation, villagers wary'
  },
  {
    id: 'threaten_villager',
    category: 'suspicious', icon: '😡',
    label: 'Threaten a Villager',
    description: 'Intimidate a villager into giving information or items.',
    eventTemplate: '{player} threatened and intimidated a villager at {location}',
    severity: 'major',
    playerEffect: '-20 reputation, rumour of danger spreads fast'
  },
  {
    id: 'break_into_building',
    category: 'suspicious', icon: '🚪',
    label: 'Break Into a Building',
    description: 'Force entry into a locked building under cover of darkness.',
    eventTemplate: '{player} broke into a building at {location} under suspicious circumstances',
    severity: 'notable',
    playerEffect: '-8 reputation, suspicion raised'
  },
  {
    id: 'bribe_guard',
    category: 'suspicious', icon: '💰',
    label: 'Bribe a Guard',
    description: 'Pay a guard to look the other way. Word travels fast.',
    eventTemplate: '{player} was seen bribing a guard at {location}',
    severity: 'minor',
    playerEffect: 'Immediate passage, but trust eroded'
  },

  // ── Political ─────────────────────────────────────────────────────────────
  {
    id: 'recruit_ally',
    category: 'political', icon: '🤝',
    label: 'Recruit a New Rebel Ally',
    description: 'Convince a skilled villager to join the rebellion cause.',
    eventTemplate: '{player} was seen recruiting villagers to the rebellion at {location}',
    severity: 'notable',
    playerEffect: 'Rebellion grows; Khan spies may notice'
  },
  {
    id: 'spread_rebellion',
    category: 'political', icon: '📢',
    label: 'Spread Rebellion News',
    description: 'Openly speak about rebel victories to lift the people\'s spirits.',
    eventTemplate: '{player} was heard spreading rebellion news and rallying people at {location}',
    severity: 'notable',
    playerEffect: '+10 morale across village'
  },
  {
    id: 'negotiate_elder',
    category: 'political', icon: '🧓',
    label: 'Negotiate with a Village Elder',
    description: 'Seek the elder\'s blessing and support for the rebellion.',
    eventTemplate: '{player} held a secret council meeting with the village elders at {location}',
    severity: 'minor',
    playerEffect: 'Elder support gained'
  },
  {
    id: 'reject_clan_demand',
    category: 'political', icon: '✊',
    label: 'Reject Khan\'s Demands Publicly',
    description: 'Loudly refuse a Khan tax collector in front of villagers.',
    eventTemplate: '{player} publicly refused Khan\'s demands and defied the tax collector at {location}',
    severity: 'major',
    playerEffect: '+18 rebellion rep, Khan forces angered'
  },
];
