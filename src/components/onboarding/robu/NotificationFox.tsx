"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_POINT_ANIMATION,
  ZOX_TAB_POINT_EYES_ANIMATION,
} from "@/lib/rive/runtime";

configureRiveRuntime();

// The eyes clip starts this long after the pointing one.
const EYES_DELAY_MS = 1500;

const LAYOUT =new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/** Zox pointing down at the Allow button (NotificationPermissionScreen). */
export function NotificationFox({ className }: { className?: string }) {
  const { rive, RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    animations: ZOX_TAB_POINT_ANIMATION,
    autoplay: true,
    layout: LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;
    const timer = setTimeout(
      () => rive.play(ZOX_TAB_POINT_EYES_ANIMATION),
      EYES_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [rive]);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
