"use client";

import { LEARNER_STATS } from "./learnerStats";

function StatCard({
  icon,
  tint,
  darkTint,
  value,
  label,
  color,
  darkColor,
}: {
  /** An image under public/images/stats. */
  icon: string;
  /** The square behind the icon. */
  tint: string;
  /** The same square, in dark mode. */
  darkTint: string;
  value: string;
  label: string;
  color: string;
  /** The value's colour in dark mode. */
  darkColor: string;
}) {
  return (
    <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-black/8 bg-white px-3 dark:border-white/12 dark:bg-[#1A1C22]">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[8px] dark:bg-(--dark-tint)!"
        style={{ backgroundColor: tint, "--dark-tint": darkTint } as React.CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" draggable={false} className="h-[18px] w-[18px] select-none object-contain" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className="truncate text-[15px] font-semibold leading-[19px] dark:text-(--dark-color)!"
          style={{ color, "--dark-color": darkColor } as React.CSSProperties}
        >
          {value}
        </span>
        <span className="truncate text-[10px] leading-[13px] text-[#818185] dark:text-[#9FA19F]">{label}</span>
      </span>
    </div>
  );
}

/** The three stat cards: streak, gems, battery. */
export function HomeStats() {
  return (
    <div className="flex gap-2 font-[family-name:var(--font-app-poppins)]">
      <StatCard icon="/images/stats/flame.png" tint="#FFF3DE" darkTint="#3A2A1A" value={String(LEARNER_STATS.streak)} label="day streak" color="#FF8D42" darkColor="#FF8D42" />
      <StatCard icon="/images/stats/gem.png" tint="#E5EFFD" darkTint="#1B2B40" value={String(LEARNER_STATS.gems)} label="gems" color="#2F80ED" darkColor="#5AA2FF" />
      <StatCard icon="/images/stats/battery.png" tint="#E9F5F0" darkTint="#133A35" value={`${LEARNER_STATS.battery.current}/${LEARNER_STATS.battery.max}`} label="battery" color="#01A17F" darkColor="#01A17F" />
    </div>
  );
}

/**
 * The stats, pinned 54px from the top. It belongs to HomeShell, so it stays
 * exactly where it is as the tabs change under it (the home itself shows them
 * inline, under the greeting).
 */
export function HomeTopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[54px] z-10 mx-auto w-full max-w-[430px] px-4">
      <div className="pointer-events-auto">
        <HomeStats />
      </div>
    </div>
  );
}
