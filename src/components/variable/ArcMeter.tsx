"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/*
 * The Variable module's meter: the dial of the onboarding "how much time" screen (see `TimeSliderScreen`), with the
 * same arc, gradients, shine, ticks, labels, knob and tooltip, but with its range, step, labels and unit given by the
 * screen. Every amount the learner sets by dragging in this module is this dial; only the values change.
 *
 * It is drawn in that screen's own frame coordinates (390 wide): an arc of a circle centred below the drawing, swept
 * ±SWEEP_DEG either side of straight up, whose top (the middle of the range) is at DIAL_TOP.
 */
const CX = 195;
const DIAL_TOP = 451.5;
const RADIUS = 250;
const CY = DIAL_TOP + RADIUS;
const SWEEP_DEG = 40;
const TRACK_WIDTH = 22;
const KNOB_OUTER_R = 21.5;
const KNOB_INNER_R = 12.5;
/** The part of the frame the svg shows: x 20..370, y 385..590. */
const VIEW_X = 20;
const VIEW_Y = 385;
const VIEW_W = 350;
const VIEW_H = 205;
/** Labels sit inside the arc, on the radius through their tick, and turn with it so each stands along the curve. */
const LABEL_RADIUS = 188;
const GLIDE_MS = 220;
const TOOLTIP_H = 36;
/** The tooltip is never narrower than this (the onboarding one), and grows for a longer amount. */
const TOOLTIP_MIN_W = 81;
const TOOLTIP_CHAR_W = 10;
const TOOLTIP_PAD = 16;

