"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { configureRiveRuntime, LEVEL_ROAD } from "@/lib/rive/runtime";
import { riveSource } from "@/lib/rive/riveCache";
import type { ArtboardFrame } from "../legacy/types";
import type { Point } from "./levelConfig";

/**
 * A road's canvas is made when it comes within `MOUNT_MARGIN` px of the scroller's visible area, which is a screen or two
 * ahead of the learner, and kept until it is `RELEASE_MARGIN` px away. It is drawn only while within `DRAW_MARGIN` px. So on
 * the way down the path a road is already made and showing the right way before it comes into view, and scrolling back finds
 * it as it was: nothing is made again, so nothing starts over with the file's own default (`pathState` 0).
 */
const MOUNT_MARGIN = 1600;
const RELEASE_MARGIN = 5000;
const DRAW_MARGIN = 200;

/** The nearest ancestor that scrolls. (An observer with no root is clipped by it, and its margin does nothing past the clip.) */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if (overflow === "auto" || overflow === "scroll") return parent;
  }
  return null;
}

/** True while `ref` is within `margin` px (above or below) of its scroller's visible area. */
function useWithin(ref: RefObject<HTMLElement | null>, margin: number): boolean {
  const [within, setWithin] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setWithin(entry.isIntersecting), { root: scrollParent(element), rootMargin: `${margin}px 0px` });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);
  return within;
}

/** True from when `ref` first comes within `mountMargin` px of its scroller until it is further than `releaseMargin` px from it. */
function useKept(ref: RefObject<HTMLElement | null>, mountMargin: number, releaseMargin: number): boolean {
  const [kept, setKept] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = scrollParent(element);
    const mount = new IntersectionObserver(([entry]) => entry.isIntersecting && setKept(true), { root, rootMargin: `${mountMargin}px 0px` });
    const release = new IntersectionObserver(([entry]) => entry.isIntersecting || setKept(false), { root, rootMargin: `${releaseMargin}px 0px` });
    mount.observe(element);
    release.observe(element);
    return () => {
      mount.disconnect();
      release.disconnect();
    };
  }, [ref, mountMargin, releaseMargin]);
  return kept;
}

/**
 * Room around the artboard (stage px) for the slab it draws past its own edges (up to about 9 artboard px, 21 stage px, at
 * the right of the artboard for `pathState` 0, at its left for 1).
 */
const BLEED = 32;

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

/**
 * The artboard in a canvas, drawn into `frame` (fractions of the canvas, see `RoadArt`). `state` is written to `pathState` the
 * moment the file has loaded and the canvas stays clear until the machine has drawn it: a canvas shows the artboard's default
 * (0) until told otherwise, and a road that goes the other way (1) used to flash the wrong way for a moment each time it was made.
 * `state` is not written again. `drawing` stops and starts the drawing, the picture stays on the canvas when it stops.
 */
