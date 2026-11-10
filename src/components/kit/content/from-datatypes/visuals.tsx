"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Calculator, Check, ClipboardCheck, CloudSun, FileText, Link2, Plus, TriangleAlert, User, X } from "lucide-react";
import { BounceIn } from "@/components/level-two/BounceIn";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import { COLUMN_W } from "@/lib/questionColumn";
import { INK, TINTS } from "./look";
import { P } from "./pictures";
import { People, WINDOW_ROW, WindowCard } from "./WindowCard";

/** A card, in the style of the Sequence module's picture cards. */
export const CARD = "rounded-[8px] border-4 border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent";
/** A card that is pressed: `CARD` without its soft shadow, which the 3D edge (see `RAISED`) stands in for. */
export const CARD_FACE = "rounded-[8px] border-4 border-white dark:border-transparent";
export const LAVENDER = "bg-[#F6F4FE] dark:bg-[#0F1F26]";
export const CREAM = "bg-[#FFF9F0] dark:bg-[#0F1F26]";
export const WHITE = "bg-white dark:bg-[#15181E]";

/** A picture from the module's table of stand-ins. */
export function Pic({ src, className = "h-8 w-8" }: { src: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${className}`}>
      <SlotImage file={src} className="max-h-full max-w-full object-contain" />
    </span>
  );
}

/** A named piece of information, as a row: what it is, and its value. */
export function FieldRow({ label, children, delay = 0, tone = "plain" }: { label: string; children?: ReactNode; delay?: number; tone?: "plain" | "warn" | "good" }) {
  const border = tone === "warn" ? "border-[#FFB300] bg-[#FFF8E1] dark:bg-[#2A2218]" : tone === "good" ? "border-[#7FD8CC] bg-[#E3F6F3] dark:bg-[#0F2B28]" : "border-[#E3E5E9] bg-white dark:border-white/15 dark:bg-[#15181E]";
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`flex h-9 items-center justify-between gap-3 rounded-lg border-2 px-3 ${border}`}
    >
      <span className="text-[12px] leading-4 font-medium text-[#8A94A0]">{label}</span>
      <span className="text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">{children ?? " "}</span>
    </motion.div>
  );
}

/** Screen 1's scene is drawn this wide (frame px; keep it the same as the image's `w-[390px]` below; the art is 1560 x 2180), starting at this Figma `top`: just above the title. */
const EVENT_SCENE = { top: 101, width: 390 } as const;
/** On a screen wider than the scene its sides fade into the page, over at most this much. */
const SIDE_FADE = 60;
const SIDE_BAND = `min(${SIDE_FADE}px, max(0px, var(--stage-w, ${EVENT_SCENE.width}px) - ${EVENT_SCENE.width}px))`;
/** The scene melts into the page at its top and its foot, so the title, Hex and Continue stand on a clean ground. */
const EVENT_SCENE_FADE = [
  "linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 90px), transparent 100%)",
  `linear-gradient(90deg, transparent calc(50% - ${EVENT_SCENE.width / 2}px), #000 calc(50% - ${EVENT_SCENE.width / 2}px + ${SIDE_BAND}), #000 calc(50% + ${EVENT_SCENE.width / 2}px - ${SIDE_BAND}), transparent calc(50% + ${EVENT_SCENE.width / 2}px))`,
].join(", ");

/**
 * Screen 1: the school event, a student at the registration desk. It is the
 * screen's backdrop (the title and Hex's line are set over its sky), so it goes
 * in the shell's scene slot. In dark mode it is dimmed, and darkens to the page
 * behind the title, so the title stays readable.
 */
export const EventScene = () => <SceneBackdrop file={P.eventScene} />;

/** Screens 5 and 6: the same school yard, empty, for the cards to stand over (drawn the same way, from the same place). */
export const SchoolScene = () => <SceneBackdrop file={P.schoolScene} />;

/** Screen 10: the school desk, with its books and plant, behind the list (drawn the same way, from the same place). */
export const NamesScene = () => <SceneBackdrop file={P.namesScene} />;

function SceneBackdrop({ file }: { file: string }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
      style={{ top: stageTop(EVENT_SCENE.top), maskImage: EVENT_SCENE_FADE, WebkitMaskImage: EVENT_SCENE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
    >
      <SlotImage file={file} className="h-auto w-[390px] max-w-none shrink-0 dark:brightness-[0.55]" />
      <div className="absolute inset-x-0 top-0 hidden h-[110px] bg-gradient-to-b from-background via-background/80 to-transparent dark:block" />
    </motion.div>
  );
}

/** Screen 2: Aarav's student profile card (name, age, height, permission), settling in under Hex. */
export function StudentProfileCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.3 }}
      className="w-[300px]"
    >
      <SlotImage file={P.studentProfile} className="h-auto w-full" />
    </motion.div>
  );
}

