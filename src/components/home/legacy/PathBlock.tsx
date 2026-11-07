"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { motion } from "framer-motion";
import { Layout, Fit, Alignment, type Rive } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { hexRiveSource } from "@/lib/rive/hexFile";
import { HEX_ONBOARDING_TRIGGER, LIVE_PLATFORM } from "@/lib/rive/runtime";
import type { ArtboardFrame, BlockController, Launch, PlatformSpec, Point, Side } from "./types";
import { EASE, STAGE_H, STAGE_W, pathStateOf, sideOf } from "./pathGeometry";

export const LIVE_RIV_SCALE = 1;
export const LIVE_RIV = { ax: 47, ay: 22 } as const;
export const ANIMATED_LEVELS = 9;
export const CURRENT_ENTRY_STYLE = 6;
export const HEX_IDLE_FIRST_MS = 3200;
export const HEX_IDLE_REPEAT_MS = 4800;
export const BLEED = 80;
const MOUNT_MARGIN = "300px 0px";

export const artboardCentre = (cx: number, cy: number): Point => ({
  x: cx + (LIVE_PLATFORM.width / 2 - LIVE_RIV.ax) * LIVE_RIV_SCALE,
  y: cy + (LIVE_PLATFORM.height / 2 - LIVE_RIV.ay) * LIVE_RIV_SCALE,
});

export const canvasBox = (cx: number, cy: number, fullScreen: boolean) => {
  const centre = artboardCentre(cx, cy);
  const artW = LIVE_PLATFORM.width * LIVE_RIV_SCALE;
  const artH = LIVE_PLATFORM.height * LIVE_RIV_SCALE;
  const halfWidth = fullScreen ? Math.max(centre.x, STAGE_W - centre.x) : artW / 2 + BLEED * LIVE_RIV_SCALE;
  const halfHeight = fullScreen ? STAGE_H / 2 : artH / 2 + BLEED * LIVE_RIV_SCALE;
  const x0 = (halfWidth - artW / 2) / (halfWidth * 2);
  const y0 = (halfHeight - artH / 2) / (halfHeight * 2);
  return {
    style: {
      left: centre.x - halfWidth,
      top: centre.y - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    },
    frame: { x0, y0, x1: 1 - x0, y1: 1 - y0 } satisfies ArtboardFrame,
  };
};

export const useArtboardFrame = (rive: Rive | null, canvas: HTMLCanvasElement | null, frame: ArtboardFrame) => {
  useEffect(() => {
    if (!rive || !canvas) return;
    const resizeToCanvas = rive.resizeToCanvas.bind(rive);
    const applyFrame = () => {
      const { width, height } = canvas;
      const layout = new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
        minX: frame.x0 * width,
        minY: frame.y0 * height,
        maxX: frame.x1 * width,
        maxY: frame.y1 * height,
      });
      Object.assign(rive, { layout });
    };
    Object.assign(rive, {
      resizeToCanvas: () => {
        resizeToCanvas();
        applyFrame();
      },
    });
    applyFrame();
    return () => {
      Object.assign(rive, { resizeToCanvas });
    };
  }, [rive, canvas, frame]);
};

export function useNearViewport(ref: RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: MOUNT_MARGIN,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return near;
}

