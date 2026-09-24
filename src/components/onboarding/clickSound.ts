"use client";

const CLICK_SRC = "/audios/click-sound.mpeg";

// One shared, preloaded element; each click plays a clone of it, so quick
// repeat taps overlap instead of cutting each other off (clones reuse the
// already-downloaded file).
let base: HTMLAudioElement | null = null;
let muted = false;

function getBase(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!base) {
    base = new Audio(CLICK_SRC);
    base.preload = "auto";
  }
  return base;
}

/** Starts downloading the click sound so the first tap isn't silent/late. */
export function preloadClickSound(): void {
  getBase()?.load();
}

/** Follows the onboarding header's sound toggle (see OnboardingFlow). */
export function setClickSoundMuted(value: boolean): void {
  muted = value;
}

/** The tap feedback for answer options and the CTA buttons. */
export function playClickSound(): void {
  if (muted) return;
  const source = getBase();
  if (!source) return;
  const click = source.cloneNode() as HTMLAudioElement;
  click.play().catch(() => {});
}
