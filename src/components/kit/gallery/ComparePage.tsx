"use client";

import { useState } from "react";
import Link from "next/link";
import { SEQUENCE_STEPS } from "@/components/sequence/sequence";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { playable, playableIds } from "../runtime/modules";
import { Tool, Tools } from "./parts";

/** Modules that are still only code (no data file yet): the left frame plays them, the right frame says so. Move one into `SOURCES` (`runtime/modules.ts`) when its data exists and drop it from here. */
const CODE_ONLY: Record<string, { steps: number }> = {
  sequence: { steps: SEQUENCE_STEPS },
};

const DEVICES = {
  "360 × 740": { width: 360, height: 740 },
  "390 × 844": { width: 390, height: 844 },
  "430 × 932": { width: 430, height: 932 },
} as const;

type Device = keyof typeof DEVICES;

/** One phone-sized frame on a page of the app. */
function Frame({ label, src, device, reload }: { label: string; src: string; device: Device; reload: number }) {
  const { width, height } = DEVICES[device];
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-mono text-[13px] font-semibold text-[#08A4AD]">{label}</h2>
      <iframe key={`${src}-${reload}-${device}`} src={src} title={label} width={width} height={height} className="rounded-[24px] border border-black/15 bg-white dark:border-white/20" />
      <a href={src} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-[#6B7480] underline dark:text-white/60">
        {src}
      </a>
    </div>
  );
}

/** The right-hand frame of a module that has no data file yet. */
function NoData({ label, device }: { label: string; device: Device }) {
  const { width, height } = DEVICES[device];
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-mono text-[13px] font-semibold text-[#08A4AD]">{label}</h2>
      <div style={{ width, height }} className="flex items-center justify-center rounded-[24px] border border-dashed border-black/25 px-8 text-center text-[14px] leading-5 text-[#6B7480] dark:border-white/30 dark:text-white/60">
        Not in data yet. This module is still drawn by code only, so there is nothing to compare it with.
      </div>
    </div>
  );
}

/**
 * `/kit/compare` — the way to look at the data-driven screens: the screen as the code draws it (left)
 * and the same screen played from its data file (right), at a phone's size. Move through the module
 * with the arrows, switch the device, light and dark. Either side keeps working: tap through it.
 */
export function ComparePage({ initialModule, initialStep }: { initialModule: string; initialStep: string }) {
  const ids = [...playableIds(), ...Object.keys(CODE_ONLY)];
  const [id, setId] = useState(ids.includes(initialModule) ? initialModule : ids[0]);
  const hasData = !(id in CODE_ONLY);
  const steps = playable(id)?.data.steps ?? CODE_ONLY[id]?.steps ?? 1;
  const [step, setStep] = useState(Math.min(steps, Math.max(1, Number(initialStep) || 1)));
  const [device, setDevice] = useState<Device>("390 × 844");
  const [reload, setReload] = useState(0);
  const screens = playable(id)?.data.screens ?? {};
  const kind = (() => {
    if (!hasData) return "code only (not in data yet)";
    const screen = screens[String(step)];
    if (!screen) return "";
    return "stages" in screen ? `${screen.stages.length} stage${screen.stages.length === 1 ? "" : "s"}: ${screen.stages.map((stage) => stage.kind).join(", ")}` : `whole-screen component (${screen.component})`;
  })();

  const move = (next: number) => setStep(Math.min(steps, Math.max(1, next)));
  const unlimitedBattery = () => {
    try {
      // The battery is kept in session storage, which the two frames share with this page.
      sessionStorage.setItem("lingo.battery", JSON.stringify({ level: 100, unlimited: true, charged: 0 }));
    } catch {
      // Storage blocked: the battery will run down as it does in play.
    }
    setReload((n) => n + 1);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-5 px-5 py-6 text-[#444444] dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] leading-8 font-semibold">Compare: code vs data</h1>
          <p className="text-[13px] text-[#6B7480] dark:text-white/60">
            {id} · screen {step} of {steps} · {kind}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/kit" className="text-[13px] font-semibold text-[#08A4AD] underline">
            Kit
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <Tools>
          {ids.map((other) => (
            <Tool
              key={other}
              label={other}
              active={other === id}
              onClick={() => {
                setId(other);
                setStep(1);
              }}
            />
          ))}
        </Tools>
        <Tools>
          <Tool label="◀ Previous" onClick={() => move(step - 1)} />
          <Tool label="Next ▶" onClick={() => move(step + 1)} />
          <select value={step} onChange={(event) => move(Number(event.target.value))} aria-label="Screen" className="rounded-md border border-black/15 bg-white px-2 py-1 text-[12px] font-semibold dark:border-white/20 dark:bg-[#15181E]">
            {Array.from({ length: steps }, (_, index) => (
              <option key={index} value={index + 1}>
                Screen {index + 1}
              </option>
            ))}
          </select>
          <Tool label="Complete" onClick={() => setStep(steps + 1)} />
        </Tools>
        <Tools>
          {(Object.keys(DEVICES) as Device[]).map((name) => (
            <Tool key={name} label={name} active={name === device} onClick={() => setDevice(name)} />
          ))}
          <Tool label="Unlimited battery" onClick={unlimitedBattery} />
          <Tool label="Reload both" onClick={() => setReload((n) => n + 1)} />
        </Tools>
      </div>

      <div className="flex flex-wrap items-start gap-6 overflow-x-auto pb-4">
        <Frame label="Code (what /module draws)" src={`/module/${id}?step=${step > steps ? "complete" : step}`} device={device} reload={reload} />
        {hasData ? (
          <Frame label="Data (what /kit/play draws)" src={`/kit/play/${id}?step=${step > steps ? "complete" : step}`} device={device} reload={reload} />
        ) : (
          <NoData label="Data (what /kit/play draws)" device={device} />
        )}
      </div>
    </main>
  );
}
