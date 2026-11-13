"use client";

import { useEffect, useRef } from "react";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";
import { CARD } from "./visuals";
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
 * it again. It is back at `from` when the learner tries again. The amount tag on the bottle shows
 * the amount the question starts with (`from`); while an answer is picked and not yet checked the
 * tag is off (the water is moving to the pick), and once it is checked, right or wrong, it shows
 * the amount of the answer that was picked.
 */
function BottleChange({ from, choices, pour = false, context }: { from: number; choices: readonly string[]; pour?: boolean; context: VisualContext }) {
  const pending = context.picked !== null && !context.checked;
  // When the cap is open (a pick before then waits for it), and where the water is heading.
  const readyAt = useRef(0);
  const heading = useRef(from);
  useEffect(() => {
    setSceneValues("bottle", { showLabel: !pending });
  }, [pending]);
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
/** After `calc` is fired on screen 18, this long (ms) until the Total board is turned on: the notebook and the pen are added up first. */
const CALC_RUN_MS = 1600;
/** What the Total board shows once the notebook and the pen are added up (screens 18 and 28), and what the app on screen 28 wrongly shows to begin with (the notebook's price alone). */
const RIGHT_TOTAL = 70;
const WRONG_TOTAL = 50;

/** Screen 4's answers, as the object each lights up in the scene (its four objects, in order). */
const ITEM_PICK: Readonly<Record<string, number>> = { bottle: 1, football: 2, notebook: 3, lunchbox: 4 };

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
 * "Notebook price" or "Pen price" lights that one ("Both prices" lights nothing, so the tap gives
 * nothing away); checking marks the items right or wrong. Once the answer is right the scene plays
 * two things one after the other: `calc` (the notebook and the pen are added up) and then, when that
 * has run, `showTotal` (the Total board comes up with `total`, ₹70).
 */
function ShoppingDrive({ context }: { context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("shop", { showEraser: false, showNames: false, showTotal: false, highlight: 0, total: RIGHT_TOTAL });
  }, [context.attempt]);
  useEffect(() => {
    setSceneValues("shop", { highlight: context.picked === at(0) ? 1 : context.picked === at(1) ? 2 : 0 });
  }, [context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  useEffect(() => {
    if (!settled) return;
    fireSceneTrigger("shop", "calc");
    const timer = window.setTimeout(() => setSceneValues("shop", { showTotal: true }), CALC_RUN_MS);
    return () => window.clearTimeout(timer);
  }, [settled]);
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
 * learner tries again. The Total board stays hidden (or, with `before`, stands at that earlier
 * total) until the answer is right, then shows `total`; with `amounts` (the money each answer
 * stands for, in the answers' order) it shows the answer that was picked once it is checked,
 * right or wrong. Checking marks the items right or wrong.
 */
function ShopTotal({ total, before, amounts, eraser = false, context }: { total: number; before?: number; amounts?: readonly number[]; eraser?: boolean; context: VisualContext }) {
  const settled = context.checked && context.correct;
  const picked = amounts && context.picked !== null ? amounts[Number(context.picked)] : undefined;
  useEffect(() => {
    setSceneValues("shop", { showEraser: eraser, showNames: false, showTotal: before !== undefined, highlight: 0, total: before ?? total });
    const timer = window.setTimeout(() => fireSceneTrigger("shop", eraser ? "calcAll" : "calc"), eraser ? ERASER_IN_MS : EVENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [total, before, eraser, context.attempt]);
  useEffect(() => {
    if (settled) setSceneValues("shop", { showTotal: true, total });
  }, [settled, total]);
  useEffect(() => {
    if (context.checked && picked !== undefined) setSceneValues("shop", { showTotal: true, total: picked });
  }, [context.checked, picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/**
 * Screens 22-25: the wallet (see `WalletBackdrop`). Its card shows `from` while the question is
 * open (or is hidden, with `hideCard`) and `to` once the answer is right. `event` flies notes in
 * or out (with `amount` on its tag, and the toy car for a `toy`) shortly after the screen opens,
 * and again when the learner tries again. With `amounts` (the money each answer stands for, in the
 * answers' order) the card shows the answer that was picked once it is checked, right or wrong
 * (and `from` again on a new try), instead of only the right one.
 */
function WalletDrive({
  from,
  to,
  event,
  amount = 0,
  toy = false,
  hideCard = false,
  amounts,
  context,
}: {
  from: number;
  to: number;
  event?: "receive" | "spend";
  amount?: number;
  toy?: boolean;
  hideCard?: boolean;
  amounts?: readonly number[];
  context: VisualContext;
}) {
  const settled = context.checked && context.correct;
  const picked = amounts && context.picked !== null ? amounts[Number(context.picked)] : undefined;
  useEffect(() => {
    setSceneValues("wallet", { amount, showToy: toy, balance: from, showCard: !hideCard });
    if (!event) return;
    const timer = window.setTimeout(() => fireSceneTrigger("wallet", event), EVENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [from, event, amount, toy, hideCard, context.attempt]);
  useEffect(() => {
    if (settled) setSceneValues("wallet", { balance: to, showCard: true });
  }, [settled, to]);
  useEffect(() => {
    if (context.checked && picked !== undefined) setSceneValues("wallet", { balance: picked, showCard: true });
  }, [context.checked, picked]);
  return null;
}

/** Screen 31's story, as (value, amount) pairs: the water goes 550 → 800 → 300 ml, the pocket money ₹100 → ₹150 → ₹120. */
const CHANGE = { water: { start: 550, up: 800, down: 300 }, money: { start: 100, received: 50, spent: 30 } } as const;
/** Screen 31's beats (ms after the bottle's cap is open): each value grows (the water is poured in, notes fly into the wallet), and then shrinks (the water is drunk, notes fly out). */
const CHANGE_MS = { grow: 500, shrink: 3600, run: 1600, drink: 1400, cardAfter: 900 } as const;

/**
 * Screen 31: the bottle and the wallet side by side (see `BottleWalletBackdrop`), both with a value that changes. The
 * water starts at 550 ml with its amount shown and the wallet's card at ₹100; the water is then poured up to 800 ml
 * while ₹50 flies into the wallet (`receive`, the card goes to ₹150), and then drunk down to 300 ml while ₹30 flies
 * out (`spend`, the card goes to ₹120). This draws nothing, it sets the two scenes' data; it plays again on trying again.
 */
function BottleWalletDrive({ context }: { context: VisualContext }) {
  useEffect(() => {
    const { water, money } = CHANGE;
    setSceneValues("bottle", { showVariable: false, showLabel: true, pouring: false });
    setBottleLevel(water.start);
    setSceneValues("wallet", { showCard: true, showToy: false, balance: money.start, amount: money.received });
    const wait = openBottleCap();
    const timers: number[] = [];
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, wait + ms));
    at(CHANGE_MS.grow, () => {
      setSceneValues("bottle", { pouring: true });
      rampBottleLevel(water.up, CHANGE_MS.run);
      setSceneValues("wallet", { amount: money.received });
      fireSceneTrigger("wallet", "receive");
    });
    at(CHANGE_MS.grow + CHANGE_MS.run, () => setSceneValues("bottle", { pouring: false }));
    at(CHANGE_MS.grow + CHANGE_MS.cardAfter, () => setSceneValues("wallet", { balance: money.start + money.received }));
    at(CHANGE_MS.shrink, () => {
      rampBottleLevel(water.down, CHANGE_MS.drink);
      setSceneValues("wallet", { amount: money.spent });
      fireSceneTrigger("wallet", "spend");
    });
    at(CHANGE_MS.shrink + CHANGE_MS.cardAfter, () => setSceneValues("wallet", { balance: money.start + money.received - money.spent }));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setSceneValues("bottle", { pouring: false, showLabel: false });
    };
  }, [context.attempt]);
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

/** The row of the attendance board each answer of screens 15 and 16 is about (1 total, 2 present, 3 absent); screen 15's "All of these" is none in particular. */
const ATTENDANCE_LIGHTS: Readonly<Record<string, number>> = { "0": 1, "1": 2, "2": 3 };

/**
 * Screens 15 and 16's question: the classroom and its attendance board are the scene (see `ClassroomBackdrop`): 30
 * students, 27 here. This draws nothing, it sets the scene's data: `names` has the board show the name of each count
 * (screen 16) instead of its heading. The row of the board an answer is about is lit while it is the one tapped;
 * checking marks the answer right or wrong.
 */
function ClassroomDrive({ names = false, context }: { names?: boolean; context: VisualContext }) {
  useEffect(() => {
    setSceneValues("classroom", { total: 30, present: 27, showNames: names });
  }, [names]);
  useEffect(() => {
    setSceneValues("classroom", { highlight: ATTENDANCE_LIGHTS[context.picked ?? ""] ?? 0 });
  }, [context.picked]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("classroom", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/** The part of the little app each answer of screen 26 is about (1 the first number's field, 4 the result); "Close the app" is none. */
const APP_LIGHTS: Readonly<Record<string, number>> = { "0": 4, "1": 1 };

/**
 * Screens 26 and 33: the little app on a phone ("VAR_MiniApp", see `MiniAppBackdrop`), the addition app with
 * its two number fields (`filled`: none of them shown yet, as the learner is about to build it, or both, kept) and
 * its result not yet worked out. This draws nothing, it sets the scene's data. The part of the app an answer is
 * about (`lights`, by answer) is lit while it is the one tapped; checking marks the answer right or wrong, and with
 * `reveal` the result (30) shows once the answer is right.
 */
function MiniAppDrive({ filled = 0, lights = APP_LIGHTS, reveal = false, context }: { filled?: number; lights?: Readonly<Record<string, number>>; reveal?: boolean; context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("miniApp", {
      mode: 0,
      title: "Addition App",
      name1: "first_number",
      name2: "second_number",
      resultName: "result",
      formula: "result = first_number + second_number",
      val1: "10",
      val2: "20",
      result: 30,
      filled,
      showResult: false,
      bug: false,
    });
  }, [filled, context.attempt]);
  useEffect(() => {
    setSceneValues("miniApp", { highlight: lights[context.picked ?? ""] ?? 0 });
  }, [lights, context.picked]);
  useEffect(() => {
    if (reveal && settled) setSceneValues("miniApp", { showResult: true });
  }, [reveal, settled]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("miniApp", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
}

/**
 * Screen 17: the classroom and its board (see `ClassroomBackdrop`), the names shown. The class stays as it was (27
 * here, 3 absent) while the question is open, so the picture doesn't give the answer away; once the answer is right
 * the two absent students come in (`arrive`) and the board shows the new counts (29 here, 1 absent; the total stays
 * 30). Checking marks the answer right or wrong.
 */
function ClassroomChange({ context }: { context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("classroom", { total: 30, present: 27, showNames: true, highlight: 0 });
  }, [context.attempt]);
  useEffect(() => {
    if (!settled) return;
    setSceneValues("classroom", { present: 29 });
    fireSceneTrigger("classroom", "arrive");
  }, [settled]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("classroom", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
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

/**
 * Screen 28: the shop counter (see `ShopBackdrop`) with the notebook (₹50) and the pen (₹20), and its Total board
 * showing what the app wrongly shows, ₹50 (`showTotal` and `total`). This draws nothing, it sets the scene's data.
 * Once the answer is right the two prices are added up (`calc`) and the board shows the right total, ₹70; checking
 * marks the items right or wrong.
 */
function ShopDebugDrive({ context }: { context: VisualContext }) {
  const settled = context.checked && context.correct;
  useEffect(() => {
    setSceneValues("shop", { showEraser: false, showNames: false, showTotal: true, highlight: 0, total: WRONG_TOTAL });
  }, [context.attempt]);
  useEffect(() => {
    if (!settled) return;
    setSceneValues("shop", { total: RIGHT_TOTAL });
    fireSceneTrigger("shop", "calc");
  }, [settled]);
  useEffect(() => {
    if (context.checked) fireSceneTrigger("shop", context.correct ? "correct" : "wrong");
  }, [context.checked, context.correct]);
  return null;
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
          { id: at(0), text: "Carry water", icon: "/animations/svg/variable-module/screen-3/variable-3.1.svg" },
          { id: at(1), text: "Wait here", icon: "/animations/svg/variable-module/screen-3/variable-3.2.svg" },
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
        // Four short answers in words, no pictures: the module's 2 x 2 cards (see `acrossCards`), in the order of the objects in the scene.
        options: [
          { id: "bottle", text: "Water bottle" },
          { id: "football", text: "Football" },
          { id: "notebook", text: "Notebook" },
          { id: "lunchbox", text: "Lunchbox" },
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
          { id: at(0), text: "Store water", icon: "/animations/svg/variable-module/screen-5/variable-5.1.svg" },
          { id: at(1), text: "Create water", icon: "/animations/svg/variable-module/screen-5/variable-5.2.svg" },
          { id: at(2), text: "Change colour", icon: "/animations/svg/variable-module/screen-5/variable-5.3.svg" },
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
        options: words(["The bottle", "Water amount", "Both"]),
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
        options: words(["Name label", "Its position", "Just guess"]),
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
      // The hint button replays the pointing hand on the next part still to be sorted.
      { kind: "interaction", hint: true, render: (api) => <ClassifyStage {...api} /> },
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
        // The classroom, its board showing the names, is the screen's scene (see `ClassroomBackdrop`); tapping a name lights its row.
        visual: (context) => <ClassroomDrive names context={context} />,
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
        // The classroom is the screen's scene (see `ClassroomBackdrop`): the students come in on it.
        visual: (context) => <ClassroomChange context={context} />,
        options: words(["Total only", "Present, absent", "All three"]),
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
        visual: (context) => <ShopTotal total={70} amounts={[50, 70, 80]} context={context} />,
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
        // The Total board stands at the earlier total (₹70) while the question is open; once it is checked it shows the total that was picked.
        visual: (context) => <ShopTotal total={80} before={70} amounts={[70, 80, 90]} eraser context={context} />,
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
        // The card stands at the amount before (₹100) while the question is open; once it is checked it shows the amount that was picked.
        visual: (context) => <WalletDrive from={100} to={150} event="receive" amount={50} amounts={[100, 150, 200]} context={context} />,
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
        // The card stands at the amount before (₹150) while the question is open; once it is checked it shows the amount that was picked.
        visual: (context) => <WalletDrive from={150} to={120} event="spend" amount={30} toy amounts={[30, 120, 150]} context={context} />,
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
        visual: (context) => <WalletDrive from={200} to={250} event="receive" amount={50} amounts={[150, 250, 300]} context={context} />,
        options: words(["₹150", "₹250", "₹300"]),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "₹200 + ₹50 = ₹250.",
        wrong: "Add money you receive.",
      }),
      quiz({
        line: "Now you spend ₹30. What's your balance?",
        visual: (context) => <WalletDrive from={250} to={220} event="spend" amount={30} toy amounts={[180, 220, 250]} context={context} />,
        options: words(["₹180", "₹220", "₹250"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "₹250 − ₹30 = ₹220.",
        wrong: "Subtract money you spend.",
      }),
      quiz({
        line: "Then you get ₹20. What's the final balance?",
        visual: (context) => <WalletDrive from={220} to={240} event="receive" amount={20} amounts={[220, 240, 270]} context={context} />,
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
        // The little app on a phone is the screen's scene (see `MiniAppBackdrop`).
        visual: (context) => <MiniAppDrive context={context} />,
        options: words(["Show result", "Get numbers", "Close app"]),
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
        line: "Notebook ₹50 and pen ₹20, but the app shows ₹50. Why?",
        // The shop counter, with the app's wrong total on its Total board, is the screen's scene (see `ShopBackdrop`).
        visual: (context) => <ShopDebugDrive context={context} />,
        options: words(["Only notebook", "Added both", "Notebook ₹20"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "It used only the first price. ₹50 + ₹20 = ₹70.",
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
        options: words(["Store data", "Run faster", "Delete data"]),
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
        // The bottle and the wallet side by side (see `BottleWalletBackdrop`), their values changing.
        visual: (context) => <BottleWalletDrive context={context} />,
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
        // The labelled bottles are the screen's scene (see `NamesBackdrop`), as on "Which bottle is mine?", standing still.
        options: words(["Show meaning", "Save memory", "Avoid maths"]),
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
        // The addition app, both its numbers kept, is the screen's scene (see `MiniAppBackdrop`); nothing is lit for an answer (no part of the app is about only one of them), and the result shows once the answer is right.
        visual: (context) => <MiniAppDrive filled={2} lights={NO_LIGHTS} reveal context={context} />,
        options: words(["Add them", "Show one", "Hide them"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The app needs both numbers to add them.",
        wrong: "What does the app need before it can add?",
      }),
    ],
  },
};
