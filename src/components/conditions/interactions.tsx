"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { CARD, CARD_FACE, CREAM, LAVENDER, Pic, Pile, WHITE } from "@/components/operators/visuals";
import { EDGE, RAISED, RAISED_SMALL } from "@/components/ui/raised";
import type { InteractionApi } from "./screen";

const SHAKE = [0, -7, 7, -5, 5, 0];
/** A wrong try shakes red for this long (ms). */
const WRONG_MS = 800;
const PILL = "cursor-pointer rounded-full bg-[#08A4AD] px-6 py-2 text-[16px] leading-6 font-bold text-white shadow-[0_3px_0_#067F86] active:translate-y-px active:shadow-[0_2px_0_#067F86]";

/** What an answer looks like once it is shown: green for True/Yes, red for False/No, teal for anything else. */
const chipTone = (answer: string) => (answer === "True" || answer === "Yes" ? "bg-[#01A17F] text-white" : answer === "False" || answer === "No" ? "bg-[#D42421] text-white" : "bg-[#08A4AD] text-white");

function Note({ children }: { children: ReactNode }) {
  return <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]">{children}</p>;
}

export type PredictRow = {
  /** What is tested: a value ("8"), a question, or a case. */
  label: string;
  /** The test written out ("8 > 0"). */
  sub?: string;
  /** The right answer, one of the choices. */
  answer: string;
};

/**
 * Predict before the result shows: each row is a case with the answers to pick
 * from (True or False by default). A right pick turns the row green and shows
 * the answer; a wrong one shakes red with a hint (and counts as a slip). Done
 * when every row is answered.
 */
