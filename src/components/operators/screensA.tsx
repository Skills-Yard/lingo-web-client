"use client";

import { at, LOOK_AGAIN, neutral, options, quiz, yesNo } from "./helpers";
import { FlipCarouselStage } from "./FlipCarousel";
import { ExpressionStage, FillRowsStage, ScenesStage, ShareStage, SymbolStage } from "./interactions";
import { STEP } from "./operators";
import { P } from "./pictures";
import type { ScreenDef } from "./screen";
import { ExprBig, GroupsPicture, PlantGrid, ShareScene, ValueCards, Versus, WalletScene } from "./visuals";

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
              { id: "money", pic: P.money, verb: "Combining", label: "Money", caption: "Two stacks of money are put together.", tint: "teal" },
              { id: "chocolates", pic: P.chocolate, verb: "Sharing", label: "Chocolates", caption: "Chocolates are shared among students.", tint: "pink" },
              { id: "wallet", pic: P.gift, verb: "Spending", label: "Money", caption: "Money is spent from a wallet.", tint: "amber" },
              { id: "heights", pic: P.person, verb: "Comparing", label: "Heights", caption: "Two people compare how tall they are.", tint: "blue" },
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
    title: "What Are We *Actually Doing?*",
    stages: [
      quiz({
        line: "You have ₹50 and receive another ₹30.",
        visual: ({ attempt }) => (
          <ValueCards
            replay={attempt}
            items={[
              { pic: P.money, label: "You have", value: "₹50" },
              { pic: P.money, label: "You get", value: "₹30" },
            ]}
          />
        ),
        layout: "grid",
        options: neutral(["Adding", "Subtracting", "Dividing", "Comparing"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Adding: we put the two amounts together.",
        wrong: "Are the amounts put together, taken away, shared or compared?",
      }),
      quiz({
        line: "You have 20 chocolates to share equally among 4 students.",
        visual: ({ attempt }) => (
          <ValueCards
            replay={attempt}
            items={[
              { pic: P.chocolate, label: "Chocolates", value: "20" },
              { pic: P.student, label: "Students", value: "4" },
            ]}
          />
        ),
        layout: "grid",
        options: neutral(["Adding", "Subtracting", "Dividing", "Comparing"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "Dividing: we share equally.",
        wrong: "Everyone should get the same. What do we do to share?",
      }),
      quiz({
        line: "One student is 150 cm tall and another is 140 cm.",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.person, label: "Student 1", value: "150 cm" }} right={{ pic: P.person, label: "Student 2", value: "140 cm" }} />,
        layout: "grid",
        options: neutral(["Adding", "Subtracting", "Dividing", "Comparing"]),
        correctId: at(3),
        rightTitle: "Exactly!",
        right: "Comparing: we see who is taller.",
        wrong: "We are not changing the heights. We are looking at the two.",
      }),
      quiz({
        line: "You have ₹500 and spend ₹100.",
        visual: ({ attempt }) => (
          <ValueCards
            replay={attempt}
            items={[
              { pic: P.money, label: "You have", value: "₹500" },
              { pic: P.money, label: "You spend", value: "₹100" },
            ]}
          />
        ),
        layout: "grid",
        options: neutral(["Adding", "Subtracting", "Dividing", "Comparing"]),
        correctId: at(1),
        rightTitle: "Exactly!",
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
        line: "We have all this information. Can we find the money left without doing anything with it?",
        visual: ({ attempt }) => (
          <ValueCards
            replay={attempt}
            items={[
              { pic: P.money, label: "Money available", value: "₹500" },
              { pic: P.notebook, label: "Book price", value: "₹150" },
              { pic: P.pen, label: "Pen price", value: "₹50" },
            ]}
          />
        ),
        layout: "grid",
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
        line: "First, what do the book and the pen cost together?",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.money, label: "Wallet", value: "₹500" },
                  { pic: P.notebook, label: "Book", value: "₹150" },
                  { pic: P.pen, label: "Pen", value: "₹50" },
                ]}
              />
            }
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
        line: "Now take that cost out of the wallet.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.money, label: "Wallet", value: "₹500" },
                  { pic: P.gift, label: "Bag", value: "₹200" },
                ]}
              />
            }
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
      {
        kind: "interaction",
        line: "In programming, these symbols are called operators. Tap each one.",
        render: (api) => (
          <SymbolStage
            api={api}
            groups={[
              {
                columns: 4,
                items: [
                  { id: "add", symbol: "+", title: "Combines values", example: "3 + 2" },
                  { id: "sub", symbol: "-", title: "Subtracts values", example: "5 - 2" },
                  { id: "mul", symbol: "*", title: "Multiplies values", example: "3 * 2" },
                  { id: "div", symbol: "/", title: "Divides values", example: "6 / 2" },
                ],
              },
            ]}
            footer={
              <div className="flex items-center gap-2 text-[14px] leading-5 font-bold text-[#444444] dark:text-white">
                <span className="rounded-lg bg-[#F1EEFF] px-2.5 py-1 dark:bg-[#2E2A5C]">Information</span>
                <span className="text-[#08A4AD]">→</span>
                <span className="rounded-lg bg-[#08A4AD] px-2.5 py-1 text-white">Operation</span>
                <span className="text-[#08A4AD]">→</span>
                <span className="rounded-lg bg-[#E3F6F3] px-2.5 py-1 dark:bg-[#0F2B28]">Result</span>
              </div>
            }
          />
        ),
        finishPanel: { title: "Operators!", text: "An operator tells a program what operation to perform on values." },
      },
    ],
  },

  // 6. Calculate or compare.
  [STEP.calcCompare]: {
    step: STEP.calcCompare,
    title: "Calculate *or Compare?*",
    stages: [
      {
        kind: "interaction",
        line: "A program does two big things with values. Tap both.",
        render: (api) => (
          <ScenesStage
            api={api}
            scenes={[
              { id: "calculate", pic: P.computer, label: "Calculate", caption: "How much? How many? What remains? 20 + 5 = 25" },
              { id: "compare", pic: P.light, label: "Compare", caption: "Which is greater? Are they equal? 20 > 5" },
            ]}
          />
        ),
        finishPanel: { title: "Two big jobs!", text: "Arithmetic operators calculate values. Comparison operators compare them." },
      },
      quiz({
        line: "Which job answers the question “Which is greater?”",
        layout: "grid",
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
        visual: ({ attempt, checked, correct }) => <WalletScene replay={attempt} amount={50} change={{ sign: "+", value: 30 }} showTotal={checked && correct} />,
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
        visual: ({ attempt, checked, correct }) => <WalletScene replay={attempt} amount={80} change={{ sign: "-", value: 20 }} showTotal={checked && correct} />,
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
        options: neutral(["Add (+)", "Subtract (-)", "Divide (/)"]),
        correctId: at(0),
        rightTitle: "Right!",
        right: "Addition combines values.",
        wrong: "You are getting more. Do the stickers join or go away?",
      }),
      quiz({
        line: "You have 9 sweets and eat 4. Which operation finds how many are left?",
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
      {
        kind: "interaction",
        line: "23 chocolates, 4 per group. Tap each symbol.",
        render: (api) => (
          <SymbolStage
            api={api}
            header={(current) => (
              <div className="flex flex-col items-center gap-1.5">
                <GroupsPicture total={23} size={4} />
                <ExprBig tokens={["23", current?.symbol ?? "?", "4"]} size={26} />
              </div>
            )}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "div", symbol: "/", title: "Ordinary division, with decimals", example: "23 / 4 = 5.75" },
                  { id: "floor", symbol: "//", title: "Floor division: complete groups", example: "23 // 4 = 5" },
                  { id: "mod", symbol: "%", title: "Modulus: the remainder", example: "23 % 4 = 3" },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Three answers!", text: "/ gives 5.75. // gives 5 complete groups. % gives the 3 left over." },
      },
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
