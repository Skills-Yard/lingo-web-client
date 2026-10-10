"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { Code2 } from "lucide-react";
import { HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { BottomNav, type HomeTab } from "./BottomNav";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

/** The Figma frame every coordinate below is taken from. */
const STAGE_W = 390;
const STAGE_H = 844;
const MAX_SCALE = 1.5;

const EASE = [0.22, 1, 0.36, 1] as const;

type Tone = "purple" | "gray";

/** done: lit platform with its tick; current: the one Hex stands on;
 * locked: greyed with a padlock. */
type LevelState = "done" | "current" | "locked";

type PlatformSpec = {
  id: string;
  level: number;
  state: LevelState;
  /** Top-face centre, in world px. */
  cx: number;
  cy: number;
  /** Big or small slab artwork — see isBigSlab. */
  big: boolean;
};

const LEVEL_COUNT = 50;
/** The level Hex stands on ("Start"); every level before it is done. */
const CURRENT_LEVEL = 5;
/** Vertical distance between two levels. */
const LEVEL_DY = 62;
/** Top-face centres of the first level's cycle — the Figma path: right-up
 * steps, then back left, repeating every six levels. */
const X_CYCLE = [91, 185, 260, 299, 266, 183] as const;
/** Where level 1's top-face centre sits on the first screen (Figma y). */
const FIRST_LEVEL_Y = 704;
/** Room above the top level for the module card + a breath. */
const WORLD_TOP_PAD = 295;
/** The world is the Figma frame with the extra levels stacked above it. */
const WORLD_SHIFT = (LEVEL_COUNT - 1) * LEVEL_DY - FIRST_LEVEL_Y + WORLD_TOP_PAD;
const WORLD_H = STAGE_H + WORLD_SHIFT;

type Point = { x: number; y: number };

/** Top-face centre of a level in world coordinates. */
const levelCenter = (level: number): Point => ({
  x: X_CYCLE[(level - 1) % X_CYCLE.length],
  y: FIRST_LEVEL_Y - (level - 1) * LEVEL_DY + WORLD_SHIFT,
});

/** Slab size per level: the five open levels run big, small, small, big,
 * small (as in the design); the locked ones then alternate big, small. */
const OPEN_SLAB_PATTERN = [true, false, false, true, false] as const;
const isBigSlab = (level: number) =>
  level <= CURRENT_LEVEL ? OPEN_SLAB_PATTERN[level - 1] : (level - CURRENT_LEVEL) % 2 === 1;

const PLATFORMS: PlatformSpec[] = Array.from({ length: LEVEL_COUNT }, (_, n) => {
  const level = n + 1;
  const { x, y } = levelCenter(level);
  return {
    id: `l${level}`,
    level,
    state: level < CURRENT_LEVEL ? "done" : level === CURRENT_LEVEL ? "current" : "locked",
    cx: x,
    cy: y,
    big: isBigSlab(level),
  };
});

/** Smooth curve (Catmull-Rom as cubic beziers) through the given points. */
const curveThrough = (points: Point[]): string => {
  const [first, ...rest] = points;
  let d = `M${first.x} ${first.y}`;
  rest.forEach((p, i) => {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1 = { x: p1.x + (p.x - p0.x) / 6, y: p1.y + (p.y - p0.y) / 6 };
    const c2 = { x: p.x - (p3.x - p1.x) / 6, y: p.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`;
  });
  return d;
};

const CENTERS = Array.from({ length: LEVEL_COUNT }, (_, n) => levelCenter(n + 1));
const PURPLE_PATH = curveThrough(CENTERS.slice(0, CURRENT_LEVEL));
const GRAY_PATH = curveThrough(CENTERS.slice(CURRENT_LEVEL - 1));
const CURRENT = levelCenter(CURRENT_LEVEL);

const SLAB_H = 54 / 92;

const useHomeId = () => useId().replace(/:/g, "");

/** An isometric slab: a lit top face over two shaded sides. */
function Slab({ tone, w }: { tone: Tone; w: number }) {
  const id = useHomeId();
  const palette =
    tone === "purple"
      ? { from: "#9F91FE", to: "#E2DCFF", left: "#6B55FB", right: "#8A78FD", glow: "rgba(104,81,251,0.45)" }
      : { from: "#A6A8B5", to: "#E0E2E7", left: "#9EA2AF", right: "#B6B9C4", glow: "rgba(150,155,170,0.4)" };
  return (
    <svg
      width={w}
      height={w * SLAB_H}
      viewBox="0 0 92 54"
      fill="none"
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-top`} x1="12%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-40%" y="-40%" width="180%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse cx="46" cy="46" rx="38" ry="14" fill={palette.glow} filter={`url(#${id}-blur)`} />
      <path d="M0 18 L46 36 L46 54 L0 36 Z" fill={palette.left} />
      <path d="M92 18 L46 36 L46 54 L92 36 Z" fill={palette.right} />
      <path d="M46 0 L92 18 L46 36 L0 18 Z" fill={`url(#${id}-top)`} />
      <path d="M0 18 L46 36 L92 18" stroke="white" strokeOpacity="0.55" strokeWidth="0.8" />
    </svg>
  );
}

/** The platform artwork (public/images/platforms): a slab with its own
 * reflection, the tick or padlock baked in. `ax`/`ay` are the centre of the
 * slab's top face in the picture, which is what gets pinned to the level. */
const ART = {
  unlocked: {
    big: { src: "/images/platforms/unlocked-big.png", w: 461, h: 420, ax: 226, ay: 100 },
    small: { src: "/images/platforms/unlocked-small.png", w: 383, h: 354, ax: 190, ay: 98 },
  },
  locked: {
    big: { src: "/images/platforms/locked-big.png", w: 516, h: 424, ax: 254, ay: 100 },
    small: { src: "/images/platforms/locked-small.png", w: 444, h: 423, ax: 219, ay: 114 },
  },
} as const;

/** Picture px -> world px: a big slab comes out ~96px wide. */
const ART_SCALE = 0.364;

/** Only the first screenful animates in / floats; the rest just sits there,
 * so fifty platforms don't mean fifty running animations. */
const ANIMATED_LEVELS = 9;

/** The lesson-type tile floating over a platform — the list on the first
 * level, the code tile on the fourth (public/images/platforms/glyph-*.png,
 * 170x173 pictures). */
const GLYPH_ART: Partial<Record<number, { src: string; x: number; y: number }>> = {
  // `x`/`y`: the tile's centre relative to the slab's top-face centre
  // (right and up). The code tile sits over the tick baked into level 4's
  // art, as in the design; the list tile leaves level 1's tick visible.
  1: { src: "/images/platforms/glyph-list.png", x: -2, y: 20 },
  4: { src: "/images/platforms/glyph-code.png", x: 14, y: 22 },
};
const GLYPH_SIZE = { w: 170 * ART_SCALE, h: 173 * ART_SCALE } as const;
function PlatformArt({ spec }: { spec: PlatformSpec }) {
  const { state, big, cx, cy } = spec;
  if (state === "current") {
    // The platform under Hex has no tick, so it stays a drawn slab.
    const w = 72;
    return (
      <div className="absolute" style={{ left: cx - w / 2, top: cy - (18 * w) / 92 }}>
        <Slab tone="purple" w={w} />
      </div>
    );
  }
  const art = ART[state === "done" ? "unlocked" : "locked"][big ? "big" : "small"];
  const glyph = state === "done" ? GLYPH_ART[spec.level] : undefined;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.src}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          left: cx - art.ax * ART_SCALE,
          top: cy - art.ay * ART_SCALE,
          width: art.w * ART_SCALE,
          height: art.h * ART_SCALE,
        }}
      />
      {glyph && (
        <motion.img
          src={glyph.src}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            left: cx + glyph.x - GLYPH_SIZE.w / 2,
            top: cy - glyph.y - GLYPH_SIZE.h / 2,
            width: GLYPH_SIZE.w,
            height: GLYPH_SIZE.h,
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: spec.level * 0.2 }}
        />
      )}
    </>
  );
}

