import { notFound } from "next/navigation";
import { ArrangeScreen } from "@/components/sequence/ArrangeScreen";
import { DressArrangeScreen } from "@/components/sequence/DressArrangeScreen";
import { FixScreen } from "@/components/sequence/FixScreen";
import { HexIntroScreen } from "@/components/sequence/HexIntroScreen";
import { HexOrderScreen } from "@/components/sequence/HexOrderScreen";
import { MeetSequenceScreen } from "@/components/sequence/MeetSequenceScreen";
import { OneCommandScreen } from "@/components/sequence/OneCommandScreen";
import { PlanScreen } from "@/components/sequence/PlanScreen";
import { PredictFollowUpScreen } from "@/components/sequence/PredictFollowUpScreen";
import { PredictScreen } from "@/components/sequence/PredictScreen";
import { PutOnScreen } from "@/components/sequence/PutOnScreen";
import { RecapScreen } from "@/components/sequence/RecapScreen";
import { RevealCardScreen } from "@/components/sequence/RevealCardScreen";
import { SequenceCompleteScreen } from "@/components/sequence/SequenceCompleteScreen";
import { SequenceQuizScreen } from "@/components/sequence/SequenceQuizScreen";
import { TeaScreen } from "@/components/sequence/TeaScreen";
import {
  COMPARE_ATTEMPTS,
  FIRST_COMMAND,
  PUT_ON_FIRST,
  REFLECT_DECIDE,
  REFLECT_ORDER,
  SOCKS_FIRST,
  WHAT_DID_YOU_DO,
} from "@/components/sequence/sequence";

/** The Sequence module's screen for `?step=` (see `STEP` for what each number is). */
function sequenceScreen(step: string) {
  switch (step) {
    case "1":
      return <SequenceQuizScreen key="quiz-1" quiz={PUT_ON_FIRST} />;
    case "2":
      return <PutOnScreen key="put-on-socks" stage="socks" />;
    case "3":
      return <PutOnScreen key="put-on-shoes" stage="shoes" />;
    case "4":
      return <PutOnScreen key="put-on-ready" stage="ready" />;
    case "5":
      return <SequenceQuizScreen key="quiz-5" quiz={WHAT_DID_YOU_DO} />;
    case "6":
      return <SequenceQuizScreen key="quiz-6" quiz={COMPARE_ATTEMPTS} />;
    case "7":
      return <SequenceQuizScreen key="quiz-7" quiz={SOCKS_FIRST} />;
    case "8":
      return <SequenceQuizScreen key="quiz-8" quiz={FIRST_COMMAND} />;
    case "9":
      return <ArrangeScreen />;
    case "10":
      return <MeetSequenceScreen />;
    case "11":
      return <RevealCardScreen />;
    case "12":
      return <DressArrangeScreen />;
    case "13":
      return <HexIntroScreen />;
    case "14":
      return <OneCommandScreen />;
    case "15":
      return <HexOrderScreen />;
    case "16":
      return <PredictScreen variant="base" />;
    case "17":
      return <PredictFollowUpScreen />;
    case "18":
      return <FixScreen />;
    case "19":
      return <PlanScreen route="base" />;
    case "20":
      return <PlanScreen route="complex" />;
    case "21":
      return <TeaScreen />;
    case "22":
      return <SequenceQuizScreen key="quiz-22" quiz={REFLECT_ORDER} />;
    case "23":
      return <SequenceQuizScreen key="quiz-23" quiz={REFLECT_DECIDE} />;
    case "24":
      return <RecapScreen />;
    case "complete":
      return <SequenceCompleteScreen />;
    default:
      return null;
  }
}

/** The Sequence module's screens: `/module/sequence?step=1` … `step=24` (default 1), plus `step=complete`. */
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
