"use client";

import type { ReactNode } from "react";
import { GroupStage, type GroupItem } from "./GroupStage";
import { ToggleRight } from "lucide-react";
import { FloatLesson } from "./FloatLesson";
import { GroupTourStage, type TourGroup } from "./GroupTourStage";
import { BADGE, INK, TINTS, tintAt } from "./look";
import { ChooseTypeStage, MultiPickStage, PickTilesStage, RevealStage, SortStage, TYPES, ToggleStage, type SortBucket } from "./interactions";
import { noteGrouping } from "./datatypesScore";
import { P } from "@/components/kit/content/from-datatypes/pictures";
import type { Option, QuizStage, ScreenDef } from "@/components/kit/content/from-datatypes/screen";
import { STEP } from "./datatypes";
import { WINDOW_ROW, WindowCard } from "./WindowCard";
import { AttendanceBoard, DecimalGroups, EventScene, InfoRows, InfoTiles, IntegerLesson, NamesScene, RegisteredStudents, SchoolScene, StudentProfileCard, TwelveCards, TwelveIntro, TypedCards, WeatherCard, type ExampleTile, type InfoRow, type InfoTile } from "./visuals";

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

/** Screen 8's four answers, big: in the design's order (Integer and Float, then Boolean and String) and tints (the cream is its own, a shade lighter than the other screens'). */
const FLOAT_QUIZ_OPTIONS: Option[] = [
  { id: "integer", text: "Integer", icon: P.integer, tint: TINTS.lavender },
  { id: "float", text: "Float", icon: P.float, tint: "bg-[#FFF9F0] dark:bg-[#2A2218]" },
  { id: "boolean", text: "Boolean", icon: P.boolean, tint: TINTS.green },
  { id: "string", text: "String", icon: P.string, tint: TINTS.blue },
];

/** A question: its answers, like screens 1 and 2's, come in once Hex has finished his line. */
const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", optionsAfterHex: true, ...stage });

/** The big, plain sentence under a "Meet ..." screen, as on "Meet the Sequence.". */
function Key({ children }: { children: ReactNode }) {
  return <p className="w-[320px] text-center text-[19px] leading-[26px] font-semibold text-[#444444] dark:text-white">{children}</p>;
}

/** A small card with a heading and a list, for the explanations. */
function Note({ children }: { children: ReactNode }) {
  return <p className="w-[320px] rounded-[12px] bg-[#F1EEFF] px-3.5 py-2.5 text-center text-[14px] leading-5 font-medium text-[#444444] dark:bg-[#23204A] dark:text-white">{children}</p>;
}

/** What is said when a value is put in the wrong type (the PDF's "Incorrect" line of the sorting screens). */
const WHY_WRONG = "Look at what each value represents. Is it a quantity, decimal measurement, text or logical state?";

/** Screen 3's eight values (the PDF's), in the order of the design's grid (their tints only tell them apart). */
const SIMILAR_VALUES: readonly GroupItem[] = [
  { id: "12", label: "12", tint: "blue" },
  { id: "25", label: "25", tint: "lavender" },
  { id: "aarav", label: "Aarav", tint: "green" },
  { id: "148.5", label: "148.5", tint: "cream" },
  { id: "kabir", label: "Kabir", tint: "blue" },
  { id: "mia", label: "Mia", tint: "cream" },
  { id: "165.2", label: "165.2", tint: "lavender" },
  { id: "40", label: "40", tint: "green" },
];

/** Screen 4's three groups (the PDF's): what each holds, and what Hex says about it once it is tapped. */
const TOUR_GROUPS: readonly TourGroup[] = [
  { id: "a", name: "Group A", tint: "lavender", ink: INK.violet, values: ["12", "25", "40"], caption: "These values represent quantities or amounts.", hex: "left" },
  { id: "b", name: "Group B", tint: "cream", ink: INK.orange, values: ["Aarav", "Mia", "Kabir"], caption: "These values identify people using their names.", hex: "center" },
  { id: "c", name: "Group C", tint: "blue", ink: INK.blue, values: ["Yes", "No", "Yes"], caption: "These values tell us true or false.", hex: "right" },
];

