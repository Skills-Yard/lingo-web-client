"use client";

import { useRef } from "react";
import { Poppins } from "next/font/google";
import { Sparkles } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { TIME_SLIDER } from "@/lib/constants/onboarding";
import { ZoxTabFox } from "./robu/ZoxTabFox";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

// The dial, drawn in the Figma frame's own coordinates (390 wide): an arc of a
// circle centred below the drawing, swept ±SWEEP_DEG either side of straight
// up, whose top (the 10 min mark) is at DIAL_TOP.
const CX = 195;
const DIAL_TOP = 451.5;
const RADIUS = 250;
const CY = DIAL_TOP + RADIUS;
const SWEEP_DEG = 40;
const TRACK_WIDTH = 22;
const KNOB_OUTER_R = 21.5;
const KNOB_INNER_R = 12.5;
// The part of the frame the svg shows: x 20..370, y 385..590.
const VIEW_X = 20;
const VIEW_Y = 385;
const VIEW_W = 350;
const VIEW_H = 205;
// Labels sit below the track (inside the arc), at the spots Figma puts them.
const LABELS = [
  { value: 0, x: 36.5, y: 568 },
  { value: 5, x: 112.5, y: 526 },
  { value: 10, x: 195, y: 515 },
  { value: 15, x: 275, y: 526 },
  { value: 20, x: 350, y: 568 },
] as const;
const MAJOR_TICKS = [0, 5, 10, 15, 20];
// The knob jumps straight between 5, 10, 15 and 20 — no in-between minutes.
const STEP = 5;
const TOOLTIP_W = 81;
const TOOLTIP_H = 36;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const valueToDeg = (value: number) =>
  -SWEEP_DEG + (value / TIME_SLIDER.max) * 2 * SWEEP_DEG;
const pointAt = (deg: number, radius: number) => ({
  x: CX + radius * Math.sin(toRad(deg)),
  y: CY - radius * Math.cos(toRad(deg)),
});
const arcPath = (fromDeg: number, toDeg: number) => {
  const a = pointAt(fromDeg, RADIUS);
  const b = pointAt(toDeg, RADIUS);
  return `M ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 0 1 ${b.x} ${b.y}`;
};
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

interface TimeSliderScreenProps {
  heading: TextSpan[];
  /** The note under the dial; `{minutes}` becomes the picked value. */
  note: string;
  minutes: number;
  onChange: (minutes: number) => void;
  className?: string;
}

/**
 * "How much time can you give…": a draggable dial of minutes per day under
 * Zox, with a tooltip on the knob and an encouraging note beneath.
 */
