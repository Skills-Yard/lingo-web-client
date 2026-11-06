"use client";

import type { ReactNode } from "react";
import { ChooseTypeStage, MultiPickStage, RevealStage, SortStage, TYPES, ToggleStage, type SortBucket } from "./interactions";
import { noteGrouping } from "./datatypesScore";
import { P } from "./pictures";
import type { Option, QuizStage, ScreenDef } from "./screen";
import { STEP } from "./datatypes";
import { AttendanceBoard, CARD, CountScene, CREAM, LAVENDER, NamesList, NumberLine, RulerScale, TwelveCards, TypedCards, WeatherCard } from "./visuals";

/** Answers: an id for each (their place), their words and a picture. */
const options = (rows: readonly (readonly [string, string])[]): Option[] => rows.map(([text, icon], index) => ({ id: String(index), text, icon }));
const at = (index: number) => String(index);

/** Pictures for answers that mustn't hint at which is right. */
const NEUTRAL = [P.order, P.actions, P.goal, P.short] as const;
const neutral = (texts: readonly string[]) => options(texts.map((text, index) => [text, NEUTRAL[index % NEUTRAL.length]] as const));

/** The four types as answers: each always with its own picture. */
const TYPE_OPTIONS: Option[] = TYPES.map((type) => ({ id: type.id, text: type.label, icon: type.icon }));
const TYPE_BUCKETS: readonly SortBucket[] = TYPES.map((type) => ({ id: type.id, label: type.label, icon: type.icon }));

const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", ...stage });

/** The big, plain sentence under a "Meet ..." screen, as on "Meet the Sequence.". */
function Key({ children }: { children: ReactNode }) {
  return <p className="w-[320px] text-center text-[19px] leading-[26px] font-semibold text-[#444444] dark:text-white">{children}</p>;
}

/** A small card with a heading and a list, for the explanations. */
function Note({ children }: { children: ReactNode }) {
  return <p className="w-[320px] rounded-[12px] bg-[#F1EEFF] px-3.5 py-2.5 text-center text-[14px] leading-5 font-medium text-[#444444] dark:bg-[#23204A] dark:text-white">{children}</p>;
}

const WHY_WRONG = "Look at what each value is. Is it a quantity, a decimal, text or a logical state?";

