"use client";

import { useEffect } from "react";
import { at, LOOK_AGAIN, neutral, options, quiz, yesNo } from "./helpers";
import { FlipCarouselStage } from "./FlipCarousel";
import { ExpressionStage, FillRowsStage, ShareStage, SymbolStage } from "./interactions";
import { OperatorTurnStage, type OperatorItem } from "./OperatorCardsStage";
import { fireScene, type SceneTexts } from "@/lib/rive/operatorsHost";
import { OPERATOR_INTRO, OPERATOR_SHOP, OPERATOR_STUDIO } from "@/lib/rive/runtime";
import { OperatorScene } from "./OperatorScene";
import { STEP } from "./operators";
import { P } from "./pictures";
import type { InteractionStage, ScreenDef } from "./screen";
import { StudioJobs, StudioJobsTurn, StudioTurnStage, StudioVisual, type StudioCard } from "./StudioStage";
import { ExprBig, GroupsPicture, PlantGrid, ShareScene, ValueCards } from "./visuals";

/** Which key of the studio each answer of "Explore the situations!" lifts, by the answer's place (Adding, Subtracting, Dividing, Comparing). Comparing has no key: the studio's keys are the four that calculate. */
const ANSWER_KEY = [OPERATOR_STUDIO.pick.add, OPERATOR_STUDIO.pick.subtract, OPERATOR_STUDIO.pick.divide, OPERATOR_STUDIO.pick.none] as const;

/** What the studio's card says on each question: the situation, and what is asked (the numbers are the question's own). */
const ASK = "Which action is this?";
const SITUATION_CARDS = {
  money: { title: "Combining money", meaning: ASK, example: "₹50 and ₹30" },
  chocolate: { title: "Sharing chocolate", meaning: ASK, example: "20 for 4 students" },
  heights: { title: "Comparing heights", meaning: ASK, example: "150 vs 140 cm" },
  spending: { title: "Spending money", meaning: ASK, example: "₹500, spend ₹100" },
} as const satisfies Record<string, StudioCard>;

/**
 * Screen 4's last question, "Which mathematical actions did we use?": the studio stands over the answers, its card with the money
 * from the start to the end. Picking an answer lifts the key of its first action (Addition and subtraction: +, Multiplication
 * and division: ×; Only comparing has none), as the studio lifts one key at a time.
 */
const ACTIONS_CARD: StudioCard = { title: "Money left ₹300", meaning: "Which actions did we use?", example: "₹500 to ₹300" };
const ACTIONS_KEY = [OPERATOR_STUDIO.pick.add, OPERATOR_STUDIO.pick.multiply, OPERATOR_STUDIO.pick.none] as const;

/**
 * Screen 7's stickers question ("Which operation finds the total?"): the studio stands over the answers (Add, Subtract, Divide),
 * its card with the two numbers and no operation named. Picking an answer lifts its key.
 */
const STICKERS_CARD: StudioCard = { title: "Collecting stickers", meaning: "Which operation is this?", example: "12 and 5 more" };
const STICKERS_KEY = [OPERATOR_STUDIO.pick.add, OPERATOR_STUDIO.pick.subtract, OPERATOR_STUDIO.pick.divide] as const;

/** Screen 7's sweets question ("Which operation finds how many are left?"), the same way: the answers are Multiply, Subtract, Add. */
const SWEETS_CARD: StudioCard = { title: "Eating sweets", meaning: "Which operation is this?", example: "9 sweets, eat 4" };
const SWEETS_KEY = [OPERATOR_STUDIO.pick.multiply, OPERATOR_STUDIO.pick.subtract, OPERATOR_STUDIO.pick.add] as const;

/**
 * A question of "Explore the situations!": the Operators studio stands over the four answers (Adding, Subtracting,
 * Dividing, Comparing). Picking an answer lifts its key, and checking it plays the studio's right or wrong.
 */
