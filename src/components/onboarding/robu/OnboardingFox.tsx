"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  Layout,
  Fit,
  Alignment,
  EventType,
  type Event as RiveEvent,
  type Rive as RiveInstance,
} from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ONBOARDING_FOX_RIVE_SRC,
  ONBOARDING_FOX_ARTBOARD,
  ONBOARDING_FOX_IDLE_STATE_MACHINE,
  ONBOARDING_FOX_EYE_STATE_MACHINE,
  ONBOARDING_FOX_EYE_VIEW_MODEL,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Zox's rig (`eyeMove-3.riv`, see ONBOARDING_FOX_RIVE_SRC). The "Zox_Main" state
// machine is his idle pose — breathing, ears, tail — and "ZoxSM" moves his
// eyes after the pointer (see useEyeTracking); both play for as long as the
// fox is mounted. The blink is the one thing layered on top by hand, at
// random intervals (see BLINK_*).
const ARTBOARD = ONBOARDING_FOX_ARTBOARD;
const STATE_MACHINES = [
  ONBOARDING_FOX_IDLE_STATE_MACHINE,
  ONBOARDING_FOX_EYE_STATE_MACHINE,
];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// "blink eye" loops in the editor (it doesn't settle back to open on its own),
// so each blink is force-stopped after BLINK_HOLD_MS. Random gap, so it reads
// as unscripted instead of metronomic.
const BLINK_ANIMATIONS = ["blink eye"];
const BLINK_MIN_MS = 2500;
const BLINK_MAX_MS = 6000;
const BLINK_HOLD_MS = 150;

// The greeting wave: the "ZoxVM" view model's `hi` trigger, which the file
// wires to its wave. Fallback (no view model bound) plays the clip directly.
const GREETING_TRIGGER = "hi";
const GREETING_ANIMATIONS = ["hi_wave_01"];
const GREETING_DELAY_MS = 400;

// The mouth's talking clip, played on top of the idle state machine for as
// long as the screen's speech bubble is typing (see FoxMessageScreen).
const SPEAK_ANIMATION = "Talking";
// Played once when talking ends, to snap the mouth shut. Spelled as it is in
// the file, double space included.
const MOUTH_CLOSED_ANIMATION = "Mouth  Closed";
const SPEAK_END_FALLBACK = "Talking_to_idol";

const MOUTH_HOLD_MS = 12000;
const MOUTH_HOLD_TICK_MS = 100;

const AMBIENT_WATCHDOG_MS = 500;

function useIdleStateMachine(rive: RiveInstance | null) {
  useEffect(() => {
    if (!rive) return;
    const ensurePlaying = () => {
      const missing = STATE_MACHINES.filter(
        (name) =>
          rive.stateMachineNames.includes(name) &&
          !rive.playingStateMachineNames.includes(name),
      );
      if (missing.length > 0) rive.play(missing);
    };
    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive]);
}

/**
 * Eye movement: "ZoxSM" reads the "Zox" view model's `posX` / `posY` numbers,
 * both -1..1 (0 = eyes centred, -1 = left / up, 1 = right / down). They're set
 * from the page-wide pointer, measured from the fox's own centre and scaled
 * by half the window, so the eyes follow the pointer wherever the fox stands.
 */
function useEyeTracking(rive: RiveInstance | null, canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!rive || !canvas) return;
    // The artboard may not have the view model linked to it in the file (then
    // autoBind binds nothing) — bind its default instance ourselves.
    if (!rive.viewModelInstance) {
      const instance = rive.viewModelByName(ONBOARDING_FOX_EYE_VIEW_MODEL)?.defaultInstance();
      if (instance) rive.bindViewModelInstance(instance);
    }
    const posX = rive.viewModelInstance?.number("posX");
    const posY = rive.viewModelInstance?.number("posY");
    if (!posX || !posY) return;
    const toUnit = (n: number) => Math.max(-1, Math.min(1, n));
    const follow = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      posX.value = toUnit((event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2));
      posY.value = toUnit((event.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2));
    };
    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [rive, canvas]);
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

