/**
 * Wires the simulation, renderer and pointer selection to a canvas: the frame
 * loop, page-visibility pausing, the reduced-motion static frame and fitting.
 */
import { buildFurnitureTargets, hitTest, type Selection } from "./interaction/hitTest";
import { describeSelection, type PanelInfo } from "./interaction/describe";
import { createRenderer } from "./render/renderer";
import { OFFICE_LAYOUT } from "./sim/layout";
import { OFFICE_SEED, REDUCED_MOTION_TICKS, SIM_DT, advanceWorld, createWorld, stepWorld } from "./sim/world";

/** Longest frame delta fed to the simulation, in seconds. */
export const MAX_FRAME_DELTA = 0.25;
/** Minimum robot tap target in CSS pixels. */
const MIN_TAP_SIZE = 28;
/** How often (in simulated seconds) the open panel's text is refreshed. */
const PANEL_REFRESH = 0.25;

export interface OfficeController {
  clearSelection(): void;
  destroy(): void;
}

export interface OfficeControllerOptions {
  /** Called when the selection or the selected thing's description changes. */
  onInfo(info: PanelInfo | null): void;
}

export function createOfficeController(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  { onInfo }: OfficeControllerOptions,
): OfficeController {
  const layout = OFFICE_LAYOUT;
  const renderer = createRenderer(canvas, layout);
  const targets = buildFurnitureTargets(layout);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;
  const world = createWorld(OFFICE_SEED);
  if (reduced) advanceWorld(world, REDUCED_MOTION_TICKS);

  let selection: Selection = null;
  let rafId = 0;
  let lastTimestamp: number | null = null;
  let accumulator = 0;
  let alpha = 1;
  let lastInfoKey = "";
  let lastInfoTime = 0;
  let destroyed = false;

  const isAnimating = () => !reduced && !document.hidden && !destroyed;

  function publishInfo(): void {
    const info = describeSelection(world, selection);
    const key = JSON.stringify(info);
    if (key === lastInfoKey) return;
    lastInfoKey = key;
    onInfo(info);
  }

  function frame(timestamp: number): void {
    rafId = 0;
    if (!isAnimating()) return;
    // The first frame after (re)starting has zero delta, so nothing fast-forwards.
    const dt = lastTimestamp === null ? 0 : Math.min((timestamp - lastTimestamp) / 1000, MAX_FRAME_DELTA);
    lastTimestamp = timestamp;
    accumulator += dt;
    while (accumulator >= SIM_DT) {
      stepWorld(world);
      accumulator -= SIM_DT;
    }
    alpha = accumulator / SIM_DT;
    renderer.draw(world, alpha, selection);
    if (selection && world.time - lastInfoTime >= PANEL_REFRESH) {
      lastInfoTime = world.time;
      publishInfo();
    }
    rafId = requestAnimationFrame(frame);
  }

  function start(): void {
    if (rafId || !isAnimating()) return;
    lastTimestamp = null;
    rafId = requestAnimationFrame(frame);
  }

  function stop(): void {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastTimestamp = null;
  }

  function redrawStill(): void {
    renderer.draw(world, alpha, selection);
  }

  function setSelection(next: Selection): void {
    selection = next;
    publishInfo();
    if (!isAnimating()) redrawStill();
  }

  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  const onMotionChange = (e: MediaQueryListEvent) => {
    reduced = e.matches;
    if (reduced) {
      stop();
      alpha = 1;
      redrawStill();
    } else {
      start();
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const { sx, sy } = renderer.toScene(e.clientX - rect.left, e.clientY - rect.top);
    setSelection(
      hitTest(sx, sy, renderer.agentHitBoxes, layout, renderer.geometry, targets, MIN_TAP_SIZE / renderer.scale),
    );
  };

  const resizeObserver = new ResizeObserver(() => {
    const rect = container.getBoundingClientRect();
    renderer.resize(rect.width, rect.height, window.devicePixelRatio);
    redrawStill();
  });

  resizeObserver.observe(container);
  document.addEventListener("visibilitychange", onVisibility);
  motionQuery.addEventListener("change", onMotionChange);
  canvas.addEventListener("pointerdown", onPointerDown);
  start();

  return {
    clearSelection() {
      setSelection(null);
    },
    destroy() {
      destroyed = true;
      stop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
