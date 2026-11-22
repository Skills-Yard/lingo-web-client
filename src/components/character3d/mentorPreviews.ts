"use client";

import { useEffect, useSyncExternalStore } from "react";
import { disposeCharacter, loadCharacter, type Character } from "./character";
import type { CharacterId } from "./characterLook";

/*
 * The 3D characters the mentor picker (`MentorPicker`) shows on its card. Each is loaded when its
 * card first comes up and kept while the picker is open, so going back to one is instant; closing
 * the picker frees them all (`releaseMentorPreviews`). They are not the shared character the
 * screens draw (`sharedCharacter.ts`): the picker has a canvas of its own and can be opened from
 * any screen, where nothing is loaded yet.
 */

export type MentorPreview =
  | { status: "idle" }
  | { status: "loading"; fraction: number }
  | { status: "ready"; character: Character }
  | { status: "failed" };

type Entry = { preview: MentorPreview; controller: AbortController };

const IDLE: MentorPreview = { status: "idle" };

/** Downloading is this much of the bar; parsing and decoding the textures is the rest (as in `sharedCharacter.ts`). */
const DOWNLOAD_SHARE = 0.85;

/** How long a closed picker's characters are kept before their GPU memory is freed, so the canvas has let go of them first. */
const FREE_AFTER_MS = 1000;

const entries = new Map<CharacterId, Entry>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const settle = (id: CharacterId, controller: AbortController, preview: MentorPreview) => {
  // Released (or started again) meanwhile: this load is not wanted any more.
  if (entries.get(id)?.controller !== controller) {
    if (preview.status === "ready") disposeCharacter(preview.character.scene);
    return;
  }
  entries.set(id, { preview, controller });
  emit();
};

/** Starts loading `id` unless it is loading or loaded already (a failed one is tried again). */
const requestMentorPreview = (id: CharacterId) => {
  const current = entries.get(id);
  if (current && current.preview.status !== "failed") return;

  const controller = new AbortController();
  entries.set(id, { preview: { status: "loading", fraction: 0 }, controller });
  emit();
  loadCharacter({
    id,
    signal: controller.signal,
    onProgress: ({ phase, fraction }) =>
      settle(id, controller, { status: "loading", fraction: phase === "download" ? fraction * DOWNLOAD_SHARE : DOWNLOAD_SHARE }),
  }).then(
    (character) => settle(id, controller, { status: "ready", character }),
    (error: unknown) => {
      if (controller.signal.aborted) return;
      console.error(`The ${id} mentor couldn't be loaded.`, error);
      settle(id, controller, { status: "failed" });
    },
  );
};

/** Stops what is loading and frees what is loaded: for when the picker closes. */
export const releaseMentorPreviews = () => {
  const released = [...entries.values()];
  entries.clear();
  emit();
  for (const { preview, controller } of released) {
    controller.abort();
    if (preview.status === "ready") setTimeout(() => disposeCharacter(preview.character.scene), FREE_AFTER_MS);
  }
};

/** Where the 3D character for `id` stands; asking starts the load. */
export const useMentorPreview = (id: CharacterId): MentorPreview => {
  useEffect(() => requestMentorPreview(id), [id]);
  return useSyncExternalStore(subscribe, () => entries.get(id)?.preview ?? IDLE, () => IDLE);
};

/** Asks again for one that failed. */
export const retryMentorPreview = requestMentorPreview;
