import type { RobotPose } from "../assets/robot";
import type { Dir } from "../sim/layout";
import type { Agent, World } from "../sim/world";

const SIDE: Record<Dir, { side: RobotPose["side"]; mirror: boolean }> = {
  E: { side: "front", mirror: false },
  S: { side: "front", mirror: true },
  N: { side: "back", mirror: false },
  W: { side: "back", mirror: true },
};

/**
 * Procedural pose parameters for a robot, from its activity and the scene time.
 * `x`/`y` are the interpolated tile coordinates used for the walk cycle.
 */
export function poseFor(world: World, a: Agent, x: number, y: number, time: number, accent: string): RobotPose {
  const seed = a.id * 1.7;
  const pose: RobotPose = {
    bob: 0,
    legPhase: 0,
    walking: false,
    armReach: 0,
    armWave: 0,
    armRaise: 0,
    lean: 0,
    held: null,
    ...SIDE[a.facing],
    faceGlow: null,
  };
  switch (a.activity) {
    case "Walking":
    case "Carrying": {
      const moving = a.next !== -1;
      pose.walking = moving;
      // Two steps per tile, tied to distance so feet don't slide.
      pose.legPhase = (x + y) * Math.PI * 2;
      pose.bob = moving ? -Math.abs(Math.sin(pose.legPhase)) * 1.2 : 0;
      if (a.activity === "Carrying") {
        pose.armReach = 1;
        pose.held = a.held;
      }
      break;
    }
    case "Typing":
      pose.armReach = 0.85;
      pose.armWave = Math.sin(time * 16 + seed) * 0.8;
      break;
    case "WorkingOnStoke":
      pose.armReach = 0.85;
      pose.armWave = Math.sin(time * 19 + seed) * 0.9;
      pose.faceGlow = accent;
      break;
    case "Idle":
      pose.lean = Math.sin(time * 1.3 + seed) * 0.08;
      break;
    case "Queueing":
      pose.lean = Math.sin(time * 1.1 + seed) * 0.04;
      break;
    case "GettingCoffee":
      pose.armReach = 0.7;
      pose.armWave = Math.sin(time * 3 + seed) * 0.4;
      break;
    case "UsingPrinter":
      if (world.stations.printer.jammed) {
        // Frustrated thumps: raise, slam, short pause.
        const cycle = (time * 1.6 + seed) % 1;
        pose.armRaise = cycle < 0.6 ? cycle / 0.6 : Math.max(0, 1 - (cycle - 0.6) / 0.12);
        pose.bob = cycle > 0.6 && cycle < 0.75 ? 1 : 0;
      } else {
        pose.armReach = 0.7;
        pose.armWave = Math.sin(time * 6 + seed) * 0.5;
      }
      break;
  }
  return pose;
}
