"use client";

import { useSyncExternalStore } from "react";
import { usePortraitDrawn } from "@/components/character3d/portraitHost";
import { preloadCharacter, useSharedCharacter } from "@/components/character3d/sharedCharacter";
import { SEQUENCE_3D_AUDIO } from "@/lib/moduleAudio";
import { getRoomHost } from "@/lib/rive/roomHost";
import { COMPARE_3D, REFLECT_DECIDE_3D, REFLECT_ORDER_3D } from "./sequence3d";
import {
  FIRST_COMMAND,
  PICK_UP_ICON,
  PLACE_IN_TARGET_ICON,
  PUT_ON_FIRST,
  SOCKS_FIRST,
  WHAT_DID_YOU_DO,
  type SequenceQuiz,
} from "./sequence";

/*
 * Everything the 3D copies of the Sequence screens use, loaded up front (see
 * `Sequence3dAssetsGate`) so no screen waits for anything: the character (once,
 * shared by the screens), the voices, the sounds and the pictures. The `.riv` files
 * (the room, the buttons, the progress bar) are loaded by the root layout's gate.
 */

const CLICK_SOUND = "/audios/click-sound.mpeg";

/** A screen's voices, by when they play (see `SEQUENCE_3D_AUDIO`). */
type Voice = Readonly<Record<string, readonly string[]>>;
const clipsOf = (voice: Voice) => Object.values(voice).flat();

/** Every clip a screen can play, and the sound a tap makes. */
const SOUNDS: readonly string[] = [...Object.values(SEQUENCE_3D_AUDIO).flatMap(clipsOf), CLICK_SOUND];

/** The pictures a question shows: its answers', the ones to compare, the close-up, and the one after a wrong answer. */
const picturesOf = (quiz: SequenceQuiz) => [
  ...quiz.choices.map(({ icon }) => icon),
  ...(quiz.pictures?.map(({ icon }) => icon) ?? []),
  ...(quiz.closeUp ? [quiz.closeUp.src] : []),
  ...(quiz.wrongPicture ? [quiz.wrongPicture.src] : []),
];

/** The questions' pictures (the arrange screen's two cards are not a question's, so they are named below). The Hex board screens draw theirs in code or load them themselves. */
const PICTURES: readonly string[] = [
  ...new Set([
    ...[PUT_ON_FIRST, WHAT_DID_YOU_DO, COMPARE_3D, SOCKS_FIRST, FIRST_COMMAND, REFLECT_ORDER_3D, REFLECT_DECIDE_3D].flatMap(picturesOf),
    PICK_UP_ICON,
    PLACE_IN_TARGET_ICON,
  ]),
];

/** How much of the bar each is, by what it weighs (the character 4.1 MB, the sounds 0.5 MB, the pictures 0.05 MB). */
const SHARE = { character: 0.88, sounds: 0.11, pictures: 0.01 } as const;

type Loaded = { sounds: number; pictures: number; settled: boolean };

const INITIAL: Loaded = { sounds: 0, pictures: 0, settled: false };

let loaded = INITIAL;
let started = false;
const listeners = new Set<() => void>();

const update = (patch: Partial<Loaded>) => {
  loaded = { ...loaded, ...patch };
  listeners.forEach((listener) => listener());
};

/** Runs `load` for each url; `onEach` gets the share done. One that fails is skipped (its screen loads it itself later). */
const loadEach = async (urls: readonly string[], load: (url: string) => Promise<unknown>, onEach: (share: number) => void) => {
  let done = 0;
  await Promise.all(
    urls.map(async (url) => {
      try {
        await load(url);
      } catch (error) {
        console.warn(`${url} didn't preload; its screen will load it itself.`, error);
      } finally {
        done += 1;
        onEach(done / urls.length);
      }
    }),
  );
};

/** Downloads the whole file, so it sits in the browser's cache and plays from the first moment. */
const download = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await response.arrayBuffer();
};

const decodePicture = async (url: string) => {
  const image = new Image();
  image.src = url;
  await image.decode();
};

const start = () => {
  if (started) return;
  started = true;
  preloadCharacter();
  // The bedroom is made now (as the screens' boards will take it), not when the first screen opens.
  getRoomHost();
  void Promise.all([
    loadEach(SOUNDS, download, (share) => update({ sounds: share })),
    loadEach(PICTURES, decodePicture, (share) => update({ pictures: share })),
    document.fonts?.ready,
  ]).then(() => update({ settled: true }));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
};

/**
 * How far everything is, 0 to 1, and whether all of it is in. Asking starts the loading.
 * Something that couldn't load counts as done: the gate never holds the screens for good.
 */
export const useSequence3dAssets = () => {
  const { sounds, pictures, settled } = useSyncExternalStore(subscribe, () => loaded, () => INITIAL);
  const character = useSharedCharacter();
  const portraitDrawn = usePortraitDrawn();
  // The character's canvas has drawn its first frames (without a character there is no canvas to wait for).
  const ready = settled && character.settled && (portraitDrawn || !character.character);
  const downloaded = character.fraction * SHARE.character + sounds * SHARE.sounds + pictures * SHARE.pictures;
  // The last of the bar is the canvas's first frames, which are the slowest step: it doesn't say done before they are.
  return { ready, progress: ready ? 1 : Math.min(downloaded, 0.98) };
};