const situationQuiz = (card: StudioCard, stage: { line: string; correctId: string; right: string; wrong: string }) =>
  quiz({
    ...stage,
    visual: ({ attempt, picked, checked, correct }) => (
      <StudioVisual
        card={card}
        pick={(picked !== null ? ANSWER_KEY[Number(picked)] : undefined) ?? OPERATOR_STUDIO.pick.none}
        verdict={checked ? (correct ? "correct" : "wrong") : null}
        attempt={attempt}
      />
    ),
    options: neutral(["Adding", "Subtracting", "Dividing", "Comparing"]),
    rightTitle: "Exactly!",
  });

/**
 * The shop counter (the Variable module's "VAR_Shop") on screens 3 and 4, with the book and the pen priced as the money
 * screens have them (its file has 50 and 20), their names on, and the hanging board saying one thing at a time: the money
 * left that is not known yet, then what the book and the pen cost, then the money left.
 */
const shopTexts = (board: { label: string; amount: string }): SceneTexts => ({
  [OPERATOR_SHOP.text.boardAmount]: board.amount,
  [OPERATOR_SHOP.text.boardLabel]: board.label,
  [OPERATOR_SHOP.text.notebookName]: "Book",
  ...Object.fromEntries(OPERATOR_SHOP.text.notebookAmount.map((run) => [run, "150"])),
  ...Object.fromEntries(OPERATOR_SHOP.text.penAmount.map((run) => [run, "50"])),
});

/** Screen 3's picture: the eraser too (its own ₹10), and the board asking for the money left. */
const SHOP_FACTS = { showEraser: true, showNames: true, showTotal: true };
const SHOP_TEXTS = shopTexts({ label: "Money left", amount: "?" });

/** Screen 7's second picture: the intro's wallet (its file has ₹500 on the tag and on the note) with the ₹20 spent on the tag, and the ₹80 the question starts from on the note (the money in the wallet). */
const WALLET_SPEND: SceneTexts = { [OPERATOR_INTRO.text.walletTag]: "₹20", [OPERATOR_INTRO.text.walletNote]: "₹80" };

/**
 * Screen 4's picture (the book and the pen only), drawn smaller than screen 3's since the blocks stand under it. `together`
 * plays the prices joining with a plus (the book and the pen put together).
 */
function ShopLead({ board, together = false }: { board: { label: string; amount: string }; together?: boolean }) {
  useEffect(() => {
    if (together) fireScene("shop", "calc");
  }, [together]);
  return <OperatorScene scene="shop" width="340px" values={{ showNames: true, showTotal: true }} texts={shopTexts(board)} />;
}

/** The four operators of "Meet the Operators!", in the order their questions come. */
const OPERATORS: readonly OperatorItem[] = [
  { id: "add", symbol: "+", name: "Addition", title: "Combines values", example: "3 + 2", tint: "mint" },
  { id: "sub", symbol: "-", name: "Subtraction", title: "Subtracts values", example: "5 - 2", tint: "cream" },
  { id: "mul", symbol: "*", name: "Multiplication", title: "Multiplies values", example: "3 * 2", tint: "lavender" },
  { id: "div", symbol: "/", name: "Division", title: "Divides values", example: "6 / 2", tint: "blue" },
];

/** What Hex says as each operator's turn comes. */
const OPERATOR_LINES: readonly string[] = [
  "In programming, these symbols are called operators. First, +: it combines values.",
  "Next, -: it subtracts one value from another.",
  "Now *: it multiplies values.",
  "Last, /: it divides one value by another.",
];

/** The studio key of each of the four operators, in the same order (+, -, *, /). */
const OPERATOR_KEY = [OPERATOR_STUDIO.pick.add, OPERATOR_STUDIO.pick.subtract, OPERATOR_STUDIO.pick.multiply, OPERATOR_STUDIO.pick.divide] as const;

/**
 * The turn of one operator: the Operators studio's key for it is lifted while Hex introduces it, its card saying the name,
 * what it does and an example, and Continue goes on to the next one.
 */
