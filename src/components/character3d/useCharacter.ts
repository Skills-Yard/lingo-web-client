"use client";

import { useCallback, useEffect, useState } from "react";
import { disposeCharacter, loadCharacter, type Character, type LoadProgress } from "./character";
import { useCharacterLook } from "./characterLook";

export type CharacterState =
  | ({ status: "loading" } & LoadProgress)
  | { status: "ready"; character: Character }
  | { status: "error"; message: string };

const LOADING: CharacterState = { status: "loading", phase: "download", fraction: 0 };

/**
 * Downloads and prepares the character the learner picked (see `characterLook.ts`;
 * another pick loads that one instead). The GPU memory it holds (its geometry,
 * skeleton and any textures) is freed when the page unmounts or the pick changes,
 * and a load still in flight is aborted.
 */
export const useCharacter = () => {
  const { character: id } = useCharacterLook();
  const [state, setState] = useState<CharacterState>(LOADING);
  const [attempt, setAttempt] = useState(0);
  // A different pick starts from loading again (state set while rendering, as React allows for state that follows a prop).
  const [loadedFor, setLoadedFor] = useState(id);
  if (loadedFor !== id) {
    setLoadedFor(id);
    setState(LOADING);
  }

  useEffect(() => {
    const controller = new AbortController();
    let loaded: Character | null = null;

    loadCharacter({
      id,
      signal: controller.signal,
      onProgress: (progress) => setState({ status: "loading", ...progress }),
    }).then(
      (character) => {
        if (controller.signal.aborted) {
          disposeCharacter(character.scene);
          return;
        }
        loaded = character;
        setState({ status: "ready", character });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Something went wrong.",
        });
      },
    );

    return () => {
      controller.abort();
      if (loaded) disposeCharacter(loaded.scene);
    };
  }, [attempt, id]);

  const retry = useCallback(() => {
    setState(LOADING);
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
};
