import { notFound } from "next/navigation";
import { OperatorsRoute } from "@/components/operators/OperatorsRoute";
import { isOperatorsStep } from "@/components/operators/operators";

/** The Operators module's screens: `/module/operators?step=1` … `step=40` (default 1), plus `step=complete`. */
export default async function OperatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  if (!isOperatorsStep(step)) notFound();
  return <OperatorsRoute step={step} />;
}
