"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive as RiveInstance } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ONBOARDING_FOX_RIVE_SRC,
  ONBOARDING_FOX_ARTBOARD,
  ONBOARDING_FOX_IDLE_STATE_MACHINE,
  ONBOARDING_FOX_EYE_VIEW_MODEL,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Zox's rig (`zox-final.riv`, see ONBOARDING_FOX_RIVE_SRC). The "Zox_Main" state
// machine is the only one played, from the start — idle pose, blink, wave and
// mouth. The wave and the mouth are fired through the "Zox" view model's
// triggers (the eyes follow its `posX` / `posY`, see useEyeTracking).
const ARTBOARD = ONBOARDING_FOX_ARTBOARD;
const STATE_MACHINES = [
  ONBOARDING_FOX_IDLE_STATE_MACHINE,
];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// `hi` waves, `talk` starts the talking mouth, `stopTalk` ends it.
const GREETING_TRIGGER = "hi";
const GREETING_DELAY_MS = 400;
const GREETING_RETRY_MS = 100;
const TALK_TRIGGER = "talk";
const STOP_TALK_TRIGGER = "stopTalk";

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

function useGreetingOnce(rive: RiveInstance | null, enabled: boolean) {
  useEffect(() => {
    if (!rive || !enabled) return;
    // Fires once the state machine is running and the view model is bound
    // (a trigger fired before that is dropped), retrying until then.
    let timer = 0;
    const fire = () => {
      const trigger = rive.viewModelInstance?.trigger(GREETING_TRIGGER);
      const running = rive.playingStateMachineNames.includes(
        ONBOARDING_FOX_IDLE_STATE_MACHINE,
      );
      if (trigger && running) {
        trigger.trigger();
        return;
      }
      timer = window.setTimeout(fire, GREETING_RETRY_MS);
    };
    timer = window.setTimeout(fire, GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [rive, enabled]);
}

/**
 * Fires `talk` when `talking` turns true and `stopTalk` when it turns false
 * again (not on mount — the mouth starts closed).
 */
function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  const hasTalked = useRef(false);
  useEffect(() => {
    if (!rive) return;
    if (talking) {
      hasTalked.current = true;
      rive.viewModelInstance?.trigger(TALK_TRIGGER)?.trigger();
    } else if (hasTalked.current) {
      hasTalked.current = false;
      rive.viewModelInstance?.trigger(STOP_TALK_TRIGGER)?.trigger();
    }
  }, [rive, talking]);
}

interface OnboardingFoxProps {
  className?: string;
  style?: CSSProperties;
  /** Waves hello once, shortly after mounting — only the "Hey! I am foxy"
   * greeting screen; every other screen's fox stays on the plain ambient
   * loop. */
  greet?: boolean;
  /** Fires the `talk` trigger while true and `stopTalk` when it ends — the
   * screen's speech bubble typing its line. */
  talking?: boolean;
  /** The "Are you ready?" excitement, and the question screens' seated
   * laptop fox with its typing pass — `zox-final.riv` has no such animations, so
   * these are accepted for callers (FoxSlot) but change nothing yet. */
  excited?: boolean;
  laptop?: boolean;
  typing?: number;
}

/**
 * The onboarding flow's fox — "Zox_Main" plays from the start, no boot-up
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
    // Zox_Main plays from the first frame, with the view model bound to it —
    // the `hi` / `talk` / `stopTalk` triggers only work on that machine.
    stateMachines: ONBOARDING_FOX_IDLE_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

  useIdleStateMachine(rive);
  useEyeTracking(rive, canvas);
  useGreetingOnce(rive, greet);
  useTalkingMouth(rive, talking);

  return (
    <div className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
