/**
 * The office simulation: a pure, seeded, fixed-timestep world. It knows
 * nothing about rendering or the page; the renderer reads its state.
 */
import { OFFICE_LAYOUT, dirBetween, tileX, tileY, type Dir, type Layout, type StationKind } from "./layout";
import { findPath } from "./pathfinding";
import { createRng, nextFloat, pickWeighted, randRange, type Rng } from "./rng";

/** Fixed simulation step in seconds. */
export const SIM_DT = 1 / 30;
/** Seed used by the live page. */
export const OFFICE_SEED = 20261123;
/** Ticks the reduced-motion view advances before rendering its single frame. */
export const REDUCED_MOTION_TICKS = 240;

/** Seconds a robot waits on a held tile before replanning around occupied tiles. */
export const REPLAN_AFTER = 1;
/** Seconds without progress after which a walking robot may pass through. */
export const PASS_THROUGH_AFTER = 4;
/** Walking speed range in tiles per second, chosen per robot. */
export const WALK_SPEED: readonly [number, number] = [1.6, 1.9];
/** Seconds of stokeDrive after which the protagonist heads to the Stoke desk. */
export const STOKE_DRIVE_THRESHOLD = 45;
/** Chance that a print job jams the printer partway through. */
export const PRINTER_JAM_CHANCE = 0.3;

/** Duration ranges in seconds. */
export const DURATIONS = {
  Typing: [8, 25],
  Idle: [3, 8],
  UsingPrinter: [3, 5],
  GettingCoffee: [4, 7],
  WorkingOnStoke: [20, 35],
  PrinterJam: [3, 5],
} as const satisfies Record<string, readonly [number, number]>;

export type ActivityKind =
  | "Typing"
  | "Idle"
  | "Walking"
  | "Queueing"
  | "UsingPrinter"
  | "GettingCoffee"
  | "Carrying"
  | "WorkingOnStoke";

export type Destination = "desk" | "stoke" | StationKind;
export type HeldItem = "papers" | "mug" | null;

export interface Agent {
  id: number;
  name: string;
  cubicle: number;
  isProtagonist: boolean;
  /** Tiles per second. */
  speed: number;
  /** Tile the robot stands on (or is leaving). */
  tile: number;
  /** Tile the robot is stepping into, or -1 when standing. */
  next: number;
  /** 0..1 progress from `tile` to `next`. */
  progress: number;
  /** Continuous tile coordinates, now and one tick ago (for interpolation). */
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  facing: Dir;
  activity: ActivityKind;
  /** Seconds spent in the current activity (paused while the printer is jammed). */
  elapsed: number;
  /** Planned length of timed activities, in seconds. */
  duration: number;
  /** Where a Walking, Carrying or Queueing robot is headed. */
  destination: Destination;
  held: HeldItem;
  goal: number;
  path: number[];
  blockedFor: number;
  stuckFor: number;
  /** Tiles this robot entered while another robot held them (pass-through). */
  ghostTiles: number[];
  stokeDrive: number;
  /** Number of activities finished so far. */
  completed: number;
}

export interface StationState {
  kind: StationKind;
  /** Robot ids in line order; index i belongs on slot i. */
  queue: number[];
  servingId: number | null;
  jammed: boolean;
  jamLeft: number;
  /** Elapsed print time at which the current job jams, or -1. */
  jamAt: number;
}

export interface World {
  seed: number;
  tick: number;
  time: number;
  rng: Rng;
  layout: Layout;
  agents: Agent[];
  /** Number of robots holding each tile. */
  occupancy: Uint8Array;
  stations: Record<StationKind, StationState>;
  protagonistId: number;
}

const MOVING: ReadonlySet<ActivityKind> = new Set(["Walking", "Carrying"]);

export function isMovingActivity(kind: ActivityKind): boolean {
  return MOVING.has(kind);
}

