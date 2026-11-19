"use client";

import { RevealCards } from "@/components/kit/inputs/RevealCards";
import { SymbolStage } from "@/components/kit/content/from-operators/interactions";
import { P } from "@/components/kit/content/from-operators/pictures";
import { ValueCards } from "@/components/kit/content/from-operators/visuals";
import { STEP } from "./conditions";
import { at, build, Condition, eitherOrder, FIRST_OFF, neutral, predict, quiz, testRows, trueFalse, yesNo } from "@/components/kit/content/from-conditions/helpers";
import { ComboStage, TableStage } from "@/components/kit/content/from-conditions/interactions";
import type { ScreenDef } from "@/components/kit/content/from-conditions/screen";

/** `age >= 18`-style tests where the case is written out as words. */
const cases = (rows: readonly (readonly [string, boolean])[]) => rows.map(([label, yes]) => ({ label, answer: yes ? "Yes" : "No" }));

/** Screens 27-37 (phases 6 to 9: not, complex conditions, debugging, the challenge, the toolkit). */
export const SCREENS_C: Readonly<Record<number, ScreenDef>> = {
  // 27. Reversing a statement.
  [STEP.reverse]: {
    step: STEP.reverse,
    title: "What Happens When We *Reverse a Statement?*",
    stages: [
      {
        kind: "interaction",
        line: "Switch the statement between True and False. What does the reversed one become?",
        render: (api) => (
          <ComboStage
            api={api}
            inputs={[{ id: "ravi", label: "Ravi will come to class", pic: P.student, on: "True", off: "False" }]}
            rule={FIRST_OFF}
            ask="“Ravi will NOT come to class.” Is this True?"
            yes="True"
            no="False"
            hint="Flip it: if the first statement is True, the reversed one is…?"
            explain={(_, result) => (result ? "The reversed statement is True." : "The reversed statement is False.")}
          />
        ),
        finishPanel: { title: "NOT reverses!", text: "NOT reverses a Boolean result." },
      },
    ],
  },

  // 28. Introducing NOT.
  [STEP.notPython]: {
    step: STEP.notPython,
    title: "How Do We Reverse *a Condition?*",
    stages: [
      build({
        line: "Python reverses with the word not. Build: not ravi_comes.",
        tokens: ["ravi_comes", "not", "and", "or"],
        accept: [["not", "ravi_comes"]],
        hint: "Put not before the condition it reverses.",
        panel: { title: "not ravi_comes", text: "If ravi_comes is True, the whole expression is False. If it is False, the expression is True." },
      }),
      {
        kind: "interaction",
        line: "The truth table for not. Tap each row.",
        render: (api) => (
          <TableStage
            api={api}
            headers={["Condition", "NOT condition"]}
            rows={[
              ["True", "False"],
              ["False", "True"],
            ]}
            hidden={[1]}
          />
        ),
        finishPanel: { title: "NOT!", text: "The not operator reverses the Boolean result of the expression after it." },
      },
    ],
  },

  // 29. NOT with a comparison.
  [STEP.notComparison]: {
    step: STEP.notComparison,
    title: "What If a Number Is *NOT Greater Than 10?*",
    stages: [
      quiz({
        line: "15 > 10 is True. What does not (15 > 10) give?",
        visual: () => <Condition text="not (15 > 10)" size={32} />,
        options: trueFalse(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "False. not reverses the result of 15 > 10.",
        wrong: "First find 15 > 10, then reverse it.",
      }),
      predict({
        line: "Test it. Is not (number > 10) True?",
        header: <Condition text="not (number > 10)" size={26} />,
        rows: testRows([15, 8, 10], (value) => !(value > 10), (value) => `not (${value} > 10)`),
        hint: "First find number > 10, then reverse the result.",
      }),
      build({
        line: "Build it: not, then the comparison in parentheses.",
        tokens: ["not", "(", "number", ">", "10", ")", "<", "and"],
        accept: [["not", "(", "number", ">", "10", ")"]],
        hint: "Put the comparison in parentheses, with not in front.",
        panel: { title: "not (number > 10)", text: "The parentheses group the comparison so not applies to all of it. != checks inequality directly; not reverses another condition." },
      }),
    ],
  },

  // 30. Two different requirements.
  [STEP.marksAttendance]: {
    step: STEP.marksAttendance,
    title: "Can One Condition Hold *Two Requirements?*",
    stages: [
      quiz({
        line: "Marks at least 40 AND attendance at least 75. Must both be met?",
        visual: ({ attempt }) =>
          <ValueCards
            replay={attempt}
            items={[
              { pic: P.notebook, label: "Marks", value: "at least 40" },
              { pic: P.student, label: "Attendance", value: "at least 75" },
            ]}
          />,
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Yes. There are two requirements, and both are needed.",
        wrong: "It says AND. Does one requirement alone do?",
      }),
      build({
        line: "Build each requirement, then connect them.",
        tokens: ["marks", "attendance", "40", "75", ">=", ">=", "and", "or"],
        accept: eitherOrder(["marks", ">=", "40"], "and", ["attendance", ">=", "75"]),
        hint: "Both must be True: connect them with and.",
        panel: { title: "Smaller parts!", text: "marks >= 40 and attendance >= 75. A complex condition connects smaller conditions." },
      }),
      predict({
        line: "Does each student qualify?",
        rows: cases([
          ["Marks 50, attendance 80", true],
          ["Marks 50, attendance 60", false],
          ["Marks 30, attendance 90", false],
        ]),
        choices: ["Yes", "No"],
        hint: "Both requirements must be met.",
        prompt: "Do they qualify?",
      }),
    ],
  },

  // 31. Alternative requirements using OR.
  [STEP.alternatives]: {
    step: STEP.alternatives,
    title: "What If *Either One Is Enough?*",
    stages: [
      quiz({
        line: "Reward if the score is exactly 100 OR all bonus tasks are done. Must both happen?",
        layout: "grid",
        options: yesNo(),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "No. Either one is enough.",
        wrong: "It says OR. Is one enough?",
      }),
      build({
        line: "Build it: score exactly 100, or the bonus tasks done.",
        tokens: ["score", "100", "==", "bonus_tasks_completed", "or", "and", "!="],
        accept: eitherOrder(["score", "==", "100"], "or", ["bonus_tasks_completed"]),
        hint: "Either is enough: connect them with or.",
        panel: { title: "Alternatives!", text: "score == 100 or bonus_tasks_completed. or can join different kinds of conditions, not just comparisons." },
      }),
      predict({
        line: "Does the student get the reward?",
        rows: cases([
          ["Score 100, bonus not done", true],
          ["Score 80, all bonus done", true],
          ["Score 100, all bonus done", true],
          ["Score 80, bonus not done", false],
        ]),
        choices: ["Yes", "No"],
        hint: "One True requirement is enough.",
        prompt: "Do they get it?",
      }),
    ],
  },

  // 32. Combining AND and OR.
  [STEP.groups]: {
    step: STEP.groups,
    title: "What If a Requirement Has *Groups?*",
    stages: [
      build({
        line: "Age 10 to 20, inclusive, OR special permission. Group the age part.",
        tokens: ["(", "age", ">=", "10", "and", "age", "<=", "20", ")", "or", "special_permission", "not"],
        accept: [
          ["(", "age", ">=", "10", "and", "age", "<=", "20", ")", "or", "special_permission"],
          ["special_permission", "or", "(", "age", ">=", "10", "and", "age", "<=", "20", ")"],
        ],
        hint: "The age range goes in parentheses, then or special_permission.",
        panel: { title: "Groups!", text: "The parentheses group the two age requirements. That group is then joined to special_permission with or." },
      }),
      predict({
        line: "Test different combinations. Does the student qualify?",
        rows: cases([
          ["Age 15, no permission", true],
          ["Age 25, permission", true],
          ["Age 25, no permission", false],
          ["Age 8, permission", true],
        ]),
        choices: ["Yes", "No"],
        hint: "Is the age in range, or is there permission?",
        prompt: "Do they qualify?",
        panel: { title: "Organised!", text: "Parentheses help organise complex conditions into meaningful groups." },
      }),
    ],
  },

  // 33. Understanding a complex requirement.
  [STEP.workshop]: {
    step: STEP.workshop,
    title: "Can You Translate *This Requirement?*",
    stages: [
      quiz({
        line: "Age 15 to 20 AND registered, OR special permission. Which go together?",
        options: neutral(["Age 15 to 20 and registration.", "Registration and special permission.", "Age 15 to 20 and special permission."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Age and registration must be met together. Special permission is a separate alternative.",
        wrong: "Which two parts are joined by AND?",
      }),
      build({
        line: "Build the whole condition. Group what must be True together.",
        tokens: ["(", "age", ">=", "15", "and", "age", "<=", "20", "and", "registered", ")", "or", "special_permission"],
        accept: [
          ["(", "age", ">=", "15", "and", "age", "<=", "20", "and", "registered", ")", "or", "special_permission"],
          ["special_permission", "or", "(", "age", ">=", "15", "and", "age", "<=", "20", "and", "registered", ")"],
        ],
        hint: "Age and registered go in the parentheses. Then or special_permission.",
        panel: { title: "One condition!", text: "A long requirement splits into smaller logical parts that combine into one condition." },
      }),
      quiz({
        line: "A student has special permission but is outside the age range. Can they join?",
        layout: "grid",
        options: yesNo(),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Yes. Special permission can satisfy the condition on its own.",
        wrong: "Which part of the condition does special permission satisfy?",
      }),
    ],
  },

  // 34. Find the incorrect condition.
  [STEP.boundaryBug]: {
    step: STEP.boundaryBug,
    title: "Can You Find *What Is Wrong?*",
    stages: [
      predict({
        line: "At least 10 and at most 20. A learner wrote this. Is it True?",
        header: <Condition text="number > 10 and number < 20" size={22} />,
        rows: testRows([9, 10, 15, 20, 21], (value) => value > 10 && value < 20, (value) => `${value} > 10 and ${value} < 20`),
        hint: "Check both comparisons for that number.",
      }),
      quiz({
        line: "What is wrong with this condition?",
        visual: () => <Condition text="number > 10 and number < 20" size={22} />,
        options: neutral(["It excludes both 10 and 20.", "It lets 21 in.", "It uses or instead of and."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "The requirement includes both boundaries, but this condition leaves them out.",
        wrong: "Look at what happened to 10 and 20.",
      }),
      build({
        line: "Fix it: at least 10 and at most 20.",
        tokens: ["number", "number", "10", "20", ">=", "<=", "and", ">"],
        accept: eitherOrder(["number", ">=", "10"], "and", ["number", "<=", "20"]),
        hint: "Both boundaries must be included: use >= and <=.",
        panel: { title: "Fixed!", text: "A condition can look almost correct but still fail at the boundary values." },
      }),
    ],
  },

  // 35. AND or OR?
  [STEP.andOrBug]: {
    step: STEP.andOrBug,
    title: "Does This Condition *Fit the Rule?*",
    stages: [
      predict({
        line: "Between 10 and 20, both included. A learner wrote this. Is it True?",
        header: <Condition text="number >= 10 or number <= 20" size={22} />,
        rows: testRows([5, 25, 15], (value) => value >= 10 || value <= 20, (value) => `${value} >= 10 or ${value} <= 20`),
        hint: "With or, one True comparison is enough.",
      }),
      quiz({
        line: "5 and 25 are outside the range, yet get True. Why?",
        options: neutral(["With or, one True comparison is enough.", "The numbers are too big.", "<= is the wrong symbol."]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "One comparison can be True even when the number is outside the required range.",
        wrong: "Check each comparison for 5 and for 25.",
      }),
      build({
        line: "Fix it: both range requirements must be True together.",
        tokens: ["number", "number", "10", "20", ">=", "<=", "and", "or"],
        accept: eitherOrder(["number", ">=", "10"], "and", ["number", "<=", "20"]),
        hint: "Both must be True at the same time: use and.",
        panel: { title: "Both together!", text: "Both range requirements must be satisfied at the same time." },
      }),
    ],
  },

  // 36. Independent condition challenge.
  [STEP.designer]: {
    step: STEP.designer,
    title: "You Are the *Condition Designer!*",
    stages: [
      build({
        line: "Check whether a person is at least 18 years old.",
        tokens: ["age", "18", ">=", ">", "=="],
        accept: [["age", ">=", "18"]],
        hint: "At least 18 includes 18: which symbol?",
        panel: { title: "age >= 18", text: ">= is used because 18 itself is old enough: at least 18." },
      }),
      build({
        line: "Check whether a number is negative.",
        tokens: ["number", "0", "<", ">", "=="],
        accept: [["number", "<", "0"]],
        hint: "Negative means smaller than zero.",
        panel: { title: "number < 0", text: "< is used because negative numbers are smaller than zero." },
      }),
      build({
        line: "Check whether a number is even.",
        tokens: ["number", "%", "2", "==", "0", "!="],
        accept: [["number", "%", "2", "==", "0"]],
        hint: "Even means nothing remains when dividing by 2.",
        panel: { title: "number % 2 == 0", text: "% 2 finds the remainder, and == 0 says nothing is left." },
      }),
      build({
        line: "Check whether a number is greater than 50 but at most 100.",
        tokens: ["number", "number", "50", "100", ">", "<=", "and", "or", "<"],
        accept: eitherOrder(["number", ">", "50"], "and", ["number", "<=", "100"]),
        hint: "Two parts, both True: greater than 50, and at most 100.",
        panel: { title: "A range!", text: "number > 50 and number <= 100. > leaves 50 out, <= keeps 100 in, and and needs both." },
      }),
      build({
        line: "A student can take part if they completed the project OR scored at least 80.",
        tokens: ["project_completed", "score", "80", ">=", "or", "and", ">"],
        accept: eitherOrder(["project_completed"], "or", ["score", ">=", "80"]),
        hint: "Either one is enough: connect them with or.",
        panel: { title: "Alternatives!", text: "project_completed or score >= 80. or: either is enough; >= because at least 80 includes 80." },
      }),
      build({
        line: "Eligible if age is 18 to 30, inclusive, AND the account is verified.",
        tokens: ["age", "age", "18", "30", ">=", "<=", "and", "and", "account_verified", "or"],
        accept: [
          ["age", ">=", "18", "and", "age", "<=", "30", "and", "account_verified"],
          ["account_verified", "and", "age", ">=", "18", "and", "age", "<=", "30"],
        ],
        hint: "All three parts must be True: use and between them.",
        panel: { title: "Three parts!", text: "age >= 18 and age <= 30 and account_verified. and needs all three to be True." },
      }),
      build({
        line: "Check whether a number is NOT between 10 and 20, including both.",
        tokens: ["not", "(", "number", "number", "10", "20", ">=", "<=", "and", ")", "or"],
        accept: [["not", "(", "number", ">=", "10", "and", "number", "<=", "20", ")"]],
        hint: "Build the range inside parentheses, then put not in front.",
        panel: { title: "Reversed range!", text: "not (number >= 10 and number <= 20). not reverses the whole range check; the parentheses group it." },
      }),
      build({
        line: "Score at least 80 AND project done, OR special permission.",
        tokens: ["(", "score", ">=", "80", "and", "project_completed", ")", "or", "special_permission", "not"],
        accept: [
          ["(", "score", ">=", "80", "and", "project_completed", ")", "or", "special_permission"],
          ["special_permission", "or", "(", "score", ">=", "80", "and", "project_completed", ")"],
        ],
        hint: "The AND part goes in parentheses, then or special_permission.",
        panel: { title: "Well designed!", text: "(score >= 80 and project_completed) or special_permission. The group needs both; permission is an alternative." },
      }),
    ],
  },

  // 37. Your condition toolkit.
  [STEP.toolkit]: {
    step: STEP.toolkit,
    title: "You Can Now Construct *Conditions!*",
    finish: "gem",
    stages: [
      {
        kind: "interaction",
        line: "Your toolkit. Tap an operator to see what it does.",
        render: (api) => (
          <SymbolStage
            api={api}
            big={false}
            need={5}
            prompt="Tap each operator."
            groups={[
              {
                title: "Comparison operators",
                columns: 3,
                items: [
                  { id: "gt", symbol: ">", title: "Greater than", example: "10 > 5", result: true },
                  { id: "lt", symbol: "<", title: "Less than", example: "5 < 10", result: true },
                  { id: "eq", symbol: "==", title: "Equal to", example: "10 == 10", result: true },
                  { id: "ne", symbol: "!=", title: "Not equal to", example: "10 != 5", result: true },
                  { id: "ge", symbol: ">=", title: "Greater than or equal to", example: "10 >= 10", result: true },
                  { id: "le", symbol: "<=", title: "Less than or equal to", example: "5 <= 10", result: true },
                ],
              },
              {
                title: "Logical operators",
                columns: 3,
                items: [
                  { id: "and", symbol: "and", title: "Both conditions must be True", example: "True and False = False" },
                  { id: "or", symbol: "or", title: "At least one must be True", example: "True or False = True" },
                  { id: "not", symbol: "not", title: "Reverses the Boolean result", example: "not True = False" },
                ],
              },
            ]}
          />
        ),
      },
      {
        kind: "interaction",
        line: "Three kinds of condition you can build. Tap each.",
        render: (api) => (
          <RevealCards look="cards"
            api={api}
            columns={3}
            items={[
              { id: "math", label: "Even number", icon: P.chair, caption: "number % 2 == 0" },
              { id: "range", label: "Range", icon: P.game, caption: "number >= 10 and number <= 20" },
              { id: "complex", label: "Complex", icon: P.gift, caption: "(age >= 18 and age <= 30) or special_permission" },
            ]}
          />
        ),
        finishPanel: { title: "You can build conditions!", text: "A good programmer understands the requirement, splits it into parts, picks the operators and builds the condition." },
        nextLabel: "Complete Chapter",
      },
    ],
  },
};