function PlatformNode({ spec }: { spec: PlatformSpec }) {
  const { level } = spec;
  if (level > ANIMATED_LEVELS) return <PlatformArt spec={spec} />;
  return (
    <motion.div
      className="absolute left-0 top-0 h-0 w-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.25 + (level - 1) * 0.05 }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3.6 + (level % 3) * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: level * 0.3,
        }}
      >
        <PlatformArt spec={spec} />
      </motion.div>
    </motion.div>
  );
}

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

function HomeHex() {
  const { RiveComponent } = useHexRive(HEX_LAYOUT, HEX_STATE.idle);
  return <RiveComponent className="h-full w-full" />;
}

/** The module's Python badge (the picture carries its own glow, so it is
 * drawn larger than the slot it sits in and pulled back with margins). */
function PythonLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/python-logo.png"
      alt="Python"
      draggable={false}
      width={351}
      height={313}
      className="-mx-9 -my-5 h-[118px] w-[132px] max-w-none select-none object-contain"
    />
  );
}

function StatChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-9 items-center gap-1.5 rounded-lg border border-black/8 bg-white/60 px-3 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function FlameIcon() {
  return (
    <svg width="19" height="23" viewBox="0 0 19 23" fill="none" aria-hidden>
      <path
        d="M9.500 0 C10 5 18 8 18 15 C18 19.500 14.500 23 9.500 23 C4.500 23 1 19.500 1 15 C1 11 3.500 9 4.500 6.500 C6 8 6.500 9 7 10 C8.500 7 9.500 4 9.500 0 Z"
        fill="#FF8D42"
      />
      <path
        d="M9.500 12 C10.500 14 14 15 14 18 C14 20.500 12 22 9.500 22 C7 22 5 20.500 5 18 C5 15.500 8 14.500 9.500 12 Z"
        fill="#FFC342"
      />
    </svg>
  );
}

