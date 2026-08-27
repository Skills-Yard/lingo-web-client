import { LucideIcon } from "lucide-react";
import { HelpCircle, BookOpen } from "lucide-react";

export interface QuizOption {
  text: string;
  subtitle: string;
  icon: LucideIcon;
  isCorrect: boolean;
}

export interface ExamplePair {
  leftLabel: string;
  leftImage: string;
  rightLabel: string;
  rightImage: string;
}

export type InstructionsSlide =
  | {
      // "Programmer is a problem solver" — cover slide with the code/thinking
      // illustration, the "Before we write code..." line and the reveal card.
      kind: "cover";
      highlightWord: string;
      title: string;
      imageLight: string;
      imageDark: string;
      lines: string[];
      highlightLine: string;
      revealLabel: string;
      revealSubject: string;
      cta: string;
    }
  | {
      // "Let Suppose / Teacher Says" — teacher illustration only, no quiz yet.
      kind: "teacher-intro";
      eyebrow: string;
      title: string;
      cta: string;
    }
  | {
      // "What teacher is doing?" — idle -> selected -> correct/incorrect,
      // all on the same screen.
      kind: "teacher-quiz";
      highlightWord: string;
      title: string;
      options: QuizOption[];
      correctTitle: string;
      correctText: string;
      incorrectTitle: string;
      incorrectText: string;
      submitLabel: string;
      cta: string;
    }
  | {
      // "Some examples of instruction" — title has no color-split in the source design.
      kind: "examples-grid";
      title: string;
      pairs: ExamplePair[];
      cta: string;
    }
  | {
      // "What are Instructions?"
      kind: "video";
      highlightWord: string;
      title: string;
      caption: string;
      cta: string;
    };

/** Per-screen slide types, so each screen component can be strictly typed to its own slide. */
export type CoverSlide = Extract<InstructionsSlide, { kind: "cover" }>;
export type TeacherIntroSlide = Extract<InstructionsSlide, { kind: "teacher-intro" }>;
export type TeacherQuizSlide = Extract<InstructionsSlide, { kind: "teacher-quiz" }>;
export type ExamplesGridSlide = Extract<InstructionsSlide, { kind: "examples-grid" }>;
export type VideoSlide = Extract<InstructionsSlide, { kind: "video" }>;

export const INSTRUCTIONS_INTRO_SLIDES: InstructionsSlide[] = [
  {
    kind: "cover",
    highlightWord: "Programmer",
    title: "is a problem solver.",
    imageLight: "/images/thinkingWhite.png",
    imageDark: "/images/thinkingBlack.png",
    lines: ["Before we write code,", "let's learn how"],
    highlightLine: "programmer think.",
    revealLabel: "Tap to reveal",
    revealSubject: "PROGRAMMER",
    cta: "Let's Begin",
  },
  {
    kind: "teacher-intro",
    eyebrow: "Let Suppose",
    title: "Teacher Says",
    cta: "Got it!",
  },
  {
    kind: "teacher-quiz",
    highlightWord: "What",
    title: "teacher is doing?",
    options: [
      {
        text: "Asking Question",
        subtitle: "Teacher is asking a question to the class.",
        icon: HelpCircle,
        isCorrect: false,
      },
      {
        text: "Giving Instruction",
        subtitle: "Teacher is giving an instruction to the class.",
        icon: BookOpen,
        isCorrect: true,
      },
    ],
    correctTitle: "Correct!",
    correctText: "Yes! Teacher is giving an instruction.",
    incorrectTitle: "Oops! Not quite.",
    incorrectText: "Teacher is not asking a question, teacher is giving an instruction.",
    submitLabel: "Check",
    cta: "Continue",
  },
  {
    kind: "examples-grid",
    title: "Some examples of instruction",
    pairs: [
      { leftLabel: "Parent", leftImage: "/images/parent.png", rightLabel: "Eat the food", rightImage: "/images/food.png" },
      { leftLabel: "Coach", leftImage: "/images/coach.png", rightLabel: "Run", rightImage: "/images/run.png" },
      { leftLabel: "Traffic Signal", leftImage: "/images/trafficSignal.png", rightLabel: "Stop", rightImage: "/images/stop.png" },
    ],
    cta: "Continue",
  },
  {
    kind: "video",
    highlightWord: "What",
    title: "are Instructions?",
    caption: "In this video, we will tell that in programming what instructions really known as.",
    cta: "Continue",
  },
];
