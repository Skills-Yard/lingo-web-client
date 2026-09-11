"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { CoverSlide } from "@/lib/constants/instructionsIntro";
import { RevealModal } from "./RevealModal";
import { RobuEyeBlink } from "./RobuEyeBlink";

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

// Choreography for this screen: type the headline out one letter at a
// time → float it up into its settled slot → reveal the illustration →
// reveal the "before we write code" paragraph → reveal the tap-to-reveal
// card → Robu hops in and demo-taps it, then stays put beside it until the
// learner taps it for real.
type Phase =
  | "typing"
  | "float"
  | "image"
  | "para"
  | "reveal"
  | "robuDemo"
  | "idle";

const PHASE_ORDER: Phase[] = [
  "typing",
  "float",
  "image",
  "para",
  "reveal",
  "robuDemo",
  "idle",
];

const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  float: "image",
  image: "para",
  para: "reveal",
  reveal: "robuDemo",
  robuDemo: "idle",
};

const TYPE_SPEED_MS = 45;
const STEP_PAUSE_MS = 550;

export function CoverScreen({ slide }: { slide: CoverSlide }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedLength, setTypedLength] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const fullHeadline = `${slide.highlightWord} ${slide.title}`;
  const highlightLen = slide.highlightWord.length;

  // Reduced-motion viewers get the settled screen immediately — no typing,
  // no floating, no demo-tap.
  const effectivePhase: Phase = reducedMotion ? "idle" : phase;
  const effectiveTypedLength = reducedMotion ? fullHeadline.length : typedLength;

  const reached = (target: Phase) =>
    PHASE_ORDER.indexOf(effectivePhase) >= PHASE_ORDER.indexOf(target);

  // Typewriter: reveal the headline one character at a time, then hand off
  // to the rest of the phase sequence once it's fully typed.
  useEffect(() => {
    if (reducedMotion || phase !== "typing") return;
    if (typedLength >= fullHeadline.length) {
      const t = setTimeout(() => setPhase("float"), STEP_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLength((n) => n + 1), TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, phase, typedLength, fullHeadline.length]);

  // Step through the rest of the choreography, one beat at a time.
  useEffect(() => {
    if (reducedMotion) return;
    const upcoming = NEXT_PHASE[phase];
    if (!upcoming) return;
    const t = setTimeout(() => setPhase(upcoming), STEP_PAUSE_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, phase]);

  const typedText = fullHeadline.slice(0, effectiveTypedLength);
  const typedHighlight = typedText.slice(0, highlightLen);
  const typedRest = typedText.slice(highlightLen);

  return (
    <>
      <div className="flex flex-col gap-3 text-center md:grid md:grid-cols-5 md:gap-x-12 md:items-center md:text-left md:min-h-full">
        {/* ── Headline — types itself out, then floats up into its slot ── */}
        <h1
          aria-label={fullHeadline}
          className={`text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-balance transition-all duration-500 ease-out md:col-span-2 md:col-start-1 md:row-start-1 md:order-1 ${
            effectivePhase === "typing"
              ? "translate-y-2 opacity-90"
              : "translate-y-0 opacity-100"
          }`}
        >
          <span aria-hidden="true">
            <span className="text-primary">{typedHighlight}</span>
            <span className="text-foreground">{typedRest}</span>
            {effectivePhase === "typing" && <span className="cover-caret" />}
          </span>
        </h1>

        {/* ── Illustration — appears once the headline has settled ── */}
        {reached("image") && (
          <div
            className={`relative w-full h-36 md:h-80 flex items-center justify-center overflow-hidden p-3 md:col-span-3 md:col-start-3 md:row-start-1 md:row-span-3 md:order-2 ${
              reducedMotion ? "" : "animate-pop-in"
            }`}
          >
            <Image
              src={slide.imageLight}
              alt=""
              width={759}
              height={512}
              className="h-full w-auto max-w-full object-contain dark:hidden"
            />
            <Image
              src={slide.imageDark}
              alt=""
              width={743}
              height={512}
              className="hidden h-full w-auto max-w-full object-contain dark:block"
            />
          </div>
        )}

        {/* ── Second paragraph — "Before we write code…" ── */}
        {reached("para") && (
          <div
            className={`md:col-span-2 md:col-start-1 md:row-start-2 md:order-3 ${
              reducedMotion ? "" : "animate-fade-in"
            }`}
          >
            {slide.lines.map((line) => (
              <p
                key={line}
                className="text-base md:text-2xl font-semibold text-foreground leading-tight"
              >
                {line}
              </p>
            ))}
            <p className="text-base md:text-2xl font-semibold text-primary leading-tight">
              {slide.highlightLine}
            </p>
          </div>
        )}

        {/* ── Reveal card — Robu demo-taps it, then the learner taps for real ── */}
        {reached("reveal") && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`relative w-full h-40 rounded-[8px] bg-[#1A1C22] p-6 flex items-center gap-8 shadow-lg mt-1 md:mt-0 md:col-span-2 md:col-start-1 md:row-start-3 md:order-4 text-left cursor-pointer hover:bg-[#22252e] active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              reducedMotion ? "" : "animate-pop-in"
            }`}
            aria-label={`${slide.revealLabel} about ${slide.revealSubject}`}
          >
            <div className="w-16 h-40 shrink-0 flex items-center justify-center">
              <img
                src="/images/box.png"
                alt=""
                className="w-full h-[150px] object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="text-left">
              <p className="text-[15px] md:text-base text-white font-medium">
                {slide.revealLabel}
              </p>
              <p className="text-[15px] md:text-base text-[#BEBEBE] font-medium">
                about
              </p>
              <p className="text-xl md:text-2xl font-semibold tracking-wide text-primary">
                {slide.revealSubject}
              </p>
            </div>

            {/* Robu hops in and demo-taps the card, then sits beside it. */}
            {reached("robuDemo") && !modalOpen && (
              <div
                className={`cover-robu-demo ${reducedMotion ? "cover-robu-demo--static" : ""}`}
                aria-hidden="true"
              >
                <RobuEyeBlink className="h-full w-full" />
              </div>
            )}
          </button>
        )}
      </div>

      {/* ── Modal portal ─────────────────────────────────────────── */}
      {modalOpen && (
        <RevealModal slide={slide} onClose={() => setModalOpen(false)} />
      )}

      <style>{`
        .cover-caret {
          display: inline-block;
          width: 2px;
          height: 0.9em;
          margin-left: 2px;
          background: currentColor;
          vertical-align: -0.1em;
          animation: cover-caret-blink 0.8s steps(1) infinite;
        }
        @keyframes cover-caret-blink {
          50% { opacity: 0; }
        }

        .cover-robu-demo {
          position: absolute;
          top: -1.75rem;
          right: -0.5rem;
          width: 3.5rem;
          height: 3.5rem;
          pointer-events: none;
          animation:
            cover-robu-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both,
            cover-robu-tap 0.55s ease-in-out 0.55s 2;
        }
        @media (min-width: 768px) {
          .cover-robu-demo {
            width: 4.5rem;
            height: 4.5rem;
            top: -2rem;
            right: -0.75rem;
          }
        }
        .cover-robu-demo--static {
          animation: none;
        }
        @keyframes cover-robu-in {
          from { transform: translate(24px, 12px) scale(0.5); opacity: 0; }
          to   { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes cover-robu-tap {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-8deg); }
        }
      `}</style>
    </>
  );
}
