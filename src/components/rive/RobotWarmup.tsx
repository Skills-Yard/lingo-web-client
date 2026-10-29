"use client";

import { useEffect } from "react";
import { getRobotHost } from "@/lib/rive/robotHost";

/** Starts loading the module's robot (see `robotHost`) as the module opens,
 * while `hex.riv` is still downloading, so it is already drawn when the first
 * screen appears. Renders nothing. */
export function RobotWarmup() {
  useEffect(() => {
    getRobotHost();
  }, []);
  return null;
}
