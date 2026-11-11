"use client";

import { motion } from "framer-motion";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { SlotImage } from "@/components/level-two/SlotImage";
import { AnswerMark } from "../feedback/AnswerMark";
import { feelTap } from "../feel";
import { RAISED } from "@/components/ui/raised";
import { HINT_FILL, STATE_CARD, STATE_EDGE, WRONG_SHAKE } from "../tokens";
import type { OptionData, OptionState } from "../types";

/** What stands at the row's end: nothing, a round radio, or a square checkbox. */
export type RowControl = "none" | "radio" | "checkbox";

export type OptionRowProps = {
  option: OptionData;
  state?: OptionState;
  /** The hint points here: an orange fill wipes across and the row floats. */
  hinted?: boolean;
  /** A shorter row (56px) for answers that are only words, so more fit. */
  compact?: boolean;
  control?: RowControl;
  /** A tick or cross at the row's end once it is checked (default). Off for a row that only changes colour. */
  marks?: boolean;
  /** Keeps room for a picture even if this row has none, so the text of every row starts at the same place. */
  imageSlot?: boolean;
  /** The size of the words (px), where it should differ from the usual 14; their line height follows (8 more). */
  fontSize?: number;
  /** A wrong row shakes from side to side (answers that check each tap at once). */
  shake?: boolean;
  disabled?: boolean;
  onPick?: (id: string) => void;
};

/** The round or square box at the row's end. */
function Control({ kind, state, marks, compact }: { kind: RowControl; state: OptionState; marks: boolean; compact: boolean }) {
  if (marks && state === "correct" && kind !== "checkbox") return <AnswerMark kind="correct" />;
  if (marks && state === "wrong" && kind !== "checkbox") return <AnswerMark kind="wrong" />;
  // A row with no control still keeps the room where one would stand (as the lesson screens' rows do), so the words wrap alike.
  if (kind === "none") return compact ? null : <span aria-hidden className="size-[34px] shrink-0 rounded-full" />;
  const on = state !== "idle";
  const tone = state === "wrong" ? "border-[#E5484D] bg-[#E5484D]" : "border-primary bg-primary";
  return (
    <span
      aria-hidden
      className={`flex size-[26px] shrink-0 items-center justify-center border-2 transition-colors ${kind === "radio" ? "rounded-full" : "rounded-[7px]"} ${on ? tone : "border-[#C9CED4] dark:border-white/30"}`}
    >
      {on && kind === "radio" && <span className="size-2.5 rounded-full bg-white" />}
      {on && kind === "checkbox" && (
        <svg viewBox="0 0 16 16" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          {state === "wrong" ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="M3.5 8.5l3 3 6-7" />}
        </svg>
      )}
    </span>
  );
}

/**
 * One answer as a white card across the column: a picture, the words and, at the
 * end, a radio (or a tick / cross once it is checked). Tap to pick it.
 */
export function OptionRow({ option, state = "idle", hinted = false, compact = false, control = "none", marks = true, imageSlot, fontSize, shake = false, disabled = false, onPick }: OptionRowProps) {
  const showImage = imageSlot ?? !!option.image;
  return (
    <HintFloat className="relative w-full" spin={false} active={hinted}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => {
          feelTap();
          onPick?.(option.id);
        }}
        aria-pressed={state === "selected"}
        animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, x: shake && state === "wrong" ? WRONG_SHAKE : 0 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`pointer-events-auto relative isolate flex w-full items-center justify-between overflow-hidden rounded-[18px] border px-3.5 text-left ${RAISED} ${STATE_EDGE[state]} enabled:cursor-pointer ${
          compact ? "h-[56px] gap-3 py-1.5" : "h-[76px] gap-[34px] py-2.5"
        } ${state === "idle" ? "border-black/4 bg-white dark:border-[#818185] dark:bg-[#15181E]" : STATE_CARD[state]}`}
      >
        {/* The hint's orange fill, wiped in from the left behind the content. */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ clipPath: hinted ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
          transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
          className={`pointer-events-none absolute inset-0 -z-10 ${HINT_FILL}`}
        />
        <span className={`flex min-w-0 flex-1 items-center ${compact ? "gap-3" : "gap-[22px]"}`}>
          {showImage && (
            <span className="flex h-[47px] w-[47px] shrink-0 items-center justify-center">{option.image && <SlotImage file={option.image} className="max-h-full max-w-full object-contain" />}</span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14px] leading-[22px] font-medium text-[#444444] dark:text-white" style={fontSize ? { fontSize, lineHeight: `${fontSize + 8}px` } : undefined}>
              {option.text}
            </span>
            {option.sub && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{option.sub}</span>}
          </span>
        </span>
        <Control kind={control} state={state} marks={marks} compact={compact} />
      </motion.button>
    </HintFloat>
  );
}
