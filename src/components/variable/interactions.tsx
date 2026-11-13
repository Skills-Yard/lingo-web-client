"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { TipCard } from "@/components/sequence/HexScreen";
import { ArrangeBoard, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { fireSceneTrigger, openBottleCap, rampBottleLevel, setBottleLevel, setSceneValues } from "@/lib/rive/variableHost";
import { OPTION, type InteractionApi } from "./quiz";
import { artboardRect, BELOW_TITLE, GAP_BELOW_SCENE, HEX_LIFT, NAME_VALUE_CARDS, SCENE_BOTTOM, SCENE_BOTTOM_PHONE, SceneOverlay, type ArtboardRect } from "./scenes";
import { ArcMeter } from "./ArcMeter";
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

/** The bottle fills to this many ml, over this long (ms). */
const BRIDGE_ML = 500;
const BRIDGE_FILL_MS = 2200;
/** Once the water has stopped, this long (ms) before Continue can be pressed: the value has been read at 500. */
const BRIDGE_SETTLE_MS = 300;

/**
 * Short notes under the scene's bottom edge, on the white, said from the start: each is a bold label and what it says,
 * and they fade in one after another (from 0.5 s, 0.3 s apart).
 */
function SceneNotes({ notes }: { notes: readonly { label: string; text: string }[] }) {
  return (
    <div className="absolute inset-x-0 flex flex-col items-center gap-2" style={{ top: `calc(min(${SCENE_BOTTOM}, ${SCENE_BOTTOM_PHONE}px) - ${BELOW_TITLE}px + 12px)` }}>
      {notes.map((note, index) => (
        <motion.p
          key={note.label}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.3 }}
          className="max-w-[340px] rounded-[12px] bg-white px-3 py-2 text-center text-[14px] leading-5 font-semibold text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]"
        >
          <span className="font-bold text-[#04908F] dark:text-[#7FD8CC]">{note.label}:</span> {note.text}
        </motion.p>
      ))}
    </div>
  );
}

/** What the bottle and its variable are, said under the scene. */
const BRIDGE_NOTES = [
  { label: "Bottle", text: "A container for water." },
  { label: "Variable", text: "A named place for information." },
] as const;

/**
 * Screen 6: the bottle artboard ("VAR_Bottle", see `BottleBackdrop`) is the scene, with its variable card on
 * (`showVariable`): the artboard draws the card beside the bottle (name `water`, its value the water in ml). The cap
 * opens and the bottle fills to 500 ml as the screen opens, the variable's value counting up with the water; when it is
 * full the screen is done and Continue can be pressed (nothing to tap). Under the scene a note says what each is.
 */
export function BridgeStage({ done, finished }: InteractionApi) {
  // The bottle starts empty with its cap opening, then the stream is on while it fills (see `BottleChange`); the card beside it says `water` and counts up with it. Both go as the screen is left, so the bottle screens that follow are plain.
  useEffect(() => {
    setSceneValues("bottle", { showVariable: true, varName: "water", showLabel: false, pouring: false });
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
      setSceneValues("bottle", { pouring: false, showVariable: false, showLabel: true });
    };
  }, [done]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="A variable keeps information, like a bottle keeps water." entry="variable-bridge" />
      <SceneNotes notes={BRIDGE_NOTES} />
      {/* The key points stand just above the button row (this stage's bottom), under the notes. */}
      {finished && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <KeyPoints points={["A bottle holds water.", "A variable holds information.", "Information in a program is called data."]} />
        </div>
      )}
    </div>
  );
}

/** The bottle's meter: 0 to 1,000 ml in steps of 50, with the quarters written along the dial (see `ArcMeter`). */
const BOTTLE_METER = { min: 0, max: 1000, step: 50, labels: [0, 250, 500, 750, 1000], unit: "ml" } as const;
/** The meter's width (px): the module's column, as the answers. */
const METER_WIDTH = 340;

/** How long the stream stays on after the meter last moved up (ms). */
const POUR_HOLD_MS = 600;

