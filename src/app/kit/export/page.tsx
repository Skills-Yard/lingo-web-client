import { notFound } from "next/navigation";
import { ExportPage } from "@/components/kit/runtime/ExportPage";

/** `/kit/export` — writes the modules' screens out as data files (development only). */
export default function KitExportPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ExportPage />;
}
