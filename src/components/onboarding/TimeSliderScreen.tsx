"use client";

import { useRef } from "react";
import { Poppins } from "next/font/google";
import { Sparkles } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { TIME_SLIDER } from "@/lib/constants/onboarding";
import { QuestionTilesHeading } from "./QuestionHeading";
import { ZoxTabFox } from "./robu/ZoxTabFox";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

// The dial: an arc of a circle centred below the drawing, swept ±SWEEP_DEG
// either side of straight up. Drawn in a 300x175 viewBox.
const VIEW_W = 300;
const VIEW_H = 175;
const CX = 150;
const CY = 255;
const RADIUS = 182;
const SWEEP_DEG = 52;
const TRACK_WIDTH = 22;
const KNOB_R = 13;
const TICK_VALUES = [0, 5, 10, 15, 20] as const;

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
    const px = ((clientX - box.left) / box.width) * VIEW_W;
    const py = ((clientY - box.top) / box.height) * VIEW_H;
    const deg = (Math.atan2(px - CX, CY - py) * 180) / Math.PI;
    const clamped = Math.max(-SWEEP_DEG, Math.min(SWEEP_DEG, deg));
    const raw = ((clamped + SWEEP_DEG) / (2 * SWEEP_DEG)) * TIME_SLIDER.max;
    onChange(Math.max(TIME_SLIDER.min, Math.min(TIME_SLIDER.max, Math.round(raw))));
  };

  const knobDeg = valueToDeg(minutes);
  const knob = pointAt(knobDeg, RADIUS);

  return (
    <div className={`flex min-h-0 flex-col items-center px-4 ${poppins.className} ${className ?? ""}`}>
      <QuestionTilesHeading heading={heading} spoken={1} />

      <div aria-hidden className="mt-2 flex shrink-0 flex-col items-center">
        <ZoxTabFox className="h-[7.5rem] w-[7.5rem]" screenId="timeCommitment" />
        <div className="-mt-1 h-2.5 w-24 rounded-full bg-black/10 blur-[2px] dark:bg-white/10" />
      </div>

      <div className="mt-3 w-full max-w-[22rem] shrink-0 touch-none select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full cursor-pointer overflow-visible"
          role="slider"
          aria-label="Minutes per day"
          aria-valuemin={TIME_SLIDER.min}
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
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(TIME_SLIDER.max, minutes + 1));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(TIME_SLIDER.min, minutes - 1));
          }}
        >
          <defs>
            <linearGradient id="dial-fill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#00B8A9" />
              <stop offset="1" stopColor="#7FE3D2" />
            </linearGradient>
          </defs>

          <path
            d={arcPath(-SWEEP_DEG, SWEEP_DEG)}
            fill="none"
            stroke="currentColor"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            className="text-[#E8EDEF] dark:text-white/10"
          />
          <path
            d={arcPath(-SWEEP_DEG, knobDeg)}
            fill="none"
            stroke="url(#dial-fill)"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
          />

          {TICK_VALUES.map((value) => {
            const deg = valueToDeg(value);
            const a = pointAt(deg, RADIUS + TRACK_WIDTH / 2 + 4);
            const b = pointAt(deg, RADIUS + TRACK_WIDTH / 2 + 12);
            const label = pointAt(deg, RADIUS + TRACK_WIDTH / 2 + 28);
            return (
              <g key={value}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9AA3A8" strokeWidth={1.5} />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-[#1A1C22] text-[15px] font-medium dark:fill-white"
                >
                  {String(value).padStart(2, "0")}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${knob.x} ${knob.y - 38})`}>
            <rect x={-27} y={-13} width={54} height={26} rx={6} fill="#00806F" />
            <path d="M -6 13 L 0 20 L 6 13 Z" fill="#00806F" />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              y={0}
              className="fill-white text-[12px] font-medium"
            >
              {minutes} min
            </text>
          </g>
          <circle cx={knob.x} cy={knob.y} r={KNOB_R + 4} fill="white" />
          <circle cx={knob.x} cy={knob.y} r={KNOB_R} fill="#00B8A9" stroke="white" strokeWidth={3} />
        </svg>
      </div>

      <div className="mt-4 flex w-full max-w-[22rem] shrink-0 items-center gap-3 rounded-lg bg-[#EAF6F5] px-4 py-3 dark:bg-white/10">
        <Sparkles aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-[14px] font-medium leading-snug text-[#1A1C22] dark:text-white">
          {note.replace("{minutes}", String(minutes))}
        </p>
      </div>
    </div>
  );
}
