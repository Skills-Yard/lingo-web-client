"use client";

import { useSyncExternalStore } from "react";

/*
 * Which 3D character is shown: the learner's choice, kept in local storage and changed
 * from the battery's hold menu (see `BatteryMenu`). Kept apart from the character's code
 * (which pulls in three.js) so that menu, which is on nearly every screen, doesn't.
 */

export const CHARACTER_CHOICES = [
  { id: "girl", label: "Girl" },
  { id: "boy", label: "Boy" },
  { id: "anime", label: "Anime" },
] as const;

export type CharacterId = (typeof CHARACTER_CHOICES)[number]["id"];

type Look = { character: CharacterId };

const DEFAULT_LOOK: Look = { character: "girl" };
const STORAGE_KEY = "lingo.character-look";

const isCharacterId = (value: unknown): value is CharacterId => CHARACTER_CHOICES.some(({ id }) => id === value);

const read = (): Look => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (typeof saved !== "object" || saved === null) return DEFAULT_LOOK;
    const { character } = saved as Record<string, unknown>;
    // "male" was the anime model's id before there were three choices.
    if (character === "male") return { character: "anime" };
    return { character: isCharacterId(character) ? character : DEFAULT_LOOK.character };
  } catch {
    return DEFAULT_LOOK;
  }
};

/** Read from storage the first time it is asked for (in the browser only), then kept here. */
let look: Look | null = null;
/** The character being loaded for the choice, while it is not yet the one on show. */
let loading: CharacterId | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const getCharacterLook = (): Look => (look ??= read());

const update = (patch: Partial<Look>) => {
  look = { ...getCharacterLook(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  emit();
};

export const setCharacter = (character: CharacterId) => update({ character });

export const subscribeLook = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Said by the loader: which character the menu is waiting for (`null`: none). */
export const setCharacterLoading = (id: CharacterId | null) => {
  if (loading === id) return;
  loading = id;
  emit();
};

export const useCharacterLook = (): Look => useSyncExternalStore(subscribeLook, getCharacterLook, () => DEFAULT_LOOK);

export const useCharacterLoading = (): CharacterId | null => useSyncExternalStore(subscribeLook, () => loading, () => null);