export function PredictTestStage({
  api,
  header,
  rows,
  choices = ["True", "False"],
  hint,
  prompt = "Predict each result.",
}: {
  api: InteractionApi;
  /** What stands above the rows (the condition, a picture). */
  header?: ReactNode;
  rows: readonly PredictRow[];
  choices?: readonly string[];
  hint: string;
  prompt?: string;
}) {
  const { slip, done, finished } = api;
  const [got, setGot] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const pick = (index: number, choice: string) => {
    if (finished || got.includes(index)) return;
    playClickSound();
    vibrateForTap();
    if (choice === rows[index].answer) {
      setNote("");
      const next = [...got, index];
      setGot(next);
      if (next.length === rows.length) window.setTimeout(() => done(), 800);
      return;
    }
    slip();
    setNote(hint);
    setWrong(index);
    window.setTimeout(() => setWrong(null), WRONG_MS);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      {header}
      <div className="flex w-full flex-col gap-1.5">
        {rows.map((row, index) => {
          const right = got.includes(index);
          return (
            <motion.div
              key={index}
              animate={{ x: wrong === index ? SHAKE : 0 }}
              transition={{ duration: 0.4 }}
              className={`flex min-h-[48px] items-center gap-2 px-3 py-1.5 ${CARD} ${right ? LOOKS.correct.card : wrong === index ? LOOKS.wrong.card : CREAM}`}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] leading-5 font-bold text-[#444444] dark:text-white">{row.label}</span>
                {row.sub && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{row.sub}</span>}
              </div>
              {right ? (
                <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full px-3 py-0.5 text-[14px] leading-6 font-bold ${chipTone(row.answer)}`}>
                  {row.answer}
                </motion.span>
              ) : (
                <div className="flex gap-1.5">
                  {choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => pick(index, choice)}
                      className={`h-[34px] min-w-[52px] cursor-pointer rounded-[8px] border-2 border-[#B8E0E0] bg-white px-2 text-[14px] leading-none font-bold text-[#04908F] [--edge:#9CCFCF] dark:border-[#2F5D59] dark:bg-[#15181E] dark:text-[#7FD8CC] ${RAISED_SMALL}`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      <Note>{note || <span className="text-[#6B7480] dark:text-white/60">{finished ? "" : prompt}</span>}</Note>
    </div>
  );
}

export type ComboInput = { id: string; label: string; pic: string; on: string; off: string };

/**
 * Try the combinations: each input is switched on or off by a tap, and the
 * learner says whether the requirement is satisfied. A right answer is
 * remembered for that combination; a wrong one shakes with a hint (and counts
 * as a slip). Done once every combination has been answered.
 */
export function ComboStage({
  api,
  inputs,
  rule,
  ask,
  yes = "Yes",
  no = "No",
  hint,
  explain,
}: {
  api: InteractionApi;
  inputs: readonly ComboInput[];
  /** Whether the requirement is satisfied for the states of the inputs. */
  rule: (states: readonly boolean[]) => boolean;
  ask: string;
  yes?: string;
  no?: string;
  hint: string;
  /** What shows once the answer is right (default: the answer). */
  explain?: (states: readonly boolean[], result: boolean) => string;
}) {
  const { slip, done, finished } = api;
  const total = 2 ** inputs.length;
  const [states, setStates] = useState<readonly boolean[]>(() => inputs.map(() => true));
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [shown, setShown] = useState<boolean | null>(null);
  const [wrong, setWrong] = useState(false);
  const [note, setNote] = useState("");

  const toggle = (index: number) => {
    if (finished) return;
    playClickSound();
    vibrateForTap();
    setStates((now) => now.map((state, place) => (place === index ? !state : state)));
    setShown(null);
    setNote("");
  };

  const answer = (choice: boolean) => {
    if (finished) return;
    playClickSound();
    vibrateForTap();
    const truth = rule(states);
    if (choice === truth) {
      setNote("");
      setShown(truth);
      const key = states.map((state) => (state ? "1" : "0")).join("");
      const next = seen.includes(key) ? seen : [...seen, key];
      setSeen(next);
      if (next.length === total && !seen.includes(key)) window.setTimeout(() => done(), 1100);
      return;
    }
    slip();
    setNote(hint);
    setWrong(true);
    window.setTimeout(() => setWrong(false), WRONG_MS);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      <div className="flex w-full justify-center gap-2.5">
        {inputs.map((input, index) => (
          <motion.button
            key={input.id}
            type="button"
            onClick={() => toggle(index)}
            whileTap={{ scale: 0.96 }}
            className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 px-2 py-2.5 ${inputs.length === 1 ? "max-w-[200px]" : ""} ${CARD_FACE} ${RAISED} ${EDGE.khaki} ${CREAM}`}
          >
            <Pic src={input.pic} className="h-10 w-10" />
            <span className="text-[13px] leading-4 font-bold text-[#444444] dark:text-white">{input.label}</span>
            <motion.span
              key={String(states[index])}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full px-3 py-0.5 text-[13px] leading-5 font-bold text-white ${states[index] ? "bg-[#01A17F]" : "bg-[#8A94A0]"}`}
            >
              {states[index] ? input.on : input.off}
            </motion.span>
          </motion.button>
        ))}
      </div>
      <p className="text-center text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">{ask}</p>
      <motion.div animate={{ x: wrong ? SHAKE : 0 }} transition={{ duration: 0.4 }} className="flex gap-3">
        {[true, false].map((choice) => (
          <button key={String(choice)} type="button" onClick={() => answer(choice)} className={`${PILL} min-w-[96px] ${choice ? "" : "bg-[#6B7480]! shadow-[0_3px_0_#4B525B]!"}`}>
            {choice ? yes : no}
          </button>
        ))}
      </motion.div>
      <div className="flex min-h-[40px] w-full flex-col items-center gap-1">
        {shown !== null && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[12px] px-3 py-1 text-center text-[14px] leading-5 font-bold text-white ${shown ? "bg-[#01A17F]" : "bg-[#D42421]"}`}>
            {explain ? explain(states, shown) : shown ? yes : no}
          </motion.p>
        )}
        <Note>{note}</Note>
      </div>
      <div className="flex items-center gap-1.5" aria-label={`${seen.length} of ${total} combinations answered`}>
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={`size-2.5 rounded-full ${index < seen.length ? "bg-[#01A17F]" : "bg-[#C9CED6]"}`} />
        ))}
        <span className="pl-1 text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">
          {seen.length} of {total} combinations
        </span>
      </div>
    </div>
  );
}

/** A table cell: True and False as chips, anything else as text. */
function Cell({ value }: { value: string }) {
  if (value === "True" || value === "False") {
    return <span className={`rounded-full px-2.5 py-0 text-[13px] leading-5 font-bold ${value === "True" ? "bg-[#01A17F] text-white" : "bg-[#D42421] text-white"}`}>{value}</span>;
  }
  return <span className="text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{value}</span>;
}

/**
 * A table whose result columns are hidden: tap a row to reveal them. Done once
 * every row has been revealed.
 */
export function TableStage({ api, headers, rows, hidden, header }: { api: InteractionApi; headers: readonly string[]; rows: readonly (readonly string[])[]; hidden: readonly number[]; header?: ReactNode }) {
  const { done, finished } = api;
  const [revealed, setRevealed] = useState<readonly number[]>([]);

  const reveal = (index: number) => {
    if (revealed.includes(index)) return;
    playClickSound();
    vibrateForTap();
    const next = [...revealed, index];
    setRevealed(next);
    if (next.length === rows.length) window.setTimeout(() => done(), 1000);
  };

  const grid = { gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` };
  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      {header}
      <div className={`flex w-full flex-col gap-1 px-2 py-2 ${CARD} ${WHITE}`}>
        <div className="grid items-center gap-1 px-1" style={grid}>
          {headers.map((title) => (
            <span key={title} className="text-center text-[11px] leading-4 font-bold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">
              {title}
            </span>
          ))}
        </div>
        {rows.map((row, index) => {
          const open = revealed.includes(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => reveal(index)}
              aria-label={`Row ${index + 1}`}
              className={`grid min-h-[38px] cursor-pointer items-center gap-1 rounded-[8px] border-2 px-1 py-1 ${RAISED_SMALL} ${open ? "border-[#7FD8CC] bg-[#E3F6F3] [--edge:#7FD8CC] dark:bg-[#0F2B28]" : `border-dashed border-[#C9CED6] bg-white/60 dark:bg-white/5 ${EDGE.pale}`}`}
              style={grid}
            >
              {row.map((value, column) => (
                <span key={column} className="flex items-center justify-center">
                  {hidden.includes(column) && !open ? (
                    <span className="rounded-full border-2 border-dashed border-[#C9CED6] px-3 text-[13px] leading-5 font-bold text-[#8A94A0]">?</span>
                  ) : (
                    <motion.span initial={hidden.includes(column) ? { scale: 0.5, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }}>
                      <Cell value={value} />
                    </motion.span>
                  )}
                </span>
              ))}
            </button>
          );
        })}
      </div>
      <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
        {finished ? "" : revealed.length === 0 ? "Tap each row to reveal its result." : `${revealed.length} of ${rows.length} rows revealed.`}
      </p>
    </div>
  );
}

export type PathStep = { title: string; text: string; code?: boolean };

/**
 * A path of steps that appears one at a time: each tap of the button adds the
 * next. Done when the last one is shown.
 */
export function PathStage({ api, steps }: { api: InteractionApi; steps: readonly PathStep[] }) {
  const { done, finished } = api;
  const [shown, setShown] = useState(1);
  const last = shown === steps.length;

  const next = () => {
    if (last || finished) return;
    playClickSound();
    vibrateForTap();
    const to = shown + 1;
    setShown(to);
    if (to === steps.length) window.setTimeout(() => done(), 1000);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      <div className="flex w-full flex-col gap-1">
        <AnimatePresence initial={false}>
          {steps.slice(0, shown).map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 rounded-[10px] px-2.5 py-1 ${index === shown - 1 ? "bg-white shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E]" : "bg-white/50 dark:bg-white/5"}`}
            >
              <span className="mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] text-[11px] leading-none font-bold text-white">{index + 1}</span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] leading-4 font-bold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">{step.title}</span>
                <span className={`text-[14px] leading-5 font-semibold text-[#2F5D59] dark:text-[#BFE6E2] ${step.code ? "font-mono text-[#08A4AD]" : ""}`}>{step.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!last && (
        <button type="button" onClick={next} className={PILL}>
          Next step
        </button>
      )}
    </div>
  );
}

/**
 * Numbers split into two equal groups: tap a number to see its objects share
 * out, and whether one is left over. Done once every number has been tried.
 */
export function PairUpStage({ api, numbers }: { api: InteractionApi; numbers: readonly number[] }) {
  const { done, finished } = api;
  const [seen, setSeen] = useState<readonly number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);

  const tap = (value: number) => {
    playClickSound();
    vibrateForTap();
    setCurrent(value);
    const next = seen.includes(value) ? seen : [...seen, value];
    setSeen(next);
    if (next.length === numbers.length && !seen.includes(value)) window.setTimeout(() => done(), 1100);
  };

  const half = current === null ? 0 : Math.floor(current / 2);
  const left = current === null ? 0 : current % 2;
  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      <div className="flex w-full justify-center gap-2">
        {numbers.map((value) => (
          <motion.button
            key={value}
            type="button"
            onClick={() => tap(value)}
            animate={{ scale: current === value ? [1, 0.92, 1.08, 1] : 1 }}
            transition={{ duration: 0.35 }}
            whileTap={{ scale: 0.94 }}
            className={`h-[48px] min-w-[64px] cursor-pointer rounded-[10px] text-[22px] leading-none font-bold text-white ${RAISED_SMALL} ${current === value ? "bg-[#FFB300] [--edge:#C98A00]" : seen.includes(value) ? "bg-[#04ACAB] [--edge:#067F86]" : "bg-[#08A4AD] [--edge:#067F86]"}`}
          >
            {value}
          </motion.button>
        ))}
      </div>
      <div className={`flex min-h-[110px] w-full items-center justify-center gap-2 px-2 py-2 ${CARD} ${LAVENDER}`}>
        {current === null ? (
          <span className="text-[14px] leading-5 font-medium text-[#6B7480] dark:text-white/60">Tap a number to share it into two equal groups.</span>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2.5">
              {[1, 2].map((group) => (
                <div key={group} className="flex min-w-[78px] flex-col items-center gap-1 rounded-[10px] border-2 border-[#04ACAB] bg-[#E3F6F3] px-2 py-1.5 dark:bg-[#0F2B28]">
                  <span className="text-[10px] leading-3 font-bold text-[#04908F] uppercase">Group {group}</span>
                  <Pile count={half} columns={Math.max(1, Math.min(half, 5))} />
                  <span className="text-[14px] leading-5 font-bold text-[#444444] dark:text-white">{half}</span>
                </div>
              ))}
              {left > 0 && (
                <div className="flex min-w-[50px] flex-col items-center gap-1 rounded-[10px] border-2 border-dashed border-[#FFB300] bg-[#FFF8E1] px-2 py-1.5 dark:bg-[#2A2218]">
                  <span className="text-[10px] leading-3 font-bold text-[#A85B00] uppercase">Left</span>
                  <Pile count={left} />
                  <span className="text-[14px] leading-5 font-bold text-[#444444] dark:text-white">{left}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <p className="min-h-5 text-center text-[14px] leading-5 font-semibold text-[#2F5D59] dark:text-[#BFE6E2]">
        {current === null ? "" : left === 0 ? `${current} shares into two equal groups. Nothing is left.` : `${current} can't share equally: ${left} is left over.`}
      </p>
      {finished ? null : <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{seen.length} of {numbers.length} numbers tried</span>}
    </div>
  );
}
