"use client";

import { Fragment, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BUTTON_BOTTOM_GAP, CTA_HEIGHT_WITH_HINT } from "@/components/level-one/ActionRow";
import { LevelOneShell } from "@/components/level-one/LevelOneShell";
import { MODULE_STEPS } from "@/lib/moduleFlow";
import { BUTTON } from "@/lib/rive/runtime";
import { FRAME_TOP_SHIFT, levelTwoHref, type TitleLines } from "./levelTwo";

type LevelTwoShellProps = Omit<ComponentProps<typeof LevelOneShell>, "step" | "total" | "onBack" | "children"> & {
  step: number;
  /** The picture behind the screen (see RobotBackdrop). */
  scene: ReactNode;
  children: ReactNode;
};

/**
 * The frame every Module 2 screen shares: Level 1's shell (header, battery,
 * bottom button row) with the robot behind it. `children` are laid out
 * in Figma's 390 x 844 frame (`stageTop` for what hangs from the top, `bottom`
 * for what stands on the button row): the shell scales that frame as one
 * piece, so it looks the same on every device.
 */
export function LevelTwoShell({ step, scene, children, ...shell }: LevelTwoShellProps) {
  const router = useRouter();
  return (
    <LevelOneShell
      step={step}
      total={MODULE_STEPS}
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
/** The drawn button's height, as a share of its box (the rest is empty margin). */
const BUTTON_DRAWN = BUTTON.face.bottom - BUTTON.face.top;

/** The button row's height (a CSS length): it follows its width (see ActionRow), which on a wide screen is capped at 450. */
const ROW_HEIGHT = `(min(var(--stage-w, 390px), 450px) - 12px) * ${BUTTON_RATIO}`;

/**
 * A CSS `bottom` that stands `gap` px above the shell's button: its drawn edge
 * is `BUTTON_BOTTOM_GAP` up from the bottom, and the drawn button is as tall as
 * the row allows. The row's height follows its width, which is capped on a wide
 * screen: so a fixed offset from Figma would run into the button there. With
 * `withHint` the main button (and the hint, which is as tall) is drawn at
 * `CTA_HEIGHT_WITH_HINT` of that height, standing on the same edge.
 */
export const aboveButtons = (gap: number, withHint = false) =>
  `calc(${BUTTON_BOTTOM_GAP}px + ${ROW_HEIGHT} * ${BUTTON_DRAWN * (withHint ? CTA_HEIGHT_WITH_HINT : 1)} + ${gap}px)`;

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

/** The soft blue-to-white wash behind the screens that have no robot (match them, flip the card). */
export function SoftBackdrop() {
  return <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#EAF3FF_0%,#F7FAFF_38%,#FFFFFF_100%)]" />;
}

/** Centres a row of the frame at `top` (stage px) — Hex and his line. */
export function CentredRow({ top: y, bottom, children }: { top?: number; bottom?: number | string; children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: y, bottom }}>
      {children}
    </div>
  );
}
