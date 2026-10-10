import type { LucideIcon } from "lucide-react";
import { HEX_SCENE, type HexScene } from "@/lib/rive/runtime";

/** One highlighted (or plain) run of text — headings/bubbles are built from
 * a small array of these instead of a single string + one "highlight this
 * substring" prop, so a line can carry more than one highlighted span (the
 * reference designs' bubbles often do — a highlighted noun *and* a
 * bracket-styled placeholder in the same line). */
export interface TextSpan {
  text: string;
  /** Styled like the reference's teal keyword highlights. */
  highlight?: boolean;
}

/** Answers accumulate across the flow — later steps' text and options read
 * from this to personalize themselves (the reference design's "{career}"/
 * "{careerTitle}" placeholders). */
export interface OnboardingAnswers {
  name?: string;
  career?: string;
  experience?: string;
  pythonLevel?: string;
  motivation?: string;
  timeCommitment?: string;
  learningTime?: string;
  startingPoint?: string;
}

export interface OnboardingListOption {
  id: string;
  label: string;
  /** Either a small icon (shown in a mint circle) or a picture (`image`,
   * shown as-is) — see QuestionListScreen. */
  icon?: LucideIcon;
  image?: string;
  /** Tiles variant: the one-line-label layout (8px/18px padding, top-aligned,
   * 17px label line) the reference gives the DevOps tile. */
  compact?: boolean;
  /** One line shown with Zox once the option is picked (tiles variant). */
  description?: string;
}

export interface OnboardingGridOption {
  id: string;
  label: string;
  /** Which built-in illustration slot this option uses — see
   * QuestionGridScreen's own ILLUSTRATIONS map. The reference design reuses
   * the same 4 illustrations for both grid questions (experience level,
   * Python level), just relabeled, so this is shared rather than
   * per-question. */
  illustration: "books" | "mobile" | "chart" | "trophy";
  /** A full-bleed picture for the tile's top panel (drawn at the panel's
   * own 169:134 shape) — takes the place of the `illustration` icon. */
  image?: string;
}

export const CAREER_OPTIONS: OnboardingListOption[] = [
  {
    id: "software-engineer",
    label: "Software Engineer",
    image: "/images/screen-01/01-1.png",
    description: "Build apps, websites & systems people use every day.",
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    image: "/images/screen-01/01-2.png",
    description: "Work with data, build models & solve real world problems.",
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    image: "/images/screen-01/01-3.png",
    description: "Turn data into insights and dashboards that drive decisions.",
  },
  {
    id: "devops-cloud",
    label: "DevOps",
    image: "/images/screen-01/01-4.png",
    compact: true,
    description:
      "Automate deployments and keep cloud systems running smoothly.",
  },
  {
    id: "cybersecurity",
    label: "Cyber Security",
    image: "/images/screen-01/01-5.png",
    description: "Protect systems and data from threats and attacks.",
  },
  {
    id: "automation-scripting",
    label: "Automation & Scripting",
    image: "/images/screen-01/01-6.png",
    description: "Write scripts that take over repetitive tasks for you.",
  },
  // Hidden for now — the career question is six options, two per row.
  // {
  //   id: "not-sure",
  //   label: "Not sure yet",
  //   image: "/images/screen-01/01-7.png",
  //   description:
  //     "No worries, we'll start with Python basics useful on any path.",
  // },
];

export const MOTIVATION_OPTIONS: OnboardingListOption[] = [
  {
    id: "switching-careers",
    label: "Switching careers into tech",
    image: "/images/screen-04/04-1.png",
  },
  {
    id: "first-tech-job",
    label: "Landing my first job",
    image: "/images/screen-04/04-2.png",
  },
  {
    id: "promotion",
    label: "Leveling up / Promotion",
    image: "/images/screen-04/04-3.png",
  },
  {
    id: "personal-project",
    label: "Personal project",
    image: "/images/screen-04/04-4.png",
  },
  {
    id: "freelance",
    label: "Freelance",
    image: "/images/screen-04/04-5.png",
  },
];

