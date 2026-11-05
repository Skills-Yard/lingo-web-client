"use client";

import { Bottle, BottleWithAmount, Art, CalculatorApp, Classroom, AttendanceBoard, Counter, NameValue, ShopItem, useChange, useTimeline, Wallet, CARD } from "./visuals";
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
  const drinking = useChange(0, 1, 3200, context.attempt) === 1;
  return (
    <div className="flex items-end gap-3">
      <BottleWithAmount ml={ml} height={150} stream={ml === 0 || (ml > 0 && ml < 800)} marks={false} label={ml === 0 ? "Empty" : undefined} />
      {drinking && <Art name="drinking-student" emoji="🧒" label="A student drinks from the bottle" className="h-[84px] w-[110px]" />}
    </div>
  );
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

/** A small mark for a picture the learner sees as a hint. */
function HintArt({ label, emoji, name }: { label: string; emoji: string; name: string }) {
  return <Art name={name} emoji={emoji} label={label} className="h-[84px] w-[150px]" />;
}

/* ───────────────────────── Screens ───────────────────────── */

const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", ...stage });

/** Screens that are a title and one or more stages: the questions and the interactions. */
export const SCREENS: Readonly<Record<number, ScreenDef>> = {
  [STEP.trek]: {
    step: STEP.trek,
    title: "Let's Go on a *Trekking Adventure!*",
    stages: [
      quiz({
        line: "Imagine you and your friends are going on a long trek through the mountains. You will walk, explore, and enjoy the beautiful views along the way.",
        question: "What do you think might happen when we walk for a long time?",
        visual: () => <Art name="trek-trail" emoji="🏔️" label="A mountain trail with students walking" className="h-[112px] w-[300px]" />,
        options: words(["We may become tired.", "We may feel thirsty.", "We may need some rest.", "All of these."]),
        correctId: at(3),
        alsoOk: { ids: [at(0), at(1), at(2)], title: "Good thinking!", text: "That can happen too. A long trek can make us tired, thirsty and in need of rest." },
        rightTitle: "Exactly!",
        right: "A long trek can make us tired and thirsty. We need to prepare for it.",
        wrong: "Think about what happens to your body when you walk or run for a long time.",
      }),
    ],
  },

  [STEP.thirsty]: {
    step: STEP.thirsty,
    title: "We Are *Getting Thirsty!*",
    stages: [
      quiz({
        line: "After walking for a long time, you and your friends start feeling thirsty.",
        question: "What do we need right now?",
        visual: () => <Art name="thirsty-student" emoji="🥵" label="A student pauses, looking thirsty" className="h-[96px] w-[220px]" />,
        layout: "grid",
        options: [
          { id: "water", text: "Water", emoji: "💧" },
          { id: "football", text: "A football", emoji: "⚽" },
          { id: "notebook", text: "A notebook", emoji: "📓" },
          { id: "jacket", text: "A jacket", emoji: "🧥" },
        ],
        correctId: "water",
        rightTitle: "Yes!",
        right: "We need water to drink.",
        wrong: "Think about what you usually drink when you feel thirsty.",
        hintVisual: <HintArt name="drinking-student" emoji="🧒" label="A student drinking water" />,
        hintOnMiss: true,
      }),
    ],
  },

  [STEP.noWater]: {
    step: STEP.noWater,
    title: "What If There Is *No Water Nearby?*",
    stages: [
      quiz({
        line: "Imagine there is no river, waterfall, shop, or drinking-water source along the trekking path.",
        question: "How can we make sure that we have water whenever we need it?",
        visual: () => <Art name="no-water-trail" emoji="🏜️" label="An empty trail with no water nearby" className="h-[104px] w-[300px]" />,
        options: words(["Carry water with us.", "Wait until we find a river.", "Stop drinking water.", "Go back home."]),
        correctId: at(0),
        rightTitle: "Great thinking!",
        right: "We should carry water with us before starting the trek.",
        wrong: "What can we do before starting the trek so that water is available whenever we need it?",
        hintText: "Can we take something with us before leaving?",
        hintOnMiss: true,
      }),
    ],
  },

  [STEP.carry]: {
    step: STEP.carry,
    title: "What Should *We Carry?*",
    stages: [
      quiz({
        line: "We have decided to carry water. But what should we use to take it along?",
        question: "Which object is suitable for carrying drinking water?",
        layout: "grid",
        options: [
          { id: "bottle", text: "Water bottle", node: <Bottle ml={600} height={48} marks={false} /> },
          { id: "football", text: "Football", emoji: "⚽" },
          { id: "notebook", text: "Notebook", emoji: "📓" },
          { id: "lunchbox", text: "School lunchbox", emoji: "🍱" },
        ],
        correctId: "bottle",
        rightTitle: "That's right!",
        right: "A water bottle is designed to hold water.",
        wrong: "Think about which object can safely hold water without spilling it.",
        spill: true,
      }),
    ],
  },

  [STEP.bottle]: {
    step: STEP.bottle,
    title: "A Bottle *Holds Water!*",
    stages: [
      quiz({
        line: "We fill the bottle with water and carry it with us. Whenever we feel thirsty, we can drink from it.",
        question: "What is the main purpose of the bottle?",
        visual: (context) => <BottleStory context={context} />,
        options: words(["To store water.", "To create water.", "To change the colour of water.", "To make water disappear."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A bottle is a container that holds and stores water for us.",
        wrong: "Look at what happened when we poured water into the bottle. Did it hold the water?",
      }),
    ],
  },

  [STEP.bridge]: {
    step: STEP.bridge,
    title: "Programs Need to Keep *Information Too!*",
    stages: [{ kind: "interaction", render: (api) => <BridgeStage {...api} />, nextLabel: "Let's Explore" }],
  },

  [STEP.fill]: {
    step: STEP.fill,
    title: "How Much Water *Should We Carry?*",
    stages: [
      {
        kind: "interaction",
        render: (api) => <FillSliderStage {...api} />,
        finishPanel: { title: "Great!", text: "Our bottle now contains 500 ml of water." },
      },
    ],
  },

  [STEP.addWater]: {
    step: STEP.addWater,
    title: "We Need *More Water!*",
    stages: [
      quiz({
        line: "We have 500 ml of water. Let's add another 250 ml.",
        question: "How much water do we have now?",
        visual: (context) => <BottleChange from={500} to={750} pour context={context} />,
        options: words(["500 ml", "650 ml", "750 ml", "1,000 ml"]),
        correctId: at(2),
        rightTitle: "Correct!",
        right: "500 ml + 250 ml = 750 ml.",
        wrong: "Start with 500 ml and add another 250 ml. What is the total?",
      }),
    ],
  },

  [STEP.sameBottle]: {
    step: STEP.sameBottle,
    title: "Same Bottle, *Different Amount!*",
    stages: [
      quiz({
        line: "First, our bottle contained 500 ml. After adding water, it contained 750 ml.",
        question: "What changed?",
        visual: () => (
          <div className="flex items-end gap-6">
            <BottleWithAmount ml={500} height={140} caption="Earlier" label="500 ml" />
            <BottleWithAmount ml={750} height={140} caption="Now" label="750 ml" />
          </div>
        ),
        options: words(["The bottle.", "The amount of water.", "Both the bottle and water."]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "The bottle stayed the same, but the amount of water changed.",
        wrong: "Compare the two bottles carefully. Are they the same bottle?",
      }),
    ],
  },

  [STEP.drink]: {
    step: STEP.drink,
    title: "Let's *Drink 200 ml!*",
    stages: [
      quiz({
        line: "We have 750 ml of water. After drinking 200 ml, how much will remain?",
        question: "How much water is left?",
        visual: (context) => <BottleChange from={750} to={550} context={context} />,
        options: words(["200 ml", "500 ml", "550 ml", "750 ml"]),
        correctId: at(2),
        rightTitle: "Correct!",
        right: "750 ml − 200 ml = 550 ml.",
        wrong: "We started with 750 ml and drank 200 ml. Subtract the amount we drank.",
      }),
    ],
  },

  [STEP.empty]: {
    step: STEP.empty,
    title: "The Bottle *Is Empty!*",
    stages: [
      quiz({
        line: "We had 550 ml of water. Now imagine we drink all of it.",
        question: "What is the amount of water remaining?",
        visual: (context) => <BottleChange from={550} to={0} context={context} />,
        options: words(["550 ml", "100 ml", "0 ml", "1,000 ml"]),
        correctId: at(2),
        rightTitle: "Yes!",
        right: "The bottle is empty, so the remaining water is 0 ml.",
        wrong: "If all the water is gone, how much water remains?",
      }),
    ],
  },

  [STEP.labels]: {
    step: STEP.labels,
    title: "Imagine Everyone *Has the Same Bottle!*",
    stages: [
      quiz({
        line: "You are trekking with your friends. Everyone has a similar-looking water bottle. How will you identify which bottle belongs to you?",
        question: "What would help you identify your bottle?",
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
        options: words(["A name label.", "The bottle's position.", "Its size only.", "Nothing is needed."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A name or label helps us identify something.",
        wrong: "Imagine all three bottles look exactly the same. How would you recognise yours?",
      }),
    ],
  },

  [STEP.meet]: {
    step: STEP.meet,
    title: "Variables Have *Names and Values!*",
    stages: [{ kind: "interaction", render: (api) => <NameValueStage {...api} /> }],
  },

  [STEP.classify]: {
    step: STEP.classify,
    title: "A Name *and a Value!*",
    stages: [
      { kind: "interaction", render: (api) => <ClassifyStage {...api} /> },
      quiz({
        line: "Now that you have sorted them, let's check.",
        question: "Which of these is a variable name?",
        visual: () => <NameValueCards />,
        options: words(["550 ml", "water_level", "1,000 ml"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "water_level is the name. 550 ml is its current value.",
        wrong: "A variable name identifies the information. The value tells us the information itself.",
      }),
    ],
  },

  [STEP.attendance]: {
    step: STEP.attendance,
    title: "A New Day *at School!*",
    stages: [
      quiz({
        line: "Imagine your class has 30 students. Today, the teacher is taking attendance.",
        question: "What information should the teacher keep track of?",
        visual: () => (
          <div className="flex items-center gap-3">
            <Classroom present={27} />
            <AttendanceBoard total={30} present={27} absent={3} />
          </div>
        ),
        options: words(["Total number of students.", "Number of students present.", "Number of students absent.", "All of these."]),
        correctId: at(3),
        rightTitle: "Exactly!",
        right: "The teacher needs to keep track of all three pieces of information.",
        wrong: "Think about what the teacher needs to know to complete attendance.",
      }),
    ],
  },

  [STEP.names]: {
    step: STEP.names,
    title: "Three Different *Pieces of Information!*",
    stages: [
      { kind: "interaction", render: (api) => <NamesStage {...api} /> },
      quiz({
        line: "Each variable tracks a different piece of information. We use meaningful names so that we can understand what each value represents.",
        question: "Which variable tells us how many students are absent?",
        visual: () => <AttendanceCards />,
        options: words(["total_students", "present_students", "absent_students"]),
        correctId: at(2),
        rightTitle: "Correct!",
        right: "absent_students keeps track of the number of absent students.",
        wrong: "Look at the meaning of each name. Which one refers to students who are not present?",
      }),
    ],
  },

  [STEP.tomorrow]: {
    step: STEP.tomorrow,
    title: "More Students *Come Tomorrow!*",
    stages: [
      quiz({
        line: "Today, 27 students were present and 3 were absent. Tomorrow, 2 of the absent students return.",
        question: "Which information changes?",
        visual: (context) => <ClassroomChange context={context} />,
        options: words(["Only total_students.", "present_students and absent_students.", "All three values.", "None of them."]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Present students increase to 29, absent students decrease to 1, and total students remain 30.",
        wrong: "The total class size has not changed. Think about which numbers change when two absent students arrive.",
      }),
    ],
  },

  [STEP.shopping]: {
    step: STEP.shopping,
    title: "Time to Buy *Some School Supplies!*",
    stages: [
      quiz({
        line: "You visit a stationery shop. You want to buy a notebook and a pen.",
        question: "If you want to calculate the total cost later, what information should you keep track of?",
        visual: () => <Items />,
        options: words(["Notebook price.", "Pen price.", "Both prices."]),
        correctId: at(2),
        rightTitle: "Right!",
        right: "We need both prices to calculate the total.",
        wrong: "Think about which prices we need to add together.",
      }),
    ],
  },

  [STEP.prices]: {
    step: STEP.prices,
    title: "Let's Organise *the Prices!*",
    stages: [
      { kind: "interaction", render: (api) => <MatchPricesStage {...api} /> },
      quiz({
        line: "Both prices now have a name.",
        question: "Which value belongs to pen_price?",
        visual: () => <Items />,
        options: words(["₹50", "₹20", "₹70"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "The pen costs ₹20.",
        wrong: "Look at the product and its price tag again.",
      }),
    ],
  },

  [STEP.total]: {
    step: STEP.total,
    title: "How Much *Do We Need to Pay?*",
    stages: [
      quiz({
        line: "We know the notebook price is ₹50 and the pen price is ₹20. Now we need to add both prices.",
        question: "What is the total cost?",
        visual: (context) => <PriceCalc context={context} />,
        options: words(["₹50", "₹60", "₹70", "₹80"]),
        correctId: at(2),
        rightTitle: "Excellent!",
        right: "₹50 + ₹20 = ₹70. We can keep this result separately using a meaningful name: total_price.",
        wrong: "Add the notebook price and the pen price.",
      }),
    ],
  },

  [STEP.eraser]: {
    step: STEP.eraser,
    title: "We Also *Need an Eraser!*",
    stages: [
      quiz({
        line: "You decide to buy an eraser costing ₹10. You already know the notebook and pen cost ₹70 together.",
        question: "What is the new total price?",
        visual: (context) => <EraserTotal context={context} />,
        options: words(["₹70", "₹75", "₹80", "₹90"]),
        correctId: at(2),
        rightTitle: "That's right!",
        right: "₹70 + ₹10 = ₹80.",
        wrong: "Add the eraser's price to the previous total.",
      }),
    ],
  },

  [STEP.pocket]: {
    step: STEP.pocket,
    title: "Let's Manage *Your Pocket Money!*",
    stages: [
      quiz({
        line: "Your parents give you ₹100 as pocket money.",
        question: "How much money do you currently have?",
        visual: (context) => <WalletChange from={100} to={100} context={context} />,
        options: words(["₹50", "₹100", "₹150", "₹200"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "Your current pocket money is ₹100.",
        wrong: "Look at the amount your parents gave you.",
      }),
    ],
  },

  [STEP.received]: {
    step: STEP.received,
    title: "You Received *Another ₹50!*",
    stages: [
      quiz({
        line: "Your grandparents give you ₹50 more. You previously had ₹100.",
        question: "How much money do you have now?",
        visual: (context) => <WalletChange from={100} to={150} note="+₹50" gain context={context} />,
        options: words(["₹100", "₹125", "₹150", "₹200"]),
        correctId: at(2),
        rightTitle: "Great!",
        right: "₹100 + ₹50 = ₹150. Your pocket money balance has increased.",
        wrong: "Add the ₹50 you received to the ₹100 you already had.",
      }),
    ],
  },

  [STEP.spent]: {
    step: STEP.spent,
    title: "You Bought *a Toy for ₹30!*",
    stages: [
      quiz({
        line: "You had ₹150. Now you spend ₹30 to buy a toy.",
        question: "How much money is left?",
        visual: (context) => <WalletChange from={150} to={120} note="−₹30" context={context} />,
        options: words(["₹30", "₹100", "₹120", "₹150"]),
        correctId: at(2),
        rightTitle: "Correct!",
        right: "₹150 − ₹30 = ₹120.",
        wrong: "Subtract the amount you spent from your previous balance.",
      }),
    ],
  },

  [STEP.follow]: {
    step: STEP.follow,
    title: "Can You Track *Your Balance?*",
    stages: [
      quiz({
        line: "Let's follow a new pocket money journey. You start with ₹200. First, you receive ₹50.",
        question: "What is your balance after receiving ₹50?",
        visual: (context) => <WalletChange from={200} to={250} note="+₹50" gain context={context} />,
        options: words(["₹150", "₹200", "₹250", "₹300"]),
        correctId: at(2),
        rightTitle: "Yes!",
        right: "₹200 + ₹50 = ₹250.",
        wrong: "Add the money you receive to the balance.",
      }),
      quiz({
        line: "Next, you spend ₹30.",
        question: "What is your balance after spending ₹30?",
        visual: (context) => <WalletChange from={250} to={220} note="−₹30" context={context} />,
        options: words(["₹180", "₹220", "₹250", "₹280"]),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "₹250 − ₹30 = ₹220.",
        wrong: "Subtract the money you spend from the balance.",
      }),
      quiz({
        line: "Finally, you receive ₹20.",
        question: "What is the final balance?",
        visual: (context) => <WalletChange from={220} to={240} note="+₹20" gain context={context} />,
        options: words(["₹200", "₹220", "₹240", "₹270"]),
        correctId: at(2),
        rightTitle: "Perfect!",
        right: "Your final balance is ₹240.",
        wrong: "Follow each event one by one. Add money when you receive it and subtract money when you spend it.",
      }),
    ],
  },

  [STEP.appIntro]: {
    step: STEP.appIntro,
    title: "Can We Build a *Simple Addition App?*",
    stages: [
      quiz({
        line: "Imagine you want to build an application that adds two numbers entered by a user. Before writing any code, we need to think about what the application must do.",
        question: "What should the application do first?",
        visual: () => <CalculatorApp compact />,
        options: words(["Display the result.", "Ask the user for the first number.", "Add two numbers immediately.", "Close the application."]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "First, we need to ask the user for the first number.",
        wrong: "Before an application can add numbers, it needs to know which numbers to add.",
        nextLabel: "Let's Build It",
      }),
    ],
  },

  [STEP.debug]: {
    step: STEP.debug,
    title: "Can You *Find the Mistake?*",
    stages: [
      quiz({
        line: "A shopping application needs to calculate the total price of two items. The first item costs ₹100 and the second ₹50, so the total should be ₹150. But the application displays ₹100.",
        question: "What is wrong with the application's calculation?",
        visual: () => <DebugVisual />,
        options: words(["It used only the first price.", "It added both prices correctly.", "The first price should be ₹50.", "The total should be ₹100."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The application used only the first price instead of adding both prices. The correct calculation is ₹100 + ₹50 = ₹150.",
        wrong: "Check whether both item prices were included in the calculation.",
      }),
    ],
  },

  [STEP.travel]: {
    step: STEP.travel,
    title: "Let's Build a *Travel Expense Tracker!*",
    stages: [
      quiz({
        line: "Imagine you are planning a short trip with your friends. You have ₹1,000 to spend. You spend ₹300 on travel and ₹200 on food. You want to know how much money remains.",
        question: "Which information should the application keep track of?",
        visual: () => <ExpenseTracker showLeft={false} />,
        options: words(["Starting budget.", "Travel expense.", "Food expense.", "All of these."]),
        correctId: at(3),
        rightTitle: "Correct!",
        right: "The application needs all three values to calculate the remaining budget.",
        wrong: "Think about what the application needs to work out how much money remains.",
      }),
      quiz({
        line: "Now predict the amount that remains.",
        question: "How much money remains?",
        visual: (context) => <ExpenseTracker showLeft={context.checked && context.correct} />,
        options: words(["₹300", "₹400", "₹500", "₹700"]),
        correctId: at(2),
        rightTitle: "Excellent!",
        right: "₹1,000 − ₹300 − ₹200 = ₹500.",
        wrong: "Subtract the travel expense and food expense from the starting budget.",
      }),
    ],
  },

  [STEP.reflectWhy]: {
    step: STEP.reflectWhy,
    title: "Why do programs *need variables?*",
    stages: [
      quiz({
        line: "You have explored how information is stored, identified, updated, and used in applications. Let's check your understanding.",
        options: words(["To store and keep track of information.", "To make the screen colourful.", "To create images only.", "To turn off a computer."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Programs use variables to store and keep track of information.",
        wrong: "Think about what the bottle, the attendance board and the wallet each kept track of.",
      }),
    ],
  },

  [STEP.reflectChange]: {
    step: STEP.reflectChange,
    title: "Can the value of *a variable change?*",
    stages: [
      quiz({
        line: "Think about the water in the bottle and the money in the wallet.",
        options: words(["Yes.", "No.", "Only once.", "Only when the computer restarts."]),
        correctId: at(0),
        rightTitle: "Yes!",
        right: "A variable's value can increase, decrease, or become zero.",
        wrong: "Remember how the water in the bottle and the money in the wallet changed.",
      }),
    ],
  },

  [STEP.reflectNames]: {
    step: STEP.reflectNames,
    title: "Why do we give variables *meaningful names?*",
    stages: [
      quiz({
        line: "Remember the three bottles, and the attendance board.",
        options: words(["To identify the information they represent.", "To make the program longer.", "To avoid calculations.", "To change the computer's speed."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A meaningful name tells us what information a value represents.",
        wrong: "Think about why each bottle needed a name label.",
      }),
    ],
  },

  [STEP.reflectBoth]: {
    step: STEP.reflectBoth,
    title: "Why keep track *of both numbers?*",
    stages: [
      quiz({
        line: "An application needs to add two numbers. Why should it keep track of both numbers?",
        options: words(["So it can use them in the calculation.", "So it can delete them.", "So it can display only one number.", "So it can stop running."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The application needs both numbers available to add them.",
        wrong: "Think about what the application needs before it can add.",
      }),
    ],
  },
};
