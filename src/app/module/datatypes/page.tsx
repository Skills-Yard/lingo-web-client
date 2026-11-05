import { notFound } from "next/navigation";
import { DataTypesRoute } from "@/components/datatypes/DataTypesRoute";
import { isDatatypesStep } from "@/components/datatypes/datatypes";

/** The Data Types module's screens: `/module/datatypes?step=1` … `step=30` (default 1), plus `step=complete`. */
export default async function DataTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step = "1" } = await searchParams;
  if (!isDatatypesStep(step)) notFound();
  return <DataTypesRoute step={step} />;
}
