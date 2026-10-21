import { notFound } from "next/navigation";
import { ExamplesScreen } from "@/components/level-one/ExamplesScreen";
import { InstructionQuizScreen } from "@/components/level-one/InstructionQuizScreen";
import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { LevelOneScreen } from "@/components/level-one/LevelOneScreen";
import { ModuleIntroScreen } from "@/components/level-one/ModuleIntroScreen";
import { MoveHexScreen } from "@/components/level-one/MoveHexScreen";
import { RewardScreen } from "@/components/level-one/RewardScreen";
import { TeacherFlow } from "@/components/level-one/TeacherFlow";
import { VideoScreen } from "@/components/level-one/VideoScreen";

/** Level 1's screen for `?step=`. Screens 3 and 4 are the same TeacherFlow,
 * so moving between them keeps it mounted and the picture animates. */
function levelOneScreen(step: string) {
  switch (step) {
    // "Think like a programmer": the module's opening screen.
    case "1":
      return <ModuleIntroScreen />;
    // "How programmers think", with a tap-to-reveal card.
    case "2":
      return <LevelOneScreen />;
    // "Let Suppose / Teacher Says", then the quiz: "What teacher is doing?"
    case "3":
      return <TeacherFlow step="says" />;
    case "4":
      return <TeacherFlow step="quiz" />;
    // Examples of instruction.
    case "5":
      return <ExamplesScreen />;
    // "What are instructions?": a short video.
    case "6":
      return <VideoScreen />;
    // "What are instructions known as?"
    case "7":
      return <InstructionQuizScreen />;
    // The gift after the quiz; not counted in the 8.
    case "reward":
      return <RewardScreen />;
    // "Let's give some command to Mini": the board.
    case "8":
      return <MoveHexScreen />;
    // "Lesson complete!": after the last screen.
    case "complete":
      return <LessonCompleteScreen />;
    default:
      return null;
  }
}

/**
 * A module's screens: `/module?level=1&step=1` … `step=8` (both default to
 * 1). Only Level 1 exists so far.
 */
export default async function ModulePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; step?: string }>;
}) {
  const { level = "1", step = "1" } = await searchParams;
  const screen = level === "1" ? levelOneScreen(step) : null;
  if (!screen) notFound();
  return screen;
}
