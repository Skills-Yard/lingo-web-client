"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Calculator, Check, FileText, TriangleAlert, X } from "lucide-react";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import { P } from "./pictures";

/** A card, in the style of the Sequence module's picture cards. */
export const CARD = "rounded-[8px] border-4 border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent";
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
export function EventScene() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
      style={{ top: stageTop(EVENT_SCENE.top), maskImage: EVENT_SCENE_FADE, WebkitMaskImage: EVENT_SCENE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
    >
      <SlotImage file={P.eventScene} className="h-auto w-[390px] max-w-none shrink-0 dark:brightness-[0.55]" />
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

/** Screen 5: things to count, each with its number coming in beside it. */
export function CountScene({ replay = 0 }: { replay?: number }) {
  const rows = [
    { pic: P.programmer, label: "Students", count: 30 },
    { pic: P.star, label: "Tickets", count: 45 },
    { pic: P.gem, label: "Prizes", count: 12 },
  ];
  return (
    <div key={replay} className="flex w-[316px] flex-col gap-2">
      {rows.map((row, index) => (
        <div key={row.label} className={`flex items-center gap-3 px-3 py-1.5 ${CARD} ${CREAM}`}>
          <Pic src={row.pic} className="h-9 w-9" />
          <span className="flex-1 text-[16px] leading-6 font-semibold text-[#444444] dark:text-white">{row.label}</span>
          <motion.span
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.7, type: "spring", stiffness: 260, damping: 14 }}
            className="min-w-[52px] rounded-full bg-[#08A4AD] px-3 py-0.5 text-center text-[18px] leading-7 font-bold text-white"
          >
            {row.count}
          </motion.span>
        </div>
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

/** Screen 8: a measuring scale stopping at two heights; the decimal parts are picked out. */
export function RulerScale({ replay = 0 }: { replay?: number }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const timers = [window.setTimeout(() => setAt(1), 700), window.setTimeout(() => setAt(2), 2700)];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setAt(0);
    };
  }, [replay]);
  const heights = [140, 148.5, 152.8] as const;
  const x = ((heights[at] - 140) / 20) * 288;
  return (
    <div className={`flex w-[316px] flex-col items-center gap-1 px-3 pt-2 pb-3 ${CARD} ${WHITE}`}>
      <span className="text-[26px] leading-8 font-bold text-[#444444] dark:text-white">
        {at === 0 ? "…" : <Decimal value={heights[at].toFixed(1)} />} <span className="text-[16px] font-semibold text-[#8A94A0]">cm</span>
      </span>
      <div className="relative h-9 w-[288px]">
        <div className="absolute inset-x-0 top-5 h-[3px] rounded-full bg-[#D5DADF] dark:bg-white/20" />
        {Array.from({ length: 21 }, (_, index) => (
          <span key={index} className="absolute top-4 w-[2px] rounded-full bg-[#8D9BAA]" style={{ left: (index / 20) * 288 - 1, height: index % 5 === 0 ? 14 : 8 }} />
        ))}
        <motion.span
          className="absolute top-0 -ml-[7px] h-0 w-0 border-x-[7px] border-t-[11px] border-x-transparent border-t-[#08A4AD]"
          initial={false}
          animate={{ x }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </div>
      <div className="flex w-[288px] justify-between text-[11px] leading-4 font-semibold text-[#8A94A0]">
        {[140, 145, 150, 155, 160].map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}

/** Screen 10: the registration list, the names appearing one by one. */
export function NamesList({ replay = 0 }: { replay?: number }) {
  return (
    <div key={replay} className={`flex w-[316px] flex-col gap-1.5 px-3 py-3 ${CARD} ${LAVENDER}`}>
      <span className="text-[11px] leading-4 font-bold tracking-[0.5px] text-[#6B7480] uppercase dark:text-white/60">Registered students</span>
      <div className="grid grid-cols-2 gap-1.5">
        {["Aarav", "Mia", "Kabir", "Ananya"].map((name, index) => (
          <FieldRow key={name} label={`#${index + 1}`} delay={0.3 + index * 0.55}>
            {name}
          </FieldRow>
        ))}
      </div>
    </div>
  );
}

/** Screen 13: 12 and "12", one headed for a calculator, the other for a text display. */
export function TwelveCards({ replay = 0 }: { replay?: number }) {
  const card = (value: string, label: string, tint: string, Icon: typeof Calculator, delay: number) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex w-[132px] flex-col items-center gap-0.5 px-2 py-2.5 ${CARD} ${tint}`}>
        <span className="text-[34px] leading-10 font-bold text-[#444444] dark:text-white">{value}</span>
        <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{label}</span>
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
    <div key={replay} className="flex items-start gap-4">
      {card("12", "a number", LAVENDER, Calculator, 0.6)}
      {card("“12”", "text", CREAM, FileText, 1.3)}
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
    <div className={`flex w-[316px] items-center justify-between gap-3 px-4 py-3 ${CARD} ${LAVENDER}`}>
      <div className="flex items-center gap-3">
        <Pic src={P.programmer} className="h-[56px] w-[56px]" />
        <span className="text-[20px] leading-7 font-bold text-[#444444] dark:text-white">Aarav</span>
      </div>
      <motion.span
        key={String(present)}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[16px] leading-6 font-bold text-white ${present ? "bg-[#01A17F]" : "bg-[#E5484D]"}`}
      >
        {present ? <Check aria-hidden className="size-4" strokeWidth={3} /> : <X aria-hidden className="size-4" strokeWidth={3} />}
        {present ? "Present" : "Absent"}
      </motion.span>
    </div>
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
    <div className="grid w-[316px] grid-cols-2 gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1.5 ${row.warn ? "border-[#FFB300] bg-[#FFF8E1] dark:bg-[#2A2218]" : "border-[#E3E5E9] bg-white dark:border-white/15 dark:bg-[#15181E]"}`}
        >
          <span className="text-[11px] leading-4 font-medium text-[#8A94A0]">{row.label}</span>
          <span className="text-[18px] leading-6 font-bold text-[#444444] dark:text-white">{row.value}</span>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-semibold ${row.warn ? "bg-[#FFB300] text-white" : "bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28]"}`}>
            {row.warn && <TriangleAlert aria-hidden className="size-3" />}
            {row.type}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Screen 22: the finished weather card. */
export function WeatherCard() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`flex w-[316px] flex-col gap-1.5 px-3 py-3 ${CARD} ${LAVENDER}`}>
      <span className="text-[11px] leading-4 font-bold tracking-[0.5px] text-[#6B7480] uppercase dark:text-white/60">Weather</span>
      <div className="grid grid-cols-2 gap-1.5">
        <FieldRow label="City">Delhi</FieldRow>
        <FieldRow label="Temperature">28.5°C</FieldRow>
        <FieldRow label="Rainy days">3</FieldRow>
        <FieldRow label="Is raining">False</FieldRow>
      </div>
    </motion.div>
  );
}

/** Screen 7: a number line, the value just tapped lit on it. */
export function NumberLine({ current }: { current: string | null }) {
  const values = [-5, 0, 1, 12, 25];
  const at = (value: number) => 12 + ((value + 5) / 30) * 296;
  const lit = current === null ? null : Number(current);
  return (
    <div className={`relative h-[66px] w-[330px] px-0 ${CARD} ${WHITE}`}>
      <div className="absolute inset-x-3 top-7 h-[3px] rounded-full bg-[#D5DADF] dark:bg-white/20" />
      {[-5, 0, 5, 10, 15, 20, 25].map((tick) => (
        <span key={tick} className="absolute top-6 flex -translate-x-1/2 flex-col items-center gap-1" style={{ left: at(tick) }}>
          <span className="h-[9px] w-[2px] rounded-full bg-[#8D9BAA]" />
          <span className="text-[10px] leading-3 font-semibold text-[#8A94A0]">{tick}</span>
        </span>
      ))}
      {values.map((value) => (
        <motion.span
          key={value}
          className="absolute top-[21px] -ml-2 size-4 rounded-full border-2 border-white bg-[#08A4AD]"
          style={{ left: at(value) }}
          initial={false}
          animate={{ scale: lit === value ? 1.5 : 0.7, opacity: lit === value ? 1 : 0.45 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
        />
      ))}
    </div>
  );
}
