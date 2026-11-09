import { ComparePage } from "@/components/kit/gallery/ComparePage";

/** `/kit/compare?module=datatypes&step=1` — a screen as the code draws it next to the same screen played from its data file. */
export default async function KitComparePage({ searchParams }: { searchParams: Promise<{ module?: string; step?: string }> }) {
  const { module = "datatypes", step = "1" } = await searchParams;
  return <ComparePage initialModule={module} initialStep={step} />;
}
