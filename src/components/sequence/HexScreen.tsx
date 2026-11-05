"use client";

import type { ComponentProps, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lightbulb, RotateCcw } from "lucide-react";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { MeadowBackdrop } from "@/components/level-one/MoveHexScreen";
import { LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { COMMAND_LABEL, type Command } from "./hexGrid";
import { SEQUENCE_STEPS, sequencePrevious } from "./sequence";

/** What Hex's board screens say in place of a speech bubble (Hex himself is on the board). */
export function TipCard({ children }: { children: string }) {
  return (
    <motion.div
      key={children}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-[12px] bg-[#F1EEFF] px-3.5 py-3 dark:bg-[#23204A]"
    >
      <Lightbulb aria-hidden className="size-6 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
      <p className="text-[14px] leading-5 font-medium text-[#444444] dark:text-white">{children}</p>
    </motion.div>
  );
}

/** The commands as numbered pills, the one being carried out (if any) lit. */
export function CommandChips({ commands, active = -1 }: { commands: readonly Command[]; active?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {commands.map((command, index) => (
        <span
          key={index}
          className={`flex items-center gap-1.5 rounded-full border-2 py-1 pr-3 pl-1 text-[11px] leading-4 font-semibold tracking-[0.2px] transition-colors ${
            index === active
              ? "border-[#04ACAB] bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]"
              : "border-white bg-white text-[#444444] shadow-[1px_1px_4px_rgba(0,0,0,0.15)] dark:border-[#818185] dark:bg-[#15181E] dark:text-white"
          }`}
        >
          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#D9DEE3] text-[10px] text-[#5C6670] dark:bg-white/15 dark:text-white/70">
            {index + 1}
          </span>
          {COMMAND_LABEL[command]}
        </span>
      ))}
    </div>
  );
}

/** A small pill that plays the sequence again. */
export function ReplayButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        playClickSound();
        vibrateForTap();
        onPress();
      }}
      disabled={disabled}
      className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-[#E7ECEF] bg-white px-4 py-2 text-[14px] leading-5 font-semibold text-[#08A4AD] shadow-[0_2px_10px_rgba(31,42,68,0.08)] enabled:active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-[#15181E]"
    >
      <RotateCcw aria-hidden className="size-4" /> Replay
    </button>
  );
}

type HexScreenProps = {
  step: number;
  /** The title's content; `titleSize` sets its size and `wrapTitle` lets it take two lines. */
  title: ReactNode;
  titleSize?: number;
  wrapTitle?: boolean;
  /** The board (a `HexBoard`), `boardTop` stage px down. */
  board: ReactNode;
  boardTop: number;
  /** The sentence on the card under the board, `tipTop` stage px down; a new one fades in. */
  tip?: string;
  tipTop?: number;
  /** The result panel, with Hex, for a right or wrong outcome. */
  panel?: { correct: boolean; title: string; text: string; open: boolean };
  /** Everything over the screen (a popup). */
  overlay?: ReactNode;
  /** Right outcome: confetti and the XP. */
  celebrate?: boolean;
  /** Things that stand on the stage: the controls. */
  children?: ReactNode;
} & Pick<ComponentProps<typeof LevelTwoShell>, "answer" | "ctaLabel" | "ctaDisabled" | "ctaLocked" | "hint" | "onContinue" | "onBack">;

/**
 * The frame the Hex board screens share: the meadow, a title, the board, a tip
 * card and the controls, on Level Two's shell, with the result panel (and Hex)
 * sliding up from the bottom as on the quiz screens.
 */
export function HexScreen({ step, title, titleSize, wrapTitle = false, board, boardTop, tip, tipTop = 0, panel, overlay, celebrate = false, children, onBack, ...shell }: HexScreenProps) {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={step}
      total={SEQUENCE_STEPS}
      onBack={onBack ?? (() => router.push(sequencePrevious(step)))}
      scene={<MeadowBackdrop />}
      overlay={
        <>
          {panel && (
            <div className="pointer-events-none absolute inset-0">
              <FeedbackPanel correct={panel.correct} title={panel.title} open={panel.open} hexIn={panel.open} hexCue={panel.correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}>
                {panel.text}
              </FeedbackPanel>
            </div>
          )}
          {overlay}
        </>
      }
      {...shell}
    >
      <ScreenTitle oneLine={!wrapTitle}>
        <span style={titleSize ? { fontSize: titleSize } : undefined}>{title}</span>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: boardTop }}>
        {board}
      </div>
      {tip && (
        <div className="absolute left-1/2 w-[340px] -translate-x-1/2" style={{ top: tipTop }}>
          <TipCard>{tip}</TipCard>
        </div>
      )}
      {children}
      <Confetti active={celebrate} />
      <XpBurst show={celebrate} />
    </LevelTwoShell>
  );
}