/** Screen 7: drag the meter to fill the bottle (the bottle scene behind it) to 500 ml; letting go there finishes it. */
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
    // The water follows the meter, and the stream is on while it goes up.
    rampBottleLevel(next, 250);
    if (next > ml) {
      setSceneValues("bottle", { pouring: true });
      window.clearTimeout(pourTimer.current);
      pourTimer.current = window.setTimeout(() => setSceneValues("bottle", { pouring: false }), POUR_HOLD_MS);
    }
    setMl(next);
  };
  const letGo = (amount: number) => {
    window.clearTimeout(pourTimer.current);
    setSceneValues("bottle", { pouring: false });
    if (finished) return;
    if (amount === 500) done();
    else setTried(true);
  };
  return (
    <div className="flex w-full flex-1 flex-col items-center gap-3">
      <Narration text="The bottle holds 1,000 ml. Fill it with 500 ml." entry="variable-fill" />
      {/* The meter stands at the bottom of the room, on the answers' place; its hint is in the empty room inside the arc. */}
      <div className="pointer-events-auto mt-auto" style={{ width: METER_WIDTH }}>
        <ArcMeter {...BOTTLE_METER} value={ml} onChange={slide} onRelease={letGo} disabled={finished} ariaLabel="Amount of water">
          <span className="text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
            {finished ? "That's 500 ml!" : tried && ml !== 500 ? "Not yet. Slide to 500 ml." : "Slide to fill the bottle"}
          </span>
        </ArcMeter>
      </div>
    </div>
  );
}

/** What the variable card's two rows are, said under the scene from the start. */
const NAME_VALUE_NOTES = [
  { label: "Name", text: "What we call the information." },
  { label: "Value", text: "What it holds right now." },
] as const;

/**
 * Screen 13: a variable has a name and a value. The bottle scene behind the screen (see `BottleBackdrop`) has its
 * variable card on (`showVariable`), with the name `water_level` and, as its value, the water at 550 ml; what the name
 * and the value are is said under the scene from the start, with nothing to tap. The cap opens, and once it has
 * (the jar's animation) the screen is done and Continue can be pressed.
 */
export function NameValueStage({ done, finished }: InteractionApi) {
  // The bottle stands at 550 ml with its cap opening, and the variable card beside it says so; both go as the screen is left.
  useEffect(() => {
    setSceneValues("bottle", { showVariable: true, varName: "water_level", showLabel: false, pouring: false });
    setBottleLevel(550);
    const wait = openBottleCap();
    const timer = window.setTimeout(() => done(), wait + BRIDGE_SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      setSceneValues("bottle", { showVariable: false, showLabel: true });
    };
  }, [done]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="A variable has a name and a value." entry="variable-meet" />
      <SceneNotes notes={NAME_VALUE_NOTES} />
      {/* The key points stand just above the button row (this stage's bottom), under the notes. */}
      {finished && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <KeyPoints points={["A variable has a name.", "The name tells us what it is.", "The value is what it holds now."]} />
        </div>
      )}
    </div>
  );
}

/**
 * Where a block of `height` px that stands under the scene starts (a CSS `top`, in the interaction's area): right
 * under the scene's bottom edge, so nothing is over the picture; or higher, where the block would run down behind the
 * Next button from there (a phone has no more room than the scene's last rows give it, and a taller window lets it
 * start right under the scene).
 */
const belowScene = (height: number) => `min(calc(${SCENE_BOTTOM} - ${BELOW_TITLE}px + ${GAP_BELOW_SCENE}px), calc(100% - ${height}px))`;

/** What each of screen 16's three variables stands for. */
const ATTENDANCE_NAMES = [
  { name: "total_students", meaning: "All the students in the class" },
  { name: "present_students", meaning: "The students who came today" },
  { name: "absent_students", meaning: "The students who are not here today" },
] as const;

/** The height `NamesStage`'s three rows take (52px each, with two 8px gaps). */
const NAMES_BLOCK_H = 172;
/** The board's names take this long (ms) to come in before the screen is done and Continue can be pressed. */
const NAMES_SETTLE_MS = 1200;

/**
 * Screen 16: the classroom of the screen before (see `ClassroomBackdrop`), its board now showing the names of its
 * three counts (`showNames`); what each name stands for is said under the scene from the start, with nothing to tap.
 * Once the names have come in the screen is done and Continue can be pressed.
 */
