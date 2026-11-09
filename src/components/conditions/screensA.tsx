"use client";

import { OrderStage, ScenesStage } from "@/components/kit/content/from-operators/interactions";
import { P } from "@/components/kit/content/from-operators/pictures";
import { ValueCards } from "@/components/kit/content/from-operators/visuals";
import { STEP } from "./conditions";
import { at, build, Condition, neutral, predict, quiz, testRows, yesNo } from "@/components/kit/content/from-conditions/helpers";
import { PathStage, TableStage } from "@/components/kit/content/from-conditions/interactions";
import type { ScreenDef } from "@/components/kit/content/from-conditions/screen";
import { CheckFlow, ResultCards, ZeroLine } from "@/components/kit/content/from-conditions/visuals";

const MARKS = { pic: P.student, label: "Student's marks", value: "85" };

/** Screens 1-12 (phases 1 and 2: why conditions exist, building conditions with numbers). */
export const SCREENS_A: Readonly<Record<number, ScreenDef>> = {
  // 1. Why does a program need to check something?
  [STEP.why]: {
    step: STEP.why,
    title: "How Does a Computer *Know It's Correct?*",
    stages: [
      quiz({
        line: "A student scored 85. The pass mark is 40. Is 85 alone enough to tell?",
        visual: ({ attempt }) => <ValueCards replay={attempt} items={[MARKS]} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "No. Knowing the marks alone is not enough.",
        wrong: "Does 85 say anything about the pass mark?",
      }),
      quiz({
        line: "What else do we need to know?",
        visual: ({ attempt }) => <ValueCards replay={attempt} items={[MARKS]} />,
        options: neutral(["The passing requirement.", "The student's name.", "The school's name."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The passing requirement: 40 marks.",
        wrong: "What do we compare the marks with?",
      }),
      quiz({
        line: "Now what should the computer check?",
        visual: ({ attempt }) => <ValueCards replay={attempt} items={[MARKS, { pic: P.notebook, label: "Passing marks", value: "40" }]} />,
        options: neutral(["Whether the marks are at least 40.", "Whether the marks are exactly 85.", "Whether the marks are below 40."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "It checks the marks against the requirement.",
        wrong: "The requirement is the passing mark.",
      }),
      predict({
        line: "Change the marks. Is the passing requirement satisfied?",
        header: <Condition text="marks >= 40" />,
        rows: testRows([25, 39, 40, 85], (value) => value >= 40, (value) => `${value} >= 40`),
        hint: "Is the marks at least 40?",
        panel: { title: "Checked!", text: "A program often checks information against a requirement to see if it is satisfied." },
      }),
    ],
  },

  // 2. What is a condition?
  [STEP.whatIs]: {
    step: STEP.whatIs,
    title: "A Condition Is *Something We Check*",
    stages: [
      {
        kind: "interaction",
        line: "Each question asks us to check something. Tap each one.",
        render: (api) => (
          <ScenesStage
            api={api}
            prompt="Tap each question."
            scenes={[
              { id: "positive", pic: P.question, label: "Is the number positive?", caption: "Whether the number is greater than zero." },
              { id: "age", pic: P.question, label: "Is age at least 18?", caption: "Whether age is 18 or greater." },
              { id: "even", pic: P.question, label: "Is the number even?", caption: "Whether the remainder after dividing by 2 is zero." },
              { id: "verified", pic: P.question, label: "Is the account verified?", caption: "Whether the verification status is True." },
            ]}
          />
        ),
        finishPanel: { title: "Things we can check!", text: "Each question can be answered as correct or incorrect." },
      },
      quiz({
        line: "In programming, what is a condition?",
        visual: ({ attempt }) => <CheckFlow replay={attempt} question="Is age at least 18?" />,
        options: neutral(["An expression that is True or False.", "A number stored in a program.", "A name for a value."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A condition checks whether a statement or requirement is True or False.",
        wrong: "A condition is something we can check, and the check gives an answer.",
      }),
    ],
  },

  // 3. Why True or False?
  [STEP.trueFalse]: {
    step: STEP.trueFalse,
    title: "Can a Statement Be *True and False?*",
    stages: [
      {
        kind: "interaction",
        line: "Evaluate each question. Tap a row.",
        render: (api) => (
          <TableStage
            api={api}
            header={<ResultCards />}
            headers={["Question", "Answer"]}
            rows={[
              ["Is 10 greater than 5?", "True"],
              ["Is 3 equal to 7?", "False"],
              ["Is 15 less than 20?", "True"],
            ]}
            hidden={[1]}
          />
        ),
        finishPanel: { title: "One result!", text: "A condition gives one Boolean result. It can't be True and False at once." },
      },
      predict({
        line: "Three new questions. Predict each result.",
        rows: [
          { label: "Is 12 greater than 20?", answer: "False" },
          { label: "Is 9 equal to 9?", answer: "True" },
          { label: "Is 2 less than 1?", answer: "False" },
        ],
        hint: "Is the statement correct?",
        panel: { title: "True or False!", text: "Conditions are evaluated as Boolean results: True or False." },
      }),
    ],
  },

  // 4. Information vs condition.
  [STEP.infoVsCondition]: {
    step: STEP.infoVsCondition,
    title: "Information Is Not *a Condition*",
    stages: [
      {
        kind: "interaction",
        line: "Information tells us what we have. Tap each to see a check we could ask.",
        render: (api) => (
          <ScenesStage
            api={api}
            prompt="Tap each card."
            scenes={[
              { id: "marks", pic: P.notebook, label: "Marks = 85", caption: "Are marks at least 40?" },
              { id: "age", pic: P.student, label: "Age = 17", caption: "Is age at least 18?" },
              { id: "number", pic: P.chair, label: "Number = 12", caption: "Is the number even?" },
              { id: "account", pic: P.computer, label: "Account = Active", caption: "Is the account active?" },
            ]}
          />
        ),
      },
      quiz({
        line: "Does age = 17 check a requirement?",
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "No. It only tells us what we have. age >= 18 would check a requirement.",
        wrong: "Does it ask a question, or just state a value?",
      }),
      quiz({
        line: "What is the difference between information and a condition?",
        options: neutral(["Information tells what we have; a condition checks a requirement.", "They are the same thing.", "A condition stores a number."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A condition checks whether information satisfies a requirement.",
        wrong: "One of them stores a value, and the other asks a question about it.",
      }),
    ],
  },

  // 5. How do we create a condition?
  [STEP.construct]: {
    step: STEP.construct,
    title: "A Condition Is *Constructed*",
    stages: [
      {
        kind: "interaction",
        line: "A condition is built step by step, not memorised. Follow the path.",
        render: (api) => (
          <PathStage
            api={api}
            steps={[
              { title: "Identify what to check", text: "Is a number positive?" },
              { title: "Understand the meaning", text: "What makes a number positive?" },
              { title: "Find the relationship", text: "A positive number is greater than zero." },
              { title: "Pick the operator", text: "Greater than is >." },
              { title: "Say it in words", text: "The number must be greater than zero." },
              { title: "Translate into Python", text: "number > 0", code: true },
              { title: "Test it", text: "Try positive, negative and zero." },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "Check whether a number is greater than 5. Put the steps in order.",
        render: (api) => (
          <OrderStage
            api={api}
            steps={[
              "Identify what to check.",
              "Understand what the requirement means.",
              "Find the relationship: greater than 5.",
              "Pick the operator: >.",
              "Say it in words.",
              "Translate it into Python: number > 5.",
              "Test it with values.",
            ]}
            shown={[3, 0, 5, 2, 6, 1, 4]}
            hint="Understand the requirement first. The Python comes near the end."
          />
        ),
        finishPanel: { title: "Understand first!", text: "We understand the requirement, then build its Python." },
      },
    ],
  },

  // 6. What is a positive number?
  [STEP.positiveMeaning]: {
    step: STEP.positiveMeaning,
    title: "What Makes a Number *Positive?*",
    stages: [
      quiz({
        line: "1, 2, 3, 4, 5 are positive numbers. Where are they compared with zero?",
        visual: () => <ZeroLine side="positive" />,
        options: neutral(["After zero, on the right.", "Before zero, on the left.", "They are zero."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "All positive numbers appear after zero on the number line.",
        wrong: "Look at the number line. Which side of zero are they on?",
      }),
    ],
  },

  // 7. The positive-number condition.
  [STEP.positiveCondition]: {
    step: STEP.positiveCondition,
    title: "The Positive-Number *Condition*",
    stages: [
      quiz({
        line: "Numbers to the right of zero are greater than zero. So a positive number must be…",
        visual: () => <ZeroLine side="positive" />,
        options: neutral(["Greater than zero.", "Less than zero.", "Equal to zero."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "A positive number is greater than zero.",
        wrong: "Positive numbers come after zero.",
      }),
      build({
        line: "The number must be greater than zero. Build it in Python.",
        tokens: ["number", "0", ">", "<", "=="],
        accept: [["number", ">", "0"]],
        hint: "Greater than zero: which symbol?",
        panel: { title: "number > 0", text: "> means greater than, because the number must be greater than zero." },
      }),
      predict({
        line: "Test it. Is number > 0 True?",
        header: <Condition text="number > 0" />,
        rows: testRows([8, 2, 0, -5], (value) => value > 0, (value) => `${value} > 0`),
        hint: "Is the number greater than zero?",
        panel: { title: "Zero is neither!", text: "Zero is neither positive nor negative." },
      }),
    ],
  },

  // 8. What is a negative number?
  [STEP.negative]: {
    step: STEP.negative,
    title: "What Makes a Number *Negative?*",
    stages: [
      quiz({
        line: "-1, -2, -3… are on the left of zero. How do they compare with zero?",
        visual: () => <ZeroLine side="negative" />,
        options: neutral(["They are smaller than zero.", "They are greater than zero.", "They are equal to zero."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Negative numbers are smaller than zero.",
        wrong: "They come before zero on the number line.",
      }),
      build({
        line: "The number must be less than zero. Build it in Python.",
        tokens: ["number", "0", "<", ">", "=="],
        accept: [["number", "<", "0"]],
        hint: "Smaller than zero: which symbol?",
        panel: { title: "number < 0", text: "< means less than, because the number must be smaller than zero." },
      }),
      predict({
        line: "Test it. Is number < 0 True?",
        header: <Condition text="number < 0" />,
        rows: testRows([-8, -1, 0, 5], (value) => value < 0, (value) => `${value} < 0`),
        hint: "Is the number smaller than zero?",
      }),
    ],
  },

  // 9. Is the number equal to 7?
  [STEP.equal]: {
    step: STEP.equal,
    title: "Is the Number *Equal to 7?*",
    stages: [
      quiz({
        line: "We want exactly 7. Is 8 acceptable?",
        visual: ({ attempt }) => <ValueCards replay={attempt} items={[{ pic: P.question, label: "We want", value: "exactly 7" }]} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Only 7 is exactly equal to 7.",
        wrong: "We don't want a number greater or smaller than 7.",
      }),
      build({
        line: "The number must be equal to 7. Build it in Python.",
        tokens: ["number", "7", "==", "=", "!="],
        accept: [["number", "==", "7"]],
        hint: "Exactly equal: use ==, not a single =.",
        panel: { title: "number == 7", text: "== checks equality. A single = is for assignment, not for comparing." },
      }),
      predict({
        line: "Test it. Is number == 7 True?",
        header: <Condition text="number == 7" />,
        rows: testRows([7, 8, 6, -7], (value) => value === 7, (value) => `${value} == 7`),
        hint: "Is the number exactly 7?",
        panel: { title: "Only 7!", text: "The condition is True only when the number is exactly 7." },
      }),
    ],
  },

  // 10. Is the number not equal to 7?
  [STEP.notEqual]: {
    step: STEP.notEqual,
    title: "What About *Every Number Except 7?*",
    stages: [
      quiz({
        line: "A game accepts every number except 7. Is 7 acceptable?",
        visual: ({ attempt }) => <ValueCards replay={attempt} items={[{ pic: P.stop, label: "Not allowed", value: "7" }]} />,
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "Every number except 7 is fine. 7 is rejected.",
        wrong: "The game accepts every number except 7.",
      }),
      build({
        line: "The number must be different from 7. Build it in Python.",
        tokens: ["number", "7", "!=", "==", "<"],
        accept: [["number", "!=", "7"]],
        hint: "Different from 7: which symbol?",
        panel: { title: "number != 7", text: "!= means not equal to. It checks that two values are different." },
      }),
      predict({
        line: "Test it. Is number != 7 True?",
        header: <Condition text="number != 7" />,
        rows: testRows([5, 7, 8, 0], (value) => value !== 7, (value) => `${value} != 7`),
        hint: "Is the number different from 7?",
        panel: { title: "Not 7!", text: "The condition is True whenever the number is different from 7." },
      }),
    ],
  },

  // 11. At least 10.
  [STEP.atLeast]: {
    step: STEP.atLeast,
    title: "What Does “At Least 10” *Mean?*",
    stages: [
      predict({
        line: "A competition needs a score of at least 10. Who can qualify?",
        header: <ValueCards items={[{ pic: P.game, label: "Minimum score", value: "10" }]} />,
        rows: [
          { label: "Score 8", answer: "No" },
          { label: "Score 9", answer: "No" },
          { label: "Score 10", answer: "Yes" },
          { label: "Score 11", answer: "Yes" },
        ],
        choices: ["Yes", "No"],
        hint: "At least 10 means 10 or more.",
        prompt: "Can they qualify?",
      }),
      build({
        line: "The score must be greater than or equal to 10. Build it.",
        tokens: ["number", "10", ">=", ">", "=="],
        accept: [["number", ">=", "10"]],
        hint: "At least includes 10: which symbol?",
        panel: { title: "number >= 10", text: ">= combines greater than and equal to." },
      }),
      predict({
        line: "Boundary test. Is number >= 10 True?",
        header: <Condition text="number >= 10" />,
        rows: testRows([9, 10, 11], (value) => value >= 10, (value) => `${value} >= 10`),
        hint: "Is the number 10 or more?",
        panel: { title: "Boundary included!", text: "At least means the minimum boundary is included." },
      }),
    ],
  },

  // 12. At most 10.
  [STEP.atMost]: {
    step: STEP.atMost,
    title: "What Does “At Most 10” *Mean?*",
    stages: [
      predict({
        line: "A bag holds at most 10 chocolates. Which amounts fit?",
        header: <ValueCards items={[{ pic: P.chocolate, label: "Bag holds at most", value: "10" }]} />,
        rows: [
          { label: "8 chocolates", answer: "Yes" },
          { label: "9 chocolates", answer: "Yes" },
          { label: "10 chocolates", answer: "Yes" },
          { label: "11 chocolates", answer: "No" },
        ],
        choices: ["Yes", "No"],
        hint: "At most 10 means 10 or fewer.",
        prompt: "Can the bag hold it?",
      }),
      build({
        line: "The number must be less than or equal to 10. Build it.",
        tokens: ["number", "10", "<=", "<", "=="],
        accept: [["number", "<=", "10"]],
        hint: "At most includes 10: which symbol?",
        panel: { title: "number <= 10", text: "<= means less than or equal to." },
      }),
      predict({
        line: "Boundary test. Is number <= 10 True?",
        header: <Condition text="number <= 10" />,
        rows: testRows([9, 10, 11], (value) => value <= 10, (value) => `${value} <= 10`),
        hint: "Is the number 10 or fewer?",
        panel: { title: "Boundary included!", text: "At most means the maximum boundary is included." },
      }),
    ],
  },
};
