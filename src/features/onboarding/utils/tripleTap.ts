"use client";

import { useCallback, useRef } from "react";

/**
 * TEMPORARY (with the hidden dev panels, see DevPanel): a gesture that takes
 * three taps in a row, each within `gapMs` of the one before, so a normal tap
 * never opens them. Returns the function to call on every tap, and one that
 * forgets the taps so far.
 */
export function useTripleTap(onTriple: () => void, gapMs = 600) {
  const count = useRef(0);
  const last = useRef(0);
  const callback = useRef(onTriple);
  callback.current = onTriple;

  const tap = useCallback(() => {
    const now = performance.now();
    count.current = now - last.current > gapMs ? 1 : count.current + 1;
    last.current = now;
    if (count.current >= 3) {
      count.current = 0;
      callback.current();
    }
  }, [gapMs]);

  const reset = useCallback(() => {
    count.current = 0;
  }, []);

  return { tap, reset };
}
