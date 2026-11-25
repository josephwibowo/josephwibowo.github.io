"use client";

import { useEffect } from "react";
import { startOffice } from "./scene";

/**
 * Brings the server-rendered office to life. The plate, the intro and the projects catalogue are plain HTML that work
 * without it; this adds the stop-motion layers, the spotlight on Joseph and the dialog's behaviour.
 */
export function OfficeScene({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) throw new Error(`office scene: no #${rootId} on the page`);
    const controller = new AbortController();
    // Assets sit in public/office/ and load relative to this page, so the scene works under any base path.
    const base = new URL("office/", document.baseURI);
    startOffice(root, base, controller.signal).catch((error: unknown) => {
      if (controller.signal.aborted) return; // torn down mid-load (a re-mount), not a failure
      reportError(error);
    });
    return () => controller.abort();
  }, [rootId]);

  return null;
}
