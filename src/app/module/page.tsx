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
import { FlipCardScreen } from "@/components/level-two/FlipCardScreen";
import { FollowedScreen } from "@/components/level-two/FollowedScreen";
import { GiveCommandScreen } from "@/components/level-two/GiveCommandScreen";
import { MatchScreen } from "@/components/level-two/MatchScreen";
import { MeetCommandScreen } from "@/components/level-two/MeetCommandScreen";
import { MeetRobotScreen } from "@/components/level-two/MeetRobotScreen";
import { QuizScreen } from "@/components/level-two/QuizScreen";
import { TargetScreen } from "@/components/level-two/TargetScreen";
import {
  LEVEL_TWO_STEPS,
  ROBOT_PICKED_UP,
  WHAT_JUST_HAPPENED,
  WHAT_NEXT,
  WHERE_SHOULD_GO,
  WILL_REACH,
} from "@/components/level-two/levelTwo";

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

/** Level 2's screen for `?step=`: meeting the robot and the command, then
 * questions, a match and a target to place the cube in, then "Lesson complete!". */
function levelTwoScreen(step: string) {
  switch (step) {
    // "Meet your robot."
    case "1":
      return <MeetRobotScreen />;
    // "Let's make something happen!": the Pick Up button, then "Nice! You gave an instruction." on the same screen.
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
    // "Move the cube in the target area."
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
    // "What are instructions known as?": Level 1's quiz, as it is there.
    case "11":
      return <InstructionQuizScreen level={2} step={11} total={LEVEL_TWO_STEPS} />;
    // "The robot followed your instruction."
    case "12":
      return <FollowedScreen />;
    // "Will it reach the target?"
    case "13":
      return <QuizScreen key="quiz-13" step={13} quiz={WILL_REACH} />;
    case "complete":
      return <LessonCompleteScreen level={2} />;
    default:
      return null;
  }
}

/**
 * A module's screens: `/module?level=1&step=1` … `step=8` (both default to
 * 1), and `/module?level=2&step=1` … `step=13`.
 */
export default async function ModulePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; step?: string }>;
}) {
  const { level = "1", step = "1" } = await searchParams;
  const screen = level === "1" ? levelOneScreen(step) : level === "2" ? levelTwoScreen(step) : null;
  if (!screen) notFound();
  return screen;
}
