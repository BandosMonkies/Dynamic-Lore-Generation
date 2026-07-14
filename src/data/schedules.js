// NPC Daily Schedule Definitions
// Hour is represented from 0 to 23.
// If startTime > endTime, it wraps around midnight.
export const npcSchedules = {
  merchant_v1: [
    {
      startTime: 8,
      endTime: 18,
      action: "trading",
      movementSpeed: 50,
      targetLocation: { x: 208, y: 288, village: "Village1Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "relaxing",
      movementSpeed: 45,
      targetLocation: { x: 350, y: 480, village: "Village1Scene" },
      waypoints: [{ x: 300, y: 400 }]
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      movementSpeed: 40,
      targetLocation: { x: 150, y: 200, village: "Village1Scene" },
      waypoints: [{ x: 180, y: 240 }]
    }
  ],
  merchant_v2: [
    {
      startTime: 8,
      endTime: 18,
      action: "trading",
      targetLocation: { x: 208, y: 288, village: "Village2Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "socializing",
      targetLocation: { x: 400, y: 450, village: "Village2Scene" },
      waypoints: [{ x: 300, y: 350 }]
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 850, y: 280, village: "Village2Scene" },
      waypoints: []
    }
  ],
  merchant_v3: [
    {
      startTime: 8,
      endTime: 18,
      action: "trading",
      targetLocation: { x: 208, y: 288, village: "Village3Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "barracks",
      targetLocation: { x: 520, y: 520, village: "Village3Scene" },
      waypoints: [{ x: 400, y: 450 }]
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 820, y: 250, village: "Village3Scene" },
      waypoints: []
    }
  ],
  guard_v1: [
    {
      startTime: 6,
      endTime: 18,
      action: "guarding",
      targetLocation: { x: 512, y: 110, village: "Village1Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 6,
      action: "sleeping",
      targetLocation: { x: 720, y: 220, village: "Village1Scene" },
      waypoints: [{ x: 600, y: 200 }]
    }
  ],
  guard_v2: [
    {
      startTime: 6,
      endTime: 18,
      action: "guarding",
      targetLocation: { x: 512, y: 110, village: "Village2Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 6,
      action: "sleeping",
      targetLocation: { x: 600, y: 250, village: "Village2Scene" },
      waypoints: []
    }
  ],
  guard_v3: [
    {
      startTime: 6,
      endTime: 18,
      action: "guarding",
      targetLocation: { x: 512, y: 110, village: "Village3Scene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 6,
      action: "sleeping",
      targetLocation: { x: 520, y: 520, village: "Village3Scene" },
      waypoints: []
    }
  ],
  hero_yoshi: [
    {
      startTime: 8,
      endTime: 16,
      action: "exploring",
      targetLocation: { x: 800, y: 350, village: "Village1Scene" },
      waypoints: [{ x: 500, y: 350 }]
    },
    {
      startTime: 16,
      endTime: 22,
      action: "standing",
      targetLocation: { x: 350, y: 350, village: "Village1Scene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 200, y: 550, village: "Village1Scene" },
      waypoints: []
    }
  ],
  villager_v1_1: [
    {
      startTime: 6,
      endTime: 12,
      action: "farming",
      targetLocation: { x: 1008, y: 336, village: "Village1Scene" },
      waypoints: []
    },
    {
      startTime: 12,
      endTime: 17,
      action: "market",
      targetLocation: { x: 208, y: 268, village: "Village1Scene" },
      waypoints: [{ x: 800, y: 380 }, { x: 600, y: 320 }, { x: 400, y: 400 }]
    },
    {
      startTime: 17,
      endTime: 21,
      action: "tavern",
      targetLocation: { x: 200, y: 550, village: "Village1Scene" },
      waypoints: [{ x: 350, y: 400 }, { x: 200, y: 400 }, { x: 200, y: 500 }]
    },
    {
      startTime: 21,
      endTime: 6,
      action: "sleeping",
      targetLocation: { x: 1008, y: 336, village: "Village1Scene" },
      waypoints: [{ x: 200, y: 400 }, { x: 600, y: 320 }, { x: 800, y: 380 }]
    }
  ],
  hero_gwansik: [
    {
      startTime: 8,
      endTime: 18,
      action: "teaching",
      targetLocation: { x: 300, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "planning",
      targetLocation: { x: 400, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 200, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    }
  ],
  trainee_archer_1: [
    {
      startTime: 8,
      endTime: 18,
      action: "training",
      targetLocation: { x: 320, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "resting",
      targetLocation: { x: 420, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 250, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    }
  ],
  trainee_archer_2: [
    {
      startTime: 8,
      endTime: 18,
      action: "training",
      targetLocation: { x: 650, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "resting",
      targetLocation: { x: 750, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 800, y: 350, village: "ArcheryBarracksScene" },
      waypoints: []
    }
  ],
  senior_trainee_archer: [
    {
      startTime: 8,
      endTime: 18,
      action: "supervising",
      targetLocation: { x: 700, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "resting",
      targetLocation: { x: 600, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      targetLocation: { x: 800, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    }
  ]
};

/**
 * Finds the active schedule entry for a given hour.
 */
export function getActiveScheduleEntry(scheduleList, hour) {
  if (!scheduleList || scheduleList.length === 0) return null;
  return scheduleList.find(entry => {
    const { startTime, endTime } = entry;
    if (startTime < endTime) {
      return hour >= startTime && hour < endTime;
    } else {
      // wraps midnight
      return hour >= startTime || hour < endTime;
    }
  }) || scheduleList[0];
}
