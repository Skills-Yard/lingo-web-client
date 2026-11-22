"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { MENTORS, setCharacter, useCharacterLoading, useCharacterLook, type CharacterId } from "./characterLook";
import { MentorStage } from "./MentorStage";

/*
 * "Select your Mentor": what "Change character" in the battery's hold menu opens (see `BatteryMenu`,
 * which loads this file only when it is first asked for, so three.js stays out of every screen's
 * bundle). One card at a time, the arrows go to the next and the one before (round the three),
 * and "Choose …" makes it the character on the screens. The character on the card is the real 3D
 * model, idling (`MentorStage`); each loads when its card first comes up (a spinner until then)
 * and all are freed when the card closes. Choosing then loads the one the screens draw (it takes
 * a moment: the button says so, and the card closes when it is on show).
 */

type Theme = {
  /** The arrows and the name. */
  accent: string;
  /** The card's fill, light and dark. */
  light: string;
  dark: string;
};

const THEMES: Record<CharacterId, Theme> = {
  boy: {
    accent: "#7B5CE6",
    light: "linear-gradient(180deg,#D9D1F7 0%,#EEEAFC 52%,#FBFAFF 100%)",
    dark: "linear-gradient(180deg,#322B63 0%,#232241 55%,#17181F 100%)",
  },
  girl: {
    accent: "#17A294",
    light: "linear-gradient(180deg,#C9E8F3 0%,#E6EEFB 52%,#FDF6FB 100%)",
    dark: "linear-gradient(180deg,#17414A 0%,#1B2D3E 55%,#17181F 100%)",
  },
  anime: {
    accent: "#EE8438",
    light: "linear-gradient(180deg,#FCD8BE 0%,#FEEADB 52%,#FFFBF7 100%)",
    dark: "linear-gradient(180deg,#523219 0%,#30251F 55%,#17181F 100%)",
  },
};

const SLIDE = { duration: 0.18, ease: "easeOut" } as const;

type MentorPickerProps = {
  open: boolean;
  onClose: () => void;
};

const noSubscription = () => () => {};

export function MentorPicker({ open, onClose }: MentorPickerProps) {
  // The body is only there in the browser.
  const inBrowser = useSyncExternalStore(noSubscription, () => true, () => false);
  return inBrowser
    ? createPortal(
        <AnimatePresence>{open && <MentorCard key="mentor-picker" onClose={onClose} />}</AnimatePresence>,
        document.body,
      )
    : null;
}

function MentorCard({ onClose }: { onClose: () => void }) {
  const { character } = useCharacterLook();
  const loading = useCharacterLoading();
  // Which mentor is on the card; it starts as the one on the screens.
  const [index, setIndex] = useState(() => Math.max(0, MENTORS.findIndex(({ id }) => id === character)));
  const [direction, setDirection] = useState(1);
  // The one chosen while it loads.
  const [chosen, setChosen] = useState<CharacterId | null>(null);
  const mentor = MENTORS[index];
  const theme = THEMES[mentor.id];

  const go = (step: number) => {
    if (chosen) return;
    setDirection(step);
    setIndex((current) => (current + step + MENTORS.length) % MENTORS.length);
  };

  // The card closes once the chosen character is on the screens (at once if it was loaded already).
  useEffect(() => {
    if (chosen && loading !== chosen) onClose();
  }, [chosen, loading, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choose = () => {
    if (mentor.id === character) return onClose();
    setChosen(mentor.id);
    setCharacter(mentor.id);
  };

  return (
    <motion.div
      className="fixed inset-0 z-2147483000 flex items-center justify-center bg-black/55 p-5 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-label="Select your Mentor"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative h-[min(560px,calc(100dvh-40px))] w-[min(320px,100%)] overflow-hidden rounded-[26px] bg-(image:--mentor-light) shadow-[0_16px_40px_rgba(0,0,0,0.35)] dark:bg-(image:--mentor-dark)"
        style={{ "--mentor-light": theme.light, "--mentor-dark": theme.dark } as React.CSSProperties}
      >
        <h2 className="pt-5 text-center text-[18px] leading-6 font-semibold text-[#444444] dark:text-white">Select your Mentor</h2>

        <div className="absolute inset-x-0 top-13 bottom-22 flex flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mentor.id}
              initial={{ opacity: 0, x: direction * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -36 }}
              transition={SLIDE}
              className="rounded-full bg-white px-5 py-1 text-[15px] leading-5 font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#1A1C22]"
              style={{ color: theme.accent }}
            >
              {mentor.name}
            </motion.span>
          </AnimatePresence>
          <div className="relative mt-3 min-h-0 w-full flex-1">
            <MentorStage id={mentor.id} name={mentor.name} accent={theme.accent} />
          </div>
        </div>

        <ArrowButton side="left" accent={theme.accent} onPress={() => go(-1)} />
        <ArrowButton side="right" accent={theme.accent} onPress={() => go(1)} />

        <div className="absolute inset-x-4 bottom-4">
          <Button3D className="w-full" onClick={choose} disabled={chosen !== null}>
            {chosen ? "Loading…" : `Choose ${mentor.name}`}
          </Button3D>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ArrowButton({ side, accent, onPress }: { side: "left" | "right"; accent: string; onPress: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      aria-label={side === "left" ? "Previous mentor" : "Next mentor"}
      whileTap={{ scale: 0.9 }}
      onClick={onPress}
      className={`absolute top-[46%] flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ${side === "left" ? "left-3" : "right-3"}`}
      style={{ backgroundColor: accent }}
    >
      <Icon aria-hidden className="size-5" strokeWidth={3} />
    </motion.button>
  );
}
