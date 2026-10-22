"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { Bell, ChartNoAxesColumn, CodeXml, Play, Plus } from "lucide-react";
import { configureRiveRuntime, HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { HomeStage } from "./HomeStage";
import { DailyQuests, HappeningSoon, HexGreetingCard, ModulePath } from "./HomeSections";
import { NotificationsPopup } from "./NotificationsPopup";
import { HomeStats } from "./HomeTopBar";

configureRiveRuntime();

const EASE = [0.22, 1, 0.36, 1] as const;

/** Height of the content, in stage px; the stage and nav are HomeStage's. */
const STAGE_H = 1600;

const TRACKS = [
  { id: "web", label: "Web Dev", Icon: CodeXml },
  { id: "data", label: "Data Analyst", Icon: ChartNoAxesColumn },
] as const;

type TrackId = (typeof TRACKS)[number]["id"];

type Course = {
  title: string;
  module: string;
  moduleName: string;
  upNext: string;
  lesson: string;
  lessonMeta: string;
  done: number;
  total: number;
  theme: CourseTheme;
};

/** A card's colours: its background and text, the icon and Continue button. */
type CourseTheme = {
  background: string;
  ink: string;
  muted: string;
  /** The icon tile's glyph. */
  accent: string;
  /** The card's drop shadow. */
  shadow?: string;
  ringTrack: string;
  ringStroke: string;
  button: { background: string; ink: string; disc: string; play: string };
};

const BLUE_THEME: CourseTheme = {
  background: "var(--h-course-bg)",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.75)",
  accent: "#2A66DB",
  shadow: "var(--h-course-shadow)",
  ringTrack: "rgba(255,255,255,0.25)",
  ringStroke: "#FFFFFF",
  button: { background: "#FFFFFF", ink: "#444444", disc: "#4B93D7", play: "#FFFFFF" },
};

/** A light orange card: peach background, dark text, an orange Continue. */
const ORANGE_THEME: CourseTheme = {
  background: "linear-gradient(180deg,#FFF3E8 0%,#FFE6D2 100%)",
  ink: "#2C2C2C",
  muted: "rgba(68,68,68,0.7)",
  accent: "#E5671C",
  ringTrack: "rgba(255,141,66,0.25)",
  ringStroke: "#FF8D42",
  button: { background: "#FF8D42", ink: "#FFFFFF", disc: "#FFFFFF", play: "#FF8D42" },
};

/** The programs the learner is part-way through, most recent first. */
const COURSES: readonly Course[] = [
  {
    title: "Python for Beginners",
    module: "Module 1",
    moduleName: "Programming Mindset",
    upNext: "1.3",
    lesson: "Symbols & Operators",
    lessonMeta: "Video · 6 min · +20 XP",
    done: 2,
    total: 7,
    theme: BLUE_THEME,
  },
  {
    title: "HTML & CSS Basics",
    module: "Module 1",
    moduleName: "Building Pages",
    upNext: "1.2",
    lesson: "Tags & Elements",
    lessonMeta: "Video · 5 min · +20 XP",
    done: 1,
    total: 6,
    theme: ORANGE_THEME,
  },
];

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

const greetingFor = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

const trackIndex = (id: TrackId) => TRACKS.findIndex((t) => t.id === id);

const PILL_SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 } as const;

const slide = (direction: 1 | -1) => ({
  initial: { opacity: 0, x: 28 * direction },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 * direction },
  transition: { duration: 0.22, ease: EASE },
});

const subscribeNever = () => () => {};

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

function HomeHex() {
  const { RiveComponent } = useHexRive(HEX_LAYOUT, HEX_STATE.idle);
  return <RiveComponent className="h-full w-full" />;
}

function ProgressRing({ done, total, theme }: { done: number; total: number; theme: CourseTheme }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke={theme.ringTrack} strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={theme.ringStroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done / total)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none" style={{ color: theme.ink }}>
        <span className="text-sm font-semibold">
          {done}/{total}
        </span>
        <span className="mt-0.5 text-[9px]" style={{ color: theme.muted }}>
          lessons
        </span>
      </div>
    </div>
  );
}

function CourseCard({ course, delay, onContinue }: { course: Course; delay: number; onContinue?: () => void }) {
  const { theme } = course;
  return (
    <motion.section
      {...reveal(delay)}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{ background: theme.background, color: theme.ink, boxShadow: theme.shadow }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-white"
          style={{ color: theme.accent }}
        >
          <CodeXml className="h-[17px] w-[17px]" strokeWidth={2.4} />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <h3 className="truncate text-[18px] font-semibold">{course.title}</h3>
          <p className="truncate text-[13px]" style={{ color: theme.muted }}>
            {course.module} · {course.moduleName}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: theme.muted }}>
            Up next · {course.upNext}
          </p>
          <p className="mt-0.5 text-[23px] font-semibold leading-tight">{course.lesson}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: theme.muted }}>
            <Play className="h-2.5 w-2.5 fill-current" />
            {course.lessonMeta}
          </p>
        </div>
        <ProgressRing done={course.done} total={course.total} theme={theme} />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 flex h-[46px] w-[154px] items-center gap-2 rounded-full py-2 pl-2 pr-4 transition-transform active:scale-95"
        style={{ backgroundColor: theme.button.background }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.button.disc }}>
          <Play className="ml-0.5 h-[13px] w-[13px] fill-current" style={{ color: theme.button.play }} />
        </span>
        <span className="text-base font-medium" style={{ color: theme.button.ink }}>
          Continue
        </span>
      </button>
    </motion.section>
  );
}

