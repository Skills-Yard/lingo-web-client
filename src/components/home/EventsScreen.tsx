"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlossButton } from "./GlossButton";
import { TOP_BAR_BOTTOM } from "./HomeStage";
import { HEADING } from "./homeFonts";


const EASE = [0.22, 1, 0.36, 1] as const;
const GREEN = "#01A17F";
const INK = "#2C2C2C";
const MUTED = "#818185";

/** Room under the list for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

/** The toast sits 16px above the bottom nav (60px tall, 38px from the edge). */
const TOAST_ABOVE_NAV = 38 + 60 + 16;

const LIVE = {
  watching: 312,
  title: "Build your first Python bot",
  host: "with Priya · Senior Engineer, Swiggy",
} as const;

type UpcomingEvent = { id: string; day: string; month: string; title: string; meta: string };

const UPCOMING: readonly UpcomingEvent[] = [
  { id: "sql", day: "21", month: "OCT", title: "SQL in 30 minutes", meta: "Workshop · free" },
  { id: "mock", day: "24", month: "OCT", title: "Mock interview: Data Analyst", meta: "Plus members" },
  { id: "hackathon", day: "28", month: "OCT", title: "Mini hackathon: Hex's maze", meta: "Team event · prizes" },
];

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function LiveCard() {
  return (
    <section className="flex w-full flex-col items-start gap-2 rounded-[18px] bg-[#FDECEC] p-3.5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#D42421]" />
        <span className="text-xs font-extrabold uppercase leading-4 tracking-[1.2px] text-[#D42421]">
          Live now · {LIVE.watching} watching
        </span>
      </div>
      <h2 className={`text-[21px] leading-7 tracking-[-0.1px] ${HEADING}`} style={{ color: INK }}>
        {LIVE.title}
      </h2>
      <p className="text-sm font-semibold leading-5" style={{ color: MUTED }}>
        {LIVE.host}
      </p>
      <GlossButton label="Join live" background="#01A17F" width={115} />
    </section>
  );
}

function EventRow({
  event,
  reminded,
  onToggle,
}: {
  event: UpcomingEvent;
  reminded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-black/10 bg-white p-3.5">
      <div className="flex h-[58px] w-10 shrink-0 flex-col items-center rounded-[12px] bg-[#E9F5F0] p-2">
        <span className={`text-[21px] leading-7 tracking-[-0.1px] ${HEADING}`} style={{ color: GREEN }}>
          {event.day}
        </span>
        <span className="text-[11px] font-bold leading-[14px] tracking-[0.2px]" style={{ color: GREEN }}>
          {event.month}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-base font-extrabold leading-[22px]" style={{ color: INK }}>
          {event.title}
        </h3>
        <p className="text-xs leading-[18px]" style={{ color: MUTED }}>
          {event.meta}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={reminded}
        aria-label={reminded ? "Remove reminder" : "Remind me"}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-300 active:scale-90 ${
          reminded ? "scale-110 bg-[#01A17F]" : "bg-[#F7F8FA]"
        }`}
      >
        {/* The bell is grey artwork; on the green button it turns white. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/feed/bell.png"
          alt=""
          draggable={false}
          className={`h-5 w-5 select-none transition-[filter] duration-300 ${reminded ? "brightness-0 invert" : ""}`}
        />
      </button>
    </article>
  );
}

/**
 * The events tab: what is live right now and the events coming up, below the
 * shared top bar and above the shared bottom nav.
 */
export function EventsScreen() {
  const [reminders, setReminders] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<number | null>(null);
  const toastTimer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const toggleReminder = (id: string) => {
    const turningOn = !reminders.has(id);
    setReminders((prev) => {
      const next = new Set(prev);
      if (turningOn) next.add(id);
      else next.delete(id);
      return next;
    });
    window.clearTimeout(toastTimer.current);
    if (!turningOn) {
      setToast(null);
      return;
    }
    // A new key restarts the toast when another bell is tapped while it shows.
    setToast((key) => (key ?? 0) + 1);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <main
      style={{ top: TOP_BAR_BOTTOM }}
      className={`font-[family-name:var(--font-app-poppins)] scrollbar-none absolute inset-x-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C]`}
    >
      <div className="mx-auto w-full max-w-[430px] px-4 pt-1" style={{ paddingBottom: NAV_CLEARANCE }}>
        <motion.h1 {...reveal(0)} className="text-2xl font-extrabold leading-tight">
          Events
        </motion.h1>

        <motion.div {...reveal(0.06)} className="mt-3">
          <LiveCard />
        </motion.div>

        <motion.h2 {...reveal(0.12)} className="mt-5 text-base font-extrabold leading-[22px]">
          Upcoming
        </motion.h2>

        <div className="mt-3 flex flex-col gap-3">
          {UPCOMING.map((event, i) => (
            <motion.div key={event.id} {...reveal(0.16 + i * 0.05)}>
              <EventRow
                event={event}
                reminded={reminders.has(event.id)}
                onToggle={() => toggleReminder(event.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {toast !== null && (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="pointer-events-none fixed left-1/2 z-20 flex h-11 w-[300px] max-w-[calc(100vw-32px)] -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2C2C2C] px-5 py-2.5"
            style={{ bottom: TOAST_ABOVE_NAV }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/feed/bell.png" alt="" draggable={false} className="h-[18px] w-[18px] brightness-0 invert" />
            <span className="text-sm font-semibold leading-5 text-white">We&apos;ll remind you 15 min before</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
