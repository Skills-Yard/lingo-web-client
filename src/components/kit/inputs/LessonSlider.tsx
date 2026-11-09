"use client";

import { Markup } from "../markup";

const THUMB =
  "[&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#08A4AD] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#08A4AD]";

export type LessonSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Written after the number ("ml", "minutes"). */
  unit?: string;
  /** What it is, for screen readers. */
  label?: string;
  /** A line under it, e.g. "Slide to fill the bottle" (`*teal*` words). */
  caption?: string;
  /** Called when the learner lets go (pointer or key), with where it stopped. */
  onRelease?: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

/** A slider with its value written above it. */
export function LessonSlider({ value, onChange, min = 0, max = 100, step = 1, unit, label = "Value", caption, onRelease, disabled = false, className = "" }: LessonSliderProps) {
  return (
    <div className={`pointer-events-auto flex w-full max-w-[300px] flex-col items-center gap-2 ${className}`}>
      <span className="text-[24px] leading-8 font-semibold text-[#444444] tabular-nums dark:text-white">
        {value.toLocaleString("en-IN")}
        {unit && <span className="ml-1 text-[16px] font-medium text-[#6B7480] dark:text-white/60">{unit}</span>}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={() => onRelease?.(value)}
        onKeyUp={() => onRelease?.(value)}
        className={`h-3 w-full cursor-pointer appearance-none rounded-full bg-[#D5DADF] accent-[#08A4AD] disabled:cursor-default dark:bg-white/20 ${THUMB}`}
      />
      {caption && (
        <span className="text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
          <Markup text={caption} />
        </span>
      )}
    </div>
  );
}
