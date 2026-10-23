import { useSyncExternalStore } from "react";
import { LEARNER_STATS } from "./learnerStats";

const { current, max } = LEARNER_STATS.battery;

/** The fill (0-100) the learner starts with: 18 of 20. */
export const BATTERY_START = (current / max) * 100;

/** What is left once the lesson's last screen has been reached. */
export const BATTERY_AFTER_LESSON = 10;

/** The screens that spend battery: Level 1's numbered screens, 1-8. */
const LESSON_SCREENS = 8;

/** Opening the module's first screen starts it over: the battery is refilled. */
const FIRST_SCREEN = 1;

/** Every screen spends the same share, so the last one lands on `BATTERY_AFTER_LESSON`. */
const COST_PER_SCREEN = (BATTERY_START - BATTERY_AFTER_LESSON) / LESSON_SCREENS;

export type BatteryState = {
  /** The fill, 0-100. */
  level: number;
  /** Spends nothing, and the battery shows the infinity sign. */
  unlimited: boolean;
  /** The furthest screen that has been paid for, so Back and forward never charge twice. */
  charged: number;
};

const FRESH: BatteryState = { level: BATTERY_START, unlimited: false, charged: 0 };

const STORAGE_KEY = "lingo.battery";

const isBatteryState = (value: unknown): value is BatteryState =>
  typeof value === "object" &&
  value !== null &&
  "level" in value &&
  typeof value.level === "number" &&
  "unlimited" in value &&
  typeof value.unlimited === "boolean" &&
  "charged" in value &&
  typeof value.charged === "number";

const restore = (): BatteryState => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (isBatteryState(saved)) return saved;
  } catch {
    // Storage blocked or corrupt: the battery just lasts for this page.
  }
  return FRESH;
};

// Lives outside React so it survives each screen remounting its header, and
// in sessionStorage so it survives a reload. Read on first use in the browser,
// so the server and the first client render both start from `FRESH`.
let state = FRESH;
let restored = false;
const listeners = new Set<() => void>();

const read = (): BatteryState => {
  if (!restored && typeof window !== "undefined") {
    restored = true;
    state = restore();
  }
  return state;
};

const write = (next: BatteryState) => {
  state = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same as `restore`.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The learner's battery, shared by every screen that shows it. */
export const useBattery = (): BatteryState => useSyncExternalStore(subscribe, read, () => FRESH);

/** "14/20", or the infinity sign when unlimited. */
export const batteryLabel = ({ level, unlimited }: BatteryState) =>
  unlimited ? "∞" : `${Math.round((level / 100) * max)}/${max}`;

/**
 * The learner is on lesson screen `step`: each screen not yet paid for spends
 * its share. Returns whether any battery was spent, so the caller can flash it.
 * While the battery is unlimited the screens still count as paid for.
 * Reaching the first screen (starting or restarting the module) refills the
 * battery first, so every run spends the same 90% down to 10%.
 */
export const chargeBatteryScreen = (step: number): boolean => {
  const saved = read();
  const before = step === FIRST_SCREEN ? { ...saved, level: BATTERY_START, charged: 0 } : saved;
  if (step <= before.charged) return false;
  const spends = !before.unlimited;
  const level = spends ? Math.max(0, before.level - (step - before.charged) * COST_PER_SCREEN) : before.level;
  write({ ...before, level, charged: step });
  return spends;
};

/** Whole battery units (of `max`) added to the fill, capped at full. */
export const addBatteryUnits = (units: number) => {
  const saved = read();
  write({ ...saved, level: Math.min(100, saved.level + (units / max) * 100) });
};

export const refillBattery = () => write({ ...read(), level: 100 });

export const setBatteryUnlimited =(unlimited: boolean) => write({ ...read(), unlimited });
