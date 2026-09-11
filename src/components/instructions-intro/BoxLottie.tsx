"use client";

import { Lottie } from "lottie-react";

const BOX_LOTTIE_SRC = "/rive/box__compressed.json";

interface BoxLottieProps {
  /** Sizing / positioning classes for the wrapper the animation fills. */
  className?: string;
}

/**
 * Animated reward-box mascot for the cover screen's "tap to reveal" card —
 * swaps the old static `box.png` for the `box__compressed` Lottie export.
 */
export function BoxLottie({ className }: BoxLottieProps) {
  return <Lottie src={BOX_LOTTIE_SRC} autoplay loop className={className} />;
}
