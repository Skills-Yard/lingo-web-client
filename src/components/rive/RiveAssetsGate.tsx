"use client";

import type { ReactNode } from "react";
import { useRiveFilesStatus } from "@/lib/rive/riveCache";
import { RiveLoading } from "./RiveLoading";

/**
 * Renders its children once every `.riv` the app draws has been downloaded and
 * parsed (once, app-wide — see `riveCache.ts`), so every canvas below takes its
 * file from that one copy instead of downloading and parsing its own, and no
 * screen has to wait for an animation while it is being played. It sits in the
 * root layout, so it holds for any route the app is opened on, and passes
 * straight through once the files are in (every navigation after the first).
 * Meanwhile it shows the loading bar. A file that fails to load doesn't block:
 * its canvases then load it themselves.
 */
export function RiveAssetsGate({ children }: { children: ReactNode }) {
  return useRiveFilesStatus() === "loading" ? <RiveLoading /> : children;
}
