/**
 * The home page's living office: a still photograph of a tabletop scale model (the plate), brought to life as an 8 fps
 * stop-motion cinemagraph. Pose patches, sprites and screen overlays are swapped on a fixed tick from a precomputed
 * timeline in public/office/geometry.json (built by the art-direction kit in direction/office-scene/kit/).
 *
 * At rest (tick 0, reduced motion, a hidden tab) the page is exactly the still. Joseph is the only interactive figure:
 * pointing at, focusing or tapping him dims the scene to a spotlight and raises a felt thought bubble, which opens the
 * projects dialog.
 */

type Box = readonly [x: number, y: number, w: number, h: number];

interface PoseLayer {
  kind: "pose";
  z: number;
  box?: Box;
  base?: string;
  baseOnlyAtRest?: boolean;
  frames: Record<string, { src: string; box: Box }>;
}

interface SpriteLayer {
  kind: "sprite";
  z: number;
  src: string;
  size: readonly [w: number, h: number];
}

interface ScreenLayer {
  kind: "screen";
  z: number;
  box: Box;
  mask: string;
  blur: number;
  text: { src: string; w: number; h: number; transform: string; ink: readonly number[]; yoff: number };
}

type Layer = PoseLayer | SpriteLayer | ScreenLayer;
/** A layer's state: a pose name, a sprite's centre, a screen state, or null for rest. */
type LayerState = string | readonly [number, number] | null;
type SceneState = Record<string, LayerState>;

interface Geometry {
  stage: { w: number; h: number; fps: number; plate: string };
  glow: { x: number; y: number; core: number; spill: number };
  layers: Record<string, Layer>;
  scenes: {
    joseph: {
      hit: Box;
      spot: { x: number; y: number; r: number };
      thought: { pieces: { src: string; box: Box }[] };
    };
  };
  rest: SceneState;
  timeline: { length: number; events: [tick: number, scene: string, state: SceneState][] };
  copy: { joseph: { label: string }; bubble: { label: string } };
}

interface LayerController {
  set(state: LayerState): void;
}

/**
 * Loads geometry.json from `base` and runs the scene inside `root` (the markup the home page renders) until `signal`
 * aborts, which removes everything it added and every listener.
 */
