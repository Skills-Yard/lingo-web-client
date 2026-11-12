"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Note, Prompt } from "../text/Prompt";
import type { OptionData } from "../types";
import type { RowControl } from "./OptionRow";
import { OptionGrid, type GridLayout } from "./OptionGrid";
import { OptionList } from "./OptionList";
import { OptionObjects } from "./OptionObjects";
import { TrueFalse } from "./TrueFalse";

/** How the answers of a question are drawn. */
export type AnswersLook = "rows" | "tiles" | "objects" | "trueFalse";

/** What every Answers takes, however it is checked. */
type AnswersBase = {
  /**
   * `rows`: a column of cards with a picture and a sentence. `tiles`: cards side by side, a picture over the words.
   * `objects`: small cards for things to tap. `trueFalse`: two big cards, a tick and a cross (the options are then
   * `true` and `false`, and `yesNo` can change their words).
   */
  look?: AnswersLook;
  options: readonly (OptionData & { media?: ReactNode })[];
  /** The question that stands just above the answers, on its own plate. */
  question?: string;
  /** `rows`: shorter rows (56px) for answers that are only words. */
  compact?: boolean;
  /** `rows`: the space between rows (px, default 6) and the size of their words (px, default 14). */
  rowGap?: number;
  rowFont?: number;
  /** `rows`: keeps the picture's room in every row even when no answer has a picture (as the lesson screens' rows do). */
  pictureRoom?: boolean;
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

/** The usual way: the learner picks, then presses Check. The screen holds the pick and says when it is checked. */
type CheckedAnswersProps = AnswersBase & {
  instant?: false;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The answer has been checked: it can no longer be changed, and the right one is marked. */
  checked?: boolean;
  /** The right answer. */
  correctId?: string;
  /** With a wrong pick, still show the right one (default). Off: only the pick is marked. */
  revealCorrect?: boolean;
  /** The hint points at this answer. */
  hintId?: string | null;
};

/**
 * `instant`: a tap is checked at once, with no Check button. A wrong tap shakes red for a moment (and can be
 * tapped past); the right one turns green and stays. The component holds the pick itself and tells the screen.
 */
type InstantAnswersProps = AnswersBase & {
  instant: true;
  /** The right answer. */
  correctId: string;
  /** Called a moment after the right answer is tapped (give it the stage's `api.done`). */
  onRight: () => void;
  /** Called on each wrong tap (give it the stage's `api.slip`). */
  onWrong?: () => void;
  /** A red line under the answers after a wrong tap, until the right one is tapped. */
  wrongNote?: string;
};

export type AnswersProps = CheckedAnswersProps | InstantAnswersProps;

/** A wrong tap stays red this long (ms); the right one shows green this long before the screen is told. */
const WRONG_MS = 600;
const RIGHT_MS = 500;

/** The answers as they stand, in the look asked for; `note` is the red line under them (its room is kept while it is empty). */
function AnswersView({
  look = "rows",
  options,
  selectedId,
  onSelect,
  question,
  checked = false,
  correctId,
  revealCorrect = true,
  hintId = null,
  compact = false,
  rowGap,
  rowFont,
  pictureRoom,
  control = "none",
  marks = true,
  tiles = "auto",
  spill = false,
  yesNo,
  stagger = false,
  revealed = true,
  disabled = false,
  className = "",
  shakeWrong = false,
  note,
}: Omit<CheckedAnswersProps, "instant"> & { shakeWrong?: boolean; note?: string }) {
  const common = { selectedId, onSelect, checked, correctId, revealCorrect, hintId, disabled };
  return (
    <div className={`flex w-full flex-col items-center gap-2.5 ${className}`}>
      {question && <Prompt text={question} />}
      {look === "rows" && <OptionList options={options} compact={compact} gap={rowGap} fontSize={rowFont} pictureRoom={pictureRoom} control={control} marks={marks} stagger={stagger} revealed={revealed} shakeWrong={shakeWrong} {...common} />}
      {look === "tiles" && <OptionGrid options={options} layout={tiles} stagger={stagger} revealed={revealed} shakeWrong={shakeWrong} {...common} />}
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
      {note !== undefined && <Note tone="error" text={note} />}
    </div>
  );
}

/** Answers that check each tap at once (see `InstantAnswersProps`). */
function InstantAnswers({ correctId, onRight, onWrong, wrongNote, instant, ...view }: InstantAnswersProps) {
  void instant;
  const [done, setDone] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  // The screen's callback as it is now, for the moment the wait is over.
  const tellRight = useRef(onRight);
  useEffect(() => {
    tellRight.current = onRight;
  });
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const pick = (id: string) => {
    if (done || wrongId !== null) return;
    if (id === correctId) {
      setDone(true);
      setMissed(false);
      timers.current.push(window.setTimeout(() => tellRight.current(), RIGHT_MS));
      return;
    }
    onWrong?.();
    setMissed(true);
    setWrongId(id);
    timers.current.push(window.setTimeout(() => setWrongId(null), WRONG_MS));
  };

  return (
    <AnswersView
      {...view}
      correctId={correctId}
      selectedId={done ? correctId : wrongId}
      onSelect={pick}
      // Shown as checked while a tap is being answered: the right one for good, a wrong one for a moment.
      checked={done || wrongId !== null}
      revealCorrect={false}
      shakeWrong
      note={wrongNote === undefined ? undefined : missed ? wrongNote : ""}
    />
  );
}

/**
 * The answers of a question, in the look the data asks for. One component for every question of every
 * module, so picking, checking, the hint and the right/wrong colours behave the same everywhere. Usually
 * the learner picks and then presses Check; with `instant` each tap is checked at once.
 */
export function Answers(props: AnswersProps) {
  if (props.instant) return <InstantAnswers {...props} />;
  const { instant, ...view } = props;
  void instant;
  return <AnswersView {...view} />;
}
