"use client";

import type { ReactNode } from "react";
import { GroupStage, type GroupItem } from "./GroupStage";
import { ToggleRight } from "lucide-react";
import { FloatLesson } from "./FloatLesson";
import { GroupTourStage, type TourGroup } from "./GroupTourStage";
import { BADGE, INK, TINTS, tintAt } from "./look";
import { ChooseTypeStage, MultiPickStage, RevealStage, SortStage, TYPES, ToggleStage, type SortBucket } from "./interactions";
import { noteGrouping } from "./datatypesScore";
import { P } from "./pictures";
import type { Option, QuizStage, ScreenDef } from "./screen";
import { STEP } from "./datatypes";
import { WINDOW_ROW, WindowCard } from "./WindowCard";
import { AttendanceBoard, EventScene, InfoRows, InfoTiles, IntegerLesson, NamesScene, RegisteredStudents, SchoolScene, StudentProfileCard, TwelveCards, TypedCards, WeatherCard, type ExampleTile, type InfoRow, type InfoTile } from "./visuals";

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

const WHY_WRONG = "Look at what each value is. Is it a quantity, a decimal, text or a logical state?";

/** Screen 3's nine values, in the order of the design's grid (their tints only tell them apart). */
const SIMILAR_VALUES: readonly GroupItem[] = [
  { id: "12", label: "12", tint: "blue" },
  { id: "25", label: "25", tint: "lavender" },
  { id: "aarav", label: "Aarav", tint: "green" },
  { id: "148.5", label: "148.5", tint: "cream" },
  { id: "kabir", label: "Kabir", tint: "blue" },
  { id: "mia", label: "Mia", tint: "cream" },
  { id: "162", label: "162", tint: "lavender" },
  { id: "40", label: "40", tint: "cream" },
  { id: "156", label: "156", tint: "green" },
];

/** Screen 4's three groups: what each holds, and what Hex says about it once it is tapped. */
const TOUR_GROUPS: readonly TourGroup[] = [
  { id: "a", name: "Group A", tint: "lavender", ink: INK.violet, values: ["Aarav", "Kabir", "Mia"], caption: "These values identify people using their names.", hex: "left" },
  { id: "b", name: "Group B", tint: "cream", ink: INK.orange, values: ["12", "25", "40"], caption: "These values represent quantities or amounts.", hex: "center" },
  { id: "c", name: "Group C", tint: "blue", ink: INK.blue, values: ["Yes", "No", "Yes"], caption: "These values tell us whether something is true or false.", hex: "right" },
];

/** Screen 5's three details of the event (the icons are screen 2's, the same files). */
const PLAN_TILES: readonly InfoTile[] = [
  { id: "students", text: "Students Registered?", icon: P.planStudents, tint: TINTS.green },
  { id: "tickets", text: "Tickets Sold?", icon: P.planTickets, tint: TINTS.cream },
  { id: "prizes", text: "Prizes Available?", icon: P.planPrizes, tint: TINTS.lavender },
];

/** Screen 5.2's three values, each under its number badge (the badges' colours go with the tints). */
const SIMILAR_TILES: readonly InfoTile[] = [
  { id: "students", text: "Students", icon: P.similarStudents, tint: TINTS.green },
  { id: "tickets", text: "Tickets", icon: P.similarTickets, tint: TINTS.cream },
  { id: "prices", text: "Prices", icon: P.similarPrices, tint: TINTS.blue },
];

/** The three questions under screen 5's tiles (the same icons as the tiles). */
const PLAN_ROWS: readonly InfoRow[] = [
  { id: "students", text: "How many students registered?", icon: P.planStudents },
  { id: "tickets", text: "How many tickets were sold?", icon: P.planTickets },
  { id: "prizes", text: "How many prizes are available?", icon: P.planPrizes },
];

