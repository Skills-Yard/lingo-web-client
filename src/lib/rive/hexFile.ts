import { useSyncExternalStore } from "react";
import { RiveFile, RuntimeLoader } from "@rive-app/canvas";
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
/** `hex.riv` parsed once; every canvas instantiates its artboard from it
 * instead of decoding the whole 5 MB file again. */
let sharedFile: RiveFile | null = null;
let preload: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Size of `hex.riv`, used when the server doesn't report a usable length
 * (compressed responses stream more bytes than `Content-Length` counts). */
const ESTIMATED_BYTES = 5_958_848;
/** Downloading is 95% of the bar; parsing the file fills the rest. */
const DOWNLOAD_SHARE = 0.95;

let progress = 0;
const progressListeners = new Set<() => void>();
const setProgress = (next: number) => {
  if (next <= progress) return;
  progress = next;
  progressListeners.forEach((listener) => listener());
};

const fetchHexRive = async (): Promise<ArrayBuffer> => {
  const response = await fetch(HEX_RIVE_SRC);
  if (!response.ok) throw new Error(`${HEX_RIVE_SRC}: HTTP ${response.status}`);
  if (!response.body) return response.arrayBuffer();

  const length = Number(response.headers.get("Content-Length"));
  const total = response.headers.get("Content-Encoding") || !length ? ESTIMATED_BYTES : length;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    setProgress(Math.min(received / total, 1) * DOWNLOAD_SHARE);
  }
  const all = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return all.buffer;
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
    .then(async ([loaded]) => {
      bytes = loaded;
      try {
        const file = new RiveFile({ buffer: loaded });
        await file.init();
        // Hold one reference for good, so the file outlives any canvas.
        file.getInstance();
        sharedFile = file;
      } catch (error) {
        console.error("Parsing hex.riv once failed; canvases will parse it themselves.", error);
      }
      setProgress(1);
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

/** What `useRive` loads `hex.riv` from: the shared parsed file once it's in,
 * else the preloaded bytes, else the URL (a page that didn't preload, or a
 * failed preload). */
export const hexRiveSource = ():
  | { riveFile: RiveFile }
  | { buffer: ArrayBuffer }
  | { src: string } => {
  if (sharedFile) return { riveFile: sharedFile };
  return bytes ? { buffer: bytes } : { src: HEX_RIVE_SRC };
};

/** How much of `hex.riv` is in, 0 to 1 (downloaded, then parsed); subscribing
 * starts the preload. 0 on the server. */
export const useHexRiveProgress = (): number =>
  useSyncExternalStore(
    (listener) => {
      progressListeners.add(listener);
      void preloadHexRive();
      return () => {
        progressListeners.delete(listener);
      };
    },
    () => progress,
    () => 0,
  );
