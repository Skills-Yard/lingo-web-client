"use client";

import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ONBOARDING_FOX_RIVE_SRC,
  ONBOARDING_FOX_ARTBOARD,
  ONBOARDING_FOX_IDLE_STATE_MACHINE,
} from "@/lib/rive/runtime";

configureRiveRuntime();

// Zox's idle state machine. The rig has no peeking "notification" pose, so
// this screen shows the same idle Zox as everywhere else.
const ARTBOARD = ONBOARDING_FOX_ARTBOARD;
const STATE_MACHINE = ONBOARDING_FOX_IDLE_STATE_MACHINE;
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/** The fox peeking up at the notification prompt (NotificationPermissionScreen). */
export function NotificationFox({ className }: { className?: string }) {
  const { RiveComponent } = useRive({
    src: ONBOARDING_FOX_RIVE_SRC,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
