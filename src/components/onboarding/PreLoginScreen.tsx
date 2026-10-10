"use client";

interface PreLoginScreenProps {
  className?: string;
}

/**
 * The onboarding flow's "Get Started" screen: "Lingo" wordmark, Robu, "Get
 * Started" / "Log in". No ground shadow under Robu — the reference design's
 * own shadow ellipse is deliberately left out. "Log in" has nowhere to go
 * yet — there's no login/signup route in this app — so it's inert for now;
 * only "Get Started" is wired up, advancing into the question flow.
 */
export function PreLoginScreen({ className }: PreLoginScreenProps) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      {/* The "Lingo" wordmark and Hex are both drawn by the splash layer
        (OnboardingSplash), which places the wordmark just above wherever
        Hex lands on this screen size. */}
      <div className="min-h-0 flex-1" />
    </div>
  );
}
