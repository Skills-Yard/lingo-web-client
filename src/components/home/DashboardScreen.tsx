"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Code, Flame, Gem, Monitor, Settings, Trophy } from "lucide-react";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { batteryCount, useBattery } from "./batteryStore";
import { TOP_MARGIN } from "./HomeStage";
import { HEADING } from "./homeFonts";
import { LEARNER_STATS } from "./learnerStats";

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = "var(--h-ink)";
const MUTED = "var(--h-muted)";

/** Room under the page for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

const PROFILE = { joined: 2026 } as const;
const LEAGUE = { rank: 4, of: 30 } as const;
const REPORT = { weekXp: 640 } as const;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

const img = (src: string, className: string, alt = "") => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} draggable={false} className={`select-none object-contain ${className}`} />
);

/** One pastel tile: artwork, the number in the stat's colour, and its name. */
function StatTile({
  icon,
  value,
  label,
  color,
  className,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  color: string;
  /** The tile's pastel, light and dark. */
  className: string;
}) {
  return (
    <div className={`flex h-[104px] min-w-0 flex-1 flex-col items-center justify-center rounded-[14px] ${className}`}>
      <span aria-hidden className="flex h-8 items-center justify-center">
        {icon}
      </span>
      <span className={`mt-1 text-lg leading-6 ${HEADING}`} style={{ color }}>
        {value}
      </span>
      <span className="text-xs leading-4" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  );
}

/** A row with the star badge, a title and a chevron. */
function StarCard({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-black/10 bg-white px-3 py-3.5 text-left transition-transform active:scale-[0.99] dark:border-white/12 dark:bg-[#1A1C22]"
    >
      {img("/images/star-das.png", "h-8 w-[30px] shrink-0")}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-[22px]" style={{ color: INK }}>
        {title}
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0" style={{ color: MUTED }} strokeWidth={1.8} />
    </button>
  );
}

type Achievement = { id: string; icon: ReactNode; fill: string; edge: string };

const ACHIEVEMENT_ICON = "h-7 w-7 text-white";

const ACHIEVEMENTS: readonly Achievement[] = [
  { id: "first-program", icon: <Monitor className={ACHIEVEMENT_ICON} strokeWidth={2.2} />, fill: "#5FD8C4", edge: "#B8F0E6" },
  { id: "javascript", icon: <span className={`text-lg text-white ${HEADING}`}>JS</span>, fill: "#FFC94D", edge: "#FFE9A8" },
  { id: "code", icon: <Code className={ACHIEVEMENT_ICON} strokeWidth={2.4} />, fill: "#B794F6", edge: "#E2D3FC" },
  { id: "on-fire", icon: <Flame className={ACHIEVEMENT_ICON} strokeWidth={2.2} />, fill: "#4FD1A5", edge: "#B5EFD9" },
  { id: "champion", icon: <Trophy className={ACHIEVEMENT_ICON} strokeWidth={2.2} />, fill: "#FF9F6B", edge: "#FFD5BD" },
];

const HEXAGON = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

/** A hexagonal badge: a pale rim around the badge's colour. */
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <span
      className="flex h-[78px] w-[68px] shrink-0 items-center justify-center"
      style={{ clipPath: HEXAGON, backgroundColor: achievement.edge }}
    >
      <span
        className="flex h-[64px] w-[56px] items-center justify-center"
        style={{ clipPath: HEXAGON, backgroundColor: achievement.fill }}
      >
        {achievement.icon}
      </span>
    </span>
  );
}

/**
 * The dashboard tab: who the learner is, their streak, gems and battery, the
 * league and weekly report, the Lingo Plus offer and the achievements, above
 * the shared bottom nav. It has its own header, so the shared top bar is not
 * shown here.
 */
