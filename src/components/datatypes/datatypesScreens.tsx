"use client";

import type { ReactNode } from "react";
import { INK, TINTS, BADGE, tintAt } from "./look";
import { ChooseTypeStage, SortStage, TYPES, type SortBucket } from "./interactions";
import { SceneRevealStage, ScenePickStage, SceneSortStage, SceneTourStage, SceneToggleStage, type SceneSortBucket, type SceneSortItem, type SceneTourGroup } from "./sceneStages";
import { noteGrouping } from "./datatypesScore";
import { P } from "./pictures";
import type { SceneValues } from "@/lib/rive/datatypesHost";
import { MASTERY, SCENE_MODE, type DatatypesSceneName } from "@/lib/rive/runtime";
import type { Option, QuizStage, SceneSpec, ScreenDef } from "./screen";
import { STEP } from "./datatypes";
import { InfoRows, type InfoRow } from "./visuals";

/** Answers: an id for each (their place), their words and a picture. */
const options = (rows: readonly (readonly [string, string])[]): Option[] => rows.map(([text, icon], index) => ({ id: String(index), text, icon }));
const at = (index: number) => String(index);

/** Pictures for answers that mustn't hint at which is right. */
const NEUTRAL = [P.order, P.actions, P.goal, P.short] as const;
const neutral = (texts: readonly string[]) => options(texts.map((text, index) => [text, NEUTRAL[index % NEUTRAL.length]] as const));

/** Answer tiles in the first screens' tints (screen 1's tiles): the tints go round the four and say nothing about which is right. */
const tinted = (choices: readonly Option[]): Option[] => choices.map((choice, index) => ({ ...choice, tint: tintAt(index) }));

/** The four types as answers: each always with its own picture. */
const TYPE_OPTIONS: Option[] = tinted(TYPES.map((type) => ({ id: type.id, text: type.label, icon: type.icon })));
const TYPE_BUCKETS: readonly SortBucket[] = TYPES.map((type) => ({ id: type.id, label: type.label, icon: type.icon }));
/** The same four places in a scene: their number is the type's (1 Integer, 2 Float, 3 String, 4 Boolean). */
const SCENE_TYPE_BUCKETS: readonly SceneSortBucket[] = TYPES.map((type, index) => ({ id: type.id, label: type.label, icon: type.icon, value: index + 1 }));

/** Screen 8's four answers, in the design's order (Integer and Float, then Boolean and String) and tints (the cream is its own, a shade lighter than the other screens'). */
const FLOAT_QUIZ_OPTIONS: Option[] = [
  { id: "integer", text: "Integer", icon: P.integer, tint: TINTS.lavender },
  { id: "float", text: "Float", icon: P.float, tint: "bg-[#FFF9F0] dark:bg-[#2A2218]" },
  { id: "boolean", text: "Boolean", icon: P.boolean, tint: TINTS.green },
  { id: "string", text: "String", icon: P.string, tint: TINTS.blue },
];

/** A question: its answers, like screens 1 and 2's, come in once Hex has finished his line. */
const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", optionsAfterHex: true, ...stage });

/**
 * A scene (see `DATATYPES_SCENES`) showing `values`. On a screen with something to do, `markWrong` is off: the
 * controls show a wrong try themselves, and the scene's red glow would blame a whole picture.
 */
const sceneOf =
  (scene: DatatypesSceneName) =>
  (values: SceneValues, markWrong = true): SceneSpec => ({ scene, values, markWrong });
const info = sceneOf("info");
const numbers = sceneOf("numbers");
const strings = sceneOf("strings");
const boolean = sceneOf("boolean");
const build = sceneOf("build");
const mastery = sceneOf("mastery");
const MODE = SCENE_MODE;

/** What the event form lights up for the information that is picked (screen 1): its Name, Age or Height row. */
const FORM_FIELD = { name: 1, age: 2, height: 3 } as const;

/** The student record's rows, by the answer that names them (screen 23): the pick lights its row up. */
const recordRow = (picked: string | null) => (picked ? (MASTERY.highlight.row[picked as keyof typeof MASTERY.highlight.row] ?? 0) : 0);

/** A value over the four types (screens 25 to 28): the pick lights its type's card up. */
const typeCard = (picked: string | null) => (picked ? (MASTERY.highlight.card[picked as keyof typeof MASTERY.highlight.card] ?? 0) : 0);

