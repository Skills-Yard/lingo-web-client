"use client";

import { useMemo, useSyncExternalStore } from "react";

/** Event reminders the learner has set, kept in the browser's local storage
 * (a static, client-side cache for now — nothing is sent anywhere). */
const KEY = "lingo_event_reminders";

export type Reminder = {
  id: string;
  title: string;
  /** When it is, and what kind of event, as shown in the notifications. */
  meta: string;
};

const listeners = new Set<() => void>();

const readRaw = (): string => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

const parse = (raw: string): Reminder[] => {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as Reminder[]) : [];
  } catch {
    return [];
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

/** Sets (`on`) or clears the reminder for an event. */
export const setReminder = (reminder: Reminder, on: boolean) => {
  const rest = parse(readRaw()).filter((r) => r.id !== reminder.id);
  const next = on ? [...rest, reminder] : rest;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the reminder just isn't kept.
  }
  listeners.forEach((listener) => listener());
};

/** The reminders set so far, live across screens. */
export const useReminders = (): Reminder[] => {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  return useMemo(() => parse(raw), [raw]);
};
