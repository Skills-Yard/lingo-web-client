"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_POINT_START_ANIMATION,
  ZOX_TAB_POINT_START_MS,
  ZOX_TAB_POINT_CLICKING_ANIMATION,
} from "@/lib/rive/runtime";

configureRiveRuntime();

// Zox stands still this long after arriving before the pointing starts.
const START_DELAY_MS = 1000;

const LAYOUT =new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/**
 * Zox pointing down at the Allow button (NotificationPermissionScreen): the
 * "start" clip plays first (after a one-second wait), then the looping "clicking" one takes over and
 * keeps playing. Nothing else (no face or eyes clip) plays.
 */
export function NotificationFox({ className }: { className?: string }) {
  const { rive, RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    autoplay: false,
    layout: LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;
    const clickingTimer = { current: 0 };
    const startTimer = setTimeout(() => {
      rive.play(ZOX_TAB_POINT_START_ANIMATION);
      clickingTimer.current = window.setTimeout(() => {
        rive.stop(ZOX_TAB_POINT_START_ANIMATION);
        rive.play(ZOX_TAB_POINT_CLICKING_ANIMATION);
      }, ZOX_TAB_POINT_START_MS);
    }, START_DELAY_MS);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(clickingTimer.current);
    };
  }, [rive]);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
