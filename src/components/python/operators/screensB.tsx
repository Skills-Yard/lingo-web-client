"use client";

import { MultiPickStage } from "@/components/kit/content/from-datatypes/interactions";
import { at, neutral, options, quiz, yesNo } from "@/components/kit/content/from-operators/helpers";
import { CompareHeader, GateHeader } from "@/components/kit/content/from-operators/headers";
import { ExpressionStage, StepStage, SymbolStage, sumOfProducts } from "@/components/kit/content/from-operators/interactions";
import { STEP } from "./operators";
import { P } from "@/components/kit/content/from-operators/pictures";
import type { ScreenDef } from "@/components/kit/content/from-operators/screen";
import { ExprBig, LineScale, SideBySide, ValueCards, Versus } from "@/components/kit/content/from-operators/visuals";

/** Screens 15-28 (phases 4 to 6: combining operators, then comparison). */
export const SCREENS_B: Readonly<Record<number, ScreenDef>> = {
  // 15. One problem, multiple operations.
  [STEP.bill]: {
    step: STEP.bill,
    title: "Can You Calculate the *Total Bill?*",
    stages: [
      {
        kind: "interaction",
        line: "Build the bill for 3 notebooks and 2 pens.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.notebook, label: "3 notebooks", value: "₹20 each" },
                  { pic: P.pen, label: "2 pens", value: "₹10 each" },
                ]}
              />
            }
            tokens={["3", "20", "2", "10", "*", "*", "+"]}
            accept={sumOfProducts(["3", "20"], ["2", "10"])}
            hint="Equal items are multiplied. Then the two totals are added."
            result="80"
          />
        ),
        finishPanel: { title: "₹80!", text: "3 * 20 + 2 * 10 = 80. Writing 20 + 20 + 20 + 10 + 10 gives 80 too." },
      },
      quiz({
        line: "Both ways give 80. What does the * do in 3 * 20?",
        options: neutral(["Finds the cost of equal items.", "Combines the two totals.", "Finds what is left."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Multiplication costs the equal items; addition combines the different totals.",
        wrong: "3 notebooks, each ₹20: what does that make?",
      }),
    ],
  },

  // 16. Does calculation order matter?
  [STEP.order]: {
    step: STEP.order,
    title: "Does Calculation *Order Matter?*",
    stages: [
      quiz({
        line: "Do both expressions give the same result?",
        visual: () => <SideBySide left={["2", "+", "3", "*", "4"]} right={["(", "2", "+", "3", ")", "*", "4"]} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "No!",
        right: "Same numbers, different results. Let's see how each is worked out.",
        wrong: "Look at the parentheses. Could they change what happens first?",
      }),
      {
        kind: "interaction",
        line: "Watch how 2 + 3 * 4 is worked out.",
        render: (api) => (
          <StepStage
            api={api}
            tokens={["2", "+", "3", "*", "4"]}
            steps={[
              { lit: [2, 3, 4], text: "First, 3 * 4 is picked out." },
              { lit: [2, 3, 4], text: "3 * 4 = 12." },
              { lit: [0, 1], text: "Then add 2: 2 + 12.", result: "14" },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "Now (2 + 3) * 4.",
        render: (api) => (
          <StepStage
            api={api}
            tokens={["(", "2", "+", "3", ")", "*", "4"]}
            steps={[
              { lit: [0, 1, 2, 3, 4], text: "First, the part inside the parentheses." },
              { lit: [1, 2, 3], text: "2 + 3 = 5." },
              { lit: [5, 6], text: "Then multiply 5 by 4.", result: "20" },
            ]}
          />
        ),
        finishPanel: { title: "14 and 20!", text: "Parentheses group values. They can change what is calculated first, and so the result." },
      },
    ],
  },

  // 17. Arrange the calculation.
  [STEP.arrange]: {
    step: STEP.arrange,
    title: "Arrange the *Calculation*",
    stages: [
      {
        kind: "interaction",
        line: "2 gift boxes at ₹50 each and 1 card at ₹20. Build the total.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.gift, label: "2 gift boxes", value: "₹50 each" },
                  { pic: P.notebook, label: "1 card", value: "₹20" },
                ]}
              />
            }
            tokens={["2", "50", "20", "*", "+", "(", ")"]}
            accept={[
              ["2", "*", "50", "+", "20"],
              ["50", "*", "2", "+", "20"],
              ["20", "+", "2", "*", "50"],
              ["20", "+", "50", "*", "2"],
            ]}
            hint="Two boxes of ₹50 are multiplied, then the card is added."
            result="120"
          />
        ),
        finishPanel: { title: "₹120!", text: "2 * 50 + 20 = 120." },
      },
      {
        kind: "interaction",
        line: "Now 2 bundles. Each bundle has a ₹50 box and a ₹20 card.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={
              <ValueCards
                items={[
                  { pic: P.gift, label: "Box", value: "₹50" },
                  { pic: P.notebook, label: "Card", value: "₹20" },
                  { pic: P.money, label: "Bundles", value: "2" },
                ]}
              />
            }
            tokens={["2", "50", "20", "*", "+", "(", ")"]}
            accept={[
              ["2", "*", "(", "50", "+", "20", ")"],
              ["2", "*", "(", "20", "+", "50", ")"],
              ["(", "50", "+", "20", ")", "*", "2"],
              ["(", "20", "+", "50", ")", "*", "2"],
            ]}
            hint="A bundle is a box plus a card. Group that first, then multiply by 2."
            result="140"
          />
        ),
        finishPanel: { title: "₹140!", text: "2 * (50 + 20) = 140." },
      },
      quiz({
        line: "The two expressions are different. Why?",
        options: neutral(["The second adds each bundle first, using ( ).", "They are really the same.", "The second one is written wrongly."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The grouping is different, so the parentheses go around the bundle's cost.",
        wrong: "In the second problem, what must be added before multiplying?",
      }),
    ],
  },

  // 18. Which calculation makes sense?
  [STEP.makesSense]: {
    step: STEP.makesSense,
    title: "Understand the *Situation!*",
    stages: [
      quiz({
        line: "A student has ₹200 and spends ₹75. Which expression finds what remains?",
        options: neutral(["200 + 75", "200 - 75", "200 * 75"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Spending takes money away: 200 - 75.",
        wrong: "Does the money grow, or go away?",
      }),
      quiz({
        line: "There are 6 boxes, each with 8 pencils. Which expression finds all the pencils?",
        options: neutral(["6 + 8", "6 // 8", "6 * 8"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "Equal boxes repeat: 6 * 8.",
        wrong: "Six equal groups of 8. Which operator repeats a group?",
      }),
      quiz({
        line: "17 chocolates shared among 5 students. Whole chocolates each?",
        options: neutral(["17 % 5", "17 // 5", "17 / 5"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "17 // 5 = 3 complete chocolates each.",
        wrong: "Which operator counts complete groups?",
      }),
      quiz({
        line: "Same 17 chocolates and 5 students. How many chocolates remain?",
        options: neutral(["17 // 5", "17 / 5", "17 % 5"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "17 % 5 = 2 remain. You chose by meaning, not just by symbol.",
        wrong: "Which operator gives the remainder?",
      }),
    ],
  },

  // 19. Who is older?
  [STEP.older]: {
    step: STEP.older,
    title: "Who Is *Older?*",
    stages: [
      quiz({
        line: "Is your teacher older than you?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.teacher, label: "Teacher", value: "35 years" }} right={{ pic: P.student, label: "Student", value: "13 years" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "Yes!",
        right: "“My teacher is older than me” is correct. So the statement is True.",
        wrong: "Compare the two ages on the cards.",
      }),
      quiz({
        line: "“My age is greater than my teacher's age.” Is that correct?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.teacher, label: "Teacher", value: "35 years" }} right={{ pic: P.student, label: "Student", value: "13 years" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "No!",
        right: "The statement is incorrect. So it is False. We compare things and decide if a statement is correct.",
        wrong: "Is 13 greater than 35?",
      }),
    ],
  },

  // 20. Is this statement true or false?
  [STEP.trueFalse]: {
    step: STEP.trueFalse,
    title: "True or *False?*",
    stages: [
      quiz({
        line: "My teacher is older than me.",
        question: "Is this statement correct?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.teacher, label: "Teacher", value: "35 years" }} right={{ pic: P.student, label: "Me", value: "13 years" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "True!",
        right: "Yes means the statement is True.",
        wrong: "Compare the ages on the cards.",
      }),
      quiz({
        line: "A bicycle is faster than a walking person.",
        question: "Is this statement correct?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.person, label: "Bicycle" }} right={{ pic: P.student, label: "Walking person" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "True!",
        right: "Yes → True.",
        wrong: "Think about how fast each one goes.",
      }),
      quiz({
        line: "A school bag is heavier than a pencil.",
        question: "Is this statement correct?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.bag, label: "School bag" }} right={{ pic: P.pen, label: "Pencil" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "True!",
        right: "Yes → True.",
        wrong: "Which one is harder to lift?",
      }),
      quiz({
        line: "A 5-metre rope is shorter than a 2-metre rope.",
        question: "Is this statement correct?",
        visual: ({ attempt }) => <Versus replay={attempt} left={{ pic: P.gift, label: "Rope", value: "5 m" }} right={{ pic: P.gift, label: "Rope", value: "2 m" }} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "False!",
        right: "No → False. True and False are Boolean values.",
        wrong: "Which number is smaller, 5 or 2?",
      }),
    ],
  },

  // 21. Let the computer compare.
  [STEP.computerCompares]: {
    step: STEP.computerCompares,
    title: "Let the Computer *Compare!*",
    stages: [
      {
        kind: "interaction",
        line: "A computer compares with symbols. Tap each one.",
        render: (api) => (
          <SymbolStage
            api={api}
            need={3}
            header={(current) => <CompareHeader current={current} fallback="35 > 13" />}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "gt", symbol: ">", title: "Greater than", example: "35 > 13", say: "Thirty-five is greater than thirteen.", result: true },
                  { id: "lt", symbol: "<", title: "Less than", example: "13 < 35", say: "Thirteen is less than thirty-five.", result: true },
                  { id: "eq", symbol: "==", title: "Equal to", example: "10 == 10", say: "Ten is equal to ten.", result: true },
                  { id: "ne", symbol: "!=", title: "Not equal to", example: "10 != 5", say: "Ten is not equal to five.", result: true },
                  { id: "ge", symbol: ">=", title: "Greater than or equal to", example: "35 >= 35", say: "Thirty-five is greater than or equal to thirty-five.", result: true },
                  { id: "le", symbol: "<=", title: "Less than or equal to", example: "13 <= 35", say: "Thirteen is less than or equal to thirty-five.", result: true },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Comparisons!", text: "Each symbol compares two values. The next screens explain them one by one." },
      },
    ],
  },

  // 22. Always read from left to right.
  [STEP.leftToRight]: {
    step: STEP.leftToRight,
    title: "Always Read *Left to Right*",
    stages: [
      {
        kind: "interaction",
        line: "First, look at the left side!",
        render: (api) => (
          <StepStage
            api={api}
            tokens={["8", ">", "5"]}
            steps={[
              { lit: [0], text: "Start with the number on the left: 8." },
              { lit: [1], text: "The side of the symbol touching 8 is open." },
              { lit: [0, 1, 2], text: "So the left number is greater: “Eight is greater than five.”" },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "Now a second example.",
        render: (api) => (
          <StepStage
            api={api}
            tokens={["5", "<", "8"]}
            steps={[
              { lit: [0], text: "Start with the number on the left: 5." },
              { lit: [1], text: "The side of the symbol touching 5 is closed." },
              { lit: [0, 1, 2], text: "So the left number is smaller: “Five is less than eight.”" },
            ]}
          />
        ),
        finishPanel: { title: "The rule", text: "Left side open: the left number is greater. Left side closed: the left number is smaller." },
      },
      quiz({
        line: "In 6 < 11 the left side is closed. What does that tell us?",
        visual: () => <ExprBig tokens={["6", "<", "11"]} size={40} />,
        options: neutral(["6 is smaller than 11.", "6 is greater than 11."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Left side closed: the left number is smaller.",
        wrong: "Start from the left number and look at the side touching it.",
      }),
    ],
  },

  // 23. Read what the expression says.
  [STEP.readExpression]: {
    step: STEP.readExpression,
    title: "Read What the *Expression Says*",
    stages: [
      quiz({
        line: "Read the complete expression. What does it say?",
        visual: () => <ExprBig tokens={["8", ">", "5"]} size={44} />,
        options: neutral(["Eight is greater than five.", "Eight is less than five.", "Five is greater than eight."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Every comparison says a statement: “Eight is greater than five.”",
        wrong: "Start with the number on the left, then the symbol.",
      }),
      quiz({
        line: "What does this one say?",
        visual: () => <ExprBig tokens={["5", "<", "8"]} size={44} />,
        options: neutral(["Five is less than eight.", "Five is greater than eight.", "Eight is less than five."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "“Five is less than eight.”",
        wrong: "Read it from left to right.",
      }),
      quiz({
        line: "And this one?",
        visual: () => <ExprBig tokens={["12", ">", "7"]} size={44} />,
        options: neutral(["Seven is greater than twelve.", "Twelve is greater than seven.", "Twelve is less than seven."]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "“Twelve is greater than seven.”",
        wrong: "Start with 12, the number on the left.",
      }),
      quiz({
        line: "Read this one.",
        visual: () => <ExprBig tokens={["4", "<", "9"]} size={44} />,
        options: neutral(["Four is less than nine.", "Four is greater than nine.", "Nine is less than four."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "“Four is less than nine.”",
        wrong: "Start with 4, the number on the left.",
      }),
      quiz({
        line: "Read this one.",
        visual: () => <ExprBig tokens={["15", ">", "10"]} size={44} />,
        options: neutral(["Fifteen is less than ten.", "Ten is greater than fifteen.", "Fifteen is greater than ten."]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "“Fifteen is greater than ten.”",
        wrong: "Start with 15, the number on the left.",
      }),
      quiz({
        line: "Read this one, even if it looks odd.",
        visual: () => <ExprBig tokens={["6", "<", "3"]} size={44} />,
        options: neutral(["Six is greater than three.", "Six is less than three.", "Three is less than six."]),
        correctId: at(1),
        rightTitle: "Well read!",
        right: "“Six is less than three.” Reading it is not deciding if it is True: this one is False.",
        wrong: "Read it as written, from the left. Do not decide yet if it is true.",
      }),
    ],
  },

  // 24. Convert words into symbols.
  [STEP.wordsToSymbols]: {
    step: STEP.wordsToSymbols,
    title: "Write What the *Sentence Says*",
    stages: [
      {
        kind: "interaction",
        line: "“Twenty is greater than ten.”",
        render: (api) => <ExpressionStage api={api} prompt="Build the expression for the sentence." tokens={["10", "20", ">", "<"]} accept={[["20", ">", "10"]]} hint="Start with the number the sentence starts with." result="True" />,
        finishPanel: { title: "That's right!", text: "20 > 10." },
      },
      {
        kind: "interaction",
        line: "“Five is less than twelve.”",
        render: (api) => <ExpressionStage api={api} prompt="Build the expression for the sentence." tokens={["12", "<", ">", "5"]} accept={[["5", "<", "12"]]} hint="Start with the number the sentence starts with." result="True" />,
        finishPanel: { title: "That's right!", text: "5 < 12." },
      },
      {
        kind: "interaction",
        line: "“Thirty is greater than twenty-five.”",
        render: (api) => <ExpressionStage api={api} prompt="Build the expression for the sentence." tokens={["25", ">", "30", "<"]} accept={[["30", ">", "25"]]} hint="Start with the number the sentence starts with." result="True" />,
        finishPanel: { title: "That's right!", text: "30 > 25." },
      },
      {
        kind: "interaction",
        line: "“Four is less than nine.”",
        render: (api) => <ExpressionStage api={api} prompt="Build the expression for the sentence." tokens={["<", "9", "4", ">"]} accept={[["4", "<", "9"]]} hint="Start with the number the sentence starts with." result="True" />,
        finishPanel: { title: "That's right!", text: "4 < 9." },
      },
      {
        kind: "interaction",
        line: "“Fifteen is less than eight.”",
        render: (api) => <ExpressionStage api={api} prompt="Build the expression for the sentence." tokens={["8", "15", "<", ">"]} accept={[["15", "<", "8"]]} hint="Start with the number the sentence starts with." result="False" />,
        finishPanel: { title: "Well written!", text: "15 < 8 matches the sentence, even though the statement is False. You can go both ways now." },
      },
    ],
  },

  // 25. Meet the six comparison operators.
  [STEP.sixOperators]: {
    step: STEP.sixOperators,
    title: "Six Ways to *Compare Values!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap each card: its meaning, an example and how it reads.",
        render: (api) => (
          <SymbolStage
            api={api}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "eq", symbol: "==", title: "Equal to", example: "10 == 10", say: "Ten is equal to ten.", result: true },
                  { id: "ne", symbol: "!=", title: "Not equal to", example: "10 != 5", say: "Ten is not equal to five.", result: true },
                  { id: "gt", symbol: ">", title: "Greater than", example: "10 > 5", say: "Ten is greater than five.", result: true },
                  { id: "lt", symbol: "<", title: "Less than", example: "5 < 10", say: "Five is less than ten.", result: true },
                  { id: "ge", symbol: ">=", title: "Greater than or equal to", example: "10 >= 10", say: "Ten is greater than or equal to ten.", result: true },
                  { id: "le", symbol: "<=", title: "Less than or equal to", example: "5 <= 10", say: "Five is less than or equal to ten.", result: true },
                ],
              },
            ]}
          />
        ),
        finishPanel: { title: "Six operators!", text: "Each symbol asks a different question about two values." },
      },
      quiz({
        line: "In Python, = gives a value a name. Which symbol checks if two values are equal?",
        options: neutral(["=", "==", "!="]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "== checks whether two values are equal. A single = is used for assignment.",
        wrong: "One of these asks “Is it equal?” and does not give a name.",
      }),
    ],
  },

  // 26. The number line challenge.
  [STEP.numberLine]: {
    step: STEP.numberLine,
    title: "The Number Line *Challenge*",
    stages: [
      {
        kind: "interaction",
        line: "Which number is greater, 8 or 5? Build the comparison.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={<LineScale marks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} picked={[8]} second={[5]} small />}
            tokens={["8", "5", ">", "<"]}
            accept={[
              ["8", ">", "5"],
              ["5", "<", "8"],
            ]}
            hint="The number farther to the right is the greater one."
            result="True"
          />
        ),
        finishPanel: { title: "Right!", text: "8 > 5: “Eight is greater than five.” The number farther right is greater." },
      },
      {
        kind: "interaction",
        line: "Now 3 and 7.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={<LineScale marks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} picked={[3]} second={[7]} small />}
            tokens={["3", "7", ">", "<"]}
            accept={[
              ["7", ">", "3"],
              ["3", "<", "7"],
            ]}
            hint="The number farther to the right is the greater one."
            result="True"
          />
        ),
        finishPanel: { title: "Right!", text: "3 < 7: “Three is less than seven.”" },
      },
      {
        kind: "interaction",
        line: "Now 9 and 2.",
        render: (api) => (
          <ExpressionStage
            api={api}
            lead={<LineScale marks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} picked={[9]} second={[2]} small />}
            tokens={["9", "2", ">", "<"]}
            accept={[
              ["9", ">", "2"],
              ["2", "<", "9"],
            ]}
            hint="The number farther to the right is the greater one."
            result="True"
          />
        ),
        finishPanel: { title: "Right!", text: "9 > 2: “Nine is greater than two.”" },
      },
      quiz({
        line: "Place the right symbol between 4 and 6.",
        visual: () => <LineScale marks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} picked={[4]} second={[6]} small />,
        question: "4 ? 6",
        layout: "grid",
        options: options([
          [">", P.order],
          ["<", P.actions],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "4 < 6. A number line is another way to compare: farther right is greater.",
        wrong: "Is 4 farther left or farther right than 6?",
      }),
    ],
  },

  // 27. At least 100 points.
  [STEP.atLeast]: {
    step: STEP.atLeast,
    title: "At Least *100 Points!*",
    stages: [
      {
        kind: "interaction",
        line: "A game needs at least 100 points to unlock a level. Tap each score.",
        render: (api) => (
          <SymbolStage
            api={api}
            header={(current) => <GateHeader marks={[99, 100, 101]} limit="Unlock at 100" current={current} card />}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "99", symbol: "99", title: "99 points: the gate stays shut.", result: false },
                  { id: "100", symbol: "100", title: "100 points: exactly enough.", result: true },
                  { id: "101", symbol: "101", title: "101 points: more than enough.", result: true },
                ],
              },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "score >= 100: “Score is greater than or equal to 100.” Tap the scores where it is True.",
        render: (api) => (
          <MultiPickStage
            api={api}
            columns={3}
            correct={["100", "101"]}
            hint="At least 100 includes 100 itself."
            items={[
              { id: "99", label: "99", sub: "99 >= 100" },
              { id: "100", label: "100", sub: "100 >= 100" },
              { id: "101", label: "101", sub: "101 >= 100" },
            ]}
          />
        ),
        finishPanel: { title: "At least!", text: "Greater than or equal to includes the boundary value itself." },
      },
    ],
  },

  // 28. Understanding the maximum limit.
  [STEP.maxLimit]: {
    step: STEP.maxLimit,
    title: "Understanding the *Maximum Limit*",
    stages: [
      {
        kind: "interaction",
        line: "A ride has a maximum height of 150 cm. Who can enter? Tap each height.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            header={(current) => <GateHeader marks={[145, 150, 155]} limit="Limit 150 cm" current={current} />}
            groups={[
              {
                columns: 3,
                items: [
                  { id: "145", symbol: "145", title: "145 cm: allowed.", result: true },
                  { id: "150", symbol: "150", title: "150 cm: allowed, exactly at the limit.", result: true },
                  { id: "155", symbol: "155", title: "155 cm: not allowed.", result: false },
                ],
              },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "height <= 150: “Height is less than or equal to 150.” Tap the heights where it is True.",
        render: (api) => (
          <MultiPickStage
            api={api}
            columns={3}
            correct={["145", "150"]}
            hint="The maximum value itself is allowed."
            items={[
              { id: "145", label: "145", sub: "145 <= 150" },
              { id: "150", label: "150", sub: "150 <= 150" },
              { id: "155", label: "155", sub: "155 <= 150" },
            ]}
          />
        ),
        finishPanel: { title: "Includes the limit!", text: "Less than or equal to includes the maximum value itself." },
      },
    ],
  },
};
