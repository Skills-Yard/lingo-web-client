import { redirect } from "next/navigation";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  redirect(step ? `/module1/intro?step=${step}` : "/module1/intro");
}
