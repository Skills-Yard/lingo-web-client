"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { feelTap } from "../feel";
import { Artboard, type ArtboardHandle, type ArtboardProps, type ArtboardSource } from "./Artboard";
import { ARTBOARDS, type ArtboardName } from "./presets";

export type LessonArtboardProps = Omit<ArtboardProps, keyof ArtboardSource | "ref"> &
  Partial<ArtboardSource> & {
    /** Which of the app's artboards to show (see `ARTBOARDS`): `robot-arm`, `bedroom-room`, `flip-card`, ... Or give `src` for a file of your own. */
    name?: ArtboardName;
    /** Makes the artboard tappable: each tap fires this trigger (the flip card's `Trigger 1`). */
    tapTrigger?: string;
    /** Called on each tap. */
    onTap?: () => void;
  };

/**
 * The Rive artboard shown at the centre of a screen. The data names which artboard to show, what to
 * set on it (`properties`) and what plays on it (`trigger`, or a tap). Give it a width; its height follows
 * the artboard's shape.
 */
export function LessonArtboard({ name, tapTrigger, onTap, properties, className = "", ...rest }: LessonArtboardProps) {
  const art = useRef<ArtboardHandle>(null);
  const preset: Partial<ArtboardSource> = name ? ARTBOARDS[name] : {};
  const source = { ...preset, ...rest, properties: { ...preset.properties, ...properties } };
  if (!source.src) return null;
  const artboard = <Artboard ref={art} {...(source as ArtboardSource)} className={tapTrigger ? "size-full" : className} />;
  if (!tapTrigger) return artboard;
  return (
    <motion.button
      type="button"
      aria-label="Tap the artboard"
      onClick={() => {
        feelTap();
        art.current?.fire(tapTrigger);
        onTap?.();
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.3 }, y: { type: "spring", stiffness: 140, damping: 16 } }}
      whileTap={{ scale: 0.98 }}
      className={`pointer-events-auto relative shrink-0 cursor-pointer ${className}`}
      style={source.size ? { aspectRatio: `${source.size.width} / ${source.size.height}` } : undefined}
    >
      {artboard}
    </motion.button>
  );
}