/**
 * The learner's home, shown after onboarding: greeting and alerts, the track
 * switcher, stats, the featured track (Hex stands in the hero), and the course
 * to continue, Hex's mood, the daily quests, the module's path and what is
 * happening soon, with the floating nav at the bottom. The page scrolls under
 * the nav; the stage is scaled to the screen's width.
 */
export function MainHomeScreen({
  name = "Learner",
  onContinue,
  onProfile,
}: {
  name?: string;
  onContinue?: () => void;
  /** The avatar was tapped: open the profile. */
  onProfile?: () => void;
}) {
  const [track, setTrack] = useState<TrackId>("web");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Which way the content slides: towards the tab that was picked.
  const [direction, setDirection] = useState<1 | -1>(1);
  const selectTrack = (next: TrackId) => {
    if (next === track) return;
    setDirection(trackIndex(next) > trackIndex(track) ? 1 : -1);
    setTrack(next);
  };
  const greeting = useSyncExternalStore(
    subscribeNever,
    () => greetingFor(new Date().getHours()),
    () => "Hello",
  );
  return (
    <HomeStage stageHeight={STAGE_H} scroll>
        <div className="flex flex-col px-4 pb-6">
          <motion.header {...reveal(0)} className="relative z-20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onProfile}
              aria-label="Open your profile"
              className="flex min-w-0 items-center gap-3 text-left transition-opacity active:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/avatar.png"
                alt="Profile"
                draggable={false}
                className="h-12 w-12 shrink-0 select-none rounded-[38px] bg-[#F9F8F6] object-cover dark:bg-[#16262D]"
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-xs leading-4 text-[#818185] dark:text-[#9FA19F]">{greeting},</span>
                <span className="truncate text-lg font-semibold leading-6 text-[#444444] dark:text-[#C8C7C5]">{name}</span>
              </div>
            </button>
            <div className="relative shrink-0">
              <button
                type="button"
                data-notifications-bell
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-[8px] border transition-[background-color,border-color,color,transform] duration-300 active:scale-95 ${
                  notificationsOpen
                    ? "border-[#01A17F] bg-[#01A17F] text-white"
                    : "border-black/8 dark:border-white/12 dark:bg-[#1A1C22] dark:text-[#C8C7C5]"
                }`}
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
                <span
                  className={`absolute right-2 top-2 h-[6px] w-[6px] rounded-full transition-colors duration-300 ${
                    notificationsOpen ? "bg-white" : "bg-[#EF4444] dark:bg-[#FF5A57]"
                  }`}
                />
              </button>
              <AnimatePresence>
                {notificationsOpen && <NotificationsPopup onClose={() => setNotificationsOpen(false)} />}
              </AnimatePresence>
            </div>
          </motion.header>

          <motion.div {...reveal(0.06)} className="mt-4 flex items-center gap-2" role="tablist">
            {TRACKS.map(({ id, label, Icon }) => {
              const selected = id === track;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectTrack(id)}
                  className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full border bg-[#F9F8F6] dark:bg-[#16262D] dark:border-white/12 pl-1.5 pr-3.5 text-[13px] font-medium transition-colors duration-300 ${
                    selected ? "border-transparent text-white dark:text-[#1A1C22]" : "border-black/6 text-[#444444] dark:text-[#C8C7C5]"
                  }`}
                >
                  {/* One dark pill that slides (and resizes) from tab to tab. */}
                  {selected && (
                    <motion.span
                      layoutId="track-pill"
                      className="absolute -inset-px rounded-full bg-[#444444] dark:bg-[#C8C7C5]"
                      transition={PILL_SPRING}
                    />
                  )}
                  <span
                    className={`relative flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-300 ${
                      selected ? "bg-white text-[#444444] dark:bg-[#1A1C22] dark:text-[#C8C7C5]" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="relative">{label}</span>
                </button>
              );
            })}
            <button
              type="button"
              aria-label="Add a track"
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/6 bg-white dark:border-white/12 dark:bg-[#1A1C22] dark:text-[#C8C7C5]"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </motion.div>

          <motion.div {...reveal(0.1)} className="mt-4">
            <HomeStats />
          </motion.div>

          <motion.div {...reveal(0.14)} className="mt-3 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={track}
                {...slide(direction)}
                className="text-[24px] font-semibold leading-tight text-[#2B2B2F] dark:text-[#C8C7C5]"
              >
                {track === "web" ? "Web Developer" : "Data Analyst"}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          <motion.div {...reveal(0.18)} className="relative mt-2 overflow-hidden rounded-xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={track} {...slide(direction)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/home/python-hero-clean.png"
                  alt="Python"
                  draggable={false}
                  className="aspect-[1080/651] w-full select-none object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {/* Hex stands where the picture's robot was; he stays put while the
              picture slides, so his canvas isn't reloaded. */}
            <div className="pointer-events-none absolute left-[52%] top-[34%] h-[46%] w-[26%]">
              <HomeHex />
            </div>
          </motion.div>

          <motion.div {...reveal(0.26)} className="mt-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold leading-tight text-[#2B2B2F] dark:text-[#C8C7C5]">Continue where you left</h2>
            <button type="button" className="text-xs font-medium text-[#5D4CFE] dark:text-[#8E82FF]">
              See path
            </button>
          </motion.div>

          <div className="mt-3 flex flex-col gap-4">
            {COURSES.map((course, i) => (
              <CourseCard key={course.title} course={course} delay={0.3 + i * 0.05} onContinue={onContinue} />
            ))}
          </div>

          <div className="mt-4">
            <HexGreetingCard />
          </div>
          <div className="mt-6">
            <DailyQuests />
          </div>
          <div className="mt-6">
            <ModulePath />
          </div>
          <div className="mt-6">
            <HappeningSoon />
          </div>
        </div>
    </HomeStage>
  );
}
