/**
 * The office floor plan, defined as data. Each character is one tile:
 *
 *   .  floor (walkable walkway)
 *   s  cubicle seat (walkable, but only as a path endpoint)
 *   d  cubicle desk (two tiles per cubicle, next to its seat)
 *   b  filing cabinet / cubicle partition
 *   p  plant
 *   w  low partition around the Stoke nook
 *   P  printer
 *   C  coffee machine
 *   q  station queue tile (walkable, endpoint only; order set in STATIONS)
 *   K  Stoke desk (two tiles)
 *   k  Stoke desk seat (walkable, endpoint only)
 *
 * x grows to the right along a row, y grows down the rows. Walkways are at
 * least two tiles wide so robots walking in opposite directions can pass.
 */
const MAP: readonly string[] = [
  "..bbpbbpbbpb...P.......p", // y0  back wall: cabinets, printer
  "...............qqq......", // y1  printer queue
  "........................", // y2
  "..sbsbsbsbsb............", // y3  pod A, north-facing row
  "..dddddddddd............", // y4
  "..dddddddddd...........p", // y5
  "..sbsbsbsbsb..........qC", // y6  pod A, south row; coffee on the east wall
  "......................qp", // y7  coffee queue
  "......................qp", // y8
  "..sbsbsbsbsb............", // y9  pod B
  "..dddddddddd.....wwwwwwp", // y10 Stoke nook back partition
  "..dddddddddd.....wpKKpwp", // y11 Stoke desk
  "..sbsbsbsbsb.....w.k..wp", // y12 Stoke seat
  "........................", // y13
  "........................", // y14
  "p......................p", // y15
];

export type Dir = "N" | "E" | "S" | "W";

export type TileKind =
  | "floor"
  | "seat"
  | "desk"
  | "cabinet"
  | "plant"
  | "partition"
  | "printer"
  | "coffee"
  | "queue"
  | "stokeDesk"
  | "stokeSeat";

const CHAR_KIND: Record<string, TileKind> = {
  ".": "floor",
  s: "seat",
  d: "desk",
  b: "cabinet",
  p: "plant",
  w: "partition",
  P: "printer",
  C: "coffee",
  q: "queue",
  K: "stokeDesk",
  k: "stokeSeat",
};

export type StationKind = "printer" | "coffee";

/** Queue tiles in service order: index 0 is the tile in front of the machine. */
const STATIONS: Record<StationKind, { machine: [number, number]; slots: [number, number][] }> = {
  printer: { machine: [15, 0], slots: [[15, 1], [16, 1], [17, 1]] },
  coffee: { machine: [23, 6], slots: [[22, 6], [22, 7], [22, 8]] },
};

/** Cubicle whose owner is the protagonist: the one nearest the Stoke nook. */
const PROTAGONIST_SEAT: [number, number] = [10, 12];

export interface Cubicle {
  id: number;
  seat: number;
  desk: [number, number];
  /** Direction the robot faces when sitting at this cubicle. */
  facing: Dir;
}

export interface StationLayout {
  kind: StationKind;
  machine: number;
  slots: number[];
  /** Direction a robot in slot 0 faces to use the machine. */
  serviceFacing: Dir;
}

export type FurnitureKind =
  | "desk"
  | "cabinet"
  | "plant"
  | "partition"
  | "printer"
  | "coffee"
  | "stokeDesk";

/** A 1x1 drawable piece. Multi-tile furniture is split into pieces. */
export interface FurniturePiece {
  tile: number;
  x: number;
  y: number;
  kind: FurnitureKind;
  /** Cubicle id for desk pieces, otherwise null. */
  deskId: number | null;
  /** Which piece of a two-tile desk this is (0 carries the monitor). */
  part: number;
  /** Direction the monitor screen faces (toward the seat), if any. */
  screenFacing: Dir | null;
}

export interface Layout {
  width: number;
  height: number;
  kinds: TileKind[];
  walkable: boolean[];
  /** Tiles paths may pass through. Seats and queue tiles are endpoints only. */
  transit: boolean[];
  cubicles: Cubicle[];
  protagonistCubicle: number;
  stokeSeat: number;
  stokeDeskTiles: number[];
  stokeFacing: Dir;
  stations: Record<StationKind, StationLayout>;
  furniture: FurniturePiece[];
}

export const DIRS: Record<Dir, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

export function dirBetween(fromX: number, fromY: number, toX: number, toY: number): Dir {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "E" : "W";
  return dy >= 0 ? "S" : "N";
}

