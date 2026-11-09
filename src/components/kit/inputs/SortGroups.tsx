"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { feelTap } from "../feel";
import { STATE_CARD, TINT } from "../tokens";
import type { Tint } from "../types";

export type SortItem = { id: string; text: string };
export type SortBucket = { id: string; label: string; tint?: Tint };

export type SortGroupsProps = {
  items: readonly SortItem[];
  buckets: readonly SortBucket[];
  /** Where each placed item is: item id → bucket id. Items not in it are still in the tray. */
  placed: Readonly<Record<string, string>>;
  /** An item is put in a bucket, or (`null`) taken back out. */
  onPlace: (itemId: string, bucketId: string | null) => void;
  /** The right bucket of each item (item id → bucket id): once `checked`, placed items are marked right or wrong. */
  answers?: Readonly<Record<string, string>>;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
};

function Chip({ item, state, onPress }: { item: SortItem; state: "idle" | "selected" | "correct" | "wrong"; onPress?: () => void }) {
  return (
    <motion.button
      type="button"
      disabled={!onPress}
      onClick={onPress}
      animate={{ scale: state === "selected" ? 1.08 : 1 }}
      whileTap={onPress ? { scale: 0.95 } : undefined}
      className={`pointer-events-auto rounded-[8px] border-[3px] px-3 py-2 text-[14px] leading-5 font-semibold text-[#444444] shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-colors disabled:cursor-default enabled:cursor-pointer dark:text-white ${
        state === "idle" ? "border-white bg-[#E5EFFD] dark:border-transparent dark:bg-[#15233A]" : state === "selected" ? "border-[#5B9BFF] bg-[#E5EFFD] dark:bg-[#15233A]" : STATE_CARD[state]
      }`}
    >
      {item.text}
    </motion.button>
  );
}

/**
 * Sort things into groups by tapping: tap an item in the tray, then tap the group it belongs
 * in. Tap a placed item to take it back. (Nothing is dragged, so it works the same with a finger,
 * a mouse and a keyboard.)
 */
export function SortGroups({ items, buckets, placed, onPlace, answers, checked = false, disabled = false, className = "" }: SortGroupsProps) {
  const [holding, setHolding] = useState<string | null>(null);
  const locked = disabled || checked;
  const tray = items.filter((item) => placed[item.id] === undefined);
  const stateOf = (item: SortItem) => (checked && answers ? (answers[item.id] === placed[item.id] ? "correct" : "wrong") : "idle");

  return (
    <div className={`flex w-full flex-col gap-4 ${className}`}>
      <div className="flex min-h-12 flex-wrap justify-center gap-2" aria-label="Items to sort">
        {tray.map((item) => (
          <Chip
            key={item.id}
            item={item}
            state={holding === item.id ? "selected" : "idle"}
            onPress={
              locked
                ? undefined
                : () => {
                    feelTap();
                    setHolding(holding === item.id ? null : item.id);
                  }
            }
          />
        ))}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(buckets.length, 3)}, minmax(0, 1fr))` }}>
        {buckets.map((bucket) => {
          const inside = items.filter((item) => placed[item.id] === bucket.id);
          const receiving = holding !== null && !locked;
          return (
            <div
              key={bucket.id}
              role="button"
              tabIndex={receiving ? 0 : -1}
              aria-label={`${bucket.label}${receiving ? ": put the chosen item here" : ""}`}
              onClick={() => {
                if (!holding || locked) return;
                feelTap();
                onPlace(holding, bucket.id);
                setHolding(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && holding && !locked) {
                  onPlace(holding, bucket.id);
                  setHolding(null);
                }
              }}
              className={`pointer-events-auto flex min-h-[120px] flex-col items-center gap-2 rounded-[8px] border-4 p-2 ${TINT[bucket.tint ?? "white"]} ${
                receiving ? "cursor-pointer border-dashed border-[#5B9BFF]" : "border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent"
              }`}
            >
              <span className="text-[14px] leading-5 font-bold text-[#444444] dark:text-white">{bucket.label}</span>
              {inside.map((item) => (
                <Chip
                  key={item.id}
                  item={item}
                  state={stateOf(item)}
                  onPress={
                    locked
                      ? undefined
                      : () => {
                          feelTap();
                          onPlace(item.id, null);
                        }
                  }
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
