"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import { Column } from "./CharacterStage";

/*
 * The "tray" look of a 3D question (Figma `sequence_3` and `sequence_7`): the answers stand on a
 * grey tray that runs down behind the main button, and the hint is a bulb above the tray's
 * right end. Their heights follow the main button's top (`aboveButtons`), as the answers do.
 */

/** The gap kept between the answers' foot and the main button. */
export const TRAY_CARD_GAP = 6;
/** The bulb's size, and its gap over the tray. */
const BULB_SIZE = 60;
const BULB_GAP = 16;

/** What stands on the tray: how tall it is (px), and how far the tray's top edge is over it. */
export type TrayStand = { height: number; lip: number };

/** Two 166 x 187 cards side by side (Figma `sequence_3`). */
export const TRAY_PAIR: TrayStand = { height: 187, lip: 2 };

/** Three rows 76 tall, 6 apart (Figma `sequence_7`: 358 wide, 16 in from each side), the tray 40 over the first. */
export const TRAY_LIST_ROW = 76;
export const TRAY_LIST_WIDTH = 358;
export const TRAY_LIST: TrayStand = { height: 3 * TRAY_LIST_ROW + 2 * 6, lip: 40 };

/** How far the tray's top edge is over the main button's top (px, added to `aboveButtons(TRAY_CARD_GAP)`). */
export const trayRise = ({ height, lip }: TrayStand) => height + lip;

/** The tray's top edge, as a CSS `bottom` from the stage's bottom. */
const trayEdge = (stand: TrayStand) => `${aboveButtons(TRAY_CARD_GAP)} + ${trayRise(stand)}px`;

/** The grey tray: a sheet with rounded top corners, lighter at its top edge. It goes once the answer is checked (the result panel takes its place). */
export function AnswerTray({ shown, gone, stand = TRAY_PAIR }: { shown: boolean; gone: boolean; stand?: TrayStand }) {
  return (
    <Column>
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: shown && !gone ? 1 : 0, y: shown ? 0 : 120 }}
        transition={{ type: "spring", stiffness: 110, damping: 16 }}
        className="absolute inset-x-0 bottom-0 rounded-t-[38px] bg-[linear-gradient(180deg,rgba(216,216,216,0.5)_0%,#D8D8D8_84.64%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.1)_84.64%)]"
        style={{ height: `calc(${trayEdge(stand)})` }}
      />
    </Column>
  );
}

/** The hint: a light bulb in a white tile above the tray's right end. It folds away once used on (or the answer is checked). */
export function TrayHint({ visible, disabled, onPress, stand = TRAY_PAIR }: { visible: boolean; disabled: boolean; onPress: () => void; stand?: TrayStand }) {
  return (
    <Column>
      <motion.button
        type="button"
        aria-label="Hint"
        disabled={disabled || !visible}
        tabIndex={visible && !disabled ? 0 : -1}
        onClick={() => {
          playClickSound();
          onPress();
        }}
        initial={false}
        animate={visible ? { scale: 1, opacity: disabled ? 0.5 : 1 } : { scale: 0, opacity: 0 }}
        whileTap={disabled ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="pointer-events-auto absolute right-4 z-[2] flex cursor-pointer items-center justify-center rounded-[17px] bg-white shadow-[1px_1px_7.4px_rgba(0,0,0,0.14)] outline-none focus-visible:ring-2 focus-visible:ring-[#FF8D42] disabled:cursor-default dark:bg-[#22262E]"
        style={{ width: BULB_SIZE, height: BULB_SIZE, bottom: `calc(${trayEdge(stand)} + ${BULB_GAP}px)` }}
      >
        <Bulb />
      </motion.button>
    </Column>
  );
}

/** The light bulb (the Figma tile's emoji, drawn flat): a yellow glass with a bright core, over a grey cap. */
const Bulb = () => (
  <svg aria-hidden viewBox="0 0 23 37" width="23" height="37">
    <path fill="#FCD53F" d="M11.5 0C5.15 0 0 5.15 0 11.5c0 3.9 1.9 6.7 3.7 8.9 1.3 1.6 2 2.8 2 4.3V27h11.6v-2.3c0-1.5.7-2.7 2-4.3 1.8-2.2 3.7-5 3.7-8.9C23 5.15 17.85 0 11.5 0Z" />
    <path fill="#FFB02E" d="M8 17.5c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8V27H8v-9.5Z" />
    <path fill="#FFF478" d="M5 8.5C5.7 5.7 8 3.6 10.8 3.2 8.9 4.2 7.5 6 6.9 8.2 6.6 9.3 4.7 9.6 5 8.5Z" />
    <rect x="6" y="28" width="11" height="3.2" rx="1.6" fill="#D3D3D3" />
    <path fill="#9B9B9B" d="M8 32.2h7l-.6 2.6c-.2.9-1 1.5-1.9 1.5h-2c-.9 0-1.7-.6-1.9-1.5L8 32.2Z" />
  </svg>
);
