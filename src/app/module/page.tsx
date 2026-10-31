import { notFound } from "next/navigation";
import { ExamplesScreen } from "@/components/level-one/ExamplesScreen";
import { InstructionQuizScreen } from "@/components/level-one/InstructionQuizScreen";
import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { MoveHexScreen } from "@/components/level-one/MoveHexScreen";
import { ReviewIntroScreen } from "@/components/level-one/ReviewIntroScreen";
import { TeacherFlow } from "@/components/level-one/TeacherFlow";
import { VideoScreen } from "@/components/level-one/VideoScreen";
import { FlipCardScreen } from "@/components/level-two/FlipCardScreen";
import { GiveCommandScreen } from "@/components/level-two/GiveCommandScreen";
import { MatchScreen } from "@/components/level-two/MatchScreen";
import { MeetCommandScreen } from "@/components/level-two/MeetCommandScreen";
import { MeetRobotScreen } from "@/components/level-two/MeetRobotScreen";
import { QuizScreen } from "@/components/level-two/QuizScreen";
import { TargetScreen } from "@/components/level-two/TargetScreen";
import {
  ROBOT_PICKED_UP,
  WHAT_JUST_HAPPENED,
  WHAT_NEXT,
  WHERE_SHOULD_GO,
} from "@/components/level-two/levelTwo";

/** The module's screen for `?step=`: Level 2's meeting the robot and the
 * command, then Level 1's instructions, then "Lesson complete!". (Screens 12
 * and 13 are the same TeacherFlow, so moving between them keeps it mounted and
 * the picture animates.) */
function moduleScreen(step: string) {
  switch (step) {
    // "Meet your robot."
    case "1":
      return <MeetRobotScreen />;
    // "Let's make it happen!": the Pick Up button, then "Nice! Instruction given!" on the same screen.
    case "2":
      return <GiveCommandScreen />;
    // "What just happened?"
    case "3":
      return <QuizScreen key="quiz-3" step={3} quiz={WHAT_JUST_HAPPENED} />;
    // "Robot has picked it up!": Pick Up or Put Down.
    case "4":
      return <QuizScreen key="quiz-4" step={4} quiz={ROBOT_PICKED_UP} />;
    // "What will happen next?"
    case "5":
      return <QuizScreen key="quiz-5" step={5} quiz={WHAT_NEXT} />;
    // "Can you match them?"
    case "6":
      return <MatchScreen />;
    // "Move cube to target"
    case "7":
      return <TargetScreen />;
    // "Where should the cube go?"
    case "8":
      return <QuizScreen key="quiz-8" step={8} quiz={WHERE_SHOULD_GO} />;
    // "Meet the Command." (a voice clip), then the card to flip.
    case "9":
      return <MeetCommandScreen />;
    // "Flip the card to reveal."
    case "10":
      return <FlipCardScreen />;
    // "Instructions are…" (what instructions are known as)
    case "11":
      return <InstructionQuizScreen />;
    // Level 1's screens: the teacher (says, then the quiz), the examples,
    // the video and the game.
    case "12":
      return <TeacherFlow step="says" />;
    case "13":
      return <TeacherFlow step="quiz" />;
    case "14":
      return <ExamplesScreen />;
    case "15":
      return <VideoScreen />;
    case "16":
      return <MoveHexScreen />;
    // After the last screen, if some questions were missed: "Let's fix the ones you missed".
    case "review":
      return <ReviewIntroScreen />;
    case "complete":
      return <LessonCompleteScreen />;
    default:
      return null;
  }
}

/** The module's screens: `/module?step=1` … `step=16` (default 1), plus
 * `step=complete`. */
export default async function ModulePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  const screen = moduleScreen(step);
  if (!screen) notFound();
  return screen;
}
