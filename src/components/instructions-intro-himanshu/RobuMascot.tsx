"use client";

import { useEffect, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { EventType, Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";
import { useAmbientLoop, usePeriodicOverlay } from "./RobuEyeBlink";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `updated_robu.riv`'s "Anim Skill" artboard carries both a one-shot
// entrance timeline AND the same ambient idle/ear/eyeblink set
// `<RobuEyeBlink>` drives elsewhere (see ROBU_RIVE_SRC — it's the one `.riv`
// for every Robu instance in the app), so this one file/instance can carry
// Robu's *entire* time on screen: entrance, then the ambient loop. RobuStage
// renders only this component for its one persistent mascot, for the whole
// session, instead of swapping to a different component/instance once the
// entrance finishes. That swap used to be the actual source of a visible
// "cut" on the handoff — it forced a fresh canvas to mount (its own decode
// delay) showing a completely different first frame, at the exact instant
// the shrink to Robu's normal size also kicked in. With one instance for
// good, only the shrink itself (RobuStage's own width/height animation) is
// ever visible; the character underneath never cuts to a different canvas.
//
// The entrance plays `intro  improve` (yes, two spaces — that's the timeline's
// actual name, confirmed byte-for-byte against the `.riv`'s length-prefixed
// string table) rather than the plainer `intro` also on this artboard: it's
// the smoother of the two entrance timelines this file ships.
const ARTBOARD = "Anim Skill";
const INTRO_ANIMATION = "intro  improve";

// Ambient loop once the entrance is done — same names, same shape, as
// RobuEyeBlink's own ambient loop (see its exported hooks), since both
// components now share this one `.riv`.
const BASE_ANIMATIONS = ["idle2"];
const EAR_ANIMATION = "ears";
const EAR_INTERVAL_MS = 3000;
const EYEBLINK_ANIMATION = "eyeblink twice";
const EYEBLINK_INTERVAL_MS = 5000;

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuMascotProps {
  className?: string;
  /** Fired once the one-shot entrance timeline has played through (or
   * immediately, if `skipIntro` is set). This is also the exact moment the
   * ambient idle/ear/eyeblink loop below takes over. */
  onIntroComplete: () => void;
  /** Skip the one-shot entrance and start straight in the ambient loop —
   * for a caller that's already shown Robu's entrance once and is mounting
   * a fresh canvas instance anyway (a full remount elsewhere in the tree),
   * where replaying the entrance would read as Robu re-entering from
   * scratch instead of picking back up. Default (false) is every normal
   * appearance of Robu, which still gets the entrance. */
  skipIntro?: boolean;
}

/**
 * The one and only Robu canvas for the whole flow (see RobuStage) — plays
 * the entrance, then settles into an ambient loop, all on one Rive instance
 * that lives for as long as Robu is on screen. `onIntroComplete` lets
 * CoverScreen sync its own choreography (shrinking Robu, revealing his "Hi,
 * I am robu!" bubble) to the moment the entrance actually finishes.
 */
export function RobuMascot({ className, onIntroComplete, skipIntro = false }: RobuMascotProps) {
  // Gates the ambient hooks below so they only start driving `rive` once the
  // entrance is done — before that, `useAmbientLoop`/`usePeriodicOverlay`
  // just see `null` and do nothing (both bail out immediately on a null rive).
  // Starts already-true when skipping the entrance, since there's no `Stop`
  // event coming to flip it.
  const [ambientReady, setAmbientReady] = useState(skipIntro);

  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: skipIntro ? BASE_ANIMATIONS : INTRO_ANIMATION,
    autoplay: true,
    layout: LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;

    if (skipIntro) {
      // Nothing one-shot is playing to wait on — go straight to "entrance done".
      onIntroComplete();
      return;
    }

    // The entrance is one-shot, so it fires its own `Stop` once it reaches
    // its last frame — nothing here ever calls stop() itself. That's the
    // signal to hand off to the ambient loop and notify the caller. The
    // listener is removed as soon as it fires once so it can never react to
    // a *later* Stop event too (e.g. the ambient hooks' own stop()/play()
    // calls once they take over below).
    const handleStop = () => {
      rive.off(EventType.Stop, handleStop);
      setAmbientReady(true);
      onIntroComplete();
    };
    rive.on(EventType.Stop, handleStop);
    return () => rive.off(EventType.Stop, handleStop);
  }, [rive, onIntroComplete, skipIntro]);

  useAmbientLoop(ambientReady ? rive : null, BASE_ANIMATIONS);
  usePeriodicOverlay(ambientReady ? rive : null, EAR_ANIMATION, EAR_INTERVAL_MS);
  usePeriodicOverlay(ambientReady ? rive : null, EYEBLINK_ANIMATION, EYEBLINK_INTERVAL_MS);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