function useGreetingOnce(rive: RiveInstance | null, enabled: boolean) {
  useEffect(() => {
    if (!rive || !enabled) return;

    const timer = window.setTimeout(() => {
      const trigger = rive.viewModelInstance?.trigger(GREETING_TRIGGER);
      if (trigger) {
        trigger.trigger();
        return;
      }
      const name = GREETING_ANIMATIONS.find((n) => rive.animationNames.includes(n));
      if (!name) return;
      rive.stop(name);
      rive.play(name);
    }, GREETING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [rive, enabled]);
}

/**
 * Loops `speak` back-to-back for as long as `talking` is true (the clip is
 * authored one-shot, so it's restarted the instant it ends) and stops it the
 * moment `talking` flips false. Cleanup only clears the listener/timer —
 * calling `rive.stop()` there would also run on unmount, after Rive may
 * already have deleted the artboard.
 */
function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  // True once talking has started, so the wind-down only plays after speech —
  // not on mount or when `rive` first loads.
  const hasTalked = useRef(false);
  useEffect(() => {
    if (!rive || !rive.animationNames.includes(SPEAK_ANIMATION)) return;
    // Not talking: stop the clip right away (it may be authored to loop, so
    // it can't be left to end by itself), then play the mouth's wind-down
    // clip once — or, without it, rewind to the first frame — so the mouth
    // doesn't freeze open mid-word.
    if (!talking) {
      if (!hasTalked.current) return;
      hasTalked.current = false;
      // Every talking-ish clip (the loop, its lead-in, the hello line, …) —
      // stopping only "Talking" left the others running.
      const names = rive.animationNames;
      const endClip =
        [MOUTH_CLOSED_ANIMATION, SPEAK_END_FALLBACK].find((name) => names.includes(name)) ??
        null;
      const talkClips = names.filter((name) => /talk/i.test(name) && name !== endClip);
      const closeMouth = () => {
        const running = talkClips.filter((name) => rive.playingAnimationNames.includes(name));
        if (running.length > 0) rive.stop(running);
        if (endClip) {
          rive.stop(endClip);
          rive.play(endClip);
        } else {
          rive.scrub(SPEAK_ANIMATION, 0);
        }
      };
      closeMouth();
      // The greeting's "hi" trigger runs its own hello-line talking clip
      // through the state machine, which can start it again after the stop
      // above — so keep the mouth shut for a while, until nothing talks.
      const started = performance.now();
      const timer = window.setInterval(() => {
        const stillTalking = talkClips.some((name) => rive.playingAnimationNames.includes(name));
        if (stillTalking) closeMouth();
        if (performance.now() - started > MOUTH_HOLD_MS) window.clearInterval(timer);
      }, MOUTH_HOLD_TICK_MS);
      return () => window.clearInterval(timer);
    }
    hasTalked.current = true;
    // The closing clip keeps holding the mouth shut after it plays, which
    // would override the talking clip — release it before talking starts.
    for (const name of [MOUTH_CLOSED_ANIMATION, SPEAK_END_FALLBACK]) {
      if (rive.playingAnimationNames.includes(name)) rive.stop(name);
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
  }, [rive, talking]);
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
  /** The "Are you ready?" excitement, and the question screens' seated
   * laptop fox with its typing pass — `eyeMove-3.riv` has no such animations, so
   * these are accepted for callers (FoxSlot) but change nothing yet. */
  excited?: boolean;
  laptop?: boolean;
  typing?: number;
}

/**
 * The onboarding flow's fox — plain ambient idle/blink/ear loop, no boot-up
 * sequence of its own (PreLoginScreen and every question screen just drop
 * this in already-idle, same role `<RobuEyeBlink>` plays for
 * instructions-intro's own reveal-card modal and game screens).
 */
export function OnboardingFox({
  className,
  style,
  greet = false,
  talking = false,
}: OnboardingFoxProps) {
  const { rive, canvas, RiveComponent } = useRive({
    src: ONBOARDING_FOX_RIVE_SRC,
    artboard: ARTBOARD,
    autoBind: true,
    // Machines are played once loaded (useIdleStateMachine), skipping any the
    // file lacks — naming a missing one here would fail the whole load.
    autoplay: false,
    layout: LAYOUT,
  });

  useIdleStateMachine(rive);
  useEyeTracking(rive, canvas);
  useGreetingOnce(rive, greet);
  useTalkingMouth(rive, talking);
  useRandomOverlay(rive, BLINK_ANIMATIONS, BLINK_MIN_MS, BLINK_MAX_MS, BLINK_HOLD_MS);

  return (
    <div className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
