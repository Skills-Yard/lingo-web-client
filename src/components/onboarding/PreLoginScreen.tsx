"use client";

import { Sekuya } from "next/font/google";
import { FoxSlot } from "./foxStage";

// Sekuya only ships one weight (400) — still passed explicitly since
// next/font requires it for any non-variable Google font.
const sekuya = Sekuya({ subsets: ["latin"], weight: "400" });

interface PreLoginScreenProps {
  className?: string;
}

/**
 * The onboarding flow's "Get Started" screen: "LINGO" wordmark, Robu, "Get
 * Started" / "Log in". No ground shadow under Robu — the reference design's
 * own shadow ellipse is deliberately left out. "Log in" has nowhere to go
 * yet — there's no login/signup route in this app — so it's inert for now;
 * only "Get Started" is wired up, advancing into the question flow.
 */
export function PreLoginScreen({ className }: PreLoginScreenProps) {
  return (
    <div className={`flex flex-col items-center bg-white ${className ?? ""}`}>
      <h1
        className={`${sekuya.className} pt-[12dvh] text-center text-4xl text-[#01A17F] sm:text-5xl`}
      >
        LINGO
      </h1>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <FoxSlot className="aspect-square h-[min(16rem,34dvh)]" />
      </div>
    </div>
  );
}