function RoadCanvas({ state, frame, drawing }: { state: number; frame: ArtboardFrame; drawing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<Rive | null>(null);
  const frameRef = useRef(frame);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    configureRiveRuntime();
    let disposed = false;
    let raf = 0;
    let rive: Rive | null = null;

    /** Fits the artboard into its frame on the canvas, as the canvas is now (its size changes with the screen and its pixel ratio). */
    const fit = () => {
      if (!rive) return;
      const { width, height } = canvas;
      const { x0, y0, x1, y1 } = frameRef.current;
      Object.assign(rive, { layout: new Layout({ fit: Fit.Fill, alignment: Alignment.Center, minX: x0 * width, minY: y0 * height, maxX: x1 * width, maxY: y1 * height }) });
    };
    const resize = () => {
      rive?.resizeDrawingSurfaceToCanvas();
      fit();
    };

    const onLoad = () => {
      // A cached file can finish loading before `new Rive` has returned.
      if (!rive) {
        queueMicrotask(onLoad);
        return;
      }
      const property = rive.viewModelInstance?.number(LEVEL_ROAD.property);
      if (property) property.value = stateRef.current;
      resize();
      // Two frames: the machine takes the value on one and draws it on the next. Only then is the canvas shown.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          if (!disposed) setReady(true);
        });
      });
    };

    rive = new Rive({
      ...riveSource(LEVEL_ROAD.src),
      canvas,
      artboard: LEVEL_ROAD.artboard,
      stateMachine: LEVEL_ROAD.stateMachine,
      autoplay: true,
      autoBind: true,
      layout: new Layout({ fit: Fit.Fill, alignment: Alignment.Center }),
      onLoad,
    });
    riveRef.current = rive;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      rive?.cleanup();
      riveRef.current = null;
    };
  }, []);

  // A road's ends move only if the layout does (the tuner); its direction (`state`) never changes for a road.
  useEffect(() => {
    frameRef.current = frame;
    stateRef.current = state;
    const rive = riveRef.current;
    const canvas = canvasRef.current;
    if (!rive?.viewModelInstance || !canvas) return;
    const property = rive.viewModelInstance.number(LEVEL_ROAD.property);
    if (property && property.value !== state) property.value = state;
    const { x0, y0, x1, y1 } = frame;
    Object.assign(rive, { layout: new Layout({ fit: Fit.Fill, alignment: Alignment.Center, minX: x0 * canvas.width, minY: y0 * canvas.height, maxX: x1 * canvas.width, maxY: y1 * canvas.height }) });
  }, [frame, state]);

  useEffect(() => {
    if (!ready) return;
    if (drawing) riveRef.current?.startRendering();
    else riveRef.current?.stopRendering();
  }, [drawing, ready]);

  return (
    <div className="h-full w-full" style={{ opacity: ready ? 1 : 0, ...(KEY_DARK_FILL ? { filter: `url(#${KEY_ID})` } : {}) }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/**
 * One piece of the road between two levels, drawn by the road artboard (`LEVEL_ROAD`). `from` and `to` are where the middle of
 * the slab's upper and lower end go, in stage px (see `RoadConfig`): the artboard is stretched and moved so that its slab's two
 * ends land exactly there. Which way it turns (`pathState` 0, 1) follows from where it goes. `origin` is the stage position of the
 * element this sits in, if it is not the stage itself.
 *
 * Both ends are put under the tiles, in the middle of their top faces, so no end of the slab shows. The distance between two
 * tiles is not on the slab's own slope (0.683 against its 0.6), so it is stretched a little more downwards than across to run
 * through both middles; going through just one and leaving the other end off to the side showed its corner outside the tile.
 */
export function RoadArt({ from, to, origin = { x: 0, y: 0 }, className }: { from: Point; to: Point; origin?: Point; className?: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const made = useKept(sentinel, MOUNT_MARGIN, RELEASE_MARGIN);
  const drawing = useWithin(sentinel, DRAW_MARGIN);
  const state = to.x > from.x ? LEVEL_ROAD.state.downRight : LEVEL_ROAD.state.downLeft;

  const { art, box, frame } = useMemo(() => {
    const caps = LEVEL_ROAD.caps[state];
    const scaleX = (to.x - from.x) / (caps.end.x - caps.start.x);
    const scaleY = (to.y - from.y) / (caps.end.y - caps.start.y);
    const art = {
      x: from.x - scaleX * caps.start.x - origin.x,
      y: from.y - scaleY * caps.start.y - origin.y,
      width: LEVEL_ROAD.width * scaleX,
      height: LEVEL_ROAD.height * scaleY,
    };
    const width = art.width + 2 * BLEED;
    const height = art.height + 2 * BLEED;
    return {
      art,
      box: { left: -BLEED, top: -BLEED, width, height },
      frame: { x0: BLEED / width, y0: BLEED / height, x1: 1 - BLEED / width, y1: 1 - BLEED / height } satisfies ArtboardFrame,
    };
  }, [from.x, from.y, to.x, to.y, origin.x, origin.y, state]);

  return (
    <div
      ref={sentinel}
      aria-hidden
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
      style={{ left: art.x, top: art.y, width: art.width, height: art.height }}
    >
      {made && (
        <div className="absolute" style={box}>
          <RoadCanvas state={state} frame={frame} drawing={drawing} />
        </div>
      )}
    </div>
  );
}
