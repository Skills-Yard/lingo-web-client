"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { useLevelVoice } from "@/components/level-one/LevelVoice";
import { TYPE_DELAY_MS, useTyped } from "@/components/level-one/useTyped";
import type { BubbleSize, Span } from "./levelTwo";

/** Hex's slot, the one Module 2's old screens gave him. */
export const HEX_SLOT = 110;

type HexBubbleProps = {
  entryKey: string;
  /** Where Hex stands; the bubble's tail points back at him. `top`: Hex above the bubble, both centred. */
  hex: "left" | "right" | "top";
  line: readonly Span[];
  size: BubbleSize;
  /** A trigger Hex plays once he has entered. */
  cue?: string | null;
  /** The bubble bounces off to the left behind Hex, then he follows (the result panel brings its own Hex). */
  leaving?: boolean;
  /** Called once, when the whole line has been said (typed, or read out by the voice). */
  onSpoken?: () => void;
};

/** Hex starts his own exit this long after the bubble sets off. */
const HEX_FOLLOWS_MS = 80;
/** The share of the clip before its own that has played when the bubble starts to pop in. */
const BUBBLE_LEAD = 0.9;
/** The bubble's way out: a little bounce the other way (px), then off to the left. */
const BUBBLE_WINDUP = 18;
const BUBBLE_EXIT: Transition = { duration: 0.15, times: [0, 0.35, 1], ease: ["easeOut", "backIn"] };

/** Hex's way out, quicker than his Rive exit can play: he is slid off to the left. */
const HEX_EXIT: Transition = { duration: 0.2, ease: "easeIn" };

/** Hex beside his line: the line is typed in letter by letter, the way module
 * 1's teacher line is. */
export function HexBubble({ entryKey, hex, line, size, cue = null, leaving = false, onSpoken }: HexBubbleProps) {
  const hexAtLeft = hex === "left";
  const hexOnTop = hex === "top";
  const [hexLeaving, setHexLeaving] = useState(false);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setHexLeaving(true), HEX_FOLLOWS_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  return (
    <div className={`flex w-fit items-center ${hexOnTop ? "flex-col" : hexAtLeft ? "" : "flex-row-reverse"}`}>
      {/* Leaving, he is drawn over the bubble, so it passes behind him. */}
      <motion.div
        aria-hidden
        className={`relative shrink-0 ${leaving ? "z-10" : ""}`}
        style={{ width: HEX_SLOT, height: HEX_SLOT }}
        initial={false}
        // Twice the window's width is past the left edge at any scale the shell uses.
        animate={{ x: hexLeaving ? -2 * window.innerWidth : 0 }}
        transition={HEX_EXIT}
      >
        <OnboardingHex entryKey={entryKey} cue={cue} leaving={hexLeaving} exit="exitLeft" />
      </motion.div>
      <SpeechBubble key={line.map((span) => span.text).join("")} line={line} size={size} tail={hex} leaving={leaving} onSpoken={onSpoken} />
    </div>
  );
}

/** The bubble's own look: plain white over a soft blue drop edge (the Figma
 * "Rectangle 142"), its tail pointing at Hex. The edge is a filter, not a
 * box-shadow, so it runs under the tail as well as the box. */
