"use client";

import { motion } from "framer-motion";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";

/*
 * The "tray" look of a 3D question (Figma `sequence_3` and `sequence_7`): the answers stand on a
 * grey tray that runs down behind the main button. The hint is the regular one, beside the main
 * button (the Figma's yellow bulb tile is not used). The tray's and the answers' heights follow the
 * main button's top (`aboveButtons`, which knows the shorter button the hint makes), so they map
 * the same on every device: the whole 390 x 844 frame is scaled as one piece by the shell.
 */

/** The gap kept between the answers' foot and the main button. */
export const TRAY_CARD_GAP = 6;

/** What stands on the tray: how tall it is (px), and how far the tray's top edge is over it. */
export type TrayStand = { height: number; lip: number };

/** Two 166 x 187 cards side by side (Figma `sequence_3`), with about 37 of tray above them (measured from the design's frame; the CSS's own 2 puts them against the tray's edge). */
export const TRAY_PAIR: TrayStand = { height: 187, lip: 37 };

/** Three 112 x 119 cards side by side, 8 apart (Figma "Frame 240"), with the same 37 of tray above them as the pair. */
export const TRAY_TRIO: TrayStand = { height: 119, lip: 37 };

/**
 * The tray look's character: head and chest close up (see `PortraitFraming`), its box from
 * Figma `top` 60 for this tall, which puts the head's top at about 198 (the title ends at 154);
 * it carries on behind the tray, which is see-through at its top edge (as in the design), and
 * only fades out (percent of its height) low down, under the answers, so it does not depend on
 * where the tray's top is on a given screen's height.
 */
export const TRAY_CHARACTER = { top: 60, height: 690, fade: [84, 96] } as const;

/** Three rows 76 tall (Figma `sequence_7`: 358 wide, 16 in from each side), the tray 40 over the first. They are `OPTION_GAP` apart: the design's 6 looked too close (asked for 2026-11-22). */
export const TRAY_LIST_ROW = 76;
export const TRAY_LIST_WIDTH = 358;
/** The space (px) between the rows of a list of answers on the 3D route. */
export const OPTION_GAP = 12;
export const TRAY_LIST: TrayStand = { height: 3 * TRAY_LIST_ROW + 2 * OPTION_GAP, lip: 40 };

/** How far the tray's top edge is over the main button's top (px, added to `aboveButtons(TRAY_CARD_GAP)`). */
export const trayRise = ({ height, lip }: TrayStand) => height + lip;

/** The tray's top edge, as a CSS `bottom` from the stage's bottom. */
const trayEdge = (stand: TrayStand, withHint: boolean) => `${aboveButtons(TRAY_CARD_GAP, withHint)} + ${trayRise(stand)}px`;

/** The grey tray: a sheet with rounded top corners, lighter at its top edge. It goes once the answer is checked (the result panel takes its place). */
export function AnswerTray({ shown, gone, stand = TRAY_PAIR, withHint = false }: { shown: boolean; gone: boolean; stand?: TrayStand; withHint?: boolean }) {
  // Not in the 390 px `Column`: the stage is as wide as the device, so the tray runs from one edge of the screen to the other.
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ opacity: shown && !gone ? 1 : 0, y: shown ? 0 : 120 }}
      transition={{ type: "spring", stiffness: 110, damping: 16 }}
      className="absolute inset-x-0 bottom-0 rounded-t-[38px] bg-[linear-gradient(180deg,rgba(216,216,216,0.5)_0%,#D8D8D8_84.64%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.1)_84.64%)]"
      style={{ height: `calc(${trayEdge(stand, withHint)})` }}
    />
  );
}
