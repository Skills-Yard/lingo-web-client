import type { PlatformSpec, Point, Side } from "./types";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";

export const STAGE_W = 390;
export const STAGE_H = 844;
export const MAX_SCALE = 1.5;

export const EASE = [0.22, 1, 0.36, 1] as const;

export const LEVEL_COUNT = 100;
export const FIRST_MODULE_LEVEL = 3;

export const FIGMA_PATH = [
  { x: 82, y: 0 },
  { x: 189, y: 59 },
  { x: 267, y: 153 },
  { x: 316, y: 267 },
  { x: 259, y: 333 },
  { x: 194, y: 387 },
  { x: 70, y: 431 },
] as const;

export const TAIL_X = [189, 267, 316, 259, 194, 82] as const;
export const TAIL_MIN_DY = 60;
export const TAIL_STEP = 25;

export const tailGap = (level: number) =>
  TAIL_MIN_DY + TAIL_STEP * ((Math.imul(level, 2654435761) >>> 11) % 5);

export const FIRST_LEVEL_Y = 287;
export const WORLD_BOTTOM_PAD = 120;

export const LEVEL_POINTS: Point[] = (() => {
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

export const WORLD_H = LEVEL_POINTS[LEVEL_COUNT - 1].y + WORLD_BOTTOM_PAD;

export const levelCenter = (level: number): Point => LEVEL_POINTS[level - 1];

export const PLATFORMS: PlatformSpec[] = Array.from({ length: LEVEL_COUNT }, (_, n) => {
  const level = n + 1;
  const { x, y } = levelCenter(level);
  return {
    id: `l${level}`,
    level,
    cx: x,
    cy: y,
  };
});

export const CENTERS = Array.from({ length: LEVEL_COUNT }, (_, n) => levelCenter(n + 1));

export const curveBetween = (from: number, to: number): string => {
  const first = levelCenter(from);
  let d = `M${first.x} ${first.y}`;
  for (let i = from - 1; i < to - 1; i++) {
    const p0 = CENTERS[Math.max(i - 1, 0)];
    const p1 = CENTERS[i];
    const p = CENTERS[i + 1];
    const p3 = CENTERS[Math.min(i + 2, CENTERS.length - 1)];
    const c1 = { x: p1.x + (p.x - p0.x) / 6, y: p1.y + (p.y - p0.y) / 6 };
    const c2 = { x: p.x - (p3.x - p1.x) / 6, y: p.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`;
  }
  return d;
};

export const sideOf = (level: number): Side => (levelCenter(level).x < STAGE_W / 2 ? "left" : "right");

export const pathStateOf = (level: number, current: number): number =>
  level < current ? 1 : level === current ? (sideOf(level) === "left" ? 3 : 2) : 0;

export const moveTriggers = (from: number, to: number) =>
  levelCenter(to).x >= levelCenter(from).x
    ? { exit: HEX_ONBOARDING_TRIGGER.exitRight, enter: "enterLeft" }
    : { exit: HEX_ONBOARDING_TRIGGER.exitLeft, enter: "enterRight" };

export const MOVE_ON_DELAY_MS = 1800;
export const START_LESSON_MS = 1000;
export const HOP_S = 0.42;

export const MODULE_LESSONS = [
  { title: "How Programmers Think", xp: 50 },
  { title: "Sequence", xp: 50 },
  { title: "Variables", xp: 50 },
  { title: "Data Types", xp: 50 },
] as const;

export const COMING_SOON = { title: "Coming soon", xp: 0 } as const;

