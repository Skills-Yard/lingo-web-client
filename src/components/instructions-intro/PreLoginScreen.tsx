"use client";

import { Sekuya } from "next/font/google";
import { RobuEyeBlink } from "./RobuEyeBlink";
import { Button3D } from "@/components/ui/Button3D";

// Sekuya only ships one weight (400) — still passed explicitly since
// next/font requires it for any non-variable Google font. Same face as the
// splash's own "LINGO" wordmark (see RobuSplash), just green-on-white here
// instead of white-on-green.
const sekuya = Sekuya({ subsets: ["latin"], weight: "400" });

interface PreLoginScreenProps {
  className?: string;
  /** Fired when "Get Started" is pressed — the caller unmounts this screen
   * in response (it never hides itself) and continues into the flow. */
  onGetStarted: () => void;
}

/**
 * The screen between Robu's splash entrance and the flow itself: a plain
 * "Get Started" / "Log in" landing, full-screen over everything else (same
 * `fixed inset-0` treatment the caller gives RobuSplash — see
 * InstructionsIntroFlow). "Log in" has nowhere to go yet — there's no
 * login/signup route in this app — so it's inert for now; only "Get
 * Started" is wired up, advancing into the existing cover screen.
 *
 * Robu here is the same idle+blink+ear loop `<RobuEyeBlink>` already gives
 * every other standalone appearance of him (the reveal-card modal, game
 * screens) — no boot-up sequence of his own, since RobuSplash already
 * covered that moment.
 */
export function PreLoginScreen({ className, onGetStarted }: PreLoginScreenProps) {
  return (
    <div className={`flex flex-col items-center bg-white ${className ?? ""}`}>
      <h1
        className={`${sekuya.className} pt-[18vh] text-center text-4xl text-[#01A17F] sm:pt-[16vh] sm:text-5xl`}
      >
        LINGO
      </h1>

      <div className="relative flex flex-1 items-center justify-center">
        <RobuEyeBlink className="h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64" />
        {/* Soft contact shadow under Robu's feet — a plain blurred ellipse,
            not part of the Rive artwork itself. */}
        <div
          aria-hidden
          className="absolute bottom-[10%] h-4 w-36 rounded-full bg-black/15 blur-[3px] sm:w-40"
        />
      </div>

      <div className="w-full max-w-xs px-4 pb-6 sm:max-w-sm">
        <Button3D onClick={onGetStarted} className="w-full">
          Get Started
        </Button3D>

        <p className="mt-3 text-center text-base text-[#666666]">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-foreground"
            aria-disabled
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
