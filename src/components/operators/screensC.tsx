"use client";

import { at, neutral, quiz, trueFalse } from "./helpers";
import { ExpressionStage, OrderStage, SymbolStage, sumOfProducts } from "./interactions";
import { STEP } from "./operators";
import { P } from "./pictures";
import type { QuizStage, ScreenDef } from "./screen";
import { BillCard, CompareDemo, ExprBig, GateCard, TripFacts, ValueCards } from "./visuals";

/** Reads a question about an expression: Step 1 says it, Step 2 decides if it is True. */
const readThenEvaluate = (
  expression: readonly string[],
  sentences: readonly string[],
  readAt: number,
  understood: string,
  truth: boolean,
  evaluated: string,
): QuizStage[] => [
  quiz({
    line: "Step 1: read it. What does it say?",
    visual: () => <ExprBig tokens={expression} size={44} />,
    options: neutral(sentences),
    correctId: at(readAt),
    rightTitle: "Read right!",
    right: understood,
    wrong: "Read it from left to right: the left number, the symbol, then the right number.",
  }),
  quiz({
    line: "Step 2: is the statement True or False?",
    visual: () => <ExprBig tokens={expression} size={44} />,
    options: trueFalse(),
    correctId: at(truth ? 0 : 1),
    rightTitle: truth ? "True!" : "False!",
    right: evaluated,
    wrong: "Check the statement against the numbers.",
  }),
];

/** One operator as an answer: its symbol and what it does. */
const OP = {
  add: "+ Add",
  sub: "- Subtract",
  mul: "* Multiply",
  div: "/ Divide",
  floor: "// Whole groups",
  mod: "% Remainder",
  ge: ">= At least",
  eq: "== Equal to",
  lt: "< Below",
  gt: "> Greater than",
  le: "<= At most",
  ne: "!= Not equal",
} as const;

/** A "which operator?" question: the situation, four operators and the right one's place. */
const whichOperator = (line: string, choices: readonly string[], correct: number, right: string, wrong: string): QuizStage =>
  quiz({ line, layout: "grid", options: neutral(choices), correctId: at(correct), rightTitle: "Exactly!", right, wrong });

