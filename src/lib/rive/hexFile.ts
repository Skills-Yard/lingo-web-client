import { useSyncExternalStore } from "react";
import { RuntimeLoader } from "@rive-app/canvas";
import { configureRiveRuntime, HEX_RIVE_SRC } from "./runtime";

/**
 * `hex.riv` (~5 MB) downloaded once, up front, together with the Rive WASM
 * runtime. Every Hex canvas used to fetch the file on its own when it
 * mounted, so on a slow connection they popped in one by one — and the
 * splash's timer ran out (firing its sign-up trigger into a canvas that had
 * nothing loaded yet) before the splash had even appeared. The onboarding
 * waits for `useHexRiveStatus()` to leave "loading", and every canvas then
 * loads from these bytes (`hexRiveSource`) instead of the network.
 */
export type HexRiveStatus = "loading" | "loaded" | "failed";

let status: HexRiveStatus = "loading";
let bytes: ArrayBuffer | null = null;
let preload: Promise<void> | null = null;
const listeners = new Set<() => void>();

const fetchHexRive = async (): Promise<ArrayBuffer> => {
  const response = await fetch(HEX_RIVE_SRC);
  if (!response.ok) throw new Error(`${HEX_RIVE_SRC}: HTTP ${response.status}`);
  return response.arrayBuffer();
};

const settle = (next: HexRiveStatus) => {
  status = next;
  listeners.forEach((listener) => listener());
};

/** Starts the download (only the first call does anything). On failure the
 * canvases fall back to fetching `HEX_RIVE_SRC` themselves. */
export const preloadHexRive = (): Promise<void> => {
  if (preload) return preload;
  configureRiveRuntime();
  preload = Promise.all([fetchHexRive(), RuntimeLoader.awaitInstance()])
    .then(([loaded]) => {
      bytes = loaded;
      settle("loaded");
    })
    .catch((error: unknown) => {
      console.error("Preloading hex.riv failed; each canvas will fetch it itself.", error);
      settle("failed");
    });
  return preload;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  void preloadHexRive();
  return () => {
    listeners.delete(listener);
  };
};

/** Where the preload stands; subscribing starts it. "loading" on the server. */
export const useHexRiveStatus = (): HexRiveStatus =>
  useSyncExternalStore(
    subscribe,
    () => status,
    () => "loading",
  );

/** What `useRive` loads `hex.riv` from: the preloaded bytes once they're in,
 * the URL otherwise (a page that didn't preload, or a failed preload). */
export const hexRiveSource = (): { buffer: ArrayBuffer } | { src: string } =>
  bytes ? { buffer: bytes } : { src: HEX_RIVE_SRC };
