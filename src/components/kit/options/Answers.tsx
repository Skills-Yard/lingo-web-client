"use client";

import type { ReactNode } from "react";
import { Prompt } from "../text/Prompt";
import type { OptionData } from "../types";
import type { RowControl } from "./OptionRow";
import { OptionGrid, type GridLayout } from "./OptionGrid";
import { OptionList } from "./OptionList";
import { OptionObjects } from "./OptionObjects";
import { TrueFalse } from "./TrueFalse";

/** How the answers of a question are drawn. */
export type AnswersLook = "rows" | "tiles" | "objects" | "trueFalse";

export type AnswersProps = {
  /**
   * `rows`: a column of cards with a picture and a sentence. `tiles`: cards side by side, a picture over the words.
   * `objects`: small cards for things to tap. `trueFalse`: two big cards, a tick and a cross (the options are then
   * `true` and `false`, and `yesNo` can change their words).
   */
  look?: AnswersLook;
  options: readonly (OptionData & { media?: ReactNode })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The question that stands just above the answers, on its own plate. */
  question?: string;
  /** The answer has been checked: it can no longer be changed, and the right one is marked. */
  checked?: boolean;
  /** The right answer. */
  correctId?: string;
  /** With a wrong pick, still show the right one (default). Off: only the pick is marked. */
  revealCorrect?: boolean;
  /** The hint points at this answer. */
  hintId?: string | null;
  /** `rows`: shorter rows (56px) for answers that are only words. */
  compact?: boolean;
  /** `rows`: a radio at each row's end. */
  control?: RowControl;
  /** `rows`: a tick or cross at the end of a checked row. */
  marks?: boolean;
  /** `tiles`: pair, three, grid or cards (default: by how many answers there are). */
  tiles?: GridLayout;
  /** `objects`: a wrong pick shakes and spills drops of water. */
  spill?: boolean;
  /** `trueFalse`: the words on the two cards: [for true, for false]. */
  yesNo?: readonly [string, string];
  /** `rows` and `tiles`: the answers bounce in one by one, once `revealed`. */
  stagger?: boolean;
  revealed?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * The answers of a question, in the look the data asks for. One component for every question of every
 * module, so picking, checking, the hint and the right/wrong colours behave the same everywhere.
 */
export function Answers({ look = "rows", options, selectedId, onSelect, question, checked = false, correctId, revealCorrect = true, hintId = null, compact = false, control = "none", marks = true, tiles = "auto", spill = false, yesNo, stagger = false, revealed = true, disabled = false, className = "" }: AnswersProps) {
  const common = { selectedId, onSelect, checked, correctId, revealCorrect, hintId, disabled };
  return (
    <div className={`flex w-full flex-col items-center gap-2.5 ${className}`}>
      {question && <Prompt text={question} />}
      {look === "rows" && <OptionList options={options} compact={compact} control={control} marks={marks} stagger={stagger} revealed={revealed} {...common} />}
      {look === "tiles" && <OptionGrid options={options} layout={tiles} stagger={stagger} revealed={revealed} {...common} />}
      {look === "objects" && <OptionObjects options={options} spill={spill} {...common} />}
      {look === "trueFalse" && (
        <TrueFalse
          value={selectedId === null ? null : selectedId === "true"}
          onSelect={(value) => onSelect(String(value))}
          checked={checked}
          correct={correctId === undefined ? undefined : correctId === "true"}
          revealCorrect={revealCorrect}
          labels={yesNo}
          hinted={hintId !== null}
          disabled={disabled}
        />
      )}
    </div>
  );
}
