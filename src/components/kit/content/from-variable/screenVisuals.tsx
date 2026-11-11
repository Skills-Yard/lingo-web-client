"use client";

import { useEffect } from "react";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { Classroom, AttendanceBoard, NameValue, ShopItem, useChange, CARD } from "@/components/kit/content/from-variable/visuals";
import type { VisualContext } from "@/components/kit/content/from-variable/quiz";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";

/** An answer's id, by its place in the list (as `words` makes them in the screens' data). */
const at = (index: number) => String(index);

/* ───────────────────────── Pictures that move ───────────────────────── */

/** How long water takes to be poured in or drunk (ms). */
const WATER_MS = 1500;

/**
 * The bottle scene (see `BottleBackdrop`) is the picture on the bottle screens: this
 * draws nothing, it moves the scene. The cap opens, the water is at `from` ml, then goes
 * to `to` ml (with the stream on while it is poured in); all of it again when the learner
 * tries again. The amount on the bottle is left for the learner to read until they have it
 * right.
 */
export function BottleChange({ from, to, pour = false, context }: { from: number; to: number; pour?: boolean; context: VisualContext }) {
  const showAmount = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("bottle", { showLabel: showAmount });
  }, [showAmount]);
  useEffect(() => {
    setSceneValues("bottle", { pouring: false });
    setBottleLevel(from);
    const wait = openBottleCap();
    const timers = [
      window.setTimeout(() => {
        if (pour) setSceneValues("bottle", { pouring: true });
        rampBottleLevel(to, WATER_MS);
      }, wait),
    ];
    if (pour) timers.push(window.setTimeout(() => setSceneValues("bottle", { pouring: false }), wait + WATER_MS));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setSceneValues("bottle", { pouring: false });
    };
  }, [from, to, pour, context.attempt]);
  return null;
}

/** Screen 5: the bottle's cap opens, it is filled, then drunk from. */
export function BottleStory({ context }: { context: VisualContext }) {
  useEffect(() => {
    setSceneValues("bottle", { showLabel: true, pouring: false });
    setBottleLevel(0);
    const wait = openBottleCap();
    const timers = [
      window.setTimeout(() => {
        setSceneValues("bottle", { pouring: true });
        rampBottleLevel(800, 1800);
      }, wait),
      window.setTimeout(() => setSceneValues("bottle", { pouring: false }), wait + 1800),
      window.setTimeout(() => rampBottleLevel(500, 1200), wait + 2600),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setSceneValues("bottle", { pouring: false });
    };
  }, [context.attempt]);
  return null;
}

/** A beat between a scene's data changing and a trigger being fired for it, so the data's own animation has begun and the trigger is taken. */
const EVENT_DELAY_MS = 400;
/** The eraser takes this long to slide in (see `SHP_Eraser_In`): the sum waits for it. */
const ERASER_IN_MS = 900;

/** Screen 4's answers, as the object each lights up in the scene (the notebook is 3: it isn't an answer). */
const ITEM_PICK: Readonly<Record<string, number>> = { bottle: 1, football: 2, lunchbox: 4 };

/**
 * The four objects (see `ItemsBackdrop`) are the picture on screen 4: this draws nothing.
 * Tapping an answer lights its object; checking marks it right or wrong.
 */
export function ItemsDrive({ context }: { context: VisualContext }) {
  useEffect(() => {
    setSceneValues("items", { pick: ITEM_PICK[context.picked ?? ""] ?? 0 });
  }, [context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("items", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/**
 * Screen 18: the shop counter (see `ShopBackdrop`) with the notebook and the pen. Tapping
 * "Notebook price" or "Pen price" lights that one, "Both prices" adds the two; checking
 * marks the items right or wrong.
 */
export function ShoppingDrive({ context }: { context: VisualContext }) {
  useEffect(() => {
    setSceneValues("shop", { showEraser: false, showNames: false, showTotal: false, highlight: 0 });
  }, []);
  useEffect(() => {
    setSceneValues("shop", { highlight: context.picked === at(0) ? 1 : context.picked === at(1) ? 2 : 0 });
    if (context.picked === at(2)) fireSceneTrigger("shop", "calc");
  }, [context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/** Screen 19's question: the pen is lit (with the names shown, as on the stage before it); checking marks the items right or wrong. */
export function PenPriceDrive({ context }: { context: VisualContext }) {
  useEffect(() => {
    setSceneValues("shop", { showEraser: false, showNames: true, showTotal: false, highlight: 2 });
  }, [context.attempt]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/**
 * Screens 20 and 21: the shop counter adds up the prices (`calc` for the notebook and pen,
 * `calcAll` once the eraser has slid in) shortly after the screen opens, and again when the
 * learner tries again. The Total board stays hidden until the answer is right, then shows
 * `total`; checking marks the items right or wrong.
 */
export function ShopTotal({ total, eraser = false, context }: { total: number; eraser?: boolean; context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("shop", { showEraser: eraser, showNames: false, showTotal: false, highlight: 0, total });
    const timer = window.setTimeout(() => fireSceneTrigger("shop", eraser ? "calcAll" : "calc"), eraser ? ERASER_IN_MS : EVENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [total, eraser, context.attempt]);
  useEffect(() => {
    if (settled) setSceneValues("shop", { showTotal: true });
  }, [settled]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/**
 * Screens 22-25: the wallet (see `WalletBackdrop`). Its card shows `from` while the question is
 * open (or is hidden, with `hideCard`) and `to` once the answer is right. `event` flies notes in
 * or out (with `amount` on its tag, and the toy car for a `toy`) shortly after the screen opens,
 * and again when the learner tries again.
 */
export function WalletDrive({ from, to, event, amount = 0, toy = false, hideCard = false, context }: { from: number; to: number; event?: "receive" | "spend"; amount?: number; toy?: boolean; hideCard?: boolean; context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("wallet", { amount, showToy: toy, balance: from, showCard: !hideCard });
    if (!event) return;
    const timer = window.setTimeout(() => fireSceneTrigger("wallet", event), EVENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [from, event, amount, toy, hideCard, context.attempt]);
  useEffect(() => {
    if (settled) setSceneValues("wallet", { balance: to, showCard: true });
  }, [settled, to]);
  return null;
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
