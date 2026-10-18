import { notFound } from "next/navigation";
import { ExamplesScreen } from "@/components/level-one/ExamplesScreen";
import { InstructionQuizScreen } from "@/components/level-one/InstructionQuizScreen";
import { LevelOneScreen } from "@/components/level-one/LevelOneScreen";
import { MoveHexScreen } from "@/components/level-one/MoveHexScreen";
import { OpenItScreen } from "@/components/level-one/OpenItScreen";
import { TeacherFlow } from "@/components/level-one/TeacherFlow";
import { VideoScreen } from "@/components/level-one/VideoScreen";

/** Level 1's screen for `?step=`. Screens 2 and 3 are the same TeacherFlow,
 * so moving between them keeps it mounted and the picture animates. */
function levelOneScreen(step: string) {
  switch (step) {
    // "How programmers think", with a tap-to-reveal card.
    case "1":
      return <LevelOneScreen />;
    // "Let Suppose / Teacher Says", then the quiz: "What teacher is doing?"
    case "2":
      return <TeacherFlow step="says" />;
    case "3":
      return <TeacherFlow step="quiz" />;
    // Examples of instruction.
    case "4":
      return <ExamplesScreen />;
    // "What are instructions?": a short video.
    case "5":
      return <VideoScreen />;
    // "What are instructions known as?"
    case "6":
      return <InstructionQuizScreen />;
    // "Giving instruction is same as giving commands".
    case "7":
      return <OpenItScreen />;
    // "Let's give some command to Mini": the board.
    case "8":
      return <MoveHexScreen />;
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
