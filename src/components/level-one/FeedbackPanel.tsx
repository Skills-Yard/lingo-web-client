"use client";

import { HexBleed, HEX_BLEED } from "@/components/onboarding/robu/HexBleed";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
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


const FEEDBACK = {
  correct: {
    title: "Correct, you got it!",
    panel: "bg-[#E3F6F3] dark:bg-[#0F2B28]",
    accent: "text-[#04ACAB]",
    bold: "[&_b]:text-[#04ACAB]",
    badge: "bg-[#04ACAB]",
    Icon: Check,
  },
  wrong: {
    title: "Not quite, try to remember!",
    panel: "bg-[#FDEAEA] dark:bg-[#2E1517]",
    accent: "text-[#E5484D]",
    bold: "[&_b]:text-[#E5484D]",
    badge: "bg-[#E5484D]",
    Icon: X,
  },
} as const;

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
  const { Icon } = look;
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: open ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      className={`absolute inset-x-0 bottom-0 z-0 rounded-t-[28px] px-4 pt-5 pb-[176px] ${open ? "" : "pointer-events-none"} ${look.panel}`}
    >
      <div className="mx-auto flex w-full items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white ${look.badge}`}>
              <Icon className="size-4" strokeWidth={3.2} />
            </span>
            <h2 className={`text-[18px] leading-tight font-semibold ${look.accent}`}>{look.title}</h2>
          </div>
          <p className={`mt-2 max-w-[210px] text-[14px] leading-[1.4] font-medium text-[#444444] dark:text-white/80 [&_b]:font-semibold ${look.bold}`}>
            {children}
          </p>
        </div>
        <div ref={hexSlot} aria-hidden className="pointer-events-none -my-1 h-[120px] w-[130px] shrink-0">
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
