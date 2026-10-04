"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive as RiveInstance } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ONBOARDING_FOX_RIVE_SRC,
  ONBOARDING_FOX_ARTBOARD,
  ONBOARDING_FOX_ARTBOARD_SIZE,
  ONBOARDING_FOX_IDLE_ANIMATION,
  ONBOARDING_FOX_EYE_STATE_MACHINE,
  ONBOARDING_FOX_TAP_ANIMATION,
  ONBOARDING_FOX_TAP_MS,
  GREETING_FOX_RIVE_SRC,
  GREETING_FOX_ARTBOARD,
  GREETING_FOX_ARTBOARD_SIZE,
  GREETING_FOX_STATE_MACHINE,
  GREETING_FOX_VIEW_MODEL,
  GREETING_FOX_HI_TRIGGER,
  GREETING_FOX_HI_MS,
} from "@/lib/rive/runtime";
import { FoxClipOverlay, FOX_CLIP_FADE_IN_MS, FOX_CLIP_FADE_OUT_MS } from "./FoxClipOverlay";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Zox's rig (`zox-vector-2.riv`, see ONBOARDING_FOX_RIVE_SRC). The looping
// "Zox_Idle" clip plays all the time, with the "Character_Joystick" state
// machine running beside it for the eyes (no "Zox_Main"), and a tap stops it
// for a moment to play "Zox_Tap_Giggle" in its place. The greeting screen's hi
// wave is the one exception — it's `zox-2.riv`, faded in over this fox for the
// wave and unmounted after (FoxClipOverlay).
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const GREETING_DELAY_MS = 400;
const AMBIENT_WATCHDOG_MS = 500;

/**
 * Eye movement: "Character_Joystick" reacts to mouse moves over its canvas, but
 * the fox sits under `pointer-events-none` and the pointer is usually far from
 * it — so every page-wide pointer move is handed to the canvas as a mouse move,
 * clamped to the canvas's edge (the eyes look as far as they can toward a
 * pointer outside it).
 */
function useEyeTracking(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvas) return;
    const follow = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
      canvas.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: clamp(event.clientX, box.left + 1, box.right - 1),
          clientY: clamp(event.clientY, box.top + 1, box.bottom - 1),
          bubbles: true,
        }),
      );
    };
    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [canvas]);
}

/** Keeps the eye machine and "Zox_Idle" playing, except while the giggle has taken its place. */
function useIdleAnimation(rive: RiveInstance | null, suspended: RefObject<boolean>) {
  useEffect(() => {
    if (!rive) return;
    const ensurePlaying = () => {
      if (
        rive.stateMachineNames.includes(ONBOARDING_FOX_EYE_STATE_MACHINE) &&
        !rive.playingStateMachineNames.includes(ONBOARDING_FOX_EYE_STATE_MACHINE)
      ) {
        rive.play(ONBOARDING_FOX_EYE_STATE_MACHINE);
      }
      if (suspended.current) return;
      if (
        rive.animationNames.includes(ONBOARDING_FOX_IDLE_ANIMATION) &&
        !rive.playingAnimationNames.includes(ONBOARDING_FOX_IDLE_ANIMATION)
      ) {
        rive.play(ONBOARDING_FOX_IDLE_ANIMATION);
      }
    };
    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive, suspended]);
}

/**
 * Plays the Zox_Tap_Giggle clip in place of "Zox_Idle" (stopped meanwhile, so
 * it can't overwrite the giggle), then goes back to idle, every time `tapCount`
 * goes up — the stage bumps it on each tap on Zox. Taps while `blocked` (the
 * hi wave) are dropped. Not on mount.
 */
function useTapGiggle(
  rive: RiveInstance | null,
  tapCount: number,
  blocked: boolean,
  suspended: RefObject<boolean>,
) {
  const lastCount = useRef(tapCount);
  const resumeTimer = useRef(0);
  useEffect(() => {
    if (!rive || tapCount === lastCount.current) return;
    lastCount.current = tapCount;
    if (blocked) return;
    window.clearTimeout(resumeTimer.current);
    suspended.current = true;
    rive.stop(ONBOARDING_FOX_IDLE_ANIMATION);
    rive.stop(ONBOARDING_FOX_TAP_ANIMATION);
    rive.play(ONBOARDING_FOX_TAP_ANIMATION);
    resumeTimer.current = window.setTimeout(() => {
      rive.stop(ONBOARDING_FOX_TAP_ANIMATION);
      suspended.current = false;
      rive.play(ONBOARDING_FOX_IDLE_ANIMATION);
    }, ONBOARDING_FOX_TAP_MS);
  }, [rive, tapCount, blocked, suspended]);
  useEffect(
    () => () => {
      window.clearTimeout(resumeTimer.current);
      suspended.current = false;
    },
    [suspended],
  );
}

