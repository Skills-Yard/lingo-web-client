"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED_SMALL } from "@/components/ui/raised";
import { useLevelMuted } from "@/components/level-one/levelMuted";
import { vibrateForTap } from "@/lib/haptics";

/** Shown until the clip has told its own length. */
const DEFAULT_SECONDS = 4;
/** How many bars are lit before the clip is played. */
const RESTING_BARS = 6;
/** The waveform's bars (heights in px). */
const BARS = [10, 18, 26, 14, 22, 30, 16, 24, 12, 28, 18, 10, 22, 16, 26, 12, 20, 28, 14, 22, 10, 18, 24, 12, 16];
/** How often a played-out stand-in clip moves on. */
const STAND_IN_STEP_MS = 100;

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.ceil(seconds) % 60).padStart(2, "0")}`;

type AudioPlayerProps = {
  src: string;
  /**
   * For a clip that isn't recorded yet: when the file can't be played, Play still
   * runs for this many seconds, so what follows the clip (see `onProgress`) can be
   * seen working. Without it, a missing clip leaves Play where it was.
   */
  standInSeconds?: number;
  /** Told how far (0-1) the clip has played, as it plays, and 1 when it has ended. */
  onProgress?: (fraction: number) => void;
};

/**
 * Figma's voice-clip pill: a teal play button, the waveform (filled up to
 * where the clip is) and its length. Tapping plays / pauses the clip; the
 * time counts down while it plays.
 */
export function AudioPlayer({ src, standInSeconds, onProgress }: AudioPlayerProps) {
  const [muted] = useLevelMuted();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const standIn = useRef<number | null>(null);
  const positionRef = useRef(0);
  const progressRef = useRef(onProgress);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(standInSeconds ?? DEFAULT_SECONDS);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  const move = (seconds: number, length: number) => {
    positionRef.current = seconds;
    setPosition(seconds);
    progressRef.current?.(length > 0 ? Math.min(1, seconds / length) : 0);
  };

  const stopStandIn = () => {
    if (standIn.current !== null) window.clearInterval(standIn.current);
    standIn.current = null;
  };

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;
    const onMeta = () => Number.isFinite(audio.duration) && audio.duration > 0 && setDuration(audio.duration);
    const onTime = () => move(audio.currentTime, audio.duration || DEFAULT_SECONDS);
    const onEnd = () => {
      setPlaying(false);
      setPosition(0);
      positionRef.current = 0;
      progressRef.current?.(1);
    };
    const onError = () => {
      if (standIn.current === null) setPlaying(false);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
      stopStandIn();
    };
    // `move` only reads refs and setters.
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  /** Plays the length the clip is meant to have, with no sound, from where it was left. */
  const playStandIn = (length: number) => {
    stopStandIn();
    setDuration(length);
    setPlaying(true);
    const startedAt = Date.now() - positionRef.current * 1000;
    standIn.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      if (seconds < length) {
        move(seconds, length);
        return;
      }
      stopStandIn();
      setPlaying(false);
      setPosition(0);
      positionRef.current = 0;
      progressRef.current?.(1);
    }, STAND_IN_STEP_MS);
  };

  const toggle = () => {
    playClickSound();
    vibrateForTap();
    if (playing) {
      audioRef.current?.pause();
      stopStandIn();
      setPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    // A missing / blocked clip just leaves the button where it was, unless it has a stand-in.
    audio.play().then(
      () => setPlaying(true),
      () => (standInSeconds ? playStandIn(standInSeconds) : setPlaying(false)),
    );
  };

  // Resting, the first few bars are lit (as in Figma); playing, up to where the clip is.
  const lit = playing || position > 0 ? Math.round((position / duration) * BARS.length) : RESTING_BARS;
  return (
    <div className="pointer-events-auto flex h-[69px] w-[284px] items-center gap-3.5 rounded-full border border-[#E7ECEF] bg-white pr-5 pl-3 shadow-[0_2px_10px_rgba(31,42,68,0.08)] dark:border-white/10 dark:bg-[#15181E]">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#08A4AD] text-white ${RAISED_SMALL} ${EDGE.teal}`}
      >
        {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white" />}
      </button>
      <div aria-hidden className="flex h-8 flex-1 items-center justify-between">
        {BARS.map((height, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-colors duration-150 ${i < lit ? "bg-[#08A4AD]" : "bg-[#D5DADF] dark:bg-white/20"}`}
            style={{ height }}
          />
        ))}
      </div>
      <span className="w-9 shrink-0 text-right text-[13px] leading-none font-medium text-[#888888] tabular-nums dark:text-white/60">
        {formatTime(playing ? duration - position : duration)}
      </span>
    </div>
  );
}
