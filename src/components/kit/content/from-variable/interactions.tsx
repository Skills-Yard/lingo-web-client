"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { TipCard } from "@/components/sequence/HexScreen";
import { ArrangeBoard, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED_SMALL } from "@/components/ui/raised";
import { vibrateForTap } from "@/lib/haptics";
import { openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";
import { fireScene, setScene } from "@/components/kit/artboard/scenes";
import type { SortApi } from "@/components/kit/content/from-datatypes/screen";
import type { InteractionApi } from "@/components/kit/content/from-variable/quiz";
import { Bottle, CARD } from "@/components/kit/content/from-variable/visuals";

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

/** One thing to label: its words, the label it has, and the card it stands on. */
export type LabelItem = {
  id: string;
  text: string;
  /** The label it really has (one of the choices' `label`). */
  label: string;
  /** Items with the same number stand on one card. */
  card: number;
  /** Written in the code font (names of things). */
  mono?: boolean;
};
/** A label the learner can give: what is written on the part once it has it, and the words of the button. */
export type LabelChoice = { label: string; button: string };

/**
 * Tap a part, then press the label it has ("It is a name" / "It is a value"). A right label stays on the part
 * with a tick; a wrong one counts as a slip and shows `wrong`. Done when every part has its label.
 * (The `labels` look of `SortGroups`.)
 */
export function LabelStage({
  api,
  items,
  choices,
  narration,
  entry,
  asking,
  idle,
  wrong,
}: {
  api: SortApi;
  items: readonly LabelItem[];
  choices: readonly LabelChoice[];
  /** What Hex says above the cards. */
  narration: string;
  /** Plays Hex's entrance again when it changes. */
  entry: string;
  /** Under the cards once a part is picked. */
  asking: string;
  /** Under the cards before any part is picked. */
  idle: string;
  /** Under the cards after a wrong label. */
  wrong: string;
}) {
  const { slip: slipped, done } = api;
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [slip, setSlip] = useState(false);
  const cards = [...new Set(items.map((item) => item.card))];
  const choose = (label: string) => {
    const part = items.find((candidate) => candidate.id === selected);
    if (!part) return;
    playClickSound();
    vibrateForTap();
    if (part.label !== label) {
      slipped();
      setSlip(true);
      return;
    }
    setSlip(false);
    const next = { ...placed, [part.id]: label };
    setPlaced(next);
    setSelected(null);
    if (Object.keys(next).length === items.length) done();
  };
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text={narration} entry={entry} />
      <div className="flex w-[340px] flex-col gap-2">
        {cards.map((card) => (
          <div key={card} className={`flex items-center justify-around gap-2 px-3 py-3 ${CARD}`}>
            {items
              .filter((part) => part.card === card)
              .map((part) => {
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
                    <span className={`text-[15px] leading-6 font-semibold text-[#444444] dark:text-white ${part.mono ? "font-mono" : ""}`}>{part.text}</span>
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
        {choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            disabled={!selected}
            onClick={() => choose(choice.label)}
            className="h-12 flex-1 cursor-pointer rounded-lg bg-[#EDFAFE] text-[15px] leading-5 font-semibold text-[#1F4899] shadow-[0_4px_0_#BFE6F2] transition-[translate,box-shadow] duration-100 enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-50"
          >
            {choice.button}
          </button>
        ))}
      </div>
      <p className="h-10 w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {slip ? wrong : <span className="text-[#6B7480] dark:text-white/60">{selected ? asking : idle}</span>}
      </p>
    </div>
  );
}

/** A place a card is put on: a thing with its name and, if it has one, a tag (its price). */
export type MatchPlace = { id: string; name: string; emoji?: string; tag?: string };
/** A card to drag: it belongs on the place with the same `id`. */
export type MatchCard = { id: string; text: string };

/** How the scene behind the screen follows the matching. */
export type MatchScene = {
  /** Which scene (see the kit's `artboard/scenes.tsx`). */
  name: string;
  /** Values set on it when the activity opens. */
  values?: Record<string, boolean | number | string>;
  /** A number of the scene that says which place was just rightly filled (1, 2, ...; 0 for none). */
  lit?: string;
  /** A trigger fired when everything is matched. */
  onRight?: string;
};

/** The cards all share one colour, so a card's colour does not hint at its place. */
const MATCH_TINT = "bg-[#E3F6F3] dark:bg-[#0F2B28]";

/**
 * Drag each card onto the place it belongs to (a name onto its price). When every place has a card it is
 * checked: all right and the stage is done; otherwise it counts as a slip, `wrong` shows and the cards go back.
 * With `scene`, the scene behind the screen follows along (see `MatchScene`). (The look of `MatchPairs`.)
 */
export function MatchStage({
  api,
  places,
  cards,
  narration,
  entry,
  idle,
  wrong,
  finishedNote,
  scene,
}: {
  api: SortApi;
  places: readonly MatchPlace[];
  /** The cards, in the order they are shown. */
  cards: readonly MatchCard[];
  /** What Hex says above the board. */
  narration: string;
  /** Plays Hex's entrance again when it changes. */
  entry: string;
  /** Under the board while it is being done. */
  idle: string;
  /** Under the board after a wrong match. */
  wrong: string;
  /** Under the board once it is done. */
  finishedNote: string;
  scene?: MatchScene;
}) {
  const { slip: slipped, done, finished } = api;
  const count = places.length;
  const geo = useMemo(() => arrangeGeometry({ mode: "columns", card: { width: 140, height: 72 }, count, gap: 14, lane: 40, sentence: true }), [count]);
  const defs: readonly ArrangeCardDef[] = cards.map((card) => ({ id: card.id, kind: card.id, text: card.text, tint: MATCH_TINT }));
  const { slots, placeIn, reset } = useArrange(cards.map((card) => card.id), geo.count);
  const [slip, setSlip] = useState(false);
  const full = slots.every((slot) => slot !== null);
  const right = full && slots.every((id, index) => id === places[index].id);
  const sceneName = scene?.name;
  const sceneLit = scene?.lit;
  const sceneOnRight = scene?.onRight;
  // The scene's starting values as text, so the same values given as a new object do not write again.
  const sceneStart = scene?.values ? JSON.stringify(scene.values) : "";
  useEffect(() => {
    if (sceneStart) setScene(sceneName, JSON.parse(sceneStart) as Record<string, boolean | number | string>);
  }, [sceneName, sceneStart]);
  useEffect(() => {
    if (!full) return;
    const unlight = () => {
      if (sceneLit) setScene(sceneName, { [sceneLit]: 0 });
    };
    if (right) {
      unlight();
      fireScene(sceneName, sceneOnRight);
      const timer = window.setTimeout(() => done(), 500);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      slipped();
      setSlip(true);
      unlight();
      reset();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [full, right, done, slipped, reset, sceneName, sceneLit, sceneOnRight]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text={narration} entry={entry} />
      <div className="pointer-events-auto relative" style={{ width: geo.board.width, height: geo.board.height }}>
        <ArrangeBoard
          cards={defs}
          slots={slots}
          geo={geo}
          disabled={finished || (full && !right)}
          onPlace={(id, slot) => {
            setSlip(false);
            placeIn(id, slot);
            // The place a card is put on is lit in the scene when it is the right one (the first place is 1).
            if (sceneLit) setScene(sceneName, { [sceneLit]: slot !== null && id === places[slot].id ? slot + 1 : 0 });
          }}
          slotContent={(index) => (
            <span className="flex items-center gap-2 text-[14px] leading-5 font-semibold text-[#6B7480] dark:text-white/70">
              {places[index].emoji && (
                <span aria-hidden className="text-[26px] leading-none">
                  {places[index].emoji}
                </span>
              )}
              {places[index].name} {places[index].tag && <span className="rounded-full bg-[#FFB300] px-2 py-0.5 text-[12px] font-bold text-white">{places[index].tag}</span>}
            </span>
          )}
        />
      </div>
      <p className="h-10 w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {slip ? wrong : <span className="text-[#6B7480] dark:text-white/60">{finished ? finishedNote : idle}</span>}
      </p>
    </div>
  );
}