function buildLayout(map: readonly string[]): Layout {
  const height = map.length;
  const width = map[0].length;
  const kinds: TileKind[] = [];
  for (let y = 0; y < height; y++) {
    if (map[y].length !== width) {
      throw new Error(`Office map row ${y} has ${map[y].length} tiles, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const kind = CHAR_KIND[map[y][x]];
      if (!kind) throw new Error(`Unknown office map tile '${map[y][x]}' at ${x},${y}`);
      kinds.push(kind);
    }
  }
  const idx = (x: number, y: number) => y * width + x;
  const kindAt = (x: number, y: number): TileKind | null =>
    x >= 0 && y >= 0 && x < width && y < height ? kinds[idx(x, y)] : null;

  const walkable = kinds.map(
    (k) => k === "floor" || k === "seat" || k === "queue" || k === "stokeSeat",
  );
  const transit = kinds.map((k) => k === "floor");

  // Cubicles: each seat sits directly above or below the first of its two desk tiles.
  const cubicles: Cubicle[] = [];
  const deskOwner = new Map<number, number>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (kinds[idx(x, y)] !== "seat") continue;
      const dy = kindAt(x, y + 1) === "desk" ? 1 : kindAt(x, y - 1) === "desk" ? -1 : 0;
      if (dy === 0 || kindAt(x + 1, y + dy) !== "desk") {
        throw new Error(`Seat at ${x},${y} has no two-tile desk next to it`);
      }
      const id = cubicles.length;
      const desk: [number, number] = [idx(x, y + dy), idx(x + 1, y + dy)];
      for (const t of desk) {
        if (deskOwner.has(t)) throw new Error(`Desk tile ${t} belongs to two cubicles`);
        deskOwner.set(t, id);
      }
      cubicles.push({ id, seat: idx(x, y), desk, facing: dy === 1 ? "S" : "N" });
    }
  }

  const stokeSeats = kinds.flatMap((k, i) => (k === "stokeSeat" ? [i] : []));
  const stokeDeskTiles = kinds.flatMap((k, i) => (k === "stokeDesk" ? [i] : []));
  if (stokeSeats.length !== 1 || stokeDeskTiles.length !== 2) {
    throw new Error("The office needs exactly one Stoke seat and a two-tile Stoke desk");
  }
  const stokeSeat = stokeSeats[0];
  const sx = stokeSeat % width;
  const sy = Math.floor(stokeSeat / width);
  const stokeFacing: Dir =
    kindAt(sx, sy - 1) === "stokeDesk" ? "N" : kindAt(sx, sy + 1) === "stokeDesk" ? "S" : "E";

  const queueTiles = new Set<number>();
  const stations = {} as Record<StationKind, StationLayout>;
  for (const kind of Object.keys(STATIONS) as StationKind[]) {
    const def = STATIONS[kind];
    const machine = idx(def.machine[0], def.machine[1]);
    if (kinds[machine] !== kind) throw new Error(`No ${kind} at ${def.machine.join(",")}`);
    const slots = def.slots.map(([x, y]) => {
      if (kindAt(x, y) !== "queue") throw new Error(`Queue tile ${x},${y} is not marked 'q'`);
      queueTiles.add(idx(x, y));
      return idx(x, y);
    });
    const [s0x, s0y] = def.slots[0];
    stations[kind] = {
      kind,
      machine,
      slots,
      serviceFacing: dirBetween(s0x, s0y, def.machine[0], def.machine[1]),
    };
  }
  kinds.forEach((k, i) => {
    if (k === "queue" && !queueTiles.has(i)) throw new Error(`Queue tile ${i} has no station`);
  });

  const protagonistCubicle = cubicles.findIndex(
    (c) => c.seat === idx(PROTAGONIST_SEAT[0], PROTAGONIST_SEAT[1]),
  );
  if (protagonistCubicle < 0) throw new Error("Protagonist seat is not a cubicle seat");

  const furniture: FurniturePiece[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = idx(x, y);
      const k = kinds[tile];
      if (walkable[tile]) continue;
      if (k === "desk") {
        const deskId = deskOwner.get(tile);
        if (deskId === undefined) throw new Error(`Desk tile ${x},${y} has no seat`);
        const cub = cubicles[deskId];
        const part = cub.desk.indexOf(tile);
        furniture.push({
          tile,
          x,
          y,
          kind: "desk",
          deskId,
          part,
          screenFacing: part === 0 ? (cub.facing === "S" ? "N" : "S") : null,
        });
      } else if (k === "stokeDesk") {
        furniture.push({
          tile,
          x,
          y,
          kind: "stokeDesk",
          deskId: null,
          part: stokeDeskTiles.indexOf(tile),
          screenFacing: stokeFacing === "N" ? "S" : "N",
        });
      } else {
        furniture.push({ tile, x, y, kind: k as FurnitureKind, deskId: null, part: 0, screenFacing: null });
      }
    }
  }

  return {
    width,
    height,
    kinds,
    walkable,
    transit,
    cubicles,
    protagonistCubicle,
    stokeSeat,
    stokeDeskTiles,
    stokeFacing,
    stations,
    furniture,
  };
}

export const OFFICE_LAYOUT: Layout = buildLayout(MAP);

export function tileX(layout: Layout, tile: number): number {
  return tile % layout.width;
}

export function tileY(layout: Layout, tile: number): number {
  return Math.floor(tile / layout.width);
}
