"use client";

import { useEffect } from "react";
import { enterFullscreen, isStandalone } from "@/hooks/useFullscreen";

/** Full screen by default: browsers only allow it from a user gesture, so it
 * starts on the first tap anywhere. Skipped where there's no Fullscreen API
 * (iPhone Safari) or the app is already installed chromeless. */
export function AutoFullscreen() {
  useEffect(() => {
    if (!document.fullscreenEnabled || isStandalone()) return;
    const start = () => {
      window.removeEventListener("pointerup", start, true);
      void enterFullscreen();
    };
    window.addEventListener("pointerup", start, true);
    return () => window.removeEventListener("pointerup", start, true);
  }, []);
  return null;
}
