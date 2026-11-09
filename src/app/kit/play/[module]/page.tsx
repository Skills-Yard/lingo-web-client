import { notFound } from "next/navigation";
import { ModuleRunner } from "@/components/kit/runtime/ModuleRunner";
import { playableIds } from "@/components/kit/runtime/modules";

/** `/kit/play/<module>?step=N` — a module played from its data file (`src/data/modules/<module>.json`), step `1`… or `complete`. */
export default async function PlayPage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ step?: string }> }) {
  const { module } = await params;
  const { step = "1" } = await searchParams;
  if (!playableIds().includes(module) || !(step === "complete" || /^\d+$/.test(step))) notFound();
  return <ModuleRunner id={module} step={step} />;
}
