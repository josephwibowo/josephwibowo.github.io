import { describe, expect, it } from "vitest";
import { OFFICE_LAYOUT, tileX, tileY } from "../sim/layout";
import { sceneGeometry, tileToScreen } from "../render/projection";
import { buildFurnitureTargets, DESK_TOP_H, hitTest } from "./hitTest";

const L = OFFICE_LAYOUT;
const g = sceneGeometry(L.width, L.height);
const targets = buildFurnitureTargets(L);

function tapAt(tx: number, ty: number) {
  const { sx, sy } = tileToScreen(g, tx, ty);
  return hitTest(sx, sy, [], L, g, targets);
}

describe("hitTest furniture lookup", () => {
  // A cubicle whose seat has its desk below it and empty walkway directly behind (above) it.
  const exposed = L.cubicles.find((c) => {
    const x = tileX(L, c.seat);
    const y = tileY(L, c.seat);
    return c.facing === "S" && y > 0 && L.kinds[(y - 1) * L.width + x] === "floor";
  })!;

  // Regression: tapping the walkway just behind an empty seat opens that cubicle's desk instead of dismissing.
  it("treats the walkway behind a seat as empty floor", () => {
    const x = tileX(L, exposed.seat);
    const y = tileY(L, exposed.seat);
    // Lower-left part of the walkway tile (x, y-1): tile-space point (x+0.2, y-0.1).
    // Lifting it by the desk-top height lands on the seat tile, which has no raised surface.
    expect(tapAt(x - 0.3, y - 1 + 0.4)).toBeNull();
  });

  // Regression: narrowing the raised lookup stops desk tops, seats or the Stoke desk from being selectable.
  it("still selects desks from their top, seats, and the Stoke desk", () => {
    const deskTile = exposed.desk[0];
    const deskTop = tileToScreen(g, tileX(L, deskTile), tileY(L, deskTile));
    expect(hitTest(deskTop.sx, deskTop.sy - DESK_TOP_H, [], L, g, targets)).toEqual({ kind: "desk", id: exposed.id });

    const southRow = L.cubicles.find((c) => c.facing === "N")!;
    expect(tapAt(tileX(L, southRow.seat), tileY(L, southRow.seat))).toEqual({ kind: "desk", id: southRow.id });
    expect(tapAt(tileX(L, exposed.seat), tileY(L, exposed.seat))).toEqual({ kind: "desk", id: exposed.id });

    const stokeDesk = L.stokeDeskTiles[0];
    const stokeTop = tileToScreen(g, tileX(L, stokeDesk), tileY(L, stokeDesk));
    expect(hitTest(stokeTop.sx, stokeTop.sy - DESK_TOP_H, [], L, g, targets)).toEqual({ kind: "stoke" });
    expect(tapAt(tileX(L, L.stokeSeat), tileY(L, L.stokeSeat))).toEqual({ kind: "stoke" });
  });

  // Regression: furniture lookup winning over a robot drawn on top of it.
  it("hits robots before furniture", () => {
    const { sx, sy } = tileToScreen(g, tileX(L, exposed.seat), tileY(L, exposed.seat));
    const box = { id: 7, order: 0, x0: sx - 5, y0: sy - 5, x1: sx + 5, y1: sy + 5 };
    expect(hitTest(sx, sy, [box], L, g, targets)).toEqual({ kind: "agent", id: 7 });
  });
});