function SpeechBubble({ line, size, tail, leaving, onSpoken }: { line: readonly Span[]; size: BubbleSize; tail: "left" | "right" | "top"; leaving: boolean; onSpoken?: () => void }) {
  const tailAtLeft = tail === "left";
  const tailOnTop = tail === "top";
  // Where the bubble pops in from: beside Hex, or (Hex above it) from just under him.
  const offset = tailOnTop ? { x: 0, y: -8 } : { x: tailAtLeft ? -8 : 8, y: 0 };
  const text = line.map((span) => span.text).join("");
  const voice = useLevelVoice();
  // A bubble on a screen with a voice is typed to its clip (the screen's last
  // one); it falls back to the steady pace if the voice can't play.
  const [hasVoice] = useState(voice.clipCount > 0);
  const withVoice = hasVoice && voice.status !== "failed";
  const timed = useTyped(text, !withVoice);
  const bubbleClip = voice.clipCount - 1;
  const shown = !withVoice
    ? timed.length
    : voice.status === "done" || voice.clip > bubbleClip
      ? text.length
      : voice.clip < bubbleClip || voice.status === "idle"
        ? 0
        : Math.ceil(voice.clipProgress * text.length);
  // Never un-types: the voice ending early (the answer was checked) leaves what was said.
  const [peak, setPeak] = useState(0);
  if (shown > peak) setPeak(shown);
  const typed = text.slice(0, Math.max(peak, shown));
  // The line is said once its last letter is in. The bubble is keyed by its text, so a new line starts over.
  const spokenAll = text.length > 0 && typed.length >= text.length;
  const onSpokenRef = useRef(onSpoken);
  useEffect(() => {
    onSpokenRef.current = onSpoken;
  });
  useEffect(() => {
    if (spokenAll) onSpokenRef.current?.();
  }, [spokenAll]);
  // With a voice the bubble waits out the clips before its own: it pops in as
  // the one before it ends (or as its own starts), not from the screen's start.
  // With no clip before its own it comes in at once, without waiting for the audio to load.
  const comesIn =
    bubbleClip === 0 ||
    voice.status === "done" ||
    voice.clip > bubbleClip ||
    (voice.clip === bubbleClip && voice.status !== "idle") ||
    (voice.clip === bubbleClip - 1 && voice.clipProgress >= BUBBLE_LEAD);
  const [appeared, setAppeared] = useState(false);
  if (withVoice && comesIn && !appeared) setAppeared(true);
  const visible = !withVoice || appeared;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, ...offset }}
      // Twice the window's width is past the left edge at any scale the shell uses.
      animate={
        leaving
          ? { opacity: 1, scale: 1, x: [0, BUBBLE_WINDUP, -2 * window.innerWidth] }
          : visible
            ? { opacity: 1, scale: 1, x: 0, y: 0 }
            : { opacity: 0, scale: 0.85, ...offset }
      }
      transition={
        leaving ? BUBBLE_EXIT : { type: "spring", stiffness: 260, damping: 20, delay: withVoice ? 0 : TYPE_DELAY_MS / 1000 }
      }
      // Figma: the short bubble ("Rectangle 142") is 77 tall with its text 9px in; the others 86.
      style={{ transformOrigin: tailOnTop ? "50% 0%" : tailAtLeft ? "0% 50%" : "100% 50%", width: size.width, minHeight: size.minHeight }}
      className={`relative flex shrink-0 items-center justify-center rounded-[10px] bg-white px-3 drop-shadow-[0_3px_0_rgba(18,140,179,0.5)] dark:bg-[#1A1C22] ${
        size.minHeight ? "py-[7px]" : size.short ? "min-h-[77px] py-2.5" : "min-h-[86px] py-[13px]"
      }`}
    >
      <span
        aria-hidden
        className={`absolute h-[15px] w-[15px] rotate-45 bg-white dark:bg-[#1A1C22] ${
          tailOnTop
            ? "-top-[7px] left-1/2 -ml-[7px] rounded-tl-[3px]"
            : tailAtLeft
              ? "top-1/2 -left-[7px] -translate-y-1/2 rounded-bl-[3px]"
              : "top-1/2 -right-[7px] -translate-y-1/2 rounded-tr-[3px]"
        }`}
      />
      <p className="relative text-center text-[16px] leading-[1.24] font-medium text-[#444444] dark:text-white">
        {/* The whole line is laid out from the start (the rest unseen), so
          centred lines never shift as letters arrive. */}
        {line.map((span, i) => {
          // How many of this span's letters have been typed so far.
          const before = line.slice(0, i).reduce((sum, earlier) => sum + earlier.text.length, 0);
          const seen = Math.max(0, Math.min(span.text.length, typed.length - before));
          return (
            <span key={i} className={span.teal ? "text-[#04ACAB]" : undefined}>
              {span.text.slice(0, seen)}
              <span className="invisible">{span.text.slice(seen)}</span>
            </span>
          );
        })}
      </p>
    </motion.div>
  );
}
