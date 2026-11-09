"use client";

import { Check, X } from "lucide-react";
import { OptionTile } from "./OptionTile";
import { optionState } from "./state";

export type TrueFalseProps = {
  /** What is picked: `true`, `false`, or nothing yet. */
  value: boolean | null;
  onSelect: (value: boolean) => void;
  checked?: boolean;
  /** The right answer. */
  correct?: boolean;
  revealCorrect?: boolean;
  /** The words on the two cards: [for true, for false]. `["Yes", "No"]` makes a yes / no question. */
  labels?: readonly [string, string];
  /** The hint points at the right answer. */
  hinted?: boolean;
  disabled?: boolean;
  className?: string;
};

const Badge = ({ yes }: { yes: boolean }) => (
  <span className={`flex size-14 items-center justify-center rounded-full ${yes ? "bg-[#E3F6F3] text-[#01A17F] dark:bg-[#0F2B28]" : "bg-[#FDECEC] text-[#E5484D] dark:bg-[#2E1517]"}`}>
    {yes ? <Check aria-hidden className="size-8" strokeWidth={3.2} /> : <X aria-hidden className="size-8" strokeWidth={3.2} />}
  </span>
);

/** A true / false (or yes / no) question: two big cards, a tick and a cross. */
export function TrueFalse({ value, onSelect, checked = false, correct, revealCorrect = true, labels = ["True", "False"], hinted = false, disabled = false, className = "" }: TrueFalseProps) {
  const selectedId = value === null ? null : String(value);
  const correctId = correct === undefined ? undefined : String(correct);
  const cards = [
    { id: "true", text: labels[0], yes: true },
    { id: "false", text: labels[1], yes: false },
  ];
  return (
    <div role="radiogroup" className={`flex w-full items-stretch gap-3.5 ${className}`}>
      {cards.map((card) => (
        <OptionTile
          key={card.id}
          option={{ id: card.id, text: card.text }}
          size="pair"
          media={<Badge yes={card.yes} />}
          state={optionState(card.id, selectedId, checked, correctId, revealCorrect)}
          hinted={hinted && selectedId === null && card.id === correctId}
          disabled={disabled || checked}
          onPick={(id) => onSelect(id === "true")}
        />
      ))}
    </div>
  );
}
