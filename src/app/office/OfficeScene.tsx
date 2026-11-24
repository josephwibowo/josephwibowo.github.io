"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createOfficeController, type OfficeController } from "@/office/controller";
import type { PanelInfo } from "@/office/interaction/describe";
import { CANVAS_LABEL, FOUNDER_INTRO, STOKE_DESCRIPTION, STOKE_TITLE, STOKE_URL } from "@/office/content";

export default function OfficeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<OfficeController | null>(null);
  const [info, setInfo] = useState<PanelInfo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const controller = createOfficeController(canvas, container, { onInfo: setInfo });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={CANVAS_LABEL}
          className="block h-full w-full touch-manipulation"
        />
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-4 font-mono text-xs text-muted-foreground"
      >
        Robot office · prototype · tap a robot or a desk
      </p>
      {info && <InfoPanel info={info} onClose={() => controllerRef.current?.clearSelection()} />}
    </div>
  );
}

function InfoPanel({ info, onClose }: { info: PanelInfo; onClose: () => void }) {
  return (
    <section
      aria-live="polite"
      className="absolute inset-x-4 bottom-4 rounded-xl border border-border bg-card/95 p-4 text-sm text-card-foreground shadow-xl backdrop-blur sm:left-auto sm:right-6 sm:bottom-6 sm:w-80"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      {info.kind === "founder" && (
        <>
          <h2 className="mb-2 pr-6 text-base font-semibold">Meet the founder</h2>
          <p className="mb-2 text-muted-foreground">{FOUNDER_INTRO}</p>
          <p className="mb-2 text-muted-foreground">Right now: {info.activity}.</p>
          <p className="mb-3">
            <span className="font-medium">{STOKE_TITLE}</span>
            <span className="text-muted-foreground">: {STOKE_DESCRIPTION}</span>
          </p>
          <a
            href={STOKE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Visit Stoke Money ↗
          </a>
        </>
      )}
      {info.kind === "robot" && (
        <>
          <h2 className="mb-2 pr-6 font-mono text-base font-semibold">{info.name}</h2>
          <p className="text-muted-foreground">Right now: {info.activity}.</p>
        </>
      )}
      {info.kind === "desk" && (
        <>
          <h2 className="mb-2 pr-6 text-base font-semibold">{possessive(info.owner)} desk</h2>
          <p className="text-muted-foreground">
            {info.owner} is {info.activity}.
          </p>
        </>
      )}
    </section>
  );
}

function possessive(name: string): string {
  return `${name}'s`;
}
