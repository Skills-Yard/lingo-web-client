import { notFound } from "next/navigation";
import { isVariableStep } from "@/components/variable/variable";
import { VariableScreen } from "@/components/variable/VariableScreen";

/** The Variable module's screens: `/module/variable?step=0` (the title screen, the default) … `step=34`, plus `step=complete`. */
export default async function VariablePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "0" } = await searchParams;
  if (!isVariableStep(step)) notFound();
  return <VariableScreen step={step} />;
}
