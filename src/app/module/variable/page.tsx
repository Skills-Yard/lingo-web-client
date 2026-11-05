import { notFound } from "next/navigation";
import { isVariableStep } from "@/components/variable/variable";
import { VariableScreen } from "@/components/variable/VariableScreen";

/** The Variable module's screens: `/module/variable?step=1` … `step=34` (default 1), plus `step=complete`. */
export default async function VariablePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  if (!isVariableStep(step)) notFound();
  return <VariableScreen step={step} />;
}
