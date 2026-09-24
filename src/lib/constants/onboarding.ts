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
}

export interface OnboardingListOption {
  id: string;
  label: string;
  icon: LucideIcon;
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

export const EXPERIENCE_OPTIONS: OnboardingGridOption[] = [
  { id: "none", label: "No experience", illustration: "books" },
  { id: "little", label: "A little exposure", illustration: "mobile" },
  { id: "hands-on", label: "Hands-on", illustration: "chart" },
  { id: "professional", label: "Professional", illustration: "trophy" },
];

export const PYTHON_LEVEL_OPTIONS: OnboardingGridOption[] = [
  { id: "never", label: "Never used", illustration: "books" },
  { id: "basics", label: "Know the basics", illustration: "mobile" },
  { id: "hands-on-coder", label: "Hands-on coder", illustration: "chart" },
  { id: "professional", label: "Professional", illustration: "trophy" },
];

export const TIME_COMMITMENT_OPTIONS: OnboardingGridOption[] = [
  { id: "15min", label: "15 min a day", illustration: "books" },
  { id: "30min", label: "30 min a day", illustration: "mobile" },
  { id: "45min", label: "45 min a day", illustration: "chart" },
  { id: "1hour", label: "1 hour a day", illustration: "trophy" },
];

export const LEARNING_TIME_OPTIONS: OnboardingGridOption[] = [
  { id: "morning", label: "Morning", illustration: "books" },
  { id: "afternoon", label: "Afternoon", illustration: "mobile" },
  { id: "evening", label: "Evening", illustration: "chart" },
  { id: "night", label: "Night", illustration: "trophy" },
];

/** Every career in this flow leads to the same language track — the
 * reference design only ever shows a Python path (screen 11: "your [career
 * path] journey runs on Python"), so there's no real per-career mapping to
 * reproduce yet. Kept as a lookup (not a bare constant) so a real per-career
 * mapping can slot in later without touching any screen. */
export function languageForCareer(_career: string | undefined): string {
  return "Python";
}

function careerLabel(answers: OnboardingAnswers): string {
  return CAREER_OPTIONS.find((c) => c.id === answers.career)?.label ?? "your career";
}

export type OnboardingStep =
  | {
      kind: "fox-message";
      id: string;
      /** Heading above the fox — when present, the bubble sits *below* the
       * fox ("Building Career Path..."); when absent, the bubble sits *above*
       * the fox instead ("Hey! I am foxy", "Perfect starting point"),
       * matching the reference exactly. See `headingPlacement` for the
       * heading-below variant. */
      heading?: (answers: OnboardingAnswers) => TextSpan[];
      /** "bottom" puts the heading *under* the fox instead, with the bubble
       * back above it (the "Are you ready?" screen). Defaults to "top". */
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
      /** Voiceover clips (in `public/audios`) played back-to-back when the
       * screen appears — see useVoiceover. */
      voiceover?: readonly string[];
      cta: string;
    }
  | {
      kind: "notification-permission";
      id: string;
      heading: string;
      cta: string;
    }
  | {
      kind: "question-list";
      id: string;
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingListOption[];
      answerKey: keyof OnboardingAnswers;
      /** Voiceover clips (in `public/audios`) played back-to-back when the
       * screen appears — see useVoiceover. */
      voiceover?: readonly string[];
      cta: string;
    }
  | {
      kind: "question-grid";
      id: string;
      heading: (answers: OnboardingAnswers) => TextSpan[];
      options: OnboardingGridOption[];
      answerKey: keyof OnboardingAnswers;
      /** Voiceover clips (in `public/audios`) played back-to-back when the
       * screen appears — see useVoiceover. */
      voiceover?: readonly string[];
      cta: string;
    };

/** The real questions in this flow (career, experience, Python level,
 * motivation, time commitment, learning time) — used to compute "question N of TOTAL" progress. */
export const ONBOARDING_QUESTION_COUNT = 6;

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
      { text: " you're chasing?" },
    ],
    options: CAREER_OPTIONS,
    answerKey: "career",
    voiceover: ["/audios/screen-1-question.mpeg", "/audios/screen-1-options.mpeg"],
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "experience",
    heading: (a) => [
      { text: "Have you " },
      { text: "worked", highlight: true },
      { text: " with code before, on your way to " },
      { text: careerLabel(a), highlight: true },
      { text: "?" },
    ],
    options: EXPERIENCE_OPTIONS,
    answerKey: "experience",
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "building-path",
    heading: () => [{ text: "Building Career Path..." }],
    sparkle: true,
    bubble: (a) => [
      { text: "Good news: your " },
      { text: `${careerLabel(a)} path`, highlight: true },
      { text: " journey runs on " },
      { text: languageForCareer(a.career), highlight: true },
      { text: ". One of the most in-demand languages." },
    ],
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
    cta: "Continue",
  },
  {
    kind: "fox-message",
    id: "starting-point",
    bubble: (a) => [
      { text: "Perfect starting point. We'll build your " },
      { text: `${languageForCareer(a.career)} foundation`, highlight: true },
      { text: " with " },
      { text: careerLabel(a), highlight: true },
      { text: " in mind." },
    ],
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
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "timeCommitment",
    heading: (a) => [
      { text: "How much time can you give " },
      { text: careerLabel(a), highlight: true },
      { text: " each day?" },
    ],
    options: TIME_COMMITMENT_OPTIONS,
    answerKey: "timeCommitment",
    cta: "Continue",
  },
  {
    kind: "question-grid",
    id: "learningTime",
    heading: (a) => [
      { text: "What is the " },
      { text: "best time", highlight: true },
      { text: " in a day for you to learn " },
      { text: careerLabel(a), highlight: true },
      { text: "?" },
    ],
    options: LEARNING_TIME_OPTIONS,
    answerKey: "learningTime",
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
];