/** Screen 5's three things the event needs counted (the icons are screen 2's, the same files). */
const PLAN_TILES: readonly InfoTile[] = [
  { id: "students", text: "Students", icon: P.planStudents, tint: TINTS.green },
  { id: "tickets", text: "Tickets", icon: P.planTickets, tint: TINTS.cream },
  { id: "prizes", text: "Prizes", icon: P.planPrizes, tint: TINTS.lavender },
];

/** Screen 5.2's three counts (the PDF's: 30 students, 45 tickets, 12 prizes), each in its number badge. */
const SIMILAR_TILES: readonly InfoTile[] = [
  { id: "students", text: "Students", badge: { value: "30", fill: "#8EEBD8", ink: "#036C59" }, tint: TINTS.green },
  { id: "tickets", text: "Tickets", badge: { value: "45", fill: "#C1A5F9", ink: "#472A92" }, tint: TINTS.cream },
  { id: "prizes", text: "Prizes", badge: { value: "12", fill: "#7ACDFB", ink: "#035280" }, tint: TINTS.blue },
];

/** The three questions under screen 5's tiles (the PDF's, with the same icons as the tiles). */
const PLAN_ROWS: readonly InfoRow[] = [
  { id: "students", text: "How many students registered?", icon: P.planStudents },
  { id: "tickets", text: "How many tickets were sold?", icon: P.planTickets },
  { id: "prizes", text: "How many prizes are available?", icon: P.planPrizes },
];

/** Screen 5.2's four answers (what the values share), with pictures that don't hint at the right one. The first is right. */
const SIMILAR_OPTIONS = neutral(["Quantities", "People’s names", "Colours", "Yes/no answers"]);

/** Screen 6's four values, each with the picture of what it measures. */
const VALUE_TILES: readonly InfoTile[] = [
  { id: "students", text: "12 students", icon: P.valueStudents, tint: TINTS.lavender },
  { id: "tickets", text: "25 tickets", icon: P.valueTickets, tint: TINTS.cream },
  { id: "height", text: "148.5 cm height", icon: P.valueHeight, tint: TINTS.green },
  { id: "weight", text: "36.7 kg weight", icon: P.valueWeight, tint: TINTS.blue },
];

/** Screen 7's three examples: a whole number in its badge, and what it counts or measures (each tile has its own colour, its badge goes with it). */
const INTEGER_EXAMPLES: readonly ExampleTile[] = [
  { id: "students", value: "32", text: "No. of students", tint: TINTS.green, badge: BADGE.mint },
  { id: "books", value: "13", text: "Number of books", tint: TINTS.cream, badge: BADGE.purple },
  { id: "temperature", value: "-5°", text: "Temperature change", tint: TINTS.blue, badge: BADGE.sky },
];