/** A count in a rounded coloured square (screen 5's number badges): `fill` is the square, `ink` the number. */
export type Badge = { value: string; fill: string; ink: string };

/** A tile's picture is a file (`icon`) or a number badge (`badge`). */
export type InfoTile = { id: string; text: string; icon?: string; badge?: Badge; tint: string };

/** The number badge, with its number set in the module's own font. */
function NumberBadge({ badge }: { badge: Badge }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-[12px] text-[20px] leading-none font-bold" style={{ backgroundColor: badge.fill, color: badge.ink }}>
      {badge.value}
    </span>
  );
}

/** How each arrangement of cards stands: the same sizes as the answer tiles of the question screens (three across, or two by two). */
export const INFO_LAYOUT = {
  /** Screen 5: three small tiles in a row. */
  row: { box: "flex gap-3.5", card: "h-[110px] gap-2", picture: "h-[46px] w-full", text: "text-[16px] leading-5" },
  /** Screen 6: four big cards, two across and two down. */
  grid: { box: "grid grid-cols-2 gap-3.5", card: "h-[184px] gap-3.5", picture: "h-[83px] w-full", text: "text-[16px] leading-none" },
} as const;

/** What is inside an info tile: its picture (or number badge) and its words. */
export function InfoTileBody({ tile, layout }: { tile: InfoTile; layout: keyof typeof INFO_LAYOUT }) {
  const look = INFO_LAYOUT[layout];
  return (
    <>
      {tile.badge ? (
        <span className={`flex items-center justify-center ${look.picture}`}>
          <NumberBadge badge={tile.badge} />
        </span>
      ) : (
        tile.icon && <Pic src={tile.icon} className={look.picture} />
      )}
      <span className={`text-center font-semibold text-[#444444] dark:text-white ${look.text}`}>{tile.text}</span>
    </>
  );
}

/**
 * Screens 5 and 6: cards to look at, nothing to pick. Each bounces in, one by one,
 * once Hex has finished his line.
 */
export function InfoTiles({ tiles, layout, shown }: { tiles: readonly InfoTile[]; layout: keyof typeof INFO_LAYOUT; shown: boolean }) {
  const look = INFO_LAYOUT[layout];
  return (
    <div className={look.box} style={{ width: COLUMN_W }}>
      {tiles.map((tile, index) => (
        <BounceIn key={tile.id} index={index} shown={shown} className="flex min-w-0 flex-1">
          <div className={`flex min-w-0 flex-1 flex-col items-center justify-center px-1.5 ${CARD} ${tile.tint} ${look.card}`}>
            <InfoTileBody tile={tile} layout={layout} />
          </div>
        </BounceIn>
      ))}
    </div>
  );
}

/** A number written with its decimal point picked out, where there is one. */
export function Decimal({ value }: { value: string }) {
  const [whole, decimal] = value.split(".");
  if (decimal === undefined) return <>{value}</>;
  return (
    <>
      {whole}
      <span className="text-[#FF8D42]">.{decimal}</span>
    </>
  );
}