export function createWorld(seed: number, layout: Layout = OFFICE_LAYOUT): World {
  const rng = createRng(seed);
  const occupancy = new Uint8Array(layout.width * layout.height);
  const station = (kind: StationKind): StationState => ({
    kind,
    queue: [],
    servingId: null,
    jammed: false,
    jamLeft: 0,
    jamAt: -1,
  });
  const world: World = {
    seed,
    tick: 0,
    time: 0,
    rng,
    layout,
    agents: [],
    occupancy,
    stations: { printer: station("printer"), coffee: station("coffee") },
    protagonistId: layout.protagonistCubicle,
  };

  let unitNumber = 0;
  for (const cub of layout.cubicles) {
    const isProtagonist = cub.id === layout.protagonistCubicle;
    const start = isProtagonist ? layout.stokeSeat : cub.seat;
    const x = tileX(layout, start);
    const y = tileY(layout, start);
    const agent: Agent = {
      id: cub.id,
      name: isProtagonist ? "The founder" : `Unit ${String(++unitNumber).padStart(2, "0")}`,
      cubicle: cub.id,
      isProtagonist,
      speed: randRange(rng, WALK_SPEED[0], WALK_SPEED[1]),
      tile: start,
      next: -1,
      progress: 0,
      x,
      y,
      prevX: x,
      prevY: y,
      facing: isProtagonist ? layout.stokeFacing : cub.facing,
      activity: "Typing",
      elapsed: 0,
      duration: 0,
      destination: "desk",
      held: null,
      goal: start,
      path: [],
      blockedFor: 0,
      stuckFor: 0,
      ghostTiles: [],
      stokeDrive: 0,
      completed: 0,
    };
    occupancy[start]++;
    world.agents.push(agent);
  }

  // Start mid-day: each robot gets its own activity and time already spent.
  for (const a of world.agents) {
    if (a.isProtagonist) {
      a.activity = "WorkingOnStoke";
      a.duration = randRange(rng, 24, DURATIONS.WorkingOnStoke[1]);
      a.elapsed = randRange(rng, 0, 4);
      continue;
    }
    const choice = pickWeighted(rng, { typing: 0.55, idle: 0.2, coffee: 0.12, printer: 0.13 });
    if ((choice === "coffee" || choice === "printer") && !stationFull(world, choice)) {
      startTrip(world, a, choice);
    } else {
      const kind = choice === "idle" ? "Idle" : "Typing";
      a.activity = kind;
      a.duration = randRange(rng, DURATIONS[kind][0], DURATIONS[kind][1]);
      a.elapsed = nextFloat(rng) * a.duration * 0.9;
    }
    a.completed = 0;
  }
  return world;
}

export function stepWorld(world: World): void {
  for (const a of world.agents) tickAgent(world, a);
  world.tick++;
  world.time = world.tick * SIM_DT;
}

export function advanceWorld(world: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepWorld(world);
}

/** Tiles the robot currently holds a reservation on. */
export function heldTiles(a: Agent): number[] {
  return a.next === -1 ? [a.tile] : [a.tile, a.next];
}

function tickAgent(w: World, a: Agent): void {
  a.prevX = a.x;
  a.prevY = a.y;
  if (a.isProtagonist && a.activity !== "WorkingOnStoke") a.stokeDrive += SIM_DT;

  switch (a.activity) {
    case "Typing":
    case "Idle":
      a.elapsed += SIM_DT;
      if (a.elapsed >= a.duration) decideAtDesk(w, a, false);
      break;
    case "WorkingOnStoke":
      a.elapsed += SIM_DT;
      if (a.elapsed >= a.duration) {
        a.stokeDrive = 0;
        startTrip(w, a, "desk");
      }
      break;
    case "Walking":
    case "Carrying":
      a.elapsed += SIM_DT;
      if (a.destination === "printer" || a.destination === "coffee") retargetQueueSlot(w, a);
      if (advanceMovement(w, a, true)) arrive(w, a);
      break;
    case "Queueing":
      a.elapsed += SIM_DT;
      tickQueueing(w, a);
      break;
    case "UsingPrinter": {
      const st = w.stations.printer;
      if (st.jammed) {
        st.jamLeft -= SIM_DT;
        if (st.jamLeft <= 0) st.jammed = false;
        break;
      }
      a.elapsed += SIM_DT;
      if (st.jamAt >= 0 && a.elapsed >= st.jamAt) {
        st.jamAt = -1;
        st.jammed = true;
        st.jamLeft = randRange(w.rng, DURATIONS.PrinterJam[0], DURATIONS.PrinterJam[1]);
      } else if (a.elapsed >= a.duration) {
        finishService(w, a, st);
      }
      break;
    }
    case "GettingCoffee":
      a.elapsed += SIM_DT;
      if (a.elapsed >= a.duration) finishService(w, a, w.stations.coffee);
      break;
  }

  updatePosition(w, a);
}

