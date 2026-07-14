// Configuration data for reusable building interiors
export const interiorsConfig = {

  // Village 1 — Temple / Pagoda building
  BuildingScene: {
    name: "Village Temple",
    bgKey: "build_bg",
    collisionKey: "build_collision",
    parentVillage: "Village1Scene",
    entranceTrigger: {
      x: 530,
      y: 245,
      radius: 50
    },
    spawnInside: {
      x: 752,
      y: 820
    },
    spawnOutside: {
      x: 530,
      y: 275
    },
    exitTrigger: {
      x: 752,
      y: 870,
      radius: 60
    }
  },

  // Village 3 — Archery Barracks
  ArcheryBarracksScene: {
    name: "Archery Barracks",
    bgKey: "barracks_bg",
    collisionKey: "barracks_collision",
    parentVillage: "Village3Scene",
    entranceTrigger: {
      x: 820,
      y: 220,
      radius: 45
    },
    spawnInside: {
      x: 512,
      y: 670
    },
    spawnOutside: {
      x: 820,
      y: 250
    },
    exitTrigger: {
      x: 512,
      y: 700,
      radius: 55
    }
  }

};