export const STARTING_POINT_OPTIONS: OnboardingListOption[] = [
  {
    id: "basics",
    label: "Start from the basics",
    image: "/images/screen-07/07-1.png",
  },
  {
    id: "skip-ahead",
    label: "Skip ahead, I already know some of this",
    image: "/images/screen-07/07-2.png",
  },
  {
    id: "choose",
    label: "Let me choose where to start",
    image: "/images/screen-07/07-3.png",
  },
];

export const LEARNING_TIME_OPTIONS: OnboardingGridOption[] = [
  {
    id: "morning",
    label: "Morning",
    illustration: "books",
    image: "/images/screen-06/06-1.png",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    illustration: "mobile",
    image: "/images/screen-06/06-2.png",
  },
  {
    id: "evening",
    label: "Evening",
    illustration: "chart",
    image: "/images/screen-06/06-3.png",
  },
  {
    id: "night",
    label: "Night",
    illustration: "trophy",
    image: "/images/screen-06/06-4.png",
  },
];

/** The daily-minutes dial's range and its starting value. */
export const TIME_SLIDER = { min: 1, max: 20, initial: 10 } as const;

export const EXPERIENCE_OPTIONS: OnboardingGridOption[] = [
  {
    id: "none",
    label: "No experience",
    illustration: "books",
    image: "/images/screen-02/02-1.png",
  },
  {
    id: "little",
    label: "A little exposure",
    illustration: "mobile",
    image: "/images/screen-02/02-2.png",
  },
  {
    id: "hands-on",
    label: "Hands-on",
    illustration: "chart",
    image: "/images/screen-02/02-3.png",
  },
  {
    id: "professional",
    label: "Professional",
    illustration: "trophy",
    image: "/images/screen-02/02-4.png",
  },
];

export const PYTHON_LEVEL_OPTIONS: OnboardingGridOption[] = [
  {
    id: "never",
    label: "Never used",
    illustration: "books",
    image: "/images/screen-03/03-1.png",
  },
  {
    id: "basics",
    label: "Know the basics",
    illustration: "mobile",
    image: "/images/screen-03/03-2.png",
  },
  {
    id: "hands-on-coder",
    label: "Hands-on coder",
    illustration: "chart",
    image: "/images/screen-03/03-3.png",
  },
  {
    id: "professional",
    label: "Professional",
    illustration: "trophy",
    image: "/images/screen-03/03-4.png",
  },
];

/** Every career in this flow leads to the same language track — the
 * reference design only ever shows a Python path (screen 11: "your [career
 * path] journey runs on Python"), so there's no real per-career mapping to
 * reproduce yet. Kept as a lookup (not a bare constant) so a real per-career
 * mapping can slot in later without touching any screen. */
export function languageForCareer(_career: string | undefined): string {
  return "Python";
}

/** "Good news: your {career} path…" voiceover per career — files in
 * `public/audios/good_news`, named GN + the career's initials. */
const GOOD_NEWS_AUDIO: Record<string, string> = {
  "software-engineer": "/audios/good_news/GNSE.m4a",
  "data-scientist": "/audios/good_news/GNDS.m4a",
  "data-analyst": "/audios/good_news/GNDA.m4a",
  "devops-cloud": "/audios/good_news/GNDOCE.m4a",
  cybersecurity: "/audios/good_news/GNCS.m4a",
  "automation-scripting": "/audios/good_news/GNAMS.m4a",
};

/** Screen 8's "…with {career} in mind" voiceover, per Python level + career
 * — files in `public/audios/carrer_mind`, named level initials + career
 * initials (NUSE = Never Used + Software Engineer). DevOps is spelled
 * inconsistently across the recordings (DOC vs DOCE), so it's per level. */
const CAREER_MIND_LEVEL: Record<string, { code: string; devops: string }> = {
  never: { code: "NU", devops: "DOC" },
  basics: { code: "KB", devops: "DOCE" },
  "hands-on-coder": { code: "HC", devops: "DOC" },
  professional: { code: "P", devops: "DOCE" },
};
const CAREER_MIND_CAREER: Record<string, string> = {
  "software-engineer": "SE",
  "data-scientist": "DS",
  "data-analyst": "DA",
  cybersecurity: "CS",
  "automation-scripting": "AS",
};

