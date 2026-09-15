import { CombinedClient } from "@/components/combined/CombinedClient";

/**
 * Interleaved review of both branches' designs for the instructions-intro
 * flow: each screen shows feat/himanshu's design immediately followed by
 * the current branch's design, before moving to the next screen — see
 * `CombinedClient`'s doc comment. `/review` still exists separately for
 * comparing the two as full, manually-switchable flows.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialIndex = Number(step);

  return (
    <CombinedClient
      initialScreenIndex={Number.isInteger(initialIndex) && initialIndex >= 0 ? initialIndex : 0}
    />
  );
}
