/**
 * Canvas 2D renderer: a cached floor layer plus a dynamic layer of furniture
 * pieces and robots, depth-sorted every frame and interpolated between ticks.
 */
import { drawFloorLayer, drawFurniturePiece, drawPieceHighlight, type FurnitureState } from "../assets/furniture";
import { diamondPath } from "../assets/iso";
import { PALETTE, PROTAGONIST_ACCENT } from "../assets/palette";
import { drawRobot, ROBOT_BOUNDS } from "../assets/robot";
import type { AgentHitBox, Selection } from "../interaction/hitTest";
import type { Layout } from "../sim/layout";
import { SIM_DT, type Agent, type World } from "../sim/world";
import { sortDrawables, type Drawable } from "./depth";
import { poseFor } from "./pose";
import { sceneGeometry, tileToScreen, type SceneGeometry } from "./projection";

/** Largest devicePixelRatio the backing store is scaled by. */
export const MAX_DPR = 2;

export interface Renderer {
  readonly geometry: SceneGeometry;
  /** Scene-to-CSS-pixel scale after fitting. */
  readonly scale: number;
  /** Fits the scene into a CSS box, letterboxed, and rebuilds the floor cache. */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void;
  /** Draws one frame; `alpha` (0..1) interpolates between the last two ticks. */
  draw(world: World, alpha: number, selection: Selection): void;
  /** Converts a point in CSS pixels relative to the canvas into scene space. */
  toScene(cssX: number, cssY: number): { sx: number; sy: number };
  /** Robot hit boxes from the last drawn frame. */
  readonly agentHitBoxes: readonly AgentHitBox[];
}

export function createRenderer(canvas: HTMLCanvasElement, layout: Layout): Renderer {
  const g = sceneGeometry(layout.width, layout.height);
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) throw new Error("Canvas 2D is not available");
  const ctx: CanvasRenderingContext2D = maybeCtx;
  const furnitureDrawables: Drawable[] = layout.furniture.map((p, index) => ({
    kind: "furniture",
    index,
    x: p.x,
    y: p.y,
  }));
  let floorCache: HTMLCanvasElement | null = null;
  let scale = 1;
  let offX = 0;
  let offY = 0;
  let dpr = 1;
  let hitBoxes: AgentHitBox[] = [];

  function rebuildFloor(): void {
    const cache = floorCache ?? canvas.ownerDocument.createElement("canvas");
    cache.width = Math.max(1, Math.ceil(g.width * scale * dpr));
    cache.height = Math.max(1, Math.ceil(g.height * scale * dpr));
    const c = cache.getContext("2d");
    if (!c) throw new Error("Canvas 2D is not available");
    c.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    c.clearRect(0, 0, g.width, g.height);
    drawFloorLayer(c, g, layout);
    floorCache = cache;
  }

  function furnitureState(world: World, index: number, time: number): FurnitureState {
    const piece = layout.furniture[index];
    let screen: FurnitureState["screen"] = "off";
    if (piece.kind === "desk" && piece.deskId !== null) {
      const owner = world.agents[piece.deskId];
      const seated = owner.next === -1 && owner.tile === layout.cubicles[piece.deskId].seat;
      if (seated && (owner.activity === "Typing" || owner.activity === "Idle")) screen = "on";
    } else if (piece.kind === "stokeDesk") {
      if (world.agents[world.protagonistId].activity === "WorkingOnStoke") screen = "stoke";
    }
    return {
      screen,
      jammed: world.stations.printer.jammed,
      brewing: world.stations.coffee.servingId !== null,
      time,
    };
  }

  function drawSeatHighlight(tile: number): void {
    const { sx, sy } = tileToScreen(g, tile % layout.width, Math.floor(tile / layout.width));
    diamondPath(ctx, sx, sy, 13, 6.5);
    ctx.strokeStyle = PALETTE.selection;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  return {
    geometry: g,
    get scale() {
      return scale;
    },
    get agentHitBoxes() {
      return hitBoxes;
    },

    resize(cssWidth, cssHeight, devicePixelRatio) {
      dpr = Math.min(Math.max(devicePixelRatio || 1, 1), MAX_DPR);
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      scale = Math.max(0.01, Math.min(cssWidth / g.width, cssHeight / g.height));
      offX = (cssWidth - g.width * scale) / 2;
      offY = (cssHeight - g.height * scale) / 2;
      rebuildFloor();
    },

    toScene(cssX, cssY) {
      return { sx: (cssX - offX) / scale, sy: (cssY - offY) / scale };
    },

    draw(world, alpha, selection) {
      const time = world.time - (1 - alpha) * SIM_DT;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (floorCache) ctx.drawImage(floorCache, Math.round(offX * dpr), Math.round(offY * dpr));
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offX * dpr, offY * dpr);

      if (selection?.kind === "desk") drawSeatHighlight(layout.cubicles[selection.id].seat);
      if (selection?.kind === "stoke") drawSeatHighlight(layout.stokeSeat);

      const positions = new Map<number, { x: number; y: number }>();
      const list: Drawable[] = furnitureDrawables.slice();
      for (const a of world.agents) {
        const x = a.prevX + (a.x - a.prevX) * alpha;
        const y = a.prevY + (a.y - a.prevY) * alpha;
        positions.set(a.id, { x, y });
        list.push({ kind: "agent", id: a.id, x, y });
      }
      sortDrawables(list);

      const boxes: AgentHitBox[] = [];
      list.forEach((d, order) => {
        if (d.kind === "furniture") {
          const piece = layout.furniture[d.index];
          const { sx, sy } = tileToScreen(g, piece.x, piece.y);
          drawFurniturePiece(ctx, piece, sx, sy, furnitureState(world, d.index, time));
          const selected =
            (selection?.kind === "desk" && piece.deskId === selection.id) ||
            (selection?.kind === "stoke" && piece.kind === "stokeDesk");
          if (selected) drawPieceHighlight(ctx, piece, sx, sy);
          return;
        }
        const a: Agent = world.agents[d.id];
        const pos = positions.get(d.id)!;
        const { sx, sy } = tileToScreen(g, pos.x, pos.y);
        if (selection?.kind === "agent" && selection.id === a.id) {
          ctx.strokeStyle = PALETTE.selection;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 10, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        const pose = poseFor(world, a, pos.x, pos.y, time, PROTAGONIST_ACCENT);
        drawRobot(ctx, sx, sy, pose, a.isProtagonist ? PROTAGONIST_ACCENT : null);
        boxes.push({
          id: a.id,
          order,
          x0: sx + ROBOT_BOUNDS.left,
          x1: sx + ROBOT_BOUNDS.right,
          y0: sy + ROBOT_BOUNDS.top,
          y1: sy + ROBOT_BOUNDS.bottom,
        });
      });
      hitBoxes = boxes;
    },
  };
}
