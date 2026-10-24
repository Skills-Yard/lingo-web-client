"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkle } from "lucide-react";
import type { HexOnboardingBeat, TextSpan } from "@/lib/constants/onboarding";
import type { HexScene as HexSceneConfig } from "@/lib/rive/runtime";
import { FoxSlot } from "./foxStage";
import { ONBOARDING_HEADING_CLASS, ONBOARDING_TOP_OFFSET_CLASS } from "./headingStyle";
import { HexScene } from "./robu/HexScene";
import { OnboardingBubble, TypedText, spansLength } from "./OnboardingBubble";
import { isVoiceoverSettled, useVoiceover } from "./useVoiceover";

/** Typing speed for screens with no voice (or whose voice couldn't play). */
const TYPE_SPEED_MS = 30;
/** The bubble on a heading-first screen types quickly once the voice is done. */
const QUICK_TYPE_SPEED_MS = 20;
/** About as long as OnboardingFlow's screen crossfade. */
const SCREEN_SETTLE_MS = 400;

// The fox's spot — the same size and place on every talking screen, so
// crossfading from one to the next reads as the same fox staying put. Its
// center sits at FOX_CENTER of the space between header and CTA; the bubble
// hangs off its top and the heading off its bottom, instead of all three
// being centered as a group (which moved the fox whenever the text length
// changed).
// Same size as Hex on the name screen (NameScreen: min(12.5rem, 25dvh)).
const FOX_MAX_REM = 12.5;
const FOX_MAX_DVH = 25;
const FOX_SIZE = `min(${FOX_MAX_REM}rem, ${FOX_MAX_DVH}dvh)`;
/** Hex is drawn this much bigger than its slot (the slot's `scale-125`). */
const FOX_VISUAL_SCALE = 1.25;
/** Where the background grid's floor starts (its top edge), read off the
 * `BG_Grid` artboard: the artboard covers the screen, 0.567 wide for every
 * 1 high, and the floor starts FLOOR_BELOW_CENTER of its height below its
 * middle. Hex's artboard (empty margin below the body included) ends exactly
 * there: its bottom edge is attached to the floor's top edge. */
const BACKGROUND_ASPECT = 0.567;
const FLOOR_BELOW_CENTER = 0.1665;
const floorTop = (screenWidth: number, screenHeight: number) =>
  screenHeight / 2 + FLOOR_BELOW_CENTER * Math.max(screenHeight, screenWidth / BACKGROUND_ASPECT);
/** The text below Hex ends this far (px) above the bottom of the screen — at
 * most; short screens use BELOW_TEXT_BOTTOM_MAX_VH of their height instead. */
const BELOW_TEXT_BOTTOM_PX = 200;
const BELOW_TEXT_BOTTOM_MAX_VH = 26;
/** How far the bubble's bottom edge dips below the fox's top edge, as a share
 * of the fox's size (the bubble's tail sits in the empty space above Hex's
 * head). 48px at a 240px Hex. */
const FOX_BUBBLE_OVERLAP = 48 / 240;
/** The bubble never gets closer than this (px) to the top of the stage. */
const BUBBLE_MIN_TOP_PX = 4;
/** Fox's top edge where there's no bubble above it (heading on top). */
const FOX_TOP_PX = 223;
/** The fox never shrinks below this (px) to make room for text below. */
const FOX_MIN_PX = 128;
/** Breathing room kept between the text and the edges of that space. */
const EDGE_GAP_PX = 12;
// When the text below the fox wouldn't fit (a long heading on a short
// phone), the fox glides up just enough — after the screen has faded in,
// so it's seen moving rather than starting somewhere else.
const LIFT = { type: "spring", stiffness: 170, damping: 24, delay: 0.35 } as const;

interface FoxMessageScreenProps {
  heading?: TextSpan[];
  /** "bottom": bubble above the fox, heading below it — see
   * OnboardingStep's `headingPlacement`. */
  headingPlacement?: "top" | "bottom";
  sparkle?: boolean;
  bubble: TextSpan[];
  /** Fox waves hello once on mount — see FoxSlot's `greet`. */
  greet?: boolean;
  /** Fox gets excited once all the text has typed out — or, on a
   * heading-first screen, as soon as the heading has, alongside the bubble
   * typing. See FoxSlot's `excited`. */
  excite?: boolean;
  /** Hex's `Onboarding` trigger for this screen — fired on arrival, or with
   * `excite` at the excitement moment. See OnboardingStep's `hexBeat`. */
  hexBeat?: HexOnboardingBeat;
  /** Full-screen Hex artboard played instead of the fox and the bubble (it
   * carries its own text). See OnboardingStep's `hexScene`. */
  hexScene?: HexSceneConfig;
  /** Played once the bubble has popped in. The text types along with it —
   * paced so the last letter lands as the voice ends — and the fox's mouth
   * moves exactly while it plays. */
  voiceover?: readonly string[];
  /** Whether the voiceover reads the heading too (default true). When
   * false, the heading shows in full and only the bubble types along. */
  voiceReadsHeading?: boolean;
  /** "heading": the voiceover reads only the heading — see OnboardingStep's
   * `voiceReads`. */
  voiceReads?: "all" | "heading";
  /** Type at this fixed ms-per-character instead of following the voice; the
   * mouth then moves only while the text types, not for the whole clip. */
  typeSpeedMs?: number;
  /** Called once the voiceover has finished (or failed to play). */
  onVoiceoverDone?: () => void;
  /** Bumped by the parent's Skip link: cuts the voice off and shows all the
   * text at once. */
  skipCount?: number;
  muted?: boolean;
  className?: string;
}

