"use client";

import { useId } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { feelTap } from "../feel";

export type MoveIcon = "up" | "down" | "left" | "right" | "turn-right" | "turn-left";

export type MoveControl = {
  id: string;
  label: string;
  icon: MoveIcon;
  /** Blue for going on, orange for going back or turning. */
  tone?: "blue" | "orange";
};

const TONE = {
  blue: { card: "bg-[#EDFAFE] shadow-[0_4px_0_#BFE6F2] dark:bg-[#15233A] dark:shadow-[0_4px_0_#0B1626]", from: "#74EBF7", to: "#0F88E5", stroke: "#1F4899", turn: "text-[#0F88E5]" },
  orange: { card: "bg-[#FEF8EC] shadow-[0_4px_0_#F2DFB8] dark:bg-[#2A2218] dark:shadow-[0_4px_0_#1A140C]", from: "#FA8728", to: "#FEEAA2", stroke: "#CD5B25", turn: "text-[#E07B1F]" },
} as const;

const ROTATION = { up: 0, right: 90, down: 180, left: 270 } as const;

/** The arrow of a move button: it points up and is turned to its direction. */
function Arrow({ icon, tone }: { icon: Extract<MoveIcon, "up" | "down" | "left" | "right">; tone: keyof typeof TONE }) {
  const id = `kit-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const look = TONE[tone];
  return (
    <svg aria-hidden width={29} height={46} viewBox="0 0 29 46" style={{ transform: `rotate(${ROTATION[icon]}deg)` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.from} />
          <stop offset="1" stopColor={look.to} />
        </linearGradient>
      </defs>
      <path d="M14.5 1 28 20h-8v25H9V20H1z" fill={`url(#${id})`} stroke={look.stroke} strokeLinejoin="round" />
    </svg>
  );
}

export type MovePadProps = {
  controls: readonly MoveControl[];
  /** Called with the pressed control's id. */
  onPress: (id: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Big 3D buttons that move Hex: each stands 4px up on a darker edge and sinks onto it when pressed. */
export function MovePad({ controls, onPress, disabled = false, className = "" }: MovePadProps) {
  return (
    <div className={`flex w-full justify-center gap-[18px] ${className}`}>
      {controls.map((control) => {
        const tone = control.tone ?? (control.icon === "up" || control.icon === "right" ? "blue" : "orange");
        const turn = control.icon === "turn-right" || control.icon === "turn-left";
        return (
          <button
            key={control.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              feelTap();
              onPress(control.id);
            }}
            className={`pointer-events-auto flex h-[99px] max-w-[150.5px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg p-3 text-[14px] leading-[140%] font-medium text-[#444444] transition-[translate,box-shadow] duration-100 enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-60 dark:text-white ${TONE[tone].card}`}
          >
            <span className="flex size-12 items-center justify-center">
              {turn ? (control.icon === "turn-right" ? <RotateCw aria-hidden className={`size-9 ${TONE[tone].turn}`} strokeWidth={3} /> : <RotateCcw aria-hidden className={`size-9 ${TONE[tone].turn}`} strokeWidth={3} />) : <Arrow icon={control.icon as "up"} tone={tone} />}
            </span>
            {control.label}
          </button>
        );
      })}
    </div>
  );
}
