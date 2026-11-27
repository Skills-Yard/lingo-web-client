"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CharacterPortrait } from "@/components/character3d/CharacterPortrait";
import { useLevelVoice } from "@/components/level-one/LevelVoice";
import { HEX_SLOT } from "@/components/level-two/HexBubble";

/*
 * The 3D character's face in a small rounded box, where Hex stands beside his bubble on
 * the screens that copy the original module's (see `HexStandIn`). It is the shared canvas
 * (`CharacterPortrait`) at a size that makes the head fill the box: the canvas shows the
 * character head to toe, 2.06 m over its height, so a slot this tall shows about 0.55 m
 * (head and shoulders) in `HEX_SLOT` px, and it is moved up so the top of the head is near
 * the box's top. The rest is cut off by the box.
 */

/**
 * The slot's height and its top (over the box's top). `full`: the canvas's 2.06 m of height at 200 px a metre, the head starting 0.23 m
 * under the canvas's top. `face` (the closer camera, see `PortraitFraming`): the canvas's 1.0 m of height at 200 px a metre, so the 94 px
 * inside the box show about 0.47 m: the head (hair to chin, about 0.33 m, measured on the three characters) over the box's middle, a hair's
 * breadth under its top, and the neck and collar below it.
 */
const SLOTS = { full: { height: 412, top: -34 }, face: { height: 201, top: -53 } } as const;

/** The talking pill's dots, light to green, as in the design. */
const DOT_COLORS = ["#D5D9E3", "#9BD92A", "#01A17F"] as const;
/** One pulse of a dot (s), and how far behind the one before it the next starts. */
const DOT_PULSE_S = 0.9;
const DOT_STAGGER_S = 0.18;

/** `framing` "face" fills the box with the face (the Command module's); the default is the head and shoulders cropped from the full-length picture. */
export function CharacterAvatar({ framing = "full" }: { framing?: "full" | "face" }) {
  const { speaking } = useLevelVoice();
  const slot = SLOTS[framing];
  return (
    <div
      className="relative overflow-hidden rounded-[26px] border-[3px] border-white bg-[linear-gradient(160deg,#DDF6F4_0%,#E4E7FD_100%)] shadow-[0_3px_0_rgba(1,161,127,0.5)] dark:border-[#818185] dark:bg-[linear-gradient(160deg,#17353A_0%,#1F2347_100%)]"
      style={{ width: HEX_SLOT - 10, height: HEX_SLOT - 10, margin: 5 }}
    >
      <div className="absolute inset-x-0" style={{ top: slot.top, height: slot.height }}>
        <CharacterPortrait animationId={speaking ? "talking" : "idle-b"} lipSync={speaking} framing={framing === "face" ? "face" : "full"} />
      </div>
      <AnimatePresence>{speaking && <TalkingDots />}</AnimatePresence>
    </div>
  );
}

/** A small pill at the box's bottom left while the voice plays: three dots that swell one after the other. */
function TalkingDots() {
  return (
    <motion.div
      aria-hidden
      className="absolute bottom-2 left-2 flex items-center gap-0.75 rounded-full bg-white px-1.75 py-1.25 shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:bg-[#1A1C22]"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.15 }}
      style={{ transformOrigin: "0% 100%" }}
    >
      {DOT_COLORS.map((color, i) => (
        <motion.span
          key={color}
          className="block size-1.75 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: DOT_PULSE_S, repeat: Infinity, ease: "easeInOut", delay: i * DOT_STAGGER_S }}
        />
      ))}
    </motion.div>
  );
}
