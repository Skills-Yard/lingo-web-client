"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays a screen's voiceover clips back-to-back, once, from the moment
 * `start` turns true — e.g. a question clip followed by its options clip.
 * Returns whether a clip is currently playing (the fox talks while it is).
 *
 * `muted` is applied live to the playing element rather than stopping it, so
 * toggling the header's sound button mid-line mutes/unmutes without losing
 * the place in the sequence. Leaving the screen (unmount) stops playback.
 *
 * Autoplay is fine here without extra handling: every screen with a voice is
 * reached by a tap (Get Started / Continue), which gives the page the user
 * activation browsers require. If a browser still refuses, the sequence just
 * stays silent — the screen works the same without it.
 */
export function useVoiceover(
  srcs: readonly string[] | undefined,
  start: boolean,
  muted: boolean,
): boolean {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);
  const key = srcs?.join("|") ?? "";

  useEffect(() => {
    mutedRef.current = muted;
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!start || !key) return;
    const queue = key.split("|");
    const audio = new Audio();
    audio.muted = mutedRef.current;
    audioRef.current = audio;
    let cancelled = false;
    let index = 0;

    const playNext = () => {
      if (cancelled) return;
      if (index >= queue.length) {
        setPlaying(false);
        return;
      }
      audio.src = queue[index++];
      audio
        .play()
        .then(() => {
          if (!cancelled) setPlaying(true);
        })
        .catch(() => {
          if (!cancelled) setPlaying(false);
        });
    };

    audio.addEventListener("ended", playNext);
    playNext();

    return () => {
      cancelled = true;
      audio.removeEventListener("ended", playNext);
      audio.pause();
      audioRef.current = null;
    };
  }, [start, key]);

  return playing;
}
