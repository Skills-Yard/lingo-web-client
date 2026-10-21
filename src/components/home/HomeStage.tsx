"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The content is drawn on a fixed 390px-wide stage and scaled as one piece,
 * so every size, font and gap shrinks with the screen and the page fits. */
const STAGE_W = 390;
const MAX_SCALE = 1.5;
/** The nav is pinned to the screen bottom at real size: 60px tall, 38px above
 * the edge, and a little air above it that the scaled stage keeps clear of. */
export const NAV_MARGIN = 38;
const NAV_RESERVE = 60 + NAV_MARGIN + 10;
/** Real-size space above the content (never scaled). */
const TOP_MARGIN = 54;
/** Where the shared top bar (see HomeTopBar: 54px from the top, 48px tall)
 * ends; every tab starts its content below this line. */
export const TOP_BAR_BOTTOM = 114;

/**
 * One tab's content: a stage scaled to fit the room above the bottom nav. The
 * nav itself lives in HomeShell, so it stays mounted as the tabs change.
 */
export function HomeStage({
  stageHeight,
  topMargin = TOP_MARGIN,
  className = "bg-white",
  children,
}: {
  /** Height of the content, in stage px (the design's own units). */
  stageHeight: number;
  /** Real-size space above the content. */
  topMargin?: number;
  /** The page background. */
  className?: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      setScale(
        Math.min(width / STAGE_W, (height - NAV_RESERVE - topMargin) / stageHeight, MAX_SCALE),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [stageHeight, topMargin]);

  return (
    <main
      ref={boxRef}
      className={`absolute inset-0 overflow-hidden font-[family-name:var(--font-app-poppins)] text-[#444444] ${className}`}
    >
      <div
        className="absolute left-1/2 origin-top"
        style={{
          top: topMargin,
          width: STAGE_W,
          height: stageHeight,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </main>
  );
}
