import { notFound } from "next/navigation";
import { CareerRoute } from "@/components/home/HomeRoutes";
import { CAREERS, careerById } from "@/components/home/careersData";

export const generateStaticParams = () => CAREERS.map(({ id }) => ({ id }));

/** `/careers/<id>` — one career; Start sends the learner down the level path. */
export default async function CareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!careerById(id)) notFound();
  return <CareerRoute id={id} />;
}
