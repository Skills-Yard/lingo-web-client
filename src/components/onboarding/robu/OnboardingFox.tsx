"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  Layout,
  Fit,
  Alignment,
  EventType,
  type Event as RiveEvent,
  type Rive as RiveInstance,
} from "@rive-app/canvas";
import { configureRiveRuntime, ONBOARDING_FOX_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Same rig/artboard every other Robu instance in the app uses (see
// ONBOARDING_FOX_RIVE_SRC) — this is a fresh, minimal component rather than a reuse of
// instructions-intro's own `<RobuEyeBlink>`: that one hardcodes its inner
// canvas to `absolute top-10 right-20 h-[100px] w-[100px]`, sized for its one
// call site (a small corner badge over a reveal-card modal) — sizing this
// screen's fox instead needs a plain `h-full w-full` fill of whatever box the
// caller gives it, the same pattern RobuMascot/RobuSplash already use.
const ARTBOARD = "Artboard 2";
const BASE_ANIMATIONS = ["idle "];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Fixed 5s cadence rather than a random range — the blink clip loops in the
// editor (it doesn't settle back to open on its own), so without an explicit
// `holdMs` force-stop it would just keep blinking for the entire gap until
// the next trigger, reading as never stopping at all. Trailing space on the
// clip name is the file's own spelling (confirmed against its string table).
const BLINK_ANIMATIONS = ["both eye pupil blink "];
const BLINK_MS = 5000;
const BLINK_HOLD_MS = 600;

// Randomized (not fixed-interval) so it reads as unscripted instead of
// metronomic, centered on a ~10s cadence.
const EAR_ANIMATIONS = ["ear blink"];
const EAR_MIN_MS = 8000;
const EAR_MAX_MS = 12000;

// The greeting wave — the file's "hi " clip (trailing space is the file's own
// spelling, same as the blink clip above). It plays as its own pose, on a
// freshly reset artboard with nothing else running — layered over the
// standing idle/blink loops it came out mangled. The clip is authored to
// loop, so "once" means ending at its first cycle (see useGreetingPass),
// then back to standing. The short delay lets the screen's own crossfade-in
// (see OnboardingFlow's SCREEN_TRANSITION) finish first, so the wave starts
// on a fully visible fox instead of playing out mid-fade.
const GREETING_ANIMATIONS = ["hi "];
const GREETING_DELAY_MS = 400;
/** Backup end of the wave (the clip is 180f @ 60fps), in case a Loop event
 * is ever missed. */
const GREETING_MAX_MS = 3000;

// The mouth layer's talking clip, played on top of the ambient loop for as
// long as the screen's speech bubble is typing (see FoxMessageScreen).
// Unlike the clips above, this one has no trailing space in the file.
const SPEAK_ANIMATION = "speak";

const AMBIENT_WATCHDOG_MS = 500;

// The question screens' seated fox: the "laptop" state machine idles it at
// its laptop. That state machine has no inputs (it never leaves "laptop
// idle"), so typing is the raw clips instead — "laptop typing " is a one-shot
// (240f @ 60fps), "tail typing" loops alongside it. State machines are
// applied after plain clips, so typing (and talking, whose mouth the state
// machine's "mouth idle " layer would override) run with the state machine
// swapped out for the matching clips.
const LAPTOP_STATE_MACHINE = "laptop";
const LAPTOP_IDLE_ANIMATIONS = ["laptop idle"];
const LAPTOP_TYPING_ANIMATIONS = ["laptop typing ", "tail typing"];
const LAPTOP_TYPING_MS = 4000;
const NO_ANIMATIONS: string[] = [];

// "Are you ready?" once its heading has typed out: "Excitement ", then (2.2s
// in) "laptop taking out " — chained inside the state machine itself.
const EXCITEMENT_STATE_MACHINE = "excitement";

type Pose = "stand" | "greet" | "excited" | "laptop" | "laptop-talk" | "typing";

const POSES: Record<Pose, { animations?: string[]; stateMachine?: string }> = {
  stand: { animations: BASE_ANIMATIONS },
  greet: { animations: GREETING_ANIMATIONS },
  excited: { stateMachine: EXCITEMENT_STATE_MACHINE },
  laptop: { stateMachine: LAPTOP_STATE_MACHINE },
  "laptop-talk": { animations: LAPTOP_IDLE_ANIMATIONS },
  typing: { animations: LAPTOP_TYPING_ANIMATIONS },
};

/**
 * Switches the fox between poses by resetting the artboard — the laptop
 * clips move things the standing "idle " never keys back (the whole rig
 * shifts, the tail flips), and vice versa, so just swapping clips would
 * leave the previous pose's leftovers behind when going back and forth
 * between screens. `key` changes on every switch (and on each new typing
 * pass, which restarts the one-shot clip).
 */
function usePose(rive: RiveInstance | null, pose: Pose, key: string) {
  // What useRive itself started with — no reset needed for that.
  const current = useRef("stand");
  useEffect(() => {
    if (!rive || current.current === key) return;
    current.current = key;
    rive.reset({ artboard: ARTBOARD, ...POSES[pose], autoplay: true });
  }, [rive, pose, key]);
}

/**
 * True for one typing pass after each new `typing` value (a new one mid-pass
 * starts a fresh pass). A `typing` of 0 — a newly shown screen, including
 * one navigated back to — cancels any pass still running.
 */
function useTypingPass(typing: number, enabled: boolean) {
  const [finished, setFinished] = useState(0);
  useEffect(() => {
    if (!enabled || typing === 0) return;
    const timer = window.setTimeout(() => setFinished(typing), LAPTOP_TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [typing, enabled]);
  return enabled && typing !== 0 && finished !== typing;
}

function useAmbientLoop(rive: RiveInstance | null, animations: string[]) {
  useEffect(() => {
    if (!rive) return;
    const ensurePlaying = () => {
      for (const name of animations) {
        if (!rive.playingAnimationNames.includes(name)) {
          rive.stop(name);
          rive.play(name);
        }
      }
    };
    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive, animations]);
}

function useRandomOverlay(
  rive: RiveInstance | null,
  animations: string[],
  minMs: number,
  maxMs: number,
  holdMs?: number,
) {
  useEffect(() => {
    if (!rive || animations.length === 0) return;
    let timer: number;
    let stopTimer: number | undefined;
    const scheduleNext = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = window.setTimeout(() => {
        const name = animations[Math.floor(Math.random() * animations.length)];
        rive.stop(name);
        rive.play(name);
        if (holdMs !== undefined) {
          stopTimer = window.setTimeout(() => rive.stop(name), holdMs);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      window.clearTimeout(timer);
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
    };
  }, [rive, animations, minMs, maxMs, holdMs]);
}

/**
 * True while the greeting wave plays: from GREETING_DELAY_MS after `enabled`
 * turns on (every time — including arriving back at the greeting screen)
 * until the clip's first cycle ends. The pose switch (see usePose) resets the
 * artboard on the way in and back out.
 */
function useGreetingPass(rive: RiveInstance | null, enabled: boolean) {
  // Each wave gets its own id; waving = started one that hasn't finished.
  const [started, setStarted] = useState(0);
  const [finished, setFinished] = useState(0);
  const waving = enabled && started !== 0 && started !== finished;

  useEffect(() => {
    if (!rive || !enabled) return;
    const timer = window.setTimeout(() => setStarted(Date.now()), GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [rive, enabled]);

  useEffect(() => {
    if (!rive || !waving) return;
    const end = () => setFinished(started);
    // A looping clip reports each completed cycle as a Loop event — ending
    // on the first one leaves exactly one full wave.
    const handleLoop = (event: RiveEvent) => {
      const data = event.data as { animation?: string } | undefined;
      if (data?.animation && GREETING_ANIMATIONS.includes(data.animation)) end();
    };
    rive.on(EventType.Loop, handleLoop);
    const timer = window.setTimeout(end, GREETING_MAX_MS);
    return () => {
      window.clearTimeout(timer);
      rive.off(EventType.Loop, handleLoop);
    };
  }, [rive, waving, started]);

  return waving;
}

/**
 * Loops `speak` back-to-back for as long as `talking` is true (the clip is
 * authored one-shot, so it's restarted the instant it ends) and stops it the
 * moment `talking` flips false. Cleanup only clears the listener/timer —
 * calling `rive.stop()` there would also run on unmount, after Rive may
 * already have deleted the artboard. `pose` re-runs it after a pose switch,
 * whose reset drops every playing clip.
 */
function useTalkingMouth(rive: RiveInstance | null, talking: boolean, pose: Pose) {
  useEffect(() => {
    if (!rive || !rive.animationNames.includes(SPEAK_ANIMATION)) return;
    if (!talking) {
      rive.stop(SPEAK_ANIMATION);
      return;
    }
    // `stop()` before `play()` rewinds the clip — replaying a finished
    // one-shot would otherwise just hold its last frame. `restarting` keeps
    // our own `stop()` (which fires a Stop event too) from re-entering.
    let restarting = false;
    const restart = () => {
      if (restarting) return;
      restarting = true;
      rive.stop(SPEAK_ANIMATION);
      rive.play(SPEAK_ANIMATION);
      restarting = false;
    };
    // Loops the clip seamlessly: restart it the instant it ends, for as long
    // as the text is still typing.
    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const names = Array.isArray(stopped) ? stopped : [stopped];
      if (names.includes(SPEAK_ANIMATION)) restart();
    };
    rive.on(EventType.Stop, handleStop);
    restart();
    // Backup only, in case a Stop event is ever missed.
    const timer = window.setInterval(() => {
      if (!rive.playingAnimationNames.includes(SPEAK_ANIMATION)) restart();
    }, AMBIENT_WATCHDOG_MS);
    return () => {
      window.clearInterval(timer);
      rive.off(EventType.Stop, handleStop);
    };
  }, [rive, talking, pose]);
}

interface OnboardingFoxProps {
  className?: string;
  style?: CSSProperties;
  /** Waves hello once, shortly after mounting — only the "Hey! I am foxy"
   * greeting screen; every other screen's fox stays on the plain ambient
   * loop. */
  greet?: boolean;
  /** Moves the fox's mouth ("speak" clip) for as long as this is true — the
   * screen's speech bubble typing its line. */
  talking?: boolean;
  /** Plays the "excitement" state machine while true (standing only). */
  excited?: boolean;
  /** Seats the fox at its laptop (the "laptop" state machine) — the question
   * screens, where it sits beside the heading. */
  laptop?: boolean;
  /** With `laptop`: each new (unique, e.g. `Date.now()`) value plays one
   * typing pass, then back to idle. */
  typing?: number;
}

/**
 * The onboarding flow's fox — plain ambient idle/blink/ear loop standing, or
 * the "laptop" state machine seated (typing on each option pick), no boot-up
 * sequence of its own (PreLoginScreen and every question screen just drop
 * this in already-idle, same role `<RobuEyeBlink>` plays for
 * instructions-intro's own reveal-card modal and game screens).
 */
export function OnboardingFox({
  className,
  style,
  greet = false,
  talking = false,
  excited = false,
  laptop = false,
  typing = 0,
}: OnboardingFoxProps) {
  const { rive, RiveComponent } = useRive({
    src: ONBOARDING_FOX_RIVE_SRC,
    artboard: ARTBOARD,
    animations: BASE_ANIMATIONS,
    autoplay: true,
    layout: LAYOUT,
  });

  const typingPass = useTypingPass(typing, laptop);
  const waving = useGreetingPass(rive, greet && !laptop);
  const pose: Pose = !laptop
    ? waving
      ? "greet"
      : excited
        ? "excited"
        : "stand"
    : typingPass
      ? "typing"
      : talking
        ? "laptop-talk"
        : "laptop";
  const standing = pose === "stand";

  // Before the other hooks: their clips go on top of the reset artboard.
  usePose(rive, pose, pose === "typing" ? `typing-${typing}` : pose);
  useAmbientLoop(
    rive,
    standing ? BASE_ANIMATIONS : pose === "laptop-talk" ? LAPTOP_IDLE_ANIMATIONS : NO_ANIMATIONS,
  );
  useTalkingMouth(rive, talking, pose);
  useRandomOverlay(rive, standing ? BLINK_ANIMATIONS : NO_ANIMATIONS, BLINK_MS, BLINK_MS, BLINK_HOLD_MS);
  useRandomOverlay(rive, standing ? EAR_ANIMATIONS : NO_ANIMATIONS, EAR_MIN_MS, EAR_MAX_MS);

  return (
    <div className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
