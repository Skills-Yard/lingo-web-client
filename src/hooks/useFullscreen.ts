"use client";

import { useSyncExternalStore } from "react";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait") => Promise<void>;
};

/** "unavailable": no Fullscreen API (iPhone Safari) or already chromeless as
 * an installed PWA — there's nothing for a toggle to do. */
type FullscreenState = "unavailable" | "off" | "on" | "ios";

/** iPhone/iPad Safari has no Fullscreen API for pages; its button opens the
 * "Add to Home Screen" guide instead (see InstallHint). */
export const SHOW_INSTALL_GUIDE_EVENT = "lingo:show-install-guide";

const CHROMELESS_DISPLAY_MODES = ["(display-mode: fullscreen)", "(display-mode: standalone)"];

export const isIosDevice = () => {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
};

export const isStandalone = () =>
  CHROMELESS_DISPLAY_MODES.some((query) => window.matchMedia(query).matches);

export async function enterFullscreen() {
  if (document.fullscreenElement) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    await (screen.orientation as LockableOrientation).lock?.("portrait");
  } catch {
    // Denied or unsupported — the app works the same without fullscreen.
  }
}

function toggleFullscreen() {
  if (getSnapshot() === "ios") {
    window.dispatchEvent(new Event(SHOW_INSTALL_GUIDE_EVENT));
    return;
  }
  if (!document.fullscreenElement) return enterFullscreen();
  return document.exitFullscreen().catch(() => {
    // Already left (Esc, back gesture) between the tap and this call.
  });
}

// Checked before the display mode: some browsers report
// `display-mode: fullscreen` while the Fullscreen API is active, which would
// otherwise hide the toggle exactly when it's needed to exit.
function getSnapshot(): FullscreenState {
  if (document.fullscreenElement) return "on";
  if (isStandalone()) return "unavailable";
  if (!document.fullscreenEnabled) return isIosDevice() ? "ios" : "unavailable";
  return "off";
}

const getServerSnapshot = (): FullscreenState => "unavailable";

// The display-mode queries are watched too, so a snapshot taken mid-exit
// (fullscreen gone, display mode not yet updated) corrects itself.
function subscribe(onChange: () => void) {
  const queries = CHROMELESS_DISPLAY_MODES.map((query) => window.matchMedia(query));
  document.addEventListener("fullscreenchange", onChange);
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    queries.forEach((query) => query.removeEventListener("change", onChange));
  };
}

/** Whether the page is fullscreen, kept in sync however it's left — the
 * toggle, Esc or the Android back gesture. Browsers only allow entering from
 * a user gesture, so `toggle` must be called from a tap/click handler. */
export function useFullscreen() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { available: state !== "unavailable", active: state === "on", toggle: toggleFullscreen };
}
