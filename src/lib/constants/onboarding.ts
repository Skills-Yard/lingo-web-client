import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  Cloud,
  Code2,
  HelpCircle,
  Lightbulb,
  PieChart,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

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
  { id: "software-engineer", label: "Software Engineer", icon: Code2 },
  { id: "data-scientist", label: "Data Scientist", icon: TrendingUp },
  { id: "data-analyst", label: "Data Analyst", icon: PieChart },
  { id: "devops-cloud", label: "DevOps / Cloud Engineer", icon: Cloud },
  { id: "cybersecurity", label: "Cybersecurity", icon: ShieldCheck },
  { id: "automation-scripting", label: "Automation & Scripting", icon: Bot },
];

export const MOTIVATION_OPTIONS: OnboardingListOption[] = [
  { id: "switching-careers", label: "Switching careers into tech", icon: Briefcase },
  { id: "first-tech-job", label: "Landing my first tech job", icon: Rocket },
  { id: "promotion", label: "Promotion in current role", icon: TrendingUp },
  { id: "personal-project", label: "Personal project or curiosity", icon: Lightbulb },
  { id: "freelance", label: "Freelance / side income", icon: Wallet },
  { id: "not-sure", label: "Not sure yet", icon: HelpCircle },
];

export const STARTING_POINT_OPTIONS: OnboardingListOption[] = [
  { id: "basics", label: "Start from the basics", image: "/images/screen-07/07-1.png" },
  { id: "skip-ahead", label: "Skip ahead, I already know some of this", image: "/images/screen-07/07-2.png" },
  { id: "choose", label: "Let me choose where to start", image: "/images/screen-07/07-3.png" },
];

export const EXPERIENCE_OPTIONS: OnboardingGridOption[] = [
  { id: "none", label: "No", illustration: "books", image: "/images/screen-02/02-1.png" },
  { id: "little", label: "A little exposure", illustration: "mobile", image: "/images/screen-02/02-2.png" },
  { id: "hands-on", label: "Hands-on", illustration: "chart", image: "/images/screen-02/02-3.png" },
  { id: "professional", label: "Professional", illustration: "trophy", image: "/images/screen-02/02-4.png" },
];

export const PYTHON_LEVEL_OPTIONS: OnboardingGridOption[] = [
  { id: "never", label: "Never used", illustration: "books", image: "/images/screen-03/03-1.png" },
  { id: "basics", label: "Know the basics", illustration: "mobile", image: "/images/screen-03/03-2.png" },
  { id: "hands-on-coder", label: "Hands-on coder", illustration: "chart", image: "/images/screen-03/03-3.png" },
  { id: "professional", label: "Professional", illustration: "trophy", image: "/images/screen-03/03-4.png" },
];

export const TIME_COMMITMENT_OPTIONS: OnboardingGridOption[] = [
  { id: "15min", label: "15 min a day", illustration: "books", image: "/images/screen-05/05-1.png" },
  { id: "30min", label: "30 min a day", illustration: "mobile", image: "/images/screen-05/05-2.png" },
  { id: "45min", label: "45 min a day", illustration: "chart", image: "/images/screen-05/05-3.png" },
  { id: "1hour", label: "1 hour a day", illustration: "trophy", image: "/images/screen-05/05-4.png" },
];

