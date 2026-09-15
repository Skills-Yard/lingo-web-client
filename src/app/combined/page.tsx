import { CombinedClient } from "@/components/combined/CombinedClient";

/**
 * Interleaved review of both branches' designs for the instructions-intro
 * flow, for validating the SM (feat/merge-changes) + MD/lg/xl (feat/res)
 * responsive merge: each screen shows feat/merge-changes' design immediately
 * followed by feat/res's (this branch's, already-merged) design, before
 * moving to the next screen — see `CombinedClient`'s doc comment.
 */
export default async function CombinedPage({
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
