import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

/**
 * The site's main entry point — PreLoginScreen, then the career/Python
 * onboarding questionnaire (see OnboardingFlow). This replaces the
 * interleaved instructions-intro design comparison that used to live here;
 * that comparison still exists at `/module1/combined` (and `/module1/review`), just no
 * longer on `/` itself.
 */
export default function HomePage() {
  return <OnboardingFlow />;
}
