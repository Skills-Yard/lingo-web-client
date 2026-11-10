"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { TipCard } from "@/components/sequence/HexScreen";
import { ArrangeBoard, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED_SMALL } from "@/components/ui/raised";
import { vibrateForTap } from "@/lib/haptics";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";
import type { InteractionApi } from "./quiz";
import { Bottle, CARD } from "./visuals";

/** A line of narration: Hex says a short one, a long one goes on a card. */
export function Narration({ text, entry }: { text: string; entry: string }) {
  if (text.length > 120) {
    return (
      <div className="w-[340px] shrink-0">
        <TipCard>{text}</TipCard>
      </div>
    );
  }
  const width = text.length <= 44 ? 190 : 240;
  return (
    <div className="shrink-0">
      <HexBubble entryKey={entry} hex="left" line={[{ text }]} size={{ width }} />
    </div>
  );
}

/** What the learner is to take from a screen, as a short list. */
export function KeyPoints({ points }: { points: readonly string[] }) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-[340px] shrink-0 flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-4 py-3 dark:bg-[#0F2B28]"
    >
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2 text-[14px] leading-5 font-medium text-[#2F5D59] dark:text-[#BFE6E2]">
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-[#04ACAB]" />
          {point}
        </li>
      ))}
    </motion.ul>
  );
}

