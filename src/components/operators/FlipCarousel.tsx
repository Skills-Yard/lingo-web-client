"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";

export type CardTint = "teal" | "pink" | "blue" | "amber";

/** A card of the carousel: the action and the thing on its front, what is going on in the scene on its back. */
export type FlipCardItem = { id: string; pic: string; verb: string; label: string; caption: string; tint: CardTint };

const CARD_W = 236;
const CARD_H = 328;
/** Space above the cards, and the room under them for the dots. */
const BAND_PAD = 10;
const BAND_PAD_BOTTOM = 46;
/** Distance between the centred card and each neighbour. */
const STEP = 212;
const SIDE_SCALE = 0.9;
/** Where a card sits that is neither centred nor a neighbour: out of sight, beyond the left one. */
const HIDDEN = -2;
const FLIP_S = 0.5;
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
const EDGE_ACTIVE = "border-[#08A4AD] shadow-[0_0_0_4px_rgba(8,164,173,0.15),0_10px_26px_rgba(8,164,173,0.28)]";
const EDGE_IDLE = "border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent";

/** -1 (left), 0 (centre), 1 (right) or `HIDDEN`: where a card sits around the active one. */
const slotOf = (index: number, active: number, count: number) => {
  const distance = (index - active + count) % count;
  if (distance === 0) return 0;
  if (distance === 1) return 1;
  return distance === count - 1 ? -1 : HIDDEN;
};

function SeenBadge() {
  return (
    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#01A17F] shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/** One card that turns over: the picture, the action and the thing on the front, what is going on on the back. */
function CardFaces({ card, active, flipped, seen }: { card: FlipCardItem; active: boolean; flipped: boolean; seen: boolean }) {
  const edge = active ? EDGE_ACTIVE : EDGE_IDLE;
  return (
    <span className="block h-full w-full" style={{ perspective: 900 }}>
      <motion.span
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: FLIP_S, ease: [0.45, 0, 0.25, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative block h-full w-full"
      >
        <span className={`absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border-[3px] bg-white dark:bg-[#15181E] ${edge}`} style={HIDE_BACK}>
          <span className={`relative flex flex-1 items-center justify-center ${TINT[card.tint]}`}>
            <Pic src={card.pic} className="h-32 w-32" />
            {seen && <SeenBadge />}
          </span>
          <span className="flex h-[92px] shrink-0 flex-col items-center justify-center px-2">
            <span className="text-[16px] leading-5 font-semibold text-[#444444] dark:text-white">{card.verb}</span>
            <span className="text-level-gradient text-[28px] leading-8 font-extrabold">{card.label}</span>
          </span>
        </span>
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[22px] border-[3px] px-5 text-center ${TINT[card.tint]} ${edge}`}
          style={{ ...HIDE_BACK, transform: "rotateY(180deg)" }}
        >
          <Pic src={card.pic} className="h-16 w-16" />
          <span className="text-[13px] leading-4 font-bold tracking-wide text-[#08A4AD] uppercase">
            {card.verb} {card.label}
          </span>
          <span className="text-[19px] leading-[26px] font-semibold text-[#2F5D59] dark:text-[#BFE6E2]">{card.caption}</span>
        </span>
      </motion.span>
    </span>
  );
}

/**
 * Scenes to explore as a looping carousel of flip cards: the centred card has
 * its neighbours peeking in at the sides; swipe, tap a neighbour, tap a dot or
 * use the arrow keys to move. Tap the centred card and it turns over to show
 * what is going on in the scene on its back; tap it again (or move on) to turn it
 * face up. Done once every card has been turned over.
 */
export function FlipCarouselStage({ api, cards }: { api: InteractionApi; cards: readonly FlipCardItem[] }) {
  const { done } = api;
  const count = cards.length;
  // `from` is kept so a card that wraps round from one end to the other is placed at once, not slid across.
  const [move, setMove] = useState({ from: 0, to: 0 });
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const active = move.to;

  const goTo = (index: number) => {
    const target = (index + count) % count;
    if (target === active) return;
    setMove({ from: active, to: target });
    setFlippedId(null);
  };

  const flip = (card: FlipCardItem) => {
    const turningOver = flippedId !== card.id;
    setFlippedId(turningOver ? card.id : null);
    if (!turningOver || seen.includes(card.id)) return;
    const next = [...seen, card.id];
    setSeen(next);
    if (next.length === count) window.setTimeout(() => done(), FLIP_DONE_MS);
  };

  const press = (card: FlipCardItem, index: number) => {
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
            <span className={`block h-2 rounded-full transition-all duration-300 ease-out ${index === active ? "w-6 bg-[#08A4AD]" : "w-2 bg-[#BFC3C9] dark:bg-white/25"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
