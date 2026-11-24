import { describe, expect, it } from "vitest";
import { OFFICE_LAYOUT } from "./layout";
import { findPath } from "./pathfinding";

const L = OFFICE_LAYOUT;
const endpoints = [
  ...L.cubicles.map((c) => c.seat),
  L.stokeSeat,
  ...L.stations.printer.slots,
  ...L.stations.coffee.slots,
];

function assertValidPath(start: number, goal: number, path: number[]): void {
  let prev = start;
  path.forEach((tile, i) => {
    const dx = Math.abs((tile % L.width) - (prev % L.width));
    const dy = Math.abs(Math.floor(tile / L.width) - Math.floor(prev / L.width));
    expect(dx + dy).toBe(1);
    expect(L.walkable[tile]).toBe(true);
    if (i < path.length - 1) expect(L.transit[tile]).toBe(true);
    prev = tile;
  });
  expect(prev).toBe(goal);
}

describe("findPath", () => {
  // Regression: robots walking through desks, walls, or other robots' seats and queue tiles.
  it("connects every seat and queue tile using only walkable steps", () => {
    for (const start of endpoints) {
      for (const goal of endpoints) {
        const path = findPath(L, start, goal);
        expect(path, `${start} -> ${goal}`).not.toBeNull();
        assertValidPath(start, goal, path!);
      }
    }
  });

  // Regression: replanning ignoring occupied tiles and walking straight back into the blockage.
  it("routes around tiles marked as blocked", () => {
    const start = L.cubicles[0].seat;
    const goal = L.stations.coffee.slots[0];
    const direct = findPath(L, start, goal)!;
    const blocked = new Set([direct[2]]);
    const detour = findPath(L, start, goal, (t) => blocked.has(t))!;
    expect(detour).not.toBeNull();
    expect(detour.some((t) => blocked.has(t))).toBe(false);
    assertValidPath(start, goal, detour);
  });

  // Regression: paths ending on furniture when a non-walkable goal is requested.
  it("returns null for a non-walkable goal", () => {
    expect(findPath(L, L.cubicles[0].seat, L.cubicles[0].desk[0])).toBeNull();
  });
});

describe("office layout", () => {
  // Regression: losing cubicles or station queue tiles when the floor plan is edited.
  it("has 20 cubicles and 2-3 queue tiles per station", () => {
    expect(L.cubicles).toHaveLength(20);
    for (const st of Object.values(L.stations)) {
      expect(st.slots.length).toBeGreaterThanOrEqual(2);
      expect(st.slots.length).toBeLessThanOrEqual(3);
    }
  });
});
