import { useSyncExternalStore } from "react";
import { RiveFile, RuntimeLoader } from "@rive-app/canvas";
import {
  BATTERY,
  COMMAND_ROBOT,
  configureRiveRuntime,
  GEM,
  HEX_RIVE_SRC,
  PROGRESS_BAR,
  SEQUENCE_ROOM,
} from "./runtime";

// The cache is state: a hot reload would reset it and put the loading bar back
// over a running app. Editing this file reloads the page instead.
import.meta.turbopackHot?.decline();

/**
 * Every `.riv` the app draws, downloaded and parsed ONCE, up front, before any
 * screen mounts (see `RiveAssetsGate`, which sits in the root layout, so it holds
 * for whichever route the app is opened on).
 *
 * Why: a canvas that is given a URL (`useRive({ src })`) downloads the file and
 * parses all of it again — 130–180 ms per file on a desktop (measured), a second
 * or more on a phone, on the main thread, every time. `progressBar.riv` alone is
 * 13 MB and was parsed once for the progress bar, once for the button, once for
 * each flip card… That is the lag on a screen that has a new artboard. Making an
 * artboard from an already parsed file costs 0.2–9 ms, with or without warming
 * (measured), so the parsed `RiveFile` is the whole cache: no artboard needs
 * keeping separately. Every canvas and host takes its file from `riveSource()`.
 *
 * All files download at the same time (not one behind another), and are parsed as
 * they land, one at a time. A file that fails to download or parse never blocks
 * the app: `riveSource()` then hands back the URL and that canvas loads it itself.
 *
 * To add a `.riv` to the app, add it to `RIVE_FILES`. (One that isn't listed
 * still works, but is downloaded and parsed by every canvas that uses it — dev
 * builds warn.)
 */
export const RIVE_FILES = [
  // `bytes`: the decoded size, used for the progress bar until (or unless) the
  // server reports a usable `Content-Length` (it doesn't for compressed responses).
  { src: HEX_RIVE_SRC, bytes: 6_160_285 },
  { src: PROGRESS_BAR.src, bytes: 13_198_164 },
  { src: BATTERY.src, bytes: 6_830_856 },
  { src: SEQUENCE_ROOM.src, bytes: 3_314_628 },
  { src: COMMAND_ROBOT.src, bytes: 264_119 },
  { src: GEM.src, bytes: 96_439 },
] as const;

export type RiveFilesStatus = "loading" | "loaded";

type Entry = {
  src: string;
  /** Expected size, then the real one when the server reports it. */
  total: number;
  received: number;
  /** Downloaded and parsed (or given up on). */
  settled: boolean;
  buffer: ArrayBuffer | null;
  file: RiveFile | null;
  downloadMs: number;
  parseMs: number;
};

const entries = new Map<string, Entry>(
  RIVE_FILES.map(({ src, bytes }) => [
    src,
    { src, total: bytes, received: 0, settled: false, buffer: null, file: null, downloadMs: 0, parseMs: 0 },
  ]),
);

/** Downloading is 90% of the bar; parsing the file fills the rest. */
const DOWNLOAD_SHARE = 0.9;
/** A download that gets nothing for this long is given up on (its canvases load it themselves). */
const STALL_MS = 30_000;

let status: RiveFilesStatus = "loading";
let progress = 0;
let preload: Promise<void> | null = null;
const statusListeners = new Set<() => void>();
const progressListeners = new Set<() => void>();

const updateProgress = () => {
  let done = 0;
  let all = 0;
  entries.forEach((entry) => {
    all += entry.total;
    const downloaded = Math.min(entry.received / entry.total, 1);
    done += entry.total * (entry.settled ? 1 : downloaded * DOWNLOAD_SHARE);
  });
  const next = all ? done / all : 0;
  // Never backwards: a real `Content-Length` can replace an estimate mid-way.
  if (next <= progress) return;
  progress = next;
  progressListeners.forEach((listener) => listener());
};

/**
 * Production builds name each file `…?v=<content hash>` (see `next.config.ts`),
 * and the server lets the browser keep a versioned URL for a year: a file that
 * hasn't changed costs no request at all, and one that has can't be served stale.
 * Without a version (dev) the file is revalidated on every load instead, so a
 * replaced file shows up at once.
 */
const versions: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_RIVE_VERSIONS ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
})();

