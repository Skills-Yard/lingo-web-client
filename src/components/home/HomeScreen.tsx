"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { Code2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { HEX_STATE, LIVE_PLATFORM } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { BottomNav, type HomeTab } from "./BottomNav";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

/** The Figma frame every coordinate below is taken from. */
const STAGE_W = 390;
const STAGE_H = 844;
const MAX_SCALE = 1.5;

const EASE = [0.22, 1, 0.36, 1] as const;

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

const LEVEL_COUNT = 100;
/** The level Hex stands on ("Start"); every level before it is done. */
const CURRENT_LEVEL = 3;
/** Top-face centres of the first nine levels, read off the Figma frame
 * (done x2, live, locked x4) and flipped so the path runs top to bottom.
 * `y` is the distance below level 1. */
const FIGMA_PATH = [
  { x: 82, y: 0 },
  { x: 189, y: 59 },
  { x: 267, y: 153 },
  { x: 316, y: 267 },
  { x: 259, y: 333 },
  { x: 194, y: 387 },
  { x: 70, y: 431 },
] as const;
/** Past the design the path keeps swinging right and back left, at an even
 * step. */
const TAIL_X = [189, 267, 316, 259, 194, 82] as const;
/** Past the design the gap to the next level is never under TAIL_MIN_DY,
 * and every so often it stretches by another TAIL_STEP, up to four times. */
const TAIL_MIN_DY = 60;
const TAIL_STEP = 25;
/** A fixed hash of the level, not Math.random, so the server and the client
 * draw the same path. */
const tailGap = (level: number) =>
  TAIL_MIN_DY + TAIL_STEP * ((Math.imul(level, 2654435761) >>> 11) % 5);
/** Where level 1's top-face centre sits, just under the pinned module card. */
const FIRST_LEVEL_Y = 323;
/** Room below the last level for the bottom nav + a breath. */
const WORLD_BOTTOM_PAD = 200;
/** Height of one repeat of the backdrop picture (world px). */
const BG_TILE_H = 640;

type Point = { x: number; y: number };

/** Top-face centre of every level in world coordinates, level 1 first. */
const LEVEL_POINTS: Point[] = (() => {
  const points: Point[] = FIGMA_PATH.map(({ x, y }) => ({ x, y: FIRST_LEVEL_Y + y }));
  for (let level = FIGMA_PATH.length + 1; level <= LEVEL_COUNT; level++) {
    const prev = points[points.length - 1];
    points.push({
      x: TAIL_X[(level - FIGMA_PATH.length - 1) % TAIL_X.length],
      y: prev.y + tailGap(level),
    });
  }
  return points;
})();

const WORLD_H = LEVEL_POINTS[LEVEL_COUNT - 1].y + WORLD_BOTTOM_PAD;

const levelCenter = (level: number): Point => LEVEL_POINTS[level - 1];

/** Slab size per level: only the live fifth is big; the done ones before it
 * and every locked one after it are the small slab (the big locked art is
 * unused for now). */
const isBigSlab = (level: number) => level === CURRENT_LEVEL;

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
/** -1: Hex stands left of the live platform, 1: right of it. */
const HEX_SIDE = CURRENT.x > STAGE_W / 2 ? -1 : 1;
const HEX_OFFSET_X = 155;
/** Hex's hop onto the live platform: how long, how high the arc, and how far
 * up he ends (so he stands on the top face). */
const HOP_S = 0.42;
const HOP_HEIGHT = 70;
const HEX_PERCH = 37;

const useHomeId = () => useId().replace(/:/g, "");

/** The platform artwork (public/images/platforms): a slab with its own
 * reflection, the tick or padlock baked in. `ax`/`ay` are the centre of the
 * slab's top face in the picture, which is what gets pinned to the level. */
