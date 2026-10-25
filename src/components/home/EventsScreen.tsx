"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CalendarDays,
  CalendarPlus,
  CodeXml,
  Tag,
  Trophy,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { TOP_MARGIN } from "./HomeStage";
import { HEADING } from "./homeFonts";
import { setReminder, useReminders } from "./reminders";

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = "var(--h-ink)";
const MUTED = "var(--h-muted)";

/** Room under the list for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

/** The toast sits 16px above the bottom nav (60px tall, 38px from the edge). */
const TOAST_ABOVE_NAV = 38 + 60 + 16;

const LIVE = {
  watching: 312,
  title: "Build your first Python bot",
  host: "Priya, Senior Engineer, Swiggy",
} as const;

type Kind = "Workshop" | "Interview Prep" | "Hackathon";

const FILTERS = ["All", "Live", "Workshops", "Interview Prep", "Hackathons"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_ICONS: Record<Exclude<Filter, "Live">, LucideIcon> = {
  All: CodeXml,
  Workshops: CalendarDays,
  "Interview Prep": UsersRound,
  Hackathons: Trophy,
};

const FILTER_KIND: Partial<Record<Filter, Kind>> = {
  Workshops: "Workshop",
  "Interview Prep": "Interview Prep",
  Hackathons: "Hackathon",
};

/** Each kind's tag and Join button colours. */
const KIND_STYLE: Record<Kind, { Icon: LucideIcon; tag: string; tagBg: string; join: string }> = {
  Workshop: { Icon: Video, tag: "#01A17F", tagBg: "rgba(1,161,127,0.1)", join: "#01A17F" },
  "Interview Prep": {
    Icon: UsersRound,
    tag: "#8B6CF6",
    tagBg: "rgba(139,108,246,0.12)",
    join: "linear-gradient(90deg, #B49CFF 0%, #8B6CF6 100%)",
  },
  Hackathon: { Icon: Trophy, tag: "#F2994A", tagBg: "rgba(242,153,74,0.14)", join: "#F2994A" },
};

type UpcomingEvent = { id: string; title: string; kind: Kind; date: string; price: string };

const UPCOMING: readonly UpcomingEvent[] = [
  { id: "sql", title: "SQL in 30 minutes", kind: "Workshop", date: "08 Aug 2026", price: "Free" },
  { id: "mock", title: "Mock interview: Data Analyst", kind: "Interview Prep", date: "05 Jun 2027", price: "Plus members" },
  { id: "hackathon", title: "Mini hackathon: Hex's maze", kind: "Hackathon", date: "28 Oct 2026", price: "Prizes" },
];

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
      style={{ color: INK }}
    >
      {children}
    </button>
  );
}

/** The live session: the artwork already carries its title, host, LIVE badge
 * and Join button, so the whole card is the button. */
function LiveCard() {
  return (
    <button
      type="button"
      aria-label={`Join live: ${LIVE.title}, with ${LIVE.host}. ${LIVE.watching} watching`}
      className="block w-full overflow-hidden rounded-2xl shadow-[1px_1px_11px_rgba(0,0,0,0.08)] transition-transform active:scale-[0.98]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/event-img.png"
        alt=""
        draggable={false}
        className="aspect-[358/204] w-full select-none object-cover"
      />
    </button>
  );
}

