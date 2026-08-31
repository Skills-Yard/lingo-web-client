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

export interface QuestionnaireItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  isCorrect?: boolean;
  feedback?: string;
}

export interface RewardInfo {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export interface ActionButton {
  id: string;
  label: string;
}

export interface CommandItem {
  id: string;
  icon: string;
  label: string;
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
      /** Modal popup: body paragraph shown after the title. */
      revealDescription: string;
      /** Modal popup: short callout shown in the REMEMBER box. */
      revealRemember: string;
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
    }
  | {
      // "What are Instructions known as?" — questionnaire screen
      kind: "questionnaire";
      highlightWord: string;
      title: string;
      items: QuestionnaireItem[];
      cta: string;
    }
  | {
      // "Claim Reward" — reward screen with mascot and rewards
      kind: "reward";
      highlightWord: string;
      title: string;
      subtitle?: string;
      imageLight: string;
      imageDark: string;
      rewards?: RewardInfo[];
      actionButtons?: ActionButton[];
      actionDescription?: string;
      securityInfo?: string;
      securitySubInfo?: string;
      cta: string;
    }
  | {
      // "Let's give some commands to sprout" — commands grid screen
      kind: "commands-grid";
      highlightWord: string;
      title: string;
      description?: string;
      commands: CommandItem[];
      columns?: 2 | 3 | 4;
      infoMessage?: string;
      cta: string;
    };

/** Per-screen slide types, so each screen component can be strictly typed to its own slide. */
export type CoverSlide = Extract<InstructionsSlide, { kind: "cover" }>;
export type TeacherIntroSlide = Extract<InstructionsSlide, { kind: "teacher-intro" }>;
export type TeacherQuizSlide = Extract<InstructionsSlide, { kind: "teacher-quiz" }>;
export type ExamplesGridSlide = Extract<InstructionsSlide, { kind: "examples-grid" }>;
export type VideoSlide = Extract<InstructionsSlide, { kind: "video" }>;
export type QuestionnaireSlide = Extract<InstructionsSlide, { kind: "questionnaire" }>;
export type RewardSlide = Extract<InstructionsSlide, { kind: "reward" }>;
export type CommandsGridSlide = Extract<InstructionsSlide, { kind: "commands-grid" }>;

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
    revealDescription:
      "A programmer breaks down complex problems into small steps and builds solutions using logic, patterns, and creativity.",
    revealRemember: "Great code starts with a great way of thinking.",
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
  {
    kind: "questionnaire",
    highlightWord: "instructions",
    title: "What are instructions known as?",
    items: [
      {
        id: "statement",
        label: "Statement",
        icon: "/images/statement.png",
        isCorrect: false,
        feedback: "Statements are lines of code, but not all statements are instructions.",
      },
      {
        id: "command",
        label: "Command",
        icon: "/images/command.png",
        isCorrect: true,
        feedback: "Yes! Instructions in a program is called commands.",
      },
      {
        id: "question",
        label: "Question",
        icon: "/images/question.png",
        isCorrect: false,
        feedback: "Questions are not instructions; they're used to check conditions.",
      },
    ],
    cta: "Claim Reward",
  },
  {
    kind: "reward",
    highlightWord: "CLAIM",
    title: "reward",
    subtitle: "YOU GOT",
    imageLight: "/images/sprouty1.png",
    imageDark: "/images/sprouty1.png",
    rewards: [
      {
        id: "gems",
        icon: "/images/gems.png",
        label: "GEMS",
        value: "120",
      },
      {
        id: "coins",
        icon: "/images/coins.png",
        label: "GEMS",
        value: "120",
      },
    ],
    actionButtons: [
      {
        id: "claim",
        label: "Claim Instantly",
      },
    ],
    actionDescription: "Your reward will be added to your account instantly.",
    securityInfo: "Safe & Secure",
    securitySubInfo: "100% safe rewards",
    cta: "Continue",
  },
  {
    kind: "commands-grid",
    highlightWord: "Let's",
    title: "give some commands to sprout",
    description: "Tap on the commands to guide Sprouty!",
    commands: [
      {
        id: "move-forward",
        icon: "/images/arrowLines.png",
        label: "Move Forward",
      },
      {
        id: "turn-left",
        icon: "/images/arrowLines.png",
        label: "Turn Left",
      },
      {
        id: "turn-right",
        icon: "/images/arrowLines.png",
        label: "Turn Right",
      },
      {
        id: "jump",
        icon: "/images/arrowLines.png",
        label: "Jump",
      },
    ],
    columns: 4,
    infoMessage: "You can select one or more commands to create a sequence.",
    cta: "Continue",
  },
];
