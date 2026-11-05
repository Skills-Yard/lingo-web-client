"use client";

import { Bottle, BottleWithAmount, CalculatorApp, Classroom, AttendanceBoard, Counter, NameValue, ShopItem, useChange, useTimeline, Wallet, CARD } from "./visuals";
import { BridgeStage, ClassifyStage, FillSliderStage, Items, MatchPricesStage, NameValueStage, NamesStage } from "./interactions";
import type { Option, QuizStage, ScreenDef, VisualContext } from "./quiz";
import { STEP } from "./variable";

/** Answers in words: an id for each (their place), and which one is right. */
const words = (texts: readonly string[]): Option[] => texts.map((text, index) => ({ id: String(index), text }));
const at = (index: number) => String(index);

/* ───────────────────────── Pictures that move ───────────────────────── */

/** A bottle whose water goes from `from` to `to` ml shortly after the screen opens (again when the learner tries again); the amount is left for the learner to read until they have it right. */
function BottleChange({ from, to, pour = false, context }: { from: number; to: number; pour?: boolean; context: VisualContext }) {
  const ml = useChange(from, to, 500, context.attempt);
  const pouring = useChange(1, 0, 1900, context.attempt) === 1;
  return <BottleWithAmount ml={ml} height={150} stream={pour && pouring} label={context.checked && context.correct ? undefined : "?"} />;
}

/** Screen 5: the bottle is filled, then drunk from. */
function BottleStory({ context }: { context: VisualContext }) {
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
function WalletChange({ from, to, note, gain, context }: { from: number; to: number; note?: string; gain?: boolean; context: VisualContext }) {
  const shown = useChange(0, 1, 600, context.attempt) === 1;
  const settled = context.checked && context.correct;
  return <Wallet amount={settled ? to : from} note={note && shown && !settled ? { text: note, gain: !!gain } : null} />;
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

/** Screen 20: the two prices come together to be added; the total shows once the learner has it. */
function PriceCalc({ context }: { context: VisualContext }) {
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
function EraserTotal({ context }: { context: VisualContext }) {
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

/** Screen 14's two cards, as the question that follows its interaction shows them. */
function NameValueCards() {
  return (
    <div className="flex items-center gap-3">
      <NameValue name="water_level" value="550 ml" />
      <NameValue name="bottle_capacity" value="1,000 ml" />
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
        hintText: "What can we take along?",
        hintOnMiss: true,
      }),
    ],
  },

  [STEP.carry]: {
    step: STEP.carry,
    title: "Pick the *Right Object*",
    stages: [
      quiz({
        line: "We carry water. What should hold it?",
        layout: "grid",
        options: [
          { id: "bottle", text: "Water bottle", node: <Bottle ml={600} height={48} marks={false} /> },
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
        visual: (context) => <BottleChange from={500} to={750} pour context={context} />,
        options: words(["500 ml", "750 ml", "1,000 ml"]),
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
        visual: () => (
          <div className="flex items-end gap-6">
            <BottleWithAmount ml={500} height={140} caption="Earlier" label="500 ml" />
            <BottleWithAmount ml={750} height={140} caption="Now" label="750 ml" />
          </div>
        ),
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
        visual: (context) => <BottleChange from={750} to={550} context={context} />,
        options: words(["200 ml", "550 ml", "750 ml"]),
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
        visual: (context) => <BottleChange from={550} to={0} context={context} />,
        options: words(["0 ml", "550 ml", "1,000 ml"]),
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
        visual: () => (
          <div className="flex items-end gap-3">
            {[
              ["Aarav", 600],
              ["Mia", 600],
              ["Kabir", 600],
            ].map(([name, ml]) => (
              <Bottle key={name} ml={Number(ml)} tag={String(name)} marks={false} height={118} />
            ))}
          </div>
        ),
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
        visual: () => <NameValueCards />,
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
        visual: () => (
          <div className="flex items-center gap-3">
            <Classroom present={27} />
            <AttendanceBoard total={30} present={27} absent={3} />
          </div>
        ),
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
        visual: () => <Items />,
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
        visual: () => <Items />,
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
        visual: (context) => <PriceCalc context={context} />,
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
        visual: (context) => <EraserTotal context={context} />,
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
        visual: (context) => <WalletChange from={100} to={100} context={context} />,
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
        visual: (context) => <WalletChange from={100} to={150} note="+₹50" gain context={context} />,
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
        visual: (context) => <WalletChange from={150} to={120} note="−₹30" context={context} />,
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
        visual: (context) => <WalletChange from={200} to={250} note="+₹50" gain context={context} />,
        options: words(["₹150", "₹250", "₹300"]),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "₹200 + ₹50 = ₹250.",
        wrong: "Add money you receive.",
      }),
      quiz({
        line: "Now you spend ₹30. What's your balance?",
        visual: (context) => <WalletChange from={250} to={220} note="−₹30" context={context} />,
        options: words(["₹180", "₹220", "₹250"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "₹250 − ₹30 = ₹220.",
        wrong: "Subtract money you spend.",
      }),
      quiz({
        line: "Then you get ₹20. What's the final balance?",
        visual: (context) => <WalletChange from={220} to={240} note="+₹20" gain context={context} />,
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