export function NamesStage({ done }: InteractionApi) {
  useEffect(() => {
    setSceneValues("classroom", { total: 30, present: 27, showNames: true, highlight: 0 });
    const timer = window.setTimeout(() => done(), NAMES_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [done]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Give each piece of information its own name." entry="variable-names" />
      {/* The three rows stand under the scene, on the white below it, so no part of the classroom is covered. */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: belowScene(NAMES_BLOCK_H) }}>
        <div className="flex w-[340px] flex-col gap-2">
          {ATTENDANCE_NAMES.map((row, index) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.25 }}
              className={`flex h-[52px] items-center gap-3 px-3 ${CARD}`}
            >
              <span className="w-[148px] shrink-0 rounded-md bg-[#E3F6F3] px-1.5 py-0.5 text-center font-mono text-[13px] leading-6 font-semibold text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]">{row.name}</span>
              <span className="text-[14px] leading-5 font-medium text-[#444444] dark:text-white">{row.meaning}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

type PartKind = "name" | "value";

/**
 * Screen 14's four parts, as the pair of cards (see `VarCardBackdrop`) draws them. `select` is the number that lights
 * a part on the artboard (1 and 3 the names, 2 and 4 the values); `rect` is where it is (artboard px), a little larger
 * than its pill, for tapping it; `tick` is the pill's top right corner, where its tick stands once it is sorted.
 */
const CLASSIFY_PARTS = [
  { id: "n1", label: "water_level", kind: "name", select: 1, rect: { x: 36, y: 138, width: 140, height: 38 }, tick: { x: 172, y: 145 } },
  { id: "v1", label: "550 ml", kind: "value", select: 2, rect: { x: 46, y: 180, width: 120, height: 44 }, tick: { x: 162, y: 190 } },
  { id: "n2", label: "bottle_capacity", kind: "name", select: 3, rect: { x: 214, y: 139, width: 140, height: 38 }, tick: { x: 350, y: 147 } },
  { id: "v2", label: "1,000 ml", kind: "value", select: 4, rect: { x: 224, y: 181, width: 120, height: 44 }, tick: { x: 340, y: 191 } },
] as const satisfies readonly { id: string; label: string; kind: PartKind; select: number; rect: ArtboardRect; tick: { x: number; y: number } }[];

/** The height of the block the "It is a name / It is a value" buttons make with their note (the buttons, 10px, a 20px note line). */
const SORT_BLOCK_H = OPTION.height + 10 + 20;
/** The last part has been sorted: this long (ms) for the artboard's right-answer glow to play before the screen is done and its name / value tags show. */
const SORT_SETTLE_MS = 900;

/**
 * Screen 14: tap each part of the two cards and say whether it is a name or a value. The cards are the artboard
 * behind the screen ("VAR_VarCard", see `VarCardBackdrop`): a tap on a part (a target laid over its pill) lights it
 * there (`select`), the buttons under the scene say what it is, and the artboard marks it right or wrong (the
 * `correct` and `wrong` triggers). Each part sorted keeps a tick, and once all four are the artboard shows its
 * "name" and "value" tags (`showParts`).
 */
export function ClassifyStage({ slip: slipped, done, finished }: InteractionApi) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, PartKind>>({});
  const [slip, setSlip] = useState(false);
  const sorted = Object.keys(placed).length === CLASSIFY_PARTS.length;

  // The cards say their names and values, with nothing lit and no tags yet.
  useEffect(() => {
    setSceneValues("varCard", { ...NAME_VALUE_CARDS, mode: 0, linked: true, showParts: false, select: 0 });
  }, []);
  // The part tapped is lit on the artboard, and stays lit (its right-answer glow plays on it) until another is tapped.
  useEffect(() => {
    const part = CLASSIFY_PARTS.find((candidate) => candidate.id === selected);
    if (part) setSceneValues("varCard", { select: part.select });
  }, [selected]);
  // All four are sorted: once the last one's glow has played, the screen is done and the artboard names each part.
  useEffect(() => {
    if (!sorted) return;
    const timer = window.setTimeout(() => {
      setSceneValues("varCard", { select: 0, showParts: true });
      done();
    }, SORT_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [sorted, done]);

  const choose = (kind: PartKind) => {
    const part = CLASSIFY_PARTS.find((candidate) => candidate.id === selected);
    if (!part) return;
    playClickSound();
    vibrateForTap();
    if (part.kind !== kind) {
      slipped();
      setSlip(true);
      fireSceneTrigger("varCard", "wrong");
      return;
    }
    setSlip(false);
    setPlaced({ ...placed, [part.id]: kind });
    setSelected(null);
    fireSceneTrigger("varCard", "correct");
  };
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Narration text="Is each one a name or a value?" entry="variable-classify" />
      {/* A target over each pill of the artboard to tap it, and a tick on each one that has been sorted. */}
      <SceneOverlay>
        {CLASSIFY_PARTS.map((part) => {
          const known = placed[part.id];
          return (
            <div key={part.id}>
              <button
                type="button"
                aria-label={`Sort ${part.label}`}
                disabled={!!known || finished}
                onClick={() => {
                  playClickSound();
                  setSelected(part.id);
                  setSlip(false);
                }}
                className="pointer-events-auto absolute cursor-pointer rounded-[14px] disabled:cursor-default"
                style={artboardRect(part.rect)}
              />
              {known && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 18 }}
                  className="pointer-events-none absolute flex items-center justify-center rounded-full bg-[#01A17F] text-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                  style={artboardRect({ x: part.tick.x - 9, y: part.tick.y - 9, width: 18, height: 18 })}
                >
                  <Check className="size-3" strokeWidth={3} />
                </motion.span>
              )}
            </div>
          );
        })}
      </SceneOverlay>
      {/* The two buttons and the note stand under the scene, on the white below it, so no character is covered. */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-2.5" style={{ top: belowScene(SORT_BLOCK_H) }}>
        <div className="pointer-events-auto flex w-[340px]" style={{ gap: OPTION.gap }}>
          {(["name", "value"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={!selected}
              onClick={() => choose(kind)}
              // The same size, gap, corners and text as every other option of the module (their colour is the button's own).
              style={{ height: OPTION.height, borderRadius: OPTION.radius, fontSize: OPTION.font }}
              className="flex-1 cursor-pointer bg-[#EDFAFE] leading-5 font-semibold text-[#1F4899] shadow-[0_4px_0_#BFE6F2] transition-[translate,box-shadow] duration-100 enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-50"
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
/**
 * The spots (a product and its price) stand in a row on top and the names to drag in a row under them: what is dragged
 * is always at the bottom, and goes up to its spot. Two across fill the module's 340px column.
 */
const MATCH_GEO = arrangeGeometry({
  mode: "rows",
  card: { width: 163, height: 72 },
  count: 2,
  gap: 14,
  lane: 14,
  slotsOnTop: true,
  sentence: true,
  // Built like the module's answer buttons at rest: one thin plain-grey line (2px) hugging the face on all four sides, with the raised edge directly under it and on the same corner curve, so the line and the 3D edge read as one piece. (A white frame, or a ring outside it, put a gap between the face and its raised edge.)
  line: "border-2 border-[#D2D8DE] dark:border-white/20",
  // The answer buttons' corner (`OPTION.radius`), so the edge's curve is theirs.
  radius: OPTION.radius,
  // Held, a name is pressed like their buttons are: its face sinks onto the raised edge.
  sink: true,
});
/** The note under the board: one line (the longer "check" line fits it too). */
const MATCH_NOTE_H = 20;

/** Screen 19: drag each product's name up onto the spot of its price. */
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
      <div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ top: belowScene(MATCH_GEO.board.height + 12 + MATCH_NOTE_H) }}>
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
              <span className="flex items-center gap-1.5 text-[14px] leading-5 font-semibold text-[#6B7480] dark:text-white/70">
                <span aria-hidden className="text-[26px] leading-none">
                  {MATCH_ITEMS[index].emoji}
                </span>
                {MATCH_ITEMS[index].name} <span className="rounded-full bg-[#FFB300] px-1.5 py-0.5 text-[12px] font-bold text-white">₹{MATCH_ITEMS[index].price}</span>
              </span>
            )}
          />
        </div>
        <p className="w-[340px] text-center text-[13px] leading-5 font-medium text-[#D42421]" style={{ height: MATCH_NOTE_H }}>
          {slip ? "Check the product and its price tag." : <span className="text-[#6B7480] dark:text-white/60">{finished ? "Each price has its own name." : "Drag a name onto a price."}</span>}
        </p>
      </div>
    </div>
  );
}

