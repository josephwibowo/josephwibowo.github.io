import { describe, expect, it } from "vitest";
import { OFFICE_LAYOUT } from "../sim/layout";
import { sortDrawables, type Drawable } from "./depth";

const L = OFFICE_LAYOUT;

function drawOrder(agentX: number, agentY: number): Drawable[] {
  const list: Drawable[] = L.furniture.map((p, index) => ({ kind: "furniture", index, x: p.x, y: p.y }));
  list.push({ kind: "agent", id: 0, x: agentX, y: agentY });
  return sortDrawables(list);
}

function orderOf(list: Drawable[], match: (d: Drawable) => boolean): number {
  return list.findIndex(match);
}

describe("depth sort", () => {
  const front = L.cubicles.find((c) => c.facing === "N")!; // seat on the camera side of its desk
  const behind = L.cubicles.find((c) => c.facing === "S")!; // seat on the far side of its desk

  function deskPieces(cubicleId: number): number[] {
    return L.furniture.flatMap((p, i) => (p.deskId === cubicleId ? [i] : []));
  }

  // Regression: a robot standing in front of a desk being painted over by it.
  it("draws a robot in front of a desk after the desk", () => {
    const x = front.seat % L.width;
    const y = Math.floor(front.seat / L.width);
    const list = drawOrder(x, y);
    const agent = orderOf(list, (d) => d.kind === "agent");
    for (const i of deskPieces(front.id)) {
      expect(agent).toBeGreaterThan(orderOf(list, (d) => d.kind === "furniture" && d.index === i));
    }
  });

  // Regression: a robot behind a desk being painted on top of the desk.
  it("draws a robot behind a desk before the desk", () => {
    const x = behind.seat % L.width;
    const y = Math.floor(behind.seat / L.width);
    const list = drawOrder(x, y);
    const agent = orderOf(list, (d) => d.kind === "agent");
    const deskIdx = L.furniture.findIndex((p) => p.tile === behind.desk[0]);
    expect(agent).toBeLessThan(orderOf(list, (d) => d.kind === "furniture" && d.index === deskIdx));
  });

  // Regression: a walking robot popping behind furniture mid-step instead of using its fractional position.
  it("orders a walking robot by its interpolated position", () => {
    const x = front.seat % L.width;
    const y = Math.floor(front.seat / L.width);
    // Stepping from the seat toward the walkway (away from the desk), halfway.
    const list = drawOrder(x, y + 0.5);
    const agent = orderOf(list, (d) => d.kind === "agent");
    const deskIdx = L.furniture.findIndex((p) => p.tile === front.desk[0]);
    expect(agent).toBeGreaterThan(orderOf(list, (d) => d.kind === "furniture" && d.index === deskIdx));
  });
});
