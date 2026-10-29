"use client";

import { Fragment, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LevelOneShell } from "@/components/level-one/LevelOneShell";
import { FRAME_TOP_SHIFT, LEVEL_TWO_STEPS, levelTwoHref, type TitleLines } from "./levelTwo";

type LevelTwoShellProps = Omit<ComponentProps<typeof LevelOneShell>, "step" | "total" | "onBack" | "children"> & {
  step: number;
  /** The picture behind the screen (see RobotScene). */
  scene: ReactNode;
  children: ReactNode;
};

/**
 * The frame every Module 2 screen shares: Level 1's shell (header, battery,
 * bottom button row) with the robot picture behind it. `children` are laid out
 * in Figma's 390 x 844 frame (`stageTop` for what hangs from the top, `bottom`
 * for what stands on the button row): the shell scales that frame as one
 * piece, so it looks the same on every device.
 */
export function LevelTwoShell({ step, scene, children, ...shell }: LevelTwoShellProps) {
  const router = useRouter();
  return (
    <LevelOneShell
      step={step}
      total={LEVEL_TWO_STEPS}
      onBack={() => router.push(step > 1 ? levelTwoHref(step - 1) : "/level")}
      {...shell}
    >
      {scene}
      {/* The stage's whole frame, so a child can be placed by Figma's numbers.
        Only what is marked interactive takes taps. */}
      <div className="pointer-events-none absolute inset-0">{children}</div>
    </LevelOneShell>
  );
}

/** A Figma `top` (frame px) on this shell's stage — the header sits higher here than in Figma. */
export const stageTop = (figmaTop: number) => figmaTop - FRAME_TOP_SHIFT;

/** The shell's Button3D box is this tall for each px of its width (371 x 113). */
const BUTTON_RATIO = 113 / 371;
/** The empty band above the button's art, as a share of its box. */
const BUTTON_MARGIN_TOP = 0.17;

/**
 * A CSS `bottom` that stands `gap` px above the shell's button row. The row's
 * height follows its width (see ActionRow), which on a wide screen is capped
 * (450, or 560 with the hint): so a fixed offset from Figma would run into
 * the button there. With `withHint` it clears the hint button (80px tall,
 * centred in the row) instead of the main button's art.
 */
export const aboveButtons = (gap: number, withHint = false) =>
  withHint
    ? `calc(36px + (min(var(--stage-w, 390px), 560px) - 100px) * ${BUTTON_RATIO / 2} + 40px + ${gap}px)`
    : `calc(36px + (min(var(--stage-w, 390px), 450px) - 12px) * ${BUTTON_RATIO * (1 - BUTTON_MARGIN_TOP)} + ${gap}px)`;

/** The Figma title: Poppins 600 28px / 134%, #444444, centred; `at` is its Figma `top` (116). */
export function ScreenTitle({ children, at = 116 }: { children: ReactNode; at?: number }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.15 }}
      className="absolute w-[358px] text-center text-[28px] leading-[134%] font-semibold text-[#444444]"
      style={{ top: stageTop(at), left: "calc(50% - 179px)" }}
    >
      {children}
    </motion.h1>
  );
}

/** Teal part of a title (the app's gradient). */
export function Teal({ children }: { children: ReactNode }) {
  return <span className="text-level-gradient">{children}</span>;
}

/** A title's lines (`<br />` between them), its teal runs in the app's gradient;
 * `underline` draws the line under every run, in the run's own colour. */
export function TitleText({ lines, underline = false }: { lines: TitleLines; underline?: boolean }) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.map((span, j) =>
        span.teal ? (
          <span key={j} className={`text-level-gradient ${underline ? "underline decoration-[#04ACAB] decoration-2 underline-offset-[6px]" : ""}`}>
            {span.text}
          </span>
        ) : (
          <span key={j} className={underline ? "underline decoration-[#444444] decoration-2 underline-offset-[6px]" : undefined}>
            {span.text}
          </span>
        ),
      )}
    </Fragment>
  ));
}

/** The picture fading out to white under the text (the Figma "learn" screens). */
export function FadeToWhite() {
  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{ top: stageTop(470), background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 32%)" }}
    />
  );
}

/** Centres a row of the frame at `top` (stage px) — Hex and his line. */
export function CentredRow({ top: y, bottom, children }: { top?: number; bottom?: number; children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: y, bottom }}>
      {children}
    </div>
  );
}
