import { notFound } from "next/navigation";
import { ArrangeScreen } from "@/components/sequence/ArrangeScreen";
import { DressArrangeScreen } from "@/components/sequence/DressArrangeScreen";
import { FixScreen } from "@/components/sequence/FixScreen";
import { HexIntroScreen } from "@/components/sequence/HexIntroScreen";
import { HexOrderScreen } from "@/components/sequence/HexOrderScreen";
import { Intro3DScreen } from "@/components/sequence/Intro3DScreen";
import { MeetSequenceScreen } from "@/components/sequence/MeetSequenceScreen";
import { OneCommandScreen } from "@/components/sequence/OneCommandScreen";
import { PlanScreen } from "@/components/sequence/PlanScreen";
import { PredictFollowUpScreen } from "@/components/sequence/PredictFollowUpScreen";
import { PredictScreen } from "@/components/sequence/PredictScreen";
import { PutOnScreen } from "@/components/sequence/PutOnScreen";
import { RecapScreen } from "@/components/sequence/RecapScreen";
import { RevealCardScreen } from "@/components/sequence/RevealCardScreen";
import { SequenceCompleteScreen } from "@/components/sequence/SequenceCompleteScreen";
import { SequenceQuiz3DScreen } from "@/components/sequence/SequenceQuiz3DScreen";
import { SequenceQuizScreen } from "@/components/sequence/SequenceQuizScreen";
import { Story3DScreen } from "@/components/sequence/Story3DScreen";
import { TeaScreen } from "@/components/sequence/TeaScreen";
import {
  COMPARE_ATTEMPTS,
  FIRST_COMMAND,
  PUT_ON_FIRST,
  REFLECT_DECIDE,
  REFLECT_ORDER,
  WHAT_DID_YOU_DO,
} from "@/components/sequence/sequence";
import { FLOW_3D, positionOf, WHAT_WILL_HAPPEN } from "@/components/sequence/sequence3d";
import { SEQUENCE_3D_AUDIO, SEQUENCE_AUDIO } from "@/lib/moduleAudio";

/** The frame at place `step` of the 3D flow (see `FLOW_3D`), or "Lesson complete!" for `step=complete`. */
function sequence3dScreen(step: string) {
  if (step === "complete") return <SequenceCompleteScreen key="complete" />;
  switch (FLOW_3D[Number(step) - 1]?.id) {
    case "intro":
      return <Intro3DScreen key="intro" />;
    case "aarav":
      return (
        <Story3DScreen
          key="aarav"
          position={positionOf("aarav")}
          title={[[{ text: "Aarav", teal: true }, { text: " is going out today!" }]]}
          titleSize={26}
          dress="bare"
        />
      );
    case "putOnFirst":
      return <SequenceQuiz3DScreen key="put-on-first" quiz={PUT_ON_FIRST} audio={SEQUENCE_3D_AUDIO.screen1} position={positionOf("putOnFirst")} look="tray" />;
    case "socks":
      return <PutOnScreen key="put-on-socks" stage="socks" />;
    case "shoes":
      return <PutOnScreen key="put-on-shoes" stage="shoes" />;
    case "ready":
      return <PutOnScreen key="put-on-ready" stage="ready" />;
    case "whatDid":
      return <SequenceQuizScreen key="what-did" quiz={WHAT_DID_YOU_DO} />;
    case "compare":
      return <SequenceQuizScreen key="compare" quiz={COMPARE_ATTEMPTS} />;
    case "shoesFirst":
      return (
        <Story3DScreen
          key="shoes-first"
          position={positionOf("shoesFirst")}
          title={[[{ text: "What if " }, { text: "shoes", teal: true }, { text: " go first?" }]]}
          titleSize={26}
          dress="shoesOnly"
          // Hex's clips of the original screen: the title, then the line the bubble used to show.
          voiceover={SEQUENCE_AUDIO.socksFirst}
        />
      );
    case "whatWillHappen":
      return <SequenceQuiz3DScreen key="what-will-happen" quiz={WHAT_WILL_HAPPEN} audio={SEQUENCE_3D_AUDIO.screen7} position={positionOf("whatWillHappen")} look="tray" />;
    case "firstCommand":
      return <SequenceQuizScreen key="first-command" quiz={FIRST_COMMAND} />;
    case "arrange":
      return <ArrangeScreen key="arrange" />;
    case "meet":
      return <MeetSequenceScreen key="meet" />;
    case "reveal":
      return <RevealCardScreen key="reveal" />;
    case "dress":
      return <DressArrangeScreen key="dress" />;
    case "hexIntro":
      return <HexIntroScreen key="hex-intro" />;
    case "oneCommand":
      return <OneCommandScreen key="one-command" />;
    case "hexOrder":
      return <HexOrderScreen key="hex-order" />;
    case "predict":
      return <PredictScreen key="predict" variant="base" />;
    case "predictNext":
      return <PredictFollowUpScreen key="predict-next" />;
    case "fix":
      return <FixScreen key="fix" />;
    case "plan":
      return <PlanScreen key="plan-base" route="base" />;
    case "planNext":
      return <PlanScreen key="plan-complex" route="complex" />;
    case "tea":
      return <TeaScreen key="tea" />;
    case "reflectOrder":
      return <SequenceQuizScreen key="reflect-order" quiz={REFLECT_ORDER} />;
    case "reflectDecide":
      return <SequenceQuizScreen key="reflect-decide" quiz={REFLECT_DECIDE} />;
    case "recap":
      return <RecapScreen key="recap" />;
    default:
      return null;
  }
}

/**
 * The 3D Sequence flow: `/module/sequence-3d?step=1` … `step=27` (default 1), plus `step=complete`.
 * Every screen of the original module is here (see `sequence3d.ts` for the order and what each is).
 */
export default async function SequenceThreeDPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  const screen = sequence3dScreen(step);
  if (!screen) notFound();
  return screen;
}
