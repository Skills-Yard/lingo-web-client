"use client";

import { useLayoutEffect, useState } from "react";
import type { BubbleSize } from "@/components/level-two/levelTwo";

/** The narrowest a Variable bubble is: the width every short line has always had. */
const MIN_WIDTH = 190;
/**
 * The widest: Hex's slot (110) and the bubble then stand 4px in from each edge of the 390px stage (the rows they sit
 * in leave that much room). A line that would still need a third line at this width keeps three, which the bubble's
 * 86px height holds.
 */
const MAX_WIDTH = 272;
/** The bubble's padding at each side (`px-3`), taken from its width before the text starts. */
const SIDE = 12;
/** Left over on top of the narrowest fit (px), so a slightly different font rendering cannot push the last word down. */
const SLACK = 2;
/** Lines a Variable bubble's text may take. */
const MAX_LINES = 2;
/** The text's size and line height as the bubble sets them (see `SpeechBubble`): 16px at 1.24. */
const FONT_PX = 16;
const LINE_HEIGHT = 1.24;

/**
 * The narrowest bubble (px, between `MIN_WIDTH` and `MAX_WIDTH`) that holds `text` in two lines, found by laying the
 * text out, in the page's own font and the bubble's own text style, at one width after another.
 */
function fitWidth(text: string): number {
  const probe = document.createElement("p");
  probe.style.cssText = `position:fixed;left:-9999px;top:0;margin:0;visibility:hidden;text-align:center;font-size:${FONT_PX}px;line-height:${LINE_HEIGHT};font-weight:500`;
  probe.textContent = text;
  document.body.appendChild(probe);
  const lines = (textWidth: number) => {
    probe.style.width = `${textWidth}px`;
    return Math.round(probe.getBoundingClientRect().height / (FONT_PX * LINE_HEIGHT));
  };
  let low = MIN_WIDTH - 2 * SIDE;
  let high = MAX_WIDTH - 2 * SIDE;
  let width: number;
  if (lines(low) <= MAX_LINES) width = MIN_WIDTH;
  else if (lines(high) > MAX_LINES) width = MAX_WIDTH;
  else {
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (lines(middle) <= MAX_LINES) high = middle;
      else low = middle + 1;
    }
    width = Math.min(MAX_WIDTH, low + 2 * SIDE + SLACK);
  }
  probe.remove();
  return width;
}

/**
 * The size of Hex's bubble for `text`: as narrow as the module's bubble has always been (190px) unless the words need
 * more room to stand in two lines, and then as wide as that takes (up to `MAX_WIDTH`). The font, the padding and the
 * words are not touched. It starts at the narrow size (what the server and the first render draw), is measured before
 * the screen is first painted, and is measured again once the page's font has loaded, as a fallback font is narrower
 * or wider.
 */
export function useBubbleSize(text: string): BubbleSize {
  const [width, setWidth] = useState(MIN_WIDTH);
  useLayoutEffect(() => {
    let current = true;
    const measure = () => {
      if (current) setWidth(fitWidth(text));
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      current = false;
    };
  }, [text]);
  return { width };
}
