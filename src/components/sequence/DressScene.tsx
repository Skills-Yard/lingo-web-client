"use client";

import { SceneBackdrop } from "./SceneBackdrop";
import type { RoomDress } from "./SequenceRoom";

/** How long putting an item on takes, in seconds. */
export const HOP_SECONDS = 1;

/** Where an item is: on the rug, going on his feet, or on them. */
export type DressStage = "rug" | "hop" | "worn";

/**
 * The bedroom with the socks and shoes going on, one at a time, or (with `trySocks`)
 * him trying the socks over his shoes.
 */
export function DressScene({ socks, shoes, trySocks = false, happy = false }: { socks: DressStage; shoes: DressStage; trySocks?: boolean; happy?: boolean }) {
  const dress: RoomDress = trySocks ? "trySocks" : shoes !== "rug" ? "dressed" : socks !== "rug" ? "socks" : "bare";
  return <SceneBackdrop dress={dress} happy={happy} />;
}
