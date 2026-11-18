"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EventType, Fit, Alignment, Layout } from "@rive-app/canvas";
import { X } from "lucide-react";
import { subscribeBatteryCharge, type BatteryCharge } from "@/components/home/batteryStore";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";

const ARTBOARD = "BTRY-005_HEX_Battery_Doctor";
const STATE_MACHINE = "BatteryDoctor_SM";
const VIEW_MODEL = "BatteryDoctor";
const PLAY_TRIGGER = "play";
/** The battery count the artboard starts from, and how many units it adds. */
const FROM_COUNT = "fromCount";
const AMOUNT = "amount";
/**
 * The machine waits in `D_Idle` for `play`, runs `D_Play` (about 6.7 s) and
 * ends in `D_Hold`, which loops for good and never returns to idle. Reaching
 * `D_Hold` is therefore the end of the show.
 */
const HOLD_STATE = "D_Hold";
/** Longer than the play, loading included: if `D_Hold` never comes, the screen is given back anyway. */
const MAX_SHOW_MS = 15_000;
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

function BatteryDoctorPlayer({ charge, onDone }: { charge: BatteryCharge; onDone: () => void }) {
  const { rive, RiveComponent, ready, fireTrigger, setNumber } = useHexRive(LAYOUT, STATE_MACHINE, ARTBOARD, VIEW_MODEL);
  const played = useRef(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone();
    charge.onCelebrated?.();
  }, [charge, onDone]);

  useEffect(() => {
    if (!ready || played.current) return;
    played.current = true;
    setNumber(FROM_COUNT, charge.fromUnits);
    setNumber(AMOUNT, charge.units);
    fireTrigger(PLAY_TRIGGER);
  }, [charge, fireTrigger, ready, setNumber]);

  useEffect(() => {
    if (!rive) return;
    const onStateChange = (event: { data?: unknown }) => {
      const states = Array.isArray(event.data) ? event.data : [event.data];
      if (played.current && states.includes(HOLD_STATE)) finish();
    };
    rive.on(EventType.StateChange, onStateChange);
    return () => rive.off(EventType.StateChange, onStateChange);
  }, [finish, rive]);

  useEffect(() => {
    const timer = window.setTimeout(finish, MAX_SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/75" style={{ zIndex: 2147483647 }}>
      <RiveComponent aria-hidden style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }} />
      {/* The charge is already in the battery, so closing early only skips the show. */}
      <button
        type="button"
        aria-label="Skip"
        onClick={finish}
        className="absolute right-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform active:scale-95"
        style={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        <X aria-hidden className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * Full-screen focus overlay for the charges the learner asked for (see
 * `celebrate` in the battery store): a recharge, or the battery claimed on
 * winning a board game. Nothing else mounts this artboard, so it never plays on
 * its own. A charge that lands while one is playing waits its turn, and each
 * charge's `onCelebrated` runs when its own show is over.
 */
export function BatteryDoctorOverlay() {
  const [waiting, setWaiting] = useState<BatteryCharge[]>([]);

  useEffect(() => subscribeBatteryCharge((charge) => setWaiting((queue) => [...queue, charge])), []);

  const next = useCallback(() => setWaiting((queue) => queue.slice(1)), []);

  const [current] = waiting;
  if (!current) return null;
  return <BatteryDoctorPlayer key={current.id} charge={current} onDone={next} />;
}
