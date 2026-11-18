"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CharacterPortrait } from "@/components/character3d/CharacterPortrait";
import { useLevelVoice } from "@/components/level-one/LevelVoice";
import { useTyped } from "@/components/level-one/useTyped";
import type { Span } from "@/components/level-two/levelTwo";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";

/*
 * What the Sequence screens that have the 3D character in Hex's place share: the
 * 390px column they are laid out in, and the character standing in it.
 */

/** The 390px frame every screen is laid out in; what is at "the left" is the left of this column, centred on a wider screen. */
const COLUMN_W = 390;

/**
 * The character's box: from just under the header (52px) to just above the main button,
 * whatever the screen's height, so it is as tall as the room between them allows (the
 * answers are drawn over its legs). It is wider than the character (arms out while it
 * talks). At rest it is shifted to the column's left edge, so the character stands at the
 * far left; at first (`centered`) it is in the column's middle.
 */
const CHARACTER_WIDTH = 380;
const LEFT_EDGE = -130;
const CENTERED = (COLUMN_W - CHARACTER_WIDTH) / 2;
const HEADER_HEIGHT = 52;
/** How long the character takes to go from the middle to the left. */
const SHIFT = { duration: 0.8, ease: [0.4, 0, 0.2, 1] } as const;

/** A box laid out in the 390px column, which is centred on the stage. */
export const Column = ({ children }: { children: ReactNode }) => (
  <div className="absolute inset-0 flex justify-center">
    <div className="relative h-full shrink-0" style={{ width: COLUMN_W }}>
      {children}
    </div>
  </div>
);

/**
 * How far the character has got in what it says, for the screen to bring things in
 * by: the board when a fifth is said, the answers at three quarters, and the buttons
 * when it is all said (also when there is nothing to say). It starts again from the
 * beginning when something new is said (the result's voice).
 */
export const SPEECH_STAGE = { opening: 0, board: 1, options: 2, done: 3 } as const;
export type SpeechStage = (typeof SPEECH_STAGE)[keyof typeof SPEECH_STAGE];

const BOARD_AT = 0.2;
const OPTIONS_AT = 0.75;

const stageOf = (said: number): SpeechStage =>
  said >= 1 ? SPEECH_STAGE.done : said >= OPTIONS_AT ? SPEECH_STAGE.options : said >= BOARD_AT ? SPEECH_STAGE.board : SPEECH_STAGE.opening;

type SpeakingCharacterProps = {
  /** What the question says: with no voice, the character talks as long as it takes to type. */
  line: readonly Span[];
  /** Nothing is being said (the question has been answered and has no voice of its own). */
  silenced: boolean;
  /** Reported when it changes. */
  onStage: (stage: SpeechStage) => void;
};

/**
 * The character, talking while the screen's voiceover plays and in its Idle B
 * animation otherwise. If the voice can't play (a browser may refuse to start it),
 * or the screen has none, it still talks for as long as the line takes to say at the
 * pace the bubbles type at. Its mouth moves while it talks: there is one lip-sync clip,
 * made for a single line, so it is a stand-in and doesn't follow the words.
 */
const SpeakingCharacter = ({ line, silenced, onStage }: SpeakingCharacterProps) => {
  const { speaking, status, clip, clipProgress, clipCount } = useLevelVoice();
  const text = line.map((span) => span.text).join("");
  const unvoiced = useTyped(text, status === "failed" || clipCount === 0);
  const readingAloud = unvoiced.length > 0 && unvoiced.length < text.length;
  const talking = !silenced && (speaking || readingAloud);

  // How much has been said: the voice's progress through all its clips, or (it couldn't play) how much of the line has been read out.
  // Nothing to say counts as all of it.
  const said =
    clipCount === 0 || status === "done"
      ? 1
      : status === "failed"
        ? unvoiced.length / Math.max(text.length, 1)
        : (clip + clipProgress) / clipCount;
  const stage = stageOf(said);
  useEffect(() => onStage(stage), [stage, onStage]);

  return <CharacterPortrait animationId={talking ? "talking" : "idle-b"} lipSync={talking} />;
};

type CharacterOnStageProps = SpeakingCharacterProps & {
  /** The screen has the hint button, which makes the main button's row a little shorter. */
  withHint: boolean;
  /** Stands in the column's middle; when it turns off the character goes to the left edge. */
  centered: boolean;
};

/** The character, from the header down to the main button. Goes inside a `Column`. */
export const CharacterOnStage = ({ line, silenced, onStage, withHint, centered }: CharacterOnStageProps) => (
  <motion.div
    aria-hidden
    initial={false}
    animate={{ left: centered ? CENTERED : LEFT_EDGE }}
    transition={SHIFT}
    className="absolute"
    style={{ width: CHARACTER_WIDTH, top: HEADER_HEIGHT, bottom: aboveButtons(4, withHint) }}
  >
    <SpeakingCharacter line={line} silenced={silenced} onStage={onStage} />
  </motion.div>
);
