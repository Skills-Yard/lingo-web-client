"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { CARD_LOOK, EDGE_READING, TINTS, type GroupTint } from "./look";
import type { InteractionApi } from "./screen";

export type TourGroup = {
  id: string;
  name: string;
  tint: GroupTint;
  /** The colour of the group's name (a text colour class). */
  ink: string;
  values: readonly string[];
  /** What Hex says about the group once it is tapped. */
  caption: string;
  /** Where Hex stands once it is tapped: under the group, at its side (`left`, `right`) or centred above his bubble. */
  hex: "left" | "center" | "right";
};

/** Hex's row, below the groups: his slot (beside his bubble, or with it under him), so the groups don't move when he arrives. */
const HEX_ROW_H = { beside: 110, stacked: 190 } as const;
const ENTRY_KEY = "datatypes-groups-tour";

/** How Hex stands for a group's place: the side of the bubble he is on, and where in the row they sit. */
const HEX_PLACE = {
  left: { side: "left", row: "justify-start" },
  center: { side: "top", row: "justify-center" },
  right: { side: "right", row: "justify-end" },
} as const;

/** Hex's bubble width by the length of his line, as on the other screens. */
const bubbleWidth = (line: string) => (line.length <= 50 ? 190 : 240);

/**
 * "Information can differ!": three groups of values stand side by side, each under
 * a coloured name. The learner taps a group: it is outlined, Hex's line above
 * goes away, and Hex speaks from below the groups about what that group tells
 * us, standing under the group (each group has its own place for him). It is
 * done once every group has been read.
 */
export function GroupTourStage({ api, groups }: { api: InteractionApi; groups: readonly TourGroup[] }) {
  const { done, dismissHex } = api;
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const shown = groups.find((group) => group.id === current);
  const place = shown ? HEX_PLACE[shown.hex] : null;
  const hexRowHeight = groups.some((group) => group.hex === "center") ? HEX_ROW_H.stacked : HEX_ROW_H.beside;

  useEffect(() => {
    if (seen.length < groups.length) return;
    const timer = window.setTimeout(() => done(), 700);
    return () => window.clearTimeout(timer);
  }, [seen, groups.length, done]);

  const read = (id: string) => {
    playClickSound();
    vibrateForTap();
    dismissHex();
    setCurrent(id);
    setSeen((now) => (now.includes(id) ? now : [...now, id]));
  };

  return (
    <div className="pointer-events-auto flex w-[354px] flex-col">
      <div className="grid grid-cols-3">
        {groups.map((group) => {
          const reading = current === group.id;
          return (
            <motion.button
              key={group.id}
              type="button"
              aria-pressed={reading}
              aria-label={`${group.name}: ${group.values.join(", ")}`}
              onClick={() => read(group.id)}
              animate={{ scale: reading ? [1, 0.96, 1.03, 1] : 1 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              // 118 wide: the 104px cards, the outline and a little air each side.
              className={`flex w-[118px] cursor-pointer flex-col items-center gap-[18px] rounded-[12px] border-2 px-[5px] py-[7px] transition-colors ${
                reading ? `${EDGE_READING} bg-white/50 dark:bg-white/5` : "border-transparent"
              }`}
            >
              {/* The group's name box: 90 x 40, 8px radius, Poppins 600 16px. */}
              <span className={`flex h-10 w-[90px] items-center justify-center rounded-[8px] text-[16px] leading-none font-semibold ${TINTS[group.tint]} ${group.ink}`}>{group.name}</span>
              <span className="flex flex-col gap-[14px]">
                {group.values.map((value, position) => (
                  // A value can repeat in a group (Yes, No, Yes), so its place is its key.
                  <span key={position} className={`${CARD_LOOK} ${TINTS[group.tint]} border-white dark:border-transparent`}>
                    <span className="text-[16px] leading-[110%] font-semibold text-[#444444] dark:text-white">{value}</span>
                  </span>
                ))}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Hex's own row is kept free from the start, so the groups stay where they are when he arrives. */}
      <div className={`mt-1 flex items-start ${place?.row ?? ""}`} style={{ height: hexRowHeight }}>
        {/* Keyed by where he stands, so he comes in afresh when he moves to another group's side. */}
        {shown && place && <HexBubble key={place.side} entryKey={ENTRY_KEY} hex={place.side} line={[{ text: shown.caption }]} size={{ width: bubbleWidth(shown.caption) }} />}
      </div>
    </div>
  );
}