function careerMindAudio(a: OnboardingAnswers): readonly string[] | undefined {
  const level = a.pythonLevel ? CAREER_MIND_LEVEL[a.pythonLevel] : undefined;
  if (!level || !a.career) return undefined;
  const career =
    a.career === "devops-cloud" ? level.devops : CAREER_MIND_CAREER[a.career];
  return career
    ? [`/audios/carrer_mind/${level.code}${career}.m4a`]
    : undefined;
}

/** Screen 8's bubble — its wording depends on the Python level answer. */
function careerMindBubble(a: OnboardingAnswers): TextSpan[] {
  const career = { text: careerLabel(a), highlight: true };
  switch (a.pythonLevel) {
    case "basics":
      return [
        { text: "Good, you're not starting from zero. We'll build toward " },
        career,
        { text: " from here." },
      ];
    case "hands-on-coder":
      return [
        { text: "Nice, we'll skip the basics and get you into real " },
        career,
        { text: " work." },
      ];
    case "professional":
      return [
        {
          text: "Got it, we'll go deep and sharpen your skills specifically for ",
        },
        career,
        { text: "." },
      ];
    default:
      return [
        { text: "Perfect starting point. We'll build your " },
        { text: `${languageForCareer(a.career)} foundation`, highlight: true },
        { text: " with " },
        career,
        { text: " in mind." },
      ];
  }
}

function careerLabel(answers: OnboardingAnswers): string {
  if (answers.career === "not-sure") return "Programming";
  return (
    CAREER_OPTIONS.find((c) => c.id === answers.career)?.label ?? "your career"
  );
}

/** Voiceover clips (in `public/audios`) played back-to-back when a screen
 * appears — see useVoiceover. A function when the clip depends on earlier
 * answers (e.g. one recording per career). */
export type StepVoiceover =
  | readonly string[]
  | ((answers: OnboardingAnswers) => readonly string[] | undefined);

export function resolveVoiceover(
  voiceover: StepVoiceover | undefined,
  answers: OnboardingAnswers,
): readonly string[] | undefined {
  return typeof voiceover === "function" ? voiceover(answers) : voiceover;
}

/** The `Onboarding` state machine triggers a fox-message screen can fire. */
export type HexOnboardingBeat =
  | "hi"
  | "ready"
  | "celebrate"
  | "buildCareerPath"
  | "showQuestion";

/**
 * How a question's Hex reacts. "onboarding": the `Onboarding` state machine,
 * `showQuestion` as the question appears and `selectOption` on each pick.
 * "reactions": the reactions artboard, reacting to which option (1-4) was
 * picked. Unset: the tablet poses.
 */
export type QuestionHexMode = "onboarding" | "reactions";