const operatorTurn = (focus: number): InteractionStage => ({
  kind: "interaction",
  line: OPERATOR_LINES[focus],
  render: (api) => {
    const operator = OPERATORS[focus];
    return (
      <StudioTurnStage
        api={api}
        card={{ title: operator.name, meaning: operator.title, example: operator.example }}
        pick={OPERATOR_KEY[focus]}
        before={focus > 0 ? OPERATOR_KEY[focus - 1] : OPERATOR_STUDIO.pick.none}
      />
    );
  },
});

/** What Hex says as each job's turn comes. */
const JOB_LINES: readonly string[] = [
  "A program does two big things with values. First, it calculates, with arithmetic operators.",
  "The second big thing is to compare values, with comparison operators.",
];

/** The turn of one job: the Operators studio's two cards (Calculate, Compare) as they are, while Hex introduces the job, and Continue goes on to the next. */
const jobTurn = (focus: number): InteractionStage => ({
  kind: "interaction",
  line: JOB_LINES[focus],
  render: (api) => <StudioJobsTurn api={api} />,
});

/** The three answers of "Same Numbers, Three Answers!" (23 chocolates in groups of 4), in the order they are introduced. */
const DIVISIONS: readonly OperatorItem[] = [
  { id: "div", symbol: "/", name: "Division", title: "Ordinary division, with decimals", example: "23 / 4 = 5.75", tint: "blue" },
  { id: "floor", symbol: "//", name: "Floor division", title: "Floor division: complete groups", example: "23 // 4 = 5", tint: "mint" },
  { id: "mod", symbol: "%", name: "Modulus", title: "Modulus: the remainder", example: "23 % 4 = 3", tint: "cream" },
];

/** What Hex says as each of them comes. */
const DIVISION_LINES: readonly string[] = [
  "23 chocolates, 4 in each group. First, /: ordinary division, with decimals.",
  "Next, //: floor division. It counts the complete groups.",
  "Last, %: modulus. It gives what is left over.",
];

/** The part of the chocolates each one is about: all of them, the complete groups, what is left over. */
const DIVISION_PART = ["all", "groups", "left"] as const;

/** The turn of one of them: its card is picked out while Hex introduces it (and the chocolates it is about), and Continue goes on to the next. */
const divisionTurn = (focus: number): InteractionStage => ({
  kind: "interaction",
  line: DIVISION_LINES[focus],
  render: (api) => (
    <OperatorTurnStage
      api={api}
      operators={DIVISIONS}
      focus={focus}
      columns={3}
      // Before its card is picked out the chocolates still show the turn before, so the change reads as a fade.
      header={(lit) => <GroupsPicture total={23} size={4} emphasis={DIVISION_PART[lit ? focus : Math.max(0, focus - 1)]} still={focus > 0} />}
    />
  ),
});

