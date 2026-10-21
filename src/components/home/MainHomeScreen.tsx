"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { Bell, ChartNoAxesColumn, CodeXml, Play, Plus } from "lucide-react";
import { configureRiveRuntime, HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { HomeStage } from "./HomeStage";
import { HomeStats } from "./HomeTopBar";

configureRiveRuntime();

const EASE = [0.22, 1, 0.36, 1] as const;

/** Height of the content, in stage px; the stage and nav are HomeStage's. */
const STAGE_H = 686;

const TRACKS = [
  { id: "web", label: "Web Dev", Icon: CodeXml },
  { id: "data", label: "Data Analyst", Icon: ChartNoAxesColumn },
] as const;

type TrackId = (typeof TRACKS)[number]["id"];

const COURSE = {
  title: "Python for Beginners",
  module: "Module 1",
  moduleName: "Programming Mindset",
  upNext: "1.3",
  lesson: "Symbols & Operators",
  lessonMeta: "Video · 6 min · +20 XP",
  done: 2,
  total: 7,
} as const;

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

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[60px] w-[60px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done / total)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-white">
        <span className="text-sm font-semibold">
          {done}/{total}
        </span>
        <span className="mt-0.5 text-[9px] text-white/80">lessons</span>
      </div>
    </div>
  );
}

function CourseCard({ onContinue }: { onContinue?: () => void }) {
  return (
    <motion.section
      {...reveal(0.35)}
      className="relative overflow-hidden rounded-xl bg-[linear-gradient(180deg,#3762EB_0%,#2A66DB_55%,#4A8BF0_100%)] p-3.5 text-white"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-white text-[#2A66DB]">
          <CodeXml className="h-[17px] w-[17px]" strokeWidth={2.4} />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <h3 className="truncate text-[17px] font-semibold">{COURSE.title}</h3>
          <p className="truncate text-[13px] text-white/75">
            {COURSE.module} · {COURSE.moduleName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
            Up next · {COURSE.upNext}
          </p>
          <p className="mt-0.5 text-[22px] font-semibold leading-tight">{COURSE.lesson}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/80">
            <Play className="h-2.5 w-2.5 fill-white/80 text-white/80" />
            {COURSE.lessonMeta}
          </p>
        </div>
        <ProgressRing done={COURSE.done} total={COURSE.total} />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-3 flex h-11 w-[148px] items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 transition-transform active:scale-95"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4B93D7]">
          <Play className="ml-0.5 h-[13px] w-[13px] fill-white text-white" />
        </span>
        <span className="text-base font-medium text-[#444444]">Continue</span>
      </button>
    </motion.section>
  );
}

/**
 * The learner's home, shown after onboarding: greeting and alerts, the track
 * switcher, stats, the featured track (Hex stands in the hero), and the course
 * to continue, with the floating nav at the bottom. Nothing scrolls: the whole
 * stage is scaled to fit the screen.
 */
export function MainHomeScreen({
  name = "Learner",
  onContinue,
}: {
  name?: string;
  onContinue?: () => void;
}) {
  const [track, setTrack] = useState<TrackId>("web");
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
    <HomeStage stageHeight={STAGE_H}>
        <div className="flex h-full flex-col px-4">
          <motion.header {...reveal(0)} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/avatar.png"
                alt="Profile"
                draggable={false}
                className="h-12 w-12 shrink-0 select-none rounded-[38px] bg-[#F9F8F6] object-cover"
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-xs leading-4 text-[#818185]">{greeting},</span>
                <span className="truncate text-lg font-semibold leading-6 text-[#444444]">{name}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-black/8"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span className="absolute right-2 top-2 h-[6px] w-[6px] rounded-full bg-[#EF4444]" />
            </button>
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
                  className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full border bg-[#F9F8F6] pl-1.5 pr-3.5 text-[13px] font-medium transition-colors duration-300 ${
                    selected ? "border-transparent text-white" : "border-black/6 text-[#444444]"
                  }`}
                >
                  {/* One dark pill that slides (and resizes) from tab to tab. */}
                  {selected && (
                    <motion.span
                      layoutId="track-pill"
                      className="absolute -inset-px rounded-full bg-[#444444]"
                      transition={PILL_SPRING}
                    />
                  )}
                  <span
                    className={`relative flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-300 ${
                      selected ? "bg-white text-[#444444]" : ""
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
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/6 bg-white"
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
                className="text-[24px] font-semibold leading-tight text-[#2B2B2F]"
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
            <h2 className="text-[18px] font-semibold leading-tight text-[#2B2B2F]">Continue where you left</h2>
            <button type="button" className="text-xs font-medium text-[#5D4CFE]">
              See path
            </button>
          </motion.div>

          <div className="mt-2">
            <CourseCard onContinue={onContinue} />
          </div>
        </div>
    </HomeStage>
  );
}