const ART = {
  unlocked: {
    big: { src: "/images/platforms/unlocked-big.png", w: 461, h: 420, ax: 226, ay: 100 },
    small: { src: "/images/platforms/unlocked-small.png", w: 383, h: 354, ax: 190, ay: 98 },
  },
  locked: {
    small: { src: "/images/platforms/locked-small.png", w: 444, h: 423, ax: 219, ay: 114 },
  },
} as const;

/** The slab Hex stands on is `LIVE_PLATFORM`'s rive, drawn at `LIVE_RIV_SCALE`
 * world px per artboard px so the slab comes out the size of the old artwork.
 * `ax`/`ay` are the centre of its top face in artboard px, which is what gets
 * pinned to the level. */
const LIVE_RIV_SCALE = 1.02;
const LIVE_RIV = { ax: 86.7, ay: 23.4 } as const;
/** Picture px -> world px: a big slab comes out ~96px wide. */
const ART_SCALE = 0.364;

/** Only the first screenful animates in / floats; the rest just sits there,
 * so fifty platforms don't mean fifty running animations. */
const ANIMATED_LEVELS = 9;

type Launch = { launching: boolean; onLaunch: () => void };

const LIVE_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** The live slab: `Path_SM` plays on load and its `activate` trigger fires
 * once, so the platform builds itself. It keeps animating after a tap too,
 * while Hex jumps onto it. */
function LivePlatform({ cx, cy, onLaunch }: { cx: number; cy: number } & Launch) {
  const { rive, RiveComponent } = useRive({
    src: LIVE_PLATFORM.src,
    artboard: LIVE_PLATFORM.artboard,
    stateMachines: LIVE_PLATFORM.stateMachine,
    autoplay: true,
    layout: LIVE_LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;
    const instance = rive.viewModelByName(LIVE_PLATFORM.viewModel)?.defaultInstance();
    if (!instance) return;
    rive.bindViewModelInstance(instance);
    instance.trigger(LIVE_PLATFORM.activateTrigger)?.trigger();
  }, [rive]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: cx - LIVE_RIV.ax * LIVE_RIV_SCALE,
          top: cy - LIVE_RIV.ay * LIVE_RIV_SCALE,
          width: LIVE_PLATFORM.width * LIVE_RIV_SCALE,
          height: LIVE_PLATFORM.height * LIVE_RIV_SCALE,
        }}
      >
        <RiveComponent className="h-full w-full" />
      </div>
      <button
        type="button"
        onClick={onLaunch}
        aria-label="Start level"
        className="absolute"
        style={{ left: cx - 50, top: cy - 32, width: 100, height: 64 }}
      />
    </>
  );
}

function PlatformArt({ spec, launch }: { spec: PlatformSpec; launch: Launch }) {
  const { state, big, cx, cy } = spec;
  if (state === "current") {
    // The platform under Hex: the live slab with its rippling rings.
    return <LivePlatform cx={cx} cy={cy} {...launch} />;
  }
  const art = state === "done" ? ART.unlocked[big ? "big" : "small"] : ART.locked.small;
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
    </>
  );
}

