"use client";

import type { ReactNode } from "react";
import { BatteryMenu } from "@/components/onboarding/BatteryMenu";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { batteryCount, batteryLabel, useBattery } from "./batteryStore";
import { TOP_MARGIN } from "./HomeStage";
import { LEARNER_STATS } from "./learnerStats";

/** One stat in the home's row: its artwork and the number beside it. */
function StatItem({
  children,
  value,
  label,
  color,
  darkColor,
}: {
  children: ReactNode;
  value: string;
  /** Read out with the value, e.g. "55 day streak". */
  label: string;
  color: string;
  /** The value's colour in dark mode. */
  darkColor: string;
}) {
  return (
    <div className="flex h-9 items-center gap-1.5">
      <span aria-hidden className="flex h-7 items-center justify-center">
        {children}
      </span>
      <span
        className="text-lg font-semibold leading-none dark:text-(--dark-color)!"
        style={{ color, "--dark-color": darkColor } as React.CSSProperties}
      >
        {value}
        <span className="sr-only"> {label}</span>
      </span>
    </div>
  );
}

const statImg = (src: string, className: string) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt="" draggable={false} className={`select-none object-contain ${className}`} />
);

/** The four stats in one row: streak, gems, hints and the battery (its Rive
 * artboard). Tapping the battery opens the same hidden dev panel as the
 * Level 1 header. */
export function HomeStats() {
  const battery = useBattery();
  return (
    <div className="flex items-center justify-between font-sans">
      <StatItem value={String(LEARNER_STATS.streak)} label="day streak" color="#FF8D42" darkColor="#FF8D42">
        {statImg("/images/streak.png", "h-6 w-auto")}
      </StatItem>
      <StatItem value={String(LEARNER_STATS.gems)} label="gems" color="#7B5CF0" darkColor="#A48BFF">
        {statImg("/images/gem.png", "h-6 w-6")}
      </StatItem>
      <StatItem value={String(LEARNER_STATS.hints)} label="hints" color="#F2A900" darkColor="#FFC93C">
        {statImg("/images/idea.png", "h-6 w-auto")}
      </StatItem>
      <BatteryMenu className="relative" buttonClassName="block text-left">
        <StatItem value={batteryCount(battery)} label="battery" color="#01A17F" darkColor="#01A17F">
          <PersistentBattery className="w-9" />
        </StatItem>
      </BatteryMenu>
    </div>
  );
}

/** A small stat chip: icon and value, as tall as the level map's menu button. */
function MiniStat({ children, value, color, darkColor }: { children: ReactNode; value: string; color: string; darkColor: string }) {
  return (
    <div className="flex h-9 items-center gap-1.5 rounded-lg border border-black/8 bg-white px-3 dark:border-white/12 dark:bg-[#1A1C22]">
      {children}
      <span
        className="text-base font-semibold leading-[1.4] dark:text-(--dark-color)!"
        style={{ color, "--dark-color": darkColor } as React.CSSProperties}
      >
        {value}
      </span>
    </div>
  );
}

/** The level map's stats, as small chips: gems and battery (the rest is in
 * its menu). Tapping the battery opens the hidden dev panel. */
export function LevelStats({ className = "" }: { className?: string }) {
  const battery = useBattery();
  return (
    <div className={`flex items-center gap-2 font-sans ${className}`}>
      <MiniStat value={String(LEARNER_STATS.gems)} color="#2F80ED" darkColor="#5AA2FF">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/stats/gem.png" alt="Gems" draggable={false} className="h-[20px] w-[20px] select-none object-contain" />
      </MiniStat>
      <BatteryMenu className="relative" buttonClassName="block text-left">
        <MiniStat value={batteryLabel(battery)} color="#01A17F" darkColor="#01A17F">
          <PersistentBattery className="w-9" />
        </MiniStat>
      </BatteryMenu>
    </div>
  );
}

/**
 * The stats, pinned TOP_MARGIN from the top. It belongs to HomeShell, so it stays
 * exactly where it is as the tabs change under it (the home itself shows them
 * inline, under the greeting).
 */
export function HomeTopBar() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 mx-auto w-full max-w-[430px] px-4"
      style={{ top: TOP_MARGIN }}
    >
      <div className="pointer-events-auto">
        <HomeStats />
      </div>
    </div>
  );
}
