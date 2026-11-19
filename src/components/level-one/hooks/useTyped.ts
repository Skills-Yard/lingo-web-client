"use client";

import { useEffect, useState } from "react";

/** The delay before the first letter, so Hex has started moving. */
export const TYPE_DELAY_MS = 350;
const TYPE_STEP_MS = 55;

/** The characters of `text` shown so far, one more every `TYPE_STEP_MS` once `active`. */
export const useTyped = (text: string, active: boolean) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let timer: number;
    const next = (n: number) => {
      setCount(n);
      if (n < text.length) timer = window.setTimeout(() => next(n + 1), TYPE_STEP_MS);
    };
    timer = window.setTimeout(() => next(1), TYPE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [text, active]);
  return text.slice(0, count);
};
