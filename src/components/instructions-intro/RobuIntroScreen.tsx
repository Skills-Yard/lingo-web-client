"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RobuIntroSlide } from "@/lib/constants/instructionsIntro";
import { RobuIntroMascot } from "./RobuIntroMascot";

// "Hi, I'm Robu" — the very first screen of the flow.
// 1. Robu appears mid-screen (on every device) and introduces itself.
// 2. The greeting types itself out, then the description fades in.
// 3. Robu then shifts into its resting spot with an animation: the right
//    side on large screens (the intro stays on the left), the bottom on
//    mobile.
type Phase = "center" | "typing" | "para" | "settle" | "idle";

const PHASE_ORDER: Phase[] = ["center", "typing", "para", "settle", "idle"];
const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  center: "typing",
  para: "settle",
  settle: "idle",
};

const TYPE_SPEED_MS = 45;
const STEP_PAUSE_MS = 450;
const CENTER_SCALE = 1.06;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Subscribes to the reduced-motion preference without a setState-in-effect. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(REDUCED_MOTION_QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false, // server snapshot — matches the un-animated initial phase
  );
}

export function RobuIntroScreen({ slide }: { slide: RobuIntroSlide }) {
  const [phase, setPhase] = useState<Phase>("center");
  const [typedLength, setTypedLength] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const robuRef = useRef<HTMLDivElement>(null);
  // Pixel offset that pulls Robu from its resting spot (bottom on mobile,
  // right column on laptop) to the exact middle of the screen. Measured
  // once against Robu's actual, untransformed position, so it lines up on
  // any device or content height — no guessed vh/vw values.
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number } | null>(
    null,
  );

  const fullHeadline = `${slide.highlightWord} ${slide.title}`;
  const highlightLen = slide.highlightWord.length;

  // Reduced-motion viewers get the settled screen immediately — Robu
  // already resting in its final spot, full text shown, no shifting.
  const effectivePhase: Phase = reducedMotion ? "idle" : phase;
  const effectiveTypedLength = reducedMotion ? fullHeadline.length : typedLength;

  const reached = (target: Phase) =>
    PHASE_ORDER.indexOf(effectivePhase) >= PHASE_ORDER.indexOf(target);
  // Robu holds the centered pose while it's introducing itself, then lets go.
  const isCentered =
    effectivePhase === "center" ||
    effectivePhase === "typing" ||
    effectivePhase === "para";

  // Measure Robu's resting spot against the viewport once, before it ever
  // moves, so the "centered" pose lands exactly mid-screen on any device.
  useEffect(() => {
    const robu = robuRef.current;
    if (!robu) return;
    const rect = robu.getBoundingClientRect();
    setCenterOffset({
      x: window.innerWidth / 2 - (rect.left + rect.width / 2),
      y: window.innerHeight / 2 - (rect.top + rect.height / 2),
    });
  }, []);

  // Robu shows first, front and center; once settled there, hand off to
  // the typewriter.
  useEffect(() => {
    if (reducedMotion) return;
    const upcoming = NEXT_PHASE[phase];
    if (!upcoming) return;
    const t = setTimeout(() => setPhase(upcoming), STEP_PAUSE_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, phase]);

  // Typewriter: Robu "introduces itself" one character at a time, then the
  // description reveals.
  useEffect(() => {
    if (reducedMotion || phase !== "typing") return;
    if (typedLength >= fullHeadline.length) {
      const t = setTimeout(() => setPhase("para"), STEP_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLength((n) => n + 1), TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, phase, typedLength, fullHeadline.length]);

  const typedText = fullHeadline.slice(0, effectiveTypedLength);
  const typedHighlight = typedText.slice(0, highlightLen);
  const typedRest = typedText.slice(highlightLen);

  const robuTransform =
    isCentered && centerOffset
      ? `translate(${centerOffset.x}px, ${centerOffset.y}px) scale(${CENTER_SCALE})`
      : "translate(0, 0) scale(1)";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center md:grid md:grid-cols-2 md:items-center md:justify-normal md:gap-x-12 md:text-left">
      {/* ── Robu — appears mid-screen first, then shifts into its resting
          spot (top on mobile, right column on laptop) once it's done
          introducing itself. The shift is a measured transform, so it
          transitions smoothly instead of jumping. ── */}
      <div
        ref={robuRef}
        className={`relative z-10 flex w-full items-center justify-center md:order-2 transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          centerOffset === null ? "opacity-0" : "opacity-100"
        }`}
        style={{ transform: robuTransform }}
      >
        {/* Soft ambient glow — pure polish, sits behind Robu. */}
        <div
          aria-hidden="true"
          className={`robu-intro-glow ${reducedMotion ? "" : "animate-pop-in"}`}
        />
        <div className={`relative ${reducedMotion ? "" : "animate-pop-in"}`}>
          <div className={effectivePhase === "idle" && !reducedMotion ? "animate-bounce-slow" : ""}>
            <RobuIntroMascot className="h-[clamp(180px,40vw,320px)] w-[clamp(180px,40vw,320px)]" />
          </div>
          {/* Grounding shadow — stays put while Robu gently bobs above it. */}
          <div aria-hidden="true" className="robu-intro-shadow" />
        </div>
      </div>

      {/* ── Copy — sits just below Robu, both grouped near the middle of the screen on mobile; left column on laptop ── */}
      <div className="flex flex-col items-center gap-3 md:order-1 md:items-start md:gap-5">
        <h1
          aria-label={fullHeadline}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight"
        >
          <span aria-hidden="true">
            <span className="text-primary">{typedHighlight}</span>
            <span className="text-foreground">{typedRest}</span>
            {effectivePhase === "typing" && <span className="robu-intro-caret" />}
          </span>
        </h1>
        {slide.description && reached("para") && (
          <p
            className={`max-w-sm text-sm md:text-base font-medium leading-[1.5] text-[#666666] dark:text-neutral-400 ${
              reducedMotion ? "" : "animate-fade-in"
            }`}
          >
            {slide.description}
          </p>
        )}
      </div>

      <style>{`
        .robu-intro-caret {
          display: inline-block;
          width: 2px;
          height: 0.85em;
          margin-left: 2px;
          background: currentColor;
          vertical-align: -0.1em;
          animation: robu-intro-caret-blink 0.8s steps(1) infinite;
        }
        @keyframes robu-intro-caret-blink {
          50% { opacity: 0; }
        }

        .robu-intro-glow {
          position: absolute;
          inset: 19%;
          pointer-events: none;
          border-radius: 9999px;
          filter: blur(28px);
          background: radial-gradient(circle at 50% 55%, rgba(1, 161, 127, 0.22), rgba(255, 255, 255, 0) 70%);
          animation: robu-intro-glow-pulse 3.2s ease-in-out infinite;
        }
        .dark .robu-intro-glow {
          background: radial-gradient(circle at 50% 55%, rgba(1, 161, 127, 0.32), rgba(9, 12, 19, 0) 70%);
        }
        @keyframes robu-intro-glow-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }

        .robu-intro-shadow {
          position: absolute;
          bottom: -0.35rem;
          left: 50%;
          height: 0.7rem;
          width: 5.5rem;
          transform: translateX(-50%);
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.12);
          filter: blur(4px);
        }
        .dark .robu-intro-shadow {
          background: rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
}
