"use client";

import { useLayoutEffect, useRef } from "react";
import { getRobotHost, ROBOT_PICTURE_HEIGHT } from "@/lib/rive/robotHost";
import { COMMAND_ROBOT } from "@/lib/rive/runtime";

/** The widest the picture is drawn on screen (px): a phone's width fills the screen, a wider one gets white at its sides. */
const MAX_SCREEN_W = 560;

/** The picture's width on the stage (a CSS length): the stage's full width, up to `MAX_SCREEN_W` on screen
 * (the stage is scaled, so what is capped in screen px is divided by its scale). */
export const ROBOT_WIDTH = `min(var(--stage-w, ${COMMAND_ROBOT.width}px), calc(${MAX_SCREEN_W}px / var(--stage-scale, 1)))`;

/** A CSS length: `px` of the picture's height, at the width it is drawn. */
export const robotPx = (px: number) => `calc(${ROBOT_WIDTH} * ${px} / ${COMMAND_ROBOT.width})`;
/**
 * How much of the picture shows (0-1) at each height (px from its top, at its
 * 390px width): the room above the window fades in, and the floor under the
 * table fades out. Shaped like the Figma's two blurred white rectangles laid
 * over the picture's top and bottom (blurs of 50px and 26px).
 */
const FADE = [
  [0, 90],
  [0.12, 120],
  [0.3, 145],
  [0.5, 170],
  [0.7, 195],
  [0.85, 220],
  [0.94, 245],
  [1, 270],
  [1, 505],
  [0.85, 530],
  [0.5, 557],
  [0.15, 580],
  [0, ROBOT_PICTURE_HEIGHT],
] as const;

const MASK = `linear-gradient(180deg, ${FADE.map(([alpha, y]) => `rgba(0,0,0,${alpha}) ${(y / ROBOT_PICTURE_HEIGHT) * 100}%`).join(", ")})`;

/**
 * The module's one robot (see `robotHost`), moved into this slot. The slot is
 * the whole picture (the artboard and the room drawn past it) at the stage's
 * full width, up to `MAX_SCREEN_W` on screen, with its aspect ratio kept; its
 * top and bottom fade out (see `FADE`).
 */
export function PersistentRobot() {
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getRobotHost();
    element.appendChild(shared.element);
    shared.rive?.resizeDrawingSurfaceToCanvas();
    const observer = new ResizeObserver(() => shared.rive?.resizeDrawingSurfaceToCanvas());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={slot}
      aria-hidden
      className="pointer-events-none shrink-0"
      style={{
        width: ROBOT_WIDTH,
        aspectRatio: `${COMMAND_ROBOT.width} / ${ROBOT_PICTURE_HEIGHT}`,
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    />
  );
}
