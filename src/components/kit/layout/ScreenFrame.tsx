"use client";

import type { ComponentProps, ReactNode } from "react";
import { GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { aboveButtons, LevelTwoShell, stageTop } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { COLUMN_W } from "@/lib/questionColumn";
import { Backdrop, type BackdropKind } from "./Backdrop";

/** Where a title starts on the stage (Figma's 116 less the header's room). */
const TITLE_TOP = stageTop(116);

/** How far (px) the body rises once a result sheet is up, so the sheet does not cover the answers. */
export const RESULT_LIFT = 180;

export type ScreenBodyProps = {
  /** Where the body starts, px down the stage (default: where a title starts). */
  top?: number;
  /** The gap (px) kept above the bottom buttons. */
  gap?: number;
  /** The screen has the hint button beside its main one (the buttons are drawn a little lower). */
  hint?: boolean;
  /** Raises the bottom of the body by this much (px), smoothly. Use `RESULT_LIFT` while a result sheet is showing. */
  lift?: number;
  /** Space (px) between the parts standing in the column (default 12). */
  spacing?: number;
  /** The body runs the whole width of the screen instead of the answers' column, so a part (Hex and his line) can be wider than the column. */
  full?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * The column a screen's parts stand in, one under the other: from the title's place down to
 * just above the buttons, as wide as the answers' column and centred. Use `Spacer` to push
 * the parts that belong at the bottom (the answers) down.
 */
export function ScreenBody({ top = TITLE_TOP, gap = GAP_ABOVE_BUTTONS, hint = false, lift = 0, spacing = 12, full = false, className = "", children }: ScreenBodyProps) {
  return (
    <div
      className={`absolute flex flex-col items-center transition-[bottom] duration-500 ease-out ${className}`}
      style={{ top, bottom: `calc(${aboveButtons(gap, hint)} + ${lift}px)`, ...(full ? { left: 0, right: 0 } : { left: COLUMN_LEFT, width: COLUMN_W }), gap: spacing }}
    >
      {children}
    </div>
  );
}

export type ScreenFrameProps = Omit<ComponentProps<typeof LevelTwoShell>, "scene" | "children" | "backdrop"> & {
  /** The picture behind everything: a built-in one, or your own node. */
  backdrop?: BackdropKind | ReactNode;
  /** Raises the bottom of the body (px) to make room for a result sheet: `RESULT_LIFT` while one is showing. */
  lift?: number;
  /** The gap (px) kept above the bottom buttons (default 28). */
  gap?: number;
  /** Space (px) between the parts standing in the column (default 12). */
  spacing?: number;
  /** The body runs the whole width of the screen (see `ScreenBody`). */
  full?: boolean;
  /** Leaves out the `ScreenBody` column: the children are placed by the caller on the 390 × 844 stage. */
  bare?: boolean;
  children: ReactNode;
};

/**
 * The frame every lesson screen stands in: the header (progress bar, battery, close), the
 * main button row at the bottom (with the hint beside it when `hint` is given), a backdrop and,
 * over everything, `overlay` — for result sheets and popups. The screen is laid out as a 390 × 844
 * stage and scaled as one piece, so it looks the same on every device. Give it the screen's
 * `voiceover` clips and Hex talks while they play.
 */
export function ScreenFrame({ backdrop = "soft", bare = false, lift = 0, gap, spacing, full, hint, children, ...shell }: ScreenFrameProps) {
  const scene = typeof backdrop === "string" ? <Backdrop kind={backdrop as BackdropKind} /> : backdrop;
  return (
    <LevelTwoShell hint={hint} scene={scene} {...shell}>
      {bare ? children : (
        <ScreenBody hint={!!hint} lift={lift} gap={gap} spacing={spacing} full={full}>
          {children}
        </ScreenBody>
      )}
    </LevelTwoShell>
  );
}