/** Screens that are a headline and one or more stages: the questions and the interactions (the story screens, 1 and 2, are in `storyScreens.tsx`). */
export const SCREENS: Readonly<Record<number, ScreenDef>> = {
  [STEP.sortSimilar]: {
    step: STEP.sortSimilar,
    title: "Let's Find the *Similar Ones!*",
    stages: [
      {
        kind: "interaction",
        line: "Drag the values that belong together into the same group.",
        render: (api) => (
          <SortStage
            api={api}
            mode="free"
            cardWidth={104}
            prompt="Group them any way you think fits."
            items={[
              { id: "12", label: "12", bucket: "" },
              { id: "25", label: "25", bucket: "" },
              { id: "40", label: "40", bucket: "" },
              { id: "aarav", label: "Aarav", bucket: "" },
              { id: "mia", label: "Mia", bucket: "" },
              { id: "kabir", label: "Kabir", bucket: "" },
              { id: "148.5", label: "148.5", bucket: "" },
              { id: "165.2", label: "165.2", bucket: "" },
            ]}
            buckets={[
              { id: "a", label: "" },
              { id: "b", label: "" },
              { id: "c", label: "" },
            ]}
            onSorted={noteGrouping}
          />
        ),
        finishPanel: { title: "Interesting!", text: "You started grouping information by what it represents. Let's look at your groups." },
      },
    ],
  },

  [STEP.groups]: {
    step: STEP.groups,
    title: "Not All Information *Tells Us the Same Thing!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap each group to see what it tells us.",
        render: (api) => (
          <RevealStage
            api={api}
            columns={3}
            items={[
              { id: "a", label: "12, 25, 40", icon: P.integer, caption: "These values represent quantities or amounts." },
              { id: "b", label: "Aarav, Mia, Kabir", icon: P.string, caption: "These values identify people using their names." },
              { id: "c", label: "Yes, No, Yes", icon: P.boolean, caption: "These values tell us whether something is true or false." },
            ]}
          />
        ),
      },
      quiz({
        line: "Are these three groups representing the same kind of information?",
        layout: "grid",
        options: options([
          ["Yes, they are the same.", P.repeat],
          ["No, they are different.", P.think],
        ]),
        correctId: at(1),
        rightTitle: "No!",
        right: "They represent different kinds of information.",
        wrong: "Look at what each group tells us: amounts, names, true or false.",
      }),
    ],
  },

  [STEP.counting]: {
    step: STEP.counting,
    title: "Numbers Help Us *Count Things!*",
    stages: [
      quiz({
        line: "What do all these values have in common?",
        visual: ({ attempt }) => <CountScene replay={attempt} />,
        options: options([
          ["They represent quantities.", P.integer],
          ["They represent people's names.", P.string],
          ["They represent colours.", P.food],
          ["They represent yes/no answers.", P.boolean],
        ]),
        correctId: at(0),
        rightTitle: "Exactly!",
        right: "These numbers represent quantities that we can count.",
        wrong: "Look at what each number counts.",
      }),
    ],
  },

  [STEP.wholeDecimal]: {
    step: STEP.wholeDecimal,
    title: "Look at These *Numbers!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap the values that have a part after the decimal point.",
        render: (api) => (
          <MultiPickStage
            api={api}
            columns={2}
            correct={["h", "w"]}
            hint="Look for the decimal point."
            items={[
              { id: "s", label: "12", sub: "students", icon: P.programmer },
              { id: "t", label: "25", sub: "tickets", icon: P.star },
              { id: "h", label: "148.5", sub: "cm height", icon: P.run },
              { id: "w", label: "36.7", sub: "kg weight", icon: P.rock },
            ]}
            footer={
              <div className="flex w-[330px] flex-col items-center gap-2">
                <div className="grid w-full grid-cols-2 gap-2">
                  <div className={`flex flex-col items-center px-2 py-1.5 ${CARD} ${LAVENDER}`}>
                    <span className="text-[11px] leading-4 font-bold text-[#6B7480] uppercase dark:text-white/60">Whole numbers</span>
                    <span className="text-[16px] leading-6 font-bold text-[#444444] dark:text-white">12, 25</span>
                  </div>
                  <div className={`flex flex-col items-center px-2 py-1.5 ${CARD} ${CREAM}`}>
                    <span className="text-[11px] leading-4 font-bold text-[#6B7480] uppercase dark:text-white/60">With decimal parts</span>
                    <span className="text-[16px] leading-6 font-bold text-[#444444] dark:text-white">148.5, 36.7</span>
                  </div>
                </div>
              </div>
            }
          />
        ),
        finishPanel: { title: "That's right!", text: "148.5 and 36.7 have decimal parts. Some numbers are whole, others have decimal parts." },
      },
    ],
  },

  [STEP.integers]: {
    step: STEP.integers,
    title: "Meet *Integers!*",
    stages: [
      {
        kind: "interaction",
        line: "A whole number, with no decimal part, is an Integer.",
        render: (api) => (
          <RevealStage
            api={api}
            columns={5}
            need={3}
            header={(current) => <NumberLine current={current} />}
            items={[
              { id: "0", label: "0", caption: "Zero: nothing left." },
              { id: "1", label: "1", caption: "One: a single ticket." },
              { id: "12", label: "12", caption: "Number of books: 12" },
              { id: "25", label: "25", caption: "Number of students: 25" },
              { id: "-5", label: "-5", caption: "Temperature change: -5 degrees" },
            ]}
            footer={<Key>Integer (int) represents whole-number values.</Key>}
          />
        ),
      },
    ],
  },

  [STEP.floats]: {
    step: STEP.floats,
    title: "What If We Need *More Precision?*",
    stages: [
      {
        kind: "interaction",
        line: "148.5 cm or 152.8 cm: a whole number isn't enough detail.",
        render: (api) => (
          <RevealStage
            api={api}
            columns={3}
            need={1}
            header={() => <RulerScale />}
            items={[
              { id: "h", label: "148.5", sub: "Height", caption: "Height: 148.5" },
              { id: "w", label: "36.7", sub: "Weight", caption: "Weight: 36.7" },
              { id: "p", label: "49.99", sub: "Price", caption: "Price: 49.99" },
            ]}
            footer={<Key>Numbers with decimal values are called Float.</Key>}
          />
        ),
      },
      quiz({
        line: "A height of 148.5 cm. Which type suits it best?",
        layout: "grid",
        options: TYPE_OPTIONS,
        correctId: "float",
        rightTitle: "Correct!",
        right: "A decimal measurement like 148.5 is a Float.",
        wrong: "Does 148.5 have a decimal part? Which type holds decimals?",
      }),
    ],
  },

  [STEP.classifyNumbers]: {
    step: STEP.classifyNumbers,
    title: "Can You Classify *These Numbers?*",
    stages: [
      {
        kind: "interaction",
        line: "Drag each number to Integer or Float.",
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

  [STEP.names]: {
    step: STEP.names,
    title: "Can a Program Understand *Names Too?*",
    stages: [
      quiz({
        line: "What kind of information are these names?",
        visual: ({ attempt }) => <NamesList replay={attempt} />,
        options: options([
          ["Numerical information.", P.integer],
          ["Textual information.", P.string],
          ["Decimal information.", P.float],
          ["Yes/no information.", P.boolean],
        ]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "These are names written as text.",
        wrong: "Look at the names. Are they numbers?",
      }),
    ],
  },

  [STEP.textLooks]: {
    step: STEP.textLooks,
    title: "Text Is More Than *Just Names!*",
    stages: [
      {
        kind: "interaction",
        line: "Which of these can be treated as text? Tap them.",
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
    stages: [
      {
        kind: "interaction",
        line: "Information that is text is called a String.",
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
    title: "They Look Similar, *But Are They the Same?*",
    stages: [
      quiz({
        line: "Add 12 and 3 as numbers. What do we get?",
        visual: ({ attempt }) => <TwelveCards replay={attempt} />,
        layout: "grid",
        options: neutral(["9", "15", "123", "36"]),
        correctId: at(1),
        rightTitle: "Yes!",
        right: "As numbers, 12 + 3 = 15.",
        wrong: "Add the two numbers: 12 and 3.",
      }),
      quiz({
        line: "Now join the text “12” and the text “3”. What text do we get?",
        visual: ({ attempt }) => <TwelveCards replay={attempt} />,
        layout: "grid",
        options: neutral(["“15”", "“123”", "“312”", "“9”"]),
        correctId: at(1),
        rightTitle: "Exactly!",
        right: "A value's look doesn't always tell its type. We must know what it means.",
        wrong: "Joining text puts the characters side by side.",
      }),
    ],
  },

  [STEP.attendance]: {
    step: STEP.attendance,
    title: "Let's Check Today's *Attendance!*",
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
    title: "Many Applications Need *Yes or No Answers!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap each picture to switch its state.",
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
    stages: [
      {
        kind: "interaction",
        line: "Information with only two values is a Boolean: True or False.",
        render: (api) => (
          <RevealStage
            api={api}
            columns={2}
            header={() => (
              <div className={`flex w-[330px] flex-col gap-0.5 px-3 py-2 ${CARD} ${LAVENDER}`}>
                {[
                  ["Is_present", "True"],
                  ["Is_payment_complete", "False"],
                  ["Is_logged_in", "True"],
                ].map(([name, value]) => (
                  <div key={name} className="flex justify-between text-[13px] leading-5 font-semibold text-[#444444] dark:text-white">
                    <span className="font-mono">{name}</span>
                    <span className={value === "True" ? "text-[#01A17F]" : "text-[#8A94A0]"}>{value}</span>
                  </div>
                ))}
              </div>
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
    title: "You Have Discovered *Four Data Types!*",
    stages: [
      {
        kind: "interaction",
        line: "Tap each card to see what it holds.",
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
    title: "Look Beyond *the Appearance!*",
    stages: [
      {
        kind: "interaction",
        line: "Match each card to its type.",
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
    title: "The Kind of Data *Changes How We Use It!*",
    stages: [
      {
        kind: "interaction",
        line: "Which values can we add up? Drag each to its use.",
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
    title: "Can You Organise *Aarav's Information?*",
    stages: [
      {
        kind: "interaction",
        line: "Drag each piece of information to its type.",
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
    title: "What Information *Does a Weather App Need?*",
    stages: [
      {
        kind: "interaction",
        line: "What kind of data should each field use?",
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
    title: "Plan Before *You Build!*",
    stages: [
      {
        kind: "interaction",
        line: "Choose the type for each field.",
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
    title: "Can You Find *the Mistake?*",
    stages: [
      quiz({
        line: "Which field has been classified incorrectly?",
        visual: () => <TypedCards />,
        layout: "grid",
        options: [
          { id: "name", text: "Name.", icon: P.statement },
          { id: "age", text: "Age.", icon: P.question },
          { id: "height", text: "Height.", icon: P.idea },
          { id: "present", text: "Is_present.", icon: P.command },
        ],
        correctId: "height",
        rightTitle: "Exactly!",
        right: "148.5 has a decimal part, so it should be a Float, not an Integer.",
        wrong: "Look carefully at the height value. Does it have a decimal part?",
      }),
      {
        kind: "interaction",
        line: "Now replace the wrong type with the right one.",
        render: (api) => <ChooseTypeStage api={api} field="Height" value="148.5" from="Integer" correct="float" hint="Which type holds decimal numbers?" />,
        finishPanel: { title: "Fixed!", text: "Height is now a Float." },
      },
    ],
  },

  [STEP.game]: {
    step: STEP.game,
    title: "Let's Organise *a Game Profile!*",
    stages: [
      {
        kind: "interaction",
        line: "Sort the five values of the player's profile by type.",
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
    title: "Test Your *Data Thinking!*",
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
    title: "Test Your *Data Thinking!*",
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
    title: "Test Your *Data Thinking!*",
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
    title: "Test Your *Data Thinking!*",
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
    title: "Test Your *Data Thinking!*",
    stages: [
      {
        kind: "interaction",
        line: "An app needs a city name, a temperature and a rain status. Which types fit?",
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