function setActivity(w: World, a: Agent, kind: ActivityKind, range?: readonly [number, number]): void {
  a.activity = kind;
  a.elapsed = 0;
  a.duration = range ? randRange(w.rng, range[0], range[1]) : 0;
  a.completed++;
}

function stationFull(w: World, kind: StationKind): boolean {
  return w.stations[kind].queue.length >= w.layout.stations[kind].slots.length;
}

function decideAtDesk(w: World, a: Agent, afterTrip: boolean): void {
  a.facing = w.layout.cubicles[a.cubicle].facing;
  if (a.isProtagonist && a.stokeDrive >= STOKE_DRIVE_THRESHOLD) {
    startTrip(w, a, "stoke");
    return;
  }
  const weights = afterTrip
    ? { typing: 0.75, idle: 0.25, coffee: 0, printer: 0 }
    : a.activity === "Idle"
      ? { typing: 0.6, idle: 0, coffee: 0.2, printer: 0.2 }
      : { typing: 0.35, idle: 0.2, coffee: 0.2, printer: 0.25 };
  const choice = pickWeighted(w.rng, weights);
  if ((choice === "coffee" || choice === "printer") && !stationFull(w, choice)) {
    startTrip(w, a, choice);
  } else if (choice === "idle") {
    setActivity(w, a, "Idle", DURATIONS.Idle);
  } else {
    setActivity(w, a, "Typing", DURATIONS.Typing);
  }
}

function goalFor(w: World, a: Agent, dest: Destination): number {
  if (dest === "desk") return w.layout.cubicles[a.cubicle].seat;
  if (dest === "stoke") return w.layout.stokeSeat;
  const idx = w.stations[dest].queue.indexOf(a.id);
  return w.layout.stations[dest].slots[idx];
}

function planPath(w: World, from: number, goal: number): number[] {
  const path = findPath(w.layout, from, goal);
  if (!path) throw new Error(`No path from tile ${from} to tile ${goal}`);
  return path;
}

function startTrip(w: World, a: Agent, dest: Destination): void {
  if (dest === "printer" || dest === "coffee") w.stations[dest].queue.push(a.id);
  setActivity(w, a, a.held ? "Carrying" : "Walking");
  a.destination = dest;
  a.goal = goalFor(w, a, dest);
  a.path = planPath(w, a.tile, a.goal);
  a.blockedFor = 0;
  a.stuckFor = 0;
}

/** A robot walking to a queue moves up to a closer slot as the line advances. */
function retargetQueueSlot(w: World, a: Agent): void {
  if (a.next !== -1) return;
  const slot = goalFor(w, a, a.destination);
  if (slot !== a.goal) {
    a.goal = slot;
    a.path = planPath(w, a.tile, slot);
  }
}

function arrive(w: World, a: Agent): void {
  switch (a.destination) {
    case "desk":
      a.held = null;
      decideAtDesk(w, a, true);
      break;
    case "stoke":
      a.facing = w.layout.stokeFacing;
      a.stokeDrive = 0;
      setActivity(w, a, "WorkingOnStoke", DURATIONS.WorkingOnStoke);
      break;
    case "printer":
    case "coffee":
      setActivity(w, a, "Queueing");
      tickQueueing(w, a);
      break;
  }
}