/** Screens 1-14 (phases 1 to 3: everyday actions, meeting operators, arithmetic). */
export const SCREENS_A: Readonly<Record<number, ScreenDef>> = {
  // 1. We do these things every day.
  [STEP.everyday]: {
    step: STEP.everyday,
    title: "Have you *tried* these?",
    stages: [
      {
        kind: "interaction",
        line: "Think about everyday things you do without even noticing.",
        render: (api) => (
          <FlipCarouselStage
            api={api}
            cards={[
              { id: "money", image: P.cardMoney, verb: "Combining", label: "Money", caption: "Two stacks of money are put together.", tint: "teal" },
              { id: "chocolates", image: P.cardChocolates, verb: "Sharing", label: "Chocolates", caption: "Chocolates are shared among students.", tint: "pink" },
              { id: "wallet", image: P.cardSpending, verb: "Spending", label: "Money", caption: "Money is spent from a wallet.", tint: "amber" },
              { id: "heights", image: P.cardHeights, verb: "Comparing", label: "Heights", caption: "Two people compare how tall they are.", tint: "blue" },
            ]}
          />
        ),
        finishPanel: { title: "You do these every day!", text: "You already put together, share, compare and spend without thinking." },
      },
    ],
  },

  // 2. Different situations, different actions.
  [STEP.actions]: {
    step: STEP.actions,
    title: "Explore the *situations!*",
    stages: [
      situationQuiz(SITUATION_CARDS.money, {
        line: "You have ₹50 and receive another ₹30.",
        correctId: at(0),
        right: "Adding: we put the two amounts together.",
        wrong: "Are the amounts put together, taken away, shared or compared?",
      }),
      situationQuiz(SITUATION_CARDS.chocolate, {
        line: "You have 20 chocolates to share equally among 4 students.",
        correctId: at(2),
        right: "Dividing: we share equally.",
        wrong: "Everyone should get the same. What do we do to share?",
      }),
      situationQuiz(SITUATION_CARDS.heights, {
        line: "One student is 150 cm tall and another is 140 cm.",
        correctId: at(3),
        right: "Comparing: we see who is taller.",
        wrong: "We are not changing the heights. We are looking at the two.",
      }),
      situationQuiz(SITUATION_CARDS.spending, {
        line: "You have ₹500 and spend ₹100.",
        correctId: at(1),
        right: "Subtracting: money is taken away. We add, subtract, divide or compare.",
        wrong: "Does the money grow, or does some go away?",
      }),
    ],
  },

  // 3. We already have information.
  [STEP.remember]: {
    step: STEP.remember,
    title: "Remember What We *Learned?*",
    stages: [
      quiz({
        line: "We have ₹500 and the price of every item. Can we find the money left without doing anything?",
        visual: () => <OperatorScene scene="shop" values={SHOP_FACTS} texts={SHOP_TEXTS} />,
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Correct!",
        right: "We have the information, but we still need an operation to find the result.",
        wrong: "Is the money left written on any of the cards?",
      }),
    ],
  },

  // 4. How much money will remain?
  [STEP.remaining]: {
    step: STEP.remaining,
    title: "How Much Money *Will Remain?*",
    stages: [
      {
        kind: "interaction",
        line: "You have ₹500. First, what do the book and the pen cost together?",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={<ShopLead board={{ label: "Money left", amount: "?" }} together={api.finished} />}
            tokens={["150", "50", "+", "-"]}
            accept={[
              ["150", "+", "50"],
              ["50", "+", "150"],
            ]}
            hint="Together means we put the two prices together."
            result="200"
          />
        ),
        finishPanel: { title: "That's right!", text: "150 + 50 = 200. The book and the pen cost ₹200." },
      },
      {
        kind: "interaction",
        line: "You have ₹500 in the wallet. Now take that cost out of it.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={<ShopLead board={api.finished ? { label: "Money left", amount: "300" } : { label: "Book + Pen", amount: "200" }} />}
            tokens={["500", "200", "-", "+"]}
            accept={[["500", "-", "200"]]}
            hint="Money goes out of the wallet, so we take it away."
            result="300"
          />
        ),
        finishPanel: { title: "₹300 remains!", text: "500 - 200 = 300. Two operations gave the answer." },
      },
      quiz({
        line: "Which mathematical actions did we use?",
        keepLine: true,
        visual: ({ attempt, picked, checked, correct }) => (
          <StudioVisual
            card={ACTIONS_CARD}
            pick={(picked !== null ? ACTIONS_KEY[Number(picked)] : undefined) ?? OPERATOR_STUDIO.pick.none}
            verdict={checked ? (correct ? "correct" : "wrong") : null}
            attempt={attempt}
            // Hex's line stays up after the check here, so the room for the picture is short: it is drawn smaller, not cut by his bubble.
            width="290px"
          />
        ),
        options: neutral(["Addition and subtraction.", "Multiplication and division.", "Only comparing."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "We used operations to turn the information into a useful result.",
        wrong: "We put prices together, then took the total away from the wallet.",
      }),
    ],
  },

  // 5. Meet the operators.
  [STEP.meet]: {
    step: STEP.meet,
    title: "Meet the *Operators!*",
    stages: [
      operatorTurn(0),
      operatorTurn(1),
      operatorTurn(2),
      operatorTurn(3),
    ],
  },

  // 6. Calculate or compare.
  [STEP.calcCompare]: {
    step: STEP.calcCompare,
    title: "Calculate *or Compare?*",
    stages: [
      jobTurn(0),
      jobTurn(1),
      quiz({
        line: "Which job answers the question “Which is greater?”",
        visual: () => <StudioJobs />,
        options: options([
          ["Calculate", P.order],
          ["Compare", P.actions],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Compare! First we calculate, then we move on to comparisons.",
        wrong: "Calculating finds a value. Which job looks at greater or smaller?",
      }),
    ],
  },

  // 7. Combining values.
  [STEP.combine]: {
    step: STEP.combine,
    title: "What Happens When Values *Come Together?*",
    stages: [
      quiz({
        line: "You have ₹50. Your friend gives you ₹30. How much now?",
        visual: () => <OperatorScene scene="intro" values={{ mode: 1, situation: OPERATOR_INTRO.situation.money }} />,
        options: options([
          ["₹70", P.money],
          ["₹80", P.money],
          ["₹20", P.money],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "50 + 30 = 80. Addition combines values.",
        wrong: "The money joins what you already have.",
      }),
      quiz({
        line: "Now you spend ₹20. How much is left?",
        visual: () => <OperatorScene scene="intro" values={{ mode: 1, situation: OPERATOR_INTRO.situation.wallet }} texts={WALLET_SPEND} />,
        options: options([
          ["₹100", P.money],
          ["₹60", P.money],
          ["₹80", P.money],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "80 - 20 = 60. Subtraction finds the difference or what remains.",
        wrong: "Spending takes money out of the wallet.",
      }),
      quiz({
        line: "You have 12 stickers and get 5 more. Which operation finds the total?",
        visual: ({ attempt, picked, checked, correct }) => (
          <StudioVisual
            card={STICKERS_CARD}
            pick={(picked !== null ? STICKERS_KEY[Number(picked)] : undefined) ?? OPERATOR_STUDIO.pick.none}
            verdict={checked ? (correct ? "correct" : "wrong") : null}
            attempt={attempt}
          />
        ),
        options: neutral(["Add (+)", "Subtract (-)", "Divide (/)"]),
        correctId: at(0),
        rightTitle: "Right!",
        right: "Addition combines values.",
        wrong: "You are getting more. Do the stickers join or go away?",
      }),
      quiz({
        line: "You have 9 sweets and eat 4. Which operation finds how many are left?",
        visual: ({ attempt, picked, checked, correct }) => (
          <StudioVisual
            card={SWEETS_CARD}
            pick={(picked !== null ? SWEETS_KEY[Number(picked)] : undefined) ?? OPERATOR_STUDIO.pick.none}
            verdict={checked ? (correct ? "correct" : "wrong") : null}
            attempt={attempt}
          />
        ),
        options: neutral(["Multiply (*)", "Subtract (-)", "Add (+)"]),
        correctId: at(1),
        rightTitle: "Right!",
        right: "Subtraction finds what remains.",
        wrong: "Eating takes sweets away.",
      }),
    ],
  },

  // 8. Build equal groups.
  [STEP.chairs]: {
    step: STEP.chairs,
    title: "What If Every Group Has the *Same Quantity?*",
    stages: [
      {
        kind: "interaction",
        line: "4 rows, 5 chairs in each row. Tap a row to place its chairs.",
        render: (api) => <FillRowsStage api={api} rows={4} per={5} />,
        finishPanel: { title: "All set!", text: "Every row has 5 chairs. Now let's count them all." },
      },
      quiz({
        line: "Count the chairs in each row, then all of them.",
        question: "How many chairs altogether?",
        visual: () => <ExprBig tokens={["5", "+", "5", "+", "5", "+", "5"]} size={28} />,
        options: options([
          ["9", P.chair],
          ["20", P.chair],
          ["25", P.chair],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "5 + 5 + 5 + 5 = 20 chairs.",
        wrong: "Add the chairs of all four rows.",
      }),
      quiz({
        line: "There is a shortcut for adding equal groups.",
        question: "Which means 4 groups of 5?",
        options: neutral(["4 * 5", "4 + 5", "4 - 5"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "4 * 5 = 20. Multiplication is a shortcut for adding equal groups.",
        wrong: "Which operator repeats a group?",
      }),
    ],
  },

  // 9. Sharing equally.
  [STEP.sharing]: {
    step: STEP.sharing,
    title: "Can Everyone Get the *Same Number?*",
    stages: [
      quiz({
        line: "20 chocolates, 4 students. How many does each one get?",
        visual: () => <ShareScene pile={20} trays={[0, 0, 0, 0]} />,
        options: options([
          ["4", P.chocolate],
          ["5", P.chocolate],
          ["6", P.chocolate],
        ]),
        correctId: at(1),
        rightTitle: "Good guess!",
        right: "Let's check it by sharing them out.",
        wrong: "Four students share 20 equally. Let's see by sharing them.",
      }),
      {
        kind: "interaction",
        line: "Share them out, one to each student at a time.",
        render: (api) => <ShareStage api={api} total={20} students={4} />,
        finishPanel: { title: "5 each!", text: "20 / 4 = 5.0. Division shares a quantity equally." },
      },
      quiz({
        line: "In Python, / gives a Float. What does 20 / 4 give?",
        options: neutral(["5", "5.0", "4.0"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "20 / 4 = 5.0. The / operator gives a Float, not 5.",
        wrong: "Python's / always gives a decimal-type answer.",
      }),
    ],
  },

  // 10. When sharing is not equal.
  [STEP.unequal]: {
    step: STEP.unequal,
    title: "When Sharing *Is Not Equal*",
    stages: [
      {
        kind: "interaction",
        line: "23 chocolates, 4 students. Share one round at a time.",
        render: (api) => <ShareStage api={api} total={23} students={4} />,
        finishPanel: { title: "Each has 5!", text: "3 chocolates are left. They can't make another full round." },
      },
      quiz({
        line: "How many does each student get, and how many are left?",
        visual: () => <ShareScene pile={3} trays={[5, 5, 5, 5]} />,
        options: neutral(["5 each, 3 left.", "6 each, 0 left.", "5 each, 0 left."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "5 each, and 3 are left over.",
        wrong: "Count what is in each tray, then what is still in the heap.",
      }),
      quiz({
        line: "Three results: 5.75, 5 and 3. Which expression gives the 3 left over?",
        options: neutral(["23 / 4", "23 // 4", "23 % 4"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "23 % 4 = 3. 23 / 4 = 5.75 and 23 // 4 = 5 answer other questions.",
        wrong: "One of these gives the remainder: the % operator.",
      }),
    ],
  },

  // 11. Three different results.
  [STEP.three]: {
    step: STEP.three,
    title: "Same Numbers, *Three Answers!*",
    stages: [
      divisionTurn(0),
      divisionTurn(1),
      divisionTurn(2),
      quiz({
        line: "What does 23 // 4 = 5 tell us?",
        options: neutral(["5 complete groups of 4.", "5 chocolates are left over.", "The decimal answer, 5.75."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Floor division rounds the quotient down: the number of complete groups.",
        wrong: "// counts how many complete groups fit. It is not the leftover.",
      }),
    ],
  },

  // 12. What if there is not enough to make even one group.
  [STEP.noGroup]: {
    step: STEP.noGroup,
    title: "Not Enough for *Even One Group?*",
    stages: [
      quiz({
        line: "1 chocolate, 2 students. How many complete groups of 2 can we make?",
        visual: () => <ShareScene pile={1} trays={[0, 0]} />,
        options: neutral(["0 complete groups.", "1 complete group.", "0.5 complete groups."]),
        correctId: at(0),
        rightTitle: "Right!",
        right: "No complete group of 2 can be made from 1 chocolate.",
        wrong: "A group needs 2 chocolates. Do we have 2?",
      }),
      quiz({
        line: "1 / 2 = 0.5 and 1 // 2 = 0. What is 1 % 2?",
        visual: () => (
          <ValueCards
            items={[
              { label: "1 / 2", value: "0.5" },
              { label: "1 // 2", value: "0" },
              { label: "1 % 2", value: "?" },
            ]}
          />
        ),
        options: neutral(["0", "1", "2"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "1 % 2 = 1. The whole chocolate is left, so 1 = (2 * 0) + 1.",
        wrong: "The remainder is what is left after making all the complete groups.",
      }),
    ],
  },

  // 13. The remainder challenge.
  [STEP.remainderDrill]: {
    step: STEP.remainderDrill,
    title: "How Much *Remains?*",
    stages: [
      quiz({
        line: "7 chocolates. Each group needs 3.",
        question: "7 // 3 = ? and 7 % 3 = ?",
        visual: ({ attempt }) => <GroupsPicture replay={attempt} total={7} size={3} />,
        options: neutral(["2 and 1", "3 and 1", "2 and 2"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "2 complete groups, and 1 chocolate left.",
        wrong: "Count the complete groups of 3, then what is left.",
      }),
      quiz({
        line: "5 chocolates. Each group needs 2.",
        question: "5 // 2 = ? and 5 % 2 = ?",
        visual: ({ attempt }) => <GroupsPicture replay={attempt} total={5} size={2} />,
        options: neutral(["2 and 0", "2 and 1", "3 and 1"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "2 complete groups, and 1 chocolate left.",
        wrong: "Count the complete groups of 2, then what is left.",
      }),
      quiz({
        line: "3 chocolates. Each group needs 5.",
        question: "3 // 5 = ? and 3 % 5 = ?",
        visual: ({ attempt }) => <GroupsPicture replay={attempt} total={3} size={5} />,
        options: neutral(["0 and 3", "1 and 0", "0 and 5"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "No complete group, so all 3 remain.",
        wrong: "Can we make even one group of 5 from 3?",
      }),
      quiz({
        line: "12 chocolates. Each group needs 4.",
        question: "12 // 4 = ? and 12 % 4 = ?",
        visual: ({ attempt }) => <GroupsPicture replay={attempt} total={12} size={4} />,
        options: neutral(["3 and 4", "2 and 4", "3 and 0"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "3 groups, nothing left. The remainder is always smaller than the divisor.",
        wrong: "Do the groups of 4 use up all 12?",
      }),
    ],
  },

  // 14. Growing bigger, faster.
  [STEP.growing]: {
    step: STEP.growing,
    title: "Growing *Bigger, Faster!*",
    stages: [
      quiz({
        line: "A square garden: 4 rows and 4 columns of plants.",
        question: "How many plants are there?",
        visual: ({ attempt }) => <PlantGrid replay={attempt} />,
        options: neutral(["8", "16", "12"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "4 * 4 = 16. We can also write 4 ** 2 = 16.",
        wrong: LOOK_AGAIN,
      }),
      {
        kind: "interaction",
        line: "** raises a number to a power. Tap the examples.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "a", symbol: "2 ** 3", title: "2 * 2 * 2", example: "2 ** 3 = 8" },
                  { id: "b", symbol: "3 ** 2", title: "3 * 3", example: "3 ** 2 = 9" },
                  { id: "c", symbol: "5 ** 2", title: "5 * 5", example: "5 ** 2 = 25" },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Exponentiation!", text: "** is a compact way to multiply a number by itself." },
      },
      quiz({
        line: "What is 4 ** 2?",
        options: neutral(["8", "16", "6"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "4 ** 2 = 4 * 4 = 16.",
        wrong: "4 ** 2 means 4 multiplied by itself.",
      }),
    ],
  },
};