export const LEARNING_TIME_OPTIONS: OnboardingGridOption[] = [
  { id: "morning", label: "Morning", illustration: "books", image: "/images/screen-06/06-1.png" },
  { id: "afternoon", label: "Afternoon", illustration: "mobile", image: "/images/screen-06/06-2.png" },
  { id: "evening", label: "Evening", illustration: "chart", image: "/images/screen-06/06-3.png" },
  { id: "night", label: "Night", illustration: "trophy", image: "/images/screen-06/06-4.png" },
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
  const career = a.career === "devops-cloud" ? level.devops : CAREER_MIND_CAREER[a.career];
  return career ? [`/audios/carrer_mind/${level.code}${career}.m4a`] : undefined;
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
        { text: "Got it, we'll go deep and sharpen your skills specifically for " },
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

/** Screen 9's "What's driving your move toward {career}?" voiceover per
 * career — files in `public/audios/screen-09`, WD + the career's initials. */
const WHATS_DRIVING_AUDIO: Record<string, string> = {
  "software-engineer": "/audios/screen-09/WDSE.m4a",
  "data-scientist": "/audios/screen-09/WDDS.m4a",
  "data-analyst": "/audios/screen-09/WDDA.m4a",
  "devops-cloud": "/audios/screen-09/WDDOCE.m4a",
  cybersecurity: "/audios/screen-09/WDCE.m4a",
  "automation-scripting": "/audios/screen-09/WDAMS.m4a",
};

function careerLabel(answers: OnboardingAnswers): string {
  return CAREER_OPTIONS.find((c) => c.id === answers.career)?.label ?? "your career";
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
      voiceover?: StepVoiceover;
      /** Whether the voiceover also reads the heading (default true). When
       * false, the heading shows in full and only the bubble types along. */
      voiceReadsHeading?: boolean;
      cta: string;
    }
  | {
      kind: "notification-permission";
      id: string;
      heading: string;
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
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingListOption[];
      answerKey: keyof OnboardingAnswers;
      voiceover?: StepVoiceover;
      cta: string;
    }
  | {
      kind: "question-grid";
      id: string;
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingGridOption[];
      answerKey: keyof OnboardingAnswers;
      voiceover?: StepVoiceover;
      cta: string;
    };


export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    kind: "fox-message",
    id: "greeting",
    bubble: () => [{ text: "Hey! I am foxy,\nyour skills buddy" }],
    greet: true,
    voiceover: ["/audios/text-1.mpeg"],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "ready-check",
    heading: () => [
      { text: "Before your first lesson, a few quick questions to personalize your path." },
    ],
    headingPlacement: "bottom",
    sparkle: true,
    voiceover: ["/audios/text-2-screen.mpeg"],
    bubble: () => [{ text: "Are you ready?" }],
    cta: "Yes!",
  },
  {
    kind: "question-list",
    id: "career",
    heading: () => [
      { text: "What's the " },
      { text: "career", highlight: true },
      { text: " you are working towards?" },
    ],
    options: CAREER_OPTIONS,
    answerKey: "career",
    voiceover: ["/audios/screen-1-question.mpeg", "/audios/screen-1-options.mpeg"],
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
    voiceover: ["/audios/HYW_Ques.m4a", "/audios/HYW_Options.m4a"],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "building-path",
    heading: () => [{ text: "Building Career Path..." }],
    headingPlacement: "bottom",
    sparkle: true,
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
    cta: "Yes!",
  },
  {
    kind: "question-grid",
    id: "pythonLevel",
    heading: (a) => [
      { text: "What's your " },
      { text: languageForCareer(a.career), highlight: true },
      { text: " superpower level?" },
    ],
    options: PYTHON_LEVEL_OPTIONS,
    answerKey: "pythonLevel",
    voiceover: ["/audios/WYP_Ques.m4a", "/audios/WYP_Options.m4a"],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "starting-point",
    bubble: careerMindBubble,
    voiceover: careerMindAudio,
    cta: "Yes!",
  },
  {
    kind: "question-list",
    id: "motivation",
    heading: (a) => [
      { text: "What's driving your move toward " },
      { text: careerLabel(a), highlight: true },
      { text: "?" },
    ],
    options: MOTIVATION_OPTIONS,
    answerKey: "motivation",
    voiceover: (a) => {
      const src = a.career ? WHATS_DRIVING_AUDIO[a.career] : undefined;
      return src ? [src, "/audios/whats_driving_options.mp3"] : undefined;
    },
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "timeCommitment",
    heading: () => [
      { text: "How much " },
      { text: "time", highlight: true },
      { text: " can you dedicate to learning each day?" },
    ],
    options: TIME_COMMITMENT_OPTIONS,
    answerKey: "timeCommitment",
    voiceover: ["/audios/HMT_Ques.m4a", "/audios/HMT_Options.m4a"],
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "learningTime",
    heading: () => [
      { text: "What is the " },
      { text: "best time", highlight: true },
      { text: " in a day for you to learn?" },
    ],
    options: LEARNING_TIME_OPTIONS,
    answerKey: "learningTime",
    voiceover: ["/audios/best_time_Ques.m4a", "/audios/best_time_Option.m4a"],
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "pace-wow",
    bubble: (a) => [
      { text: "WOW!", highlight: true },
      { text: "\nAt this pace, you'll finish your first 3 lessons toward [" },
      { text: careerLabel(a), highlight: true },
      { text: "] this week." },
    ],
    cta: "Yes!",
  },
  {
    kind: "notification-permission",
    id: "notifications",
    heading: "Get notified when it’s time to learn.",
    cta: "Continue",
  },
  {
    kind: "streak",
    id: "streak",
    heading: () => [
      { text: "Let’s keep your " },
      { text: "coding streak", highlight: true },
      { text: " going! Stay one tap away from your next lesson." },
    ],
    image: "/images/codingStreak/codingStreak.png",
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "three-months",
    bubble: (a) => [
      { text: "In 3 months, you could be well past the basics and building real " },
      { text: careerLabel(a), highlight: true },
      { text: " projects on your own." },
    ],
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
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "foundation",
    bubble: () => [
      { text: "Smart, a strong foundation makes everything after this easier. Starting from " },
      { text: "Module 1", highlight: true },
      { text: "." },
    ],
    cta: "Yes!",
  },
];
