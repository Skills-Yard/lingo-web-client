"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { CharacterPortrait } from "@/components/character3d/CharacterPortrait";
import { useLevelVoice } from "@/components/level-one/LevelVoice";
import { useTyped } from "@/components/level-one/useTyped";
import type { Span } from "@/components/level-two/levelTwo";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import type { PortraitFraming } from "@/components/character3d/portraitHost";

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
/** How long the character takes to go from the middle to the left (and from `lowered` up to its place). */
const SHIFT = { duration: 0.8, ease: [0.4, 0, 0.2, 1] } as const;
/** Lowered, the foot of its fade stops this far (px) over the main button's top. */
const LOWERED_GAP = 6;

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
  /** How much of the character shows (default: head to toe). */
  framing?: PortraitFraming;
};

/**
 * The character, talking while the screen's voiceover plays and in its Idle B
 * animation otherwise. If the voice can't play (a browser may refuse to start it),
 * or the screen has none, it still talks for as long as the line takes to say at the
 * pace the bubbles type at. Its mouth moves while it talks: there is one lip-sync clip,
 * made for a single line, so it is a stand-in and doesn't follow the words.
 */
const SpeakingCharacter = ({ line, silenced, onStage, framing }: SpeakingCharacterProps) => {
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

  return <CharacterPortrait animationId={talking ? "talking" : "idle-b"} lipSync={talking} framing={framing} />;
};

const fadeMask = ([from, to]: readonly [number, number]) => `linear-gradient(180deg, #000 ${from}%, transparent ${to}%)`;

type CharacterOnStageProps = SpeakingCharacterProps & {
  /** The screen has the hint button, which makes the main button's row a little shorter. */
  withHint: boolean;
  /** Stands in the column's middle; when it turns off the character goes to the left edge. */
  centered: boolean;
  /** Where it starts, under the stage's top (default: just under the header), for a screen whose title would be over its head. */
  top?: number;
  /** Its height (px), where it should not run down to the main button (default: it does). */
  height?: number;
  /** It fades out over this stretch of its height (from, to; percent), for something standing over its lower part. */
  fade?: readonly [number, number];
  /**
   * Stands lower than its place, with the foot of its fade (`fade`'s end, so it needs `height` and `fade`) just over
   * the main button, whatever the screen's height; when it turns off the character rises to its place.
   */
  lowered?: boolean;
};

/** The character, from the header (or `top`) down to the main button (or for `height`). Goes inside a `Column`. */
export const CharacterOnStage = ({ line, silenced, onStage, framing, withHint, centered, top = HEADER_HEIGHT, height, fade, lowered = false }: CharacterOnStageProps) => {
  // A mark at the main button's top, to measure how far down the character goes while lowered.
  const buttonLine = useRef<HTMLDivElement>(null);
  const rise = useMotionValue(0);
  const drop = useRef(0);
  const isLowered = useRef(lowered);
  const fadeEnd = fade?.[1];

  // Measured again when the screen's height changes (the stage is not laid out at all while the screen is still behind its loading bar);
  // the character is put there at once, not slid.
  useLayoutEffect(() => {
    const mark = buttonLine.current;
    const stage = mark?.parentElement;
    if (!mark || !stage || height === undefined || fadeEnd === undefined) return;
    const measure = () => {
      if (stage.clientHeight === 0) return;
      drop.current = Math.max(0, mark.offsetTop - (top + (height * fadeEnd) / 100));
      // A slide still running (the one the first render started, towards a drop not yet measured) would write over this.
      rise.stop();
      rise.set(isLowered.current ? drop.current : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [top, height, fadeEnd, rise]);

  useEffect(() => {
    isLowered.current = lowered;
    const slide = animate(rise, lowered ? drop.current : 0, SHIFT);
    return () => slide.stop();
  }, [lowered, rise]);

  return (
    <>
      <div ref={buttonLine} aria-hidden className="pointer-events-none absolute left-0 h-0 w-0" style={{ bottom: aboveButtons(LOWERED_GAP, withHint) }} />
      <motion.div
        aria-hidden
        initial={false}
        animate={{ left: centered ? CENTERED : LEFT_EDGE }}
        transition={SHIFT}
        className="absolute"
        style={{
          width: CHARACTER_WIDTH,
          top,
          y: rise,
          ...(height === undefined ? { bottom: aboveButtons(4, withHint) } : { height }),
          ...(fade && { maskImage: fadeMask(fade), WebkitMaskImage: fadeMask(fade) }),
        }}
      >
        <SpeakingCharacter line={line} silenced={silenced} onStage={onStage} framing={framing} />
      </motion.div>
    </>
  );
};
