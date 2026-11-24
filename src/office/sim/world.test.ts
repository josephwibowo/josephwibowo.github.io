import { beforeAll, describe, expect, it } from "vitest";
import { OFFICE_LAYOUT } from "./layout";
import {
  OFFICE_SEED,
  PASS_THROUGH_AFTER,
  SIM_DT,
  advanceWorld,
  createWorld,
  heldTiles,
  isMovingActivity,
  stepWorld,
  type World,
} from "./world";

const SEEDS = [1, 2, 3, 42, OFFICE_SEED];
const TEN_MINUTES = Math.round(600 / SIM_DT);
const STOKE_WINDOW_SECONDS = 180;

function snapshot(w: World): string {
  return JSON.stringify({
    tick: w.tick,
    rng: w.rng.state,
    agents: w.agents,
    stations: w.stations,
    occupancy: Array.from(w.occupancy),
  });
}

describe("determinism", () => {
  // Regression: any unseeded randomness or order-dependent state breaks replay.
  it("replays the same world for the same seed", () => {
    const a = createWorld(7);
    const b = createWorld(7);
    advanceWorld(a, 3000);
    advanceWorld(b, 3000);
    expect(snapshot(a)).toBe(snapshot(b));
  });

  // Regression: the seed being ignored would make every visit identical and the replay test vacuous.
  it("produces different worlds for different seeds", () => {
    const a = createWorld(7);
    const b = createWorld(8);
    advanceWorld(a, 300);
    advanceWorld(b, 300);
    expect(snapshot(a)).not.toBe(snapshot(b));
  });
});

describe("start of day", () => {
  // Regression: robots starting in lockstep (same activity and timer) instead of mid-day.
  it("desynchronizes starting activities and timers", () => {
    const w = createWorld(OFFICE_SEED);
    const others = w.agents.filter((a) => !a.isProtagonist);
    expect(new Set(others.map((a) => a.activity)).size).toBeGreaterThan(1);
    const remaining = others.filter((a) => a.duration > 0).map((a) => (a.duration - a.elapsed).toFixed(2));
    expect(new Set(remaining).size).toBeGreaterThan(remaining.length / 2);
  });

  // Regression: first-time visitors not seeing the Stoke storyline within seconds.
  it("starts the protagonist at the Stoke desk", () => {
    const w = createWorld(OFFICE_SEED);
    const p = w.agents[w.protagonistId];
    expect(p.activity).toBe("WorkingOnStoke");
    expect(p.tile).toBe(OFFICE_LAYOUT.stokeSeat);
    expect(p.duration - p.elapsed).toBeGreaterThanOrEqual(15);
  });
});

interface RunReport {
  reservationViolations: string[];
  unwalkable: string[];
  maxNoProgress: number;
  minCompleted: number;
  printerViolations: string[];
  coffeeViolations: string[];
  maxStokeGap: number;
  jams: number;
}

function runTenMinutes(seed: number): RunReport {
  const w = createWorld(seed);
  const L = w.layout;
  const report: RunReport = {
    reservationViolations: [],
    unwalkable: [],
    maxNoProgress: 0,
    minCompleted: Infinity,
    printerViolations: [],
    coffeeViolations: [],
    maxStokeGap: 0,
    jams: 0,
  };
  const noProgress = new Array<number>(w.agents.length).fill(0);
  let lastStoke = 0;
  let wasJammed = false;
  for (let t = 0; t < TEN_MINUTES; t++) {
    stepWorld(w);
    const holders = new Map<number, number[]>();
    for (const a of w.agents) {
      for (const tile of heldTiles(a)) {
        if (!L.walkable[tile]) report.unwalkable.push(`t${w.tick} robot ${a.id} on ${tile}`);
        holders.set(tile, [...(holders.get(tile) ?? []), a.id]);
      }
      if (isMovingActivity(a.activity) && a.x === a.prevX && a.y === a.prevY) {
        noProgress[a.id] += SIM_DT;
        report.maxNoProgress = Math.max(report.maxNoProgress, noProgress[a.id]);
      } else {
        noProgress[a.id] = 0;
      }
    }
    for (const [tile, ids] of holders) {
      if (w.occupancy[tile] !== ids.length) report.reservationViolations.push(`t${w.tick} occupancy ${tile}`);
      if (ids.length < 2) continue;
      const passing = ids.filter((id) => w.agents[id].ghostTiles.includes(tile)).length;
      if (passing < ids.length - 1) report.reservationViolations.push(`t${w.tick} tile ${tile} held by ${ids}`);
    }
    for (const [kind, activity, sink] of [
      ["printer", "UsingPrinter", report.printerViolations],
      ["coffee", "GettingCoffee", report.coffeeViolations],
    ] as const) {
      const users = w.agents.filter((a) => a.activity === activity);
      const st = w.stations[kind];
      if (users.length > 1) sink.push(`t${w.tick} ${users.length} served at once`);
      if (users.length === 1) {
        const u = users[0];
        if (st.servingId !== u.id || st.queue[0] !== u.id || u.tile !== L.stations[kind].slots[0]) {
          sink.push(`t${w.tick} robot ${u.id} served out of turn`);
        }
      }
      if (users.length === 0 && st.servingId !== null) sink.push(`t${w.tick} serving a robot that is not there`);
    }
    if (w.stations.printer.jammed && !wasJammed) report.jams++;
    wasJammed = w.stations.printer.jammed;
    if (w.agents[w.protagonistId].activity === "WorkingOnStoke") {
      report.maxStokeGap = Math.max(report.maxStokeGap, w.time - lastStoke);
      lastStoke = w.time;
    }
  }
  report.maxStokeGap = Math.max(report.maxStokeGap, w.time - lastStoke);
  report.minCompleted = Math.min(...w.agents.map((a) => a.completed));
  return report;
}

describe.each(SEEDS)("ten simulated minutes, seed %i", (seed) => {
  let report: RunReport;
  beforeAll(() => {
    report = runTenMinutes(seed);
  });

  // Regression: two robots standing in one tile outside the allowed pass-through (visible overlap).
  it("never shares a tile reservation except during pass-through", () => {
    expect(report.reservationViolations.slice(0, 5)).toEqual([]);
  });

  // Regression: movement leaving the walkable floor (walking through desks or walls).
  it("keeps every robot on walkable tiles", () => {
    expect(report.unwalkable.slice(0, 5)).toEqual([]);
  });

  // Regression: deadlock, robots stuck walking in place beyond the pass-through limit.
  it("never leaves a walking robot without progress past the pass-through limit", () => {
    expect(report.maxNoProgress).toBeLessThanOrEqual(PASS_THROUGH_AFTER + 3 * SIM_DT);
  });

  // Regression: a frozen robot that never finishes its activity.
  it("has every robot complete several activities", () => {
    expect(report.minCompleted).toBeGreaterThanOrEqual(5);
  });

  // Regression: two robots using the printer (or coffee machine) at once, or out of queue order.
  it("serves one robot at a time at each station", () => {
    expect(report.printerViolations.slice(0, 5)).toEqual([]);
    expect(report.coffeeViolations.slice(0, 5)).toEqual([]);
  });

  // Regression: weighting changes that starve the Stoke storyline.
  it("brings the protagonist to the Stoke desk at least every three minutes", () => {
    expect(report.maxStokeGap).toBeLessThanOrEqual(STOKE_WINDOW_SECONDS);
  });

  // Regression: the printer-jam gag silently never firing.
  it("jams the printer at least once", () => {
    expect(report.jams).toBeGreaterThan(0);
  });
});
