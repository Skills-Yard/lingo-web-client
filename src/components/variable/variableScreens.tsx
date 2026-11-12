"use client";

import { useEffect, useRef } from "react";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";
import { Bottle, CalculatorApp, Classroom, AttendanceBoard, ShopItem, useChange, CARD } from "./visuals";
import { BridgeStage, ClassifyStage, FillSliderStage, MatchPricesStage, NameValueStage, NamesStage } from "./interactions";
import { NAME_VALUE_CARDS, type VarCards } from "./scenes";
import type { Option, QuizStage, ScreenDef, VisualContext } from "./quiz";
import { STEP } from "./variable";

/** Answers in words: an id for each (their place), and which one is right. */
const words = (texts: readonly string[]): Option[] => texts.map((text, index) => ({ id: String(index), text }));
const at = (index: number) => String(index);

/* ───────────────────────── Pictures that move ───────────────────────── */

/** How long the water takes to move to an answer the learner has tapped (ms). */
const PICK_MS = 1000;

/** The amount an answer such as "1,000 ml" stands for. */
const mlOf = (text: string) => Number(text.replace(/[^\d]/g, ""));

/**
 * The bottle scene (see `BottleBackdrop`) is the picture on the bottle screens: this
 * draws nothing, it moves the scene. The cap opens and the water stands at `from` ml, the
 * amount the question starts with. It is not moved to the answer: it goes to whichever
 * answer (of `choices`, in order, as "750 ml") the learner taps, so tapping 750 ml fills it
 * to 750 ml (with the stream on while it is poured in, if `pour`), and tapping another moves
 * it again. It is back at `from` when the learner tries again. The amount on the bottle is
 * left for the learner to read until they have it right.
 */
function BottleChange({ from, choices, pour = false, context }: { from: number; choices: readonly string[]; pour?: boolean; context: VisualContext }) {
  const showAmount = context.checked && context.correct;
  // When the cap is open (a pick before then waits for it), and where the water is heading.
  const readyAt = useRef(0);
  const heading = useRef(from);
  useEffect(() => {
    setSceneValues("bottle", { showLabel: showAmount });
  }, [showAmount]);
  useEffect(() => {
    setSceneValues("bottle", { pouring: false });
    setBottleLevel(from);
    heading.current = from;
    readyAt.current = performance.now() + openBottleCap();
  }, [from, context.attempt]);
  useEffect(() => {
    if (context.picked === null) return;
    const target = mlOf(choices[Number(context.picked)] ?? "");
    const filling = pour && target > heading.current;
    heading.current = target;
    const wait = Math.max(0, readyAt.current - performance.now());
    const timers = [
      window.setTimeout(() => {
        if (filling) setSceneValues("bottle", { pouring: true });
        rampBottleLevel(target, PICK_MS);
      }, wait),
    ];
    if (filling) timers.push(window.setTimeout(() => setSceneValues("bottle", { pouring: false }), wait + PICK_MS));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setSceneValues("bottle", { pouring: false });
    };
  }, [context.picked, choices, pour]);
  return null;
}

