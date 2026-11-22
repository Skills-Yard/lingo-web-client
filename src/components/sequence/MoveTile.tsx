"use client";

import { SlotImage } from "@/components/level-two/SlotImage";

/**
 * A move button on the Hex game screens (the user's Figma "game screen"): a flat 150.5 x 99 box (12px padding, 2px gap), the 52px arrow over
 * its label (500, 14px / 140%), no 3D edge; it presses in a little when tapped. The same design as the game screens on the user's other branches
 * (`MoveTile` in `level-one/MoveHexScreen.tsx` there, which this branch does not have). With `dim` it fades while it is disabled (a list that is
 * full, a run in progress); without, it keeps its look.
 */
export function MoveTile({ label, picture, look, disabled, dim = false, onPress }: { label: string; picture: string; look: string; disabled: boolean; dim?: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`pointer-events-auto flex h-[99px] w-[150.5px] flex-col items-center justify-center gap-0.5 rounded-lg p-3 text-[14px] leading-[140%] font-medium text-[#444444] transition-[transform,opacity] duration-100 enabled:cursor-pointer enabled:active:scale-[0.97] dark:text-white ${dim ? "disabled:opacity-50" : ""} ${look}`}
    >
      <SlotImage file={picture} className="size-[52px] max-h-none max-w-none shrink-0" />
      {label}
    </button>
  );
}
