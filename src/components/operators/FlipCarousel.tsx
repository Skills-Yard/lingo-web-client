"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import type { InteractionApi } from "./screen";

/** The colour of a card's back, to go with its picture. */
export type CardTint = "teal" | "pink" | "blue" | "amber";

/**
 * A card of the carousel. Its front is the whole card as one picture (the
 * scene and its name, rounded corners and white edge included); its back says
 * what is going on in the scene.
 */
export type FlipCardItem = { id: string; image: string; verb: string; label: string; caption: string; tint: CardTint };

/** The card pictures are 1:1.459 (width : height). */
const CARD_W = 230;
const CARD_H = 336;
/** The pictures' corners are rounded to 11.5% of their width, and edged in white to 1.9%. */
const CARD_RADIUS = 26;
const CARD_EDGE = 4;
/** Space above the cards, and the room under them for the dots. */
const BAND_PAD = 10;
const BAND_PAD_BOTTOM = 40;
/** Distance between the centred card and each neighbour. */
const STEP = 218;
const SIDE_SCALE = 0.9;
/** Where a card sits that is neither centred nor a neighbour: out of sight, beyond the left one. */
const HIDDEN = -2;
const FLIP_S = 0.5;
/** The first card turns over by itself, once, to show what a tap does: this long (ms) after Hex has finished his line, and held up this long (ms). */
const DEMO_DELAY_MS = 700;
const DEMO_HOLD_MS = 2400;
/** Once that is done the carousel plays through the cards, once: how long each stays centred before it moves on by itself (ms). */
const AUTOPLAY_CARD_MS = 2600;
/** After the last card is turned, how long its back stays up before the stage is done (ms). */
const FLIP_DONE_MS = 1600;
const SWIPE_OFFSET = 50;
const SWIPE_VELOCITY = 400;
const SLIDE = { duration: 0.7, ease: [0.32, 0.72, 0, 1] } as const;
const FADE = { duration: 0.25 } as const;
const INSTANT = { duration: 0 } as const;
const HIDE_BACK = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

const TINT: Record<CardTint, string> = {
  teal: "bg-linear-to-b from-[#E3F7F4] to-[#BDEBE5] dark:from-[#0F2B28] dark:to-[#12403B]",
  pink: "bg-linear-to-b from-[#FDEBEF] to-[#F8CFDA] dark:from-[#34181F] dark:to-[#4A202B]",
  blue: "bg-linear-to-b from-[#E6F0FF] to-[#C9DEFF] dark:from-[#15213A] dark:to-[#1B2E52]",
  amber: "bg-linear-to-b from-[#FFF3DC] to-[#FFE1AB] dark:from-[#3A2C14] dark:to-[#4A3718]",
};
/** The centred card is picked out by a teal edge and glow: on the picture (which has its own rounded shape) as a filter, on the back as a shadow. */
const RING_FILTER = "drop-shadow(2px 0 0 #08A4AD) drop-shadow(-2px 0 0 #08A4AD) drop-shadow(0 2px 0 #08A4AD) drop-shadow(0 -2px 0 #08A4AD) drop-shadow(0 8px 14px rgba(8,164,173,0.35))";
const IDLE_FILTER = "drop-shadow(1px 1px 4px rgba(0,0,0,0.18))";
const BACK_RING = "shadow-[0_0_0_2px_#08A4AD,0_8px_14px_rgba(8,164,173,0.35)]";
const BACK_IDLE = "shadow-[1px_1px_4px_rgba(0,0,0,0.18)]";

/** -1 (left), 0 (centre), 1 (right) or `HIDDEN`: where a card sits around the active one. */
const slotOf = (index: number, active: number, count: number) => {
  const distance = (index - active + count) % count;
  if (distance === 0) return 0;
  if (distance === 1) return 1;
  return distance === count - 1 ? -1 : HIDDEN;
};

/** How far the hint stands above the card's bottom edge: over the foot of the picture, clear of the name under it. */
const TAP_HINT_BOTTOM = 78;