function tickQueueing(w: World, a: Agent): void {
  const kind = a.destination as StationKind;
  const st = w.stations[kind];
  const def = w.layout.stations[kind];
  const idx = st.queue.indexOf(a.id);
  const slot = def.slots[idx];
  if (a.tile === slot && a.next === -1) {
    a.path = [];
    if (idx === 0) {
      a.facing = def.serviceFacing;
      if (st.servingId === null) startService(w, a, st);
    } else {
      const ahead = def.slots[idx - 1];
      a.facing = dirBetween(tileX(w.layout, slot), tileY(w.layout, slot), tileX(w.layout, ahead), tileY(w.layout, ahead));
    }
    return;
  }
  if (a.next === -1 && (a.goal !== slot || a.path.length === 0)) {
    a.goal = slot;
    a.path = planPath(w, a.tile, slot);
  }
  // Shuffling forward in line never passes through: the robot ahead always moves on.
  advanceMovement(w, a, false);
}

function startService(w: World, a: Agent, st: StationState): void {
  st.servingId = a.id;
  if (st.kind === "printer") {
    setActivity(w, a, "UsingPrinter", DURATIONS.UsingPrinter);
    st.jamAt = nextFloat(w.rng) < PRINTER_JAM_CHANCE ? randRange(w.rng, 0.5, a.duration - 0.5) : -1;
  } else {
    setActivity(w, a, "GettingCoffee", DURATIONS.GettingCoffee);
  }
}

function finishService(w: World, a: Agent, st: StationState): void {
  if (st.queue[0] !== a.id || st.servingId !== a.id) {
    throw new Error(`Robot ${a.id} finished at the ${st.kind} without being served`);
  }
  st.queue.shift();
  st.servingId = null;
  st.jammed = false;
  st.jamAt = -1;
  a.held = st.kind === "printer" ? "papers" : "mug";
  startTrip(w, a, "desk");
}

/**
 * Moves the robot along its path with tile reservation. Returns true once it
 * stands on its goal. A robot steps only into a tile nobody holds; blocked for
 * REPLAN_AFTER it replans around occupied tiles, and blocked for
 * PASS_THROUGH_AFTER (when allowed) it passes through, so nothing deadlocks.
 */
function advanceMovement(w: World, a: Agent, allowPass: boolean): boolean {
  let budget = a.speed * SIM_DT;
  let moved = false;
  for (;;) {
    if (a.next === -1) {
      if (a.path.length === 0) return true;
      const next = a.path[0];
      const occupied = w.occupancy[next] > 0;
      if (occupied && !(allowPass && a.stuckFor >= PASS_THROUGH_AFTER)) {
        if (!moved) {
          a.blockedFor += SIM_DT;
          a.stuckFor += SIM_DT;
        }
        if (a.blockedFor >= REPLAN_AFTER) {
          a.blockedFor = 0;
          replanAroundOccupied(w, a);
        }
        return false;
      }
      w.occupancy[next]++;
      if (occupied) a.ghostTiles.push(next);
      a.next = next;
      a.path.shift();
      a.progress = 0;
      a.blockedFor = 0;
      a.stuckFor = 0;
      const L = w.layout;
      a.facing = dirBetween(tileX(L, a.tile), tileY(L, a.tile), tileX(L, next), tileY(L, next));
    }
    if (budget <= 0) return false;
    const step = Math.min(budget, 1 - a.progress);
    a.progress += step;
    budget -= step;
    moved = true;
    if (a.progress < 1 - 1e-9) return false;
    release(w, a, a.tile);
    a.tile = a.next;
    a.next = -1;
    a.progress = 0;
  }
}

function replanAroundOccupied(w: World, a: Agent): void {
  const path = findPath(w.layout, a.tile, a.goal, (t) => w.occupancy[t] > 0);
  if (path && path.length > 0) a.path = path;
}

function release(w: World, a: Agent, tile: number): void {
  w.occupancy[tile]--;
  const g = a.ghostTiles.indexOf(tile);
  if (g >= 0) a.ghostTiles.splice(g, 1);
}

function updatePosition(w: World, a: Agent): void {
  const L = w.layout;
  const x0 = tileX(L, a.tile);
  const y0 = tileY(L, a.tile);
  if (a.next === -1) {
    a.x = x0;
    a.y = y0;
    return;
  }
  a.x = x0 + (tileX(L, a.next) - x0) * a.progress;
  a.y = y0 + (tileY(L, a.next) - y0) * a.progress;
}