function GemIcon() {
  const id = useHomeId();
  return (
    <svg width="23" height="24" viewBox="0 0 23 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DE8F5" />
          <stop offset="0.55" stopColor="#0398DD" />
          <stop offset="1" stopColor="#60CBFD" />
        </linearGradient>
      </defs>
      <path d="M11.500 1 L21 6.500 V17.500 L11.500 23 L2 17.500 V6.500 Z" fill={`url(#${id}-g)`} />
      <path d="M11.500 5 L17.500 8.500 V15.500 L11.500 19 L5.500 15.500 V8.500 Z" fill="#7DE8F5" fillOpacity="0.7" />
    </svg>
  );
}

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

/**
 * The learner's home: module card, the path of platforms (completed ones
 * lit, the next one under Hex with its "Start" bubble, then the locked levels
 * up to LEVEL_COUNT, which you scroll up to see) and the bottom nav. Laid out
 * on the Figma 390x844 frame and scaled to fit the viewport, so every
 * coordinate is the design's own. The header, module card and nav stay put;
 * only the path scrolls beneath them.
 */
export function HomeScreen({
  onStart,
  onNavigate,
}: {
  onStart?: () => void;
  onNavigate?: (tab: HomeTab) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const startedAtBottom = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      setScale(Math.min(width / STAGE_W, height / STAGE_H, MAX_SCALE));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Open on the first screen — the path continues upward from there.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || startedAtBottom.current) return;
    startedAtBottom.current = true;
    scroller.scrollTop = scroller.scrollHeight;
  }, [scale]);

  return (
    <main
      className={`${poppins.className} onboarding-light flex h-dvh w-full justify-center overflow-hidden bg-gradient-to-b from-white from-[0.15%] via-[#FCFFFC] via-[47%] to-[#F4FFF6] text-[#1A1C22]`}
    >
      <div ref={boxRef} className="relative h-full w-full">
        {/* The scrolling world: every level of the path. */}
        <div
          ref={scrollerRef}
          className="scrollbar-none absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div
            className="relative mx-auto"
            style={{ width: STAGE_W * scale, height: WORLD_H * scale }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: STAGE_W, height: WORLD_H, transform: `scale(${scale})` }}
            >
              {/* Soft ghost tiles at the edges, as in the reference. */}
              {Array.from({ length: Math.ceil(LEVEL_COUNT / 4) }, (_, n) => (
                <span
                  key={n}
                  className={`absolute h-[92px] w-[131px] rounded-xl blur-[2px] ${
                    n % 2 === 0 ? "-left-12 bg-[#E4DFFF]/60" : "-right-20 rotate-[-2deg] bg-[#E9ECF2]/70"
                  }`}
                  style={{ top: WORLD_H - 480 - n * 4 * LEVEL_DY }}
                />
              ))}

              {/* The dashed path, under everything on it. */}
              <svg
                className="absolute inset-0"
                width={STAGE_W}
                height={WORLD_H}
                viewBox={`0 0 ${STAGE_W} ${WORLD_H}`}
                fill="none"
                aria-hidden
              >
                <motion.path
                  d={GRAY_PATH}
                  stroke="#B7BAC6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="5 8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                />
                <motion.path
                  d={PURPLE_PATH}
                  stroke="#6F5CFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="5 8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                />
              </svg>

              {[...PLATFORMS].reverse().map((spec) => (
                <PlatformNode key={spec.id} spec={spec} />
              ))}

              {/* Hex on the current platform, with his bubble. */}
              <div
                className="absolute"
                style={{ left: CURRENT.x - 55, top: CURRENT.y - 92, width: 110, height: 110 }}
              >
                <HomeHex />
              </div>

              <motion.div
                className="absolute h-[108px] w-[190px] rounded-lg bg-white shadow-[1px_1px_4px_#D2D1FA]"
                style={{ left: CURRENT.x - 102, top: CURRENT.y - 168, transformOrigin: "30% 100%" }}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
              >
                <span className="absolute -bottom-[7px] left-[78px] h-4 w-4 rotate-45 rounded-[3px] bg-white shadow-[2px_2px_3px_rgba(210,209,250,0.7)]" />
                <p className="absolute left-4 top-[18px] w-[157px] text-sm font-medium leading-[1.4] text-[#2C2C2C]">
                  Variable Dependency
                </p>
                <button
                  type="button"
                  onClick={onStart}
                  className="absolute left-[26px] top-[46px] flex h-8 w-[139px] items-center justify-center rounded-[44px] bg-[#5D4CFE] text-sm font-medium leading-[1.4] text-white shadow-[0_3px_0_#4536D6] transition-transform duration-150 active:translate-y-[2px] active:shadow-[0_1px_0_#4536D6]"
                >
                  Start
                </button>
              </motion.div>

              {/* Play marker beside Hex's platform */}
              <motion.span
                className="absolute flex h-[35px] w-[35px] items-center justify-center rounded-full bg-gradient-to-br from-[#887FFE] via-[#5A48FF] to-[#5D46EE] shadow-[0_4px_8px_rgba(90,72,255,0.4)]"
                style={{ left: CURRENT.x + 25, top: CURRENT.y - 28 }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: EASE, delay: 1.05 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.span>
            </div>
          </div>
        </div>

        {/* Header + module card: pinned to the top of the screen, over the
          path. The fade lets the scrolling path slide under them. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white from-[90%] to-transparent"
          style={{ height: 246 * scale }}
        >
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{ width: STAGE_W, height: 246, transform: `translateX(-50%) scale(${scale})` }}
          >
          {/* Streak + gems */}
          <motion.div
            className="pointer-events-auto absolute left-4 top-[14px] flex w-[358px] items-center justify-between"
            {...reveal(0)}
          >
            <StatChip>
              <FlameIcon />
              <span className="text-base font-semibold leading-[1.4] text-[#FF8D42]">4</span>
            </StatChip>
            <StatChip>
              <GemIcon />
              <span className="text-base font-semibold leading-[1.4] text-[#3683D3]">373</span>
            </StatChip>
          </motion.div>

          {/* Module card */}
          <motion.div
            className="pointer-events-auto absolute left-4 top-[62px] box-border flex h-[158px] w-[357px] items-center gap-2.5 rounded-lg border-b-[6px] border-[#BDBA99] bg-gradient-to-b from-white from-[30.82%] to-[#DCD5FE] p-[18px] shadow-[1px_1px_7.3px_1px_rgba(0,0,0,0.25)]"
            {...reveal(0.1)}
          >
            <div className="flex h-[116px] w-[229px] shrink-0 flex-col gap-2.5">
              <div className="flex h-[30px] items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
                  <Code2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span className="text-xs font-medium uppercase leading-[18px] text-[#666666]">
                  Python Programming
                </span>
              </div>
              <h1 className="text-xl font-semibold leading-[1.2] text-[#1A1C22]">
                Module 1 Programming Mindset
              </h1>
              <div className="flex h-[18px] items-center">
                <span className="w-[101px] shrink-0 text-xs font-medium leading-[18px]">2/7 completed</span>
                <span className="relative h-2 w-32 overflow-hidden rounded-full bg-black/8">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#5D4CFE]"
                    initial={{ width: 0 }}
                    animate={{ width: 46 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
                  />
                </span>
              </div>
            </div>
            <motion.div
              className="relative -mt-2 shrink-0"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <PythonLogo />
            </motion.div>
          </motion.div>
          </div>
        </div>

        {/* Mobile nav: pinned to the bottom of the screen. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#F4FFF6] from-[35%] to-transparent"
          style={{ height: 128 * scale }}
        >
          <div
            className="absolute bottom-0 left-1/2 origin-bottom"
            style={{ width: STAGE_W, height: 128, transform: `translateX(-50%) scale(${scale})` }}
          >
          {/* Bottom nav */}
          <div className="absolute left-4 top-[32px] w-[358px]">
            <BottomNav active="home" onNavigate={onNavigate} />
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}
