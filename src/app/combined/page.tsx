import { CombinedClient, MERGE_VS_RES } from "@/components/combined/CombinedClient";

/**
 * Interleaved review of both branches' designs for the instructions-intro
 * flow, for validating the SM (feat/merge-changes) + MD/lg/xl (feat/res)
 * responsive merge: each screen shows feat/merge-changes' design immediately
 * followed by feat/res's (this branch's, already-merged) design, before
 * moving to the next screen — see `CombinedClient`'s doc comment. The root
 * `/` page runs the same interleaved tool over a different, unrelated pair
 * (feat/himanshu vs. this branch); `/review` still exists separately for
 * comparing any two trees as full, manually-switchable flows.
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
      flows={MERGE_VS_RES}
      restartHref="/combined"
    />
  );
}