/** Screens that are a headline and one or more stages: the questions and the interactions. */
export const SCREENS: Readonly<Record<number, ScreenDef>> = {
  // Screens 1 and 2 set the scene, then Hex finishes his line and the answers bounce in one by one.
  [STEP.eventInfo]: {
    step: STEP.eventInfo,
    title: "Let’s organise our *event!*",
    titleSize: 28,
    backdrop: <EventScene />,
    stages: [
      quiz({
        line: "What information might the school need?",
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
        visual: () => <StudentProfileCard />,
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
        render: (api) => <GroupStage api={api} items={SIMILAR_VALUES} onSorted={noteGrouping} />,
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
        // Nothing has to be tapped: once Hex has said his line, Continue reads the groups one by one, then goes on.
        ready: true,
        render: (api) => <GroupTourStage api={api} groups={TOUR_GROUPS} />,
      },
      // The PDF's question after the groups: they are not the same kind of information.
      quiz({
        line: "Are these groups the same kind of information?",
        options: neutral(["Yes, the same kind", "No, different kinds"]),
        correctId: at(1),
        rightTitle: "No!",
        right: "They represent different kinds of information.",
        wrong: "Compare what each group tells us.",
      }),
    ],
  },

  // Screen 5 is only looked at: Hex says his line, the cards bounce in, and Continue waits for him. Then 5.2 is a question.
  [STEP.counting]: {
    step: STEP.counting,
    title: "Numbers help us *count!*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "You are organising the event. You need to know:",
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => (
          <Stack gap={24} fit>
            <InfoTiles layout="row" shown={hexSpoken} tiles={PLAN_TILES} />
            <InfoRows rows={PLAN_ROWS} shown={hexSpoken} firstIndex={PLAN_TILES.length} />
          </Stack>
        ),
      },
      // 5.2: the same school yard and headline, and a question: the three counts stand above the four answers.
      quiz({
        line: "What do all these values have in common?",
        visual: ({ hexSpoken = true }) => <InfoTiles layout="row" shown={hexSpoken} tiles={SIMILAR_TILES} />,
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
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Here are some values from different situations.",
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => <InfoTiles layout="grid" shown={hexSpoken} tiles={VALUE_TILES} />,
      },
      // The PDF's question: tap the numbers with a part after the decimal point.
      {
        kind: "interaction",
        line: "Which numbers have a decimal part?",
        alignTop: true,
        render: (api) => <PickTilesStage api={api} tiles={VALUE_TILES} correct={["height", "weight"]} hint="Look for a number with a decimal point." />,
        finishPanel: { title: "That’s right!", text: "148.5 and 36.7 contain decimal parts." },
      },
      // The PDF's follow-up: the two kinds of number, and the key line.
      {
        kind: "interaction",
        line: "Some numbers are whole, others have decimal parts.",
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => <DecimalGroups shown={hexSpoken} />,
      },
    ],
  },

  [STEP.integers]: {
    step: STEP.integers,
    title: "Meet *integers!*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Integers are whole numbers without decimal parts.",
        bubbleWidth: 190,
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => <IntegerLesson examples={INTEGER_EXAMPLES} shown={hexSpoken} />,
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
        ready: true,
        render: ({ hexSpoken }) => <FloatLesson shown={hexSpoken} />,
      },
      quiz({
        title: "Which value *fits best?*",
        titleSize: 28,
        line: "Choose the best value to represent 148.5 cm.",
        bubbleWidth: 176,
        layout: "grid",
        cards: "big",
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
        line: "Drag each number to Integer or Float.",
        alignTop: true,
        render: (api) => (
          <SortStage
            api={api}
            decimalHint
            cardWidth={104}
            prompt="Drag each card to its group."
            items={[
              { id: "15", label: "15", bucket: "integer", hint: "Check whether the value contains a decimal part." },
              { id: "25.5", label: "25.5", bucket: "float", hint: "Check whether the value contains a decimal part." },
              { id: "100", label: "100", bucket: "integer", hint: "Check whether the value contains a decimal part." },
              { id: "9.75", label: "9.75", bucket: "float", hint: "Check whether the value contains a decimal part." },
              { id: "0", label: "0", bucket: "integer", hint: "Check whether the value contains a decimal part." },
              { id: "42.8", label: "42.8", bucket: "float", hint: "Check whether the value contains a decimal part." },
            ]}
            buckets={TYPE_BUCKETS.filter((bucket) => bucket.id === "integer" || bucket.id === "float")}
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
    backdrop: <NamesScene />,
    stages: [
      {
        kind: "interaction",
        line: "Imagine the school wants to display the names of students.",
        bubbleWidth: 190,
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => <RegisteredStudents shown={hexSpoken} />,
      },
      quiz({
        title: "What *information* is this?",
        titleSize: 28,
        line: "Can a program understand names too?",
        bubbleWidth: 160,
        layout: "grid",
        cards: "badges",
        visual: () => <RegisteredStudents animated={false} />,
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
        render: (api) => (
          <MultiPickStage
            api={api}
            columns={2}
            correct={["a", "b", "c", "d", "e", "f"]}
            hint="Text can hold letters, digits and symbols."
            items={[
              { id: "a", label: "Aarav", icon: P.string },
              { id: "b", label: "Class 6A", icon: P.string },
              { id: "c", label: "Delhi", icon: P.string },
              { id: "d", label: "SY001", icon: P.string },
              { id: "e", label: "Welcome to Learny!", icon: P.string },
              { id: "f", label: "9876543210", icon: P.string },
            ]}
            footer={<KeyText>A value is not a number just because it has digits. A phone number or a student ID identifies someone: we don’t add or subtract it.</KeyText>}
          />
        ),
        finishPanel: { title: "All of them!", text: "Text holds letters, numbers and symbols." },
      },
    ],
  },

  [STEP.strings]: {
    step: STEP.strings,
    title: "Meet *Strings!*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Text information is called a String.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <RevealStage
            api={api}
            columns={3}
            need={3}
            tone="cream"
            items={[
              { id: "a", label: "“Aarav”", caption: "A name, written as text." },
              { id: "b", label: "“Delhi”", caption: "A city, written as text." },
              { id: "c", label: "“Class 6A”", caption: "Words and a number, as text." },
              { id: "d", label: "“SY001”", caption: "An ID: letters and digits, as text." },
              { id: "e", label: "“Hello Learny!”", caption: "Words, a space and a symbol." },
            ]}
            footer={<KeyText>String (str) represents text information.</KeyText>}
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
        ready: true,
        render: ({ hexSpoken }) => <TwelveIntro shown={hexSpoken} />,
      },
      quiz({
        line: "If we add 12 and 3 as numbers, what do we get?",
        visual: ({ attempt }) => <TwelveCards mode="numbers" replay={attempt} />,
        layout: "grid",
        options: tinted(neutral(["9", "15", "123", "36"])),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "As numbers, 12 + 3 = 15.",
        wrong: "Add the two numbers: 12 and 3.",
      }),
      quiz({
        line: "Join the text “12” and “3”. What text do we get?",
        visual: ({ attempt }) => <TwelveCards mode="text" replay={attempt} />,
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
    backdrop: <SchoolScene />,
    stages: [
      quiz({
        line: "What kind of information is the teacher collecting?",
        visual: () => <AttendanceBoard />,
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
        render: (api) => (
          <ToggleStage
            api={api}
            items={[
              { id: "a", title: "Student attendance", on: "Present", off: "Absent", icon: P.programmer },
              { id: "b", title: "Payment confirmation", on: "Complete", off: "Pending", icon: P.float },
              { id: "c", title: "Login status", on: "Logged in", off: "Logged out", icon: P.computer },
              { id: "d", title: "Light switch", on: "On", off: "Off", icon: P.idea },
            ]}
          />
        ),
      },
      quiz({
        line: "What do these situations have in common?",
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
        render: (api) => (
          <RevealStage
            api={api}
            columns={2}
            header={() => (
              <WindowCard title="Student status" icon={<ToggleRight />} panel="gap-[6px] pt-3 pr-[21px] pb-3.5 pl-[21px]">
                {[
                  ["Is_present", "True"],
                  ["Is_payment_complete", "False"],
                  ["Is_logged_in", "True"],
                ].map(([name, value]) => (
                  <div key={name} className={`flex h-[30px] items-center justify-between px-3 text-[13px] leading-5 font-semibold text-[#151E48] dark:text-white ${WINDOW_ROW}`}>
                    <span className="font-mono">{name}</span>
                    <span className={value === "True" ? "text-[#01A17F]" : "text-[#8A94A0]"}>{value}</span>
                  </div>
                ))}
              </WindowCard>
            )}
            items={[
              { id: "t", label: "TRUE", sub: "light on", icon: P.boolean, caption: "True: Aarav is present." },
              { id: "f", label: "FALSE", sub: "light off", icon: P.stop, caption: "False: Aarav is not present." },
            ]}
            footer={<KeyText>Boolean (bool) represents a logical value: True or False.</KeyText>}
          />
        ),
      },
    ],
  },

  [STEP.fourTypes]: {
    step: STEP.fourTypes,
    title: "You found four *data types!*",
    titleSize: 26,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Tap each card to see its examples.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <RevealStage
            api={api}
            columns={2}
            items={[
              { id: "int", label: "Integer", sub: "int", icon: P.integer, caption: "Whole-number values. Examples: 10, 25, 100." },
              { id: "float", label: "Float", sub: "float", icon: P.float, caption: "Decimal-number values. Examples: 10.5, 25.75, 100.2." },
              { id: "str", label: "String", sub: "str", icon: P.string, caption: "Text information. Examples: Aarav, Delhi, Class 6A." },
              { id: "bool", label: "Boolean", sub: "bool", icon: P.boolean, caption: "Logical values. Examples: True, False." },
            ]}
            footer={<KeyText>A data type tells a program what kind of value it is working with.</KeyText>}
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={150}
            prompt="Drag each card to its type."
            items={[
              { id: "age", label: "Age: 12", bucket: "integer", hint: WHY_WRONG },
              { id: "id", label: "Student ID: “0012”", bucket: "string", hint: "It is written as text, in quotes." },
              { id: "height", label: "Height: 148.5", bucket: "float", hint: "Does it have a decimal part?" },
              { id: "present", label: "Is_present: True", bucket: "boolean", hint: "Is it a yes/no state?" },
            ]}
            buckets={TYPE_BUCKETS}
          />
        ),
      },
      quiz({
        line: "Why is Student ID text, though it has digits?",
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={104}
            prompt="Drag each card to what we do with it."
            items={[
              { id: "nb", label: "Notebook price", sub: "₹50", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "pen", label: "Pen price", sub: "₹20", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "name", label: "Student name", sub: "Aarav", bucket: "display", hint: "A name is text. We show it, we don’t add it." },
            ]}
            buckets={[
              { id: "total", label: "Calculate a total", icon: P.integer },
              { id: "display", label: "Display information", icon: P.statement },
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={104}
            prompt="Drag each card to its type."
            items={[
              { id: "name", label: "Name", sub: "Aarav", bucket: "string", hint: WHY_WRONG },
              { id: "age", label: "Age", sub: "12", bucket: "integer", hint: WHY_WRONG },
              { id: "height", label: "Height", sub: "148.5", bucket: "float", hint: WHY_WRONG },
              { id: "present", label: "Is_present", sub: "True", bucket: "boolean", hint: WHY_WRONG },
              { id: "id", label: "Student ID", sub: "“0012”", bucket: "string", hint: WHY_WRONG },
            ]}
            buckets={TYPE_BUCKETS}
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={150}
            prompt="Drag each field to its data type."
            items={[
              { id: "city", label: "City name", bucket: "string", hint: "A name is text." },
              { id: "temp", label: "Temperature", bucket: "float", hint: "Temperatures can have decimals." },
              { id: "rain", label: "Number of rainy days", bucket: "integer", hint: "Days are counted in whole numbers." },
              { id: "now", label: "Is it raining?", bucket: "boolean", hint: "It is a yes/no state." },
            ]}
            buckets={TYPE_BUCKETS}
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={150}
            prompt="Drag each field to its data type."
            items={[
              { id: "city", label: "City", sub: "Delhi", bucket: "string", hint: "A name is text." },
              { id: "temp", label: "Temperature", sub: "28.5°C", bucket: "float", hint: "It has a decimal part." },
              { id: "rain", label: "Rainy days", sub: "3", bucket: "integer", hint: "A whole number of days." },
              { id: "now", label: "Is raining", sub: "False", bucket: "boolean", hint: "It is a yes/no state." },
            ]}
            buckets={TYPE_BUCKETS}
            after={<WeatherCard />}
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
        visual: () => <TypedCards />,
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
        alignTop: true,
        render: (api) => <ChooseTypeStage api={api} field="Height" value="148.5" from="Integer" correct="float" hint="Which type holds decimal numbers?" />,
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
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={104}
            prompt="Drag each card to its type."
            items={[
              { id: "name", label: "Player name", sub: "ShadowX", bucket: "string", hint: WHY_WRONG },
              { id: "score", label: "Current score", sub: "1250", bucket: "integer", hint: WHY_WRONG },
              { id: "percent", label: "Completion %", sub: "87.5", bucket: "float", hint: WHY_WRONG },
              { id: "done", label: "Level completed?", sub: "False", bucket: "boolean", hint: WHY_WRONG },
              { id: "id", label: "Player ID", sub: "“G007”", bucket: "string", hint: WHY_WRONG },
            ]}
            buckets={TYPE_BUCKETS}
          />
        ),
      },
      quiz({
        line: "Why is Player ID a String rather than an Integer?",
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
