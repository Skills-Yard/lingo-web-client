"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { riveSource } from "@/lib/rive/riveCache";
import { LEVEL_ROAD } from "@/lib/rive/runtime";
import { useArtboardFrame, useNearViewport } from "../legacy/PathBlock";
import type { ArtboardFrame } from "../legacy/types";

/** The old image of the road (`grid-road.svg`): 184 x 117 px, the box every road is still placed by. */
export const ROAD_IMAGE = { width: 184, height: 117 } as const;

/**
 * Where the artboard sits in the old image's box, so that its slab covers the image's slab end to end (measured 2026-11-19 by
 * drawing both and comparing the pixels they cover: the slab is 84.25 x 54.75 artboard px, the image's 183.25 x 116.75 px; then
 * trimmed by measuring all 21 roads on the page at 8 screen sizes, which left every edge within 0.3px at stage scale 1). The
 * artboard is stretched a little unevenly to get both ends exactly (the file's slab is about 2% longer for its height than the
 * svg's). Sizes are for an image box 184px wide, and scaled with it. The two slabs are not drawn to the same spot of the
 * artboard, hence one fit for each `pathState`.
 */
const FIT = {
  scaleY: 2.1324,
  /** Per `pathState`: how far the artboard is stretched across (the two slabs are not exactly as long), and its top left corner. */
  byState: [
    { scaleX: 2.1731, x: 7.422, y: -1.669 },
    { scaleX: 2.1692, x: 9.328, y: -1.669 },
  ],
} as const;

/** Room around the artboard (px, at 184 wide) for the slab it draws past its own edges. */
const BLEED = 24;

/**
 * The file draws an opaque dark rectangle (about #292929) over the whole artboard, behind the slab. This takes it out: the
 * canvas is passed through a filter that makes every pixel as opaque as it is light, so the dark goes clear and the slab
 * (all light lavender) stays. Remove it, and `KEY_DARK_FILL`, once the artboard's own fill is taken out of the .riv.
 */
const KEY_ID = "road-art-key";
const KEY_DARK_FILL = true;

/** The filter (see `KEY_DARK_FILL`); put it in the page once, anywhere. */
export function RoadArtFilter() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <filter id={KEY_ID} colorInterpolationFilters="sRGB">
        {/* alpha = (luminance - 0.42) / 0.24: the dark (#292929, 0.16) is clear, everything lighter than 0.66 is solid. The ramp
            is high on purpose: a pixel on the slab's edge is part dark and part slab, and the darker it is the less of it is kept. */}
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.886 2.983 0.301 0 -1.75" result="key" />
        <feComposite in="SourceGraphic" in2="key" operator="in" />
      </filter>
    </svg>
  );
}

function RoadCanvas({ state, frame }: { state: number; frame: ArtboardFrame }) {
  const { rive, canvas, RiveComponent } = useRive({
    ...riveSource(LEVEL_ROAD.src),
    artboard: LEVEL_ROAD.artboard,
    stateMachine: LEVEL_ROAD.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Fill, alignment: Alignment.Center }),
  });
  useArtboardFrame(rive, canvas, frame, Fit.Fill);

  useEffect(() => {
    const property = rive?.viewModelInstance?.number(LEVEL_ROAD.property);
    if (property) property.value = state;
  }, [rive, state]);

  return (
    <div className="h-full w-full" style={KEY_DARK_FILL ? { filter: `url(#${KEY_ID})` } : undefined}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}

/**
 * One piece of the road between two levels, drawn by the road artboard (`LEVEL_ROAD`) in the box the old `grid-road.svg` was
 * placed in: `style` places that box (left, top) and `width` sizes it (its height follows). `mirrored` is how the old image
 * was turned: false runs down to the left, true down to the right.
 */
export function RoadArt({ width, mirrored, style, className }: { width: number; mirrored: boolean; style?: CSSProperties; className?: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const near = useNearViewport(sentinel);
  const state = mirrored ? LEVEL_ROAD.state.downRight : LEVEL_ROAD.state.downLeft;

  const { box, frame } = useMemo(() => {
    const f = width / ROAD_IMAGE.width;
    const fit = FIT.byState[state];
    const art = { x: fit.x * f, y: fit.y * f, w: LEVEL_ROAD.width * fit.scaleX * f, h: LEVEL_ROAD.height * FIT.scaleY * f };
    const bleed = BLEED * f;
    const w = art.w + 2 * bleed;
    const h = art.h + 2 * bleed;
    return {
      box: { left: art.x - bleed, top: art.y - bleed, width: w, height: h },
      frame: { x0: bleed / w, y0: bleed / h, x1: 1 - bleed / w, y1: 1 - bleed / h } satisfies ArtboardFrame,
    };
  }, [width, state]);

  return (
    <div
      ref={sentinel}
      aria-hidden
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
      style={{ ...style, width, height: (width * ROAD_IMAGE.height) / ROAD_IMAGE.width }}
    >
      {near && (
        <div className="absolute" style={box}>
          <RoadCanvas state={state} frame={frame} />
        </div>
      )}
    </div>
  );
}