export function PathBlockCanvas({
  pathState,
  frame,
  side,
  enterTrigger = HEX_ONBOARDING_TRIGGER.enter,
  controllerRef,
}: {
  pathState: number;
  frame: ArtboardFrame;
  side: Side;
  enterTrigger?: string;
  controllerRef?: MutableRefObject<BlockController | null>;
}) {
  const { rive, canvas, RiveComponent } = useRive({
    ...hexRiveSource(),
    artboard: LIVE_PLATFORM.artboard,
    stateMachine: LIVE_PLATFORM.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  useArtboardFrame(rive, canvas, frame);

  useEffect(() => {
    const instance = rive?.viewModelInstance;
    if (!rive || !instance) return;
    const pathStateProperty = instance.number("pathState");
    if (pathStateProperty) pathStateProperty.value = pathState;
    if (!controllerRef) return;

    const entryStyle = instance.number("entryStyle");
    if (entryStyle) entryStyle.value = CURRENT_ENTRY_STYLE;
    instance.trigger(enterTrigger)?.trigger();

    let busy = false;
    const ambient = () => {
      if (!busy) instance.trigger(HEX_ONBOARDING_TRIGGER.idleAmbient)?.trigger();
    };
    let repeat = 0;
    const first = window.setTimeout(() => {
      ambient();
      repeat = window.setInterval(ambient, HEX_IDLE_REPEAT_MS);
    }, HEX_IDLE_FIRST_MS);

    controllerRef.current = {
      letsGo: () => {
        busy = true;
        const letsGo = instance.boolean("letsGo");
        if (letsGo) letsGo.value = true;
        instance.trigger(side === "left" ? "letsGoFromRight" : "letsGoFromLeft")?.trigger();
      },
      exitLetsGo: () => {
        busy = false;
        instance.trigger("exitLetsGo")?.trigger();
      },
      startLesson: () => {
        busy = true;
        instance.trigger("startLesson")?.trigger();
      },
      leave: (trigger) => {
        busy = true;
        instance.trigger(trigger)?.trigger();
      },
    };
    return () => {
      window.clearTimeout(first);
      window.clearInterval(repeat);
      controllerRef.current = null;
    };
  }, [rive, pathState, side, enterTrigger, controllerRef]);

  return <RiveComponent className="h-full w-full" />;
}

export function PathBlock({
  cx,
  cy,
  pathState,
  side,
  enterTrigger,
  onLaunch,
  controllerRef,
  wide,
}: {
  cx: number;
  cy: number;
  pathState: number;
  side: Side;
  wide: boolean;
  enterTrigger?: string;
  onLaunch?: () => void;
  controllerRef?: MutableRefObject<BlockController | null>;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(sentinelRef);
  const box = useMemo(() => canvasBox(cx, cy, wide), [cx, cy, wide]);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: cx - LIVE_RIV.ax * LIVE_RIV_SCALE,
          top: cy - LIVE_RIV.ay * LIVE_RIV_SCALE,
          width: LIVE_PLATFORM.width * LIVE_RIV_SCALE,
          height: LIVE_PLATFORM.height * LIVE_RIV_SCALE,
        }}
      />
      {near && (
        <div aria-hidden className="pointer-events-none absolute" style={box.style}>
          <PathBlockCanvas pathState={pathState} frame={box.frame} side={side} enterTrigger={enterTrigger} controllerRef={controllerRef} />
        </div>
      )}
      {onLaunch && (
        <button
          type="button"
          onClick={onLaunch}
          data-level-popup
          aria-label="Start level"
          className="absolute"
          style={{ left: cx - 76, top: cy - 52, width: 152, height: 104 }}
        />
      )}
    </>
  );
}

export function PlatformArt({ spec, launch }: { spec: PlatformSpec; launch: Launch }) {
  const { level, cx, cy } = spec;
  const isCurrent = level === launch.current;
  return (
    <PathBlock
      cx={cx}
      cy={cy}
      pathState={pathStateOf(level, launch.current)}
      side={sideOf(level)}
      wide={Math.abs(level - launch.current) <= 1}
      enterTrigger={isCurrent ? launch.enterTrigger : undefined}
      onLaunch={isCurrent ? launch.onLaunch : undefined}
      controllerRef={isCurrent ? launch.controllerRef : undefined}
    />
  );
}

export function PlatformNode({ spec, launch }: { spec: PlatformSpec; launch: Launch }) {
  const { level } = spec;
  if (level > ANIMATED_LEVELS) return <PlatformArt spec={spec} launch={launch} />;
  return (
    <motion.div
      className="absolute left-0 top-0 h-0 w-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.25 + (level - 1) * 0.05 }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3.6 + (level % 3) * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: level * 0.3,
        }}
      >
        <PlatformArt spec={spec} launch={launch} />
      </motion.div>
    </motion.div>
  );
}

