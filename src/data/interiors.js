// Configuration data for reusable building interiors
export const interiorsConfig = {
  ArcheryBarracksScene: {
    name: "Archery Barracks",
    bgKey: "barracks_bg",
    collisionKey: "barracks_collision",
    parentVillage: "Village3Scene",
    entranceTrigger: {
      x: 820,
      y: 220,
      radius: 40
    },
    spawnInside: {
      x: 512,
      y: 720
    },
    spawnOutside: {
      x: 820,
      y: 250
    },
    exitTrigger: {
      x: 512,
      y: 770,
      radius: 40
    }
  }
};