/** A thing to tap: it pulses while it is the next one to tap, and what it explains shows once it has been tapped. */
function Tappable({
  children,
  note,
  tapped,
  next,
  enabled = true,
  onTap,
  className = "",
  label,
}: {
  children: ReactNode;
  note: string;
  tapped: boolean;
  next: boolean;
  enabled?: boolean;
  onTap: () => void;
  className?: string;
  label: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${className}`}>
      <motion.button
        type="button"
        aria-label={label}
        disabled={!enabled}
        onClick={() => {
          playClickSound();
          vibrateForTap();
          onTap();
        }}
        animate={next ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={next ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        whileTap={{ scale: 0.96 }}
        className={`pointer-events-auto relative cursor-pointer rounded-[16px] outline-offset-4 ${tapped ? "outline-2 outline-[#04ACAB]" : next ? "outline-2 outline-dashed outline-[#04ACAB]/60" : ""} disabled:cursor-default`}
      >
        {children}
      </motion.button>
      <AnimatePresence>
        {tapped && (
          <motion.span
            key="note"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[10px] bg-white px-2.5 py-1.5 text-center text-[12px] leading-4 font-semibold text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]"
          >
            {note}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Screen 6: tap the bottle, then the information panel; the word "variable" is the bridge between them. */
export function BridgeStage({ done, finished }: InteractionApi) {
  const [bottle, setBottle] = useState(false);
  const [panel, setPanel] = useState(false);
  useEffect(() => {
    if (!bottle || !panel) return;
    const timer = window.setTimeout(() => done(), 700);
    return () => window.clearTimeout(timer);
  }, [bottle, panel, done]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="A variable keeps information, like a bottle keeps water." entry="variable-bridge" />
      <div className="flex w-[340px] items-start justify-between gap-1">
        <Tappable label="Tap the bottle" note="A container for water." tapped={bottle} next={!bottle} onTap={() => setBottle(true)} className="w-[132px]">
          <div className={`flex flex-col items-center gap-1 px-3 py-2 ${CARD}`}>
            <Bottle ml={600} height={104} marks={false} />
            <span className="text-[12px] leading-4 font-semibold text-[#08A4AD]">Water</span>
          </div>
        </Tappable>
        <div className="flex shrink-0 flex-col items-center gap-1 pt-12">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-full bg-[#08A4AD] px-2.5 py-1 text-[12px] leading-4 font-bold text-white"
          >
            Variable
          </motion.span>
          <ArrowRight aria-hidden className="size-5 text-[#04ACAB]" />
        </div>
        <Tappable
          label="Tap the information panel"
          note="A named place for information."
          tapped={panel}
          next={bottle && !panel}
          enabled={bottle}
          onTap={() => setPanel(true)}
          className="w-[132px]"
        >
          <div className="flex h-[148px] w-[120px] flex-col items-center justify-center gap-1 rounded-[16px] border-4 border-white bg-[#1E293B] px-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent">
            <span className="text-[10px] leading-3 font-semibold tracking-[0.6px] text-[#7FD8CC] uppercase">Information</span>
            <span className="text-[22px] leading-7 font-bold text-white">500 ml</span>
          </div>
        </Tappable>
      </div>
      {finished && <KeyPoints points={["A bottle holds water.", "A variable holds information.", "Information in a program is called data."]} />}
    </div>
  );
}

const SLIDER_STEP = 50;
const SLIDER_THUMB =
  "[&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#08A4AD] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#08A4AD]";

/** How long the stream stays on after the slider last moved up (ms). */
const POUR_HOLD_MS = 600;

/** Screen 7: drag a slider to fill the bottle (the bottle scene behind it) to 500 ml; letting go there finishes it. */
export function FillSliderStage({ done, finished }: InteractionApi) {
  const [ml, setMl] = useState(0);
  const [tried, setTried] = useState(false);
  const pourTimer = useRef(0);

  // The bottle starts empty with its cap opening, and the stream stops when the screen is left.
  useEffect(() => {
    setSceneValues("bottle", { showLabel: true, pouring: false });
    setBottleLevel(0);
    openBottleCap();
    return () => {
      window.clearTimeout(pourTimer.current);
      setSceneValues("bottle", { pouring: false });
    };
  }, []);

  const slide = (next: number) => {
    // The water follows the slider, and the stream is on while it goes up.
    rampBottleLevel(next, 250);
    if (next > ml) {
      setSceneValues("bottle", { pouring: true });
      window.clearTimeout(pourTimer.current);
      pourTimer.current = window.setTimeout(() => setSceneValues("bottle", { pouring: false }), POUR_HOLD_MS);
    }
    setMl(next);
  };
  const letGo = () => {
    window.clearTimeout(pourTimer.current);
    setSceneValues("bottle", { pouring: false });
    if (finished) return;
    if (ml === 500) done();
    else setTried(true);
  };
  return (
    <div className="flex w-full flex-1 flex-col items-center gap-3">
      <Narration text="The bottle holds 1,000 ml. Fill it with 500 ml." entry="variable-fill" />
      <div className="pointer-events-auto mt-auto flex w-[300px] flex-col items-center gap-1.5">
        <input
          type="range"
          min={0}
          max={1000}
          step={SLIDER_STEP}
          value={ml}
          disabled={finished}
          aria-label="Amount of water"
          onChange={(event) => slide(Number(event.target.value))}
          onPointerUp={letGo}
          onKeyUp={letGo}
          className={`h-3 w-full cursor-pointer appearance-none rounded-full bg-[#D5DADF] accent-[#08A4AD] dark:bg-white/20 ${SLIDER_THUMB}`}
        />
        <span className="text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
          {finished ? "That's 500 ml!" : tried && ml !== 500 ? "Not yet. Slide to 500 ml." : "Slide to fill the bottle"}
        </span>
      </div>
    </div>
  );
}

/** A part of a card that can be tapped to say what it is. */
function Part({ label, children, tapped, next, onTap, note }: { label: string; children: ReactNode; tapped: boolean; next: boolean; onTap: () => void; note: string }) {
  return (
    <Tappable label={`Tap the ${label}`} note={note} tapped={tapped} next={next} onTap={onTap} className="w-[150px]">
      <div className={`flex min-w-[140px] flex-col items-center gap-1 px-3 py-2.5 ${CARD}`}>
        <span className="text-[11px] leading-4 font-bold tracking-[0.5px] text-[#6B7480] uppercase dark:text-white/60">{label}</span>
        {children}
      </div>
    </Tappable>
  );
}

/** Screen 13: a variable has a name and a value; tap each to find out what it is. */
export function NameValueStage({ done, finished }: InteractionApi) {
  const [name, setName] = useState(false);
  const [value, setValue] = useState(false);
  useEffect(() => {
    if (!name || !value) return;
    const timer = window.setTimeout(() => done(), 600);
    return () => window.clearTimeout(timer);
  }, [name, value, done]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="A variable has a name and a value. Tap each part." entry="variable-meet" />
      <div className="flex w-[340px] items-start justify-between">
        <Part label="Name" tapped={name} next={!name} onTap={() => setName(true)} note="What we call the information.">
          <span className="rounded-md bg-[#E3F6F3] px-2 py-0.5 font-mono text-[15px] leading-6 font-semibold text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]">water_level</span>
        </Part>
        <motion.svg aria-hidden width={34} height={20} viewBox="0 0 34 20" className="mt-9 shrink-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <motion.path d="M2 10H30M24 4l6 6-6 6" stroke="#04ACAB" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
        </motion.svg>
        <Part label="Value" tapped={value} next={name && !value} onTap={() => setValue(true)} note="What it holds right now.">
          <span className="text-[20px] leading-7 font-bold text-[#444444] dark:text-white">550 ml</span>
        </Part>
      </div>
      {finished && <KeyPoints points={["A variable has a name.", "The name tells us what it is.", "The value is what it holds now."]} />}
    </div>
  );
}

const ATTENDANCE_NAMES = [
  { name: "total_students", value: "30", meaning: "All the students in the class" },
  { name: "present_students", value: "27", meaning: "The students who came today" },
  { name: "absent_students", value: "3", meaning: "The students who are not here today" },
] as const;

/** Screen 16: three variables for the attendance; tap each name to see what it stands for. */
export function NamesStage({ done, finished }: InteractionApi) {
  const [seen, setSeen] = useState<readonly string[]>([]);
  useEffect(() => {
    if (seen.length < ATTENDANCE_NAMES.length) return;
    const timer = window.setTimeout(() => done(), 600);
    return () => window.clearTimeout(timer);
  }, [seen, done]);
  const next = ATTENDANCE_NAMES.find((row) => !seen.includes(row.name))?.name;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Give each piece of information its own name." entry="variable-names" />
      <div className="flex w-[340px] flex-col gap-2">
        {ATTENDANCE_NAMES.map((row) => {
          const tapped = seen.includes(row.name);
          return (
            <div key={row.name} className={`flex items-center justify-between gap-2 px-3 py-2 ${CARD}`}>
              <Tappable
                label={`Tap ${row.name}`}
                note={row.meaning}
                tapped={tapped}
                next={next === row.name}
                onTap={() => setSeen((now) => (now.includes(row.name) ? now : [...now, row.name]))}
                className="items-start"
              >
                <span className="rounded-md bg-[#E3F6F3] px-2 py-0.5 font-mono text-[14px] leading-6 font-semibold text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]">{row.name}</span>
              </Tappable>
              <span className="text-[22px] leading-7 font-bold text-[#444444] dark:text-white">{row.value}</span>
            </div>
          );
        })}
      </div>
      {finished && <KeyPoints points={["Each variable tracks one piece of information.", "Good names show what a value means."]} />}
    </div>
  );
}

