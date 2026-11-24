/**
 * Procedural placeholder art for the floor, walls and furniture. Everything is
 * drawn with canvas paths so there are no image URLs; this module can later be
 * swapped for sprite sheets behind the same functions.
 */
import type { Dir, FurniturePiece, Layout } from "../sim/layout";
import { project, tileToScreen, WALL_H, type SceneGeometry } from "../render/projection";
import { diamondPath, drawIsoBox, U, V } from "./iso";
import { PALETTE as C, PROTAGONIST_ACCENT } from "./palette";

export interface FurnitureState {
  /** Desk monitor: off, showing ordinary work, or glowing with Stoke. */
  screen: "off" | "on" | "stoke";
  jammed: boolean;
  brewing: boolean;
  /** Scene time in seconds, for blinking lights and steam. */
  time: number;
}

/** Height of the top surface of each furniture kind, used by hit testing too. */
export const FURNITURE_HEIGHT: Record<FurniturePiece["kind"], number> = {
  desk: 9,
  stokeDesk: 9,
  cabinet: 14,
  partition: 11,
  plant: 6,
  printer: 13,
  coffee: 20,
};

/** Draws the cached floor layer: back walls and floor tiles. */
export function drawFloorLayer(ctx: CanvasRenderingContext2D, g: SceneGeometry, layout: Layout): void {
  drawWalls(ctx, g, layout);
  const stokeArea = nookTiles(layout);
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      const tile = y * layout.width + x;
      const { sx, sy } = tileToScreen(g, x, y);
      diamondPath(ctx, sx, sy);
      ctx.fillStyle = stokeArea.has(tile) ? C.rug : (x + y) % 2 === 0 ? C.floorA : C.floorB;
      ctx.fill();
      ctx.strokeStyle = stokeArea.has(tile) ? C.rugEdge : C.floorLine;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      if (layout.kinds[tile] === "queue") {
        diamondPath(ctx, sx, sy, 9, 4.5);
        ctx.strokeStyle = C.queueMark;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

/** Tiles inside the Stoke nook's partitions, drawn with a rug. */
function nookTiles(layout: Layout): Set<number> {
  const set = new Set<number>();
  const xs = layout.stokeDeskTiles.map((t) => t % layout.width);
  const y = Math.floor(layout.stokeDeskTiles[0] / layout.width);
  for (let ty = y; ty <= y + 1; ty++) {
    for (let tx = Math.min(...xs) - 1; tx <= Math.max(...xs) + 1; tx++) set.add(ty * layout.width + tx);
  }
  return set;
}

function drawWalls(ctx: CanvasRenderingContext2D, g: SceneGeometry, layout: Layout): void {
  const corner = project(g, 0, 0);
  const right = project(g, layout.width, 0);
  const left = project(g, 0, layout.height);
  // Back-right wall along y = 0.
  ctx.fillStyle = C.wallFace;
  ctx.beginPath();
  ctx.moveTo(corner.sx, corner.sy);
  ctx.lineTo(right.sx, right.sy);
  ctx.lineTo(right.sx, right.sy - WALL_H);
  ctx.lineTo(corner.sx, corner.sy - WALL_H);
  ctx.closePath();
  ctx.fill();
  // Back-left wall along x = 0.
  ctx.fillStyle = C.wallSide;
  ctx.beginPath();
  ctx.moveTo(corner.sx, corner.sy);
  ctx.lineTo(left.sx, left.sy);
  ctx.lineTo(left.sx, left.sy - WALL_H);
  ctx.lineTo(corner.sx, corner.sy - WALL_H);
  ctx.closePath();
  ctx.fill();
  // Windows.
  ctx.fillStyle = C.window;
  ctx.strokeStyle = C.windowFrame;
  ctx.lineWidth = 1;
  for (let u = 3; u < layout.width - 2; u += 4) wallPane(ctx, g, u, 0, U, 2);
  for (let v = 3; v < layout.height - 2; v += 4) wallPane(ctx, g, 0, v, V, 2);
  // Caps.
  ctx.strokeStyle = C.wallCap;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left.sx, left.sy - WALL_H);
  ctx.lineTo(corner.sx, corner.sy - WALL_H);
  ctx.lineTo(right.sx, right.sy - WALL_H);
  ctx.stroke();
}

function wallPane(
  ctx: CanvasRenderingContext2D,
  g: SceneGeometry,
  u: number,
  v: number,
  axis: { dx: number; dy: number },
  len: number,
): void {
  const a = project(g, u, v);
  const bottom = 14;
  const top = WALL_H - 8;
  ctx.beginPath();
  ctx.moveTo(a.sx, a.sy - bottom);
  ctx.lineTo(a.sx + axis.dx * len, a.sy + axis.dy * len - bottom);
  ctx.lineTo(a.sx + axis.dx * len, a.sy + axis.dy * len - top);
  ctx.lineTo(a.sx, a.sy - top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Draws one 1x1 furniture piece standing on tile centre (cx, cy). */
export function drawFurniturePiece(
  ctx: CanvasRenderingContext2D,
  piece: FurniturePiece,
  cx: number,
  cy: number,
  state: FurnitureState,
): void {
  const h = FURNITURE_HEIGHT[piece.kind];
  switch (piece.kind) {
    case "desk":
      drawIsoBox(ctx, cx, cy, h, { top: C.deskTop, left: C.deskLeft, right: C.deskRight }, 0.04);
      if (piece.screenFacing) drawMonitor(ctx, cx, cy - h, piece.screenFacing, state.screen === "off" ? C.screenOff : C.screenOn, false);
      break;
    case "stokeDesk": {
      drawIsoBox(ctx, cx, cy, h, { top: C.deskTop, left: PROTAGONIST_ACCENT, right: C.deskRight }, 0.04);
      const facing = piece.screenFacing ?? "S";
      if (piece.part === 0) {
        drawMonitor(ctx, cx, cy - h, facing, state.screen === "off" ? C.screenOff : C.screenOn, false);
      } else {
        const active = state.screen === "stoke";
        drawMonitor(ctx, cx, cy - h, facing, active ? PROTAGONIST_ACCENT : "#4b4d7a", active);
      }
      break;
    }
    case "cabinet":
      drawIsoBox(ctx, cx, cy, h, { top: C.cabinetTop, left: C.cabinetLeft, right: C.cabinetRight }, 0.12);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - h / 2);
      ctx.lineTo(cx, cy + 7 - h / 2);
      ctx.stroke();
      break;
    case "partition":
      drawIsoBox(ctx, cx, cy, h, { top: C.partitionTop, left: C.partitionLeft, right: C.partitionRight }, 0.2);
      break;
    case "plant":
      drawIsoBox(ctx, cx, cy, h, { top: C.potTop, left: C.potLeft, right: C.potRight }, 0.55);
      ctx.fillStyle = C.leafDark;
      ctx.beginPath();
      ctx.arc(cx - 3, cy - h - 5, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - h - 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.leaf;
      ctx.beginPath();
      ctx.arc(cx, cy - h - 10, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "printer":
      drawPrinter(ctx, cx, cy, h, state);
      break;
    case "coffee":
      drawCoffee(ctx, cx, cy, h, state);
      break;
  }
}

/**
 * A monitor standing on a desk top at (cx, top), its screen plane running along
 * the tile x axis and facing `facing` (N away from the camera, S toward it).
 */
function drawMonitor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  facing: Dir,
  screen: string,
  glow: boolean,
): void {
  // Sit on the far side of the desk from the seat.
  const back = facing === "S" ? -0.18 : 0.18;
  const bx = cx + V.dx * back;
  const by = top + V.dy * back;
  const half = 0.3;
  const x0 = bx - U.dx * half;
  const y0 = by - U.dy * half;
  const x1 = bx + U.dx * half;
  const y1 = by + U.dy * half;
  const mh = 8;
  ctx.fillStyle = C.monitorBack;
  ctx.fillRect(bx - 1, by - 2, 2, 2);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - 2);
  ctx.lineTo(x1, y1 - 2);
  ctx.lineTo(x1, y1 - 2 - mh);
  ctx.lineTo(x0, y0 - 2 - mh);
  ctx.closePath();
  ctx.fill();
  if (facing !== "S") return;
  ctx.save();
  if (glow) {
    ctx.shadowColor = screen;
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = screen;
  ctx.beginPath();
  ctx.moveTo(x0 + 1, y0 + 0.5 - 3);
  ctx.lineTo(x1 - 1, y1 - 0.5 - 3);
  ctx.lineTo(x1 - 1, y1 - 0.5 - 1 - mh);
  ctx.lineTo(x0 + 1, y0 + 0.5 - 1 - mh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPrinter(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, s: FurnitureState): void {
  drawIsoBox(ctx, cx, cy, h, { top: C.printerTop, left: C.printerLeft, right: C.printerRight }, 0.14);
  // Paper tray and output slot.
  ctx.fillStyle = C.paper;
  diamondPath(ctx, cx + 2, cy - h - 1, 6, 3);
  ctx.fill();
  ctx.fillStyle = C.robotDark;
  ctx.fillRect(cx - 6, cy - h + 3, 8, 1.5);
  const blinkOn = Math.floor(s.time * 4) % 2 === 0;
  ctx.fillStyle = s.jammed ? (blinkOn ? C.alert : "#7f1d1d") : C.ok;
  ctx.beginPath();
  ctx.arc(cx + 9, cy - h + 4, 1.4, 0, Math.PI * 2);
  ctx.fill();
  if (s.jammed) {
    const bob = Math.sin(s.time * 6) * 1;
    ctx.fillStyle = C.alert;
    ctx.beginPath();
    ctx.arc(cx, cy - h - 12 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 0.75, cy - h - 15 + bob, 1.5, 4);
    ctx.fillRect(cx - 0.75, cy - h - 10 + bob, 1.5, 1.5);
  }
}

function drawCoffee(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, s: FurnitureState): void {
  drawIsoBox(ctx, cx, cy, h, { top: C.coffeeTop, left: C.coffeeLeft, right: C.coffeeRight }, 0.22);
  ctx.fillStyle = "#b45309";
  ctx.fillRect(cx - 7, cy - h + 5, 5, 3);
  ctx.fillStyle = s.brewing ? C.ok : "#52525b";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - h + 12, 1.2, 0, Math.PI * 2);
  ctx.fill();
  if (!s.brewing) return;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const phase = (s.time * 0.8 + i / 3) % 1;
    const x = cx - 6 + i * 3;
    const y = cy - h - 2 - phase * 10;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 2, y - 2, x, y - 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Outline drawn on top of a selected furniture piece. */
export function drawPieceHighlight(ctx: CanvasRenderingContext2D, piece: FurniturePiece, cx: number, cy: number): void {
  const h = FURNITURE_HEIGHT[piece.kind];
  diamondPath(ctx, cx, cy - h, 15.5, 7.75);
  ctx.strokeStyle = C.selection;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
