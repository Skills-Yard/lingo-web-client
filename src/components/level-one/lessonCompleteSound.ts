"use client";

import { isClickSoundMuted } from "@/components/onboarding/clickSound";

let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
};

/** One short note: a sine that starts at `frequency` and glides to `glideTo`. */
const blip = (frequency: number, glideTo: number, seconds: number, volume: number, startIn = 0) => {
  if (isClickSoundMuted()) return;
  try {
    const audio = getContext();
    if (!audio) return;
    const start = audio.currentTime + startIn;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  } catch {
    // No audio on this device: the screen just plays silently.
  }
};

/** A line arriving: a soft rising pop. */
export const playLinePop = () => blip(520, 880, 0.14, 0.18);

/** A number ticking up: a tiny, higher tick; `step` raises the pitch a little as it climbs. */
export const playCountTick = (step = 0) => blip(900 + step * 18, 1100 + step * 18, 0.05, 0.07);

/** The lesson being completed: a rising three-note chime. */
export const playCompleteChime = () => {
  blip(523, 523, 0.22, 0.16);
  blip(659, 659, 0.22, 0.16, 0.1);
  blip(784, 784, 0.4, 0.18, 0.2);
};