function PlatformNode({ spec, launch }: { spec: PlatformSpec; launch: Launch }) {
  const { level } = spec;
  if (level > ANIMATED_LEVELS) return <PlatformArt spec={spec} launch={launch} />;
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
        <PlatformArt spec={spec} launch={launch} />
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

const LESSONS_PER_MODULE = 7;
const MODULES = [
  { id: "m1", title: "Module 1 Programming Mindset", base: 2 },
  { id: "m2", title: "Module 2 Variables & Data Types", base: 0 },
  { id: "m3", title: "Module 3 Control Flow", base: 0 },
] as const;

const CARD_X = 16;
const CARD_W = 357;
const CARD_FULL_H = 158;
const CARD_COMPACT_H = 78;
const CARD_TOP_Y = 62;
/** How far each card queued behind the front one peeks out (px), and how
 * much narrower it is, so the stack reads as a pile. */
const STACK_PEEK = 10;
const STACK_SHRINK = 0.03;
const STACK_VISIBLE = 2;
/** The finished pile rests just above the bottom nav (nav top is 96px up). */
const NAV_CLEARANCE = 96 + 8;

type CardPlace = { y: number; scale: number; height: number; opacity: number; zIndex: number };

/** Where module `index` sits when `done` modules are finished: the current
 * one on top, the ones still to come queued behind it, the finished ones
 * piled above the nav (the latest finished in front). */
const cardPlace = (index: number, done: number, viewH: number): CardPlace => {
  if (index >= done) {
    const queued = index - done;
    const depth = Math.min(queued, STACK_VISIBLE);
    return {
      y: CARD_TOP_Y + STACK_PEEK * depth,
      scale: 1 - STACK_SHRINK * depth,
      height: CARD_FULL_H,
      opacity: queued > STACK_VISIBLE ? 0 : 1,
      zIndex: 30 - queued,
    };
  }
  const rank = done - 1 - index;
  const depth = Math.min(rank, STACK_VISIBLE);
  return {
    y: viewH - NAV_CLEARANCE - CARD_COMPACT_H - STACK_PEEK * depth,
    scale: 1 - STACK_SHRINK * depth,
    height: CARD_COMPACT_H,
    opacity: rank > STACK_VISIBLE ? 0 : 1,
    zIndex: 20 - rank,
  };
};

const SPRING = { type: "spring", stiffness: 300, damping: 32, mass: 0.9 } as const;

/** One module's card. Full size while it is the current module, compact once
 * finished; both layouts stay mounted and cross-fade as the card travels. */
function ModuleCard({
  title,
  progress,
  place,
  compact,
}: {
  title: string;
  progress: number;
  place: CardPlace;
  compact: boolean;
}) {
  const fill = (progress / LESSONS_PER_MODULE) * 128;
  const fade = { duration: 0.2 };
  return (
    <motion.div
      className="absolute top-0 box-border overflow-hidden rounded-lg border-b-[6px] border-[#BDBA99] bg-gradient-to-b from-white from-[30.82%] to-[#DCD5FE] shadow-[1px_1px_7.3px_1px_rgba(0,0,0,0.25)] dark:border-[#3a4a45] dark:from-[#1c2e36] dark:to-[#2b2a57]"
      style={{ left: CARD_X, width: CARD_W, transformOrigin: "50% 0%", zIndex: place.zIndex }}
      initial={false}
      animate={{ y: place.y, scale: place.scale, height: place.height, opacity: place.opacity }}
      transition={{ ...SPRING, opacity: { duration: 0.25 } }}
    >
      {/* Full */}
      <motion.div
        className="absolute inset-0 flex items-center gap-2.5 p-[18px]"
        animate={{ opacity: compact ? 0 : 1 }}
        transition={fade}
      >
        <div className="flex h-[116px] w-[229px] shrink-0 flex-col gap-2.5">
          <div className="flex h-[30px] items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
              <Code2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <span className="text-xs font-medium uppercase leading-[18px] text-[#666666] dark:text-white/60">
              Python Programming
            </span>
          </div>
          <h1 className="text-xl font-semibold leading-[1.2] text-[#1A1C22] dark:text-white">{title}</h1>
          <div className="flex h-[18px] items-center">
            <span className="w-[101px] shrink-0 text-xs font-medium leading-[18px]">
              {progress}/{LESSONS_PER_MODULE} completed
            </span>
            <span className="relative h-2 w-32 overflow-hidden rounded-full bg-black/8 dark:bg-white/15">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-[#5D4CFE]"
                initial={false}
                animate={{ width: fill }}
                transition={{ duration: 0.6, ease: EASE }}
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

      {/* Compact */}
      <motion.div
        className="absolute inset-0 flex items-center gap-2.5 px-[18px]"
        animate={{ opacity: compact ? 1 : 0 }}
        transition={fade}
        aria-hidden={!compact}
      >
        <div className="flex w-[229px] shrink-0 flex-col gap-2">
          <div className="flex h-6 items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
              <Code2 className="h-[14px] w-[14px]" strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-medium uppercase leading-[18px] text-[#666666] dark:text-white/60">
              Python Programming
            </span>
          </div>
          <div className="flex h-[18px] items-center">
            <span className="w-[101px] shrink-0 text-xs font-medium leading-[18px]">
              {progress}/{LESSONS_PER_MODULE} completed
            </span>
            <span className="relative h-2 w-32 overflow-hidden rounded-full bg-black/8 dark:bg-white/15">
              <span className="absolute inset-y-0 left-0 rounded-full bg-[#5D4CFE]" style={{ width: fill }} />
            </span>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/python-logo.png"
          alt=""
          draggable={false}
          className="ml-auto h-[64px] w-[72px] max-w-none select-none object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

/** Temporary: step the learner through the modules (mark the current one
 * complete / take the last one back) to try the card stack. */
function ProgressDebug({
  done,
  onComplete,
  onUndo,
}: {
  done: number;
  onComplete: () => void;
  onUndo: () => void;
}) {
  const btn = "h-7 px-1.5 text-[10px] font-semibold leading-none transition-opacity disabled:opacity-35";
  return (
    <div className="pointer-events-auto absolute left-[84px] top-[18px] flex overflow-hidden rounded-full border border-black/8 bg-white/60 text-[#5D4CFE] dark:border-white/10 dark:bg-white/5 dark:text-[#A99FFF]">
      <button type="button" className={btn} onClick={onComplete} disabled={done >= MODULES.length}>
        Done
      </button>
      <span className="w-px bg-black/10 dark:bg-white/15" />
      <button type="button" className={btn} onClick={onUndo} disabled={done <= 0}>
        Undo
      </button>
    </div>
  );
}

function StatChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-9 items-center gap-1.5 rounded-lg border border-black/8 bg-white/60 px-3 dark:border-white/10 dark:bg-white/5 ${className ?? ""}`}
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

/** The wipe colours: each theme's page background (see the screen's gradient). */
const THEME_WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

/** Light/dark switch, top centre between the streak and gem chips. */
function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <motion.button
      type="button"
      onClick={() => toggleTheme(THEME_WIPE)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="pointer-events-auto absolute left-1/2 top-[14px] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-black/8 bg-white/60 text-[#1A1C22]/70 transition-transform active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-amber-400"
      {...reveal(0)}
    >
      {dark ? (
        <Sun key="sun" className="h-5 w-5 animate-[spinIn_0.45s_cubic-bezier(0.4,0,0.2,1)]" />
      ) : (
        <Moon key="moon" className="h-5 w-5 animate-[spinIn_0.45s_cubic-bezier(0.4,0,0.2,1)]" />
      )}
    </motion.button>
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
 * down to LEVEL_COUNT, which you scroll down to see) and the bottom nav. Laid out
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
  const [viewH, setViewH] = useState(STAGE_H);
  const [boxW, setBoxW] = useState(STAGE_W);
  const [done, setDone] = useState(0);
  const [launching, setLaunching] = useState(false);
  const startLevel = () => setLaunching(true);
  const launch: Launch = { launching, onLaunch: startLevel };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      const next = Math.min(width / STAGE_W, height / STAGE_H, MAX_SCALE);
      setScale(next);
      setViewH(height / next);
      setBoxW(width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      className={`${poppins.className} onboarding-light flex h-dvh w-full justify-center overflow-hidden bg-gradient-to-b from-[#F3F4F7] via-[#F3F4F7] to-[#F3F4F7] text-[#1A1C22] dark:from-[#0f1f26] dark:via-[#0f1f26] dark:to-[#0a171d] dark:text-white`}
    >
      <div ref={boxRef} className="relative h-full w-full">
        {/* The scrolling world: every level of the path. */}
        <div
          ref={scrollerRef}
          className="scrollbar-none absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div className="relative w-full" style={{ height: WORLD_H * scale }}>
            {/* Backdrop: faint isometric tiles, repeated down the whole path
                so it scrolls with it. It spans the full viewport width (not
                just the centred stage column), each tile keeping the stage's
                390:640 shape, so it fills tablets and desktops too. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-repeat-y [filter:brightness(0.95)] dark:[filter:invert(1)_hue-rotate(180deg)_brightness(2.5)] dark:mix-blend-screen"
              style={{
                backgroundImage: "url(/images/level-bg.png)",
                backgroundSize: `${boxW}px ${(boxW * BG_TILE_H) / STAGE_W}px`,
              }}
            />
            <div
              className="relative mx-auto"
              style={{ width: STAGE_W * scale, height: WORLD_H * scale }}
            >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: STAGE_W, height: WORLD_H, transform: `scale(${scale})` }}
            >
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

              {PLATFORMS.map((spec) => (
                <PlatformNode key={spec.id} spec={spec} launch={launch} />
              ))}

              {/* Hex stands beside the live platform, on the side with more
                room: platform on the right -> Hex on the left, and back. */}
              <motion.button
                type="button"
                onClick={startLevel}
                aria-label="Start level"
                className="absolute"
                style={{ left: CURRENT.x + HEX_SIDE * HEX_OFFSET_X - 55, top: CURRENT.y - 55, width: 110, height: 110 }}
                animate={
                  launching
                    ? { x: -HEX_SIDE * HEX_OFFSET_X, y: [0, -HOP_HEIGHT, -HEX_PERCH] }
                    : { x: 0, y: 0 }
                }
                transition={
                  launching
                    ? {
                        x: { duration: HOP_S, ease: "easeInOut" },
                        y: { duration: HOP_S, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] },
                      }
                    : { duration: 0 }
                }
                onAnimationComplete={() => launching && onStart?.()}
              >
                <HomeHex />
              </motion.button>
            </div>
            </div>
          </div>
        </div>

        {/* Header + module card: pinned to the top of the screen, over the
          path. The fade lets the scrolling path slide under them. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-transparent to-transparent dark:from-[#0f1f26] dark:from-[90%]"
          style={{ height: 246 * scale }}
        >
          {/* Streak + gems: pinned to the screen's own left and right edges
            (not the centred stage column), each chip scaled with the layout. */}
          <motion.div
            className="pointer-events-auto absolute inset-x-0 flex items-center justify-between"
            style={{ top: 14 * scale, paddingInline: 16 * scale }}
            {...reveal(0)}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}>
              <StatChip>
                <FlameIcon />
                <span className="text-base font-semibold leading-[1.4] text-[#FF8D42]">4</span>
              </StatChip>
            </div>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "right center" }}>
              <StatChip>
                <GemIcon />
                <span className="text-base font-semibold leading-[1.4] text-[#3683D3]">373</span>
              </StatChip>
            </div>
          </motion.div>

          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{ width: STAGE_W, height: 246, transform: `translateX(-50%) scale(${scale})` }}
          >
          {/* After the stats row, so it sits on top */}
          <ThemeSwitch />
          <ProgressDebug
            done={done}
            onComplete={() => setDone((d) => Math.min(d + 1, MODULES.length))}
            onUndo={() => setDone((d) => Math.max(d - 1, 0))}
          />

          </div>
        </div>

        {/* The module cards: the current one on top with the next ones queued
          behind it; finished ones drop into a pile above the nav. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{ width: STAGE_W, height: viewH, transform: `translateX(-50%) scale(${scale})` }}
          >
            {MODULES.map((m, i) => (
              <ModuleCard
                key={m.id}
                title={m.title}
                progress={i < done ? LESSONS_PER_MODULE : m.base}
                place={cardPlace(i, done, viewH)}
                compact={i < done}
              />
            ))}
          </div>
        </div>

        {/* Mobile nav: pinned to the bottom of the screen. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-transparent to-transparent dark:from-[#0a171d] dark:from-[35%]"
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
