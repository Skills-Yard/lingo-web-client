"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChartNoAxesColumn, ChevronRight, Flame, Star } from "lucide-react";
import { GlossButton } from "./GlossButton";
import { HexAvatar } from "./HexAvatar";
import { TOP_BAR_BOTTOM } from "./HomeStage";
import { HEADING } from "./homeFonts";
import { LEARNER_STATS } from "./learnerStats";

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = "var(--h-ink)";
const MUTED = "var(--h-muted)";

/** Room under the page for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

const PROFILE = { level: 7, xp: "2,340", path: "Data Scientist" } as const;
const LEAGUE = { rank: 4, of: 30 } as const;
const REPORT = { weekXp: 640 } as const;
/** Trophies earned out of the four slots. */
const TROPHIES = { earned: 2, slots: 4 } as const;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

export type StatSpec = {
  id: string;
  label: string;
  value: ReactNode;
  background: string;
  shadow: string;
  /** The overline's colour; the value and icon use `accent`. */
  labelColor: string;
  accent: string;
  icon: ReactNode;
};

const STATS: readonly StatSpec[] = [
  {
    id: "streak",
    label: "Streak",
    value: String(LEARNER_STATS.streak),
    background: "#FF8D42",
    shadow: "0 6px 14px rgba(255,141,66,0.22)",
    labelColor: "#FFFFFF",
    accent: "#FF8D42",
    icon: <Flame className="h-[22px] w-[22px] fill-[#FF8D42] text-[#FF8D42]" strokeWidth={1.5} />,
  },
  {
    id: "xp",
    label: "Total XP",
    value: "+40",
    background: "#FFC342",
    shadow: "0 6px 14px rgba(255,195,66,0.22)",
    labelColor: "#5A3E00",
    accent: "#F5B301",
    icon: <Star className="h-[22px] w-[22px] fill-[#F5B301] text-[#F5B301]" strokeWidth={1.5} />,
  },
  {
    id: "accuracy",
    label: "Accuracy",
    value: "92%",
    background: "#01A17F",
    shadow: "0 6px 14px rgba(1,161,127,0.22)",
    labelColor: "#FFFFFF",
    accent: "#01A17F",
    icon: <Check className="h-[22px] w-[22px] text-[#01A17F]" strokeWidth={2.4} />,
  },
];

export function StatCard({ stat }: { stat: StatSpec }) {
  return (
    <div
      className="flex h-[89px] min-w-0 flex-1 flex-col rounded-[18px] px-[3px] pb-[7px]"
      style={{ backgroundColor: stat.background, boxShadow: stat.shadow }}
    >
      <div className="flex flex-1 items-start justify-center pt-[5px]">
        <span
          className="text-xs font-extrabold uppercase leading-4 tracking-[1.2px]"
          style={{ color: stat.labelColor }}
        >
          {stat.label}
        </span>
      </div>
      <div className="flex h-[52px] items-center justify-center gap-1.5 rounded-[15px] bg-white py-3 dark:bg-[#1A1C22]">
        {stat.icon}
        <span className={`text-[21px] leading-7 tracking-[-0.1px] ${HEADING}`} style={{ color: stat.accent }}>
          {stat.value}
        </span>
      </div>
    </div>
  );
}

function LinkCard({ icon, tint, title, onClick }: { icon: ReactNode; tint: string; title: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-black/10 bg-white p-3.5 text-left dark:border-white/12 dark:bg-[#1A1C22] transition-transform active:scale-[0.99]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl dark:bg-[#16262D]!"
        style={{ backgroundColor: tint }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-base font-extrabold leading-[22px]" style={{ color: INK }}>
        {title}
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0" style={{ color: MUTED }} strokeWidth={1.8} />
    </button>
  );
}

function Trophy({ earned }: { earned: boolean }) {
  return (
    <span
      className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
      style={{ backgroundColor: earned ? "#FFC342" : "var(--h-trophy-off)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={earned ? "/images/dashboard/trophy-brown.png" : "/images/dashboard/trophy-grey.png"}
        alt={earned ? "Trophy earned" : "Trophy locked"}
        draggable={false}
        className="h-6 w-6 select-none"
      />
    </span>
  );
}

/**
 * The dashboard tab: who the learner is, their streak, XP and accuracy, the
 * league and weekly report, the Lingo Plus offer and the trophies, below the
 * shared top bar and above the shared bottom nav.
 */
export function DashboardScreen({ name = "Alex" }: { name?: string }) {
  const router = useRouter();
  return (
    <main
      style={{ top: TOP_BAR_BOTTOM }}
      className={`font-[family-name:var(--font-app-poppins)] scrollbar-none absolute inset-x-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C] dark:bg-[#0F1F26] dark:text-white`}
    >
      <div className="mx-auto w-full max-w-[430px] px-4 pt-1" style={{ paddingBottom: NAV_CLEARANCE }}>
        <motion.header {...reveal(0)} className="flex items-center gap-3">
          <div className="h-[72px] w-[72px] shrink-0">
            <HexAvatar className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold leading-tight">{name}</h1>
            <p className="text-xs leading-[18px]" style={{ color: MUTED }}>
              Level {PROFILE.level} · {PROFILE.xp} XP · {PROFILE.path} path
            </p>
          </div>
        </motion.header>

        <motion.div {...reveal(0.06)} className="mt-4 flex gap-3">
          {STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </motion.div>

        <motion.div {...reveal(0.12)} className="mt-3 flex flex-col gap-3">
          <LinkCard
            tint="#FFC342"
            title={`Weekly league · #${LEAGUE.rank} of ${LEAGUE.of}`}
            onClick={() => router.push("/league")}
            icon={
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/dashboard/trophy-brown.png" alt="" draggable={false} className="h-6 w-6 select-none" />
            }
          />
          <LinkCard
            tint="#E5EFFD"
            title={`Reports · this week ${REPORT.weekXp} XP`}
            icon={<ChartNoAxesColumn className="h-6 w-6 text-[#2F80ED]" strokeWidth={2.2} />}
          />
        </motion.div>

        <motion.section
          {...reveal(0.18)}
          className="mt-4 flex w-full flex-col items-start gap-1.5 rounded-[18px] bg-[#5D4CFE] p-3.5"
        >
          <h2 className={`text-[21px] leading-7 tracking-[-0.1px] text-white ${HEADING}`}>Lingo Plus</h2>
          <p className="text-sm font-semibold leading-5 text-white">
            Unlimited battery, 5 hint keys a day, full reports.
          </p>
          <GlossButton label="Try 7 days free" background="#2C2C2C" width={159} />
        </motion.section>

        <motion.h2 {...reveal(0.24)} className="mt-5 text-base font-extrabold leading-[22px]">
          Trophies
        </motion.h2>
        <motion.div {...reveal(0.28)} className="mt-3 flex gap-3">
          {Array.from({ length: TROPHIES.slots }, (_, i) => (
            <Trophy key={i} earned={i < TROPHIES.earned} />
          ))}
        </motion.div>
      </div>
    </main>
  );
}