/** Screen 5: the bottle's cap opens, it is filled, then drunk from. */
function BottleStory({ context }: { context: VisualContext }) {
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
function ItemsDrive({ context }: { context: VisualContext }) {
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
function ShoppingDrive({ context }: { context: VisualContext }) {
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
function PenPriceDrive({ context }: { context: VisualContext }) {
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
function ShopTotal({ total, eraser = false, context }: { total: number; eraser?: boolean; context: VisualContext }) {
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
function WalletDrive({ from, to, event, amount = 0, toy = false, hideCard = false, context }: { from: number; to: number; event?: "receive" | "spend"; amount?: number; toy?: boolean; hideCard?: boolean; context: VisualContext }) {
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

/** Screen 9's cards: the bottle's water level before and after it was topped up. */
const WATER_CHANGE_CARDS: VarCards = { name1: "previous water level", val1: "500 ml", name2: "current water level", val2: "750 ml" };
/** The part of the pair each answer of screen 14's question stands for, to light up when it is tapped (1 and 3 are the names, 2 and 4 the values). */
const NAME_VALUE_LIGHTS: Readonly<Record<string, number>> = { "0": 2, "1": 1, "2": 4 };
const NO_LIGHTS: Readonly<Record<string, number>> = {};

/**
 * Screens 9 and 14's question: the pair of variable cards (see `VarCardBackdrop`). This draws nothing, it sets
 * the cards' data. `lights` says which part of the pair (`select`) each answer lights up while it is the one
 * tapped; checking marks the answer right or wrong.
 */
function VarCardDrive({ cards, lights = NO_LIGHTS, context }: { cards: VarCards; lights?: Readonly<Record<string, number>>; context: VisualContext }) {
  useEffect(() => {
    setSceneValues("varCard", { ...cards, mode: 0, linked: true, showParts: false });
  }, [cards]);
  useEffect(() => {
    setSceneValues("varCard", { select: lights[context.picked ?? ""] ?? 0 });
  }, [lights, context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("varCard", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/** The row of the attendance board each answer of screen 15 is about (1 total, 2 present, 3 absent); "All of these" is none in particular. */
const ATTENDANCE_LIGHTS: Readonly<Record<string, number>> = { "0": 1, "1": 2, "2": 3 };

/**
 * Screen 15: the classroom and its attendance board are the scene (see `ClassroomBackdrop`): 30 students, 27 here.
 * This draws nothing, it sets the scene's data. The row of the board an answer is about is lit while it is the one
 * tapped; checking marks the answer right or wrong.
 */
function ClassroomDrive({ context }: { context: VisualContext }) {
  useEffect(() => {
    setSceneValues("classroom", { total: 30, present: 27, showNames: false });
  }, []);
  useEffect(() => {
    setSceneValues("classroom", { highlight: ATTENDANCE_LIGHTS[context.picked ?? ""] ?? 0 });
  }, [context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("classroom", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/** Screen 17: two of the absent students come in. */
function ClassroomChange({ context }: { context: VisualContext }) {
  const present = useChange(27, 29, 900, context.attempt);
  return (
    <div className="flex items-center gap-3">
      <Classroom present={present} />
      <AttendanceBoard names total={30} present={present} absent={30 - present} />
    </div>
  );
}

/** The travel expense tracker; the amount left stays hidden until it has been worked out. */
function ExpenseTracker({ showLeft }: { showLeft: boolean }) {
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
function DebugVisual() {
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

/** The three attendance variables, one under the other. */
function AttendanceCards() {
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

/* ───────────────────────── Screens ───────────────────────── */

const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", ...stage });

/** The answers on the bottle screens: the same list gives the options and the amounts the bottle fills to (see `BottleChange`). */
const ADD_WATER_CHOICES = ["500 ml", "750 ml", "1,000 ml"] as const;
const DRINK_CHOICES = ["200 ml", "550 ml", "750 ml"] as const;
const EMPTY_CHOICES = ["0 ml", "550 ml", "1,000 ml"] as const;

/** Screens that are a title and one or more stages: the questions and the interactions. */
export const SCREENS: Readonly<Record<number, ScreenDef>> = {
  [STEP.noWater]: {
    step: STEP.noWater,
    title: "What If There's *No Water?*",
    stages: [
      quiz({
        line: "No river or shop nearby. What should we do?",
        options: [
          { id: at(0), text: "Carry water along", icon: "/animations/svg/variable-module/screen-3/variable-3.1.svg" },
          { id: at(1), text: "Wait for a river", icon: "/animations/svg/variable-module/screen-3/variable-3.2.svg" },
          { id: at(2), text: "Turn back", icon: "/animations/svg/variable-module/screen-3/variable-3.3.svg" },
        ],
        correctId: at(0),
        rightTitle: "Great thinking!",
        right: "We carry water before the trek.",
        wrong: "What can we do before leaving?",
      }),
    ],
  },

  [STEP.carry]: {
    step: STEP.carry,
    title: "Pick the *Right Object*",
    stages: [
      quiz({
        line: "We carry water. What should hold it?",
        // The four objects are the screen's scene (see `ItemsBackdrop`); this lights the one picked.
        visual: (context) => <ItemsDrive context={context} />,
        layout: "grid",
        options: [
          { id: "bottle", text: "Water bottle", node: <Bottle ml={600} height={54} marks={false} /> },
          { id: "football", text: "Football", emoji: "⚽" },
          { id: "lunchbox", text: "Lunchbox", emoji: "🍱" },
        ],
        correctId: "bottle",
        rightTitle: "That's right!",
        right: "A bottle is made to hold water.",
        wrong: "Which one holds water without spilling?",
        spill: true,
      }),
    ],
  },

  [STEP.bottle]: {
    step: STEP.bottle,
    title: "A Bottle *Holds Water!*",
    stages: [
      quiz({
        line: "We fill it and drink from it. What is it for?",
        visual: (context) => <BottleStory context={context} />,
        options: [
          { id: at(0), text: "To store water", icon: "/animations/svg/variable-module/screen-5/variable-5.1.svg" },
          { id: at(1), text: "To create water", icon: "/animations/svg/variable-module/screen-5/variable-5.2.svg" },
          { id: at(2), text: "To change the colour of water", icon: "/animations/svg/variable-module/screen-5/variable-5.3.svg" },
        ],
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A bottle holds and stores water.",
        wrong: "Did the bottle hold the water we poured?",
      }),
    ],
  },

  [STEP.bridge]: {
    step: STEP.bridge,
    title: "Programs *Remember Too!*",
    stages: [{ kind: "interaction", render: (api) => <BridgeStage {...api} />, nextLabel: "Let's Explore" }],
  },

  [STEP.fill]: {
    step: STEP.fill,
    title: "How Much *Water?*",
    stages: [
      {
        kind: "interaction",
        render: (api) => <FillSliderStage {...api} />,
        finishPanel: { title: "Great!", text: "The bottle now has 500 ml." },
      },
    ],
  },

  [STEP.addWater]: {
    step: STEP.addWater,
    title: "We Need *More Water!*",
    stages: [
      quiz({
        line: "We have 500 ml and add 250 ml. How much now?",
        visual: (context) => <BottleChange from={500} choices={ADD_WATER_CHOICES} pour context={context} />,
        options: words(ADD_WATER_CHOICES),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "500 ml + 250 ml = 750 ml.",
        wrong: "Add 250 ml to what we had.",
      }),
    ],
  },

  [STEP.sameBottle]: {
    step: STEP.sameBottle,
    title: "Same Bottle, *New Amount*",
    stages: [
      quiz({
        line: "It held 500 ml, now 750 ml. What changed?",
        // The pair of cards is the screen's scene (see `VarCardBackdrop`).
        visual: (context) => <VarCardDrive cards={WATER_CHANGE_CARDS} context={context} />,
        options: words(["The bottle", "The amount of water", "Both"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "The bottle is the same; the amount changed.",
        wrong: "Are these two bottles the same bottle?",
      }),
    ],
  },

  [STEP.drink]: {
    step: STEP.drink,
    title: "Let's *Drink 200 ml!*",
    stages: [
      quiz({
        line: "We have 750 ml and drink 200 ml. How much is left?",
        visual: (context) => <BottleChange from={750} choices={DRINK_CHOICES} context={context} />,
        options: words(DRINK_CHOICES),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "750 ml − 200 ml = 550 ml.",
        wrong: "Subtract what we drank from 750 ml.",
      }),
    ],
  },

  [STEP.empty]: {
    step: STEP.empty,
    title: "The Bottle *Is Empty!*",
    stages: [
      quiz({
        line: "We drink all 550 ml. How much is left?",
        visual: (context) => <BottleChange from={550} choices={EMPTY_CHOICES} context={context} />,
        options: words(EMPTY_CHOICES),
        correctId: at(0),
        rightTitle: "Yes!",
        right: "It's empty, so 0 ml remain.",
        wrong: "If all the water is gone, how much remains?",
      }),
    ],
  },

  [STEP.labels]: {
    step: STEP.labels,
    title: "Which Bottle *Is Mine?*",
    stages: [
      quiz({
        line: "All our bottles look the same. How can we tell ours?",
        // The bottles with their names are the screen's scene (see `NamesBackdrop`).
        options: words(["A name label", "Its position", "Nothing is needed"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A name or label helps us identify things.",
        wrong: "How would you recognise your own bottle?",
      }),
    ],
  },

  [STEP.meet]: {
    step: STEP.meet,
    title: "*Name* and *Value*",
    stages: [{ kind: "interaction", render: (api) => <NameValueStage {...api} /> }],
  },

  [STEP.classify]: {
    step: STEP.classify,
    title: "Name *or Value?*",
    stages: [
      { kind: "interaction", render: (api) => <ClassifyStage {...api} /> },
      quiz({
        line: "Which of these is a variable name?",
        visual: (context) => <VarCardDrive cards={NAME_VALUE_CARDS} lights={NAME_VALUE_LIGHTS} context={context} />,
        options: words(["550 ml", "water_level", "1,000 ml"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "water_level is the name; 550 ml is its value.",
        wrong: "The name tells what it is; the value is the amount.",
      }),
    ],
  },

  [STEP.attendance]: {
    step: STEP.attendance,
    title: "A New Day *at School!*",
    stages: [
      quiz({
        line: "30 students, attendance time! What should we track?",
        // The classroom and its board are the screen's scene (see `ClassroomBackdrop`).
        visual: (context) => <ClassroomDrive context={context} />,
        // Four answers would cover the classroom as rows; two by two they stand below it.
        compact: true,
        options: words(["Total students", "Students present", "Students absent", "All of these"]),
        correctId: at(3),
        rightTitle: "Exactly!",
        right: "We track all three pieces of information.",
        wrong: "What does the teacher need to finish attendance?",
      }),
    ],
  },

  [STEP.names]: {
    step: STEP.names,
    title: "Three *Pieces of Data*",
    stages: [
      { kind: "interaction", render: (api) => <NamesStage {...api} /> },
      quiz({
        line: "Which variable tells us how many are absent?",
        visual: () => <AttendanceCards />,
        options: words(["total_students", "present_students", "absent_students"]),
        correctId: at(2),
        rightTitle: "Correct!",
        right: "absent_students counts the absent students.",
        wrong: "Which name means students who are not here?",
      }),
    ],
  },

  [STEP.tomorrow]: {
    step: STEP.tomorrow,
    title: "More Students *Tomorrow!*",
    stages: [
      quiz({
        line: "2 absent students return. Which values change?",
        visual: (context) => <ClassroomChange context={context} />,
        options: words(["Only total_students", "Present and absent counts", "All three values"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Present goes to 29, absent to 1. Total stays 30.",
        wrong: "The class size is the same. What changes when 2 return?",
      }),
    ],
  },

  [STEP.shopping]: {
    step: STEP.shopping,
    title: "Shopping *for Supplies!*",
    stages: [
      quiz({
        line: "We buy a notebook and a pen. What should we track?",
        visual: (context) => <ShoppingDrive context={context} />,
        options: words(["Notebook price", "Pen price", "Both prices"]),
        correctId: at(2),
        rightTitle: "Right!",
        right: "We need both prices for the total.",
        wrong: "Which prices do we add together?",
      }),
    ],
  },

  [STEP.prices]: {
    step: STEP.prices,
    title: "Name *the Prices!*",
    stages: [
      { kind: "interaction", render: (api) => <MatchPricesStage {...api} /> },
      quiz({
        line: "Which value belongs to pen_price?",
        visual: (context) => <PenPriceDrive context={context} />,
        options: words(["₹50", "₹20", "₹70"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "The pen costs ₹20.",
        wrong: "Look at the pen's price tag again.",
      }),
    ],
  },

  [STEP.total]: {
    step: STEP.total,
    title: "What's the *Total Cost?*",
    stages: [
      quiz({
        line: "Notebook ₹50, pen ₹20. What's the total?",
        visual: (context) => <ShopTotal total={70} context={context} />,
        options: words(["₹50", "₹70", "₹80"]),
        correctId: at(1),
        rightTitle: "Excellent!",
        right: "₹50 + ₹20 = ₹70. We can store it as total_price.",
        wrong: "Add the notebook price and the pen price.",
      }),
    ],
  },

  [STEP.eraser]: {
    step: STEP.eraser,
    title: "Add *an Eraser!*",
    stages: [
      quiz({
        line: "An eraser costs ₹10. What is the new total?",
        visual: (context) => <ShopTotal total={80} eraser context={context} />,
        options: words(["₹70", "₹80", "₹90"]),
        correctId: at(1),
        rightTitle: "That's right!",
        right: "₹70 + ₹10 = ₹80.",
        wrong: "Add ₹10 to the earlier total.",
      }),
    ],
  },

  [STEP.pocket]: {
    step: STEP.pocket,
    title: "Your *Pocket Money*",
    stages: [
      quiz({
        line: "Your parents give you ₹100. How much do you have?",
        visual: (context) => <WalletDrive from={100} to={100} context={context} />,
        options: words(["₹50", "₹100", "₹150"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "You have ₹100.",
        wrong: "Look at what your parents gave you.",
      }),
    ],
  },

  [STEP.received]: {
    step: STEP.received,
    title: "Another *₹50 Arrives!*",
    stages: [
      quiz({
        line: "You had ₹100 and get ₹50 more. How much now?",
        visual: (context) => <WalletDrive from={100} to={150} event="receive" amount={50} hideCard context={context} />,
        options: words(["₹100", "₹150", "₹200"]),
        correctId: at(1),
        rightTitle: "Great!",
        right: "₹100 + ₹50 = ₹150. Your balance grew.",
        wrong: "Add the ₹50 to your ₹100.",
      }),
    ],
  },

  [STEP.spent]: {
    step: STEP.spent,
    title: "A Toy *for ₹30!*",
    stages: [
      quiz({
        line: "You had ₹150 and spend ₹30. How much is left?",
        visual: (context) => <WalletDrive from={150} to={120} event="spend" amount={30} toy hideCard context={context} />,
        options: words(["₹30", "₹120", "₹150"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "₹150 − ₹30 = ₹120.",
        wrong: "Subtract what you spent.",
      }),
    ],
  },

  [STEP.follow]: {
    step: STEP.follow,
    title: "Track *Your Balance*",
    stages: [
      quiz({
        line: "Start with ₹200, then get ₹50. What's your balance?",
        visual: (context) => <WalletDrive from={200} to={250} event="receive" amount={50} context={context} />,
        options: words(["₹150", "₹250", "₹300"]),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "₹200 + ₹50 = ₹250.",
        wrong: "Add money you receive.",
      }),
      quiz({
        line: "Now you spend ₹30. What's your balance?",
        visual: (context) => <WalletDrive from={250} to={220} event="spend" amount={30} toy context={context} />,
        options: words(["₹180", "₹220", "₹250"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "₹250 − ₹30 = ₹220.",
        wrong: "Subtract money you spend.",
      }),
      quiz({
        line: "Then you get ₹20. What's the final balance?",
        visual: (context) => <WalletDrive from={220} to={240} event="receive" amount={20} context={context} />,
        options: words(["₹220", "₹240", "₹270"]),
        correctId: at(1),
        rightTitle: "Perfect!",
        right: "Your final balance is ₹240.",
        wrong: "Add or subtract each event in order.",
      }),
    ],
  },

  [STEP.appIntro]: {
    step: STEP.appIntro,
    title: "Build an *Addition App*",
    stages: [
      quiz({
        line: "The app adds two numbers. What should it do first?",
        visual: () => <CalculatorApp compact />,
        options: words(["Show the result", "Ask for the first number", "Close the app"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "First, it asks for the first number.",
        wrong: "It needs numbers before it can add.",
        nextLabel: "Let's Build It",
      }),
    ],
  },

  [STEP.debug]: {
    step: STEP.debug,
    title: "Find *the Mistake!*",
    stages: [
      quiz({
        line: "Prices ₹100 and ₹50, but the app shows ₹100. Why?",
        visual: () => <DebugVisual />,
        options: words(["It used only the first price", "It added both prices", "The first price should be ₹50"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "It used only the first price. ₹100 + ₹50 = ₹150.",
        wrong: "Did it include both prices?",
      }),
    ],
  },

  [STEP.travel]: {
    step: STEP.travel,
    title: "Travel *Expense Tracker*",
    stages: [
      quiz({
        line: "₹1,000 budget, ₹300 travel, ₹200 food. What to track?",
        visual: () => <ExpenseTracker showLeft={false} />,
        options: words(["Starting budget", "Travel expense", "Food expense", "All of these"]),
        correctId: at(3),
        rightTitle: "Correct!",
        right: "We need all three to find what remains.",
        wrong: "What do we need to work out what remains?",
      }),
      quiz({
        line: "How much money remains?",
        visual: (context) => <ExpenseTracker showLeft={context.checked && context.correct} />,
        options: words(["₹300", "₹500", "₹700"]),
        correctId: at(1),
        rightTitle: "Excellent!",
        right: "₹1,000 − ₹300 − ₹200 = ₹500.",
        wrong: "Subtract both expenses from the budget.",
      }),
    ],
  },

  [STEP.reflectWhy]: {
    step: STEP.reflectWhy,
    title: "Why *Variables?*",
    stages: [
      quiz({
        line: "Think of the bottle, board and wallet. Why?",
        options: words(["To store and track information", "To make the screen colourful", "To turn off a computer"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Variables store and track information.",
        wrong: "What did the bottle and the wallet keep track of?",
      }),
    ],
  },

  [STEP.reflectChange]: {
    step: STEP.reflectChange,
    title: "Can *Values Change?*",
    stages: [
      quiz({
        line: "Think of the water and the wallet. Can a value change?",
        options: words(["Yes", "No", "Only once"]),
        correctId: at(0),
        rightTitle: "Yes!",
        right: "A value can grow, shrink or become zero.",
        wrong: "Remember how the water and the money changed.",
      }),
    ],
  },

  [STEP.reflectNames]: {
    step: STEP.reflectNames,
    title: "Why *Meaningful Names?*",
    stages: [
      quiz({
        line: "Remember the labelled bottles. Why name variables?",
        options: words(["To know what they represent", "To make the program longer", "To avoid calculations"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A good name tells us what a value means.",
        wrong: "Why did each bottle need a name label?",
      }),
    ],
  },

  [STEP.reflectBoth]: {
    step: STEP.reflectBoth,
    title: "Why Keep *Both Numbers?*",
    stages: [
      quiz({
        line: "An app must add two numbers. Why keep both?",
        options: words(["To use them in the calculation", "To delete them", "To show only one number"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The app needs both numbers to add them.",
        wrong: "What does the app need before it can add?",
      }),
    ],
  },
};
