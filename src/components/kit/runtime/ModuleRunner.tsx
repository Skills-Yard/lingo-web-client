"use client";

import { createElement } from "react";
import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { playable } from "./modules";
import { resolveName } from "./registry";
import { ScreenRunner } from "./ScreenRunner";
import { isStaged } from "./schema";

/**
 * A module played from its data file: the screen for `step` (`1`, `2`... or `complete`). A screen made of
 * stages goes to `ScreenRunner`; a screen that is one whole component of the app (a recap) is drawn as that component.
 */
export function ModuleRunner({ id, step }: { id: string; step: string }) {
  const mod = playable(id);
  if (!mod) return null;
  if (step === "complete") return <LessonCompleteScreen level={mod.data.level} accuracy={mod.scoring.accuracy} />;
  const screen = mod.data.screens[step];
  if (!screen) return null;
  if (!isStaged(screen)) {
    const component = resolveName(screen.component);
    return component ? createElement(component as () => React.ReactNode) : null;
  }
  return <ScreenRunner key={step} mod={mod} screen={screen} />;
}
