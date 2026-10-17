"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LevelOneShell } from "./LevelOneShell";

const EXAMPLES = [
  { id: "parent", src: "/images/level-one/example-parent.png", label: "Parent eats the food" },
  { id: "coach", src: "/images/level-one/example-coach.png", label: "Coach gives a command" },
  { id: "traffic", src: "/images/level-one/example-traffic.png", label: "Traffic signal says stop" },
] as const;

const CARD_WIDTH = 215;
/** The cards are 661x1174 / 599x1064 — about 1:1.78. */
const CARD_HEIGHT = 382;
/** Space above the cards, inside the tinted band. */
const BAND_PAD = 32;
/** Space below the cards: a gap, then the pagination bars. */
const BAND_PAD_BOTTOM = 86;
/** Distance between the centre card and each neighbour. */
const STEP = 113;
const SIDE_SCALE = 0.88;
/** Time each card stays centred before the carousel moves on by itself. */
const AUTO_ADVANCE_MS = 3600;
const SWIPE_OFFSET = 50;
const SWIPE_VELOCITY = 400;

/** -1 (left), 0 (centre) or 1 (right): where a card sits around the active one. */
const slotOf = (index: number, active: number) => {
  const distance = (index - active + EXAMPLES.length) % EXAMPLES.length;
  if (distance === 0) return 0;
  return distance === 1 ? 1 : -1;
};

/**
 * `/level-one/4` — "Some examples of instruction": a looping carousel of
 * example cards. The active card is centred with its neighbours peeking in
 * from each side; swipe, tap a neighbour or use the arrow keys to move.
 */
export function ExamplesScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  // Auto-play stops while the learner is touching the carousel, and every
  // move (auto or manual) restarts the countdown.
  const [holding, setHolding] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (holding) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % EXAMPLES.length),
      AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [active, holding]);

  const go = (direction: 1 | -1) =>
    setActive((current) => (current + direction + EXAMPLES.length) % EXAMPLES.length);

  return (
    <LevelOneShell
      step={4}
      onBack={() => router.push("/level-one/2?step=quiz")}
      onContinue={onContinue ?? (() => router.push("/level-one/5"))}
    >
      <h1 className="mt-9 w-[264px] shrink-0 text-center text-[24px] leading-[1.34] font-semibold text-[#444444] dark:text-white">
        Some <span className="text-brand-gradient">examples</span> of instruction
      </h1>

      {/* The band is centred in the space between the heading and Continue,
        so the gap above and below it is equal (the -mb-4 cancels the
        column's own bottom padding). */}
      <div className="-mb-4 flex w-full flex-1 items-center justify-center py-4">
      <div
        className="relative w-(--stage-w) max-w-none shrink-0 touch-pan-y overflow-hidden outline-none"
        style={{ height: CARD_HEIGHT + BAND_PAD + BAND_PAD_BOTTOM }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {/* The tint fades out toward the top and bottom edges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#04ACAB]/12 dark:bg-[#04ACAB]/30 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
        />
        <motion.div
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          dragSnapToOrigin
          onDragStart={() => setHolding(true)}
          onDragEnd={(_, info) => {
            setHolding(false);
            if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) go(1);
            else if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) go(-1);
          }}
        >
          {EXAMPLES.map((example, index) => {
            const slot = slotOf(index, active);
            return (
              <motion.button
                key={example.id}
                type="button"
                aria-label={example.label}
                aria-current={slot === 0}
                tabIndex={-1}
                onClick={() => slot !== 0 && go(slot)}
                initial={false}
                animate={{
                  x: slot * STEP,
                  y: slot === 0 ? 0 : 14,
                  scale: slot === 0 ? 1 : SIDE_SCALE,
                  rotate: slot * 4,
                  opacity: slot === 0 ? 1 : 0.85,
                  filter: slot === 0 ? "brightness(1)" : "brightness(0.9)",
                }}
                transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  top: BAND_PAD,
                  marginLeft: -CARD_WIDTH / 2,
                  zIndex: slot === 0 ? 1 : 0,
                }}
                className="absolute left-1/2 block cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={example.src}
                  alt=""
                  draggable={false}
                  className="h-full w-full rounded-[18px] object-fill select-none drop-shadow-[0_14px_22px_rgba(4,172,171,0.28)]"
                />
              </motion.button>
            );
          })}
        </motion.div>
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5" role="tablist" aria-label="Examples">
          {EXAMPLES.map((example, index) => (
            <button
              key={example.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={example.label}
              onClick={() => setActive(index)}
              className="flex h-4 cursor-pointer items-center"
            >
              <span
                className={`relative block h-2 overflow-hidden rounded-full transition-all duration-500 ease-out ${
                  index === active ? "w-6 bg-primary/25" : "w-3 bg-[#BFC3C9] dark:bg-white/25"
                }`}
              >
                {/* The countdown to the next card: a darker green fill that
                  grows across the light track, restarting on every card. */}
                {index === active && (
                  <motion.span
                    key={holding ? "held" : "running"}
                    aria-hidden
                    className="absolute inset-0 origin-left rounded-full bg-primary"
                    initial={{ scaleX: reducedMotion ? 1 : 0 }}
                    animate={{ scaleX: holding && !reducedMotion ? 0 : 1 }}
                    transition={{ duration: reducedMotion || holding ? 0 : AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      </div>
    </LevelOneShell>
  );
}
