"use client";

import { HexBleed, HEX_BLEED } from "@/components/onboarding/robu/HexBleed";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, type Transition } from "framer-motion";
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
/** About how long a cue (his thumbs-up) plays, before his ambient idle takes over again. */
const CUE_PLAY_MS = 2800;
/** Hex's box in a result panel, the same in every one. His body stands about 14px
 * inside it, so the 2px pull leaves 12px between the text and him. */
export const PANEL_HEX = "-my-4 -ml-0.5 h-[112px] w-[110px] shrink-0";

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
  // The cue that has finished playing, so the ambient idle can pick up again.
  const [playedCue, setPlayedCue] = useState<string | null>(null);
  // With nothing else to play, Hex keeps running his ambient idle. The first
  // one queues behind `enter`; it stops once he starts leaving.
  useEffect(() => {
    if (!ready || leaving || entryKey === null || (cue !== null && cue !== playedCue) || speaking) return;
    fireTrigger(HEX_ONBOARDING_TRIGGER.idleAmbient);
    const timer = window.setInterval(
      () => fireTrigger(HEX_ONBOARDING_TRIGGER.idleAmbient),
      IDLE_REPEAT_MS,
    );
    return () => window.clearInterval(timer);
  }, [ready, leaving, entryKey, cue, playedCue, speaking, fireTrigger]);
  useEffect(() => {
    if (!ready || !cue) return;
    const fire = window.setTimeout(() => fireNow(cue), cueDelayMs);
    const played = window.setTimeout(() => setPlayedCue(cue), cueDelayMs + CUE_PLAY_MS);
    return () => {
      window.clearTimeout(fire);
      window.clearTimeout(played);
    };
  }, [ready, cue, cueDelayMs, fireNow]);
  return <HexBleed Canvas={RiveComponent} />;
}


// Every result sheet (right and wrong here, and the "Yayyy!" panel on the Pick
// Up screen) follows Figma "Frame 201": a 22px / 28px title over a 14px body,
// 6px apart, beside Hex, drawn 2x his 109.65 x 79.95 box (219.3 x 159.9). The
// Rive box is mostly empty margin around him (he is drawn ~62% of it, ~136px
// wide), so the slot in the row is only as wide as he is drawn and as high as
// Figma's box; the box is centred on it and spills out unseen, which keeps the
// text clear of him and the sheet's height unchanged.
export const SHEET_TITLE_SIZE = "text-[22px] leading-7";
export const SHEET_HEX_SLOT = "relative h-[79.95px] w-[136px] shrink-0";
export const SHEET_HEX_BOX =
  "absolute top-1/2 left-1/2 h-[159.9px] w-[219.3px] -translate-x-1/2 -translate-y-1/2";

const FEEDBACK = {
  correct: {
    title: "Correct!",
    titleColor: "text-[#01A17F]",
    text: "font-medium leading-[1.4]",
    frame: "rounded-t-[28px] border-[1.5px]",
    panel: "border-[#7FD8CC] bg-[#E3F6F3] dark:border-[#1E5F59] dark:bg-[#0F2B28]",
    bold: "[&_b]:text-[#04ACAB]",
  },
  // Figma: a 3px red border (not on the bottom edge) and a 32px top radius.
  wrong: {
    title: "Not quite",
    titleColor: "text-[#D42421]",
    text: "font-medium leading-5",
    frame: "rounded-t-[32px] border-[3px]",
    panel: "border-[#D42421] bg-[#FDECEC] dark:border-[#6B2A2E] dark:bg-[#2E1517]",
    bold: "[&_b]:text-[#E5484D]",
  },
} as const;

/** How far "+10 XP" stays see-through at its strongest. */
const XP_OPACITY = 0.7;
/** It rises to the centre, holds, then leaves upward (a share of the whole run at each key). */
const XP_RISE: Transition = { duration: 1.6, delay: 0.15, times: [0, 0.2, 0.65, 1], ease: "easeOut" };
const XP_BOUNCE = { type: "spring", stiffness: 300, damping: 9, delay: 0.15 } as const;

/** A big "+10 XP" in the middle of the screen for a right answer: comes up to
 * the centre with a bounce, fading in, then fades out moving upward. */
export function XpBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <motion.span
        initial={{ opacity: 0, y: 60, scale: 0.4 }}
        animate={{ opacity: [0, XP_OPACITY, XP_OPACITY, 0], y: [60, 0, 0, -110], scale: 1 }}
        transition={{ opacity: XP_RISE, y: XP_RISE, scale: XP_BOUNCE }}
        className="text-[56px] leading-none font-bold whitespace-nowrap text-[#F5A623]"
      >
        +10 XP
      </motion.span>
    </div>
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
  title,
  children,
}: {
  correct: boolean;
  /** Replaces the default title ("Correct!" / "Not quite"). */
  title?: string;
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
      className={`absolute inset-x-0 bottom-0 z-0 mx-auto border-b-0 px-[25px] pt-5 pb-[140px] ${open ? "" : "pointer-events-none"} ${look.frame} ${look.panel}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className={`font-semibold tracking-[-0.1px] ${SHEET_TITLE_SIZE} ${look.titleColor}`}>{title ?? look.title}</h2>
          <p className={`text-[14px] text-[#444444] dark:text-white/80 [&_b]:font-semibold ${look.text} ${look.bold}`}>
            {children}
          </p>
        </div>
        <div ref={hexSlot} aria-hidden className={`pointer-events-none ${PANEL_HEX}`}>
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
