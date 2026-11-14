import { notFound } from "next/navigation";
import { PutOnShoes3DScreen } from "@/components/sequence/PutOnShoes3DScreen";
import { SequenceQuiz3DScreen } from "@/components/sequence/SequenceQuiz3DScreen";
import { PUT_ON_FIRST, SOCKS_FIRST } from "@/components/sequence/sequence";
import { SEQUENCE_3D_AUDIO } from "@/lib/moduleAudio";

/** The 3D copy of the Sequence screen `?step=` copies (see `STEPS_3D`). */
function sequence3dScreen(step: string) {
  switch (step) {
    case "1":
      return <SequenceQuiz3DScreen key="quiz-1-3d" quiz={PUT_ON_FIRST} audio={SEQUENCE_3D_AUDIO.screen1} />;
    case "3":
      return <PutOnShoes3DScreen key="put-on-shoes-3d" />;
    case "7":
      return <SequenceQuiz3DScreen key="quiz-7-3d" quiz={SOCKS_FIRST} audio={SEQUENCE_3D_AUDIO.screen7} />;
    default:
      return null;
  }
}

/**
 * Copies of three Sequence screens with the 3D character in Hex's place, played in
 * order: `/module/sequence-3d?step=1`, then `step=3`, then `step=7` (default 1).
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
