"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Pointer, Sparkles } from "lucide-react";
import { TipCard } from "@/components/sequence/HexScreen";
import { ArrangeBoard, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED_SMALL } from "@/components/ui/raised";
import { vibrateForTap } from "@/lib/haptics";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneryHidden, setSceneValues, setSkippedFills } from "@/lib/rive/variableHost";
import type { InteractionApi } from "./quiz";
import { BELOW_TITLE, HEX_LIFT, SCENE_BOTTOM, SCENE_BOTTOM_PHONE, SceneWindow } from "./scenes";
import { CARD } from "./visuals";

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
    // Lifted like the quiz screens' bubble (see `HEX_LIFT`); what is under it stays where it was.
    <div className="relative shrink-0" style={{ top: -HEX_LIFT }}>
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

/**
 * "Tap here", right under the thing to tap next (where its note will show once it is tapped): a small pill with a
 * hand that taps up at it. Pressing it counts as pressing the thing.
 */
function TapHint({ onTap }: { onTap: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onTap}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto mt-1 flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#04ACAB] bg-white py-1 pr-3 pl-2 text-[13px] leading-5 font-semibold text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]"
    >
      <motion.span
        aria-hidden
        animate={reduceMotion ? { y: 0 } : { y: [0, -4, 0], scale: [1, 0.88, 1] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Pointer className="size-5 fill-white stroke-[#04ACAB]" strokeWidth={1.75} />
      </motion.span>
      Tap here
    </motion.button>
  );
}

/**
 * A thing to tap: it pulses while it is the next one to tap, with a "Tap here" hand under it, and what it explains
 * shows once it has been tapped.
 */
function Tappable({
  children,
  note,
  tapped,
  next,
  enabled = true,
  showNote = true,
  onTap,
  className = "",
  label,
}: {
  children: ReactNode;
  note: string;
  tapped: boolean;
  next: boolean;
  enabled?: boolean;
  /** Whether the note shows under the thing once it is tapped (a screen that shows the notes in one place says no). */
  showNote?: boolean;
  onTap: () => void;
  className?: string;
  label: string;
}) {
  const press = () => {
    playClickSound();
    vibrateForTap();
    onTap();
  };
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${className}`}>
      <motion.button
        type="button"
        aria-label={label}
        disabled={!enabled}
        onClick={press}
        animate={next ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={next ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        whileTap={{ scale: 0.96 }}
        className={`pointer-events-auto relative cursor-pointer rounded-[16px] outline-offset-4 ${tapped ? "outline-2 outline-[#04ACAB]" : next ? "outline-2 outline-dashed outline-[#04ACAB]/60" : ""} disabled:cursor-default`}
      >
        {children}
      </motion.button>
      {next && enabled && <TapHint onTap={press} />}
      <AnimatePresence>
        {tapped && showNote && (
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

/**
 * What the two windows show of the "VAR_Bottle" artboard (artboard px). The artboard is on the screen twice
 * (`bottle` and `bottleCard`, see `VARIABLE_SCENES`): the first has the variable off, so the bottle stands alone
 * in the middle; the second has it on, and the artboard draws a variable card (a heading, name `water`, the value
 * in ml) beside the bottle (x 197 to 372), of which only that card is shown, next to the first. The scenery is
 * hidden in both (see `setSceneryHidden`): they stand on one white card. The variable is the bigger of the two
 * (about 19px text), as it is what the screen is about; the bottle is just its picture.
 */
const JAR_CROP = { x: 132, y: 6, width: 160, height: 264 } as const;
const JAR_ZOOM = 0.78;
const CARD_CROP = { x: 199, y: 79, width: 178, height: 143 } as const;
const CARD_ZOOM = 1.2;
/** The colours the artboard fills the variable card's outline and its shadow (the grey edge under it) with: each is one shape, so they can be left out (see `setSkippedFills`). */
const CARD_EDGE_FILLS = ["#dce6f4", "rgba(70, 90, 120, 0.14)"] as const;
/**
 * How much of the combined card stands over the scene (px, from its top down to the scene's bottom edge): the top
 * stays below the characters' faces, and the rest of the card goes on below the edge, into the white under the scene.
 * The edge it is measured from is the phone's: on a wider or shorter window the scene is drawn larger and its edge
 * lower, and the card (with its captions) would run down behind the button.
 */
const CARD_OVER_SCENE = 196;
/** The bottle fills to this many ml, over this long (ms). */
const BRIDGE_ML = 500;
const BRIDGE_FILL_MS = 2200;

/** A caption under one of the two, shown from the start: it hangs under the card's bottom without taking any room, so the card stays where it is. */
function Caption({ children }: { children: ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute top-full left-1/2 mt-[18px] w-max max-w-[128px] -translate-x-1/2 rounded-[10px] bg-white px-2 py-1.5 text-center text-[12px] leading-4 font-semibold text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]"
    >
      {children}
    </motion.span>
  );
}

/** Once the water has stopped, this long (ms) before Continue can be pressed: the value has been read at 500. */
const BRIDGE_SETTLE_MS = 300;

/**
 * Screen 6: the bottle and the variable beside it (the artboard's own card: name `water`, value in ml), each with
 * a line under it saying what it is. The bottle is the "VAR_Bottle" artboard: its cap opens and it fills to 500 ml as
 * the screen opens, the variable's value counting up with the water; when it is full the screen is done and Continue
 * can be pressed (nothing to tap). The two stand on the bottom edge of the trail scene behind the screen.
 */
export function BridgeStage({ done, finished }: InteractionApi) {
  // Both copies of the artboard are drawn without their scenery, and the variable card without its own outline and shadow, flat on the white card (and all as they were for the screens after).
  useLayoutEffect(() => {
    setSceneryHidden("bottle", true);
    setSceneryHidden("bottleCard", true);
    setSkippedFills("bottleCard", CARD_EDGE_FILLS);
    return () => {
      setSceneryHidden("bottle", false);
      setSceneryHidden("bottleCard", false);
      setSkippedFills("bottleCard", []);
    };
  }, []);

  // The bottle starts empty with its cap opening, then the stream is on while it fills (see `BottleChange`). The variable card is the other copy, with the variable on, and takes the same water.
  useEffect(() => {
    setSceneValues("bottleCard", { showVariable: true, varName: "water" });
    setSceneValues("bottle", { showLabel: false, showVariable: false, pouring: false });
    setBottleLevel(0);
    const wait = openBottleCap();
    const timers = [
      window.setTimeout(() => {
        setSceneValues("bottle", { pouring: true });
        rampBottleLevel(BRIDGE_ML, BRIDGE_FILL_MS);
      }, wait),
      window.setTimeout(() => setSceneValues("bottle", { pouring: false }), wait + BRIDGE_FILL_MS),
      // Full: the screen is done, and Continue is let through.
      window.setTimeout(() => done(), wait + BRIDGE_FILL_MS + BRIDGE_SETTLE_MS),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setSceneValues("bottle", { pouring: false, showLabel: true });
    };
  }, [done]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="A variable keeps information, like a bottle keeps water." entry="variable-bridge" />
      {/* One white card for the two, over the bottom edge of the scene behind the screen (the trail): its top is `CARD_OVER_SCENE` above that edge, and it goes on below it. */}
      <div className="absolute inset-x-0 flex justify-center" style={{ top: `calc(min(${SCENE_BOTTOM}, ${SCENE_BOTTOM_PHONE}px) - ${BELOW_TITLE}px - ${CARD_OVER_SCENE}px)` }}>
        <div className="flex items-end rounded-[20px] border-4 border-white bg-white p-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)]">
          <div className="relative">
            <SceneWindow scene="bottle" crop={JAR_CROP} zoom={JAR_ZOOM} className="rounded-[12px]" />
            <Caption>A container for water.</Caption>
          </div>
          {/* The artboard's own dotted line, from the bottle across to its variable. */}
          <div aria-hidden className="h-0 w-3.5 shrink-0 self-center border-t-[3px] border-dotted border-[#17998C]" />
          <div className="relative">
            <SceneWindow scene="bottleCard" crop={CARD_CROP} zoom={CARD_ZOOM} className="rounded-[16px]" />
            <Caption>A named place for information.</Caption>
          </div>
        </div>
      </div>
      {/* The key points stand just above the button row (this stage's bottom), under the notes: below the scene's edge on a phone, and never behind the button on a short, wide window, where the scene is drawn larger. */}
      {finished && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <KeyPoints points={["A bottle holds water.", "A variable holds information.", "Information in a program is called data."]} />
        </div>
      )}
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

/**
 * How much of the Name and Value cards stands over the scene (px, from their top down to the scene's bottom edge).
 * They stand under the picture, on the white below it, so no character is covered; only the scene's faded last rows
 * (it fades out over its bottom 26px, which show no more than ground) are under their top. The notes and the key
 * points follow below them, above the button.
 */
const NAME_VALUE_OVER_SCENE = 16;

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
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-3"
        style={{ top: `calc(min(${SCENE_BOTTOM}, ${SCENE_BOTTOM_PHONE}px) - ${BELOW_TITLE}px - ${NAME_VALUE_OVER_SCENE}px)` }}
      >
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
    </div>
  );
}

/** How far under the scene's bottom edge a block that stands on the white below it starts (px). */
const GAP_BELOW_SCENE = 12;

/**
 * Where a block of `height` px that stands under the scene starts (a CSS `top`, in the interaction's area): right
 * under the scene's bottom edge, so nothing is over the picture; or higher, where the block would run down behind the
 * Next button from there (a phone has no more room than the scene's last rows give it, and a taller window lets it
 * start right under the scene).
 */
const belowScene = (height: number) => `min(calc(${SCENE_BOTTOM} - ${BELOW_TITLE}px + ${GAP_BELOW_SCENE}px), calc(100% - ${height}px))`;

const ATTENDANCE_NAMES = [
  { name: "total_students", value: "30", meaning: "All the students in the class" },
  { name: "present_students", value: "27", meaning: "The students who came today" },
  { name: "absent_students", value: "3", meaning: "The students who are not here today" },
] as const;

/**
 * The height `NamesStage` takes once it is done: its three rows (52px each, with two 8px gaps), a 12px gap and the
 * key points (90px). While the rows are tapped, a one-line note (34px) stands where the key points will, and the
 * "Tap here" hand (32px) is under the next row's name, so it never takes more than this.
 */
const NAMES_BLOCK_H = 172 + 12 + 90;

/** Screen 16: three variables for the attendance; tap each name to see what it stands for. */
export function NamesStage({ done, finished }: InteractionApi) {
  const [seen, setSeen] = useState<readonly string[]>([]);
  useEffect(() => {
    if (seen.length < ATTENDANCE_NAMES.length) return;
    const timer = window.setTimeout(() => done(), 600);
    return () => window.clearTimeout(timer);
  }, [seen, done]);
  const next = ATTENDANCE_NAMES.find((row) => !seen.includes(row.name))?.name;
  // What the name tapped last stands for: one note under the rows, so the rows don't grow as they are tapped.
  const latest = ATTENDANCE_NAMES.find((row) => row.name === seen[seen.length - 1]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Give each piece of information its own name." entry="variable-names" />
      {/* The rows (with the note, then the key points, after them) stand under the picture, on the white below it, so no character is covered. */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ top: belowScene(NAMES_BLOCK_H) }}>
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
                  showNote={false}
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
        {finished ? (
          <KeyPoints points={["Each variable tracks one piece of information.", "Good names show what a value means."]} />
        ) : (
          <AnimatePresence mode="wait">
            {latest && (
              <motion.span
                key={latest.name}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[10px] bg-white px-2.5 py-1.5 text-center text-[12px] leading-4 font-semibold text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]"
              >
                {latest.meaning}
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>
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

/** The height of the block the two cards make with the "It is a name / It is a value" buttons and their note (two 78px cards and an 8px gap, 10px, the 44px buttons, 10px, a 20px note line). */
const SORT_BLOCK_H = 248;

/** Screen 14: tap each part of the two cards and say whether it is a name or a value. */
export function ClassifyStage({ slip: slipped, done }: InteractionApi) {
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
      <Narration text="Is each one a name or a value?" entry="variable-classify" />
      {/* The cards, the two buttons and the note stand under the scene, on the white below it, so no character is covered. */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-2.5"
        style={{ top: belowScene(SORT_BLOCK_H) }}
      >
        <div className="flex w-[340px] flex-col gap-2">
          {[1, 2].map((card) => (
            <div key={card} className={`flex items-center justify-around gap-2 px-3 py-1.5 ${CARD}`}>
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
              className="h-11 flex-1 cursor-pointer rounded-lg bg-[#EDFAFE] text-[15px] leading-5 font-semibold text-[#1F4899] shadow-[0_4px_0_#BFE6F2] transition-[translate,box-shadow] duration-100 enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-50"
            >
              It is a {kind}
            </button>
          ))}
        </div>
        {/* One line is reserved; the longer "not quite" line runs a second one down into the gap above the button. */}
        <p className="min-h-5 w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]">
          {slip ? "The name tells what it is; the value is the amount." : <span className="text-[#6B7480] dark:text-white/60">{selected ? "Is it a name or a value?" : "Tap a part to sort it."}</span>}
        </p>
      </div>
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
      {/* The board and its note stand under the picture, on the white below it, so no character is covered. */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ top: belowScene(MATCH_GEO.board.height + 12 + 40) }}>
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
    </div>
  );
}

