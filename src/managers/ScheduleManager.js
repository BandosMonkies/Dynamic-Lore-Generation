import Phaser from 'phaser';
import { npcSchedules, getActiveScheduleEntry } from '../data/schedules.js';

export default class ScheduleManager {
  /**
   * Translates hourly schedules into NPC coordinate relocations and walking animations.
   * @param {Phaser.Scene} scene - The active BaseVillageScene.
   */
  constructor(scene) {
    this.scene = scene;
    this.game = scene.game;

    // Listen to world clock ticks
    this.game.events.on('world-time-changed', this.handleTimeChanged, this);

    // Clean up when scene changes
    this.scene.events.once('shutdown', this.destroy, this);
  }

  /**
   * Syncs all active scene NPCs immediately to their scheduled coordinates.
   * Typically called on scene load/start.
   */
  syncAllNpcsImmediate() {
    if (!this.scene.npcs) return;

    const hour = this.game.worldManager ? this.game.worldManager.hour : 8;

    this.scene.npcs.getChildren().forEach(npc => {
      const schedule = npcSchedules[npc.id];
      if (!schedule) return;

      const activeEntry = getActiveScheduleEntry(schedule, hour);
      if (!activeEntry) return;

      const target = activeEntry.targetLocation;
      if (target.village === this.scene.sceneKey) {
        // NPC belongs in this village right now
        npc.setActive(true);
        npc.setVisible(true);
        
        // Snap immediately to destination (walkable)
        const walkablePos = this.scene.getNearestWalkable(target.x, target.y);
        npc.x = walkablePos.x;
        npc.y = walkablePos.y;
        if (npc.promptText) {
          npc.promptText.setPosition(npc.x, npc.y - 24);
          npc.promptText.setAlpha(0); // hidden until player gets close
        }

        // Apply action/sleeping state immediately because this is scene load (immediate relocation)
        npc.currentAction = activeEntry.action;
        npc.isSleeping = (activeEntry.action === 'sleeping');
        npc.nextScheduledEntry = null;

        // Clear any active walking paths and set to Idle state
        npc.pathQueue = [];
        npc.currentPathTarget = null;
        npc.movementState = 'Idle';
        npc.waitingTimer = 0;
      } else {
        // NPC is currently scheduled to be in another village; hide them
        npc.setActive(false);
        npc.setVisible(false);
        if (npc.promptText) {
          npc.promptText.setAlpha(0);
        }
        // Save state immediately
        npc.currentAction = activeEntry.action;
        npc.isSleeping = (activeEntry.action === 'sleeping');
        npc.nextScheduledEntry = null;
        npc.pathQueue = [];
        npc.currentPathTarget = null;
        npc.movementState = 'Idle';
        npc.waitingTimer = 0;
      }
    });
  }

