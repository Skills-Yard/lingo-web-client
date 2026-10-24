"use client";

import { useEffect } from "react";
import { getModuleButtonHost } from "@/lib/rive/moduleButtonHost";

/** Starts loading the module button (see `moduleButtonHost`) as the module
 * opens, while `hex.riv` is still downloading, so the first screen's button
 * is already drawn when it appears. Renders nothing. */
export function ModuleButtonWarmup() {
  useEffect(() => {
    getModuleButtonHost();
  }, []);
  return null;
}