/**
 * Screen 6's follow-up: the four numbers sorted into whole numbers and numbers with
 * decimal parts (the decimal part picked out). The groups bounce in once Hex has
 * finished his line.
 */
export function DecimalGroups({ shown }: { shown: boolean }) {
  const groups = [
    { id: "whole", title: "Whole numbers", values: ["12", "25"], tint: TINTS.lavender },
    { id: "decimal", title: "Numbers with decimal parts", values: ["148.5", "36.7"], tint: TINTS.cream },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5" style={{ width: COLUMN_W }}>
      {groups.map((group, index) => (
        <BounceIn key={group.id} index={index} shown={shown} className="flex min-w-0 flex-1">
          <div className={`flex min-w-0 flex-1 flex-col items-center gap-2.5 px-2 py-3 ${CARD} ${group.tint}`}>
            {/* Both headings take two lines of room, so the numbers under them line up. */}
            <span className="flex h-10 items-center text-center text-[14px] leading-5 font-semibold text-[#6B7480] dark:text-white/60">{group.title}</span>
            {group.values.map((value) => (
              <span key={value} className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-white text-[22px] leading-none font-bold text-[#444444] dark:bg-[#15181E] dark:text-white">
                <Decimal value={value} />
              </span>
            ))}
          </div>
        </BounceIn>
      ))}
    </div>
  );
}

export type InfoRow = { id: string; text: string; icon: string };

/** What a row of `InfoRows` is tall (px) and the gap between rows. */
const INFO_ROW_H = 60;
const INFO_ROW_GAP = 10;

/**
 * Plain rows to look at (a picture and the words, in the answer rows' look, but
 * nothing to pick). They bounce in after the cards above them: `firstIndex` is
 * how many cards came in before the first row.
 */
export function InfoRows({ rows, shown, firstIndex = 0 }: { rows: readonly InfoRow[]; shown: boolean; firstIndex?: number }) {
  return (
    <div className="flex flex-col" style={{ width: COLUMN_W, gap: INFO_ROW_GAP }}>
      {rows.map((row, index) => (
        <BounceIn key={row.id} index={firstIndex + index} shown={shown} className="w-full">
          <div className="flex w-full items-center gap-3.5 rounded-[18px] border border-black/4 bg-white px-3.5 shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] dark:border-[#818185] dark:bg-[#15181E]" style={{ height: INFO_ROW_H }}>
            <Pic src={row.icon} className="h-[40px] w-[40px]" />
            <span className="min-w-0 flex-1 text-[14px] leading-[22px] font-medium text-[#444444] dark:text-white">{row.text}</span>
          </div>
        </BounceIn>
      ))}
    </div>
  );
}

/** The students on screen 10's list. */
const STUDENTS = ["Aarav", "Mia", "Kabir", "Ananya"] as const;

/** One part of the window: it bounces in (when the window is animated), or is simply there. */
function Part({ at, shown, animated, className, children }: { at: number; shown: boolean; animated: boolean; className?: string; children: ReactNode }) {
  return animated ? (
    <BounceIn index={at} shown={shown} className={className}>
      {children}
    </BounceIn>
  ) : (
    <div className={className}>{children}</div>
  );
}

/**
 * Screen 10: the school's list, in a window of its own: a teal title bar over a
 * row for each student's name. Animated, the window comes in and then the names,
 * one by one, once Hex has finished his line; otherwise it is simply there.
 */
export function RegisteredStudents({ shown = true, animated = true }: { shown?: boolean; animated?: boolean }) {
  return (
    <Part at={0} shown={shown} animated={animated} className="w-[340px]">
      <WindowCard title="Registered Students" icon={<People />} panel="gap-[9px] pt-4 pr-[21px] pb-6 pl-[26px]">
        {STUDENTS.map((name, index) => (
          <Part key={name} at={1 + index} shown={shown} animated={animated}>
            <div className={`flex h-[33px] items-center gap-5 pl-[22px] text-[17px] leading-6 font-bold text-[#151E48] dark:text-white ${WINDOW_ROW}`}>
              <User aria-hidden className="size-[23px] shrink-0 fill-current text-[#06C3B4]" strokeWidth={1.5} />
              {name}
            </div>
          </Part>
        ))}
      </WindowCard>
    </Part>
  );
}

/**
 * Screen 13: the two values its question is about, 12 and 3. As numbers (the first
 * question, "add them") they are headed for a calculator and joined by a plus; as
 * text (the second, "join them") they are “12” and “3”, headed for a text display
 * and joined by a link.
 */
export function TwelveCards({ mode = "numbers", replay = 0 }: { mode?: "numbers" | "text"; replay?: number }) {
  const numbers = mode === "numbers";
  const values = numbers ? ["12", "3"] : ["“12”", "“3”"];
  const Icon = numbers ? Calculator : FileText;
  const Joiner = numbers ? Plus : Link2;
  const card = (value: string, delay: number) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex w-[120px] flex-col items-center gap-0.5 px-2 py-2.5 ${CARD} ${numbers ? LAVENDER : CREAM}`}>
        <span className="text-[34px] leading-10 font-bold text-[#444444] dark:text-white">{value}</span>
        <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{numbers ? "a number" : "text"}</span>
      </div>
      <motion.span
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        className="flex size-12 items-center justify-center rounded-[10px] bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28]"
      >
        <Icon aria-hidden className="size-6" />
      </motion.span>
    </div>
  );
  return (
    // Keyed by the mode too, so the second question's cards come in afresh.
    <div key={`${mode}-${replay}`} className="flex items-start gap-2">
      {card(values[0], 0.6)}
      {/* Between the two cards, level with their middle (the cards are 86px tall). */}
      <span aria-hidden className="flex h-[86px] w-8 items-center justify-center text-[#8A94A0]">
        <Joiner className="size-6" strokeWidth={3} />
      </span>
      {card(values[1], 1.3)}
    </div>
  );
}

/**
 * Screen 13's opening: 12 and "12", one headed for a calculator (a number) and the
 * other for a text display (text). The cards bounce in once Hex has finished his line.
 */
export function TwelveIntro({ shown }: { shown: boolean }) {
  const cards = [
    { id: "number", value: "12", caption: "A numerical value", destination: "Calculator", Icon: Calculator, tint: LAVENDER },
    { id: "text", value: "“12”", caption: "Text with two characters", destination: "Text display", Icon: FileText, tint: CREAM },
  ];
  return (
    <div className="flex items-start gap-5">
      {cards.map((card, index) => (
        <BounceIn key={card.id} index={index * 2} shown={shown} className="flex flex-col items-center gap-2">
          <div className={`flex h-[96px] w-[150px] flex-col items-center justify-center gap-0.5 px-2 ${CARD} ${card.tint}`}>
            <span className="text-[34px] leading-10 font-bold text-[#444444] dark:text-white">{card.value}</span>
            <span className="text-center text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{card.caption}</span>
          </div>
          <ArrowDown aria-hidden className="size-5 text-[#8A94A0]" strokeWidth={3} />
          <span className="flex size-12 items-center justify-center rounded-[10px] bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28]">
            <card.Icon aria-hidden className="size-6" />
          </span>
          <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{card.destination}</span>
        </BounceIn>
      ))}
    </div>
  );
}

/** Screen 14: the attendance board, the status switching between present and absent. */
export function AttendanceBoard() {
  const [present, setPresent] = useState(true);
  useEffect(() => {
    const timer = window.setInterval(() => setPresent((now) => !now), 1600);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <WindowCard title="Attendance" icon={<ClipboardCheck />} panel="pt-3.5 pr-[21px] pb-4 pl-[21px]">
      <div className={`flex h-[52px] items-center justify-between gap-3 pr-3 pl-2.5 ${WINDOW_ROW}`}>
        <div className="flex items-center gap-2.5">
          <Pic src={P.programmer} className="h-[40px] w-[40px]" />
          <span className="text-[18px] leading-7 font-bold text-[#151E48] dark:text-white">Aarav</span>
        </div>
        <motion.span
          key={String(present)}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[15px] leading-6 font-bold text-white ${present ? "bg-[#01A17F]" : "bg-[#E5484D]"}`}
        >
          {present ? <Check aria-hidden className="size-4" strokeWidth={3} /> : <X aria-hidden className="size-4" strokeWidth={3} />}
          {present ? "Present" : "Absent"}
        </motion.span>
      </div>
    </WindowCard>
  );
}

