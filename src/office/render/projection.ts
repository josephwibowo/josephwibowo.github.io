/**
 * Isometric projection between tile space and scene space. Scene space is the
 * unscaled drawing space of the whole office; the renderer scales it to fit.
 *
 * Tile (x, y) covers [x, x+1] x [y, y+1]; its centre is (x + 0.5, y + 0.5).
 */
export const TILE_W = 32;
export const TILE_H = 16;
/** Height of the back walls above the floor, in scene pixels. */
export const WALL_H = 46;
const PAD_X = 8;
const PAD_TOP = WALL_H + 6;
const PAD_BOTTOM = 10;

export interface SceneGeometry {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export function sceneGeometry(gridW: number, gridH: number): SceneGeometry {
  return {
    width: ((gridW + gridH) * TILE_W) / 2 + PAD_X * 2,
    height: ((gridW + gridH) * TILE_H) / 2 + PAD_TOP + PAD_BOTTOM,
    originX: PAD_X + (gridH * TILE_W) / 2,
    originY: PAD_TOP,
  };
}

/** Projects a continuous tile-space point (u, v) to scene space. */
export function project(g: SceneGeometry, u: number, v: number): { sx: number; sy: number } {
  return {
    sx: g.originX + ((u - v) * TILE_W) / 2,
    sy: g.originY + ((u + v) * TILE_H) / 2,
  };
}

/** Scene position of the centre of tile (tx, ty); fractional tiles interpolate. */
export function tileToScreen(g: SceneGeometry, tx: number, ty: number): { sx: number; sy: number } {
  return project(g, tx + 0.5, ty + 0.5);
}

/** The tile under scene point (sx, sy) on the floor plane. */
export function screenToTile(g: SceneGeometry, sx: number, sy: number): { tx: number; ty: number } {
  const a = (sx - g.originX) / (TILE_W / 2);
  const b = (sy - g.originY) / (TILE_H / 2);
  return { tx: Math.floor((a + b) / 2), ty: Math.floor((b - a) / 2) };
}
