"use client";

import { Sekuya } from "next/font/google";
import { OnboardingFox } from "./robu/OnboardingFox";
import { Button3D } from "@/components/ui/Button3D";

// Sekuya only ships one weight (400) — still passed explicitly since
// next/font requires it for any non-variable Google font.
const sekuya = Sekuya({ subsets: ["latin"], weight: "400" });

interface PreLoginScreenProps {
  className?: string;
  onGetStarted: () => void;
}

/**
 * The onboarding flow's "Get Started" screen: "LINGO" wordmark, Robu, "Get
 * Started" / "Log in". No ground shadow under Robu — the reference design's
 * own shadow ellipse is deliberately left out. "Log in" has nowhere to go
 * yet — there's no login/signup route in this app — so it's inert for now;
 * only "Get Started" is wired up, advancing into the question flow.
 */
export function PreLoginScreen({ className, onGetStarted }: PreLoginScreenProps) {
  return (
    <div className={`flex flex-col items-center bg-white ${className ?? ""}`}>
      <h1
        className={`${sekuya.className} pt-[18vh] text-center text-4xl text-[#01A17F] sm:pt-[16vh] sm:text-5xl`}
      >
        LINGO
      </h1>

      <div className="flex flex-1 items-center justify-center">
        <OnboardingFox className="h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64" />
      </div>

      <div className="w-full max-w-xs px-4 pb-6 sm:max-w-sm">
        <Button3D onClick={onGetStarted} className="w-full">
          Get Started
        </Button3D>

        <p className="mt-3 text-center text-base text-[#666666]">
          Already have an account?{" "}
          <button type="button" className="font-medium text-foreground" aria-disabled>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
