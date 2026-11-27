"use client";

import { useSyncExternalStore } from "react";
import { disposeCharacter, loadCharacter, type Character } from "./character";
import { getCharacterLook, setCharacterLoading, subscribeLook, type CharacterId } from "./characterLook";

/**
 * One copy of the character for a whole visit, for screens that show it as a picture
 * (see `CharacterPortrait`) and are each a page of their own: a character loaded by each
 * would be downloaded, parsed and have its textures decoded again on every screen, and
 * show up late on each. Here it is loaded once, started by whoever asks first (a loading
 * gate, ahead of the screens), and every screen after takes the finished one. The viewer
 * on `/character` has its own (`useCharacter`).
 *
 * When the learner picks the other character (see `characterLook.ts`) it is loaded in
 * the background while the first stays on show, then the screens switch to it and the
 * first is freed (a little later, once the canvas has let go of it).
 */

type SharedCharacter = {
  character: Character | null;
  /** 0 to 1: downloading is most of it, then preparing. */
  fraction: number;
  /** Loaded, or given up on (`character` is then null: the screens go without it). */
  settled: boolean;
};

type Entry = { character: Character | null; fraction: number; failed: boolean };

/** Downloading is this much of the bar; parsing and decoding the textures is the rest. */
const DOWNLOAD_SHARE = 0.85;

/** How long a character that was switched away from is kept before its GPU memory is freed. */
const FREE_AFTER_MS = 1000;

const INITIAL: SharedCharacter = { character: null, fraction: 0, settled: false };

const entries = new Map<CharacterId, Entry>();
/** The character the screens draw. */
let shownId: CharacterId | null = null;
let state = INITIAL;
let started = false;
const listeners = new Set<() => void>();

/** What the screens, and the loading gate, see: the character on show; before the first, how far it has got. */
const publish = () => {
  const shown = shownId ? entries.get(shownId) : undefined;
  const first = entries.get(getCharacterLook().character);
  const next: SharedCharacter = shown?.character
    ? { character: shown.character, fraction: 1, settled: true }
    : { character: null, fraction: first?.fraction ?? 0, settled: !!first?.failed };
  if (next.character === state.character && next.fraction === state.fraction && next.settled === state.settled) return;
  state = next;
  listeners.forEach((listener) => listener());
};

const patch = (id: CharacterId, change: Partial<Entry>) => {
  const entry = entries.get(id);
  if (entry) entries.set(id, { ...entry, ...change });
  publish();
};

/** Puts `id` on the screens, and frees the character that was there. */
const show = (id: CharacterId) => {
  const previousId = shownId;
  shownId = id;
  setCharacterLoading(null);
  publish();
  if (!previousId || previousId === id) return;
  const previous = entries.get(previousId)?.character;
  entries.delete(previousId);
  if (previous) setTimeout(() => disposeCharacter(previous.scene), FREE_AFTER_MS);
};

/** Makes `id` the character on show: at once if it is loaded, else once it has loaded. */
const select = (id: CharacterId) => {
  // Already on show (also: picked back before the other one finished loading).
  if (shownId === id) return setCharacterLoading(null);
  const entry = entries.get(id);
  if (entry?.character) return show(id);
  if (entry && !entry.failed) return setCharacterLoading(id);

  entries.set(id, { character: null, fraction: 0, failed: false });
  setCharacterLoading(id);
  loadCharacter({
    id,
    signal: new AbortController().signal,
    onProgress: ({ phase, fraction }) => patch(id, { fraction: phase === "download" ? fraction * DOWNLOAD_SHARE : DOWNLOAD_SHARE }),
  }).then(
    (character) => {
      // The learner picked another one meanwhile: this one is not wanted any more.
      if (getCharacterLook().character !== id) {
        entries.delete(id);
        disposeCharacter(character.scene);
        return;
      }
      patch(id, { character, fraction: 1 });
      show(id);
    },
    (error: unknown) => {
      console.error(`The ${id} character couldn't be loaded; the screens keep what they have.`, error);
      patch(id, { failed: true });
      setCharacterLoading(null);
    },
  );
};

/** Starts loading the learner's character (only the first call does anything), and follows what they pick after. */
export const preloadCharacter = () => {
  if (started) return;
  started = true;
  select(getCharacterLook().character);
  subscribeLook(() => select(getCharacterLook().character));
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
