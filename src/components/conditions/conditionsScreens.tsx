"use client";

import type { ScreenDef } from "./screen";
import { SCREENS_A } from "./screensA";
import { SCREENS_B } from "./screensB";
import { SCREENS_C } from "./screensC";

/** Every screen that is a headline and stages (the PDF's screens 1-37; screen 38 is `NextScreen`). */
export const SCREENS: Readonly<Record<number, ScreenDef>> = { ...SCREENS_A, ...SCREENS_B, ...SCREENS_C };
