"use client";

import { Lottie, type LottieHandle } from "lottie-react";
import type { Ref } from "react";

const BOX_LOTTIE_SRC = "/json/box__compressed.json";

interface BoxLottieProps {
  /** Loop continuously (the on-screen card, inviting a tap) vs play once
   * (the popup, showing the box actually opening). */
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  lottieRef?: Ref<LottieHandle>;
}

/**
 * The reveal box's Lottie animation (`public/json/box__compressed.json`,
 * exported from Lottielab) — shared by the on-screen "Tap to reveal" card and
 * the popup it opens, so both show the same animated box instead of the
 * static `box.png`. `src` is a plain path here; lottie-react fetches (and
 * dedupes by content) internally.
 */
export function BoxLottie({
  loop = false,
  autoplay = true,
  className,
  lottieRef,
}: BoxLottieProps) {
  return (
    <Lottie
      src={BOX_LOTTIE_SRC}
      loop={loop}
      autoplay={autoplay}
      className={className}
      lottieRef={lottieRef}
    />
  );
}
