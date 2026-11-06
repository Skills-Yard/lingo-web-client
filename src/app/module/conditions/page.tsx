import { notFound } from "next/navigation";
import { ConditionsRoute } from "@/components/conditions/ConditionsRoute";
import { isConditionsStep } from "@/components/conditions/conditions";

/** The Conditions module's screens: `/module/conditions?step=1` … `step=38` (default 1), plus `step=complete`. */
export default async function ConditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  if (!isConditionsStep(step)) notFound();
  return <ConditionsRoute step={step} />;
}
