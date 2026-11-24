import { TILE_H, TILE_W } from "../render/projection";

const HW = TILE_W / 2;
const HH = TILE_H / 2;

export interface BoxColors {
  top: string;
  left: string;
  right: string;
}

/**
 * Draws an isometric box standing on the tile whose centre is (cx, cy).
 * `inset` shrinks the footprint (0..1 of the tile), `height` is in pixels.
 */
export function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  colors: BoxColors,
  inset = 0.08,
): void {
  const hw = HW * (1 - inset);
  const hh = HH * (1 - inset);
  const top = cy - height;
  ctx.fillStyle = colors.left;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx, top + hh);
  ctx.lineTo(cx - hw, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.right;
  ctx.beginPath();
  ctx.moveTo(cx, cy + hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx + hw, top);
  ctx.lineTo(cx, top + hh);
  ctx.closePath();
  ctx.fill();
  diamondPath(ctx, cx, top, hw, hh);
  ctx.fillStyle = colors.top;
  ctx.fill();
}

/** Traces a diamond of half-size (hw, hh) centred on (cx, cy). */
export function diamondPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, hw = HW, hh = HH): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
}

/** Screen offset of one tile step along +x (u) and +y (v). */
export const U = { dx: HW, dy: HH };
export const V = { dx: -HW, dy: HH };
