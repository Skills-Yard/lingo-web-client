"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkle } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { FoxSlot } from "./foxStage";
import { OnboardingBubble, TypedText, spansLength } from "./OnboardingBubble";
import { useVoiceover } from "./useVoiceover";

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
const FOX_SIZE = "min(12rem, 28dvh)";
const FOX_HALF = "min(6rem, 14dvh)";
const FOX_CENTER = "54%";
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
  /** Fox gets excited once all the text has typed out — see FoxSlot's
   * `excited`. */
  excite?: boolean;
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
  voiceover,
  voiceReadsHeading = true,
  voiceReads = "all",
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
  const synced = hasVoice && voice.status !== "failed";
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
  // On a heading-first screen whose voice couldn't play, the heading types
  // at the normal speed, then the bubble pops in and types at the quick one.
  const onBubble = headingFirst && (synced || ticks >= headingLen);
  const bubbleWaiting = headingFirst && !synced && ticks >= headingLen && !bubbleIn;
  const typingSpeed = onBubble ? QUICK_TYPE_SPEED_MS : TYPE_SPEED_MS;
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
    headingShown = synced ? voiceShown(headingLen) : Math.min(ticks, headingLen);
    bubbleShown = synced ? ticks : Math.max(0, ticks - headingLen);
  } else {
    // Reading order: a heading above the fox is read before the bubble, one
    // below it after.
    const shown = synced ? voiceShown(bubbleLen + headingLen) : ticks;
    bubbleShown = headingOnTop ? shown - headingLen : shown;
    headingShown = headingOnTop ? shown : shown - bubbleLen;
  }
  const showBubble = !headingFirst || headingShown >= headingLen;
  // The mouth moves while the voice plays, and while anything types without it.
  const typingUnsynced =
    typingStarted && !reduceMotion && !bubbleWaiting && ticks < unsyncedLen;
  const talking = (synced && voice.playing) || typingUnsynced;
  // Everything has typed out (and the mouth has stopped).
  const typedOut =
    bubbleIn && showBubble && bubbleShown >= bubbleLen && headingShown >= headingLen && !talking;

  const headingBlock = heading && (
    <div className="relative flex shrink-0 items-start gap-1.5">
      <h1 className="max-w-xs text-center text-xl font-semibold leading-snug text-[#1A1C22] sm:text-2xl">
        {typesHeading ? (
          <TypedText spans={heading} shown={headingShown} />
        ) : (
          heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
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

  // How far the fox has to move up so the text below it fits — never so far
  // that the text above it would leave the top. Re-measured whenever the
  // space or the text changes size.
  const stageRef = useRef<HTMLDivElement>(null);
  const foxRef = useRef<HTMLDivElement>(null);
  const aboveRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const stage = stageRef.current;
    const fox = foxRef.current;
    if (!stage || !fox) return;
    const measure = () => {
      // offsetTop/offsetHeight ignore transforms, so this is the fox's
      // resting position whatever the current lift is.
      const above = aboveRef.current;
      const below = belowRef.current;
      const top = fox.offsetTop + (above ? above.offsetTop : 0);
      const bottom = fox.offsetTop + (below ? below.offsetTop + below.offsetHeight : fox.offsetHeight);
      const overflow = bottom + EDGE_GAP_PX - stage.clientHeight;
      const room = top - EDGE_GAP_PX;
      setLift(Math.max(0, Math.min(overflow, room)));
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

  return (
    <div className={`flex min-h-0 flex-col bg-white px-6 ${className ?? ""}`}>
      {headingOnTop && <div className="mt-[3dvh] shrink-0 self-center">{headingBlock}</div>}

      <div ref={stageRef} className="relative min-h-0 flex-1">
        <motion.div
          ref={foxRef}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: `calc(${FOX_CENTER} - ${FOX_HALF})` }}
          animate={{ y: -lift }}
          transition={reduceMotion ? { duration: 0 } : LIFT}
        >
          {/* Above the fox: the bubble (tail down) — unless the heading is
              on top, in which case the bubble goes below instead. */}
          {!headingOnTop && (
            <div ref={aboveRef} className="absolute bottom-full left-1/2 w-max -translate-x-1/2 pb-2">
              {bubbleEl("down")}
            </div>
          )}

          <FoxSlot
            greet={greet}
            talking={talking}
            excited={excite && typedOut}
            className="aspect-square"
            style={{ height: FOX_SIZE }}
          />

          {(headingOnTop || headingBelow) && (
            <div
              ref={belowRef}
              className="absolute top-full left-1/2 flex w-max max-w-[calc(100vw-3rem)] -translate-x-1/2 justify-center pt-4"
            >
              {headingOnTop ? bubbleEl("up") : headingBlock}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