const VIBRATE_MS = 12;
/** A short tick each time the dial lands on a new step. Browsers without the Vibration API (iOS Safari, desktop) skip it. */
const buzz = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(VIBRATE_MS);
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const pointAt = (deg: number, radius: number) => ({
  x: CX + radius * Math.sin(toRad(deg)),
  y: CY - radius * Math.cos(toRad(deg)),
});
const arcPath = (fromDeg: number, toDeg: number) => {
  const a = pointAt(fromDeg, RADIUS);
  const b = pointAt(toDeg, RADIUS);
  return `M ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 0 1 ${b.x} ${b.y}`;
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type ArcMeterProps = {
  /** The amount the knob is set to (always one of the steps). */
  value: number;
  /** Called each time the knob lands on a new step while it is dragged, or moved with the arrow keys. */
  onChange: (value: number) => void;
  /** Called when the knob is let go (or an arrow key is pressed), with the step it settles on. */
  onRelease?: (value: number) => void;
  min: number;
  max: number;
  /** The amounts the knob can be set to are `min`, `min + step`, ... `max`: one tick each. */
  step: number;
  /** The amounts written along the dial (their ticks are the long ones), as `[0, 250, 500, 750, 1000]`. */
  labels: readonly number[];
  /** Said after the amount in the tooltip, as `ml`. */
  unit: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  /** Shown in the empty room inside the arc, under the middle label (a hint or a result). */
  children?: ReactNode;
};

/** A draggable arc meter. The knob follows the finger freely and glides to the nearest step on release. */
export function ArcMeter({ value, onChange, onRelease, min, max, step, labels, unit, ariaLabel, disabled = false, className, children }: ArcMeterProps) {
  // Ids of the gradients and the mask are made unique, so two meters on a page never share them.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const svgRef = useRef<SVGSVGElement>(null);
  // Where the knob is drawn, in (fractional) amounts.
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const glideRef = useRef(0);
  // The step the knob settles on when let go, and whether a finger is on it.
  const snappedRef = useRef(value);
  const draggingRef = useRef(false);

  const span = max - min;
  const valueToDeg = (amount: number) => -SWEEP_DEG + ((amount - min) / span) * 2 * SWEEP_DEG;

  const showAt = (amount: number) => {
    shownRef.current = amount;
    setShown(amount);
  };
  const stopGlide = () => cancelAnimationFrame(glideRef.current);
  const glideTo = (target: number) => {
    stopGlide();
    const from = shownRef.current;
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / GLIDE_MS);
      showAt(from + (target - from) * (1 - (1 - t) ** 3));
      if (t < 1) glideRef.current = requestAnimationFrame(frame);
    };
    glideRef.current = requestAnimationFrame(frame);
  };
  useEffect(() => stopGlide, []);
  // The amount is set from outside (a reset): the knob goes there too.
  useEffect(() => {
    if (draggingRef.current || snappedRef.current === value) return;
    snappedRef.current = value;
    glideTo(value);
  }, [value]);

  const setFromPointer = (clientX: number, clientY: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const px = VIEW_X + ((clientX - box.left) / box.width) * VIEW_W;
    const py = VIEW_Y + ((clientY - box.top) / box.height) * VIEW_H;
    const deg = (Math.atan2(px - CX, CY - py) * 180) / Math.PI;
    const raw = clamp(min + ((clamp(deg, -SWEEP_DEG, SWEEP_DEG) + SWEEP_DEG) / (2 * SWEEP_DEG)) * span, min, max);
    stopGlide();
    showAt(raw);
    const snapped = clamp(min + Math.round((raw - min) / step) * step, min, max);
    if (snapped !== snappedRef.current) {
      snappedRef.current = snapped;
      buzz();
      onChange(snapped);
    }
  };
  const release = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    glideTo(snappedRef.current);
    onRelease?.(snappedRef.current);
  };
  const nudge = (next: number) => {
    if (next === snappedRef.current) return;
    buzz();
    snappedRef.current = next;
    onChange(next);
    glideTo(next);
    onRelease?.(next);
  };

  const knobDeg = valueToDeg(shown);
  const knob = pointAt(knobDeg, RADIUS);
  const tipText = `${value.toLocaleString("en-US")} ${unit}`;
  const tipW = Math.max(TOOLTIP_MIN_W, tipText.length * TOOLTIP_CHAR_W + TOOLTIP_PAD);

  // The tooltip sits centred above the knob, kept inside the view (at the ends it slides over and its pointer keeps following the knob).
  const tipX = clamp(knob.x - tipW / 2, VIEW_X + 4, VIEW_X + VIEW_W - 4 - tipW);
  const tipY = knob.y - 61.5;
  const pointerX = clamp(knob.x, tipX + 14, tipX + tipW - 14);

  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, index) => min + index * step);

  return (
    <div className={`relative w-full touch-none select-none ${className ?? ""}`}>
      <svg
        ref={svgRef}
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        // No focus box: it showed up after every drag, since the svg is focusable for the arrow keys.
        className={`w-full overflow-visible outline-none ${disabled ? "cursor-default" : "cursor-pointer"}`}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={tipText}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          setFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(Math.min(max, snappedRef.current + step));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(Math.max(min, snappedRef.current - step));
        }}
      >
        <defs>
          <linearGradient id={id("fill")} gradientUnits="userSpaceOnUse" x1="30" x2="195" y1="0" y2="0">
            <stop offset="0" stopColor="#00877C" />
            <stop offset="0.55" stopColor="#00B8A9" />
            <stop offset="1" stopColor="#1DE0BE" />
          </linearGradient>
          <linearGradient id={id("rest")} gradientUnits="userSpaceOnUse" x1="195" x2="360" y1="0" y2="0">
            <stop offset="0" stopColor="#D5E7E5" />
            <stop offset="1" stopColor="#E9EEF0" />
          </linearGradient>
          <linearGradient id={id("tip")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#01DBB5" />
            <stop offset="0.18" stopColor="#1FC1BB" />
            <stop offset="0.42" stopColor="#108585" />
            <stop offset="0.75" stopColor="#055C60" />
            <stop offset="1" stopColor="#00464D" />
          </linearGradient>
          <linearGradient id={id("knob")} x1="0.4" x2="0.6" y1="0" y2="1">
            <stop offset="0" stopColor="#1386B3" />
            <stop offset="1" stopColor="#01B8A9" />
          </linearGradient>
          <linearGradient id={id("sweep")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.55" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={id("fill-mask")} maskUnits="userSpaceOnUse" x={0} y={0} width={400} height={700}>
            <path d={arcPath(-SWEEP_DEG, knobDeg)} fill="none" stroke="white" strokeWidth={TRACK_WIDTH} strokeLinecap="round" />
          </mask>
        </defs>

        <path d={arcPath(-SWEEP_DEG, SWEEP_DEG)} fill="none" stroke={`url(#${id("rest")})`} strokeWidth={TRACK_WIDTH} strokeLinecap="round" className="dark:opacity-20" />
        <path d={arcPath(-SWEEP_DEG, knobDeg)} fill="none" stroke={`url(#${id("fill")})`} strokeWidth={TRACK_WIDTH} strokeLinecap="round" />
        {/* The same glossy shine as the top progress bar, clipped to the fill: a soft stripe along the outer edge plus a highlight that sweeps across and loops. */}
        <g mask={`url(#${id("fill-mask")})`} pointerEvents="none">
          <path
            d={arcPath(-SWEEP_DEG + 1.5, Math.max(knobDeg - 1.5, -SWEEP_DEG + 1.5))}
            transform={`translate(${CX} ${CY}) scale(${(RADIUS + 5) / RADIUS}) translate(${-CX} ${-CY})`}
            fill="none"
            stroke="white"
            strokeOpacity={0.5}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <rect x={0} y={0} width={90} height={700} fill={`url(#${id("sweep")})`}>
            <animate attributeName="x" values="-90;-90;380;380" keyTimes="0;0.05;0.7;1" dur="2.6s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* A tick per step inside the track; the labelled amounts' are longer. */}
        {ticks.map((amount) => {
          const major = labels.includes(amount);
          const deg = valueToDeg(amount);
          const a = pointAt(deg, RADIUS - TRACK_WIDTH / 2 - 7);
          const b = pointAt(deg, RADIUS - TRACK_WIDTH / 2 - (major ? 20 : 13));
          return <line key={amount} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major ? "#4A5358" : "#9AA3A8"} strokeWidth={major ? 1.6 : 1.2} strokeLinecap="round" />;
        })}

        {labels.map((amount) => {
          const deg = valueToDeg(amount);
          const { x, y } = pointAt(deg, LABEL_RADIUS);
          return (
            <text
              key={amount}
              x={x}
              y={y}
              transform={`rotate(${deg} ${x} ${y})`}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-black text-[24px] font-medium dark:fill-white"
            >
              {String(amount).padStart(2, "0")}
            </text>
          );
        })}

        <g style={{ filter: "drop-shadow(1px 1px 6.4px rgba(0,0,0,0.25))" }}>
          <circle cx={knob.x} cy={knob.y} r={KNOB_OUTER_R} fill="white" />
        </g>
        <circle cx={knob.x} cy={knob.y} r={KNOB_INNER_R} fill={`url(#${id("knob")})`} />

        <g>
          <rect x={tipX} y={tipY} width={tipW} height={TOOLTIP_H} rx={6} fill={`url(#${id("tip")})`} />
          <path d={`M ${pointerX - 8} ${tipY + TOOLTIP_H - 0.5} L ${pointerX} ${tipY + TOOLTIP_H + 8} L ${pointerX + 8} ${tipY + TOOLTIP_H - 0.5} Z`} fill="#00464D" />
          <text x={tipX + tipW / 2} y={tipY + TOOLTIP_H / 2} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[16px] font-semibold">
            {tipText}
          </text>
        </g>
      </svg>

      {/* The room inside the arc, under the middle label, is empty: a hint or a result stands there. */}
      {children && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: "76%" }}>
          {children}
        </div>
      )}
    </div>
  );
}
