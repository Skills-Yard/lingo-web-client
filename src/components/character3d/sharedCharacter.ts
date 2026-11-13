"use client";

import { useSyncExternalStore } from "react";
import { loadCharacter, type Character } from "./character";

/**
 * One copy of the character for a whole visit, for screens that show it as a picture
 * (see `CharacterPortrait`) and are each a page of their own: a character loaded by each
 * would be downloaded, parsed and have its textures decoded again on every screen, and
 * show up late on each. Here it is loaded once, started by whoever asks first (a loading
 * gate, ahead of the screens), and every screen after takes the finished one. It is never
 * freed: the viewer on `/character` has its own (`useCharacter`).
 */

type SharedCharacter = {
  character: Character | null;
  /** 0 to 1: downloading is most of it, then preparing. */
  fraction: number;
  /** Loaded, or given up on (`character` is then null: the screens go without it). */
  settled: boolean;
};

/** Downloading is this much of the bar; parsing and decoding the textures is the rest. */
const DOWNLOAD_SHARE = 0.85;

const INITIAL: SharedCharacter = { character: null, fraction: 0, settled: false };

let state = INITIAL;
let started = false;
const listeners = new Set<() => void>();

const update = (next: SharedCharacter) => {
  state = next;
  listeners.forEach((listener) => listener());
};

/** Starts loading the character (only the first call does anything). */
export const preloadCharacter = () => {
  if (started) return;
  started = true;
  loadCharacter({
    signal: new AbortController().signal,
    onProgress: ({ phase, fraction }) =>
      update({ ...state, fraction: phase === "download" ? fraction * DOWNLOAD_SHARE : DOWNLOAD_SHARE }),
  }).then(
    (character) => update({ character, fraction: 1, settled: true }),
    (error: unknown) => {
      console.error("The character couldn't be loaded; screens go without it.", error);
      update({ ...state, settled: true });
    },
  );
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  preloadCharacter();
  return () => {
    listeners.delete(listener);
  };
};

/** Where the shared character stands; asking starts the load. Nothing loaded on the server. */
export const useSharedCharacter = (): SharedCharacter => useSyncExternalStore(subscribe, () => state, () => INITIAL);
