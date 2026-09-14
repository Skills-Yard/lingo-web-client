import { ReviewClient } from "@/components/review/ReviewClient";

/**
 * Side-by-side (well — one-at-a-time, switchable) review of two designs for
 * the instructions-intro flow: the current branch's own components, and an
 * untouched copy of `origin/feat/himanshu`'s. Neither branch's actual
 * components are modified for this — see ReviewClient's doc comment. Mirrors
 * the main `/` page's own `?step=` deep-linking so a reviewer can jump both
 * variants to the same screen.
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialIndex = Number(step);

  return (
    <ReviewClient
      initialIndex={Number.isInteger(initialIndex) && initialIndex >= 0 ? initialIndex : 0}
    />
  );
}
