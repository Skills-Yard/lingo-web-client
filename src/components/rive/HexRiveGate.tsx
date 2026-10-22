"use client";

import type { ReactNode } from "react";
import { useHexRiveStatus } from "@/lib/rive/hexFile";
import { HexRiveLoading } from "./HexRiveLoading";

/**
 * Renders its children once `hex.riv` has been downloaded and parsed (once,
 * app-wide — see `hexFile.ts`), so every canvas below shares that one copy
 * instead of fetching and decoding its own. Passes straight through when the
 * file is already in (e.g. after onboarding). Meanwhile it shows the download progress. A failed preload doesn't block:
 * the canvases then load the file themselves.
 */
export function HexRiveGate({ children }: { children: ReactNode }) {
  return useHexRiveStatus() === "loading" ? <HexRiveLoading /> : children;
}
