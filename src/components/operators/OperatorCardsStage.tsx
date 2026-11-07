"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SeenBadge } from "./FlipCarousel";
import type { InteractionApi } from "./screen";
import { CURRENT_SCALE, EDGE_CURRENT, EDGE_IDLE, TINT, useTurn, type SituationTint } from "./SituationsStage";
import { Pic } from "./visuals";

/** An operator: the symbol as it is written in code, its name, what it does, and an example of it. */
export type OperatorItem = { id: string; symbol: string; name: string; title: string; example: string; tint: SituationTint };

/** A job a program does with values: its picture, its name, the questions it answers, and an example of it. */
export type JobItem = { id: string; pic: string; name: string; title: string; example: string; tint: SituationTint };

/** How faint the cards not being introduced are. */
const DIM_OPACITY = 0.3;

/** The solid colour of an operator's symbol, to go with the tint of its card. */
const ACCENT: Record<SituationTint, string> = { lavender: "#7B61FF", cream: "#E8743B", mint: "#08A4AD", blue: "#3B82F6" };

/** The operator's symbol on a coloured tile, as a key that can be pressed. */
function SymbolTile({ symbol, tint, size = "large" }: { symbol: string; tint: SituationTint; size?: "small" | "large" }) {
  const look = size === "small" ? "size-9 rounded-[10px] text-[22px]" : "size-14 rounded-[14px] text-[34px]";
  return (
    <span
      // The asterisk is drawn high in its line, so it is let down to the middle of the tile.
      className={`flex shrink-0 items-center justify-center font-mono font-bold text-white ${look} ${symbol === "*" ? "pt-2" : ""}`}
      style={{ backgroundColor: ACCENT[tint], boxShadow: "0 3px 0 rgba(0,0,0,0.22)" }}
    >
      {symbol}
    </span>
  );
}

/** A card of a turn: its name, a line on what it is, an example, and its picture (big on the card, small by the example). */
type TurnCard = { id: string; tint: SituationTint; name: string; title: string; example: string; art: ReactNode; chip: ReactNode };

/**
 * A grid of cards to be introduced one by one, not tapped: this stage is the
 * turn of one of them (`focus`), as in "Explore the situations!". Its own card
 * is picked out while Hex introduces it and the others fade back (those before
 * it keep their tick), and an example of it comes up under the grid. Continue
 * then goes on to the stage after this one, the next card's turn.
 */
function TurnCardsStage({
  api,
  cards,
  focus,
  tall = false,
  columns = 2,
  header,
}: {
  api: InteractionApi;
  cards: readonly TurnCard[];
  /** The card whose turn it is. */
  focus: number;
  /** Taller cards, for a row of two. */
  tall?: boolean;
  /** Cards across (three narrower, shorter ones for three cards). */
  columns?: 2 | 3;
  /** A picture over the cards; it is told whether the card is picked out yet. */
  header?: (lit: boolean) => ReactNode;
}) {
  const lit = useTurn(api);
  const focused = cards[focus];
  const three = columns === 3;
  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      {header?.(lit)}
      <div className={`grid w-full ${three ? "grid-cols-3 gap-2.5" : "grid-cols-2 gap-3"}`}>
        {cards.map((card, index) => {
          const current = lit && index === focus;
          // Only the card being introduced stays bright; the rest fade back once the turn starts.
          const dimmed = index !== focus && (lit || focus > 0);
          const wasCurrent = index === focus - 1;
          return (
            <motion.div
              key={card.id}
              // The first turn brings the cards in; a later one starts as the one before it ended (its card bright, the rest faded), so the hand-over is smooth.
              initial={focus === 0 ? { opacity: 0, y: 16, scale: 0.96 } : { opacity: wasCurrent ? 1 : DIM_OPACITY, y: 0, scale: wasCurrent ? CURRENT_SCALE : 1 }}
              animate={{ opacity: dimmed ? DIM_OPACITY : 1, y: 0, scale: current ? CURRENT_SCALE : 1 }}
              transition={{ duration: 0.35, delay: focus === 0 && !lit ? index * 0.08 : 0, scale: { type: "spring", stiffness: 320, damping: 22 } }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-[10px] border-4 py-2 transition-[border-color,box-shadow] duration-200 ${three ? "h-[128px] px-1" : "px-2"} ${tall ? "h-[150px]" : three ? "" : "h-[118px]"} ${TINT[card.tint]} ${current ? EDGE_CURRENT : EDGE_IDLE}`}
            >
              <motion.span animate={{ y: current ? [0, -5, 0] : 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
                {card.art}
              </motion.span>
              {/* In a row of three a name can take two lines: both get room, so the keys stand level. */}
              <span className={`flex items-start justify-center text-center text-[14px] leading-[18px] font-bold text-[#444444] dark:text-white ${three ? "min-h-9" : ""}`}>{card.name}</span>
              {index < focus && <SeenBadge className="top-1.5 right-1.5" />}
            </motion.div>
          );
        })}
      </div>
      <div className="flex h-[60px] w-full items-center justify-center">
        <motion.div
          initial={false}
          animate={{ opacity: lit ? 1 : 0, y: lit ? 0 : 8 }}
          transition={{ duration: 0.3 }}
          className="flex w-full items-center justify-center gap-3.5 rounded-[12px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E]"
        >
          {focused.chip}
          <span className="flex flex-col">
            <span className="text-[13px] leading-4 font-bold text-[#2F5D59] dark:text-[#BFE6E2]">{focused.title}</span>
            <span className="font-mono text-[20px] leading-6 font-bold text-[#444444] dark:text-white">{focused.example}</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}

/** The turn of one operator (`focus`): its symbol on a key, its name, what it does and an example. */
export function OperatorTurnStage({
  api,
  operators,
  focus,
  columns,
  header,
}: {
  api: InteractionApi;
  operators: readonly OperatorItem[];
  focus: number;
  /** Cards across: 2 (the default) or 3. */
  columns?: 2 | 3;
  /** A picture over the cards; it is told whether the operator's card is picked out yet. */
  header?: (lit: boolean) => ReactNode;
}) {
  const cards = operators.map((operator) => ({
    id: operator.id,
    tint: operator.tint,
    name: operator.name,
    title: operator.title,
    example: operator.example,
    art: <SymbolTile symbol={operator.symbol} tint={operator.tint} />,
    chip: <SymbolTile symbol={operator.symbol} tint={operator.tint} size="small" />,
  }));
  return <TurnCardsStage api={api} cards={cards} focus={focus} columns={columns} header={header} />;
}

/** The turn of one job (`focus`): its picture, its name, the questions it answers and an example. */
export function JobTurnStage({ api, jobs, focus }: { api: InteractionApi; jobs: readonly JobItem[]; focus: number }) {
  const cards = jobs.map((job) => ({
    id: job.id,
    tint: job.tint,
    name: job.name,
    title: job.title,
    example: job.example,
    art: <Pic src={job.pic} className="h-[76px] w-[100px]" />,
    chip: (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F6F8] dark:bg-white/10">
        <Pic src={job.pic} className="size-6" />
      </span>
    ),
  }));
  return <TurnCardsStage api={api} cards={cards} focus={focus} tall />;
}
