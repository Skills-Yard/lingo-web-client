"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive as RiveInstance } from "@rive-app/canvas";
import { motion } from "framer-motion";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_STATE_MACHINE,
} from "@/lib/rive/runtime";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same feel as the screen-to-screen crossfade, plus a rise from below: he
// fades in and slides up into his spot in the question row.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

// The "ZoxTab" view model's triggers, all fired through `fire`.
const SHOW_TAB_TRIGGER = "showTab";
const LOOK_USER_TRIGGER = "lookUser";
const LOOK_TAB_TRIGGER = "lookTab";
const TYPING_TRIGGER = "typing";
const IDLE_TRIGGER = "idle";
const BLINK_TRIGGER = "blink";

// What each random loop fires. Every idle also has him look back up at the
// user (a repeat while he already is does nothing).
const IDLE_TRIGGERS = [IDLE_TRIGGER, LOOK_USER_TRIGGER] as const;
const BLINK_TRIGGERS = [BLINK_TRIGGER] as const;

// [min, max] gaps in ms. The idle loop fires this long after the last input
// (an option pick or a new screen) and then keeps repeating while there's
// none; blinking runs on its own, whatever the user does.
const IDLE_AFTER_MS = [4000, 5000] as const;
const BLINK_EVERY_MS = [2500, 6000] as const;

const READY_RETRY_MS = 50;
// The "Taking out Tab" clip runs 1s; `lookUser` waits it out, plus a margin.
const LOOK_USER_AFTER_SHOW_MS = 1100;

const randomBetween = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min);

/** Fires a view model trigger; false while the view model isn't bound yet. */
function fire(rive: RiveInstance, name: string): boolean {
  const trigger = rive.viewModelInstance?.trigger(name);
  if (!trigger) return false;
  // A state machine that has settled stops playing and would never see the
  // trigger — wake it first.
  if (!rive.playingStateMachineNames.includes(ZOX_TAB_STATE_MACHINE)) {
    rive.play(ZOX_TAB_STATE_MACHINE);
  }
  trigger.trigger();
  return true;
}

/** Brings the tablet out the instant Zox first appears — no delay, only a
 * retry until the view model is bound (a trigger fired before that is lost) —
 * then has him look at the user once the tablet is out. `showTab` and
 * `lookUser` share a state machine layer: fired together `lookUser` is
 * dropped, fired mid-way it cuts the tablet coming out short. */
function useShowTabThenLookAtUser(rive: RiveInstance | null) {
  useEffect(() => {
    if (!rive) return;
    let timer = 0;
    const show = () => {
      if (fire(rive, SHOW_TAB_TRIGGER)) {
        timer = window.setTimeout(
          () => fire(rive, LOOK_USER_TRIGGER),
          LOOK_USER_AFTER_SHOW_MS,
        );
      } else {
        timer = window.setTimeout(show, READY_RETRY_MS);
      }
    };
    show();
    return () => window.clearTimeout(timer);
  }, [rive]);
}

/** Zox looks back up at the user whenever the screen changes after the first
 * (the first one is `useShowTabThenLookAtUser`'s). */
function useLookAtUserOnNewScreen(rive: RiveInstance | null, screenId?: string) {
  const currentScreen = useRef(screenId);
  useEffect(() => {
    if (!rive || screenId === currentScreen.current) return;
    currentScreen.current = screenId;
    fire(rive, LOOK_USER_TRIGGER);
  }, [rive, screenId]);
}

/** On every option pick (`typing` is set anew each time) he looks down at the
 * tablet and types. */
function useLookAtTabAndType(rive: RiveInstance | null, typing: number) {
  useEffect(() => {
    if (!rive || !typing) return;
    fire(rive, LOOK_TAB_TRIGGER);
    fire(rive, TYPING_TRIGGER);
  }, [rive, typing]);
}

/** Fires `names` together again and again after a random gap. Changing
 * `restartKey` throws away the pending gap and draws a fresh one. */
function useRandomTriggers(
  rive: RiveInstance | null,
  names: readonly string[],
  gapMs: readonly [number, number],
  restartKey: string | number = 0,
) {
  useEffect(() => {
    if (!rive) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        names.forEach((name) => fire(rive, name));
        schedule();
      }, randomBetween(gapMs));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [rive, names, gapMs, restartKey]);
}

/** Zox with his tablet, in the question row. Own canvas; the flow's fox sits
 * these screens out. Everything he does is a trigger on the "ZoxTab" view
 * model, fired into the "ZoxTabMain" state machine: the tablet comes out as
 * he appears and he looks at the user, then again on each new `screenId`; he
 * looks down and types on each option pick (`typing`), blinks now and then,
 * and fidgets (`idle`, then looks at the user again) when left alone for a few
 * seconds. */
export function ZoxTabFox({
  className,
  typing = 0,
  screenId,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing?: number;
  /** Changes with every new screen / question. */
  screenId?: string;
}) {
  const { rive, RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    autoBind: true,
    stateMachines: ZOX_TAB_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

  useShowTabThenLookAtUser(rive);
  useLookAtUserOnNewScreen(rive, screenId);
  useLookAtTabAndType(rive, typing);
  useRandomTriggers(rive, IDLE_TRIGGERS, IDLE_AFTER_MS, `${typing}|${screenId}`);
  useRandomTriggers(rive, BLINK_TRIGGERS, BLINK_EVERY_MS);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: SLIDE_FROM_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={ENTER}
    >
      <RiveComponent className="h-full w-full" />
    </motion.div>
  );
}
