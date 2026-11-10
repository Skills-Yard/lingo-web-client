"use client";

import { useRiveFilesProgress } from "@/lib/rive/riveCache";

/** Shown while the app's `.riv` files load at the start: a bar that fills with
 * the real download (then parse) progress. */
export function RiveLoading() {
  const percent = Math.round(useRiveFilesProgress() * 100);
  return (
    <div className="onboarding-light fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background px-10">
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
