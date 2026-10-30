import { useSyncExternalStore } from "react";
import { LEARNER_STATS } from "./learnerStats";

const { current, max } = LEARNER_STATS.battery;

/** The fill (0-100) the learner starts with: 18 of 20. */
export const BATTERY_START = (current / max) * 100;

/** What recharging the battery costs, in gems. */
export const RECHARGE_COST = 350;

/** Opening the module's first screen starts it over: every screen is charged again. */
const FIRST_SCREEN = 1;

/** Every screen spends one unit of the battery. */
const COST_PER_SCREEN = 100 / max;

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

const unitsLeft = (level: number) => Math.round((level / 100) * max);

/** "14/20", or the infinity sign when unlimited. */
export const batteryLabel = ({ level, unlimited }: BatteryState) =>
  unlimited ? "∞" : `${unitsLeft(level)}/${max}`;

/** What is left, "14", or the infinity sign when unlimited. */
export const batteryCount = ({ level, unlimited }: BatteryState) =>
  unlimited ? "∞" : String(unitsLeft(level));

/** Nothing left to spend: the learner can't go on until it is recharged. */
export const batteryEmpty = ({ level, unlimited }: BatteryState) => !unlimited && unitsLeft(level) === 0;

/**
 * The learner is on lesson screen `step`: each screen not yet paid for spends
 * one unit. Returns whether any battery was spent, so the caller can flash it.
 * While the battery is unlimited the screens still count as paid for.
 * Reaching the first screen (starting or restarting the module) makes every
 * screen payable again; the battery itself carries over from the last run.
 * Coming back to the first screen while it is already the one being shown
 * (from `/energy`, or a reload) is not a restart: nothing is reset or spent.
 */
export const chargeBatteryScreen = (step: number): boolean => {
  const saved = read();
  const restarts = step === FIRST_SCREEN && saved.charged !== FIRST_SCREEN;
  const before = restarts ? { ...saved, charged: 0 } : saved;
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

/** Sets the battery to exactly `units` (of `max`) and ends unlimited — for testing what happens as it runs out. */
export const setBatteryUnits = (units: number) =>
  write({ ...read(), level: Math.max(0, Math.min(100, (units / max) * 100)), unlimited: false });

export const setBatteryUnlimited =(unlimited: boolean) => write({ ...read(), unlimited });