export type OnboardingStep =
  | {
      kind: "fox-message";
      id: string;
      /** Optional heading. Where it goes is `headingPlacement`; the bubble
       * always sits on the opposite side of the fox. With no heading, the
       * bubble sits above the fox ("Hey! I am foxy", "Perfect starting
       * point"). */
      heading?: (answers: OnboardingAnswers) => TextSpan[];
      /** "bottom": bubble above the fox, heading below it ("Are you ready?",
       * "Building Career Path..."). Defaults to "top" (heading above, bubble
       * below the fox). */
      headingPlacement?: "top" | "bottom";
      /** Small sparkle accent next to the heading — only the two headed
       * variants above have it in the reference. */
      sparkle?: boolean;
      /** The pair of purple "?" marks flanking the fox — only screen 8/9's
       * question intro uses this, not the fox-message screens; kept here
       * for completeness even though no current step sets it. */
      questionMarks?: boolean;
      bubble: (answers: OnboardingAnswers) => TextSpan[];
      /** Fox waves hello once when the screen appears — only the "Hey! I am
       * foxy" greeting does. */
      greet?: boolean;
      /** Fox plays its "excitement" state machine once all the screen's text
       * has typed out — or, with `voiceReads: "heading"`, as soon as the
       * heading has, together with the bubble typing ("Are you ready?"). */
      excite?: boolean;
      voiceover?: StepVoiceover;
      /** Whether the voiceover also reads the heading (default true). When
       * false, the heading shows in full and only the bubble types along. */
      voiceReadsHeading?: boolean;
      /** What the voiceover reads. "all" (default): the bubble, plus the
       * heading if there is one — everything types along with it once the
       * bubble has popped in. "heading": only the heading — it types along
       * with the voice first, then the bubble pops in and types quickly
       * ("Are you ready?"). */
      voiceReads?: "all" | "heading";
      /** Types at this fixed ms-per-character instead of following the
       * voice, and the fox talks only while it types. For clips with a
       * silent tail, where voice-synced typing (and the mouth) would run on. */
      typeSpeedMs?: number;
      /** Plays Hex's `Onboarding` state machine on this screen and fires this
       * trigger on it — on arrival, or with `excite` at the excitement moment
       * instead. Replaces the `greet` / `excite` poses. */
      hexBeat?: HexOnboardingBeat;
      /** Plays this full-screen Hex artboard instead of the flow's fox and
       * the bubble — the artboard has its own text ("You're all set!"). */
      hexScene?: HexScene;
      cta: string;
    }
  | {
      kind: "notification-permission";
      id: string;
      heading: string;
      cta: string;
    }
  | {
      kind: "name-input";
      id: string;
      /** The bubble's question, above the text field. */
      prompt: string;
      cta: string;
    }
  | {
      kind: "time-slider";
      id: string;
      heading: (answers: OnboardingAnswers) => TextSpan[];
      /** The note under the dial; `{minutes}` is the picked value. */
      note: string;
      answerKey: keyof OnboardingAnswers;
      cta: string;
    }
  | {
      kind: "streak";
      id: string;
      heading: (answers: OnboardingAnswers) => TextSpan[];
      /** The home-screen mockup with the streak widget. */
      image: string;
      cta: string;
    }
  | {
      kind: "question-list";
      id: string;
      /** "tiles": no Zox, a centered heading and a 3-column grid of icon
       * tiles (the career question). Default is the row list. */
      variant?: "tiles";
      /** "row": Zox beside the heading instead of below it. */
      zoxLayout?: "row";
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingListOption[];
      answerKey: keyof OnboardingAnswers;
      voiceover?: StepVoiceover;
      hexMode?: QuestionHexMode;
      cta: string;
    }
  | {
      kind: "question-grid";
      id: string;
      /** "row": Zox beside the heading instead of below it. */
      zoxLayout?: "row";
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingGridOption[];
      answerKey: keyof OnboardingAnswers;
      voiceover?: StepVoiceover;
      hexMode?: QuestionHexMode;
      cta: string;
    };

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    kind: "fox-message",
    id: "greeting",
    bubble: () => [{ text: "Hey! I am Zox,\nyour skills buddy" }],
    hexBeat: "hi",
    voiceover: ["/audios/text-1.mpeg"],
    typeSpeedMs: 70,
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "ready-check",
    heading: () => [
      {
        text: "Before your first lesson, a few quick questions to personalize your path.",
      },
    ],
    headingPlacement: "bottom",
    sparkle: true,
    excite: true,
    hexBeat: "ready",
    voiceover: ["/audios/text-2-screen.mpeg"],
    voiceReads: "heading",
    bubble: () => [{ text: "Are you ready?" }],
    cta: "Yes!",
  },
  {
    kind: "question-list",
    id: "career",
    variant: "tiles",
    heading: () => [
      { text: "What's the " },
      { text: "career", highlight: true },
      { text: " you're chasing?" },
    ],
    options: CAREER_OPTIONS,
    answerKey: "career",
    hexMode: "onboarding",
    voiceover: [
      "/audios/screen-1-question.mpeg",
      "/audios/screen-1-options.mpeg",
    ],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "good-news",
    bubble: (a) => [
      { text: "Good news: your " },
      { text: `${careerLabel(a)} path`, highlight: true },
      { text: " journey runs on " },
      { text: languageForCareer(a.career), highlight: true },
      { text: ". One of the most in-demand languages." },
    ],
    voiceover: (a) => {
      const src = a.career ? GOOD_NEWS_AUDIO[a.career] : undefined;
      return src ? [src] : undefined;
    },
    voiceReadsHeading: false,
    hexBeat: "celebrate",
    cta: "Yes!",
  },
  {
    kind: "question-grid",
    id: "pythonLevel",
    heading: (a) => [
      { text: "What's your " },
      { text: languageForCareer(a.career), highlight: true },
      { text: " superpower " },
      { text: "level", highlight: true },
      { text: "?" },
    ],
    options: PYTHON_LEVEL_OPTIONS,
    answerKey: "pythonLevel",
    hexMode: "reactions",
    voiceover: ["/audios/WYP_Ques.m4a", "/audios/WYP_Options.m4a"],
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "experience",
    heading: () => [
      { text: "Have you " },
      { text: "worked", highlight: true },
      { text: " with code before?" },
    ],
    options: EXPERIENCE_OPTIONS,
    answerKey: "experience",
    hexMode: "reactions",
    voiceover: ["/audios/HYW_Ques.m4a", "/audios/HYW_Options.m4a"],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "starting-point",
    heading: () => [{ text: "Building Career Path..." }],
    headingPlacement: "bottom",
    sparkle: true,
    hexBeat: "buildCareerPath",
    bubble: careerMindBubble,
    voiceover: careerMindAudio,
    voiceReadsHeading: false,
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "foundation",
    bubble: () => [
      {
        text: "Smart, a strong foundation makes everything after this easier. Starting from ",
      },
      { text: "Module 1", highlight: true },
      { text: "." },
    ],
    hexBeat: "showQuestion",
    cta: "Yes!",
  },
  {
    kind: "fox-message",
    id: "all-set",
    bubble: () => [
      { text: "ALL SET!\nYour " },
      { text: "programming journey", highlight: true },
      { text: " begins here." },
    ],
    hexScene: HEX_SCENE.onboardingComplete,
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "module-1",
    bubble: () => [
      { text: "Your first stop:\n" },
      { text: "Module 1", highlight: true },
    ],
    hexBeat: "showQuestion",
    cta: "Next",
  },
  {
    kind: "name-input",
    id: "name",
    prompt: "What should I call you?",
    cta: "Continue",
  },
  {
    kind: "question-list",
    id: "motivation",
    zoxLayout: "row",
    heading: () => [
      { text: "What do you wish to " },
      { text: "achieve", highlight: true },
      { text: "?" },
    ],
    options: MOTIVATION_OPTIONS,
    answerKey: "motivation",
    hexMode: "onboarding",
    cta: "Continue",
  },
  {
    kind: "time-slider",
    id: "timeCommitment",
    heading: (a) => [
      { text: "How much " },
      { text: "time", highlight: true },
      { text: ` can you give ${careerLabel(a)} each day?` },
    ],
    note: "Even {minutes} minutes a day can build a great habit!",
    answerKey: "timeCommitment",
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "pace-great",
    bubble: (a) => [
      {
        text: "GREAT!\nAt this pace, you'll finish your first 3 lessons toward ",
      },
      { text: careerLabel(a), highlight: true },
      { text: " this week." },
    ],
    hexBeat: "showQuestion",
    cta: "Yes!",
  },
  {
    kind: "question-grid",
    id: "learningTime",
    zoxLayout: "row",
    heading: (a) => [
      { text: "What is the " },
      { text: "best time", highlight: true },
      { text: ` in a day for you to learn ${careerLabel(a)}?` },
    ],
    options: LEARNING_TIME_OPTIONS,
    answerKey: "learningTime",
    hexMode: "onboarding",
    cta: "Continue",
  },
  {
    kind: "notification-permission",
    id: "notifications",
    heading: "Get notified when it’s time to learn.",
    cta: "Allow Notifications",
  },
  {
    kind: "streak",
    id: "streak",
    heading: () => [
      { text: "Let’s keep your " },
      { text: "coding streak", highlight: true },
      { text: " going! Stay one tap away from your next lesson." },
    ],
    image: "/images/codingStreak/codingStreak-3.png",
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "three-months",
    bubble: (a) => [
      {
        text: "In 3 months, you could be well past the basics and building real ",
      },
      { text: careerLabel(a), highlight: true },
      { text: " projects on your own." },
    ],
    hexBeat: "showQuestion",
    cta: "Yes!",
  },
  {
    kind: "question-list",
    id: "startingPoint",
    heading: (a) => [
      { text: "How do you want to begin your " },
      { text: careerLabel(a), highlight: true },
      { text: " path?" },
    ],
    options: STARTING_POINT_OPTIONS,
    answerKey: "startingPoint",
    hexMode: "onboarding",
    cta: "Continue",
  },
];
