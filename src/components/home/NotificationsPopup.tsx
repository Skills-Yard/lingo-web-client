"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Flame, Trophy } from "lucide-react";
import { useReminders } from "./reminders";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Placeholder notifications until there is a backend. */
const RECENT = [
  { id: "streak", icon: Flame, tint: "bg-[#FFF3DE] text-[#FF8D42] dark:bg-[#3A2A1A]", title: "Keep your 4-day streak alive", meta: "One more lesson today" },
  { id: "league", icon: Trophy, tint: "bg-[#EFEAFC] text-[#5D4CFE] dark:bg-[#2A2550] dark:text-[#8E82FF]", title: "Weekly league ends in 2 days", meta: "You're #4 of 30" },
] as const;

/**
 * A temporary notifications panel that drops from the bell: the reminders the
 * learner set for events, then a few static updates. Closes on a tap outside it.
 */
export function NotificationsPopup({ onClose }: { onClose: () => void }) {
  const reminders = useReminders();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && ref.current?.contains(e.target)) return;
      // The bell toggles it itself.
      if (e.target instanceof Element && e.target.closest("[data-notifications-bell]")) return;
      onClose();
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      // It grows out of the bell: the origin is the bell's centre (18px in
      // from the panel's right edge, 28px above its top), and the corners
      // round off as it opens.
      initial={{ opacity: 0, scale: 0.08, borderRadius: 24 }}
      animate={{ opacity: 1, scale: 1, borderRadius: 16 }}
      // Closing is the opening in reverse: it shrinks back into the bell, and
      // only fades once it is nearly there, so the shrinking is what you see.
      exit={{
        opacity: 0,
        scale: 0.08,
        borderRadius: 24,
        transition: {
          scale: { duration: 0.32, ease: [0.55, 0, 0.8, 0.4] },
          borderRadius: { duration: 0.32, ease: EASE },
          opacity: { duration: 0.12, delay: 0.22, ease: "linear" },
        },
      }}
      transition={{
        scale: { type: "spring", stiffness: 320, damping: 26, mass: 0.8 },
        opacity: { duration: 0.18, ease: EASE },
        borderRadius: { duration: 0.3, ease: EASE },
      }}
      style={{ transformOrigin: "calc(100% - 18px) -28px" }}
      className="absolute right-0 top-[46px] z-30 w-[300px] overflow-hidden border border-black/10 bg-white p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
    >
      <h2 className="text-[15px] font-semibold leading-5 text-[#2C2C2C] dark:text-white">Notifications</h2>

      <h3 className="mt-3 text-[11px] font-medium uppercase tracking-wide text-[#818185] dark:text-[#9FA19F]">Reminders</h3>
      {reminders.length === 0 ? (
        <p className="mt-1.5 text-xs leading-[17px] text-[#818185] dark:text-[#9FA19F]">
          No reminders yet. Tap the bell on an event to get one 15 min before.
        </p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-2">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F5F0] text-[#01A17F] dark:bg-[#133A35]">
                <Bell className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium leading-[18px] text-[#2C2C2C] dark:text-white">{r.title}</span>
                <span className="block truncate text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">
                  {r.meta} · reminder 15 min before
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3.5 text-[11px] font-medium uppercase tracking-wide text-[#818185] dark:text-[#9FA19F]">Recent</h3>
      <ul className="mt-1.5 flex flex-col gap-2">
        {RECENT.map(({ id, icon: Icon, tint, title, meta }) => (
          <li key={id} className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium leading-[18px] text-[#2C2C2C] dark:text-white">{title}</span>
              <span className="block truncate text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">{meta}</span>
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
