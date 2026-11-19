import { useSyncExternalStore } from "react";

// Lives outside React so the choice survives each screen remounting its shell.
let muted = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => muted;
const getServerSnapshot = () => false;

const toggleLevelMuted = () => {
  muted = !muted;
  listeners.forEach((listener) => listener());
};

/** The Level 1 sound toggle, shared by every screen in the level. */
export const useLevelMuted = () => {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [value, toggleLevelMuted] as const;
};
