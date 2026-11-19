import { InstructionsFlow } from "@/components/instructions";

/**
 * The instructions flow: `?step=0` is the cover screen, the first one built.
 */
export default async function IntroPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialIndex = Number(step);

  return <InstructionsFlow initialIndex={Number.isInteger(initialIndex) && initialIndex >= 0 ? initialIndex : 0} />;
}