function EventCard({
  event,
  saved,
  onToggleSave,
}: {
  event: UpcomingEvent;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const style = KIND_STYLE[event.kind];
  return (
    <article className="flex w-full flex-col gap-3.5 rounded-2xl border border-black/10 bg-white p-3.5 dark:border-white/12 dark:bg-[#1A1C22]">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-[17px] font-medium leading-6" style={{ color: INK }}>
            {event.title}
          </h3>
          <p className="flex items-center gap-3 text-xs leading-4" style={{ color: MUTED }}>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" strokeWidth={1.6} />
              {event.price}
            </span>
          </p>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold leading-4"
          style={{ color: style.tag, backgroundColor: style.tagBg }}
        >
          <style.Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          {event.kind}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          className="flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 text-sm font-medium transition-[background-color,transform] duration-300 active:scale-95 dark:border-white/12"
          style={{ color: INK }}
        >
          <Bookmark
            className="h-4 w-4 transition-colors duration-300"
            strokeWidth={1.8}
            fill={saved ? "currentColor" : "none"}
          />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          className={`flex h-[42px] flex-1 items-center justify-center rounded-full text-sm text-white transition-transform active:scale-95 ${HEADING}`}
          style={{ background: style.join }}
        >
          Join now
        </button>
      </div>
    </article>
  );
}

/**
 * The events tab: what is live right now and the events coming up, filtered
 * by kind, above the shared bottom nav. Saving an event sets a reminder, so
 * the home's notifications list it too.
 */
export function EventsScreen() {
  // Kept in local storage, so the home's notifications list them too.
  const stored = useReminders();
  const saved = new Set(stored.map((r) => r.id));
  const [filter, setFilter] = useState<Filter>("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [toast, setToast] = useState<number | null>(null);
  const toastTimer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const toggleSave = (event: UpcomingEvent) => {
    const turningOn = !saved.has(event.id);
    setReminder({ id: event.id, title: event.title, meta: `${event.date} · ${event.kind}` }, turningOn);
    window.clearTimeout(toastTimer.current);
    if (!turningOn) {
      setToast(null);
      return;
    }
    // A new key restarts the toast when another event is saved while it shows.
    setToast((key) => (key ?? 0) + 1);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const showLive = !savedOnly && (filter === "All" || filter === "Live");
  const kind = FILTER_KIND[filter];
  const visible =
    filter === "Live"
      ? []
      : UPCOMING.filter((e) => (!kind || e.kind === kind) && (!savedOnly || saved.has(e.id)));

  return (
    <main
      style={{ paddingTop: TOP_MARGIN }}
      className="font-[family-name:var(--font-app-poppins)] scrollbar-none absolute inset-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C] dark:bg-[#0F1F26] dark:text-white"
    >
      <div className="mx-auto w-full max-w-[430px] px-4" style={{ paddingBottom: NAV_CLEARANCE }}>
        <motion.header {...reveal(0)} className="flex items-center justify-between">
          <IconButton
            label={savedOnly ? "Show all events" : "Show saved events"}
            pressed={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
          >
            <Bookmark className="h-6 w-6" strokeWidth={1.8} fill={savedOnly ? "currentColor" : "none"} />
          </IconButton>
          <h1 className={`text-2xl leading-8 ${HEADING}`} style={{ color: INK }}>
            {savedOnly ? "Saved Events" : "Upcoming Events"}
          </h1>
          <IconButton label="Add to calendar">
            <CalendarPlus className="h-6 w-6" strokeWidth={1.8} />
          </IconButton>
        </motion.header>

        <motion.div
          {...reveal(0.06)}
          className="scrollbar-none -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4"
          role="tablist"
        >
          {FILTERS.map((name) => {
            const selected = name === filter;
            const Icon = name === "Live" ? null : FILTER_ICONS[name];
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(name)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-[28px] border px-3.5 text-sm font-medium transition-colors duration-300 ${
                  selected
                    ? "border-transparent bg-[#444444] text-white dark:bg-white dark:text-[#1A1C22]"
                    : "border-black/10 bg-[#F7F8FA] text-[#444444] dark:border-white/12 dark:bg-[#16262D] dark:text-[#C8C7C5]"
                }`}
              >
                {!Icon ? (
                  <span className="mx-1 h-2.5 w-2.5 rounded-full bg-[#D42421]" />
                ) : selected ? (
                  <span className="flex h-[31px] w-[31px] items-center justify-center rounded-[9px] bg-white text-[#444444] dark:bg-[#1A1C22] dark:text-white">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                ) : (
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                )}
                {name}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence initial={false}>
          {showLive && (
            <motion.div
              key="live"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <motion.div {...reveal(0.12)} className="pt-5">
                <LiveCard />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {filter !== "Live" && (
          <motion.h2 {...reveal(0.16)} className={`mt-6 text-lg leading-6 ${HEADING}`} style={{ color: INK }}>
            Coming Up
          </motion.h2>
        )}

        <div className="mt-3 flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial>
            {visible.map((event, i) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.2 + i * 0.05 }}
              >
                <EventCard event={event} saved={saved.has(event.id)} onToggleSave={() => toggleSave(event)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filter !== "Live" && visible.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: MUTED }}>
              {savedOnly ? "Nothing saved yet. Tap Save on an event to keep it here." : "No events here yet."}
            </p>
          )}
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
            className="pointer-events-none fixed left-1/2 z-20 flex h-11 w-[300px] max-w-[calc(100vw-32px)] -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2C2C2C] px-5 py-2.5 dark:bg-[#22262E]"
            style={{ bottom: TOAST_ABOVE_NAV }}
          >
            <Bookmark className="h-[18px] w-[18px] text-white" strokeWidth={1.8} fill="currentColor" />
            <span className="text-sm font-semibold leading-5 text-white">Saved, we&apos;ll remind you 15 min before</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