const download = async (entry: Entry): Promise<ArrayBuffer> => {
  const version = versions[entry.src];
  const url = version ? `${entry.src}?v=${version}` : entry.src;
  const controller = new AbortController();
  let stall = setTimeout(() => controller.abort(), STALL_MS);
  try {
    const response = await fetch(url, { cache: version ? "default" : "no-cache", signal: controller.signal });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    if (!response.body) return await response.arrayBuffer();

    const length = Number(response.headers.get("Content-Length"));
    // A compressed response streams more (decoded) bytes than `Content-Length` counts.
    if (length && !response.headers.get("Content-Encoding")) entry.total = length;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(stall);
      stall = setTimeout(() => controller.abort(), STALL_MS);
      chunks.push(value);
      entry.received += value.length;
      // Past the estimate (a file that has grown): keep the bar just short of full.
      if (entry.received > entry.total) entry.total = entry.received * 1.02;
      updateProgress();
    }
    const all = new Uint8Array(entry.received);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.length;
    }
    return all.buffer;
  } finally {
    clearTimeout(stall);
  }
};

/** Lets the browser paint the bar before the main thread is busy parsing. */
const yieldToPaint = () =>
  new Promise<void>((resolve) => {
    const fallback = setTimeout(resolve, 50);
    requestAnimationFrame(() => {
      clearTimeout(fallback);
      setTimeout(resolve, 0);
    });
  });

const parse = async (entry: Entry, buffer: ArrayBuffer): Promise<void> => {
  await yieldToPaint();
  const started = performance.now();
  try {
    const file = new RiveFile({ buffer });
    await file.init();
    // Hold one reference for good, so the file outlives any canvas that uses it.
    file.getInstance();
    entry.file = file;
  } catch (error) {
    console.error(`Parsing ${entry.src} once failed; canvases will parse it themselves.`, error);
  }
  entry.parseMs = performance.now() - started;
};

const finish = (next: RiveFilesStatus) => {
  status = next;
  statusListeners.forEach((listener) => listener());
};

const debugging = () => process.env.NODE_ENV !== "production" || window.location.search.includes("riveDebug");

/** Starts every download (only the first call does anything). */
export const preloadRiveFiles = (): Promise<void> => {
  if (preload) return preload;
  configureRiveRuntime();
  const started = performance.now();
  const runtime = RuntimeLoader.awaitInstance();
  // Parsing is serial: the files land in any order, and each waits for the one before.
  let parsing: Promise<void> = Promise.resolve();

  preload = Promise.all(
    [...entries.values()].map(async (entry) => {
      const downloadStarted = performance.now();
      try {
        const buffer = await download(entry);
        entry.downloadMs = performance.now() - downloadStarted;
        entry.buffer = buffer;
        await runtime;
        parsing = parsing.then(() => parse(entry, buffer));
        await parsing;
      } catch (error) {
        console.error(`Preloading ${entry.src} failed; each canvas will load it itself.`, error);
      } finally {
        // Whatever happened, this file is done; the bar must still be able to finish.
        entry.settled = true;
        updateProgress();
      }
    }),
  ).then(() => {
    progress = 1;
    progressListeners.forEach((listener) => listener());
    finish("loaded");
    if (debugging()) {
      console.info(
        `[rive] ${entries.size} files ready in ${Math.round(performance.now() - started)} ms`,
        [...entries.values()].map((entry) => ({
          file: entry.src,
          MB: Number((entry.received / 1e6).toFixed(2)),
          downloadMs: Math.round(entry.downloadMs),
          parseMs: Math.round(entry.parseMs),
          cached: entry.file ? "parsed" : entry.buffer ? "bytes only" : "FAILED",
        })),
      );
    }
  });
  return preload;
};

// Start as the app's code loads, not when the first component subscribes.
if (typeof window !== "undefined") void preloadRiveFiles();

const subscribeStatus = (listener: () => void) => {
  statusListeners.add(listener);
  void preloadRiveFiles();
  return () => {
    statusListeners.delete(listener);
  };
};

/** Where the preload stands; subscribing starts it. "loading" on the server. */
export const useRiveFilesStatus = (): RiveFilesStatus =>
  useSyncExternalStore(subscribeStatus, () => status, () => "loading");

/** How much of every file is in, 0 to 1 (downloaded, then parsed). 0 on the server. */
export const useRiveFilesProgress = (): number =>
  useSyncExternalStore(
    (listener) => {
      progressListeners.add(listener);
      void preloadRiveFiles();
      return () => {
        progressListeners.delete(listener);
      };
    },
    () => progress,
    () => 0,
  );

/**
 * What to give `new Rive()` / `useRive()` for `src`: the shared parsed file once
 * it's in, else the downloaded bytes, else the URL (a failed preload, or a file
 * that isn't in `RIVE_FILES`). Spread it into the options in place of `src`.
 */
export const riveSource = (src: string): { riveFile: RiveFile } | { buffer: ArrayBuffer } | { src: string } => {
  const entry = entries.get(src);
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[rive] ${src} is not in RIVE_FILES: every canvas will download and parse it again.`);
    }
    return { src };
  }
  if (entry.file) return { riveFile: entry.file };
  return entry.buffer ? { buffer: entry.buffer } : { src };
};
