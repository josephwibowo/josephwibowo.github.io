/**
 * Procedural placeholder robot. Every robot uses the same body; the
 * protagonist differs only by an accent-coloured marking (chest band and
 * antenna tip).
 */
import { PALETTE as C } from "./palette";

export interface RobotPose {
  /** Vertical body offset in pixels (negative is up). */
  bob: number;
  /** Walk cycle phase in radians; ignored when not walking. */
  legPhase: number;
  walking: boolean;
  /** 0 = arms hanging, 1 = arms forward (typing, carrying). */
  armReach: number;
  /** Small hand oscillation in pixels (typing). */
  armWave: number;
  /** 0..1 raised-fist amount (thumping the printer). */
  armRaise: number;
  /** Body tilt in radians (idle sway). */
  lean: number;
  held: "papers" | "mug" | null;
  /** Whether we see the robot's face (front) or its back. */
  side: "front" | "back";
  /** Mirror horizontally so the robot faces screen-left. */
  mirror: boolean;
  /** Colour lighting the visor (Stoke work), or null. */
  faceGlow: string | null;
}

/** Robot bounds relative to its feet, in scene pixels (for hit testing). */
export const ROBOT_BOUNDS = { left: -7, right: 7, top: -29, bottom: 3 };

/** Draws a robot whose feet are at (x, y). `marking` is the accent colour or null. */
export function drawRobot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: RobotPose,
  marking: string | null,
): void {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose.mirror) ctx.scale(-1, 1);
  ctx.rotate(pose.lean);

  // Legs.
  const liftA = pose.walking ? Math.max(0, Math.sin(pose.legPhase)) * 1.8 : 0;
  const liftB = pose.walking ? Math.max(0, -Math.sin(pose.legPhase)) * 1.8 : 0;
  ctx.fillStyle = C.robotDark;
  ctx.fillRect(-3.5, -5 - liftA, 2.5, 5);
  ctx.fillRect(1, -5 - liftB, 2.5, 5);

  ctx.translate(0, pose.bob);
  // Local +x is always the direction the robot faces (mirroring handles left).
  // Far arm behind the body.
  drawArm(ctx, -3, pose, false);

  // Body.
  ctx.fillStyle = C.robotBody;
  roundRect(ctx, -5.5, -16, 11, 11, 2.5);
  ctx.fill();
  ctx.fillStyle = C.robotShade;
  ctx.fillRect(2.5, -14.5, 3, 8.5);
  // Marking: a band across the chest (and back).
  ctx.fillStyle = marking ?? C.robotMarking;
  ctx.fillRect(-5.5, -12.5, 11, 2.5);

  // Head.
  ctx.fillStyle = C.robotBody;
  roundRect(ctx, -5, -24, 10, 7.5, 2.5);
  ctx.fill();
  if (pose.side === "front") {
    ctx.fillStyle = C.visor;
    roundRect(ctx, -3.5, -22.5, 8, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = pose.faceGlow ?? C.eye;
    ctx.fillRect(-1.5, -21.5, 1.5, 1.8);
    ctx.fillRect(1.8, -21.5, 1.5, 1.8);
    if (pose.faceGlow) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = pose.faceGlow;
      roundRect(ctx, -5, -24, 10, 7.5, 2.5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = C.robotShade;
    ctx.fillRect(-3, -22, 6, 1);
  }
  // Antenna.
  ctx.strokeStyle = C.robotDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -27);
  ctx.stroke();
  ctx.fillStyle = marking ?? C.robotMarking;
  ctx.beginPath();
  ctx.arc(0, -27.5, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Near arm in front of the body.
  drawArm(ctx, 1.5, pose, true);
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  pose: RobotPose,
  near: boolean,
): void {
  // Angle measured from straight down, positive swings toward the facing side.
  const reach = pose.armReach * 1.25;
  const raise = pose.armRaise * 2.6;
  const angle = reach + raise;
  const len = 6.5;
  const sx = shoulderX;
  const sy = -14;
  const hx = sx + Math.sin(angle) * len;
  const hy = sy + Math.cos(angle) * len + (near ? pose.armWave : -pose.armWave);
  ctx.strokeStyle = near ? C.robotShade : C.robotDark;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  if (!near || !pose.held) return;
  if (pose.held === "papers") {
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 0.5;
    ctx.fillRect(hx - 3, hy - 4, 6, 4.5);
    ctx.strokeRect(hx - 3, hy - 4, 6, 4.5);
  } else {
    ctx.fillStyle = C.mug;
    ctx.fillRect(hx - 2, hy - 4, 4, 4.5);
    ctx.fillStyle = C.coffee;
    ctx.fillRect(hx - 2, hy - 4, 4, 1);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
