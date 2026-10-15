"use client";

import { useEffect } from "react";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait") => Promise<void>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: fullscreen)").matches ||
  window.matchMedia("(display-mode: standalone)").matches;

/**
 * Browsers only allow fullscreen from a user gesture, so this enters it on
 * the learner's first tap. No-op when installed as a PWA (already chromeless)
 * or where the Fullscreen API is missing (iPhone Safari — install to the
 * home screen there instead).
 */
export function FullscreenOnFirstTap() {
  useEffect(() => {
    const root = document.documentElement;
    if (isStandalone() || !root.requestFullscreen) return;

    const enterFullscreen = async () => {
      if (document.fullscreenElement) return;
      try {
        await root.requestFullscreen({ navigationUI: "hide" });
        await (screen.orientation as LockableOrientation).lock?.("portrait");
      } catch {
        // Denied or unsupported — the app works the same without fullscreen.
      }
    };

    window.addEventListener("pointerup", enterFullscreen, { once: true });
    return () => window.removeEventListener("pointerup", enterFullscreen);
  }, []);

  return null;
}
