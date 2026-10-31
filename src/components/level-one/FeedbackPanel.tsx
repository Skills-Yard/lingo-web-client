"use client";

import { HexBleed, HEX_BLEED } from "@/components/onboarding/robu/HexBleed";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import {
  HEX_ARTBOARD,
  HEX_ONBOARDING_TRIGGER,
  HEX_STATE,
  HEX_STOP_TALK_TRIGGER,
  HEX_VIEW_MODEL,
  randomHexTalkTrigger,
  type HexTalkTrigger,
} from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { useLevelVoice } from "./LevelVoice";

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** The `entryStyle` (0-7) Hex enters with; any of them works. */
const ENTRY_STYLE = 7;
/** How often Hex's ambient idle is fired again. */
const IDLE_REPEAT_MS = 4000;
/** About how long Hex's entrance takes, so a cue can follow it. */
const ENTER_SETTLE_MS = 900;
/** The panel's Hex starts entering this long after he is asked to. */
const ENTER_DELAY_MS = 250;

/**
 * Hex, played the onboarding way: the `Onboarding` machine, entering with
 * `entryStyle` set and the `enter` trigger fired, and leaving through the
 * `exitRight` trigger when `leaving` turns on. With a `null` `entryKey` the
 * canvas loads but waits: the entrance plays when a key arrives.
 */
export function OnboardingHex({
  entryKey,
  leaving = false,
  exit = "exitRight",
  enter = HEX_ONBOARDING_TRIGGER.enter,
  entryStyle = ENTRY_STYLE,
  cue = null,
  cueDelayMs = 0,
}: {
  entryKey: string | null;
  leaving?: boolean;
  /** Which way he leaves when `leaving` turns on. */
  exit?: "exitLeft" | "exitRight";
  /** The trigger that plays his entrance. */
  enter?: string;
  /** The `entryStyle` (0-7) set before the entrance plays. */
  entryStyle?: number;
  /** A trigger to play once, as soon as it is set; it ends the ambient idle. */
  cue?: string | null;
  /** Waits this long first — for a cue that follows the entrance. */
  cueDelayMs?: number;
}) {
  const { RiveComponent, ready, fireNow, fireTrigger } = useHexRive(
    HEX_LAYOUT,
    HEX_STATE.onboarding,
    HEX_ARTBOARD,
    HEX_VIEW_MODEL,
    entryKey,
    entryStyle,
    enter,
    HEX_BLEED,
  );
  // While the screen's voiceover plays he talks — a random `talk`/`talk2`/
  // `talk3` per clip — and `stopTalk` follows once it ends.
  const { speaking, clip } = useLevelVoice();
  const talking = useRef(false);
  const talkedClip = useRef(-1);
  const lastTalk = useRef<HexTalkTrigger | null>(null);
  useEffect(() => {
    if (!ready || leaving || entryKey === null) {
      talking.current = false;
      talkedClip.current = -1;
      return;
    }
    if (speaking) {
      if (talkedClip.current === clip) return;
      talkedClip.current = clip;
      talking.current = true;
      lastTalk.current = randomHexTalkTrigger(lastTalk.current);
      fireTrigger(lastTalk.current);
    } else if (talking.current) {
      talking.current = false;
      talkedClip.current = -1;
      fireTrigger(HEX_STOP_TALK_TRIGGER);
    }
  }, [ready, leaving, entryKey, speaking, clip, fireTrigger]);
  useEffect(() => {
    if (ready && leaving) fireNow(HEX_ONBOARDING_TRIGGER[exit]);
  }, [ready, leaving, exit, fireNow]);
  // With nothing else to play, Hex keeps running his ambient idle. The first
  // one queues behind `enter`; it stops once he starts leaving.
  useEffect(() => {
    if (!ready || leaving || entryKey === null || cue !== null || speaking) return;
    fireTrigger(HEX_ONBOARDING_TRIGGER.idleAmbient);
    const timer = window.setInterval(
      () => fireTrigger(HEX_ONBOARDING_TRIGGER.idleAmbient),
      IDLE_REPEAT_MS,
    );
    return () => window.clearInterval(timer);
  }, [ready, leaving, entryKey, cue, speaking, fireTrigger]);
  useEffect(() => {
    if (!ready || !cue) return;
    const timer = window.setTimeout(() => fireNow(cue), cueDelayMs);
    return () => window.clearTimeout(timer);
  }, [ready, cue, cueDelayMs, fireNow]);
  return <HexBleed Canvas={RiveComponent} />;
}