/**
 * Robu's plain "message" screen, in one of three layouts matching the
 * reference design per screen: bubble-above-fox with no heading (the
 * greeting, "Perfect starting point"), bubble-then-fox-then-heading ("Are
 * you ready?", "Building Career Path...", `headingPlacement="bottom"`), or
 * heading-then-fox-then-bubble (the default placement — no current screen
 * uses it).
 */
export function FoxMessageScreen({
  heading,
  headingPlacement = "top",
  sparkle,
  bubble,
  greet,
  excite = false,
  hexBeat,
  hexScene,
  voiceover,
  voiceReadsHeading = true,
  voiceReads = "all",
  typeSpeedMs,
  onVoiceoverDone,
  skipCount = 0,
  muted = false,
  className,
}: FoxMessageScreenProps) {
  const reduceMotion = useReducedMotion();
  const [bubbleIn, setBubbleIn] = useState(false);
  const markBubbleIn = () => setBubbleIn(true);
  const headingOnTop = !!heading && headingPlacement === "top";
  const headingBelow = !!heading && headingPlacement === "bottom";

  const hasVoice = !!voiceover?.length;
  // "heading": the voice reads only the heading, so the heading goes first
  // (typed along with the voice) and the bubble pops in and types quickly
  // once it's done. Otherwise the voice reads the bubble (and heading, if
  // any) and everything starts once the bubble has popped in.
  const headingFirst = hasVoice && voiceReads === "heading" && !!heading;

  // Heading-first screens start their voice once the screen has faded in.
  const [screenIn, setScreenIn] = useState(false);
  useEffect(() => {
    if (!headingFirst) return;
    const timer = window.setTimeout(() => setScreenIn(true), SCREEN_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [headingFirst]);

  const voice = useVoiceover(voiceover, headingFirst ? screenIn : bubbleIn, muted);
  const synced = hasVoice && voice.status !== "failed" && typeSpeedMs === undefined;
  // Keyed on status alone, so a stale "done" left over from the previous
  // voiceover can't re-fire it.
  const onVoiceoverDoneRef = useRef(onVoiceoverDone);
  useEffect(() => {
    onVoiceoverDoneRef.current = onVoiceoverDone;
  });
  useEffect(() => {
    if (isVoiceoverSettled(voice.status)) onVoiceoverDoneRef.current?.();
  }, [voice.status]);
  const voiceShown = (length: number) =>
    voice.status === "done" ? length : Math.floor(voice.progress * length);

  const bubbleLen = spansLength(bubble);
  const typesHeading = hasVoice && voiceReadsHeading;
  const headingLen = heading && typesHeading ? spansLength(heading) : 0;

  // Fixed-speed typing, for whatever the voice isn't pacing: everything on
  // a screen with no voice (or whose voice couldn't play), or the bubble on
  // a heading-first screen. `ticks` counts characters typed that way.
  const unsyncedLen = headingFirst
    ? synced
      ? bubbleLen
      : headingLen + bubbleLen
    : synced
      ? 0
      : bubbleLen + headingLen;
  const typingStarted = headingFirst ? (synced ? bubbleIn : screenIn) : bubbleIn;
  const [ticks, setTicks] = useState(0);
  // Compared against the count at mount, so a skip made on an earlier
  // screen doesn't skip this one.
  const lastSkipCount = useRef(skipCount);
  useEffect(() => {
    if (skipCount === lastSkipCount.current) return;
    lastSkipCount.current = skipCount;
    voice.stop();
    setTicks(unsyncedLen);
    // `voice` is a fresh object each render; only a new skip should run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipCount]);
  // On a heading-first screen whose voice couldn't play, the heading types
  // at the normal speed, then the bubble pops in and types at the quick one.
  const onBubble = headingFirst && (synced || ticks >= headingLen);
  const bubbleWaiting = headingFirst && !synced && ticks >= headingLen && !bubbleIn;
  const typingSpeed = typeSpeedMs ?? (onBubble ? QUICK_TYPE_SPEED_MS : TYPE_SPEED_MS);
  useEffect(() => {
    if (!typingStarted || reduceMotion || bubbleWaiting || ticks >= unsyncedLen) return;
    const timer = window.setTimeout(() => setTicks((t) => t + 1), typingSpeed);
    return () => window.clearTimeout(timer);
  }, [typingStarted, reduceMotion, bubbleWaiting, ticks, unsyncedLen, typingSpeed]);

  let headingShown: number;
  let bubbleShown: number;
  if (reduceMotion) {
    headingShown = headingLen;
    bubbleShown = bubbleLen;
  } else if (headingFirst) {
    // A second clip is the bubble's own line ("Are you ready?"): the heading
    // follows the first clip and the bubble types along with the second.
    const bubbleHasClip = synced && (voiceover?.length ?? 0) > 1;
    if (bubbleHasClip) {
      const done = voice.status === "done";
      const clipShown = (length: number) => Math.floor(voice.clipProgress * length);
      headingShown = done || voice.clip >= 1 ? headingLen : clipShown(headingLen);
      bubbleShown = done ? bubbleLen : voice.clip >= 1 ? clipShown(bubbleLen) : 0;
    } else {
      headingShown = synced ? voiceShown(headingLen) : Math.min(ticks, headingLen);
      bubbleShown = synced ? ticks : Math.max(0, ticks - headingLen);
    }
  } else {
    // Reading order: a heading above the fox is read before the bubble, one
    // below it after.
    const shown = synced ? voiceShown(bubbleLen + headingLen) : ticks;
    bubbleShown = headingOnTop ? shown - headingLen : shown;
    headingShown = headingOnTop ? shown : shown - bubbleLen;
  }
  const showBubble = !headingFirst || headingShown >= headingLen;
  // The mouth moves while the voice plays, and while anything types without
  // it — but stops as soon as the text has finished typing, even if the voice
  // clip runs on a moment longer.
  const textTyped = bubbleShown >= bubbleLen && headingShown >= headingLen;
  const typingUnsynced =
    typingStarted && !reduceMotion && !bubbleWaiting && ticks < unsyncedLen;
  const talking = ((synced && voice.playing) || typingUnsynced) && !textTyped;
  // Everything has typed out (and the mouth has stopped).
  const typedOut =
    bubbleIn && showBubble && bubbleShown >= bubbleLen && headingShown >= headingLen && !talking;
  // Heading-first screens get excited the moment the heading has typed out,
  // together with the bubble popping in and typing; others once all is typed.
  const excited = excite && (headingFirst ? showBubble : typedOut);
  // With a voiceover, Hex speaks (`talk`) while it plays and the beat comes
  // once the text has typed out; with none, the beat fires on arrival.
  const speaking = hasVoice && voice.playing && !textTyped;
  const voiceLeads = !!hexBeat && hasVoice && voice.status !== "failed";
  const beatDue = !!hexBeat && (voiceLeads ? (excite ? excited : typedOut) : !excite || excited);

  const headingBlock = heading && (
    <div className="relative flex shrink-0 items-start gap-1.5">
      <h1 className={`max-w-[min(20rem,calc(100vw-3rem))] text-center ${ONBOARDING_HEADING_CLASS}`}>
        {typesHeading ? (
          <TypedText spans={heading} shown={headingShown} />
        ) : (
          heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-brand-gradient" : undefined}>
              {span.text}
            </span>
          ))
        )}
      </h1>
      {sparkle && (
        <Sparkle
          aria-hidden
          className="h-4 w-4 shrink-0 fill-primary text-primary"
        />
      )}
    </div>
  );

  // Making the text below the fox fit: first the fox moves up as far as the
  // text above it allows, and if that's still not enough it shrinks (down to
  // FOX_MIN_PX), its top staying put. Re-measured whenever the space or the
  // text changes size. `shrunk` is null while the fox is at its usual size.
  const stageRef = useRef<HTMLDivElement>(null);
  const foxRef = useRef<HTMLDivElement>(null);
  const aboveRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const [lift, setLift] = useState(0);
  const [foxTop, setFoxTop] = useState(FOX_TOP_PX);
  const [belowBottom, setBelowBottom] = useState(BELOW_TEXT_BOTTOM_PX);
  const [bubbleBottom, setBubbleBottom] = useState(FOX_TOP_PX);
  const [shrunk, setShrunk] = useState<{ size: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const fox = foxRef.current;
    if (!stage || !fox) return;
    const measure = () => {
      // Sizes of the text blocks don't depend on the fox's own size, and the
      // fox's usual size is worked out here rather than read back, so a
      // shrunk fox doesn't feed into its own measurement.
      const stageHeight = stage.clientHeight;
      const aboveEl = aboveRef.current;
      // The bubble hangs off Hex's fixed spot (growing upward), so it never
      // pushes Hex around.
      const aboveHeight = 0;
      // The text below is pinned to the bottom, so it doesn't push Hex.
      const belowHeight = 0;
      // Stage bottom is above the footer; measure it to land at 200px from
      // the bottom of the screen.
      const footerHeight = window.innerHeight - stage.getBoundingClientRect().bottom;
      const belowBottomPx = Math.min(
        BELOW_TEXT_BOTTOM_PX,
        (BELOW_TEXT_BOTTOM_MAX_VH / 100) * window.innerHeight,
      );
      setBelowBottom(Math.max(0, belowBottomPx - footerHeight));
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const size = Math.min(FOX_MAX_REM * rem, (FOX_MAX_DVH / 100) * window.innerHeight);
      // Hex's artboard sits on the background's floor: its bottom edge is the
      // floor's top edge, no gap.
      const overlap = size * FOX_BUBBLE_OVERLAP;
      // On a short screen the bubble would run off the top: Hex steps down
      // just enough to keep it in.
      const top = aboveEl
        ? Math.max(
            floorTop(window.innerWidth, window.innerHeight) -
              stage.getBoundingClientRect().top -
              size * FOX_VISUAL_SCALE,
            aboveEl.offsetHeight + BUBBLE_MIN_TOP_PX - overlap,
          )
        : FOX_TOP_PX;
      setFoxTop(top);
      setBubbleBottom(top + overlap);

      const overflow = top + size + belowHeight + EDGE_GAP_PX - stageHeight;
      const room = Math.max(0, top - aboveHeight - EDGE_GAP_PX);
      const up = Math.max(0, Math.min(overflow, room));
      const stillOver = overflow - up;
      if (stillOver > 0) {
        setLift(0);
        const shrunkSize = Math.max(FOX_MIN_PX, size - stillOver);
        setShrunk({ size: shrunkSize, top: top - up });
        setBubbleBottom(top - up + shrunkSize * FOX_BUBBLE_OVERLAP);
      } else {
        setLift(up);
        setShrunk(null);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [stage, fox, aboveRef.current, belowRef.current]) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const bubbleEl = (tail: "up" | "down") => (
    <OnboardingBubble
      spans={bubble}
      shown={bubbleShown}
      tail={tail}
      show={showBubble}
      onEntered={markBubbleIn}
    />
  );

  // No FoxSlot here, so the flow's fox steps out while the scene plays.
  if (hexScene) {
    return (
      <div className={`relative min-h-0 ${className ?? ""}`}>
        <HexScene scene={hexScene} className="pointer-events-none absolute inset-0" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-col px-6 ${ONBOARDING_TOP_OFFSET_CLASS} ${className ?? ""}`}>
      {headingOnTop && <div className="shrink-0 self-center">{headingBlock}</div>}

      <div ref={stageRef} className="relative min-h-0 flex-1">
        {/* The bubble's bottom edge (tail) sits a fixed distance above Hex
            and it grows upward with its text, so it hugs Hex whatever its
            size while Hex stays put. */}
        {!headingOnTop && (
          <div
            ref={aboveRef}
            className="absolute left-1/2 z-10 w-max -translate-x-1/2 -translate-y-full"
            style={{ top: bubbleBottom }}
          >
            {bubbleEl("down")}
          </div>
        )}

        <motion.div
          ref={foxRef}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: shrunk ? shrunk.top : foxTop,
          }}
          animate={{ y: -lift }}
          transition={reduceMotion ? { duration: 0 } : LIFT}
        >
          <FoxSlot
            greet={greet}
            talking={talking}
            excited={excited}
            beat={hexBeat}
            beatDue={beatDue}
            speaking={speaking}
            tappable
            fullWidth
            // Scaled visually only (transforms don't affect layout), so the
            // bubble and heading stay exactly where they are.
            className="aspect-square origin-top scale-125"
            style={{ height: shrunk ? shrunk.size : FOX_SIZE }}
          />

        </motion.div>

        {/* The text below Hex is pinned to the bottom of the screen
            (BELOW_TEXT_BOTTOM_PX up from its edge), not hung off the fox. */}
        {(headingOnTop || headingBelow) && (
          <div
            ref={belowRef}
            className="absolute left-1/2 flex w-max max-w-[calc(100vw-3rem)] -translate-x-1/2 justify-center"
            style={{ bottom: belowBottom }}
          >
            {headingOnTop ? bubbleEl("up") : headingBlock}
          </div>
        )}
      </div>
    </div>
  );
}
