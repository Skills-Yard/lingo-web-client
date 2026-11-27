import { notFound } from "next/navigation";
import { ExamplesScreen } from "@/components/level-one/ExamplesScreen";
import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { MoveHexScreen } from "@/components/level-one/MoveHexScreen";
import { ReviewIntroScreen } from "@/components/level-one/ReviewIntroScreen";
import { TeacherFlow } from "@/components/level-one/TeacherFlow";
import { VideoScreen } from "@/components/level-one/VideoScreen";
import { InstructionsAreScreen, WhatJustHappenedScreen } from "@/components/level-two/CharacterQuizScreen";
import { CommandIntroScreen } from "@/components/level-two/CommandIntroScreen";
import { FlipCardScreen } from "@/components/level-two/FlipCardScreen";
import { GiveCommandScreen } from "@/components/level-two/GiveCommandScreen";
import { MatchScreen } from "@/components/level-two/MatchScreen";
import { MeetCommand3DScreen } from "@/components/level-two/MeetCommand3DScreen";
import { MeetRobotScreen } from "@/components/level-two/MeetRobotScreen";
import { QuizScreen } from "@/components/level-two/QuizScreen";
import { TargetScreen } from "@/components/level-two/TargetScreen";
import {
  ROBOT_PICKED_UP,
  WHAT_NEXT,
  WHERE_SHOULD_GO,
} from "@/components/level-two/levelTwo";

/** The Command module's screen for `?step=`: its title screen, Level 2's meeting the
 * robot and the command, then Level 1's instructions, then "Lesson complete!". The
 * chosen 3D character is on the title screen and on screens 3, 9 and 11; Hex and the
 * robot are on the rest. (Screens 12 and 13 are the same TeacherFlow, so moving
 * between them keeps it mounted and the picture animates.) */
function commandsScreen(step: string) {
  switch (step) {
    // "Let's Learn Commands": the title screen, before the numbered ones (so their numbers stay).
    case "0":
      return <CommandIntroScreen />;
    // "Meet your robot."
    case "1":
      return <MeetRobotScreen />;
    // "Let's make it happen!": the Pick Up button, then "Nice! Instruction given!" on the same screen.
    case "2":
      return <GiveCommandScreen />;
    // "What just happened?" (the 3D character asks it)
    case "3":
      return <WhatJustHappenedScreen />;
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
      return <MeetCommand3DScreen />;
    // "Flip the card to reveal."
    case "10":
      return <FlipCardScreen />;
    // "Instructions are…" (what instructions are known as; the 3D character asks it)
    case "11":
      return <InstructionsAreScreen />;
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

/** The Command module's screens: `/module/commands?step=0` (the title screen, the default) … `step=16`, plus
 * `step=review` and `step=complete`. */
export default async function CommandsPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "0" } = await searchParams;
  const screen = commandsScreen(step);
  if (!screen) notFound();
  return screen;
}
