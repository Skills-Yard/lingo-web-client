"use client";

import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";

configureRiveRuntime();

// The rig's own "notification" state machine: the fox peeking up (its
// looping "notification" clip) with its idle, eye-blink and tail layers
// running alongside — all wired inside the file, so unlike OnboardingFox
// there are no clips to drive by hand here.
const ARTBOARD = "Artboard 2";
const STATE_MACHINE = "notification";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/** The fox peeking up at the notification prompt (NotificationPermissionScreen). */
export function NotificationFox({ className }: { className?: string }) {
  const { RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
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
