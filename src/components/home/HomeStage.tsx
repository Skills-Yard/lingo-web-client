"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The content is drawn on a fixed 390px-wide stage and scaled as one piece,
 * so every size, font and gap shrinks with the screen and the page fits. */
const STAGE_W = 390;
const MAX_SCALE = 1.5;
/** The nav is pinned to the screen bottom at real size: 60px tall, 10px above
 * the edge, and a little air above it that the scaled stage keeps clear of. */
export const NAV_MARGIN = 10;
const NAV_RESERVE = 60 + NAV_MARGIN + 10;
/** Real-size space above the content (never scaled). */
export const TOP_MARGIN = 15;
/** Where the shared top bar (see HomeTopBar: TOP_MARGIN from the top, 48px
 * tall, plus a 12px gap) ends; every tab starts its content below this line. */
export const TOP_BAR_BOTTOM = TOP_MARGIN + 60;
/** Real-size space at the content's left and right (never scaled), the same
 * `px-4` the unscaled tabs use inside their 430px column. */
export const SIDE_MARGIN = 16;
const COLUMN_W = 430;
/** The stage content's side gutter: put it on the stage's top-level wrapper
 * (instead of `px-4`) so its edges sit SIDE_MARGIN from the column's, at any scale. */
export const STAGE_GUTTER = "mx-[var(--stage-inset)]";

/**
 * One tab's content: a stage scaled to fit the room above the bottom nav. The
 * nav itself lives in HomeShell, so it stays mounted as the tabs change.
 */
export function HomeStage({
  stageHeight,
  topMargin = TOP_MARGIN,
  className = "bg-white dark:bg-[#0F1F26]",
  scroll = false,
  children,
}: {
  /** Height of the content, in stage px (the design's own units). */
  stageHeight: number;
  /** Real-size space above the content. */
  topMargin?: number;
  /** The page background. */
  className?: string;
  /** Scale to the width only and let the page scroll under the nav, for
   * content taller than the screen: its height is then measured, and
   * `stageHeight` is only the first guess. */
  scroll?: boolean;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  /** Room (in stage px) between the stage's edge and the screen's, each side. */
  const [bleed, setBleed] = useState(0);
  /** Stage px from the stage's edge to the content's (negative: past it). */
  const [inset, setInset] = useState(SIDE_MARGIN);
  const [contentH, setContentH] = useState(stageHeight);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      const next = scroll
        ? Math.min(width / STAGE_W, MAX_SCALE)
        : Math.min(width / STAGE_W, (height - NAV_RESERVE - topMargin) / stageHeight, MAX_SCALE);
      setScale(next);
      setBleed(Math.max(0, (width / next - STAGE_W) / 2));
      const columnW = Math.min(width, Math.max(COLUMN_W, STAGE_W * next));
      setInset((STAGE_W - (columnW - 2 * SIDE_MARGIN) / next) / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [stageHeight, topMargin, scroll]);

  // The stage's own height changes as its content loads in.
  useEffect(() => {
    const stage = stageRef.current;
    if (!scroll || !stage) return;
    const measure = () => setContentH(stage.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [scroll]);

  const stage = (
    <div
      ref={stageRef}
      className="absolute left-1/2 origin-top"
      style={{
        top: topMargin,
        width: STAGE_W,
        height: scroll ? undefined : stageHeight,
        transform: `translateX(-50%) scale(${scale})`,
        // Lets a row run to the screen's edge: `calc(1rem + var(--stage-bleed))`.
        ["--stage-bleed" as string]: `${bleed}px`,
        ["--stage-inset" as string]: `${inset}px`,
        // SIDE_MARGIN in stage px, for a row that scrolls out to the gutter.
        ["--stage-gutter" as string]: `${SIDE_MARGIN / scale}px`,
      }}
    >
      {children}
    </div>
  );

  return (
    <main
      ref={boxRef}
      className={`absolute inset-0 font-[family-name:var(--font-app-poppins)] text-[#444444] dark:text-white ${
        scroll ? "scrollbar-none overflow-y-auto overflow-x-hidden" : "overflow-hidden"
      } ${className}`}
    >
      {scroll ? (
        // The scaled stage takes no room of its own, so this holds the scroll height.
        <div className="relative w-full" style={{ height: topMargin + contentH * scale + NAV_RESERVE }}>
          {stage}
        </div>
      ) : (
        stage
      )}
    </main>
  );
}