/** "Tap for more details", on the centred card until it has been turned over, so it is clear the card can be tapped. Pulses gently. */
function TapHint() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: reducedMotion ? 1 : [1, 1.07, 1] }}
      transition={{ opacity: { duration: 0.3 }, scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
      className="pointer-events-none absolute left-1/2 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] leading-4 font-bold whitespace-nowrap text-[#08A4AD] shadow-[0_2px_6px_rgba(0,0,0,0.18)] dark:bg-[#15181E]/90"
      style={{ bottom: TAP_HINT_BOTTOM, x: "-50%" }}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 14a8 8 0 0 1-8 8" />
        <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
        <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
        <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
      Tap for more details
    </motion.span>
  );
}

/** A green tick for a card that has been seen; `className` places it (default: the corner of a carousel card). */
export function SeenBadge({ className = "top-3.5 right-3.5" }: { className?: string }) {
  return (
    <span className={`absolute flex size-6 items-center justify-center rounded-full bg-[#01A17F] shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${className}`}>
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/** One card that turns over: its picture on the front, what is going on in the scene on the back. */
function CardFaces({ card, active, flipped, seen }: { card: FlipCardItem; active: boolean; flipped: boolean; seen: boolean }) {
  return (
    <span className="block h-full w-full" style={{ perspective: 900 }}>
      <motion.span
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: FLIP_S, ease: [0.45, 0, 0.25, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative block h-full w-full"
      >
        <span className="absolute inset-0" style={HIDE_BACK}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image}
            alt=""
            draggable={false}
            decoding="async"
            className="h-full w-full object-contain select-none transition-[filter] duration-300"
            style={{ filter: active ? RING_FILTER : IDLE_FILTER }}
          />
          {seen && <SeenBadge />}
          {active && !seen && <TapHint />}
        </span>
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 border-white px-5 text-center ${TINT[card.tint]} ${active ? BACK_RING : BACK_IDLE}`}
          style={{ ...HIDE_BACK, transform: "rotateY(180deg)", borderRadius: CARD_RADIUS, borderWidth: CARD_EDGE }}
        >
          <span className="text-[13px] leading-4 font-bold tracking-wide text-[#08A4AD] uppercase">
            {card.verb} {card.label}
          </span>
          <span className="text-[20px] leading-7 font-semibold text-[#2F5D59] dark:text-[#BFE6E2]">{card.caption}</span>
        </span>
      </motion.span>
    </span>
  );
}

/**
 * Scenes to explore as a looping carousel of flip cards: the centred card has
 * its neighbours peeking in at the sides. To show what a tap does, the first
 * card turns over by itself once, as soon as Hex has finished his line, shows its
 * back for a moment and turns face up again. Then the carousel plays through the
 * cards once on its own (the active dot fills as the countdown) and ends back on
 * the first. From then on the learner explores: swipe, tap a neighbour, tap a dot
 * or use the arrow keys to move, tap the centred card and it turns over to show
 * what is going on in the scene on its back, tap it again (or move on) to turn it
 * face up. The first touch ends the demonstration and the autoplay at once.
 * Done once every card has been turned over (the demonstration counts for the
 * first).
 */
export function FlipCarouselStage({ api, cards }: { api: InteractionApi; cards: readonly FlipCardItem[] }) {
  // A screen that does not say when Hex has finished is taken to have no line to wait for.
  const { done, lineTyped = true } = api;
  const count = cards.length;
  // `from` is kept so a card that wraps round from one end to the other is placed at once, not slid across.
  const [move, setMove] = useState({ from: 0, to: 0 });
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  // The one demonstration, then the one autoplay (how many cards it has moved on), and whether the learner has taken over before they ended.
  const [demo, setDemo] = useState<"waiting" | "showing" | "over">("waiting");
  const [autoSteps, setAutoSteps] = useState(0);
  const [takenOver, setTakenOver] = useState(false);
  const reducedMotion = useReducedMotion();
  const active = move.to;
  const firstId = cards[0]?.id;
  const autoplaying = demo === "over" && !takenOver && autoSteps < count && !reducedMotion && count > 1;

  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setTimeout(() => {
      setMove((current) => ({ from: current.to, to: (current.to + 1) % count }));
      setAutoSteps((steps) => steps + 1);
    }, AUTOPLAY_CARD_MS);
    return () => window.clearTimeout(timer);
  }, [autoplaying, active, count]);

  useEffect(() => {
    if (!lineTyped || takenOver || reducedMotion || demo === "over" || !firstId) return;
    const showing = demo === "showing";
    const timer = window.setTimeout(
      () => {
        if (showing) {
          setFlippedId(null);
          setDemo("over");
          return;
        }
        setFlippedId(firstId);
        setSeen((current) => (current.includes(firstId) ? current : [...current, firstId]));
        setDemo("showing");
      },
      showing ? DEMO_HOLD_MS : DEMO_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [demo, lineTyped, takenOver, reducedMotion, firstId]);

  // Once every card has been turned over, the last one's back stays up a moment before the stage is done.
  useEffect(() => {
    if (seen.length < count) return;
    const timer = window.setTimeout(done, FLIP_DONE_MS);
    return () => window.clearTimeout(timer);
  }, [seen.length, count, done]);

  const goTo = (index: number) => {
    setTakenOver(true);
    const target = (index + count) % count;
    if (target === active) return;
    setMove({ from: active, to: target });
    setFlippedId(null);
  };

  const flip = (card: FlipCardItem) => {
    const turningOver = flippedId !== card.id;
    setFlippedId(turningOver ? card.id : null);
    if (turningOver) setSeen((current) => (current.includes(card.id) ? current : [...current, card.id]));
  };

  const press = (card: FlipCardItem, index: number) => {
    setTakenOver(true);
    playClickSound();
    vibrateForTap();
    if (index === active) flip(card);
    else goTo(index);
  };

  return (
    <div
      className="pointer-events-auto relative w-(--stage-w) max-w-none shrink-0 touch-pan-y overflow-hidden outline-none"
      style={{ height: BAND_PAD + CARD_H + BAND_PAD_BOTTOM }}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") goTo(active + 1);
        if (event.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      {/* The tint fades out toward the top and bottom edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#04ACAB]/12 dark:bg-[#04ACAB]/30 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
      <motion.div
        className="absolute inset-0"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragSnapToOrigin
        onDragStart={() => setTakenOver(true)}
        onDragEnd={(_, info) => {
          if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) goTo(active + 1);
          else if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) goTo(active - 1);
        }}
      >
        {cards.map((card, index) => {
          const slot = slotOf(index, active, count);
          const hidden = slot === HIDDEN;
          const wrapped = Math.abs(slot - slotOf(index, move.from, count)) > 1.5;
          return (
            <motion.button
              key={card.id}
              type="button"
              aria-label={`${card.verb} ${card.label}`}
              aria-pressed={slot === 0 ? flippedId === card.id : undefined}
              tabIndex={-1}
              onClick={() => press(card, index)}
              initial={false}
              animate={{ x: slot * STEP, scale: slot === 0 ? 1 : SIDE_SCALE, opacity: hidden ? 0 : 1 }}
              transition={{ x: wrapped ? INSTANT : SLIDE, scale: SLIDE, opacity: FADE }}
              style={{ width: CARD_W, height: CARD_H, top: BAND_PAD, marginLeft: -CARD_W / 2, zIndex: slot === 0 ? 1 : 0, pointerEvents: hidden ? "none" : "auto" }}
              className="absolute left-1/2 block cursor-pointer"
            >
              <CardFaces card={card} active={slot === 0} flipped={slot === 0 && flippedId === card.id} seen={seen.includes(card.id)} />
            </motion.button>
          );
        })}
      </motion.div>
      <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5" role="tablist" aria-label="Scenes">
        {cards.map((card, index) => (
          <button key={card.id} type="button" role="tab" aria-selected={index === active} aria-label={`${card.verb} ${card.label}`} onClick={() => goTo(index)} className="flex h-4 cursor-pointer items-center">
            <span className={`relative block h-2 overflow-hidden rounded-full transition-all duration-300 ease-out ${index === active ? "w-6 bg-[#08A4AD]/25" : "w-2 bg-[#BFC3C9] dark:bg-white/25"}`}>
              {/* While it autoplays, the countdown to the next card: a teal fill that grows across the light track, restarting on every card. Otherwise the active dot is just full. */}
              {index === active && (
                <motion.span
                  key={autoplaying ? "auto" : "still"}
                  aria-hidden
                  className="absolute inset-0 origin-left rounded-full bg-[#08A4AD]"
                  initial={{ scaleX: autoplaying ? 0 : 1 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: autoplaying ? AUTOPLAY_CARD_MS / 1000 : 0, ease: "linear" }}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
