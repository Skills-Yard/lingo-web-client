"use client";

import { useCallback } from "react";
import { useCachedCharacter, retryCachedCharacter, type CachedCharacter } from "./characterCache";
import { useCharacterLook } from "./characterLook";

export type CharacterState = CachedCharacter;

/**
 * The character the learner picked (see `characterLook.ts`; another pick shows that one
 * instead). It comes from the cache (`characterCache.ts`), so coming back to `/character`
 * soon after leaving it shows the character at once instead of loading it again; it is freed
 * a couple of minutes after the page is left, and a load still going is stopped then.
 */
export const useCharacter = () => {
  const { character: id } = useCharacterLook();
  const state = useCachedCharacter(id);
  const retry = useCallback(() => retryCachedCharacter(id), [id]);
  return { state, retry };
};
