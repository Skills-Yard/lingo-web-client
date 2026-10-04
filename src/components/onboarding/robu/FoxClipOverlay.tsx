"use client";

import { useEffect, useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive as RiveInstance } from "@rive-app/canvas";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

export const FOX_CLIP_FADE_IN_MS = 140;
export const FOX_CLIP_FADE_OUT_MS = 320;
const FADE_IN_MS = FOX_CLIP_FADE_IN_MS;
const FADE_OUT_MS = FOX_CLIP_FADE_OUT_MS;
const START_RETRY_MS = 100;

interface FoxClipOverlayProps {
  src: string;
  artboard: string;
  /** Plays this state machine from mount (the hi fox's "Zox_Main"). Leave out
   * for a fox that only plays clips by name. */
  stateMachine?: string;
  /** Bind the file's view model on load. */
  autoBind?: boolean;
  /** This fox's artboard size, with `matchArtboard` (the main fox's): the
   * canvas is sized so the character draws at exactly the main fox's scale. */
  artboardSize?: { width: number; height: number };
  matchArtboard?: { width: number; height: number };
  /** Change to a new non-zero number to play; 0 puts it away. */
  playId: number;
  /** Play the `playId` it mounts with too (otherwise only later changes). */
  playOnMount?: boolean;
  /** Wait this long after `playId` changes before starting. */
  delayMs?: number;
  /** How long the turn lasts before it fades back out. */
  holdMs: number;
  /** Starts the clip. Returns false if it can't yet (not ready) — retried. */
  start: (rive: RiveInstance) => boolean;
  /** Follows whether it's faded in — so the caller can hide the fox beneath
   * (this one replaces it, rather than showing through its gaps). */
  onShownChange?: (shown: boolean) => void;
  /** Called once it has faded back out. */
  onDone?: () => void;
}

/**
 * A second fox (the hi wave's `zox-2`) laid exactly over the main one, faded in
 * for a one-off clip and faded out after — so the swap in and back out is a
 * short crossfade onto the same pose instead of a cut. The main fox keeps
 * idling underneath, so the fade-out lands on a live idle. `onDone` fires once
 * it's gone, so the caller can unmount it.
 */
export function FoxClipOverlay({
  src,
  artboard,
  stateMachine,
  autoBind = false,
  artboardSize,
  matchArtboard,
  playId,
  playOnMount = false,
  delayMs = 0,
  holdMs,
  start,
  onShownChange,
  onDone,
}: FoxClipOverlayProps) {
  const { rive, RiveComponent } = useRive({
    src,
    artboard,
    autoBind,
    stateMachines: stateMachine,
    autoplay: Boolean(stateMachine),
    layout: LAYOUT,
  });
  const [shown, setShown] = useState(false);
  const lastPlayId = useRef(playOnMount ? 0 : playId);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    if (!rive) return;
    if (playId === 0) {
      lastPlayId.current = 0;
      clearTimers();
      setShown(false);
      return;
    }
    if (playId === lastPlayId.current) return;
    lastPlayId.current = playId;
    clearTimers();
    const attempt = () => {
      if (!start(rive)) {
        timers.current.push(window.setTimeout(attempt, START_RETRY_MS));
        return;
      }
      setShown(true);
      timers.current.push(
        window.setTimeout(() => {
          setShown(false);
          timers.current.push(window.setTimeout(() => onDone?.(), FADE_OUT_MS));
        }, holdMs),
      );
    };
    timers.current.push(window.setTimeout(attempt, delayMs));
    // start/stop are stable per call site; only a new playId should replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive, playId]);

  useEffect(() => clearTimers, []);

  useEffect(() => {
    onShownChange?.(shown);
  }, [shown, onShownChange]);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !artboardSize || !matchArtboard) return;
    const measure = () => {
      const scale = Math.min(
        box.clientWidth / matchArtboard.width,
        box.clientHeight / matchArtboard.height,
      );
      setSize({ width: artboardSize.width * scale, height: artboardSize.height * scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [artboardSize, matchArtboard]);

  const matching = Boolean(artboardSize && matchArtboard);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{
        opacity: shown ? 1 : 0,
        transition: `opacity ${shown ? FADE_IN_MS : FADE_OUT_MS}ms ease-in-out`,
      }}
    >
      <RiveComponent
        className={matching ? undefined : "h-full w-full"}
        style={matching ? { width: size?.width ?? 0, height: size?.height ?? 0, flexShrink: 0 } : undefined}
      />
    </div>
  );
}
