"use client";

import { useCallback, useEffect, useRef } from "react";

type VoiceOptions = {
  /** The clip of the animation now playing; none when it has no voice. */
  src: string | undefined;
  /** Bumped each time the animation starts, so the voice starts again from its first word. */
  runToken: number;
  playing: boolean;
  /** The clip has played to its end, or couldn't be played (`failed`). */
  onEnded: (failed: boolean) => void;
};

/** A `play()` cut short by a `pause()` or a new clip is not a failure. */
const isInterruption = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/**
 * Plays the voice that goes with the animation: from its start when the animation
 * starts, stopped when another takes over, paused while the page is paused.
 *
 * One audio element is kept for the whole page: a browser that only lets sound
 * start from a tap (iPhones) lets an element it has played once play again later,
 * which "Play all" needs for a voice that comes long after the tap. `prime` is
 * that first play, silent, to be called from the tap.
 */
export const useVoice = ({ src, runToken, playing, onEnded }: VoiceOptions) => {
  const element = useRef<HTMLAudioElement | null>(null);
  const latest = useRef({ src, playing, onEnded });
  useEffect(() => {
    latest.current = { src, playing, onEnded };
  });

  useEffect(() => {
    if (!src) return;
    const audio = (element.current ??= new Audio());
    if (audio.getAttribute("src") === src) audio.currentTime = 0;
    else audio.src = src;

    const handleEnded = () => latest.current.onEnded(false);
    const handleFailed = () => latest.current.onEnded(true);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleFailed);
    if (latest.current.playing) {
      audio.play().catch((error: unknown) => {
        if (!isInterruption(error)) handleFailed();
      });
    }

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleFailed);
      audio.pause();
    };
  }, [src, runToken]);

  // Pausing and resuming the page pauses and resumes the voice. (Starting one is the effect above.)
  useEffect(() => {
    const audio = element.current;
    if (!audio || !latest.current.src) return;
    if (!playing) {
      audio.pause();
      return;
    }
    audio.play().catch((error: unknown) => {
      if (!isInterruption(error)) latest.current.onEnded(true);
    });
  }, [playing]);

  const prime = useCallback((clip: string | undefined) => {
    if (!clip) return;
    const audio = (element.current ??= new Audio());
    audio.src = clip;
    audio.muted = true;
    const unmute = () => {
      audio.muted = false;
    };
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      unmute();
    }, unmute);
  }, []);

  return { prime };
};
