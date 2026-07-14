// NPC Daily Schedule Definitions
// Hour is represented from 0 to 23.
// If startTime > endTime, it wraps around midnight.
export const npcSchedules = {

  // ── Yoshi (Village 1) ─────────────────────────────────────────────────────
  hero_yoshi: [
    {
      startTime: 8,
      endTime: 16,
      action: "exploring",
      movementSpeed: 50,
      targetLocation: { x: 800, y: 350, village: "Village1Scene" },
      waypoints: [{ x: 500, y: 350 }]
    },
    {
      startTime: 16,
      endTime: 22,
      action: "standing",
      movementSpeed: 45,
      targetLocation: { x: 350, y: 350, village: "Village1Scene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      movementSpeed: 40,
      targetLocation: { x: 250, y: 450, village: "Village1Scene" },
      waypoints: []
    }
  ],

  // ── Gwan Sik (Archery Barracks) ───────────────────────────────────────────
  hero_gwansik: [
    {
      startTime: 8,
      endTime: 18,
      action: "teaching",
      movementSpeed: 45,
      targetLocation: { x: 300, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 18,
      endTime: 22,
      action: "planning",
      movementSpeed: 40,
      targetLocation: { x: 400, y: 650, village: "ArcheryBarracksScene" },
      waypoints: []
    },
    {
      startTime: 22,
      endTime: 8,
      action: "sleeping",
      movementSpeed: 35,
      targetLocation: { x: 200, y: 650, village: "ArcheryBarracksScene" },
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
