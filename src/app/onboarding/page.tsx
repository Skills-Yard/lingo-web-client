import { AppFlow } from "@/components/AppFlow";

/**
 * PreLoginScreen, then the career/Python onboarding questionnaire (see
 * OnboardingFlow), then the learner's level page. `?step=` opens any screen
 * directly: `sign-up`, or a step's id in kebab-case — `greeting`, `career`,
 * `good-news`, `python-level`, … `starting-point` (see ONBOARDING_STEPS).
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  return <AppFlow initialStep={step} />;
}
