"use client";

import { P } from "@/components/kit/content/from-operators/pictures";
import { STEP } from "./conditions";
import { ALL_ON, ANY_ON, at, build, Condition, eitherOrder, neutral, options, predict, quiz, testRows } from "@/components/kit/content/from-conditions/helpers";
import { RevealCards } from "@/components/kit/inputs/RevealCards";
import { ComboStage, TableStage } from "@/components/kit/content/from-conditions/interactions";
import type { ScreenDef } from "@/components/kit/content/from-conditions/screen";
import { RangeLine } from "@/components/kit/content/from-conditions/visuals";

/** The inclusive range 10 to 20, as the lines in the range screens draw it. */
const RANGE = { min: 5, max: 25, low: 10, high: 20 } as const;

/** Screens 13-26 (phases 3 to 5: mathematical conditions, and / or, ranges). */
export const SCREENS_B: Readonly<Record<number, ScreenDef>> = {
  // 13. How do we identify an even number?
  [STEP.evenIdea]: {
    step: STEP.evenIdea,
    title: "How Can We Spot an *Even Number?*",
    stages: [
      {
        kind: "interaction",
        line: "Share each number of objects into two equal groups. Tap a number.",
        render: (api) => <RevealCards look="share" api={api} numbers={[6, 8, 10, 7]} />,
      },
      quiz({
        line: "What is common among even numbers like 6, 8 and 10?",
        options: neutral(["They share into two equal groups with nothing left.", "They are all bigger than 5.", "They always leave one over."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Even numbers are completely divisible by 2. There is no remainder.",
        wrong: "Look at what happened to 6, 8 and 10, and then to 7.",
      }),
    ],
  },

  // 14. From division to remainder.
  [STEP.remainder]: {
    step: STEP.remainder,
    title: "How Do We Check *What Remains?*",
    stages: [
      predict({
        line: "% gives the remainder. Predict each remainder.",
        rows: [
          { label: "8 % 2", answer: "0" },
          { label: "10 % 2", answer: "0" },
          { label: "7 % 2", answer: "1" },
        ],
        choices: ["0", "1"],
        hint: "Share into groups of 2. What is left?",
        panel: { title: "Remainders!", text: "Even numbers leave a remainder of 0 when divided by 2." },
      }),
      build({
        line: "The remainder must be zero. First find it, then check it.",
        tokens: ["number", "%", "2", "==", "0", "!=", "1"],
        accept: [["number", "%", "2", "==", "0"]],
        hint: "First number % 2, then == 0.",
        panel: { title: "number % 2 == 0", text: "% 2 finds the remainder. == 0 checks that nothing remains." },
      }),
      predict({
        line: "Test it. Is number % 2 == 0 True?",
        header: <Condition text="number % 2 == 0" size={26} />,
        rows: testRows([12, 15, 18, 21], (value) => value % 2 === 0, (value) => `${value} % 2 == 0`),
        hint: "What remains when you divide by 2?",
        panel: { title: "Even!", text: "A number is even when its remainder after division by 2 is zero." },
      }),
    ],
  },

  // 15. How do we identify an odd number?
  [STEP.odd]: {
    step: STEP.odd,
    title: "What Happens When a Number Is *Odd?*",
    stages: [
      predict({
        line: "Share 7, then 9 objects into two groups. Predict each remainder.",
        rows: [
          { label: "7 % 2", answer: "1" },
          { label: "9 % 2", answer: "1" },
          { label: "8 % 2", answer: "0" },
        ],
        choices: ["0", "1"],
        hint: "Share into two groups. What is left?",
      }),
      build({
        line: "An odd number leaves a remainder that is not zero. Build it.",
        tokens: ["number", "%", "2", "!=", "0", "==", "1"],
        accept: [["number", "%", "2", "!=", "0"]],
        hint: "The remainder must not be zero: use !=.",
        panel: { title: "number % 2 != 0", text: "% 2 finds the remainder. != 0 checks that it is not zero." },
      }),
      predict({
        line: "Test it. Is number % 2 != 0 True?",
        header: <Condition text="number % 2 != 0" size={26} />,
        rows: testRows([7, 8, 11, 14, -5], (value) => value % 2 !== 0, (value) => `${value} % 2 != 0`),
        hint: "Does it leave a remainder when divided by 2?",
        panel: { title: "Odd!", text: "An odd integer has a nonzero remainder when divided by 2." },
      }),
    ],
  },

  // 16. Condition construction challenge.
  [STEP.challenge]: {
    step: STEP.challenge,
    title: "Can You Build the *Condition?*",
    stages: [
      build({
        line: "Check whether a number is divisible by 5.",
        tokens: ["number", "%", "5", "==", "0", "!="],
        accept: [["number", "%", "5", "==", "0"]],
        hint: "Divisible means no remainder: % first, then == 0.",
        prompt: "Hint: % finds the remainder, == checks equality.",
        panel: { title: "number % 5 == 0", text: "% 5 finds the remainder, and == 0 says nothing is left. So 5 divides the number." },
      }),
      build({
        line: "Check whether a number is not divisible by 3.",
        tokens: ["number", "%", "3", "!=", "0", "=="],
        accept: [["number", "%", "3", "!=", "0"]],
        hint: "Not divisible means something is left: % first, then != 0.",
        prompt: "Hint: % finds the remainder, != checks it is not zero.",
        panel: { title: "number % 3 != 0", text: "% 3 finds the remainder, and != 0 says something is left. So 3 doesn't divide it." },
      }),
      build({
        line: "Check whether a number is greater than 100.",
        tokens: ["number", "100", ">", "<", "==", ">=", "%", "2"],
        accept: [["number", ">", "100"]],
        hint: "Greater than means more than, and 100 itself is not included.",
        panel: { title: "number > 100", text: "> is used because the number must be bigger than 100. >= would let 100 in." },
      }),
      build({
        line: "Check whether a number is equal to 50.",
        tokens: ["number", "50", "==", "=", "!=", ">", "%", "2"],
        accept: [["number", "==", "50"]],
        hint: "Equal to compares two values: which symbol?",
        panel: { title: "number == 50", text: "== compares the number with 50. A single = would give a value a name instead." },
      }),
    ],
  },

  // 17. Two requirements at the same time.
  [STEP.twoRequirements]: {
    step: STEP.twoRequirements,
    title: "What If One Requirement *Is Not Enough?*",
    stages: [
      {
        kind: "interaction",
        line: "“I need ice cream AND pastry. Both.” Try each case.",
        render: (api) => (
          <ComboStage
            api={api}
            inputs={[
              { id: "ice", label: "Ice cream", pic: P.chocolate, on: "Available", off: "Not available" },
              { id: "pastry", label: "Pastry", pic: P.gift, on: "Available", off: "Not available" },
            ]}
            rule={ALL_ON}
            ask="Is my complete dessert order satisfied?"
            hint="I asked for both. Do I have both?"
            explain={(_, result) => (result ? "Both are here: satisfied." : "Something is missing: not satisfied.")}
          />
        ),
        finishPanel: { title: "Both needed!", text: "Both requirements must be satisfied." },
      },
    ],
  },

  // 18. Discovering AND.
  [STEP.andTable]: {
    step: STEP.andTable,
    title: "When Are *Both Requirements True?*",
    stages: [
      {
        kind: "interaction",
        line: "All four possibilities. Tap each row to see the order.",
        render: (api) => (
          <TableStage
            api={api}
            headers={["Ice cream", "Pastry", "Complete order?"]}
            rows={[
              ["True", "True", "True"],
              ["True", "False", "False"],
              ["False", "True", "False"],
              ["False", "False", "False"],
            ]}
            hidden={[2]}
          />
        ),
        finishPanel: { title: "AND!", text: "AND gives True only when both conditions are True." },
      },
      build({
        line: "Python's word for “both” is and. Build the condition.",
        tokens: ["ice_cream", "pastry", "and", "or", "not"],
        accept: [
          ["ice_cream", "and", "pastry"],
          ["pastry", "and", "ice_cream"],
        ],
        hint: "Both must be True: connect them with and.",
        panel: { title: "ice_cream and pastry", text: "and connects two conditions when both requirements must be satisfied." },
      }),
    ],
  },

  // 19. The Sunday extra class.
  [STEP.orClass]: {
    step: STEP.orClass,
    title: "When Is the *Extra Class On?*",
    stages: [
      {
        kind: "interaction",
        line: "“Extra class on Sunday if Anjali OR Ravi comes.” Try each case.",
        render: (api) => (
          <ComboStage
            api={api}
            inputs={[
              { id: "anjali", label: "Anjali", pic: P.student, on: "Comes", off: "Does not come" },
              { id: "ravi", label: "Ravi", pic: P.person, on: "Comes", off: "Does not come" },
            ]}
            rule={ANY_ON}
            ask="Can the extra class happen?"
            hint="The class needs just one of them. Is anyone coming?"
            explain={(_, result) => (result ? "At least one comes: the class happens." : "Nobody comes: no class.")}
          />
        ),
        finishPanel: { title: "Only one needed!", text: "Only one of the two needs to come for the requirement to be True." },
      },
    ],
  },

  // 20. Discovering OR.
  [STEP.orTable]: {
    step: STEP.orTable,
    title: "Does OR Need *Everyone?*",
    stages: [
      {
        kind: "interaction",
        line: "All four possibilities. Tap each row.",
        render: (api) => (
          <TableStage
            api={api}
            headers={["Anjali comes", "Ravi comes", "Extra class"]}
            rows={[
              ["True", "True", "True"],
              ["True", "False", "True"],
              ["False", "True", "True"],
              ["False", "False", "False"],
            ]}
            hidden={[2]}
          />
        ),
        finishPanel: { title: "OR!", text: "OR gives True when at least one condition is True." },
      },
      build({
        line: "Python's word for “at least one” is or. Build the condition.",
        tokens: ["anjali_comes", "ravi_comes", "or", "and", "not"],
        accept: [
          ["anjali_comes", "or", "ravi_comes"],
          ["ravi_comes", "or", "anjali_comes"],
        ],
        hint: "One is enough: connect them with or.",
        panel: { title: "anjali_comes or ravi_comes", text: "or connects conditions when at least one requirement must be satisfied." },
      }),
    ],
  },

  // 21. AND vs OR.
  [STEP.andVsOr]: {
    step: STEP.andVsOr,
    title: "One Word Changes *Everything!*",
    stages: [
      {
        kind: "interaction",
        line: "Same two conditions, two words. Tap each row.",
        render: (api) => (
          <TableStage
            api={api}
            headers={["First", "Second", "AND", "OR"]}
            rows={[
              ["True", "True", "True", "True"],
              ["True", "False", "False", "True"],
              ["False", "True", "False", "True"],
              ["False", "False", "False", "False"],
            ]}
            hidden={[2, 3]}
          />
        ),
        finishPanel: { title: "AND vs OR", text: "AND needs both True. OR needs at least one True." },
      },
      quiz({
        line: "“Both items are required.” Which operator fits?",
        layout: "grid",
        options: options([
          ["and", P.order],
          ["or", P.actions],
        ]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "and: both conditions must be True.",
        wrong: "Both must be satisfied, not just one.",
      }),
      quiz({
        line: "“Either one is enough.” Which operator fits?",
        layout: "grid",
        options: options([
          ["and", P.order],
          ["or", P.actions],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "or: at least one condition must be True.",
        wrong: "Only one needs to be satisfied.",
      }),
      quiz({
        line: "Ice cream: True. Pastry: False. The order still counts. Which operator?",
        layout: "grid",
        options: options([
          ["and", P.order],
          ["or", P.actions],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "or: one True condition is enough.",
        wrong: "With and, one False would break the order.",
      }),
    ],
  },

  // 22. A number between 10 and 20.
  [STEP.range]: {
    step: STEP.range,
    title: "Is a Number *in a Range?*",
    stages: [
      predict({
        line: "A score must be between 10 and 20, both included. Who qualifies?",
        header: <RangeLine {...RANGE} />,
        rows: [
          { label: "Score 8", answer: "No" },
          { label: "Score 12", answer: "Yes" },
          { label: "Score 19", answer: "Yes" },
          { label: "Score 10", answer: "Yes" },
          { label: "Score 20", answer: "Yes" },
        ],
        choices: ["Yes", "No"],
        hint: "Is it inside the highlighted range, ends included?",
        prompt: "Does it qualify?",
      }),
      quiz({
        line: "What two requirements must a valid score meet?",
        visual: () => <RangeLine {...RANGE} />,
        options: neutral(["At least 10 and at most 20.", "Less than 10 or more than 20.", "Equal to 10 and equal to 20."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A range needs two comparisons: at least 10, and at most 20.",
        wrong: "A valid score is not below 10 and not above 20.",
      }),
    ],
  },

  // 23. Both boundaries included.
  [STEP.inclusive]: {
    step: STEP.inclusive,
    title: "Both Boundaries *Included*",
    stages: [
      build({
        line: "Step 1: the lower boundary. The number must be at least 10.",
        tokens: ["number", "10", ">=", ">", "<="],
        accept: [["number", ">=", "10"]],
        hint: "At least 10 includes 10: which symbol?",
        panel: { title: "number >= 10", text: ">= includes the lower boundary." },
      }),
      build({
        line: "Step 2: the upper boundary. The number must be at most 20.",
        tokens: ["number", "20", "<=", "<", ">="],
        accept: [["number", "<=", "20"]],
        hint: "At most 20 includes 20: which symbol?",
        panel: { title: "number <= 20", text: "<= includes the upper boundary." },
      }),
      build({
        line: "Step 3: must both be True? Yes. Combine them.",
        tokens: ["number", "number", "10", "20", ">=", "<=", "and", "or"],
        accept: eitherOrder(["number", ">=", "10"], "and", ["number", "<=", "20"]),
        hint: "Both must be True: connect them with and.",
        panel: { title: "Both must be True", text: "and requires both comparisons to be True." },
      }),
      predict({
        line: "Test it. Is the condition True?",
        header: <Condition text="number >= 10 and number <= 20" size={20} />,
        rows: testRows([9, 10, 15, 20, 21], (value) => value >= 10 && value <= 20, (value) => `${value} >= 10 and ${value} <= 20`),
        hint: "Is it at least 10, and at most 20?",
        panel: { title: "Both included!", text: "Both 10 and 20 are included." },
      }),
    ],
  },

  // 24. First included, second excluded.
  [STEP.firstIncluded]: {
    step: STEP.firstIncluded,
    title: "What If *20 Is Not Allowed?*",
    stages: [
      predict({
        line: "At least 10 but less than 20. Which are acceptable?",
        header: <RangeLine {...RANGE} highOpen />,
        rows: [
          { label: "10", answer: "Yes" },
          { label: "15", answer: "Yes" },
          { label: "19", answer: "Yes" },
          { label: "20", answer: "No" },
        ],
        choices: ["Yes", "No"],
        hint: "At least 10 allows 10. Less than 20 does not allow 20.",
        prompt: "Is it acceptable?",
      }),
      build({
        line: "Build it: at least 10, and less than 20.",
        tokens: ["number", "number", "10", "20", ">=", "<", "and", "or"],
        accept: eitherOrder(["number", ">=", "10"], "and", ["number", "<", "20"]),
        hint: "Use >= for the first boundary and < for the second.",
        panel: { title: "number >= 10 and number < 20", text: "The exact words decide whether a boundary is included or excluded." },
      }),
    ],
  },

  // 25. Both boundaries excluded.
  [STEP.bothExcluded]: {
    step: STEP.bothExcluded,
    title: "What If *Neither Boundary Is Allowed?*",
    stages: [
      predict({
        line: "Greater than 10 and smaller than 20. Which are allowed?",
        header: <RangeLine {...RANGE} lowOpen highOpen />,
        rows: [
          { label: "10", answer: "No" },
          { label: "11", answer: "Yes" },
          { label: "19", answer: "Yes" },
          { label: "20", answer: "No" },
        ],
        choices: ["Yes", "No"],
        hint: "Greater than 10 leaves out 10. Smaller than 20 leaves out 20.",
        prompt: "Is it allowed?",
      }),
      build({
        line: "Build it: greater than 10, and smaller than 20.",
        tokens: ["number", "number", "10", "20", ">", "<", "and", "or"],
        accept: eitherOrder(["number", ">", "10"], "and", ["number", "<", "20"]),
        hint: "Use > and < so both boundaries stay out.",
        panel: { title: "number > 10 and number < 20", text: "> and < leave both boundaries out." },
      }),
      quiz({
        line: "“At least 10 and at most 20.” Which condition?",
        options: neutral(["number >= 10 and number <= 20", "number >= 10 and number < 20", "number > 10 and number < 20"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: ">= and <= include both boundaries.",
        wrong: "At least and at most both include their number.",
      }),
      quiz({
        line: "“At least 10 but less than 20.” Which condition?",
        options: neutral(["number > 10 and number < 20", "number >= 10 and number <= 20", "number >= 10 and number < 20"]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "The comparison symbols control whether the boundary values are included.",
        wrong: "10 is allowed, 20 is not.",
      }),
    ],
  },

  // 26. Outside a range.
  [STEP.outside]: {
    step: STEP.outside,
    title: "What If a Number Is *Outside 10 to 20?*",
    stages: [
      predict({
        line: "Accepted only if smaller than 10 OR greater than 20. Which are accepted?",
        header: <RangeLine {...RANGE} outside lowOpen highOpen />,
        rows: [
          { label: "5", answer: "Yes" },
          { label: "15", answer: "No" },
          { label: "25", answer: "Yes" },
          { label: "10", answer: "No" },
          { label: "20", answer: "No" },
        ],
        choices: ["Yes", "No"],
        hint: "Is it smaller than 10, or greater than 20?",
        prompt: "Is it accepted?",
      }),
      build({
        line: "Build it: smaller than 10, or greater than 20.",
        tokens: ["number", "number", "10", "20", "<", ">", "or", "and"],
        accept: eitherOrder(["number", "<", "10"], "or", ["number", ">", "20"]),
        hint: "A number can be outside on either side: use or.",
        panel: { title: "number < 10 or number > 20", text: "Each side is one comparison, joined by or." },
      }),
      quiz({
        line: "Why is OR the right word here?",
        options: neutral(["A number can be outside on either side.", "Both comparisons must be True.", "It makes the range wider."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Outside the range means being on the left or on the right.",
        wrong: "Can a number be smaller than 10 and greater than 20 at once?",
      }),
    ],
  },
};
