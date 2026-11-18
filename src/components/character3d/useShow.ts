"use client";

import { useReducer } from "react";
import { ANIMATIONS } from "./character";
import { TOUR, TOUR_REST_ID } from "./show";

type ShowState = {
  animationId: string;
  /** Bumped to start the animation over, including when it is the one already playing. */
  runToken: number;
  playing: boolean;
  /** How many times the animation has played through since it started. */
  loops: number;
  /** Where "Play all" is, as an index into `TOUR`; null when the visitor picked the animation. */
  step: number | null;
};

type ShowAction =
  | { type: "pick"; id: string }
  | { type: "playAll" }
  | { type: "stopTour" }
  | { type: "togglePlaying" }
  /** The animation has played through once. */
  | { type: "loop" }
  /** The animation's voice has ended, or couldn't be played. */
  | { type: "voiceEnded"; failed: boolean };

const INITIAL: ShowState = {
  animationId: ANIMATIONS[0].id,
  runToken: 0,
  playing: true,
  loops: 0,
  step: null,
};

const start = (state: ShowState, animationId: string, step: number | null): ShowState => ({
  ...state,
  animationId,
  step,
  playing: true,
  loops: 0,
  runToken: state.runToken + 1,
});

/** The next stop of "Play all", or, after the last, rest. */
const advance = (state: ShowState, step: number): ShowState => {
  const next = TOUR[step + 1];
  return next ? start(state, next.id, step + 1) : start(state, TOUR_REST_ID, null);
};

const show = (state: ShowState, action: ShowAction): ShowState => {
  switch (action.type) {
    case "pick":
      return start(state, action.id, null);
    case "playAll":
      return start(state, TOUR[0].id, 0);
    case "stopTour":
      return { ...state, step: null };
    case "togglePlaying":
      return { ...state, playing: !state.playing };
    case "loop": {
      const loops = state.loops + 1;
      const needed = state.step === null ? undefined : TOUR[state.step]?.loops;
      return state.step !== null && needed !== undefined && loops >= needed
        ? advance(state, state.step)
        : { ...state, loops };
    }
    case "voiceEnded":
      // Played through: go on, or (picked by the visitor) say it again. A voice that
      // can't play is left silent, rather than retried in a loop.
      if (state.step !== null) return advance(state, state.step);
      return action.failed ? state : start(state, state.animationId, null);
  }
};

/** What is playing, and where "Play all" is in its round. */
export const useShow = () => useReducer(show, INITIAL);
