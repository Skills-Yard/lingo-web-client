import { redirect } from "next/navigation";

/**
 * Module 1 — the Orbi instructions-intro pages. `/module1` itself just
 * forwards to the interleaved walkthrough; `/module1/review` and
 * `/module1/old-home` sit alongside it.
 */
export default function Module1Page() {
  redirect("/module1/combined");
}