/** Screen 5.2's four answers (what the values share), with pictures that don't hint at the right one. The first is right. */
const SIMILAR_OPTIONS = neutral(["They represent quantities.", "They represent people’s names.", "They represent colours.", "They represent yes/no answers."]);

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
    title: "What details are *needed?*",
    backdrop: <EventScene />,
    stages: [
      quiz({
        line: "Student details are needed before the school event begins.",
        layout: "grid",
        optionsAfterHex: true,
        options: [
          { id: "name", text: "Name", icon: P.needName, tint: TINTS.blue },
          { id: "age", text: "Age", icon: P.needAge, tint: TINTS.green },
          { id: "height", text: "Height", icon: P.needHeight, tint: TINTS.cream },
          { id: "all", text: "All", icon: P.needAll, tint: TINTS.lavender },
        ],
        correctId: "all",
        rightTitle: "Exactly!",
        right: "The event needs every detail: a name, an age and a height.",
        wrong: "Look at the registration form. How many details does it ask for?",
      }),
    ],
  },

  [STEP.meetAarav]: {
    step: STEP.meetAarav,
    title: "What do you *notice?*",
    stages: [
      quiz({
        line: "Notice the difference among his details!",
        visual: () => <StudentProfileCard />,
        optionsAfterHex: true,
        options: [
          { id: "same", text: "They all look same", icon: P.lookSame },
          { id: "different", text: "They are different from each other", icon: P.lookDifferent },
          { id: "numbers", text: "They are all numbers", icon: P.allNumbers },
        ],
        correctId: "different",
        rightTitle: "Exactly!",
        right: "A name, an age, a height and a permission: each detail is a different kind of information.",
        wrong: "Compare the details one by one. Is a name like an age?",
        hintText: "Read each detail on the profile. Do they all look alike?",
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
        line: "Explore these values and find which ones belong together.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => <GroupStage api={api} items={SIMILAR_VALUES} onSorted={noteGrouping} />,
        finishPanel: { title: "Interesting!", text: "You started grouping information by what it represents. Let's look at your groups." },
      },
    ],
  },

  [STEP.groups]: {
    step: STEP.groups,
    title: "Information can *differ!*",
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
    ],
  },

  // Screen 5 is only looked at: Hex says his line, the cards bounce in, and Continue waits for him. Then 5.2 is a question.
  [STEP.counting]: {
    step: STEP.counting,
    title: "Let’s *plan* a school event!",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "You need to know few details for this event",
        bubbleWidth: 190,
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => (
          <div className="flex flex-col items-center gap-6">
            <InfoTiles layout="row" shown={hexSpoken} tiles={PLAN_TILES} />
            <InfoRows rows={PLAN_ROWS} shown={hexSpoken} firstIndex={PLAN_TILES.length} />
          </div>
        ),
      },
      // 5.2: the same school yard, a new heading, and a question: the three values stand above the four answers.
      quiz({
        title: "How are they *similar?*",
        titleSize: 28,
        line: "Look closely and find what these values share.",
        visual: ({ hexSpoken = true }) => <InfoTiles layout="row" shown={hexSpoken} tiles={SIMILAR_TILES} />,
        options: SIMILAR_OPTIONS,
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "These numbers represent quantities that we can count.",
        wrong: "Look closely at the values. What do they all tell us?",
        nextLabel: "Continue",
      }),
    ],
  },

  [STEP.wholeDecimal]: {
    step: STEP.wholeDecimal,
    title: "Look at these *numbers*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Here are some values from different situations.",
        bubbleWidth: 190,
        alignTop: true,
        ready: true,
        render: ({ hexSpoken }) => <InfoTiles layout="grid" shown={hexSpoken} tiles={VALUE_TILES} />,
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
        wrong: "Does 148.5 have a decimal part? Which type holds decimals?",
      }),
    ],
  },

  [STEP.classifyNumbers]: {
    step: STEP.classifyNumbers,
    title: "Sort the *numbers!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Drag each number to Integer or Float.",
        bubbleWidth: 190,
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
        finishPanel: { title: "Excellent!", text: "You can now tell whole numbers from decimal numbers." },
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
    title: "Which ones are *text?*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Which of these can be treated as text? Tap them.",
        bubbleWidth: 190,
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
            footer={<Note>A value is not a number just because it has digits. A phone number or a student ID identifies someone: we don’t add or subtract it.</Note>}
          />
        ),
        finishPanel: { title: "All of them!", text: "Text can contain letters, numbers, spaces and special characters." },
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
        line: "Information that is text is called a String.",
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
            footer={<Key>String (str) represents text information.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.twelve]: {
    step: STEP.twelve,
    title: "Same look, *same type?*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Add 12 and 3 as numbers. What do we get?",
        visual: ({ attempt }) => <TwelveCards mode="numbers" replay={attempt} />,
        layout: "grid",
        options: tinted(neutral(["9", "15", "123", "36"])),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "As numbers, 12 + 3 = 15.",
        wrong: "Add the two numbers: 12 and 3.",
      }),
      quiz({
        line: "Now join the text “12” and the text “3”. What text do we get?",
        visual: ({ attempt }) => <TwelveCards mode="text" replay={attempt} />,
        layout: "grid",
        options: tinted(neutral(["“15”", "“123”", "“312”", "“9”"])),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "A value's look doesn't always tell its type. We must know what it means.",
        wrong: "Joining text puts the characters side by side.",
      }),
    ],
  },

  [STEP.attendance]: {
    step: STEP.attendance,
    title: "Check the *attendance!*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      quiz({
        line: "What kind of information is the teacher collecting?",
        visual: () => <AttendanceBoard />,
        options: options([
          ["A person's name.", P.string],
          ["A numerical quantity.", P.integer],
          ["A yes/no status.", P.boolean],
          ["A decimal measurement.", P.float],
        ]),
        correctId: at(2),
        rightTitle: "Exactly!",
        right: "This information tells us whether something is true or false.",
        wrong: "How many different answers are possible: present or absent?",
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
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <ToggleStage
            api={api}
            items={[
              { id: "a", title: "Student attendance", on: "Present", off: "Absent", icon: P.programmer },
              { id: "b", title: "Payment", on: "Complete", off: "Pending", icon: P.float },
              { id: "c", title: "Login status", on: "Logged in", off: "Logged out", icon: P.computer },
              { id: "d", title: "Light switch", on: "On", off: "Off", icon: P.idea },
            ]}
          />
        ),
      },
      quiz({
        line: "What do all these situations have in common?",
        options: options([
          ["Each has two possible states.", P.boolean],
          ["Each is a number.", P.integer],
          ["Each is a name.", P.string],
          ["Each is a decimal value.", P.float],
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
        line: "Information with only two values is a Boolean: True or False.",
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
            footer={<Key>Boolean (bool) represents a logical value: True or False.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.fourTypes]: {
    step: STEP.fourTypes,
    title: "Four *data types!*",
    titleSize: 28,
    backdrop: <SchoolScene />,
    stages: [
      {
        kind: "interaction",
        line: "Tap each card to see what it holds.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <RevealStage
            api={api}
            columns={2}
            items={[
              { id: "int", label: "Integer", sub: "int", icon: P.integer, caption: "Whole-number values: 10, 25, 100." },
              { id: "float", label: "Float", sub: "float", icon: P.float, caption: "Decimal-number values: 10.5, 25.75, 100.2." },
              { id: "str", label: "String", sub: "str", icon: P.string, caption: "Text information: Aarav, Delhi, Class 6A." },
              { id: "bool", label: "Boolean", sub: "bool", icon: P.boolean, caption: "Logical values: True, False." },
            ]}
            footer={<Key>A data type tells a program what kind of value it is working with.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.beyond]: {
    step: STEP.beyond,
    title: "Look beyond *looks!*",
    titleSize: 28,
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
        line: "Why is Student ID text, even though it has digits?",
        options: neutral(["It identifies a student.", "It is a decimal number.", "It is a height.", "It is True or False."]),
        correctId: at(0),
        rightTitle: "Because it identifies a student.",
        right: "It's not a quantity we calculate. It also keeps the leading zero.",
        wrong: "Are we calculating a student's ID, or using it to identify them?",
      }),
    ],
  },

  [STEP.shopping]: {
    step: STEP.shopping,
    title: "Data decides *its use!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Which values can we add up? Drag each to its use.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => (
          <SortStage
            api={api}
            cardWidth={104}
            prompt="Drag each card to what we do with it."
            items={[
              { id: "nb", label: "Notebook price", sub: "₹50", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "pen", label: "Pen price", sub: "₹20", bucket: "total", hint: "A price is a number, so we can add it." },
              { id: "name", label: "Student name", sub: "Aarav", bucket: "display", hint: "A name is text. We show it, we don't add it." },
            ]}
            buckets={[
              { id: "total", label: "Calculate a total", icon: P.integer },
              { id: "display", label: "Display information", icon: P.statement },
            ]}
          />
        ),
        finishPanel: { title: "Nice!", text: "Prices are numbers, so we add them. A name is text, so we show it." },
      },
    ],
  },

  [STEP.profile]: {
    step: STEP.profile,
    title: "Organise *Aarav's info!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Drag each piece of information to its type.",
        bubbleWidth: 190,
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
        finishPanel: { title: "Great!", text: "You organised the student's information by its data type." },
      },
    ],
  },

  [STEP.weather]: {
    step: STEP.weather,
    title: "Build a *weather app!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "What kind of data should each field use?",
        bubbleWidth: 190,
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
        finishPanel: { title: "Excellent!", text: "Your app needs four different kinds of information." },
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
        finishPanel: { title: "Perfect!", text: "You know what kind of information each part needs." },
      },
    ],
  },

  [STEP.debug]: {
    step: STEP.debug,
    title: "Find the *mistake!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Which field has been classified incorrectly?",
        visual: () => <TypedCards />,
        layout: "grid",
        options: tinted([
          { id: "name", text: "Name.", icon: P.statement },
          { id: "age", text: "Age.", icon: P.question },
          { id: "height", text: "Height.", icon: P.idea },
          { id: "present", text: "Is_present.", icon: P.command },
        ]),
        correctId: "height",
        rightTitle: "Exactly!",
        right: "148.5 has a decimal part, so it should be a Float, not an Integer.",
        wrong: "Look carefully at the height value. Does it have a decimal part?",
      }),
      {
        kind: "interaction",
        line: "Now replace the wrong type with the right one.",
        bubbleWidth: 190,
        alignTop: true,
        render: (api) => <ChooseTypeStage api={api} field="Height" value="148.5" from="Integer" correct="float" hint="Which type holds decimal numbers?" />,
        finishPanel: { title: "Fixed!", text: "Height is now a Float." },
      },
    ],
  },

  [STEP.game]: {
    step: STEP.game,
    title: "Sort a *game profile!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "Sort the five values of the player's profile by type.",
        bubbleWidth: 190,
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
        options: neutral(["It identifies a player, not a quantity.", "It is a decimal number.", "It is a yes/no value.", "It is a very big number."]),
        correctId: at(0),
        rightTitle: "Excellent!",
        right: "You applied data type thinking to a completely different app.",
        wrong: "Is it a quantity we calculate, or a name for a player?",
      }),
    ],
  },

  [STEP.reflectInt]: {
    step: STEP.reflectInt,
    title: "Test your *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "Which data type suits a student's age of 12?",
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
    title: "Test your *thinking!*",
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
    title: "Test your *thinking!*",
    titleSize: 28,
    stages: [
      quiz({
        line: "The student ID is “0045”. Why should it be treated as text?",
        options: neutral(["It identifies a student.", "It represents a height.", "It is a decimal number.", "It represents True or False."]),
        correctId: at(0),
        rightTitle: "Correct!",
        right: "It identifies a student. It isn't a quantity we calculate.",
        wrong: "Are we calculating with the ID, or using it to identify someone?",
      }),
    ],
  },

  [STEP.reflectBool]: {
    step: STEP.reflectBool,
    title: "Test your *thinking!*",
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
    title: "Test your *thinking!*",
    titleSize: 28,
    stages: [
      {
        kind: "interaction",
        line: "An app needs a city name, a temperature and a rain status. Which types fit?",
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
        finishPanel: { title: "Correct!", text: "City name: String. Temperature: Float. Rain status: Boolean." },
      },
    ],
  },
};
