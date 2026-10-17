import { redirect } from "next/navigation";
import { onboardingHref } from "@/lib/routes";

/**
 * The site's main entry point forwards to the onboarding (`/onboarding`).
 * The interleaved instructions-intro design comparison that used to live
 * here still exists at `/module1/combined` (and `/module1/review`).
 */
export default function HomePage() {
  redirect(onboardingHref());
}
