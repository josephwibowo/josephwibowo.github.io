import type { Layout } from "./layout";

/**
 * A* on 4-connected walkable tiles. Returns the tiles to step through, ending
 * with `goal` and excluding `start`, or null when no path exists.
 *
 * Non-transit tiles (seats, queue tiles) are entered only when they are the
 * goal. `isBlocked` marks extra tiles to avoid (e.g. tiles other robots hold);
 * the goal is never treated as blocked.
 */
export function findPath(
  layout: Layout,
  start: number,
  goal: number,
  isBlocked?: (tile: number) => boolean,
): number[] | null {
  if (start === goal) return [];
  if (!layout.walkable[goal]) return null;
  const { width, height } = layout;
  const n = width * height;
  const gx = goal % width;
  const gy = Math.floor(goal / width);
  const g = new Float64Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap();
  const h = (t: number) => Math.abs((t % width) - gx) + Math.abs(Math.floor(t / width) - gy);

  g[start] = 0;
  heap.push(start, h(start), h(start));
  while (heap.size > 0) {
    const cur = heap.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % width;
    const cy = Math.floor(cur / width);
    for (let d = 0; d < 4; d++) {
      const nx = cx + (d === 1 ? 1 : d === 3 ? -1 : 0);
      const ny = cy + (d === 2 ? 1 : d === 0 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const next = ny * width + nx;
      if (closed[next] || !layout.walkable[next]) continue;
      if (next !== goal && (!layout.transit[next] || isBlocked?.(next))) continue;
      const cost = g[cur] + 1;
      if (cost < g[next]) {
        g[next] = cost;
        came[next] = cur;
        const hn = h(next);
        heap.push(next, cost + hn, hn);
      }
    }
  }
  if (came[goal] === -1) return null;
  const path: number[] = [];
  for (let t = goal; t !== start; t = came[t]) path.push(t);
  return path.reverse();
}

/** Binary min-heap ordered by f, then h, then insertion order (deterministic). */
class MinHeap {
  private items: { tile: number; f: number; h: number; order: number }[] = [];
  private counter = 0;

  get size(): number {
    return this.items.length;
  }

  push(tile: number, f: number, h: number): void {
    const item = { tile, f, h, order: this.counter++ };
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top.tile;
  }

  private less(
    x: { f: number; h: number; order: number },
    y: { f: number; h: number; order: number },
  ): boolean {
    if (x.f !== y.f) return x.f < y.f;
    if (x.h !== y.h) return x.h < y.h;
    return x.order < y.order;
  }
}