/**
 * Fires zox-2's `hi` once its state machine is running and the view model is
 * bound (a trigger fired before that is dropped) — false until then.
 */
function startHi(rive: RiveInstance) {
  if (!rive.viewModelInstance) {
    const instance = rive.viewModelByName(GREETING_FOX_VIEW_MODEL)?.defaultInstance();
    if (instance) rive.bindViewModelInstance(instance);
  }
  const trigger = rive.viewModelInstance?.trigger(GREETING_FOX_HI_TRIGGER);
  if (!trigger || !rive.playingStateMachineNames.includes(GREETING_FOX_STATE_MACHINE)) {
    return false;
  }
  trigger.trigger();
  return true;
}

interface OnboardingFoxProps {
  className?: string;
  style?: CSSProperties;
  /** Waves hello (zox-2's `hi`) shortly after mounting — only the "Hey! I am
   * Zox" greeting screen; every other screen's fox just idles. */
  greet?: boolean;
  /** Bumped on every tap on Zox (cut-scene screens only) — each increase plays
   * `Zox_Tap_Giggle`. */
  tapCount?: number;
  /** The screen's speech bubble typing its line, the "Are you ready?"
   * excitement and the seated laptop fox — accepted for callers (FoxSlot), but
   * with no state machine there's nothing to drive them. */
  talking?: boolean;
  excited?: boolean;
  laptop?: boolean;
  typing?: number;
}

/**
 * The onboarding flow's fox — "Zox_Idle" plays from the start, no boot-up
 * sequence of its own (PreLoginScreen and every question screen just drop
 * this in already-idle, same role `<RobuEyeBlink>` plays for
 * instructions-intro's own reveal-card modal and game screens).
 */
export function OnboardingFox({
  className,
  style,
  greet = false,
  tapCount = 0,
}: OnboardingFoxProps) {
  const { rive, canvas, RiveComponent } = useRive({
    src: ONBOARDING_FOX_RIVE_SRC,
    artboard: ONBOARDING_FOX_ARTBOARD,
    animations: ONBOARDING_FOX_IDLE_ANIMATION,
    stateMachines: ONBOARDING_FOX_EYE_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

  // The hi wave runs once per greeting screen, then zox-2 is unmounted.
  const [hiDone, setHiDone] = useState(false);
  useEffect(() => {
    if (!greet) setHiDone(false);
  }, [greet]);
  const [hiShown, setHiShown] = useState(false);
  const hiActive = greet && !hiDone;
  const finishHi = useCallback(() => setHiDone(true), []);

  const giggling = useRef(false);
  useEyeTracking(canvas);
  useIdleAnimation(rive, giggling);
  useTapGiggle(rive, tapCount, hiActive, giggling);

  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <RiveComponent
        className="h-full w-full"
        style={{
          opacity: hiShown ? 0 : 1,
          transition: `opacity ${hiShown ? FOX_CLIP_FADE_IN_MS : FOX_CLIP_FADE_OUT_MS}ms ease-in-out`,
        }}
      />

      {hiActive && (
        <FoxClipOverlay
          src={GREETING_FOX_RIVE_SRC}
          artboard={GREETING_FOX_ARTBOARD}
          stateMachine={GREETING_FOX_STATE_MACHINE}
          autoBind
          artboardSize={GREETING_FOX_ARTBOARD_SIZE}
          matchArtboard={ONBOARDING_FOX_ARTBOARD_SIZE}
          playId={1}
          playOnMount
          delayMs={GREETING_DELAY_MS}
          holdMs={GREETING_FOX_HI_MS}
          start={startHi}
          onShownChange={setHiShown}
          onDone={finishHi}
        />
      )}
    </div>
  );
}