/** Screens 29-39 (comparison and Boolean, practice, debugging, transfer, reflection). */
export const SCREENS_C: Readonly<Record<number, ScreenDef>> = {
  // 29. A comparison produces an answer.
  [STEP.answer]: {
    step: STEP.answer,
    title: "A Comparison Produces *an Answer*",
    stages: [
      {
        kind: "interaction",
        line: "A game checks score >= 100. Test two scores.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            prompt="Tap each score."
            header={(current) => {
              if (!current) return <ExprBig tokens={["score", ">=", "100"]} size={30} />;
              const [left, symbol, right] = (current.example ?? "").split(" ");
              return <CompareDemo left={left} symbol={symbol} right={right} result={current.result ?? true} />;
            }}
            groups={[
              {
                columns: 2,
                items: [
                  { id: "120", symbol: "Score = 120", title: "Test the first score", example: "120 >= 100", say: "One hundred twenty is greater than or equal to one hundred.", result: true },
                  { id: "80", symbol: "Score = 80", title: "Test the second score", example: "80 >= 100", say: "Eighty is greater than or equal to one hundred.", result: false },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "True or False!", text: "A comparison doesn't return the bigger or smaller number. It returns a Boolean: True or False." },
      },
      quiz({
        line: "What does a comparison like 80 >= 100 give back?",
        options: neutral(["A Boolean: True or False.", "The bigger number.", "The smaller number."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Boolean is the data type for True/False information. A comparison can be read, understood and evaluated.",
        wrong: "Remember the Boolean data type from the last chapter.",
      }),
    ],
  },

  // 30. Read, understand and evaluate.
  [STEP.readEvaluate]: {
    step: STEP.readEvaluate,
    title: "Read, Understand *and Evaluate*",
    stages: [
      ...readThenEvaluate(["8", ">", "5"], ["Eight is greater than five.", "Eight is less than five.", "Five is greater than eight."], 0, "It says 8 is bigger than 5.", true, "8 is bigger than 5, so it is True."),
      ...readThenEvaluate(["4", ">", "9"], ["Four is greater than nine.", "Nine is greater than four.", "Four is less than nine."], 0, "It says 4 is bigger than 9.", false, "4 is not bigger than 9, so it is False."),
      ...readThenEvaluate(["10", "==", "10"], ["Ten is not equal to ten.", "Ten is equal to ten.", "Ten is less than ten."], 1, "It says both values are the same.", true, "Both values are the same, so it is True."),
      ...readThenEvaluate(
        ["15", "<=", "12"],
        ["Fifteen is less than or equal to twelve.", "Fifteen is greater than twelve.", "Twelve is less than or equal to fifteen."],
        0,
        "You can read it right even when it is False.",
        false,
        "15 is not less than or equal to 12, so it is False.",
      ),
    ],
  },

  // 31. Choose the right operation.
  [STEP.chooseOperation]: {
    step: STEP.chooseOperation,
    title: "Choose the *Right Operation*",
    stages: [
      whichOperator("Find the total price of two products.", [OP.add, OP.sub, OP.mul, OP.div], 0, "Adding combines the two prices.", "Which operator puts two values together?"),
      whichOperator("Find the balance left after spending money.", [OP.mul, OP.sub, OP.add, OP.div], 1, "Subtracting finds what remains.", "Spending takes money away."),
      whichOperator("Find the total chairs in 4 equal rows of 5.", [OP.add, OP.div, OP.mul, OP.sub], 2, "Equal rows repeat: multiply.", "Equal groups call for a shortcut."),
      whichOperator("Share 10 litres of juice among 4 friends. Find the exact amount each.", [OP.floor, OP.div, OP.mod, OP.mul], 1, "Ordinary division gives the exact share, 2.5.", "You want the exact amount, decimals included."),
      whichOperator("Share 17 chocolates among 5 students. Find the whole chocolates each.", [OP.div, OP.mod, OP.floor, OP.sub], 2, "Floor division gives complete groups: 3 each.", "Which operator counts complete groups?"),
      whichOperator("Find how many chocolates remain after forming complete groups.", [OP.floor, OP.mod, OP.div, OP.add], 1, "Modulus gives the remainder.", "Which operator gives what is left over?"),
      whichOperator("Check whether a score reaches 100.", [OP.lt, OP.ge, OP.eq, OP.add], 1, ">= includes 100 itself: “at least 100”.", "Reaching 100 means 100 or more."),
      whichOperator("Check whether two values are equal.", [OP.gt, OP.eq, OP.lt, OP.ne], 1, "== checks equality.", "Which one asks “Is it the same?”"),
      whichOperator("Check that a value is below a limit. The limit itself is not allowed.", [OP.le, OP.lt, OP.ge, OP.eq], 1, "< leaves the limit out. <= would allow it.", "Is the limit itself allowed?"),
    ],
  },

  // 32. Construct the expression.
  [STEP.construct]: {
    step: STEP.construct,
    title: "Construct the *Expression*",
    stages: [
      {
        kind: "interaction",
        line: "4 notebooks at ₹25, 3 pens at ₹10. They pay ₹150. Build the change.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.notebook, label: "4 notebooks", value: "₹25 each" },
                  { pic: P.pen, label: "3 pens", value: "₹10 each" },
                  { pic: P.money, label: "Pays", value: "₹150" },
                ]}
              />
            }
            tokens={["150", "4", "25", "3", "10", "*", "*", "+", "-", "(", ")"]}
            accept={sumOfProducts(["4", "25"], ["3", "10"]).map((inner) => ["150", "-", "(", ...inner, ")"])}
            hint="Total the notebooks and the pens first, in parentheses. Then take it from 150."
            result="20"
          />
        ),
        finishPanel: { title: "₹20 back!", text: "Notebooks 100 + pens 30 = 130. Then 150 - 130 = 20." },
      },
      quiz({
        line: "What if the student pays only ₹120? What is 120 - 130?",
        visual: () => <ExprBig tokens={["120", "-", "130"]} size={36} />,
        options: neutral(["10", "-10", "0"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "120 - 130 = -10. The student is ₹10 short: a shortfall, not money back.",
        wrong: "The student pays less than the bill. Which way is the difference?",
      }),
    ],
  },

  // 33. Create a shopping calculator.
  [STEP.calculator]: {
    step: STEP.calculator,
    title: "Create a *Shopping Calculator*",
    stages: [
      {
        kind: "interaction",
        line: "Put the shopping app's steps in order.",
        render: (api) => (
          <OrderStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.notebook, label: "Notebooks" },
                  { pic: P.pen, label: "Pens" },
                  { pic: P.gift, label: "Pencils" },
                ]}
              />
            }
            steps={[
              "Keep the price of each item.",
              "Ask how many of each item.",
              "Multiply price by quantity for each item.",
              "Add the three totals.",
              "Display the final bill.",
            ]}
            shown={[2, 4, 0, 3, 1]}
            hint="The app needs prices and quantities before it can calculate."
          />
        ),
        finishPanel: { title: "A working plan!", text: "Price * quantity for each item, then add the three totals." },
      },
      quiz({
        line: "How does the app find the cost of one kind of item?",
        options: neutral(["notebook_price * notebook_quantity", "notebook_price + notebook_quantity", "notebook_price - notebook_quantity"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Multiplication calculates repeated item costs. Addition combines the different totals.",
        wrong: "Several items, each with the same price: which operator?",
      }),
    ],
  },

  // 34. Build a budget checker.
  [STEP.budget]: {
    step: STEP.budget,
    title: "Build a *Budget Checker*",
    stages: [
      {
        kind: "interaction",
        line: "The student has ₹500. total_bill <= 500. Tap each bill to test it.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            prompt="Tap each bill."
            header={(current) => {
              if (!current) return <ExprBig tokens={["total_bill", "<=", "500"]} size={28} />;
              const [left, symbol, right] = (current.example ?? "").split(" ");
              return <CompareDemo left={left} symbol={symbol} right={right} result={current.result ?? true} />;
            }}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "450", symbol: "₹450", title: "Within the budget", example: "450 <= 500", result: true },
                  { id: "500", symbol: "₹500", title: "Exactly the budget", example: "500 <= 500", result: true },
                  { id: "550", symbol: "₹550", title: "Over the budget", example: "550 <= 500", result: false },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Calculate, then compare!", text: "Arithmetic calculates the bill. A comparison checks it against the budget." },
      },
      quiz({
        line: "Which kind of operator checks the bill against the budget?",
        options: neutral(["Comparison operators.", "Arithmetic operators.", "None of them."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The True or False result can later help a program allow or reject a purchase.",
        wrong: "We are not calculating a value here. We are checking it.",
      }),
    ],
  },

  // 35. The incorrect shopping bill.
  [STEP.wrongBill]: {
    step: STEP.wrongBill,
    title: "The Incorrect *Shopping Bill*",
    stages: [
      quiz({
        line: "3 notebooks at ₹20 and 2 pens at ₹10. The app shows ₹35. What is wrong?",
        visual: () => (
          <div className="flex flex-col items-center gap-2">
            <BillCard
              wrong
              total="₹35"
              lines={[
                ["3 notebooks at ₹20", ""],
                ["2 pens at ₹10", ""],
              ]}
            />
            <ExprBig tokens={["3", "+", "20", "+", "2", "+", "10"]} size={20} />
          </div>
        ),
        options: neutral(["The program should multiply quantities and prices.", "The program should subtract all prices.", "The program should compare quantities and prices."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "It must multiply each item's quantity by its price.",
        wrong: "Three notebooks at ₹20 each: what should the app do with 3 and 20?",
      }),
      {
        kind: "interaction",
        line: "Fix the bill.",
        render: (api) => (
          <ExpressionStage
            api={api}
            tokens={["3", "20", "2", "10", "*", "*", "+"]}
            accept={sumOfProducts(["3", "20"], ["2", "10"])}
            hint="Multiply each item's quantity by its price, then add the two totals."
            result="80"
          />
        ),
        finishPanel: { title: "Fixed: ₹80!", text: "3 * 20 + 2 * 10 = 80." },
      },
    ],
  },

  // 36. The boundary bug.
  [STEP.boundaryBug]: {
    step: STEP.boundaryBug,
    title: "The Boundary *Bug*",
    stages: [
      quiz({
        line: "“At least 100” unlocks a level. A score of 100 stays locked. Which fix?",
        visual: () => (
          <div className="flex flex-col items-center gap-2">
            <ExprBig tokens={["score", ">", "100"]} size={30} />
            <GateCard score={100} open={false} />
          </div>
        ),
        options: neutral(["score < 100", "score >= 100", "score != 100"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "score > 100 leaves out exactly 100. “At least 100” must include the boundary, so >=.",
        wrong: "Which expression is True for 100, 101 and more?",
      }),
    ],
  },

  // 37. Plan a class trip.
  [STEP.trip]: {
    step: STEP.trip,
    title: "Plan a *Class Trip*",
    stages: [
      quiz({
        line: "How many complete groups of 10 students can we form? 32 // 10 = ?",
        visual: () => <TripFacts />,
        options: neutral(["3", "3.2", "4"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "32 // 10 = 3 complete groups.",
        wrong: "// counts complete groups only.",
      }),
      quiz({
        line: "How many students remain? 32 % 10 = ?",
        visual: () => <TripFacts />,
        options: neutral(["2", "3", "10"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "32 % 10 = 2 students remain.",
        wrong: "% gives what is left after the complete groups.",
      }),
      quiz({
        line: "3 buses are not enough. How many buses are actually needed?",
        visual: () => <TripFacts />,
        options: neutral(["3", "4", "5"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "3 full groups plus 2 students left need a 4th bus.",
        wrong: "What happens to the 2 students who remain?",
      }),
      quiz({
        line: "Each bus costs ₹2,000. Which expression finds the cost of 4 buses?",
        visual: () => <TripFacts />,
        options: neutral(["4 + 2000", "4 * 2000", "4 // 2000"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "4 * 2000 = 8000.",
        wrong: "Four buses, each with the same cost.",
      }),
      quiz({
        line: "The budget is ₹7,000. What does 8000 <= 7000 give?",
        visual: () => <TripFacts />,
        options: trueFalse(),
        correctId: at(1),
        rightTitle: "False!",
        right: "The school needs ₹8,000 but has ₹7,000, so the trip can't be arranged within budget.",
        wrong: "Is 8000 less than or equal to 7000?",
      }),
    ],
  },

  // 38. Explain your thinking.
  [STEP.explain]: {
    step: STEP.explain,
    title: "Why Did You Choose *These Operations?*",
    stages: [
      quiz({
        line: "Why did we use floor division, 32 // 10?",
        options: neutral(["To find the complete groups of 10.", "To get a decimal answer.", "To find who is left over."]),
        correctId: at(0),
        rightTitle: "Well explained!",
        right: "// counts complete groups: 3 full buses.",
        wrong: "Which operation counts complete groups?",
      }),
      quiz({
        line: "Why did we use modulus, 32 % 10?",
        options: neutral(["To count the complete buses.", "To find how many students are left over.", "To work out the cost."]),
        correctId: at(1),
        rightTitle: "Well explained!",
        right: "% gives the remainder: 2 students left.",
        wrong: "Which operation gives what is left over?",
      }),
      quiz({
        line: "Why did we need an extra bus?",
        options: neutral(["Floor division rounds up.", "Buses cost more than ₹7,000.", "2 students remain without a seat."]),
        correctId: at(2),
        rightTitle: "Well explained!",
        right: "Two students remain, so the remainder needs a bus too.",
        wrong: "Think about the students who are left after 3 full buses.",
      }),
      quiz({
        line: "Why did we use multiplication for the total cost?",
        options: neutral(["We are sharing the cost.", "We are comparing costs.", "Every bus costs the same, so the cost repeats."]),
        correctId: at(2),
        rightTitle: "Well explained!",
        right: "Equal items repeat: 4 buses * ₹2,000.",
        wrong: "Four buses, each with the same cost: what repeats?",
      }),
      quiz({
        line: "Why did we use <= to compare the cost with the budget?",
        options: neutral(["Spending exactly the budget is still allowed.", "It finds the remainder.", "It divides the cost."]),
        correctId: at(0),
        rightTitle: "Well explained!",
        right: "<= includes the budget itself.",
        wrong: "Which operator asks “Is it within the limit?”",
      }),
      quiz({
        line: "How would the answer change if the budget were ₹8,000?",
        options: neutral(["It would stay False.", "8000 <= 8000 is True: the trip works.", "We would need another bus."]),
        correctId: at(1),
        rightTitle: "Well explained!",
        right: "The cost equals the budget, and <= allows that.",
        wrong: "Is 8000 less than or equal to 8000?",
      }),
    ],
  },

  // 39. Your operator toolkit.
  [STEP.toolkit]: {
    step: STEP.toolkit,
    title: "You Can Now *Make Values Work!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap an operator: its meaning, how it reads and an example.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            need={5}
            groups={[
              {
                title: "Arithmetic operators",
                columns: 4,
                items: [
                  { id: "add", symbol: "+", title: "Add values", example: "3 + 2 = 5", say: "Three plus two is five." },
                  { id: "sub", symbol: "-", title: "Subtract values", example: "5 - 2 = 3", say: "Five minus two is three." },
                  { id: "mul", symbol: "*", title: "Multiply values", example: "4 * 5 = 20", say: "Four times five is twenty." },
                  { id: "div", symbol: "/", title: "Ordinary division", example: "20 / 4 = 5.0", say: "Twenty divided by four is five point zero." },
                  { id: "floor", symbol: "//", title: "Floor division", example: "23 // 4 = 5", say: "Complete groups of four in twenty-three: five." },
                  { id: "mod", symbol: "%", title: "Find the remainder", example: "23 % 4 = 3", say: "Twenty-three leaves a remainder of three." },
                  { id: "pow", symbol: "**", title: "Raise to a power", example: "4 ** 2 = 16", say: "Four to the power of two is sixteen." },
                ],
              },
              {
                title: "Comparison operators",
                columns: 3,
                items: [
                  { id: "eq", symbol: "==", title: "Equal to", example: "10 == 10", say: "Ten is equal to ten.", result: true },
                  { id: "ne", symbol: "!=", title: "Not equal to", example: "10 != 5", say: "Ten is not equal to five.", result: true },
                  { id: "gt", symbol: ">", title: "Left value is greater", example: "10 > 5", say: "Ten is greater than five.", result: true },
                  { id: "lt", symbol: "<", title: "Left value is smaller", example: "5 < 10", say: "Five is less than ten.", result: true },
                  { id: "ge", symbol: ">=", title: "Greater than or equal to", example: "10 >= 10", say: "Ten is greater than or equal to ten.", result: true },
                  { id: "le", symbol: "<=", title: "Less than or equal to", example: "5 <= 10", say: "Five is less than or equal to ten.", result: true },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Your toolkit!", text: "You can calculate and compare values. Keep tapping to explore the rest." },
      },
    ],
  },
};
