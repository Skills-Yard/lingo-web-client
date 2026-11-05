"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EventType, Fit, Alignment, Layout } from "@rive-app/canvas";
import { subscribeBatteryCharge } from "@/components/home/batteryStore";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";

const ARTBOARD = "BTRY-005_HEX_Battery_Doctor";
const STATE_MACHINE = "BatteryDoctor_SM";
const VIEW_MODEL = "BatteryDoctor";
const PLAY_TRIGGER = "play";
const PLAYING_STATE = "D_Play9";
const IDLE_STATE = "D_Idle9";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
const TRIGGER_GAP_MS = 150;

function BatteryDoctorPlayer({ chargeCount, onDone }: { chargeCount: number; onDone: () => void }) {
  const { rive, RiveComponent, ready } = useHexRive(LAYOUT, STATE_MACHINE, ARTBOARD, VIEW_MODEL);
  const started = useRef(0);
  const active = useRef(false);
  const sawPlay = useRef(false);
  const chargeCountRef = useRef(chargeCount);
  chargeCountRef.current = chargeCount;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const firePlay = useCallback(() => {
    if (!rive) return;
    const input = rive.stateMachineInputs(STATE_MACHINE)?.find((item) => item.name === PLAY_TRIGGER);
    if (!input) return;
    input.fire();
    started.current += 1;
    active.current = true;
    sawPlay.current = false;
  }, [rive]);

  useEffect(() => {
    if (!rive) return;
    const onStateChange = (event: { data?: unknown }) => {
      const states = Array.isArray(event.data) ? event.data : [event.data];
      if (states.some((state) => typeof state === "string" && state.includes(PLAYING_STATE))) {
        sawPlay.current = true;
        return;
      }
      if (!active.current || !sawPlay.current || !states.some((state) => typeof state === "string" && state.includes(IDLE_STATE))) return;

      active.current = false;
      sawPlay.current = false;
      if (started.current >= chargeCountRef.current) {
        onDoneRef.current();
      } else {
        window.setTimeout(firePlay, TRIGGER_GAP_MS);
      }
    };
    rive.on(EventType.StateChange, onStateChange);
    return () => rive.off(EventType.StateChange, onStateChange);
  }, [firePlay, rive]);

  useEffect(() => {
    if (!ready || !rive || active.current || started.current >= chargeCountRef.current) return;
    firePlay();
  }, [chargeCount, firePlay, ready, rive]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/75" style={{ zIndex: 2147483647 }}>
      <RiveComponent aria-hidden style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

/** Full-screen focus overlay for every battery increase in the app. */
export function BatteryDoctorOverlay() {
  const [chargeCount, setChargeCount] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => subscribeBatteryCharge(() => {
    setChargeCount((count) => count + 1);
    setActive(true);
  }), []);

  const finish = useCallback(() => {
    setActive(false);
    setChargeCount(0);
  }, []);

  if (!active) return null;
  return <BatteryDoctorPlayer key="battery-doctor" chargeCount={chargeCount} onDone={finish} />;
}
