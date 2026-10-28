"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, BookOpen, CodeXml, Trophy, Zap } from "lucide-react";
import { HexAvatar } from "./HexAvatar";
import { setReminder, useReminders } from "./reminders";

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

const SECTION_TITLE = "text-[18px] font-semibold leading-6 text-[#444444] dark:text-[#C8C7C5]";
const SECTION_LINK = "text-[13px] font-medium leading-[18px] text-[#5D4CFE] dark:text-[#8E82FF]";

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={SECTION_TITLE}>{title}</h2>
      <button type="button" onClick={onAction} className={SECTION_LINK}>
        {action}
      </button>
    </div>
  );
}

/** Hex's mood card: a line about today, and the day's lesson goal as a bar. */
export function HexGreetingCard({ done = 1, goal = 2, streak = 4 }: { done?: number; goal?: number; streak?: number }) {
  return (
    <motion.section
      {...reveal(0.4)}
      className="flex items-center gap-3 rounded-[18px] bg-[#E9F5F0] p-3.5 dark:bg-[#133A35]"
    >
      <div className="h-[47px] w-16 shrink-0">
        <HexAvatar className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm font-semibold leading-[19px] text-[#007A70] dark:text-[#00B8A9]">Hex is in a great mood!</p>
        <p className="text-xs leading-[17px] text-[#444444] dark:text-[#C8C7C5]">
          One more lesson today keeps your {streak}-day streak alive.
        </p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-[170px] max-w-full overflow-hidden rounded-[4px] bg-white dark:bg-[#1A1C22]">
            <span className="block h-full rounded-[4px] bg-[#01A17F]" style={{ width: `${(done / goal) * 100}%` }} />
          </span>
          <span className="whitespace-nowrap text-[11px] font-medium leading-[15px] text-[#007A70] dark:text-[#00B8A9]">
            {done}/{goal} today
          </span>
        </div>
      </div>
    </motion.section>
  );
}

type Quest = {
  id: string;
  title: string;
  done: number;
  goal: number;
  reward: number;
  tile: string;
  icon: ReactNode;
  /** The bar's fill, as a class. */
  fill: string;
};

const QUESTS: readonly Quest[] = [
  {
    id: "lessons",
    title: "Finish 2 lessons",
    done: 1,
    goal: 2,
    reward: 10,
    tile: "bg-[#E9F5F0] dark:bg-[#133A35]",
    fill: "bg-[#01A17F]",
    icon: <BookOpen className="h-[22px] w-[22px] text-[#01A17F]" strokeWidth={1.65} />,
  },
  {
    id: "quiz",
    title: "Score 90% in a quiz",
    done: 0,
    goal: 1,
    reward: 15,
    tile: "bg-[#FFF3DE] dark:bg-[#3A2A1A]",
    fill: "bg-[#FF8D42]",
    icon: <Trophy className="h-[22px] w-[22px] text-[#FF8D42]" strokeWidth={1.65} />,
  },
  {
    id: "xp",
    title: "Earn 50 XP",
    done: 30,
    goal: 50,
    reward: 5,
    tile: "bg-[#EFEAFC] dark:bg-[#2A2550]",
    fill: "bg-[#5D4CFE] dark:bg-[#8E82FF]",
    icon: <Zap className="h-[22px] w-[22px] fill-[#5D4CFE] text-[#5D4CFE] dark:fill-[#8E82FF] dark:text-[#8E82FF]" strokeWidth={1.65} />,
  },
];

function QuestRow({ quest }: { quest: Quest }) {
  // An empty bar still shows a dot of its colour, as in the design.
  const percent = Math.max((quest.done / quest.goal) * 100, 0);
  return (
    <div className="flex h-[66px] items-center gap-3 rounded-[18px] border border-black/10 bg-white p-3 dark:border-white/12 dark:bg-[#1A1C22]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quest.tile}`}>
        {quest.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-[13px] font-medium leading-[18px] text-[#2C2C2C] dark:text-white">{quest.title}</p>
        <div className="flex items-center gap-2">
          <span className="relative h-1.5 w-[170px] max-w-full overflow-hidden rounded-[3px] bg-[#EBEBEB] dark:bg-white/12">
            <span
              className={`absolute inset-y-0 left-0 min-w-1.5 rounded-[3px] ${quest.fill}`}
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">
            {quest.done}/{quest.goal}
          </span>
        </div>
      </div>
      <span className="flex h-[23px] shrink-0 items-center gap-[3px] rounded-lg bg-[#E5EFFD] px-2 py-1 dark:bg-[#1B2B40]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/stats/gem.png" alt="" draggable={false} className="h-[13px] w-[13px] select-none object-contain" />
        <span className="text-[11px] font-semibold leading-[15px] text-[#2F80ED] dark:text-[#5AA2FF]">+{quest.reward}</span>
      </span>
    </div>
  );
}

/** The day's three quests, each a bar towards its gem reward. */
export function DailyQuests() {
  return (
    <motion.section {...reveal(0.45)}>
      <div className="flex items-center justify-between">
        <h2 className={SECTION_TITLE}>Daily quests</h2>
        <span className={SECTION_LINK}>Resets in 6h</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {QUESTS.map((quest) => (
          <QuestRow key={quest.id} quest={quest} />
        ))}
      </div>
    </motion.section>
  );
}

/** The learner's path through the module, as a picture; Open goes to the level map. */
export function ModulePath() {
  const router = useRouter();
  return (
    <motion.section {...reveal(0.5)}>
      <SectionHead title="Your path · Module 1" action="Open" onAction={() => router.push("/level")} />
      <button
        type="button"
        onClick={() => router.push("/level")}
        aria-label="Open your path, next: 1.3 Symbols and Operators"
        className="mt-3 block w-full transition-transform active:scale-[0.99]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home/module-1.png"
          alt=""
          draggable={false}
          className="aspect-[1074/450] w-full select-none rounded-[18px] object-cover dark:brightness-90"
        />
      </button>
    </motion.section>
  );
}

/** The live event the Happening soon card reminds about. */
const LIVE_EVENT = { id: "live-python-qa", title: "Python Q&A with mentors", meta: "Live in 2h" } as const;

/** What is coming up: the next live event and a career to explore. */
export function HappeningSoon() {
  const router = useRouter();
  // Kept in local storage, so the notifications list it too.
  const reminded = useReminders().some((r) => r.id === LIVE_EVENT.id);
  return (
    <motion.section {...reveal(0.55)}>
      <SectionHead title="Happening soon" action="See all" onAction={() => router.push("/events")} />
      <div className="mt-3 flex gap-4">
        <article className="flex h-[140px] w-[171px] flex-col items-start gap-1.5 rounded-[18px] bg-[#FDECEC] p-3.5 dark:bg-[#3D1B1D]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D42421] dark:bg-[#FF5A57]" />
            <span className="text-[10px] font-semibold leading-[14px] tracking-[0.06em] text-[#D42421] dark:text-[#FF5A57]">LIVE IN 2H</span>
          </span>
          <h3 className="text-sm font-semibold leading-[19px] text-[#2C2C2C] dark:text-white">Python Q&amp;A with mentors</h3>
          <p className="text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">Events · free</p>
          <button
            type="button"
            onClick={() => setReminder(LIVE_EVENT, !reminded)}
            aria-pressed={reminded}
            className="mt-auto flex h-[27px] items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium leading-[15px] text-[#444444] dark:bg-[#1A1C22] dark:text-[#C8C7C5]"
          >
            <Bell className="h-3.5 w-3.5" strokeWidth={1.6} />
            {reminded ? "Reminder set" : "Remind me"}
          </button>
        </article>

        <article className="flex h-[140px] w-[171px] flex-col items-start gap-1.5 rounded-[18px] bg-[#E5EFFD] p-3.5 dark:bg-[#1B2B40]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white dark:bg-[#1A1C22]">
            <CodeXml className="h-[18px] w-[18px] text-[#2F80ED] dark:text-[#5AA2FF]" strokeWidth={1.8} />
          </span>
          <h3 className="text-sm font-semibold leading-[19px] text-[#2C2C2C] dark:text-white">Web Developer</h3>
          <p className="text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">₹5-18 L/yr · 8 skills</p>
          <button
            type="button"
            onClick={() => router.push("/careers/web-developer")}
            className="mt-auto flex h-[27px] items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-medium leading-[15px] text-[#2F80ED] dark:bg-[#1A1C22] dark:text-[#5AA2FF]"
          >
            Explore career
          </button>
        </article>
      </div>
    </motion.section>
  );
}
