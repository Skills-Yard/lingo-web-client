"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { MeetRobuSlide } from "@/lib/constants/instructionsIntro";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// robu.riv's "State Machine 1" exposes no inputs and its ViewModel no usable
// properties, and every clip inside it is a one-shot. So we run our own loop,
// showing Robu's expressions one at a time.
const SHOWCASE: { anim: string; label: string }[] = [
  { anim: "idle", label: "Idle" },
  { anim: "eyebrow", label: "Eyebrow" },
  { anim: "eyeblink", label: "Blink" },
  { anim: "ears idle", label: "Ears" },
  { anim: "happy", label: "Happy" },
  { anim: "excited", label: "Excited" },
];
// How long each expression stays on screen before the next one.
const STEP_MS = 2200;

export function MeetRobuScreen({ slide }: { slide: MeetRobuSlide }) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    animations: [SHOWCASE[0].anim],
    autoBind: true,
    autoplay: true,
  });

  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Match the drawing surface to the container once the instance is ready so
  // the first paint is sharp and doesn't trigger a resize-driven repaint.
  useEffect(() => {
    rive?.resizeDrawingSurfaceToCanvas();
  }, [rive]);

  // Play one expression on its own (each clip is a one-shot).
  const show = useCallback(
    (index: number) => {
      if (!rive) return;
      const n = ((index % SHOWCASE.length) + SHOWCASE.length) % SHOWCASE.length;
      stepRef.current = n;
      setStep(n);
      rive.stop();
      rive.play(SHOWCASE[n].anim);
    },
    [rive],
  );

  const startLoop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(
      () => show(stepRef.current + 1),
      STEP_MS,
    );
  }, [show]);

  // Auto-advance through every expression, one at a time. The first pose
  // ("idle") is already autoplaying from the `animations` prop, and
  // reduced-motion viewers keep just that calm pose.
  useEffect(() => {
    if (!rive) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    startLoop();
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [rive, startLoop]);

  // Tapping Robu jumps to the next expression and keeps the loop rolling.
  const handleAdvance = () => {
    show(stepRef.current + 1);
    if (timerRef.current !== null) startLoop();
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-5 md:gap-x-12 md:items-center md:text-left md:min-h-full">
      {/* ── Text column ── */}
      <div className="flex flex-col items-center gap-3 md:col-span-2 md:items-start md:gap-5 md:order-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
          <span className="text-primary">{slide.highlightWord}</span>{" "}
          <span className="text-foreground">{slide.title}</span>
        </h1>

        <div className="flex flex-col items-center gap-1 md:items-start">
          <p className="text-3xl md:text-4xl font-extrabold leading-none text-primary [font-family:'Abhaya_Libre_ExtraBold','Abhaya_Libre',Georgia,serif]">
            {slide.name}
          </p>
          <p className="text-sm font-medium text-[#666666] dark:text-neutral-400">
            {slide.tagline}
          </p>
        </div>

        <p className="max-w-sm text-sm font-medium leading-[1.5] text-[#666666] dark:text-neutral-400">
          {slide.description}
        </p>

        <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
          {slide.traits.map((trait) => (
            <li
              key={trait}
              className="rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary dark:bg-primary/10"
            >
              {trait}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Animation column — Robu on a soft glow, cycling expressions ── */}
      <div className="relative flex w-full flex-col items-center gap-3 md:col-span-3 md:order-2">
        <div className="relative flex w-full items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl [background:radial-gradient(circle_at_50%_60%,rgba(1,161,127,0.20),rgba(255,255,255,0)_70%)] dark:[background:radial-gradient(circle_at_50%_60%,rgba(1,161,127,0.30),rgba(9,12,19,0)_70%)]"
          />
          <button
            type="button"
            onClick={handleAdvance}
            aria-label={`${slide.name} expressions — tap for the next one`}
            className="relative h-[clamp(220px,42vh,380px)] w-[clamp(220px,42vh,380px)] cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <RiveComponent />
          </button>
        </div>

        {/* Current expression label — makes the one-by-one showcase explicit,
            and updates in lock-step with the clip that's playing. */}
        <p
          aria-live="polite"
          className="rounded-full border border-primary/30 bg-primary/[0.06] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary dark:bg-primary/10"
        >
          {SHOWCASE[step].label}
          <span className="ml-1.5 text-primary/50">
            {step + 1}/{SHOWCASE.length}
          </span>
        </p>
      </div>
    </div>
  );
}