/** The player profile's five rows, each with its right type (screen 24, once they are sorted). */
const PLAYER_TYPES = {
  g1: MASTERY.type.string,
  g2: MASTERY.type.integer,
  g3: MASTERY.type.float,
  g4: MASTERY.type.boolean,
  g5: MASTERY.type.string,
} as const;

/** The big, plain sentence under a "Meet ..." screen, as on "Meet the Sequence.". */
function Key({ children }: { children: ReactNode }) {
  return <p className="w-[320px] text-center text-[17px] leading-6 font-semibold text-[#444444] dark:text-white">{children}</p>;
}

/** What is said when a value is put in the wrong type (the PDF's "Incorrect" line of the sorting screens). */
const WHY_WRONG = "Look at what each value represents. Is it a quantity, decimal measurement, text or logical state?";

/** Screen 3's eight values (the PDF's), in the order they are given out; each knows its place in the scene (`card1` is 12, `card8` is 165.2). */
const SIMILAR_VALUES: readonly SceneSortItem[] = [
  { id: "12", label: "12", key: "card1" },
  { id: "25", label: "25", key: "card2" },
  { id: "aarav", label: "Aarav", key: "card4" },
  { id: "148.5", label: "148.5", key: "card7" },
  { id: "kabir", label: "Kabir", key: "card6" },
  { id: "mia", label: "Mia", key: "card5" },
  { id: "165.2", label: "165.2", key: "card8" },
  { id: "40", label: "40", key: "card3" },
];

/** Screen 3's three groups (ids as the grouping is kept under them), and the group each value goes to in the scene. */
const SIMILAR_GROUPS: readonly SceneSortBucket[] = [
  { id: "a", label: "Group 1", value: 1 },
  { id: "b", label: "Group 2", value: 2 },
  { id: "c", label: "Group 3", value: 3 },
];

/** Screen 4's three groups (the PDF's): what Hex says about each once it is read, and the scene's outline for it. */
const TOUR_GROUPS: readonly SceneTourGroup[] = [
  { id: "a", name: "Group A", tint: "lavender", ink: INK.violet, key: "open1", caption: "These values represent quantities or amounts." },
  { id: "b", name: "Group B", tint: "cream", ink: INK.orange, key: "open2", caption: "These values identify people using their names." },
  { id: "c", name: "Group C", tint: "blue", ink: INK.blue, key: "open3", caption: "These values tell us true or false." },
];

/** The three questions under screen 5's counts (the PDF's, with the same icons as the tiles). */
const PLAN_ROWS: readonly InfoRow[] = [
  { id: "students", text: "How many students registered?", icon: P.planStudents },
  { id: "tickets", text: "How many tickets were sold?", icon: P.planTickets },
  { id: "prizes", text: "How many prizes are available?", icon: P.planPrizes },
];

/** Screen 5.2's four answers (what the values share), with pictures that don't hint at the right one. The first is right. */
const SIMILAR_OPTIONS = neutral(["Quantities", "People’s names", "Colours", "Yes/no answers"]);

/** Screen 6's four values, as the scene lights them (`sel1` is 12 students). */
const VALUE_PICKS = [
  { id: "students", label: "12 students", key: "sel1" },
  { id: "tickets", label: "25 tickets", key: "sel2" },
  { id: "height", label: "148.5 cm height", key: "sel3" },
  { id: "weight", label: "36.7 kg weight", key: "sel4" },
] as const;

/** Screen 9's six numbers, each with its place on the scene's shelf (`card1` is 15, `card6` is 42.8). */
const DECIMAL_HINT = "Check whether the value contains a decimal part.";
const CLASSIFY_ITEMS: readonly SceneSortItem[] = [
  { id: "15", label: "15", key: "card1", bucket: "integer", hint: DECIMAL_HINT },
  { id: "25.5", label: "25.5", key: "card2", bucket: "float", hint: DECIMAL_HINT },
  { id: "100", label: "100", key: "card3", bucket: "integer", hint: DECIMAL_HINT },
  { id: "9.75", label: "9.75", key: "card4", bucket: "float", hint: DECIMAL_HINT },
  { id: "0", label: "0", key: "card5", bucket: "integer", hint: DECIMAL_HINT },
  { id: "42.8", label: "42.8", key: "card6", bucket: "float", hint: DECIMAL_HINT },
];

/** Screen 11's six texts, as the scene lights them (`sel1` is Aarav). All of them are text. */
const TEXT_PICKS = [
  { id: "a", label: "Aarav", key: "sel1" },
  { id: "b", label: "Class 6A", key: "sel2" },
  { id: "c", label: "Delhi", key: "sel3" },
  { id: "d", label: "SY001", key: "sel4" },
  { id: "e", label: "Welcome to Learny!", key: "sel5" },
  { id: "f", label: "9876543210", key: "sel6" },
] as const;