  handleTimeChanged(data) {
    if (!this.scene.npcs || this.scene.transitioning) return;

    const { hour } = data;

    this.scene.npcs.getChildren().forEach(npc => {
      const schedule = npcSchedules[npc.id];
      if (!schedule) return;

      const activeEntry = getActiveScheduleEntry(schedule, hour);
      if (!activeEntry) return;

      const target = activeEntry.targetLocation;

      if (target.village === this.scene.sceneKey) {
        // Belongs in this village
        if (!npc.active || !npc.visible) {
          // NPC just transitioned to this scene / wasn't here. Snap immediately.
          npc.setActive(true);
          npc.setVisible(true);
          const walkablePos = this.scene.getNearestWalkable(target.x, target.y);
          npc.x = walkablePos.x;
          npc.y = walkablePos.y;
          if (npc.promptText) npc.promptText.setPosition(npc.x, npc.y - 24);
          
          npc.currentAction = activeEntry.action;
          npc.isSleeping = (activeEntry.action === 'sleeping');
          npc.nextScheduledEntry = null;
          npc.pathQueue = [];
          npc.currentPathTarget = null;
          npc.movementState = 'Idle';
          npc.waitingTimer = 0;
          return;
        }

        // Already in active village.
        const walkableTarget = this.scene.getNearestWalkable(target.x, target.y);
        const distToFinal = Phaser.Math.Distance.Between(npc.x, npc.y, walkableTarget.x, walkableTarget.y);
        
        // If NPC is not at target and has no active path or if target shifted
        if (distToFinal > 8 && (!npc.currentPathTarget || npc.currentPathTarget.finalX !== walkableTarget.x || npc.currentPathTarget.finalY !== walkableTarget.y)) {
          // Defer updating action/sleeping state!
          npc.nextScheduledEntry = activeEntry;

          // Load waypoints + final target
          npc.pathQueue = [];
          if (activeEntry.waypoints) {
            activeEntry.waypoints.forEach(wp => {
              const walkableWp = this.scene.getNearestWalkable(wp.x, wp.y);
              npc.pathQueue.push({ x: walkableWp.x, y: walkableWp.y });
            });
          }
          npc.pathQueue.push({ x: walkableTarget.x, y: walkableTarget.y, isFinal: true });

          // Start walking to first node
          npc.currentPathTarget = npc.pathQueue.shift();
          if (npc.currentPathTarget) {
            npc.currentPathTarget.finalX = walkableTarget.x;
            npc.currentPathTarget.finalY = walkableTarget.y;
          }
          npc.movementState = 'Walking';
          npc.waitingTimer = 0;
        } else if (distToFinal <= 8) {
          // Already near target. Just update actions immediately.
          npc.currentAction = activeEntry.action;
          npc.isSleeping = (activeEntry.action === 'sleeping');
          npc.nextScheduledEntry = null;
          npc.pathQueue = [];
          npc.currentPathTarget = null;
          npc.movementState = 'Idle';
          npc.waitingTimer = 0;
        }
      } else {
        // NPC should be in another village. Hide/teleport them.
        npc.setActive(false);
        npc.setVisible(false);
        if (npc.promptText) npc.promptText.setAlpha(0);
        npc.currentAction = activeEntry.action;
        npc.isSleeping = (activeEntry.action === 'sleeping');
        npc.nextScheduledEntry = null;
        npc.pathQueue = [];
        npc.currentPathTarget = null;
        npc.movementState = 'Idle';
        npc.waitingTimer = 0;
      }
    });
  }