export function DashboardScreen({ name = "Alex" }: { name?: string }) {
  const router = useRouter();
  const battery = useBattery();
  return (
    <main
      style={{ top: TOP_MARGIN }}
      className="font-[family-name:var(--font-app-poppins)] scrollbar-none absolute inset-x-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C] dark:bg-[#0F1F26] dark:text-white"
    >
      <div className="mx-auto w-full max-w-[430px] px-4" style={{ paddingBottom: NAV_CLEARANCE }}>
        <motion.header {...reveal(0)} className="flex items-center gap-3">
          {img("/images/home/profile-avatar.png", "h-14 w-14 shrink-0 rounded-full object-cover", "Profile")}
          <div className="min-w-0 flex-1">
            <h1 className={`truncate text-xl leading-7 ${HEADING}`}>{name}</h1>
            <span className="mt-0.5 inline-block rounded-full bg-[#DDF7EE] px-2.5 py-0.5 text-[11px] font-medium leading-4 text-[#01A17F] dark:bg-[#123A30]">
              Joined {PROFILE.joined}
            </span>
          </div>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => router.push("/profile")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <Settings className="h-6 w-6" style={{ color: INK }} strokeWidth={1.8} />
          </button>
        </motion.header>

        <motion.div {...reveal(0.06)} className="mt-5 flex gap-2.5">
          <StatTile
            icon={img("/images/streak.png", "h-7 w-auto")}
            value={String(LEARNER_STATS.streak)}
            label="Streak"
            color="#FF8D42"
            className="bg-[#FFF1E6] dark:bg-[#2E2219]"
          />
          <StatTile
            icon={img("/images/gem.png", "h-7 w-7")}
            value={String(LEARNER_STATS.gems)}
            label="Gems"
            color="#7B5CF0"
            className="bg-[#F0EEFF] dark:bg-[#231F38]"
          />
          <StatTile
            icon={<PersistentBattery className="w-10" />}
            value={batteryCount(battery)}
            label="Battery"
            color="#01A17F"
            className="bg-[#E6F7F1] dark:bg-[#132E27]"
          />
        </motion.div>

        <motion.div {...reveal(0.12)} className="mt-4 flex flex-col gap-3">
          <StarCard title={`Weekly league · #${LEAGUE.rank} of ${LEAGUE.of}`} onClick={() => router.push("/league")} />
          <StarCard title={`Reports · this week ${REPORT.weekXp} XP`} />
        </motion.div>

        <motion.section
          {...reveal(0.18)}
          className="relative mt-4 aspect-[358/168] w-full overflow-hidden rounded-[18px] bg-cover bg-center"
          style={{ backgroundImage: "url(/images/battery-bg.png)" }}
        >
          <div className="relative z-10 flex h-full w-[62%] flex-col items-start justify-center gap-1.5 pl-4">
            <h2 className={`text-[22px] leading-7 tracking-[-0.2px] text-[#14123A] ${HEADING}`}>Lingo Plus</h2>
            <p className="text-[13px] font-medium leading-[18px] text-white">
              Unlimited battery, 5 hint keys a day, full reports.
            </p>
            <button
              type="button"
              className="mt-1.5 flex h-10 items-center gap-2 rounded-full bg-white px-4 shadow-[0_3px_8px_rgba(11,26,36,0.14)] transition-transform active:scale-95"
            >
              <Gem className="h-4 w-4 text-[#2C2C2C]" strokeWidth={2} />
              <span className={`whitespace-nowrap text-sm leading-5 text-[#2C2C2C] ${HEADING}`}>Try 7 days free</span>
            </button>
          </div>
          <motion.div
            aria-hidden
            className="absolute bottom-[6%] right-[2%] w-[40%]"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          >
            {img("/images/battery-icon.png", "w-full")}
          </motion.div>
        </motion.section>

        <motion.div {...reveal(0.24)} className="mt-6 flex items-center justify-between">
          <h2 className={`text-base leading-[22px] ${HEADING}`}>Achievements</h2>
          <button type="button" className="text-xs font-medium leading-4 text-[#01A17F]">
            View all
          </button>
        </motion.div>
        <motion.div {...reveal(0.28)} className="scrollbar-none -mx-4 mt-3 flex gap-4 overflow-x-auto px-4">
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </motion.div>
      </div>
    </main>
  );
}