export async function startOffice(root: HTMLElement, base: URL, signal: AbortSignal): Promise<void> {
  const response = await fetch(new URL("geometry.json", base), { signal });
  if (!response.ok) throw new Error(`office geometry: ${response.status} ${response.statusText} for ${response.url}`);
  const G = (await response.json()) as Geometry;
  if (signal.aborted) return;

  const stage = required(root, "#stage");
  const dlg = required(root, "#projects") as HTMLDialogElement;
  const viewport = required(root, "#viewport");
  const added: Element[] = [];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, capture = false) =>
    window.addEventListener(type, fn, { signal, capture });
  signal.addEventListener("abort", () => added.forEach((n) => n.remove()));

  const W = G.stage.w;
  const H = G.stage.h;
  const url = (src: string) => new URL(src, base).href;
  const pct = (v: number, t: number) => `${(v / t) * 100}%`;
  const place = (e: HTMLElement, [x, y, w, h]: Box) => {
    e.style.left = pct(x, W);
    e.style.top = pct(y, H);
    e.style.width = pct(w, W);
    e.style.height = pct(h, H);
  };
  const img = (src: string, className = "") => {
    const i = new Image();
    i.alt = "";
    i.decoding = "sync";
    i.src = url(src);
    i.className = className;
    return i;
  };
  const add = <T extends Element>(parent: Element, child: T, before: Element | null = null): T => {
    parent.insertBefore(child, before);
    added.push(child);
    return child;
  };

  // ---------- layers, in z order ----------
  const L: Record<string, LayerController> = {};
  const josephLayer: { el: HTMLElement | null } = { el: null };
  for (const [id, d] of Object.entries(G.layers).sort((a, b) => a[1].z - b[1].z)) {
    if (d.kind === "pose") L[id] = poseLayer(id, d);
    else if (d.kind === "sprite") L[id] = spriteLayer(d);
    else L[id] = screenLayer(d);
  }

  function poseLayer(id: string, d: PoseLayer): LayerController {
    let host: HTMLElement = stage;
    if (d.box) {
      host = add(stage, document.createElement("div"));
      host.className = "layer";
      place(host, d.box);
      if (id === "joseph") josephLayer.el = host;
    }
    const box = d.box;
    const base = d.base ? add(host, img(d.base, "frame on")) : null; // drawn at rest (Joseph: his matte)
    const frames: Record<string, HTMLImageElement> = {};
    for (const [k, f] of Object.entries(d.frames)) {
      const i = img(f.src, "frame");
      if (box) {
        i.style.left = pct(f.box[0] - box[0], box[2]);
        i.style.top = pct(f.box[1] - box[1], box[3]);
        i.style.width = pct(f.box[2], box[2]);
        i.style.height = pct(f.box[3], box[3]);
      } else {
        place(i, f.box);
      }
      frames[k] = add(host, i);
    }
    let cur: string | null = null;
    return {
      set(s) {
        if (s !== null && typeof s !== "string") throw new Error(`pose layer ${id} got ${JSON.stringify(s)}`);
        if (s === cur) return;
        if (cur) frames[cur].classList.remove("on");
        if (s) frameOf(frames, s, id).classList.add("on");
        if (base && d.baseOnlyAtRest) base.classList.toggle("on", !s);
        cur = s;
      },
    };
  }

  function spriteLayer(d: SpriteLayer): LayerController {
    const i = add(stage, img(d.src));
    let cur: readonly [number, number] | null = null;
    return {
      set(c) {
        if (!Array.isArray(c)) throw new Error(`sprite layer got ${JSON.stringify(c)}`);
        const [x, y] = c as readonly [number, number];
        if (cur && x === cur[0] && y === cur[1]) return;
        cur = [x, y];
        place(i, [x - d.size[0] / 2, y - d.size[1] / 2, d.size[0], d.size[1]]);
      },
    };
  }

  function screenLayer(d: ScreenLayer): LayerController {
    const mk = (cls: string) => {
      const e = add(stage, document.createElement("div"));
      e.className = `scr ${cls}`;
      place(e, d.box);
      e.style.setProperty("mask-image", `url(${url(d.mask)})`);
      e.style.setProperty("-webkit-mask-image", `url(${url(d.mask)})`);
      return e;
    };
    const tint = mk("tint");
    const ink = mk("ink");
    const t = d.text;
    const txt = ink.appendChild(document.createElement("div"));
    txt.className = "txt";
    txt.style.width = `${t.w}px`;
    txt.style.height = `${t.h}px`;
    txt.style.transform = `scale(var(--s)) ${t.transform}`;
    txt.style.filter = `blur(${d.blur}px)`;
    txt.style.setProperty("--ink", `rgb(${t.ink.join(",")})`);
    txt.style.setProperty("--tex", `url(${url(t.src)})`);
    txt.style.setProperty("--yo", String(t.yoff));
    let cur: LayerState = null;
    return {
      set(s) {
        if (s !== null && typeof s !== "string") throw new Error(`screen layer got ${JSON.stringify(s)}`);
        if (s === cur) return;
        cur = s;
        tint.className = "scr tint";
        ink.className = "scr ink";
        if (!s) return;
        if (s[0] === "s") {
          ink.className = "scr ink lines on";
          txt.style.setProperty("--off", s.slice(1));
        } else if (s === "d1") ink.className = "scr ink d1 on";
        else tint.className = `scr tint on ${s}`;
      },
    };
  }

  // glow above the plate, under Joseph's layer
  if (!josephLayer.el) throw new Error("office geometry: no boxed joseph layer to put the glow under");
  const g = G.glow;
  for (const [id, r, sy] of [
    ["glow-spill", g.spill, 0.8],
    ["glow-core", g.core, 1],
  ] as const) {
    const e = add(stage, document.createElement("div"), josephLayer.el);
    e.className = "glow";
    e.id = id;
    place(e, [g.x - r, g.y - r * sy, r * 2, r * 2 * sy]);
  }
  const setUnit = () => stage.style.setProperty("--s", String(stage.offsetWidth / W)); // stage px -> CSS px
  setUnit();
  on("resize", setUnit);
  const setGlow = (v: number, lit: number) => {
    stage.style.setProperty("--g", v.toFixed(3));
    stage.style.setProperty("--on", lit.toFixed(3));
  };

  // ---------- timeline ----------
  const LEN = G.timeline.length;
  const byTick = new Map<number, SceneState[]>();
  for (const [t, , st] of G.timeline.events) {
    const list = byTick.get(t) ?? [];
    list.push(st);
    byTick.set(t, list);
  }
  const applyState = (st: SceneState) => {
    for (const [id, v] of Object.entries(st)) {
      const layer = L[id];
      if (!layer) throw new Error(`office timeline names unknown layer ${id}`);
      layer.set(v);
    }
  };
  const toRest = () => applyState(G.rest);
  let tick = 0;
  // the glow flickers in 8 fps steps like everything else (a random walk toward a new target), off at rest
  let glowV = 0.5;
  let glowT = 0.5;
  let glowOn = 0;
  const glowStep = () => {
    if (Math.random() < 0.45) glowT = 0.35 + Math.random() * 0.65 * (Math.random() < 0.12 ? 0.5 : 1);
    glowV += (glowT - glowV) * 0.55;
    glowOn = Math.min(1, glowOn + 1 / 6);
    setGlow(glowV, glowOn);
  };
  const step = () => {
    const t = tick % LEN;
    if (t === 0) toRest();
    byTick.get(t)?.forEach(applyState);
    glowStep();
    tick++;
  };

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const TICK = 1000 / G.stage.fps;
  let raf = 0;
  let last = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (!last) last = t;
    while (t - last >= TICK) {
      last += TICK;
      step();
    }
  };
  const start = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    tick = 0;
    toRest();
    glowOn = 0;
    setGlow(0.5, 0);
  };
  toRest();
  setGlow(0.5, 0);
  const apply = () => (reducedMotion.matches || document.hidden ? stop() : start());
  reducedMotion.addEventListener("change", apply, { signal });
  document.addEventListener("visibilitychange", apply, { signal });
  signal.addEventListener("abort", () => cancelAnimationFrame(raf));
  apply();

  // ---------- spotlight on Joseph ----------
  const J = G.scenes.joseph;
  stage.style.setProperty("--cx", pct(J.spot.x, W));
  stage.style.setProperty("--cy", pct(J.spot.y, H));
  stage.style.setProperty("--rx", pct(J.spot.r, W));
  stage.style.setProperty("--ry", pct(J.spot.r, H)); // a circle on screen
  const spotDim = add(stage, document.createElement("div"));
  spotDim.id = "spot-dim";
  spotDim.className = "spot";
  const spotWarm = add(stage, document.createElement("div"));
  spotWarm.id = "spot-warm";
  spotWarm.className = "spot";

  const jb = add(stage, document.createElement("button"));
  jb.type = "button";
  jb.className = "hit";
  jb.id = "hit-joseph";
  place(jb, J.hit);
  jb.setAttribute("aria-label", G.copy.joseph.label);
  jb.setAttribute("aria-expanded", "false");
  jb.setAttribute("aria-controls", "thought");

  // ---------- thought bubble: the felt prop (balls, then cloud); a button over the cloud ----------
  const wrap = add(stage, document.createElement("div"), spotDim);
  wrap.id = "thought-wrap";
  for (const p of J.thought.pieces) place(wrap.appendChild(img(p.src)), p.box);
  const cloud = J.thought.pieces.at(-1);
  if (!cloud) throw new Error("office geometry: the thought bubble has no pieces");
  const tb = add(stage, document.createElement("button"));
  tb.type = "button";
  tb.id = "thought";
  tb.setAttribute("aria-label", G.copy.bubble.label);
  tb.setAttribute("aria-haspopup", "dialog");
  tb.setAttribute("aria-controls", "projects");
  place(tb, cloud.box);

  // Spotlight state. On while the mouse is over Joseph or his bubble, while either has keyboard focus, or while pinned
  // (a tap, Enter/Space, or coming back from the projects). A tap elsewhere or Escape turns it off.
  let hover = false;
  let kbFocus = false;
  let pinned = false;
  let softPin = false;
  let dismissed = false;
  let leaveT = 0;
  let lit = false;
  let dragged = false;
  const mine = (n: EventTarget | null) => n === jb || n === tb;
  const render = () => {
    const shown = dlg.open ? lit : !dismissed && (pinned || hover || kbFocus);
    if (shown === lit) return;
    lit = shown;
    stage.classList.toggle("lit", shown);
    jb.setAttribute("aria-expanded", String(shown));
  };
  signal.addEventListener("abort", () => {
    clearTimeout(leaveT);
    stage.classList.remove("lit");
  });
  const enter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(leaveT);
    hover = true;
    dismissed = false;
    render();
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(leaveT);
    leaveT = window.setTimeout(() => {
      hover = false;
      render();
    }, 350);
  };
  const focusIn = (e: FocusEvent) => {
    if (!(e.target instanceof Element) || !e.target.matches(":focus-visible")) return;
    kbFocus = true;
    dismissed = false;
    render();
  };
  const focusOut = (e: FocusEvent) => {
    if (mine(e.relatedTarget)) return;
    kbFocus = false;
    render();
  };
  for (const n of [jb, tb]) {
    n.addEventListener("pointerenter", enter, { signal });
    n.addEventListener("pointerleave", leave, { signal });
    n.addEventListener("focus", focusIn, { signal });
    n.addEventListener("blur", focusOut, { signal });
  }
  let lastPointer = "mouse";
  on("pointerdown", (e) => (lastPointer = e.pointerType), true);
  on("keydown", () => (lastPointer = "keyboard"), true);
  on("pointermove", (e) => {
    // after closing the projects with a mouse, the pool stays until the mouse moves off him
    if (softPin && e.pointerType === "mouse" && !mine(e.target)) {
      softPin = pinned = false;
      render();
    }
  });

  // ---------- projects dialog (its catalogue is rendered by the page) ----------
  const close = required(dlg, ".close");
  const sheet = required(dlg, ".sheet");
  let opener: HTMLElement | null = null;
  const openProjects = (from: HTMLElement) => {
    opener = from;
    softPin = false;
    if (mine(from)) {
      pinned = true;
      dismissed = false;
      render();
    }
    dlg.showModal();
    sheet.scrollTop = 0;
    close.focus();
  };
  close.addEventListener("click", () => dlg.close(), { signal });
  // the backdrop (the close button and the sheet fill the dialog)
  dlg.addEventListener("click", (e) => e.target === dlg && dlg.close(), { signal });
  dlg.addEventListener(
    "close",
    () => {
      if (!opener) return;
      if (mine(opener)) {
        pinned = true; // back to the scene as it was: pool and bubble up
        softPin = lastPointer === "mouse";
      }
      render();
      opener.focus({ preventScroll: true });
      opener = null;
    },
    { signal },
  );
  signal.addEventListener("abort", () => dlg.open && dlg.close());
  for (const b of root.querySelectorAll<HTMLElement>("[data-open-projects]")) {
    b.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        openProjects(b);
      },
      { signal },
    );
  }

  jb.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();
      if (dragged) return;
      const keyboard = e.detail === 0;
      if (keyboard || !lit || (lastPointer !== "mouse" && !pinned)) {
        pinned = true;
        softPin = false;
        dismissed = false;
        render();
        return;
      }
      openProjects(jb); // a mouse click on him (the bubble is already up), or a second tap
    },
    { signal },
  );
  tb.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();
      if (!dragged) openProjects(tb);
    },
    { signal },
  );
  document.addEventListener(
    "click",
    (e) => {
      if (dragged || dlg.open || mine(e.target)) return;
      pinned = softPin = false;
      render();
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || dlg.open || !lit) return;
      if (document.activeElement === tb) jb.focus({ preventScroll: true }); // the bubble is going away: keep focus on him
      pinned = softPin = false;
      dismissed = true;
      render();
    },
    { signal },
  );

  // ---------- pan: centred on Joseph at load; mouse drag pans (touch pans natively) ----------
  const jx = J.hit[0] + J.hit[2] / 2;
  const centre = () => {
    viewport.scrollLeft = stage.offsetWidth * (jx / W) - viewport.clientWidth / 2;
  };
  centre();
  on("load", centre);
  let down: { x: number; s: number } | null = null;
  viewport.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = { x: e.clientX, s: viewport.scrollLeft };
      dragged = false;
    },
    { signal },
  );
  on("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!dragged && Math.abs(dx) > 6 && viewport.scrollWidth > viewport.clientWidth) {
      dragged = true;
      viewport.classList.add("dragging");
    }
    if (dragged) viewport.scrollLeft = down.s - dx;
  });
  on("pointerup", () => {
    if (!down) return;
    down = null;
    viewport.classList.remove("dragging");
    window.setTimeout(() => (dragged = false), 0);
  });
}

function required(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`office scene: missing ${selector}`);
  return el;
}

function frameOf(frames: Record<string, HTMLImageElement>, name: string, layer: string): HTMLImageElement {
  const f = frames[name];
  if (!f) throw new Error(`office layer ${layer} has no frame ${name}`);
  return f;
}