  update(time, delta) {
    if (!this.scene.npcs) return;

    const dt = delta / 1000;
    
    if (!this.logCounter) this.logCounter = 0;
    this.logCounter++;

    this.scene.npcs.getChildren().forEach(npc => {
      // Default state machine variables if not initialized
      if (!npc.movementState) npc.movementState = 'Idle';
      if (npc.waitingTimer === undefined) npc.waitingTimer = 0;

      if (npc.active && npc.visible && npc.currentPathTarget) {
        const hour = this.game.worldManager ? this.game.worldManager.hour : 8;
        const min = this.game.worldManager ? this.game.worldManager.minute : 0;
        const schedule = npcSchedules[npc.id];
        const activeEntry = getActiveScheduleEntry(schedule, hour);
        const walkSpeed = (activeEntry && activeEntry.movementSpeed !== undefined) ? activeEntry.movementSpeed : 50;

        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, npc.currentPathTarget.x, npc.currentPathTarget.y);

        if (npc.movementState === 'Walking') {
          if (dist > 3) {
            const angle = Phaser.Math.Angle.Between(npc.x, npc.y, npc.currentPathTarget.x, npc.currentPathTarget.y);
            const step = walkSpeed * dt;
            
            const dx = Math.cos(angle) * step;
            const dy = Math.sin(angle) * step;

            const oldX = npc.x;
            const oldY = npc.y;

            // 1. Resolve X movement with collision check
            const nextX = npc.x + dx;
            let blockedX = false;
            if (this.scene.isFeetWalkable(nextX, npc.y)) {
              npc.x = nextX;
            } else {
              blockedX = true;
            }

            // 2. Resolve Y movement with collision check
            const nextY = npc.y + dy;
            let blockedY = false;
            if (this.scene.isFeetWalkable(npc.x, nextY)) {
              npc.y = nextY;
            } else {
              blockedY = true;
            }

            // Face the direction
            const deg = Phaser.Math.RadToDeg(angle);
            if (Math.abs(deg) > 90) {
              npc.setScale(-Math.abs(npc.scaleX || 1.0), npc.scaleY || 1.0); // look left
            } else {
              npc.setScale(Math.abs(npc.scaleX || 1.0), npc.scaleY || 1.0); // look right
            }

            // Keep prompt text bubble aligned
            if (npc.promptText) {
              npc.promptText.setPosition(npc.x, npc.y - 24);
            }

            // Check if movement is blocked
            const moved = (Math.abs(npc.x - oldX) > 0.02 || Math.abs(npc.y - oldY) > 0.02);
            if (!moved) {
              // Blocked! Transition to Waiting state. Wait for 1.5 seconds.
              npc.movementState = 'Waiting';
              npc.waitingTimer = 1.5;
            }

            // Throttled debug logging
            if (this.logCounter % 60 === 0) {
              const nextWp = npc.pathQueue[0] ? `(${npc.pathQueue[0].x}, ${npc.pathQueue[0].y})` : 'None';
              console.log(`[NPC_MOVE_DEBUG] Name: ${npc.id} | State: ${npc.movementState} | Current Waypoint: (${npc.currentPathTarget.x.toFixed(1)}, ${npc.currentPathTarget.y.toFixed(1)}) | Next Waypoint: ${nextWp} | Dist: ${dist.toFixed(1)} | Blocked: ${!moved} | Waiting Time: ${npc.waitingTimer.toFixed(1)}s | Destination Reached: false`);
            }
          } else {
            // Reached current target node/waypoint
            if (npc.pathQueue.length > 0) {
              const nextNode = npc.pathQueue.shift();
              nextNode.finalX = npc.currentPathTarget.finalX;
              nextNode.finalY = npc.currentPathTarget.finalY;
              npc.currentPathTarget = nextNode;
              npc.movementState = 'Walking';
            } else {
              // Reached final destination
              npc.movementState = 'DestinationReached';
            }
          }
        } else if (npc.movementState === 'Waiting') {
          // Wait briefly, then retry walking
          npc.waitingTimer -= dt;
          if (npc.waitingTimer <= 0) {
            npc.movementState = 'Walking';
            npc.waitingTimer = 0;
          }

          // Throttled debug logging
          if (this.logCounter % 60 === 0) {
            const nextWp = npc.pathQueue[0] ? `(${npc.pathQueue[0].x}, ${npc.pathQueue[0].y})` : 'None';
            console.log(`[NPC_MOVE_DEBUG] Name: ${npc.id} | State: ${npc.movementState} | Current Waypoint: (${npc.currentPathTarget.x.toFixed(1)}, ${npc.currentPathTarget.y.toFixed(1)}) | Next Waypoint: ${nextWp} | Dist: ${dist.toFixed(1)} | Blocked: true | Waiting Time: ${npc.waitingTimer.toFixed(1)}s | Destination Reached: false`);
          }
        } else if (npc.movementState === 'DestinationReached') {
          // Complete route: transition to scheduled activity after physically reaching final destination
          npc.x = npc.currentPathTarget.finalX;
          npc.y = npc.currentPathTarget.finalY;
          if (npc.promptText) npc.promptText.setPosition(npc.x, npc.y - 24);

          if (npc.nextScheduledEntry) {
            npc.currentAction = npc.nextScheduledEntry.action;
            npc.isSleeping = (npc.nextScheduledEntry.action === 'sleeping');
            npc.nextScheduledEntry = null;
          }
          npc.currentPathTarget = null;
          npc.movementState = 'Idle';

          // Debug log destination reached
          console.log(`[NPC_MOVE_DEBUG] Name: ${npc.id} | State: ${npc.movementState} | Destination Reached: true`);
        }
      } else if (npc.active && npc.visible) {
        // Idle/Sleeping diagnostics
        const hour = this.game.worldManager ? this.game.worldManager.hour : 8;
        const min = this.game.worldManager ? this.game.worldManager.minute : 0;
        const schedule = npcSchedules[npc.id];
        const activeEntry = getActiveScheduleEntry(schedule, hour);
        if (activeEntry && this.logCounter % 180 === 0) {
          const finalT = activeEntry.targetLocation;
          const distToFinal = Phaser.Math.Distance.Between(npc.x, npc.y, finalT.x, finalT.y);
          console.log(`[NPC_MOVE_DEBUG] Name: ${npc.id} | State: ${npc.movementState} | Pos: (${npc.x.toFixed(1)}, ${npc.y.toFixed(1)}) | Target: (${finalT.x}, ${finalT.y}) | Active Action: ${npc.currentAction} | Sleeping: ${npc.isSleeping} | Dist to final: ${distToFinal.toFixed(1)} | Destination Reached: true`);
        }
      }
    });
  }

  destroy() {
    this.game.events.off('world-time-changed', this.handleTimeChanged, this);
  }
}
