"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { MENTORS, setCharacter, useCharacterLook, type CharacterId } from "./characterLook";
import { MentorStage } from "./MentorStage";

/*
 * `/choose-character` — "Select your Mentor". The battery's hold menu ("Change character", see
 * `BatteryMenu`) opens it. One mentor at a time, the arrows go to the next and the one before
 * (round the three), and "Choose …" makes it the character on the screens and returns to where
 * the learner came from (`onClose`). The character is the real 3D model, idling (`MentorStage`),
 * loaded when its mentor first comes up (a spinner until then).
 *
 * It is a page of its own, so no shared character is on screen to wait for: the pick is stored
 * and the screen the learner returns to loads it (`sharedCharacter.ts`).
 */

type Theme = {
  /** The arrows and the name. */
  accent: string;
  /** The page's fill, light and dark. */
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

type ChooseCharacterScreenProps = {
  /** Leave the page: after "Choose …" (the pick is already stored) and on Back / Escape (nothing changed). */
  onClose: () => void;
};

export function ChooseCharacterScreen({ onClose }: ChooseCharacterScreenProps) {
  const { character } = useCharacterLook();
  // The mentor the arrows moved to; until they are used it is the one on the screens (read from
  // the store each render, so a page that was server-rendered shows the stored one once it is known).
  const [picked, setPicked] = useState<CharacterId | null>(null);
  const [direction, setDirection] = useState(1);
  const index = Math.max(0, MENTORS.findIndex(({ id }) => id === (picked ?? character)));
  const mentor = MENTORS[index];
  const theme = THEMES[mentor.id];

  const go = (step: number) => {
    setDirection(step);
    setPicked(MENTORS[(index + step + MENTORS.length) % MENTORS.length].id);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choose = () => {
    if (mentor.id !== character) setCharacter(mentor.id);
    onClose();
  };

  return (
    <main
      className="h-dvh w-full overflow-hidden bg-(image:--mentor-light) font-sans text-[#444444] dark:bg-(image:--mentor-dark) dark:text-white"
      style={{ "--mentor-light": theme.light, "--mentor-dark": theme.dark } as React.CSSProperties}
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col px-5 pt-[calc(var(--screen-top)+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <header className="relative flex h-10 shrink-0 items-center justify-center">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="absolute left-0 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/70 text-[#444444] shadow-[0_1px_4px_rgba(0,0,0,0.12)] active:scale-95 dark:bg-white/10 dark:text-white"
          >
            <ChevronLeft aria-hidden className="size-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[18px] leading-6 font-semibold">Select your Mentor</h1>
        </header>

        <div className="mt-4 flex shrink-0 justify-center">
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
        </div>

        <div className="relative mt-3 min-h-0 flex-1">
          {/* The model is framed to the thighs: the canvas's straight bottom edge fades out instead of cutting it. */}
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_82%,transparent)]">
            <MentorStage id={mentor.id} name={mentor.name} accent={theme.accent} />
          </div>
          <ArrowButton side="left" accent={theme.accent} onPress={() => go(-1)} />
          <ArrowButton side="right" accent={theme.accent} onPress={() => go(1)} />
        </div>

        <div className="mt-4 shrink-0">
          <Button3D className="w-full" onClick={choose}>
            {`Choose ${mentor.name}`}
          </Button3D>
        </div>
      </div>
    </main>
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
      className={`absolute top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ${side === "left" ? "left-0" : "right-0"}`}
      style={{ backgroundColor: accent }}
    >
      <Icon aria-hidden className="size-5" strokeWidth={3} />
    </motion.button>
  );
}