/** Screen 23: four information cards with the type each was given; one is marked as suspect. */
export function TypedCards({ fixed = false }: { fixed?: boolean }) {
  const rows = [
    { label: "Name", value: "Aarav", type: "String", warn: false },
    { label: "Age", value: "12", type: "Integer", warn: false },
    { label: "Height", value: "148.5", type: fixed ? "Float" : "Integer", warn: !fixed },
    { label: "Is_present", value: "True", type: "Boolean", warn: false },
  ];
  return (
    <WindowCard title="Student record" icon={<FileText />} panel="gap-[7px] pt-3.5 pr-[21px] pb-4 pl-[21px]">
      {rows.map((row) => (
        <div key={row.label} className={`flex h-[34px] items-center gap-3 px-3 ${row.warn ? "rounded-[8px] bg-[#FFF8E1] ring-2 ring-[#FFB300] dark:bg-[#2A2218]" : WINDOW_ROW}`}>
          <span className="w-[78px] text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{row.label}</span>
          <span className="min-w-0 flex-1 text-[16px] leading-6 font-bold text-[#151E48] dark:text-white">{row.value}</span>
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] leading-4 font-semibold ${row.warn ? "bg-[#FFB300] text-white" : "bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28]"}`}>
            {row.warn && <TriangleAlert aria-hidden className="size-3" />}
            {row.type}
          </span>
        </div>
      ))}
    </WindowCard>
  );
}

/** Screen 22: the finished weather card. */
export function WeatherCard() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <WindowCard title="Weather" icon={<CloudSun />} panel="gap-[7px] pt-3.5 pr-[21px] pb-4 pl-[21px]">
        {[
          ["City", "Delhi"],
          ["Temperature", "28.5°C"],
          ["Rainy days", "3"],
          ["Is raining", "False"],
        ].map(([label, value]) => (
          <div key={label} className={`flex h-[34px] items-center justify-between px-3 ${WINDOW_ROW}`}>
            <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{label}</span>
            <span className="text-[16px] leading-6 font-bold text-[#151E48] dark:text-white">{value}</span>
          </div>
        ))}
      </WindowCard>
    </motion.div>
  );
}

/** Screen 7's picture is as wide as its three example tiles (112 each) and the gaps between them (8). */
const INTEGER_LESSON_W = 3 * 112 + 2 * 8;

/** A chip on the number line, and the pointer under it that takes the chip's colour: a negative number is picked out in purple. */
const CHIP_LOOK = {
  whole: { chip: "bg-[#B8EDDB] text-[#05594F]", pointer: "border-t-[#B8EDDB]" },
  negative: { chip: "bg-[#C0ABEF] text-[#361887]", pointer: "border-t-[#C0ABEF]" },
} as const;

const LINE_VALUES = [
  { value: "-5", look: CHIP_LOOK.negative },
  { value: "0", look: CHIP_LOOK.whole },
  { value: "1", look: CHIP_LOOK.whole },
  { value: "12", look: CHIP_LOOK.whole },
  { value: "25", look: CHIP_LOOK.whole },
] as const;

/** Where each part of screen 7 comes in (see `BounceIn`): the card, its chips, the `int` note, then the examples. */
const LESSON_AT = { card: 0, chips: 1, note: 1 + LINE_VALUES.length, examples: 2 + LINE_VALUES.length } as const;

export type ExampleTile = { id: string; value: string; text: string; tint: string; badge: string };

/** Five integers on a number line that runs on both ways, each in a chip that points at its dot. */
function IntegerLine({ shown }: { shown: boolean }) {
  return (
    <div className="relative flex justify-center">
      <svg aria-hidden className="absolute top-[32.5px] left-1/2 -translate-x-1/2" width="224" height="12" viewBox="0 0 224 12" fill="none" stroke="#0CC0B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6H222M8 1L2 6L8 11M216 1L222 6L216 11" />
      </svg>
      {LINE_VALUES.map(({ value, look }, index) => (
        <BounceIn key={value} index={LESSON_AT.chips + index} shown={shown} className="flex w-[46.5px] flex-col items-center">
          <span className={`flex h-[28px] min-w-9 items-center justify-center rounded-full px-2 text-[18px] leading-none font-bold ${look.chip}`}>{value}</span>
          <span className={`size-0 border-x-4 border-t-[5px] border-x-transparent ${look.pointer}`} />
          <span className="mt-0.5 size-[9px] rounded-full bg-[#0CC0B7]" />
          <span aria-hidden className="mt-0.5 text-[11px] leading-4 font-semibold text-white dark:text-white/25">
            {value}
          </span>
        </BounceIn>
      ))}
    </div>
  );
}

/**
 * Screen 7: whole numbers on a number line, what `int` says about them, and three
 * examples from everyday life. The parts bounce in, one by one, once Hex has finished his line.
 */
export function IntegerLesson({ examples, shown }: { examples: readonly ExampleTile[]; shown: boolean }) {
  return (
    <div className="flex flex-col" style={{ width: INTEGER_LESSON_W }}>
      <BounceIn index={LESSON_AT.card} shown={shown} className={`flex flex-col items-center gap-[5px] rounded-[16px] px-4 pt-[17px] pb-4 ${LAVENDER}`}>
        <IntegerLine shown={shown} />
        <BounceIn index={LESSON_AT.note} shown={shown} className="flex h-[52px] w-[237px] items-center gap-[9px] rounded-[20px] border-2 border-white bg-[#E0F4EE] pl-2.5 dark:border-transparent dark:bg-[#0F2B28]">
          <span className="flex h-[34px] w-[69px] shrink-0 items-center justify-center rounded-full bg-[#BDEEDC] font-mono text-[20px] leading-none text-[#111513] dark:bg-[#17413B] dark:text-white">
            (<span className="text-[#108A26] dark:text-[#5DDB7A]">int</span>)
          </span>
          <span className="mr-[3px] h-7 w-px shrink-0 bg-[#6DD9C3] dark:bg-white/20" />
          <span className="text-[11px] leading-[15px] font-semibold whitespace-nowrap text-[#333333] dark:text-white">
            Integer represents
            <br />
            whole-number values.
          </span>
        </BounceIn>
      </BounceIn>
      <BounceIn index={LESSON_AT.examples} shown={shown} className="mt-7 self-start">
        <span className={`flex h-[38px] w-[100px] items-center justify-center rounded-[8px] text-[16px] leading-none font-semibold ${INK.violet} ${LAVENDER}`}>Examples</span>
      </BounceIn>
      <div className="mt-3 flex gap-2">
        {examples.map((tile, index) => (
          <BounceIn key={tile.id} index={LESSON_AT.examples + index} shown={shown} className="shrink-0">
            <div className={`flex h-[119px] w-[112px] flex-col items-center justify-center gap-1.5 rounded-[8px] border-4 border-white dark:border-transparent ${tile.tint}`}>
              <span className={`flex size-10 items-center justify-center rounded-[12px] text-[20px] leading-[120%] font-semibold whitespace-nowrap ${tile.badge}`}>{tile.value}</span>
              <span className="w-[104px] text-center text-[14px] leading-[120%] font-semibold text-[#444444] dark:text-white">{tile.text}</span>
            </div>
          </BounceIn>
        ))}
      </div>
    </div>
  );
}
