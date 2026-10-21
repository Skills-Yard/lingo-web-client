"use client";

import { useHexRiveProgress } from "@/lib/rive/hexFile";

/** Shown while `hex.riv` downloads at the start of the app: a bar that fills
 * with the real download progress. */
export function HexRiveLoading() {
  const percent = Math.round(useHexRiveProgress() * 100);
  return (
    <div className="onboarding-light absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background px-10">
      <div
        role="progressbar"
        aria-label="Loading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full max-w-[240px] overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-foreground/70">{percent}%</span>
    </div>
  );
}
