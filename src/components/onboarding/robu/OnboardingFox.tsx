"use client";

import { useEffect, type CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  Layout,
  Fit,
  Alignment,
  EventType,
  type Event as RiveEvent,
  type Rive as RiveInstance,
} from "@rive-app/canvas";
import { configureRiveRuntime, ONBOARDING_FOX_RIVE_SRC, ONBOARDING_FOX_ARTBOARD } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Zox's rig (`zox-2.riv`, see ONBOARDING_FOX_RIVE_SRC). The "Zox_Main" state
// machine is his idle pose — breathing, ears, tail, and the eye-movement
// joystick — and plays for as long as the fox is mounted. The blink is the
// one thing layered on top by hand, at random intervals (see BLINK_*).
const ARTBOARD = ONBOARDING_FOX_ARTBOARD;
const IDLE_STATE_MACHINE = "Zox_Main";
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

const AMBIENT_WATCHDOG_MS = 500;

/**
 * What the fox is doing. `zox-2.riv` has no laptop or excitement state
 * machines yet, so "excited" and "laptop" currently show the same idle fox as
 * "default" — the type stays so screens keep declaring the pose they want.
 */
export type FoxPose = "default" | "excited" | "laptop";

function useIdleStateMachine(rive: RiveInstance | null) {
  useEffect(() => {
    if (!rive) return;
    const ensurePlaying = () => {
      if (!rive.playingStateMachineNames.includes(IDLE_STATE_MACHINE)) {
        rive.play(IDLE_STATE_MACHINE);
      }
    };
    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive]);
}

/**
 * Eye-movement joystick: Rive only feeds pointer positions to the state
 * machine while the pointer is over the fox's own canvas, so the page-wide
 * pointer is forwarded to it as mouse events. Rive maps client coordinates
 * through the canvas's bounding rect without clamping, so positions outside
 * the canvas work too.
 */
function useEyeTracking(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvas) return;
    const forward = (event: PointerEvent) => {
      if (event.target === canvas) return;
      canvas.dispatchEvent(
        new MouseEvent("mousemove", { clientX: event.clientX, clientY: event.clientY }),
      );
    };
    window.addEventListener("pointermove", forward);
    return () => window.removeEventListener("pointermove", forward);
  }, [canvas]);
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
  /** See FoxPose — accepted for callers, no visual difference yet. */
  pose?: FoxPose;
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
    stateMachines: IDLE_STATE_MACHINE,
    autoBind: true,
    autoplay: true,
    layout: LAYOUT,
  });

  useIdleStateMachine(rive);
  useEyeTracking(canvas);
  useGreetingOnce(rive, greet);
  useTalkingMouth(rive, talking);
  useRandomOverlay(rive, BLINK_ANIMATIONS, BLINK_MIN_MS, BLINK_MAX_MS, BLINK_HOLD_MS);

  return (
    <div className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
