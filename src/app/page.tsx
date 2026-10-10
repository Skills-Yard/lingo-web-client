import { AppFlow } from "@/components/AppFlow";

/**
 * The site's main entry point — PreLoginScreen, then the career/Python
 * onboarding questionnaire (see OnboardingFlow), then the learner's home
 * (HomeScreen). The interleaved instructions-intro design comparison that
 * used to live here still exists at `/module1/combined` (and
 * `/module1/review`).
 */
export default function HomePage() {
  return <AppFlow />;
}
