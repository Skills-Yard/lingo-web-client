"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, Sliders, X } from "lucide-react";
import type { RoadSettings } from "./levelConfig";

interface RoadTunerProps {
  settings: RoadSettings;
  onChange: (settings: RoadSettings) => void;
  onReset: () => void;
}

export function RoadTuner({ settings, onChange, onReset }: RoadTunerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof RoadSettings, value: number) => {
    const next = { ...settings, [key]: value };
    onChange(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("lingo:road-settings-v2", JSON.stringify(next));
      } catch {}
    }
  };

  const handleCopy = () => {
    const code = `export const ROAD_SETTINGS: RoadSettings = {\n  width: ${settings.width},\n  offsetY: ${settings.offsetY},\n  mirroredLeft: ${settings.mirroredLeft},\n  unmirroredLeft: ${settings.unmirroredLeft},\n  gateTop: ${settings.gateTop},\n  gateLeft: ${settings.gateLeft},\n  rightCubeDx: ${settings.rightCubeDx ?? 0},\n  rightCubeDy: ${settings.rightCubeDy ?? 0},\n  leftCubeDx: ${settings.leftCubeDx ?? 0},\n  leftCubeDy: ${settings.leftCubeDy ?? 0},\n};`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fields: {
    key: keyof RoadSettings;
    label: string;
    sub: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    {
      key: "rightCubeDx",
      label: "Right Cubes X Offset",
      sub: "Move all right-side cubes left / right",
      min: -80,
      max: 80,
      step: 1,
    },
    {
      key: "rightCubeDy",
      label: "Right Cubes Y Offset",
      sub: "Move all right-side cubes up / down",
      min: -80,
      max: 80,
      step: 1,
    },
    {
      key: "leftCubeDx",
      label: "Left Cubes X Offset",
      sub: "Move all left-side cubes left / right",
      min: -80,
      max: 80,
      step: 1,
    },
    {
      key: "leftCubeDy",
      label: "Left Cubes Y Offset",
      sub: "Move all left-side cubes up / down",
      min: -80,
      max: 80,
      step: 1,
    },
    {
      key: "width",
      label: "Road Width",
      sub: "Applies to all roads",
      min: 140,
      max: 240,
      step: 1,
    },
    {
      key: "offsetY",
      label: "Vertical Offset (Y)",
      sub: "Shifts all roads up/down relative to tiles",
      min: -40,
      max: 40,
      step: 1,
    },
    {
      key: "mirroredLeft",
      label: "Mirrored Left (L→R)",
      sub: "Left-to-right roads X position (odd levels)",
      min: 60,
      max: 180,
      step: 1,
    },
    {
      key: "unmirroredLeft",
      label: "Unmirrored Left (R→L)",
      sub: "Right-to-left roads X position (even levels)",
      min: 60,
      max: 180,
      step: 1,
    },
    {
      key: "gateLeft",
      label: "Gate Road X",
      sub: "Top road under gate",
      min: 50,
      max: 160,
      step: 1,
    },
    {
      key: "gateTop",
      label: "Gate Road Y",
      sub: "Top road vertical position",
      min: 90,
      max: 190,
      step: 1,
    },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Road Position Tuner"
        title="Open Road Position Tuner"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-[#5D4CFE] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(93,76,254,0.4)] transition-all hover:bg-[#4E3EE8] hover:scale-105 active:scale-95"
      >
        <Sliders className="h-3.5 w-3.5" />
        <span>Road Tuner</span>
      </button>

      {/* Floating Tuner Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Road Position Tuner"
          className="fixed bottom-16 right-3 sm:right-6 z-50 w-[330px] max-w-[calc(100vw-24px)] rounded-2xl border border-black/10 bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-md dark:border-white/10 dark:bg-[#161D2B]/95 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/8 pb-2.5 dark:border-white/10">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B] dark:text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#5D4CFE]" />
                Road Position Tuner
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Formula applies identically to Levels 1–20
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Controls List */}
          <div className="mt-3 max-h-[340px] space-y-3.5 overflow-y-auto pr-1">
            {fields.map(({ key, label, sub, min, max, step }) => {
              const val = settings[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#1E293B] dark:text-white">{label}</span>
                      <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">{sub}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => update(key, val - step)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-black/10 bg-slate-100 text-xs font-bold hover:bg-slate-200 active:scale-95 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="min-w-[42px] text-center font-mono text-xs font-bold text-[#5D4CFE]">
                        {val}px
                      </span>
                      <button
                        type="button"
                        onClick={() => update(key, val + step)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-black/10 bg-slate-100 text-xs font-bold hover:bg-slate-200 active:scale-95 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) => update(key, Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#5D4CFE] dark:bg-slate-700"
                  />
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center gap-2 border-t border-black/8 pt-3 dark:border-white/10">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#5D4CFE] py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#4E3EE8] active:scale-98"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied Config!" : "Copy Config"}</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              title="Reset to default settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 hover:text-slate-800 active:scale-95 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

