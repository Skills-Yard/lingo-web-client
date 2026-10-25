"use client";

import type { ReactNode } from "react";
import { BatteryMenu } from "@/components/onboarding/BatteryMenu";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { batteryLabel, useBattery } from "./batteryStore";
import { TOP_MARGIN } from "./HomeStage";
import { LEARNER_STATS } from "./learnerStats";

function StatCard({
  icon,
  art,
  tint,
  darkTint,
  value,
  label,
  color,
  darkColor,
  className = "",
}: {
  /** An image under public/images/stats. */
  icon?: string;
  /** Drawn in the icon's place (the battery). */
  art?: ReactNode;
  /** The square behind the icon. */
  tint: string;
  /** The same square, in dark mode. */
  darkTint: string;
  value: string;
  label: string;
  color: string;
  /** The value's colour in dark mode. */
  darkColor: string;
  className?: string;
}) {
  return (
    // The card is a size container, so the icon and text shrink with its width
    // (cqw) instead of spilling out of it on a narrow screen.
    <div className={`@container h-14 min-w-0 overflow-hidden rounded-[12px] border border-black/10 bg-white dark:border-white/12 dark:bg-[#1A1C22] ${className}`}>
      <div className="flex h-full items-center justify-center gap-[4cqw] px-[5cqw]">
        <span className="flex shrink-0 items-center justify-center">
          {art ?? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" draggable={false} className="h-auto w-[clamp(18px,22cqw,32px)] select-none object-contain" />
          )}
        </span>
        <span className="flex flex-col whitespace-nowrap">
          <span className="text-[clamp(12px,13.5cqw,16px)] font-semibold leading-tight text-[#2C2C2C] dark:text-white">{value}</span>
          <span className="text-[clamp(9px,9.5cqw,11px)] leading-tight text-[#818185] dark:text-[#9FA19F]">{label}</span>
        </span>
      </div>
    </div>
  );
}

/** The battery card: `battery.riv` for the icon and the live level for the
 * number. Tapping it opens the same hidden dev panel as the Level 1 header. */
function BatteryStatCard() {
  const battery = useBattery();
  return (
    <BatteryMenu className="relative min-w-0" buttonClassName="block w-full text-left">
      <StatCard
        art={<PersistentBattery className="w-[clamp(24px,28cqw,36px)]" />}
        tint="#E9F5F0"
        darkTint="#133A35"
        value={batteryLabel(battery)}
        label="battery"
        color="#01A17F"
        darkColor="#01A17F"
        className="w-full"
      />
    </BatteryMenu>
  );
}

/** The three stat cards: streak, gems, battery. */
export function HomeStats() {
  return (
    // A grid, so the three columns stay equal whatever wraps the cards.
    <div className="grid grid-cols-3 gap-2 font-[family-name:var(--font-app-poppins)]">
      <StatCard icon="/images/streak.png" tint="#FFF3DE" darkTint="#3A2A1A" value={String(LEARNER_STATS.streak)} label="day streak" color="#FF8D42" darkColor="#FF8D42" />
      <StatCard icon="/images/gem.png" tint="#E5EFFD" darkTint="#1B2B40" value={String(LEARNER_STATS.gems)} label="gems" color="#2F80ED" darkColor="#5AA2FF" />
      <BatteryStatCard />
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
    <div className={`flex items-center gap-2 font-[family-name:var(--font-app-poppins)] ${className}`}>
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
