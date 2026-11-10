"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useTheme } from "@/context/ThemeContext";
import { BATTERY, configureRiveRuntime } from "@/lib/rive/runtime";
import { riveSource } from "@/lib/rive/riveCache";

const BATTERY_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** The battery collectible shown on game platforms, using the app's battery Rive artboard. */
export function PlatformBattery({ className = "" }: { className?: string }) {
  const darkTheme = useTheme().theme === "dark";
  const { rive, RiveComponent } = useRive({
    ...riveSource(BATTERY.src),
    artboard: BATTERY.artboard,
    stateMachines: BATTERY.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: BATTERY_LAYOUT,
  });

  useEffect(() => {
    const level = rive?.viewModelInstance?.number(BATTERY.levelProperty);
    if (level) level.value = 60;
    const dark = rive?.viewModelInstance?.boolean(BATTERY.darkThemeProperty);
    if (dark) dark.value = darkTheme;
  }, [rive, darkTheme]);

  return <RiveComponent aria-hidden className={className} style={{ width: "100%", height: "100%" }} />;
}

configureRiveRuntime();
