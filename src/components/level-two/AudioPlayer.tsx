"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { useLevelMuted } from "@/components/level-one/levelMuted";
import { vibrateForTap } from "@/lib/haptics";

/** The clip, in `public/audios/level-two/` — the player plays it once it is there. */
export const COMMAND_AUDIO = "/audios/level-two/meet-the-command.mp3";
/** Shown until the clip has told its own length. */
const DEFAULT_SECONDS = 4;
/** How many bars are lit before the clip is played. */
const RESTING_BARS = 6;
/** The waveform's bars (heights in px). */
const BARS = [10, 18, 26, 14, 22, 30, 16, 24, 12, 28, 18, 10, 22, 16, 26, 12, 20, 28, 14, 22, 10, 18, 24, 12, 16];

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.ceil(seconds) % 60).padStart(2, "0")}`;

/**
 * Figma's voice-clip pill: a teal play button, the waveform (filled up to
 * where the clip is) and its length. Tapping plays / pauses the clip; the
 * time counts down while it plays.
 */
export function AudioPlayer({ src }: { src: string }) {
  const [muted] = useLevelMuted();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_SECONDS);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;
    const onMeta = () => Number.isFinite(audio.duration) && audio.duration > 0 && setDuration(audio.duration);
    const onTime = () => setPosition(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setPosition(0);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", () => setPlaying(false));
    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    playClickSound();
    vibrateForTap();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    // A missing / blocked clip just leaves the button where it was.
    audio.play().then(() => setPlaying(true), () => setPlaying(false));
  };

  // Resting, the first few bars are lit (as in Figma); playing, up to where the clip is.
  const lit = playing || position > 0 ? Math.round((position / duration) * BARS.length) : RESTING_BARS;
  return (
    <div className="pointer-events-auto flex h-[69px] w-[284px] items-center gap-3.5 rounded-full border border-[#E7ECEF] bg-white pr-5 pl-3 shadow-[0_2px_10px_rgba(31,42,68,0.08)] dark:border-white/10 dark:bg-[#15181E]">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#08A4AD] text-white transition-transform active:scale-95"
      >
        {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white" />}
      </button>
      <div aria-hidden className="flex h-8 flex-1 items-center justify-between">
        {BARS.map((height, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-colors duration-150 ${i < lit ? "bg-[#08A4AD]" : "bg-[#D5DADF]"}`}
            style={{ height }}
          />
        ))}
      </div>
      <span className="w-9 shrink-0 text-right text-[13px] leading-none font-medium text-[#888888] tabular-nums">
        {formatTime(playing ? duration - position : duration)}
      </span>
    </div>
  );
}
