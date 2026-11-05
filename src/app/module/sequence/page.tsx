import { notFound } from "next/navigation";
import { ArrangeScreen } from "@/components/sequence/ArrangeScreen";
import { GuideHexScreen } from "@/components/sequence/GuideHexScreen";
import { MeetSequenceScreen } from "@/components/sequence/MeetSequenceScreen";
import { SequenceCompleteScreen } from "@/components/sequence/SequenceCompleteScreen";
import { SequenceQuizScreen } from "@/components/sequence/SequenceQuizScreen";
import { COMPARE_ATTEMPTS, FIRST_COMMAND, PUT_ON_FIRST, SOCKS_FIRST } from "@/components/sequence/sequence";

/** The Sequence module's screen for `?step=`. */
function sequenceScreen(step: string) {
  switch (step) {
    case "1":
      return <SequenceQuizScreen key="quiz-1" quiz={PUT_ON_FIRST} />;
    case "2":
      return <SequenceQuizScreen key="quiz-2" quiz={COMPARE_ATTEMPTS} />;
    case "3":
      return <SequenceQuizScreen key="quiz-3" quiz={SOCKS_FIRST} />;
    case "4":
      return <SequenceQuizScreen key="quiz-4" quiz={FIRST_COMMAND} />;
    case "5":
      return <ArrangeScreen />;
    case "6":
      return <MeetSequenceScreen />;
    case "7":
      return <GuideHexScreen />;
    case "complete":
      return <SequenceCompleteScreen />;
    default:
      return null;
  }
}

/** The Sequence module's screens: `/module/sequence?step=1` … `step=7` (default 1), plus `step=complete`. */
export default async function SequencePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  const screen = sequenceScreen(step);
  if (!screen) notFound();
  return screen;
}
