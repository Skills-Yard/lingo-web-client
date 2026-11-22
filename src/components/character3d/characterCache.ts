"use client";

import { useEffect, useSyncExternalStore } from "react";
import { disposeCharacter, loadCharacter, type Character, type LoadProgress } from "./character";
import type { CharacterId } from "./characterLook";

/*
 * The characters of the screens that own their canvas: the `/character` viewer and the
 * `/choose-character` page. Each used to free its character the moment it closed, so opening either again
 * downloaded, parsed and decoded the same 7-15 MB file again, with its loading bar each time.
 * Here a character is kept for `KEEP_MS` after the last screen that showed it lets go, and
 * taken up again at once if one asks inside that time.
 *
 * Not for the shared character the 3D module's screens draw (`sharedCharacter.ts`): that one
 * is a canvas of its own, and a character's scene graph can only be in one canvas at a time,
 * so it stays a separate copy. The viewer and the `/choose-character` page are never open
 * together (the viewer has no battery), so they can share these.
 */

export type CachedCharacter =
  | ({ status: "loading" } & LoadProgress)
  | { status: "ready"; character: Character }
  | { status: "error"; message: string };

type Entry = {
  state: CachedCharacter;
  controller: AbortController;
  /** Screens showing it now. */
  users: number;
  freeTimer: ReturnType<typeof setTimeout> | undefined;
};

/**
 * How long a character stays after the last screen let go. Its decoded textures are the
 * cost (the girl's is 8192², over 250 MB), so this is minutes, not "for the visit".
 */
const KEEP_MS = 120_000;

/** What a screen sees before its character has been asked for. */
const START: CachedCharacter = { status: "loading", phase: "download", fraction: 0 };

const entries = new Map<CharacterId, Entry>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const update = (entry: Entry, state: CachedCharacter) => {
  entry.state = state;
  emit();
};

/** Frees a character nobody has shown for `KEEP_MS`: a load still going is stopped, a loaded one's GPU memory is released. */
const free = (id: CharacterId, entry: Entry) => {
  if (entries.get(id) !== entry || entry.users > 0) return;
  entries.delete(id);
  entry.controller.abort();
  if (entry.state.status === "ready") disposeCharacter(entry.state.character.scene);
  emit();
};

/** Starts loading `id`; the entry has no users yet. */
const start = (id: CharacterId): Entry => {
  const controller = new AbortController();
  const entry: Entry = { state: START, controller, users: 0, freeTimer: undefined };
  entries.set(id, entry);
  loadCharacter({
    id,
    signal: controller.signal,
    onProgress: (progress) => update(entry, { status: "loading", ...progress }),
  }).then(
    (character) => {
      // Freed meanwhile (nobody wanted it for `KEEP_MS`).
      if (entries.get(id) !== entry) return disposeCharacter(character.scene);
      update(entry, { status: "ready", character });
    },
    (error: unknown) => {
      if (controller.signal.aborted) return;
      console.error(`The ${id} character couldn't be loaded.`, error);
      update(entry, { status: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    },
  );
  return entry;
};

/** A screen starts showing `id`: loads it unless it is loaded or loading. Returns what lets go of it. */
const acquire = (id: CharacterId) => {
  const current = entries.get(id);
  // A failed one is tried again when a screen asks.
  const entry = current && current.state.status !== "error" ? current : start(id);
  clearTimeout(entry.freeTimer);
  entry.freeTimer = undefined;
  entry.users += 1;
  if (entry !== current) emit();

  return () => {
    const held = entries.get(id);
    if (!held) return;
    held.users -= 1;
    if (held.users > 0) return;
    held.freeTimer = setTimeout(() => free(id, held), KEEP_MS);
  };
};

/**
 * Where the character `id` stands: loading (how far), ready, or failed. Showing it keeps it
 * (and starts the load); once the screen goes, or asks for another, it stays for `KEEP_MS`.
 */
export const useCachedCharacter = (id: CharacterId): CachedCharacter => {
  useEffect(() => acquire(id), [id]);
  return useSyncExternalStore(subscribe, () => entries.get(id)?.state ?? START, () => START);
};

/** Loads a failed character again (the screen showing it keeps its hold on it). */
export const retryCachedCharacter = (id: CharacterId) => {
  const failed = entries.get(id);
  if (failed?.state.status !== "error") return;
  const next = start(id);
  next.users = failed.users;
  emit();
};
