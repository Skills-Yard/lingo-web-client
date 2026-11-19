"use client";

import { useEffect, useRef, useState } from "react";

/** How long the voice takes to fade away when stopped early. */
const STOP_FADE_MS = 250;

export type VoiceoverStatus = "idle" | "playing" | "done" | "failed";

/** A voice that has ended — or couldn't play at all, so nothing is left to
 * wait for. */
export const isVoiceoverSettled = (status: VoiceoverStatus) =>
  status === "done" || status === "failed";

export interface Voiceover {
  status: VoiceoverStatus;
  /** True only while a clip is audibly advancing — drives the fox's mouth. */
  playing: boolean;
  /** 0..1 through the whole sequence (each clip weighted equally), updated
   * every frame while playing — drives voice-synced typing. */
  progress: number;
  /** Which clip of the sequence is current (0-based), and 0..1 through it —
   * e.g. a question screen's question clip vs. its options clip. */
  clip: number;
  clipProgress: number;
  /** Cuts the voice off where it is (an option was picked). The text and
   * mouth settle as if it had finished; nothing restarts it. */
  stop: () => void;
}

/**
 * Plays a screen's voiceover clips back-to-back, once, from the moment
 * `start` turns true — e.g. a question clip followed by its options clip —
 * and reports how far through it is, so text and the fox's mouth can follow
 * the voice exactly (see FoxMessageScreen).
 *
 * `muted` is applied live to the playing element rather than stopping it, so
 * toggling the header's sound button mid-line mutes/unmutes without losing
 * the place in the sequence — and synced typing keeps going either way.
 * Leaving the screen (unmount) stops playback.
 *
 * `stop` turning true (e.g. the user picked an answer mid-sentence) ends the
 * sequence early: status goes straight to "done" — so voice-synced
 * highlighting and the fox's mouth stop at once — while the audio itself
 * fades out quickly rather than cutting off. (iOS ignores `volume`, so there
 * it simply stops at the end of the fade.)
 *
 * Autoplay is fine here without extra handling: every screen with a voice is
 * reached by a tap (Get Started / Continue), which gives the page the user
 * activation browsers require. If a browser still refuses, status becomes
 * "failed" and callers fall back to their unsynced behaviour.
 */
export function useVoiceover(
  srcs: readonly string[] | undefined,
  start: boolean,
  muted: boolean,
  stop = false,
): Voiceover {
  const [status, setStatus] = useState<VoiceoverStatus>("idle");
  // Current clip and how far through it, updated every frame while playing.
  const [position, setPosition] = useState({ clip: 0, t: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);
  const stopRef = useRef<(() => void) | null>(null);
  const stoppedRef = useRef(false);
  const key = srcs?.join("|") ?? "";

  useEffect(() => {
    mutedRef.current = muted;
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // A new voiceover (e.g. the next question, when one screen component stays
  // mounted across questions) starts from a clean slate.
  useEffect(() => {
    stoppedRef.current = false;
    setStatus("idle");
    setPosition({ clip: 0, t: 0 });
  }, [key]);

  useEffect(() => {
    if (!stop || stoppedRef.current) return;
    stoppedRef.current = true;
    stopRef.current?.();
  }, [stop]);

  useEffect(() => {
    if (!start || !key || stoppedRef.current) return;
    const queue = key.split("|");
    const audio = new Audio();
    audio.muted = mutedRef.current;
    audioRef.current = audio;
    let cancelled = false;
    let index = 0;
    let frame = 0;

    // A src may end in `#end=<seconds>` to play only the start of its clip, or
    // `#start=<seconds>,<seconds>` to play just that stretch of it.
    let clipEnd = Infinity;

    const tick = () => {
      if (cancelled) return;
      if (audio.currentTime >= clipEnd) {
        audio.pause();
        playNext();
        return;
      }
      const t = audio.duration > 0 ? Math.min(1, audio.currentTime / audio.duration) : 0;
      setPosition({ clip: index - 1, t });
      frame = window.requestAnimationFrame(tick);
    };

    const playNext = () => {
      if (cancelled) return;
      if (index >= queue.length) {
        window.cancelAnimationFrame(frame);
        setPosition({ clip: queue.length - 1, t: 1 });
        setStatus("done");
        return;
      }
      const [file, fragment] = queue[index++].split("#");
      const range = /^start=([\d.]+),([\d.]+)$/.exec(fragment ?? "");
      const clipStart = range ? Number(range[1]) : 0;
      clipEnd = range ? Number(range[2]) : fragment?.startsWith("end=") ? Number(fragment.slice(4)) : Infinity;
      audio.src = file;
      if (clipStart > 0) {
        audio.addEventListener("loadedmetadata", () => (audio.currentTime = clipStart), { once: true });
      }
      audio
        .play()
        .then(() => {
          // Stopped while the clip was still loading — keep it silent.
          if (cancelled) {
            audio.pause();
            return;
          }
          setStatus("playing");
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(tick);
        })
        .catch(() => {
          // Pausing for a hidden tab aborts a still-loading play(); that's
          // resumed on return, not a failure.
          if (!cancelled && !pausedForHidden) setStatus("failed");
        });
    };

    // Don't keep talking from a background tab / minimized window.
    let pausedForHidden = false;
    const onVisibilityChange = () => {
      if (cancelled) return;
      if (document.hidden) {
        if (audio.paused) return;
        pausedForHidden = true;
        window.cancelAnimationFrame(frame);
        audio.pause();
      } else if (pausedForHidden) {
        pausedForHidden = false;
        audio
          .play()
          .then(() => {
            if (cancelled) return;
            setStatus("playing");
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(tick);
          })
          .catch(() => {
            if (!cancelled) setStatus("failed");
          });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let fadeFrame = 0;
    stopRef.current = () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      audio.removeEventListener("ended", playNext);
      setStatus("done");
      const from = audio.volume;
      const began = performance.now();
      const fade = () => {
        const k = Math.min(1, (performance.now() - began) / STOP_FADE_MS);
        audio.volume = from * (1 - k);
        if (k < 1) fadeFrame = window.requestAnimationFrame(fade);
        else audio.pause();
      };
      fadeFrame = window.requestAnimationFrame(fade);
    };

    audio.addEventListener("ended", playNext);
    playNext();

    return () => {
      stopRef.current = () => {};
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopRef.current = null;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(fadeFrame);
      audio.removeEventListener("ended", playNext);
      audio.pause();
      audioRef.current = null;
    };
  }, [start, key]);

  const count = key ? key.split("|").length : 1;
  return {
    status,
    playing: status === "playing",
    progress: status === "done" ? 1 : (position.clip + position.t) / count,
    clip: position.clip,
    clipProgress: position.t,
    stop: () => {
      // Also valid before the clip has started: it then never will.
      stoppedRef.current = true;
      if (stopRef.current) stopRef.current();
      else setStatus("done");
    },
  };
}

/**
 * Wires a voiceover to the flow's "wait for the voice" gate: calls `onDone`
 * once it has finished (or failed to play), and cuts it off when the Skip
 * link bumps `skipCount`. For screens that play a voice but have no fox
 * message / question component to do this for them.
 */
export function useVoiceoverGate(voice: Voiceover, onDone?: () => void, skipCount = 0) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    if (isVoiceoverSettled(voice.status)) onDoneRef.current?.();
  }, [voice.status]);
  const lastSkipCount = useRef(skipCount);
  useEffect(() => {
    if (skipCount === lastSkipCount.current) return;
    lastSkipCount.current = skipCount;
    voice.stop();
    // `voice` is a fresh object each render; only a new skip should run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipCount]);
}
