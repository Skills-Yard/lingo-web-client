import { InstructionsIntroFlow } from "@/components/instructions-intro/InstructionsIntroFlow";

/**
 * The instructions-intro flow on its own, in the current branch's design only:
 * no comparison with `feat/himanshu`'s (that is `/module1/review` and
 * `/module1/combined`). `?step=0` is the cover screen, the first one built.
 */
export default async function IntroPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialIndex = Number(step);

  return <InstructionsIntroFlow initialIndex={Number.isInteger(initialIndex) && initialIndex >= 0 ? initialIndex : 0} />;
}
