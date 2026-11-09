"use client";

import { batteryCount, useBattery } from "@/components/home/batteryStore";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { Artboard } from "../artboard/Artboard";
import { ARTBOARDS } from "../artboard/presets";

/** The count's colour by what is left: green when full, yellow halfway, red when nearly empty. */
const FULL = [0x1e, 0xa0, 0x1b] as const;
const HALF = [0xea, 0xb9, 0x11] as const;
const LOW = [0xfc, 0x47, 0x1c] as const;

const countColor = (level: number) => {
  const t = Math.max(0, Math.min(100, level)) / 50;
  const [from, to, mix] = t >= 1 ? [HALF, FULL, t - 1] : [LOW, HALF, t];
  return `rgb(${from.map((channel, i) => Math.round(channel + (to[i] - channel) * mix)).join(" ")})`;
};

export type BatteryMeterProps = {
  /**
   * The lesson screen this is on. Arriving at a screen that has not been paid for yet
   * spends its share of the battery. Leave it out where the battery is only shown.
   */
  chargeForStep?: number;
  /** Shows this fill (0-100) instead of the learner's own. */
  level?: number;
  /** Hides the number beside the battery. */
  hideCount?: boolean;
  /**
   * `true` (default): the session's one battery, which spends and sparkles as the lesson goes; only
   * one can be on a page. `false`: a battery of its own that just shows `level`.
   */
  persistent?: boolean;
  className?: string;
};

/** The learner's battery (a Rive artboard) with what is left of it written beside it. */
export function BatteryMeter({ chargeForStep, level, hideCount = false, persistent = true, className = "" }: BatteryMeterProps) {
  const battery = useBattery();
  const shown = level ?? battery.level;
  return (
    <span className={`flex h-[25px] shrink-0 items-center gap-1 ${className}`}>
      {persistent ? (
        <PersistentBattery step={chargeForStep} level={level} className="w-[40px]" />
      ) : (
        <Artboard {...ARTBOARDS.battery} properties={{ level: shown, unlimited: battery.unlimited }} className="w-[40px]" label="Battery" />
      )}
      {!hideCount && (
        <span
          style={{ color: countColor(battery.unlimited ? 100 : shown) }}
          className={`min-w-[26px] font-semibold tabular-nums transition-colors duration-500 ${battery.unlimited ? "text-[28px] leading-[28px]" : "text-[20px] leading-[24px]"}`}
        >
          {batteryCount({ ...battery, level: shown })}
        </span>
      )}
    </span>
  );
}
