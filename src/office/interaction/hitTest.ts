import type { Layout } from "../sim/layout";
import { screenToTile, type SceneGeometry } from "../render/projection";

export type Selection =
  | { kind: "agent"; id: number }
  | { kind: "desk"; id: number }
  | { kind: "stoke" }
  | null;

/** Screen-space bounds of a drawn robot; `order` is its position in draw order. */
export interface AgentHitBox {
  id: number;
  order: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Height of desk tops, so taps on a desk's raised surface map to the desk. */
export const DESK_TOP_H = 9;

/** Maps tiles to the selectable furniture on them (desks, seats, Stoke desk). */
export function buildFurnitureTargets(layout: Layout): Map<number, Exclude<Selection, null | { kind: "agent" }>> {
  const map = new Map<number, Exclude<Selection, null | { kind: "agent" }>>();
  for (const c of layout.cubicles) {
    for (const t of [...c.desk, c.seat]) map.set(t, { kind: "desk", id: c.id });
  }
  for (const t of [...layout.stokeDeskTiles, layout.stokeSeat]) map.set(t, { kind: "stoke" });
  return map;
}

/**
 * Finds what is under scene point (sx, sy): robots first (topmost in draw
 * order wins), then furniture by tile. `minSize` enlarges small robot boxes so
 * they stay tappable when the scene is scaled down.
 */
export function hitTest(
  sx: number,
  sy: number,
  agents: readonly AgentHitBox[],
  layout: Layout,
  g: SceneGeometry,
  targets: ReadonlyMap<number, Exclude<Selection, null | { kind: "agent" }>>,
  minSize = 0,
): Selection {
  let best: AgentHitBox | null = null;
  for (const box of agents) {
    const padX = Math.max(0, (minSize - (box.x1 - box.x0)) / 2);
    const padY = Math.max(0, (minSize - (box.y1 - box.y0)) / 2);
    if (sx < box.x0 - padX || sx > box.x1 + padX || sy < box.y0 - padY || sy > box.y1 + padY) continue;
    if (!best || box.order > best.order) best = box;
  }
  if (best) return { kind: "agent", id: best.id };

  for (const lift of [DESK_TOP_H, 0]) {
    const { tx, ty } = screenToTile(g, sx, sy + lift);
    if (tx < 0 || ty < 0 || tx >= layout.width || ty >= layout.height) continue;
    const tile = ty * layout.width + tx;
    // Only desks have a raised top; seats are hit on the floor plane alone.
    const kind = layout.kinds[tile];
    if (lift > 0 && kind !== "desk" && kind !== "stokeDesk") continue;
    const target = targets.get(tile);
    if (target) return target;
  }
  return null;
}
