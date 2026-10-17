import { TeacherFlow } from "@/components/level-one/TeacherFlow";

/** Level 1, screens 2 and 3 — the teacher says something, then the quiz.
 * `?step=quiz` opens on the quiz (where screen 4's Back returns to). */
export default async function LevelOneTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  return <TeacherFlow initialStep={step === "quiz" ? "quiz" : "says"} />;
}