// Figma "Frame 201": a 21px / 28px title over a 14px body, 6px apart.
const FEEDBACK = {
  correct: {
    title: "Correct! +10 XP",
    titleColor: "text-[#01A17F]",
    text: "font-medium leading-[1.4]",
    panel: "border-[#7FD8CC] bg-[#E3F6F3] dark:border-[#1E5F59] dark:bg-[#0F2B28]",
    bold: "[&_b]:text-[#04ACAB]",
  },
  wrong: {
    title: "Not quite",
    titleColor: "text-[#D42421]",
    text: "font-semibold leading-5",
    panel: "border-[#F2A9AB] bg-[#FDEAEA] dark:border-[#6B2A2E] dark:bg-[#2E1517]",
    bold: "[&_b]:text-[#E5484D]",
  },
} as const;

const XP_SPRING = { type: "spring", stiffness: 220, damping: 14, delay: 0.15 } as const;
/** With `fading`: shown, held for a moment, then gone sliding up (a share of the whole run at each key). */
const XP_FADE: Transition = { duration: 1.6, delay: 0.15, times: [0, 0.2, 0.6, 1], ease: "easeOut" };

/** Where the "+10 XP" stands on its card: above it, inside at its right end, or inside at the top. */
const XP_PLACE = {
  above: "-top-8 left-1/2 -translate-x-1/2",
  right: "top-1/2 right-4 -translate-y-1/2",
  top: "top-2 left-1/2 -translate-x-1/2",
} as const;

/** The "+10 XP" that pops up on the right answer's card: above it, or with
 * `inside`, at its right end (`"top"`: inside, at the top, for a card with its
 * content in the middle). With `fading` (the cards fade out) it fades out
 * sliding up after it has been shown, instead of staying where the card was. */
export function XpPop({ show, inside = false, fading = false }: { show: boolean; inside?: boolean | "top"; fading?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={fading ? { opacity: [0, 1, 1, 0], y: [8, 0, 0, -28], scale: 1 } : { opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={fading ? { opacity: XP_FADE, y: XP_FADE, scale: XP_SPRING } : XP_SPRING}
          className={`pointer-events-none absolute z-10 text-[18px] leading-6 font-bold whitespace-nowrap text-[#F5A623] ${
            XP_PLACE[inside === "top" ? "top" : inside ? "right" : "above"]
          }`}
        >
          +10 XP
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * The result sheet: slides up from the bottom behind Continue, with the check
 * (or cross), what the answer is, and Hex entering once the first Hex has left.
 */
export function FeedbackPanel({
  correct,
  open,
  hexIn,
  hexSlot,
  hexCue = null,
  children,
}: {
  correct: boolean;
  /** Slides up. The panel stays mounted while closed, so Hex's canvas is
   * already loaded when his entrance is asked for. */
  open: boolean;
  /** Plays Hex's entrance — independent of whether the sheet has arrived. */
  hexIn: boolean;
  /** Leaves the Hex spot empty and hands it over: a Hex already on screen
   * glides in here instead of a new one entering. */
  hexSlot?: (el: HTMLDivElement | null) => void;
  /** Played by the panel's own Hex once his entrance is over. */
  hexCue?: string | null;
  /** The sentence under the title. */
  children: ReactNode;
}) {
  // The panel's own Hex enters a touch after the sheet starts up.
  const [enterNow, setEnterNow] = useState(false);
  useEffect(() => {
    if (!hexIn) return;
    const timer = window.setTimeout(() => setEnterNow(true), ENTER_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setEnterNow(false);
    };
  }, [hexIn]);
  const look = FEEDBACK[correct ? "correct" : "wrong"];
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: open ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      // 5xl on screen, like the header; the stage is scaled, so divide.
      style={{ maxWidth: "calc(1024px / var(--stage-scale, 1))" }}
      className={`absolute inset-x-0 bottom-0 z-0 mx-auto rounded-t-[28px] border-[1.5px] border-b-0 px-[25px] pt-5 pb-[140px] ${open ? "" : "pointer-events-none"} ${look.panel}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className={`text-[28px] leading-9 font-semibold tracking-[-0.1px] ${look.titleColor}`}>{look.title}</h2>
          <p className={`text-[14px] text-[#444444] dark:text-white/80 [&_b]:font-semibold ${look.text} ${look.bold}`}>
            {children}
          </p>
        </div>
        <div ref={hexSlot} aria-hidden className="pointer-events-none -my-4 h-[112px] w-[120px] shrink-0">
          {!hexSlot && <OnboardingHex
              entryKey={enterNow ? "feedback" : null}
              cue={enterNow ? hexCue : null}
              cueDelayMs={ENTER_SETTLE_MS}
            />}
        </div>
      </div>
    </motion.div>
  );
}