/** Screen 22's four fields, each with the value the app holds for it (`t1` is City in the scene), and the type it needs. */
const WEATHER_PLAN: readonly SceneSortItem[] = [
  { id: "city", label: "City", sub: "Delhi", key: "t1", bucket: "string", hint: "A name is text." },
  { id: "temp", label: "Temperature", sub: "28.5°C", key: "t2", bucket: "float", hint: "It has a decimal part." },
  { id: "rain", label: "Rainy days", sub: "3", key: "t3", bucket: "integer", hint: "A whole number of days." },
  { id: "now", label: "Is raining", sub: "False", key: "t4", bucket: "boolean", hint: "It is a yes/no state." },
];

/** Screens that are a headline and one or more stages: the questions and the interactions. */
export const SCREENS: Readonly<Record<number, ScreenDef>> = {
  // Screens 1 and 2 set the scene, then Hex finishes his line and the answers bounce in one by one.
  [STEP.eventInfo]: {
    step: STEP.eventInfo,
    title: "Let’s organise our *event!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "What information might the school need?",
        // The pick outlines its row of the form; the right answer, all of them, fills the whole form in.
        scene: ({ picked, checked, correct }) => info({ mode: MODE.info.form, field: FORM_FIELD[picked as keyof typeof FORM_FIELD] ?? 0, fill: checked && correct ? 4 : 0 }),
        layout: "grid",
        optionsAfterHex: true,
        options: [
          { id: "name", text: "Student’s name", icon: P.needName, tint: TINTS.blue },
          { id: "age", text: "Student’s age", icon: P.needAge, tint: TINTS.green },
          { id: "height", text: "Student’s height", icon: P.needHeight, tint: TINTS.cream },
          { id: "all", text: "All of these", icon: P.needAll, tint: TINTS.lavender },
        ],
        correctId: "all",
        rightTitle: "Exactly!",
        right: "The school needs different details of each student.",
        wrong: "Think about what identifies a student.",
      }),
    ],
  },

  [STEP.meetAarav]: {
    step: STEP.meetAarav,
    title: "Meet *Aarav!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Notice anything about these four values?",
        scene: () => info({ mode: MODE.info.aaravForm, fill: 4 }),
        optionsAfterHex: true,
        options: [
          { id: "same", text: "They all look the same", icon: P.lookSame },
          { id: "different", text: "Different kinds of info", icon: P.lookDifferent },
          { id: "numbers", text: "They are all numbers", icon: P.allNumbers },
          { id: "words", text: "They are all words", icon: P.string },
        ],
        correctId: "different",
        rightTitle: "Exactly!",
        right: "Each value is a different kind of information.",
        wrong: "Is a name the same kind as a height?",
      }),
    ],
  },

  [STEP.sortSimilar]: {
    step: STEP.sortSimilar,
    title: "Let’s find *similar* ones!",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Some of these may belong together.",
        bubbleWidth: 190,
        alignTop: true,
        scene: info({ mode: MODE.info.values }, false),
        // No group is wrong: each value goes where the learner thinks it fits, and the scene sends it there.
        render: (api) => <SceneSortStage api={api} items={SIMILAR_VALUES} buckets={SIMILAR_GROUPS} prompt="Tap the group you think it fits." onSorted={noteGrouping} />,
        finishPanel: { title: "Interesting!", text: "You started grouping by what values represent." },
      },
    ],
  },

  [STEP.groups]: {
    step: STEP.groups,
    title: "Not all info is the *same!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Let’s understand what each group tells us.",
        alignTop: true,
        scene: info({ mode: MODE.info.groups }, false),
        // Nothing has to be tapped: once Hex has said his line, Continue reads the groups one by one, then goes on.
        ready: true,
        render: (api) => <SceneTourStage api={api} groups={TOUR_GROUPS} />,
      },
      // The PDF's question after the groups: they are not the same kind of information.
      quiz({
        line: "Are these groups the same kind of information?",
        scene: () => info({ mode: MODE.info.groups }),
        options: neutral(["Yes, the same kind", "No, different kinds"]),
        correctId: at(1),
        rightTitle: "No!",
        right: "They represent different kinds of information.",
        wrong: "Compare what each group tells us.",
      }),
    ],
  },

  // Screen 5 is only looked at: Hex says his line, the questions bounce in, and Continue waits for him. Then 5.2 is a question.
  [STEP.counting]: {
    step: STEP.counting,
    title: "Numbers help us *count!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "You are organising the event. You need to know:",
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.counts }, false),
        ready: true,
        render: ({ hexSpoken }) => <InfoRows rows={PLAN_ROWS} shown={hexSpoken} />,
      },
      // 5.2: the same counts, and a question.
      quiz({
        line: "What do all these values have in common?",
        scene: () => numbers({ mode: MODE.numbers.counts }),
        options: SIMILAR_OPTIONS,
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "These numbers are quantities we can count.",
        wrong: "What do 30, 45 and 12 all tell us?",
        nextLabel: "Continue",
      }),
    ],
  },

  [STEP.wholeDecimal]: {
    step: STEP.wholeDecimal,
    title: "Look at these *numbers!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Here are some values from different situations.",
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.values }, false),
        ready: true,
      },
      // The PDF's question: tap the numbers with a part after the decimal point; the scene lights each right one.
      {
        kind: "interaction",
        line: "Which numbers have a decimal part?",
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.values }, false),
        render: (api) => <ScenePickStage api={api} items={VALUE_PICKS} correct={["height", "weight"]} hint="Look for a number with a decimal point." />,
        finishPanel: { title: "That’s right!", text: "148.5 and 36.7 contain decimal parts." },
      },
      // The PDF's follow-up: the two kinds of number sorted apart.
      {
        kind: "interaction",
        line: "Some numbers are whole, others have decimal parts.",
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.values, split: 1 }, false),
        ready: true,
      },
    ],
  },

  [STEP.integers]: {
    step: STEP.integers,
    title: "Meet *integers!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Integers are whole numbers without decimal parts.",
        bubbleWidth: 190,
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.numberLine }, false),
        ready: true,
      },
    ],
  },

  [STEP.floats]: {
    step: STEP.floats,
    title: "Can we be more *precise?*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Whole numbers can miss details like a height of 148.5 cm!!",
        bubbleWidth: 190,
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.ruler, measure: 1 }, false),
        ready: true,
      },
      quiz({
        title: "Which value *fits best?*",
        titleSize: 28,
        line: "Choose the best value to represent 148.5 cm.",
        bubbleWidth: 176,
        scene: () => numbers({ mode: MODE.numbers.ruler, measure: 1 }),
        layout: "grid",
        options: FLOAT_QUIZ_OPTIONS,
        correctId: "float",
        rightTitle: "Correct!",
        right: "A decimal measurement like 148.5 is a Float.",
        wrong: "Does 148.5 have a decimal part?",
      }),
    ],
  },

  [STEP.classifyNumbers]: {
    step: STEP.classifyNumbers,
    title: "Classify these *numbers!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Sort each number into Integer or Float.",
        alignTop: true,
        scene: numbers({ mode: MODE.numbers.bins }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            items={CLASSIFY_ITEMS}
            buckets={SCENE_TYPE_BUCKETS.filter((bucket) => bucket.id === "integer" || bucket.id === "float")}
            prompt="Tap the group it belongs to."
            // After a slip the scene puts a magnifier on the number, to look for the decimal point.
            slipValues={(item) => ({ hint: 1, hintValue: item.label })}
          />
        ),
        finishPanel: { title: "Excellent!", text: "You can tell whole and decimal numbers apart." },
      },
    ],
  },

  // Screen 10 has two parts on one desk: the school's list of names, then the question about it.
  [STEP.names]: {
    step: STEP.names,
    title: "Let’s *list* student’s name!",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Imagine the school wants to display the names of students.",
        bubbleWidth: 190,
        alignTop: true,
        scene: strings({ mode: MODE.strings.list }, false),
        ready: true,
      },
      quiz({
        title: "What *information* is this?",
        titleSize: 28,
        line: "Can a program understand names too?",
        bubbleWidth: 160,
        scene: () => strings({ mode: MODE.strings.list }),
        layout: "grid",
        cards: "badges",
        options: [
          { id: "numerical", text: "Numerical", icon: "", tint: TINTS.green, tag: { text: "30", look: BADGE.mint } },
          { id: "textual", text: "Textual", icon: "", tint: TINTS.cream, tag: { text: "abc", look: BADGE.purple } },
          { id: "decimal", text: "Decimal", icon: "", tint: TINTS.blue, tag: { text: "1.2", look: BADGE.sky } },
        ],
        correctId: "textual",
        rightTitle: "Exactly!",
        right: "These are names written as text.",
        wrong: "Look at the names. Are they numbers?",
      }),
    ],
  },

  [STEP.textLooks]: {
    step: STEP.textLooks,
    title: "Text is more than *names!*",
    titleSize: 27,
    stages: [
      {
        kind: "interaction",
        line: "Which of these can be treated as text?",
        alignTop: true,
        scene: strings({ mode: MODE.strings.examples }, false),
        render: (api) => (
          <ScenePickStage
            api={api}
            columns={3}
            items={TEXT_PICKS}
            correct={TEXT_PICKS.map((pick) => pick.id)}
            hint="Text can hold letters, digits and symbols."
            // Once all are picked the scene tags the two ids: they identify someone, they are not added.
            doneValues={{ ident: 1 }}
          />
        ),
        finishPanel: { title: "All of them!", text: "Text holds letters, digits and symbols. An ID or a phone number identifies someone: we don’t add it." },
      },
    ],
  },

  [STEP.strings]: {
    step: STEP.strings,
    title: "Meet *Strings!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Text information is called a String.",
        bubbleWidth: 190,
        alignTop: true,
        scene: strings({ mode: MODE.strings.examples }, false),
        render: (api) => (
          <SceneRevealStage
            api={api}
            columns={3}
            need={3}
            // The scene hangs a tag on the card (name, class, city, ...); once enough are read it puts the quote marks on.
            doneValues={{ quotes: 1 }}
            items={[
              { id: "a", label: "“Aarav”", key: "rev1", caption: "A name, written as text." },
              { id: "b", label: "“Class 6A”", key: "rev2", caption: "Words and a number, as text." },
              { id: "c", label: "“Delhi”", key: "rev3", caption: "A city, written as text." },
              { id: "d", label: "“SY001”", key: "rev4", caption: "An ID: letters and digits, as text." },
              { id: "e", label: "“Hello Learny!”", key: "rev5", caption: "Words, a space and a symbol." },
            ]}
            footer={<Key>String (str) represents text information.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.twelve]: {
    step: STEP.twelve,
    title: "Look alike, but *same?*",
    titleSize: 28,
    stages: [
      // The PDF's opening: 12 and "12", one headed for a calculator and the other for a text display.
      {
        kind: "interaction",
        line: "Look at these two values: 12 and “12”.",
        alignTop: true,
        scene: strings({ mode: MODE.strings.twelve }, false),
        ready: true,
      },
      quiz({
        line: "If we add 12 and 3 as numbers, what do we get?",
        // The 12 goes onto the calculator; a right answer lets it work the sum out.
        scene: ({ checked, correct }) => strings({ mode: MODE.strings.twelve, step: checked && correct ? 2 : 1 }),
        layout: "grid",
        options: tinted(neutral(["9", "15", "123", "36"])),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "As numbers, 12 + 3 = 15.",
        wrong: "Add the two numbers: 12 and 3.",
      }),
      quiz({
        line: "Join the text “12” and “3”. What text do we get?",
        // The calculator keeps its sum; a right answer joins the text on the screen.
        scene: ({ checked, correct }) => strings({ mode: MODE.strings.twelve, step: checked && correct ? 3 : 2 }),
        layout: "grid",
        options: tinted(neutral(["“15”", "“123”", "“312”", "“9”"])),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "A value’s look doesn’t always show its type.",
        wrong: "Joining text puts the characters side by side.",
      }),
    ],
  },

  [STEP.attendance]: {
    step: STEP.attendance,
    title: "Let’s check *attendance!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "What kind of information is the teacher collecting?",
        scene: () => boolean({ mode: MODE.boolean.attendance }),
        options: options([
          ["Person’s name", P.string],
          ["Numerical quantity", P.integer],
          ["Yes/no status", P.boolean],
          ["Decimal measurement", P.float],
        ]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "It tells us whether something is true or false.",
        wrong: "Present or absent: how many answers?",
      }),
    ],
  },

  [STEP.twoStates]: {
    step: STEP.twoStates,
    title: "Yes or no *answers!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Tap each picture to switch its state.",
        alignTop: true,
        scene: boolean({ mode: MODE.boolean.states }, false),
        render: (api) => (
          <SceneToggleStage
            api={api}
            items={[
              { id: "a", title: "Student attendance", on: "Present", off: "Absent", icon: P.programmer, key: "s1" },
              { id: "b", title: "Payment confirmation", on: "Complete", off: "Pending", icon: P.float, key: "s2" },
              { id: "c", title: "Login status", on: "Logged in", off: "Logged out", icon: P.computer, key: "s3" },
              { id: "d", title: "Light switch", on: "On", off: "Off", icon: P.idea, key: "s4" },
            ]}
          />
        ),
      },
      quiz({
        line: "What do these situations have in common?",
        scene: () => boolean({ mode: MODE.boolean.states, s1: 1, s2: 1, s3: 1, s4: 1 }),
        options: options([
          ["Two possible states", P.boolean],
          ["They are all numbers", P.integer],
          ["They are all names", P.string],
          ["They are all decimals", P.float],
        ]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "Each situation has two possible logical states.",
        wrong: "Look at the two states each picture can show.",
      }),
    ],
  },

  [STEP.boolean]: {
    step: STEP.boolean,
    title: "Meet *Boolean!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Information with two values is a Boolean.",
        alignTop: true,
        scene: boolean({ mode: MODE.boolean.flags }, false),
        render: (api) => (
          <SceneRevealStage
            api={api}
            columns={2}
            exclusive
            items={[
              { id: "t", label: "TRUE", sub: "light on", icon: P.boolean, key: "bsel", value: 1, caption: "True: Aarav is present." },
              { id: "f", label: "FALSE", sub: "light off", icon: P.stop, key: "bsel", value: 2, caption: "False: Aarav is not present." },
            ]}
            footer={<Key>Boolean (bool) represents a logical value: True or False.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.fourTypes]: {
    step: STEP.fourTypes,
    title: "You found four *data types!*",
    titleSize: 26,
    stages: [
      {
        kind: "interaction",
        line: "Tap each card to see its examples.",
        bubbleWidth: 190,
        alignTop: true,
        scene: boolean({ mode: MODE.boolean.types }, false),
        render: (api) => (
          <SceneRevealStage
            api={api}
            columns={4}
            // Each card opens in the scene, with what it means and its examples.
            items={[
              { id: "int", label: "Integer", sub: "int", icon: P.integer, key: "open1" },
              { id: "float", label: "Float", sub: "float", icon: P.float, key: "open2" },
              { id: "str", label: "String", sub: "str", icon: P.string, key: "open3" },
              { id: "bool", label: "Boolean", sub: "bool", icon: P.boolean, key: "open4" },
            ]}
            footer={<Key>A data type tells a program what kind of value it is working with.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.beyond]: {
    step: STEP.beyond,
    title: "Look beyond *appearance!*",
    titleSize: 26,
    stages: [
      {
        kind: "interaction",
        line: "Match each card to its type.",
        bubbleWidth: 190,
        alignTop: true,
        scene: boolean({ mode: MODE.boolean.record }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap the type it belongs to."
            // In this scene a card is either on the shelf or in its own bin (1).
            items={[
              { id: "age", label: "Age: 12", key: "m1", value: 1, bucket: "integer", hint: WHY_WRONG },
              { id: "id", label: "Student ID: “0012”", key: "m2", value: 1, bucket: "string", hint: "It is written as text, in quotes." },
              { id: "height", label: "Height: 148.5", key: "m3", value: 1, bucket: "float", hint: "Does it have a decimal part?" },
              { id: "present", label: "Is_present: True", key: "m4", value: 1, bucket: "boolean", hint: "Is it a yes/no state?" },
            ]}
            buckets={SCENE_TYPE_BUCKETS}
          />
        ),
      },
      quiz({
        line: "Why is Student ID text, though it has digits?",
        scene: () => boolean({ mode: MODE.boolean.record, m1: 1, m2: 1, m3: 1, m4: 1 }),
        options: neutral(["It identifies a student", "It is a decimal number", "It is a height", "It is True or False"]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "It isn’t a quantity. It keeps its leading zero.",
        wrong: "Do we calculate with an ID, or identify someone?",
      }),
    ],
  },

  [STEP.shopping]: {
    step: STEP.shopping,
    title: "Data changes how we *use it!*",
    titleSize: 24,
    stages: [
      {
        kind: "interaction",
        line: "Drag each value to what we do with it.",
        alignTop: true,
        scene: build({ mode: MODE.build.shopping }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap what we do with it."
            // Both prices in the total box, and the scene adds them up.
            base={(placed): SceneValues => (placed.nb && placed.pen ? { total: 1 } : {})}
            items={[
              { id: "nb", label: "Notebook price", sub: "₹50", key: "n1", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "pen", label: "Pen price", sub: "₹20", key: "n2", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "name", label: "Student name", sub: "Aarav", key: "n3", bucket: "display", hint: "A name is text. We show it, we don’t add it." },
            ]}
            buckets={[
              { id: "total", label: "Calculate a total", icon: P.integer, value: 1 },
              { id: "display", label: "Display information", icon: P.statement, value: 1 },
            ]}
          />
        ),
        finishPanel: { title: "Nice!", text: "Prices are numbers: we add them. Names are text." },
      },
    ],
  },

  [STEP.profile]: {
    step: STEP.profile,
    title: "Organise Aarav’s *info!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Drag each piece of information to its type.",
        alignTop: true,
        scene: build({ mode: MODE.build.aarav }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap the type it belongs to."
            items={[
              { id: "name", label: "Name", sub: "Aarav", key: "p1", bucket: "string", hint: WHY_WRONG },
              { id: "age", label: "Age", sub: "12", key: "p2", bucket: "integer", hint: WHY_WRONG },
              { id: "height", label: "Height", sub: "148.5", key: "p3", bucket: "float", hint: WHY_WRONG },
              { id: "present", label: "Is_present", sub: "True", key: "p4", bucket: "boolean", hint: WHY_WRONG },
              { id: "id", label: "Student ID", sub: "“0012”", key: "p5", bucket: "string", hint: WHY_WRONG },
            ]}
            buckets={SCENE_TYPE_BUCKETS}
          />
        ),
        finishPanel: { title: "Great!", text: "You sorted the student’s info by data type." },
      },
    ],
  },

  [STEP.weather]: {
    step: STEP.weather,
    title: "What does a weather app *need?*",
    titleSize: 22,
    stages: [
      {
        kind: "interaction",
        line: "What kind of data should each field use?",
        alignTop: true,
        scene: build({ mode: MODE.build.weather }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap the data type it needs."
            items={[
              { id: "city", label: "City name", key: "t1", bucket: "string", hint: "A name is text." },
              { id: "temp", label: "Temperature", key: "t2", bucket: "float", hint: "Temperatures can have decimals." },
              { id: "rain", label: "Number of rainy days", key: "t3", bucket: "integer", hint: "Days are counted in whole numbers." },
              { id: "now", label: "Is it raining?", key: "t4", bucket: "boolean", hint: "It is a yes/no state." },
            ]}
            buckets={SCENE_TYPE_BUCKETS}
          />
        ),
        finishPanel: { title: "Excellent!", text: "Your app needs four kinds of information." },
      },
    ],
  },

  [STEP.plan]: {
    step: STEP.plan,
    title: "Plan before *you build!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Choose the type for each field.",
        bubbleWidth: 190,
        alignTop: true,
        scene: build({ mode: MODE.build.weather, vals: 1 }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap the data type it needs."
            items={WEATHER_PLAN}
            buckets={SCENE_TYPE_BUCKETS}
            // Planned, the weather app boots: the phone gets its tick.
            doneValues={{ boot: 1 }}
          />
        ),
        finishPanel: { title: "Perfect!", text: "You know what kind of info each part needs." },
      },
    ],
  },

  [STEP.debug]: {
    step: STEP.debug,
    title: "Can you find the *mistake?*",
    titleSize: 26,
    stages: [
      quiz({
        line: "Which field has been classified incorrectly?",
        scene: ({ picked }) => mastery({ mode: MASTERY.mode.record, highlight: recordRow(picked) }),
        layout: "grid",
        options: tinted([
          { id: "name", text: "Name", icon: P.statement },
          { id: "age", text: "Age", icon: P.question },
          { id: "height", text: "Height", icon: P.idea },
          { id: "present", text: "Is_present", icon: P.command },
        ]),
        correctId: "height",
        rightTitle: "Exactly!",
        right: "148.5 has a decimal part: it should be a Float.",
        wrong: "Look at the height. Does it have a decimal part?",
      }),
      {
        kind: "interaction",
        line: "Now replace the incorrect type with Float.",
        scene: ({ checked }) => mastery({ mode: MASTERY.mode.record, highlight: MASTERY.highlight.row.height, fixed: checked ? MASTERY.fixed : 0 }),
        render: (api) => <ChooseTypeStage api={api} field="Height" value="148.5" from="Integer" correct="float" hint="Which type holds decimal numbers?" showCard={false} />,
        finishPanel: { title: "Fixed!", text: "Height is now a Float." },
      },
    ],
  },

  [STEP.game]: {
    step: STEP.game,
    title: "Organise a *game profile!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Sort the player’s five values by type.",
        alignTop: true,
        scene: mastery({ mode: MASTERY.mode.profile }, false),
        render: (api) => (
          <SceneSortStage
            api={api}
            prompt="Tap the type it belongs to."
            items={[
              { id: "name", label: "Player name", sub: "ShadowX", key: "g1", bucket: "string", hint: WHY_WRONG },
              { id: "score", label: "Current score", sub: "1250", key: "g2", bucket: "integer", hint: WHY_WRONG },
              { id: "percent", label: "Completion %", sub: "87.5", key: "g3", bucket: "float", hint: WHY_WRONG },
              { id: "done", label: "Level completed?", sub: "False", key: "g4", bucket: "boolean", hint: WHY_WRONG },
              { id: "id", label: "Player ID", sub: "“G007”", key: "g5", bucket: "string", hint: WHY_WRONG },
            ]}
            buckets={SCENE_TYPE_BUCKETS}
          />
        ),
      },
      quiz({
        line: "Why is Player ID a String rather than an Integer?",
        scene: () => mastery({ mode: MASTERY.mode.profile, highlight: MASTERY.highlight.profile.id, ...PLAYER_TYPES }, false),
        options: neutral(["It identifies a player", "It is a decimal number", "It is a yes/no value", "It is a very big number"]),
        correctId: at(0),
        rightTitle: "Excellent!",
        right: "You used data type thinking in a new app.",
        wrong: "Is it a quantity, or a name for a player?",
      }),
    ],
  },

  [STEP.reflectInt]: {
    step: STEP.reflectInt,
    title: "Test your data *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Which data type suits a student’s age of 12?",
        scene: ({ picked }) => mastery({ mode: MASTERY.mode.value, q: MASTERY.value.age, highlight: typeCard(picked) }),
        layout: "grid",
        options: TYPE_OPTIONS,
        correctId: "integer",
        rightTitle: "Correct!",
        right: "12 is a whole number: an Integer.",
        wrong: "Is 12 a whole number or a decimal?",
      }),
    ],
  },

  [STEP.reflectFloat]: {
    step: STEP.reflectFloat,
    title: "Test your data *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Which data type suits a height of 152.5 cm?",
        scene: ({ picked }) => mastery({ mode: MASTERY.mode.value, q: MASTERY.value.height, highlight: typeCard(picked) }),
        layout: "grid",
        options: TYPE_OPTIONS,
        correctId: "float",
        rightTitle: "Correct!",
        right: "152.5 has a decimal part: a Float.",
        wrong: "Does 152.5 have a decimal part?",
      }),
    ],
  },

  [STEP.reflectId]: {
    step: STEP.reflectId,
    title: "Test your data *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Student ID “0045”: why is it treated as text?",
        scene: () => mastery({ mode: MASTERY.mode.value, q: MASTERY.value.studentId, highlight: MASTERY.highlight.card.string }, false),
        options: neutral(["It identifies a student", "It represents a height", "It is a decimal number", "It means True or False"]),
        correctId: at(0),
        rightTitle: "Correct!",
        right: "It identifies a student, not a quantity.",
        wrong: "Do we calculate with the ID, or identify someone?",
      }),
    ],
  },

  [STEP.reflectBool]: {
    step: STEP.reflectBool,
    title: "Test your data *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Which data type represents True or False?",
        scene: ({ picked }) => mastery({ mode: MASTERY.mode.value, q: MASTERY.value.flag, highlight: typeCard(picked) }),
        layout: "grid",
        options: TYPE_OPTIONS,
        correctId: "boolean",
        rightTitle: "Correct!",
        right: "A Boolean is either True or False.",
        wrong: "Which type has only two values?",
      }),
    ],
  },

  [STEP.reflectApp]: {
    step: STEP.reflectApp,
    title: "Test your data *thinking!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Which data type fits each field?",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={104}
            prompt="Drag each field to its data type."
            items={[
              { id: "city", label: "City name", bucket: "string", hint: "A name is text." },
              { id: "temp", label: "Temperature", bucket: "float", hint: "Temperatures can have decimals." },
              { id: "rain", label: "Rain status", bucket: "boolean", hint: "It is a yes/no state." },
            ]}
            buckets={TYPE_BUCKETS}
          />
        ),
        finishPanel: { title: "Correct!", text: "City: String. Temperature: Float. Rain: Boolean." },
      },
    ],
  },
};
