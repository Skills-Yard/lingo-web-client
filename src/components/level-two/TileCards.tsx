"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { XpPop } from "@/components/level-one/FeedbackPanel";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { CARDS_RISE, GAP_ABOVE_BUTTONS } from "./AnswerCards";
import { aboveButtons } from "./LevelTwoShell";
import { SlotImage } from "./SlotImage";
import type { Choice } from "./levelTwo";

/** The result panel's own spring (see FeedbackPanel), so the cards rise as it arrives. */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/** Each layout's card height, the picture's box and the text's size. */
const LAYOUT = {
  pair: { card: "h-[184px]", picture: "h-[100px] w-full", text: "text-[14px] leading-[20px]", gap: "gap-3.5" },
  tiles: { card: "h-[110px]", picture: "h-[44px] w-full", text: "text-[13px] leading-[17px]", gap: "gap-3.5" },
} as const;

type TileCardsProps = {
  layout: "pair" | "tiles";
  choices: readonly Choice[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** Once the result panel is up the cards rise to make room for it (default: as soon as `checked`). */
  risen?: boolean;
  hinted: boolean;
  withHint: boolean;
  /** The text is a sentence: set smaller and left to wrap. */
  longText?: boolean;
  onPick: (id: string) => void;
};

/**
 * The answers as cards side by side — two big ones or three small tiles — in
 * the same 358px column as the rest of the screen, standing on the button row.
 * Like the list, they rise once the result panel is up (`risen`).
 */
export function TileCards({ layout, choices, correctId, selectedId, checked, risen = checked, hinted, withHint, longText, onPick }: TileCardsProps) {
  const look = LAYOUT[layout];
  return (
    <motion.div
      initial={{ opacity: 0, y: 90 }}
      animate={{ opacity: 1, y: risen ? -CARDS_RISE : 0 }}
      transition={
        risen
          ? PANEL_SPRING
          : { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } }
      }
      className={`pointer-events-auto absolute z-[1] flex w-[358px] items-stretch ${look.gap}`}
      style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, withHint), left: "calc(50% - 179px)" }}
    >
      {choices.map((choice) => {
        const state = optionState(choice.id, selectedId, checked, correctId);
        const hintHere = hinted && selectedId === null && choice.id === correctId;
        return (
          <HintFloat key={choice.id} className="relative flex min-w-0 flex-1" spin={false} active={hintHere}>
            <motion.button
              type="button"
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                onPick(choice.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border-4 px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] ${look.card} ${
                state === "idle" ? `border-white dark:border-transparent ${choice.tint ?? "bg-white"}` : LOOKS[state].card
              }`}
            >
              {/* The hint's orange fill, wiped in from the left behind the content. */}
              <motion.span
                aria-hidden
                initial={false}
                animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
                className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
              />
              <span className={`flex shrink-0 items-center justify-center ${look.picture}`}>
                <SlotImage file={choice.icon} className="max-h-full max-w-full object-contain" />
              </span>
              <span
                className={`text-center font-semibold text-[#444444] dark:text-white ${look.text} ${longText ? "text-[13px]! leading-[18px]!" : ""}`}
              >
                {choice.text}
              </span>
            </motion.button>
            <XpPop show={risen && choice.id === correctId && selectedId === correctId} />
          </HintFloat>
        );
      })}
    </motion.div>
  );
}
