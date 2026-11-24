/**
 * Painter's-order sorting for isometric drawables. Furniture pieces (1x1) and
 * robots are sorted together by x + y depth; robots use their interpolated
 * fractional position and are drawn after furniture on the same tile.
 */
export type Drawable =
  | { kind: "furniture"; index: number; x: number; y: number }
  | { kind: "agent"; id: number; x: number; y: number };

const LAYER: Record<Drawable["kind"], number> = { furniture: 0, agent: 1 };

export function depthOf(d: Drawable): number {
  return d.x + d.y;
}

export function compareDrawables(a: Drawable, b: Drawable): number {
  const dd = depthOf(a) - depthOf(b);
  if (Math.abs(dd) > 1e-6) return dd;
  const dl = LAYER[a.kind] - LAYER[b.kind];
  if (dl !== 0) return dl;
  // Stable, deterministic tie-break: left-to-right on screen.
  return a.x - a.y - (b.x - b.y);
}

/** Sorts drawables in place into back-to-front order and returns them. */
export function sortDrawables(list: Drawable[]): Drawable[] {
  return list.sort(compareDrawables);
}