export function TimeSliderScreen({
  heading,
  note,
  minutes,
  onChange,
  className,
}: TimeSliderScreenProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const setFromPointer = (clientX: number, clientY: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const px = VIEW_X + ((clientX - box.left) / box.width) * VIEW_W;
    const py = VIEW_Y + ((clientY - box.top) / box.height) * VIEW_H;
    const deg = (Math.atan2(px - CX, CY - py) * 180) / Math.PI;
    const raw = ((clamp(deg, -SWEEP_DEG, SWEEP_DEG) + SWEEP_DEG) / (2 * SWEEP_DEG)) * TIME_SLIDER.max;
    onChange(clamp(Math.round(raw / STEP) * STEP, STEP, TIME_SLIDER.max));
  };

  const knobDeg = valueToDeg(minutes);
  const knob = pointAt(knobDeg, RADIUS);

  // The tooltip sits up and to the right of the knob, kept inside the view;
  // its pointer keeps following the knob.
  const tipX = clamp(knob.x + 10.5, VIEW_X + 4, VIEW_X + VIEW_W - 4 - TOOLTIP_W);
  const tipY = knob.y - 61.5;
  const pointerX = clamp(knob.x + 31, tipX + 14, tipX + TOOLTIP_W - 14);

  return (
    <div
      className={`flex min-h-0 flex-col items-center px-4 ${poppins.className} ${className ?? ""}`}
    >
      {/* Figma: Poppins 600 20px / 134%, 350px wide. */}
      <h1 className="mx-auto mt-[clamp(4px,4.5vh,40px)] w-full max-w-[350px] shrink-0 text-center text-[20px] font-semibold leading-[1.34] text-[#2C2C2C] dark:text-white">
        {heading.map((span, i) => (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text}
          </span>
        ))}
      </h1>

      <div aria-hidden className="mt-2 flex shrink-0 flex-col items-center">
        <ZoxTabFox className="h-48 w-48" screenId="timeCommitment" />
        <div className="-mt-1 h-2.5 w-24 rounded-full bg-black/10 blur-[2px] dark:bg-white/10" />
      </div>

      {/* The dial and the note sit at the bottom of the screen, just above
          the Continue button; Hex stays up top. */}
      <div className="mt-auto flex w-full min-h-0 shrink-0 flex-col items-center pb-3">
      <div className="mt-[clamp(0px,1.5vh,12px)] w-full max-w-[350px] shrink-0 touch-none select-none">
        <svg
          ref={svgRef}
          viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
          // No focus box: it showed up after every drag, since the svg is
          // focusable for the arrow keys.
          className="w-full cursor-pointer overflow-visible outline-none"
          role="slider"
          aria-label="Minutes per day"
          aria-valuemin={STEP}
          aria-valuestep={STEP}
          aria-valuemax={TIME_SLIDER.max}
          aria-valuenow={minutes}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setFromPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e.clientX, e.clientY);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(TIME_SLIDER.max, minutes + STEP));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(STEP, minutes - STEP));
          }}
        >
          <defs>
            <linearGradient id="dial-fill" gradientUnits="userSpaceOnUse" x1="30" x2="195" y1="0" y2="0">
              <stop offset="0" stopColor="#00877C" />
              <stop offset="0.55" stopColor="#00B8A9" />
              <stop offset="1" stopColor="#1DE0BE" />
            </linearGradient>
            <linearGradient id="dial-rest" gradientUnits="userSpaceOnUse" x1="195" x2="360" y1="0" y2="0">
              <stop offset="0" stopColor="#D5E7E5" />
              <stop offset="1" stopColor="#E9EEF0" />
            </linearGradient>
            <linearGradient id="dial-tip" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#01DBB5" />
              <stop offset="0.18" stopColor="#1FC1BB" />
              <stop offset="0.42" stopColor="#108585" />
              <stop offset="0.75" stopColor="#055C60" />
              <stop offset="1" stopColor="#00464D" />
            </linearGradient>
            <linearGradient id="dial-knob" x1="0.4" x2="0.6" y1="0" y2="1">
              <stop offset="0" stopColor="#1386B3" />
              <stop offset="1" stopColor="#01B8A9" />
            </linearGradient>
          </defs>

          <path
            d={arcPath(-SWEEP_DEG, SWEEP_DEG)}
            fill="none"
            stroke="url(#dial-rest)"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            className="dark:opacity-20"
          />
          <path
            d={arcPath(-SWEEP_DEG, knobDeg)}
            fill="none"
            stroke="url(#dial-fill)"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
          />

          {/* A tick per minute inside the track; every fifth is longer. */}
          {Array.from({ length: TIME_SLIDER.max + 1 }, (_, value) => {
            const major = MAJOR_TICKS.includes(value);
            const deg = valueToDeg(value);
            const a = pointAt(deg, RADIUS - TRACK_WIDTH / 2 - 7);
            const b = pointAt(deg, RADIUS - TRACK_WIDTH / 2 - (major ? 20 : 13));
            return (
              <line
                key={value}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={major ? "#4A5358" : "#9AA3A8"}
                strokeWidth={major ? 1.6 : 1.2}
                strokeLinecap="round"
              />
            );
          })}

          {LABELS.map(({ value, x, y }) => (
            <text
              key={value}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-black text-[24px] font-medium dark:fill-white"
            >
              {String(value).padStart(2, "0")}
            </text>
          ))}

          <g style={{ filter: "drop-shadow(1px 1px 6.4px rgba(0,0,0,0.25))" }}>
            <circle cx={knob.x} cy={knob.y} r={KNOB_OUTER_R} fill="white" />
          </g>
          <circle cx={knob.x} cy={knob.y} r={KNOB_INNER_R} fill="url(#dial-knob)" />

          <g>
            <rect x={tipX} y={tipY} width={TOOLTIP_W} height={TOOLTIP_H} rx={6} fill="url(#dial-tip)" />
            <path
              d={`M ${pointerX - 8} ${tipY + TOOLTIP_H - 0.5} L ${pointerX} ${tipY + TOOLTIP_H + 8} L ${pointerX + 8} ${tipY + TOOLTIP_H - 0.5} Z`}
              fill="#00464D"
            />
            <text
              x={tipX + TOOLTIP_W / 2}
              y={tipY + TOOLTIP_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[16px] font-semibold"
            >
              {minutes} min
            </text>
          </g>
        </svg>
      </div>

      {/* Figma "Frame 29": 288x75, #EFF9FA, 8px corners, 33px stars. */}
      <div className="mt-[clamp(8px,1.5vh,14px)] flex min-h-[75px] w-full max-w-[288px] shrink-0 items-center justify-center gap-3 rounded-lg bg-[#EFF9FA] px-2 py-[18px] dark:bg-white/10">
        <Sparkles aria-hidden className="h-[33px] w-[33px] shrink-0 text-primary" strokeWidth={1.5} />
        <p className="w-[208px] text-[16px] font-medium leading-[1.34] text-[#1A1C22] dark:text-white">
          {note.replace("{minutes}", String(minutes))}
        </p>
      </div>
      </div>
    </div>
  );
}
