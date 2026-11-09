"use client";

import { stageTop } from "@/components/level-two/LevelTwoShell";
import { BottleWithAmount, Classroom, AttendanceBoard, Counter, NameValue, ShopItem, useChange, useTimeline, Wallet, CARD } from "@/components/kit/content/from-variable/visuals";
import { Items } from "@/components/kit/content/from-variable/interactions";
import type { VisualContext } from "@/components/kit/content/from-variable/quiz";

/* ───────────────────────── Pictures that move ───────────────────────── */

/** A bottle whose water goes from `from` to `to` ml shortly after the screen opens (again when the learner tries again); the amount is left for the learner to read until they have it right. */
export function BottleChange({ from, to, pour = false, context }: { from: number; to: number; pour?: boolean; context: VisualContext }) {
  const ml = useChange(from, to, 500, context.attempt);
  const pouring = useChange(1, 0, 1900, context.attempt) === 1;
  return <BottleWithAmount ml={ml} height={150} stream={pour && pouring} label={context.checked && context.correct ? undefined : "?"} />;
}

/** Screen 5: the bottle is filled, then drunk from. */
export function BottleStory({ context }: { context: VisualContext }) {
  const ml = useTimeline(
    [
      { at: 0, value: 0 },
      { at: 700, value: 800 },
      { at: 3200, value: 500 },
    ],
    context.attempt,
  );
  return <BottleWithAmount ml={ml} height={150} stream={ml === 0 || (ml > 0 && ml < 800)} marks={false} label={ml === 0 ? "Empty" : undefined} />;
}

/** A wallet showing what the learner has: the event is shown as it happens, and the new amount once they have it right. */
export function WalletChange({ from, to, note, gain, context }: { from: number; to: number; note?: string; gain?: boolean; context: VisualContext }) {
  const shown = useChange(0, 1, 600, context.attempt) === 1;
  const settled = context.checked && context.correct;
  return <Wallet amount={settled ? to : from} note={note && shown && !settled ? { text: note, gain: !!gain } : null} />;
}

/** Screen 17: two of the absent students come in. */
export function ClassroomChange({ context }: { context: VisualContext }) {
  const present = useChange(27, 29, 900, context.attempt);
  return (
    <div className="flex items-center gap-3">
      <Classroom present={present} />
      <AttendanceBoard names total={30} present={present} absent={30 - present} />
    </div>
  );
}

/** Screen 20: the two prices come together to be added; the total shows once the learner has it. */
export function PriceCalc({ context }: { context: VisualContext }) {
  const settled = context.checked && context.correct;
  const card = "flex w-[66px] flex-col items-center gap-0.5 px-1 py-2";
  return (
    <div className="flex items-center gap-1.5">
      <NameValue small name="notebook_price" value="₹50" className="w-[112px]" />
      <span className="text-[22px] leading-8 font-bold text-[#04ACAB]">+</span>
      <NameValue small name="pen_price" value="₹20" className="w-[96px]" />
      <span className="text-[22px] leading-8 font-bold text-[#04ACAB]">=</span>
      <div className={`${card} ${CARD}`}>
        <span className="font-mono text-[10px] leading-4 font-semibold text-[#8A94A0]">total</span>
        <span className="text-[18px] leading-6 font-bold text-[#08A4AD]">{settled ? <Counter value={70} prefix="₹" /> : "?"}</span>
      </div>
    </div>
  );
}

/** Screen 21: the three items, and the total the eraser changes. */
export function EraserTotal({ context }: { context: VisualContext }) {
  const settled = context.checked && context.correct;
  return (
    <div className="flex flex-col items-center gap-2">
      <Items eraser />
      <span className="rounded-full bg-white px-3 py-1 text-[14px] leading-5 font-semibold text-[#444444] shadow-[0_2px_8px_rgba(31,42,68,0.1)] dark:bg-[#15181E] dark:text-white">
        {settled ? (
          <>
            New total: <Counter value={80} prefix="₹" />
          </>
        ) : (
          "Total so far: ₹70"
        )}
      </span>
    </div>
  );
}

/** The travel expense tracker; the amount left stays hidden until it has been worked out. */
export function ExpenseTracker({ showLeft }: { showLeft: boolean }) {
  const row = (label: string, value: string, strong = false) => (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">{label}</span>
      <span className={`text-[17px] leading-6 font-bold ${strong ? "text-[#08A4AD]" : "text-[#444444] dark:text-white"}`}>{value}</span>
    </div>
  );
  return (
    <div className={`flex w-[260px] flex-col gap-1 px-4 py-3 ${CARD}`}>
      <span className="text-center text-[12px] leading-4 font-bold tracking-[0.5px] text-[#6B7480] uppercase dark:text-white/60">✈️ Travel expense tracker</span>
      {row("Starting budget", "₹1,000")}
      {row("Travel expense", "₹300")}
      {row("Food expense", "₹200")}
      {row("Remaining amount", showLeft ? "₹500" : "?", true)}
    </div>
  );
}

/** Screen 28: two prices, and an application that shows the wrong total. */
export function DebugVisual() {
  return (
    <div className="flex items-center gap-2">
      <ShopItem emoji="🛍️" name="Item 1" price={100} />
      <ShopItem emoji="🛍️" name="Item 2" price={50} tint="bg-[#FFF9F0]" />
      <span className="text-[22px] leading-8 font-bold text-[#04ACAB]">→</span>
      <div className="flex w-[96px] flex-col items-center gap-0.5 rounded-[14px] border-4 border-[#E5484D] bg-[#FDECEC] px-2 py-3 dark:bg-[#2E1517]">
        <span className="text-[11px] leading-4 font-bold text-[#D42421] uppercase">App shows</span>
        <span className="text-[24px] leading-8 font-bold text-[#D42421]">₹100</span>
        <span aria-hidden className="text-[16px] leading-5">
          ⚠️
        </span>
      </div>
    </div>
  );
}

/** Screen 14's two cards, as the question that follows its interaction shows them. */
export function NameValueCards() {
  return (
    <div className="flex items-center gap-3">
      <NameValue name="water_level" value="550 ml" />
      <NameValue name="bottle_capacity" value="1,000 ml" />
    </div>
  );
}

/** The three attendance variables, one under the other. */
export function AttendanceCards() {
  return (
    <div className="flex w-[300px] flex-col gap-1.5">
      {[
        ["total_students", "30"],
        ["present_students", "27"],
        ["absent_students", "3"],
      ].map(([name, value]) => (
        <div key={name} className={`flex items-center justify-between px-3 py-1 ${CARD}`}>
          <span className="rounded-md bg-[#E3F6F3] px-2 py-0.5 font-mono text-[12px] leading-5 font-semibold text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]">{name}</span>
          <span className="text-[18px] leading-6 font-bold text-[#444444] dark:text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** The trail picture's place in the Figma frame: it hangs from under the title, 390 px wide. */
const PICTURE_TOP = 168;
const PICTURE_W = 390;
const PICTURE_H = 519;

/** Fades the picture into the page at its top and bottom. */
const FADE = "linear-gradient(180deg, transparent 0, #000 36px, #000 calc(100% - 140px), transparent 100%)";

/** The mountain trail behind the screen. */
export function TrekBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
      style={{ top: stageTop(PICTURE_TOP), maskImage: FADE, WebkitMaskImage: FADE }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/variable/trek-bg.webp" alt="" width={PICTURE_W} height={PICTURE_H} className="shrink-0 select-none" style={{ width: PICTURE_W, height: PICTURE_H }} draggable={false} />
    </div>
  );
}