type PartKind = "name" | "value";
const CLASSIFY_PARTS: readonly { id: string; text: string; kind: PartKind; card: number }[] = [
  { id: "n1", text: "water_level", kind: "name", card: 1 },
  { id: "v1", text: "550 ml", kind: "value", card: 1 },
  { id: "n2", text: "bottle_capacity", kind: "name", card: 2 },
  { id: "v2", text: "1,000 ml", kind: "value", card: 2 },
];

/** Screen 14: tap each part of the two cards and say whether it is a name or a value. */
export function ClassifyStage({ slip: slipped, done }: InteractionApi) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, PartKind>>({});
  const [slip, setSlip] = useState(false);
  const choose = (kind: PartKind) => {
    const part = CLASSIFY_PARTS.find((candidate) => candidate.id === selected);
    if (!part) return;
    playClickSound();
    vibrateForTap();
    if (part.kind !== kind) {
      slipped();
      setSlip(true);
      return;
    }
    setSlip(false);
    const next = { ...placed, [part.id]: kind };
    setPlaced(next);
    setSelected(null);
    if (Object.keys(next).length === CLASSIFY_PARTS.length) done();
  };
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Is each one a name or a value?" entry="variable-classify" />
      <div className="flex w-[340px] flex-col gap-2">
        {[1, 2].map((card) => (
          <div key={card} className={`flex items-center justify-around gap-2 px-3 py-3 ${CARD}`}>
            {CLASSIFY_PARTS.filter((part) => part.card === card).map((part) => {
              const known = placed[part.id];
              return (
                <button
                  key={part.id}
                  type="button"
                  disabled={!!known}
                  onClick={() => {
                    playClickSound();
                    setSelected(part.id);
                    setSlip(false);
                  }}
                  className={`pointer-events-auto flex min-w-[120px] cursor-pointer flex-col items-center gap-0.5 rounded-[12px] border-2 px-3 py-1.5 ${RAISED_SMALL} ${
                    known ? "border-[#01A17F] bg-[#E3F6F3] [--edge:#007D60] dark:bg-[#0F2B28]" : selected === part.id ? "border-[#FFB300] bg-[#FFF3DE] [--edge:#C98A00] dark:bg-[#2A2218]" : "border-[#D5DADF] bg-white [--edge:#C9CED6] dark:border-white/20 dark:bg-[#15181E]"
                  }`}
                >
                  <span className={`text-[15px] leading-6 font-semibold text-[#444444] dark:text-white ${part.kind === "name" ? "font-mono" : ""}`}>{part.text}</span>
                  <span className="flex h-4 items-center gap-1 text-[11px] leading-4 font-bold tracking-[0.4px] text-[#01A17F] uppercase">
                    {known && (
                      <>
                        <Check aria-hidden className="size-3" /> {known}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="pointer-events-auto flex w-[340px] gap-3">
        {(["name", "value"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={!selected}
            onClick={() => choose(kind)}
            className="h-12 flex-1 cursor-pointer rounded-lg bg-[#EDFAFE] text-[15px] leading-5 font-semibold text-[#1F4899] shadow-[0_4px_0_#BFE6F2] transition-[translate,box-shadow] duration-100 enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-50"
          >
            It is a {kind}
          </button>
        ))}
      </div>
      <p className="h-10 w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {slip ? "The name tells what it is; the value is the amount." : <span className="text-[#6B7480] dark:text-white/60">{selected ? "Is it a name or a value?" : "Tap a part to sort it."}</span>}
      </p>
    </div>
  );
}

const MATCH_ITEMS = [
  { id: "notebook_price", emoji: "📓", name: "Notebook", price: 50 },
  { id: "pen_price", emoji: "🖊️", name: "Pen", price: 20 },
] as const;
const MATCH_CARDS: readonly ArrangeCardDef[] = [
  { id: "pen_price", kind: "pen_price", text: "pen_price", tint: "bg-[#E3F6F3] dark:bg-[#0F2B28]" },
  { id: "notebook_price", kind: "notebook_price", text: "notebook_price", tint: "bg-[#E3F6F3] dark:bg-[#0F2B28]" },
];
const MATCH_GEO = arrangeGeometry({ mode: "columns", card: { width: 140, height: 72 }, count: 2, gap: 14, lane: 40, sentence: true });

/** Screen 19: drag each product's name onto the card of its price. */
export function MatchPricesStage({ slip: slipped, done, finished }: InteractionApi) {
  const { slots, placeIn, reset } = useArrange(MATCH_CARDS.map((card) => card.id), MATCH_GEO.count);
  const [slip, setSlip] = useState(false);
  const full = slots.every((slot) => slot !== null);
  const right = full && slots.every((id, index) => id === MATCH_ITEMS[index].id);
  // The shop counter behind (see `ShopBackdrop`) starts with the names shown and nothing lit.
  useEffect(() => {
    setSceneValues("shop", { showEraser: false, showNames: true, showTotal: false, highlight: 0 });
  }, []);
  useEffect(() => {
    if (!full) return;
    if (right) {
      setSceneValues("shop", { highlight: 0 });
      fireSceneTrigger("shop", "correct");
      const timer = window.setTimeout(() => done(), 500);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      slipped();
      setSlip(true);
      setSceneValues("shop", { highlight: 0 });
      reset();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [full, right, done, slipped, reset]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Drag each name to the price it belongs to." entry="variable-prices" />
      <div className="pointer-events-auto relative" style={{ width: MATCH_GEO.board.width, height: MATCH_GEO.board.height }}>
        <ArrangeBoard
          cards={MATCH_CARDS}
          slots={slots}
          geo={MATCH_GEO}
          disabled={finished || (full && !right)}
          onPlace={(id, slot) => {
            setSlip(false);
            placeIn(id, slot);
            // The product a name is put on is lit in the scene when it is the right one (notebook 1, pen 2).
            setSceneValues("shop", { highlight: slot !== null && id === MATCH_ITEMS[slot].id ? slot + 1 : 0 });
          }}
          slotContent={(index) => (
            <span className="flex items-center gap-2 text-[14px] leading-5 font-semibold text-[#6B7480] dark:text-white/70">
              <span aria-hidden className="text-[26px] leading-none">
                {MATCH_ITEMS[index].emoji}
              </span>
              {MATCH_ITEMS[index].name} <span className="rounded-full bg-[#FFB300] px-2 py-0.5 text-[12px] font-bold text-white">₹{MATCH_ITEMS[index].price}</span>
            </span>
          )}
        />
      </div>
      <p className="h-10 w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {slip ? "Check the product and its price tag." : <span className="text-[#6B7480] dark:text-white/60">{finished ? "Each price has its own name." : "Drag a name onto a price."}</span>}
      </p>
    </div>
  );
}

