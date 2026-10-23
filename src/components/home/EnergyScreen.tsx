"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { Infinity as InfinityIcon, Play, X, Zap } from "lucide-react";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { RiveProgressBar } from "@/components/ui/RiveProgressBar";
import { Confetti } from "@/components/level-one/Confetti";
import { vibrateForClaim } from "@/lib/haptics";
import { addBatteryUnits, refillBattery, setBatteryUnlimited, useBattery } from "./batteryStore";
import { HEADING } from "./homeFonts";
import { LEARNER_STATS } from "./learnerStats";

const EASE = [0.22, 1, 0.36, 1] as const;

const RECHARGE_COST = 350;
const BONUS_UNITS = 5;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

type EnergyCardProps = {
  icon: ReactNode;
  /** The square behind the icon. */
  tint: string;
  darkTint: string;
  title: string;
  /** Right-hand label, or the gem price when `gems` is set. */
  tag: ReactNode;
  tagClassName?: string;
  disabled?: boolean;
  onClick: () => void;
};

function EnergyCard({ icon, tint, darkTint, title, tag, tagClassName = "", disabled, onClick }: EnergyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[72px] w-full items-center gap-3 rounded-[18px] border-[1.5px] border-black/10 bg-white p-3.5 text-left transition-transform enabled:cursor-pointer enabled:active:scale-[0.98] disabled:opacity-45 dark:border-white/12 dark:bg-[#1A1C22]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] dark:bg-(--dark-tint)!"
        style={{ backgroundColor: tint, "--dark-tint": darkTint } as React.CSSProperties}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-extrabold leading-[22px] text-[#2C2C2C] dark:text-white">
        {title}
      </span>
      <span className={`shrink-0 text-sm font-extrabold uppercase leading-5 ${tagClassName}`}>{tag}</span>
    </button>
  );
}

const FILL_SECONDS = 1.2;
/** A claim: the yellow fill's run, the beat before green follows, the confetti's length. */
const YELLOW_SECONDS = 0.7;
const YELLOW_PAUSE_MS = 250;
const CELEBRATE_MS = 3500;

/** Counts up from empty when the screen opens, and again from wherever it
 * stands whenever `target` changes (a recharge). */
function useFillingLevel(target: number) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    const controls = animate(shownRef.current, target, {
      duration: FILL_SECONDS,
      ease: EASE,
      onUpdate: (value) => {
        shownRef.current = value;
        setShown(value);
      },
    });
    return () => controls.stop();
  }, [target]);
  return shown;
}

/**
 * `/energy` — the battery's own screen: how full it is, and the ways to top
 * it up. Opened by tapping the battery; full screen, so no nav or stats bar.
 */
export function EnergyScreen({ onClose }: { onClose: () => void }) {
  const battery = useBattery();
  const full = battery.level >= 100;
  // While a claim plays, the green fill is held where it was (`hold`) as the
  // yellow one grows ahead of it; releasing `hold` lets green run on and cover it.
  const [hold, setHold] = useState<number | null>(null);
  const [yellow, setYellow] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const greenLevel = useFillingLevel(hold ?? battery.level);
  const shownLevel = yellow === null ? greenLevel : Math.max(greenLevel, yellow);

  const claimFreeEnergy = () => {
    const from = battery.level;
    const to = Math.min(100, from + (BONUS_UNITS / LEARNER_STATS.battery.max) * 100);
    setHold(from);
    setYellow(from);
    setCelebrating(true);
    vibrateForClaim();
    addBatteryUnits(BONUS_UNITS);
    animate(from, to, {
      duration: YELLOW_SECONDS,
      ease: EASE,
      onUpdate: setYellow,
      onComplete: () => {
        window.setTimeout(() => setHold(null), YELLOW_PAUSE_MS);
        window.setTimeout(() => setYellow(null), YELLOW_PAUSE_MS + FILL_SECONDS * 1000 + 100);
      },
    });
    window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
  };

  return (
    <main className="h-dvh w-full overflow-hidden bg-white font-[family-name:var(--font-app-poppins)] text-[#444444] dark:bg-[#0F1F26] dark:text-white">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-[54px]">
          <div className="relative flex h-10 items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 cursor-pointer items-center justify-center text-[#818185] transition-transform active:scale-95 dark:text-[#9FA19F]"
            >
              <X className="h-[30px] w-[30px]" strokeWidth={1.6} />
            </button>
            <h1
              className={`pointer-events-none absolute inset-x-0 text-center text-[20px] leading-8 text-[#2C2C2C] dark:text-white ${HEADING}`}
            >
              Energy
            </h1>
            <span className="relative flex items-center gap-1.5 text-base font-extrabold text-[#2F80ED] dark:text-[#5AA2FF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/stats/gem.png" alt="" draggable={false} className="h-5 w-5 select-none object-contain" />
              {LEARNER_STATS.gems}
            </span>
          </div>

          <motion.div {...reveal(0.04)} className="mt-6 flex items-center gap-2">
            {battery.unlimited ? (
              // The artboard only has the teal look, so unlimited gets its own full gradient bar.
              <div className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-full bg-linear-to-r from-[#3F6BFF] to-[#9B51E0]">
                <InfinityIcon className="h-6 w-6 text-white" strokeWidth={3} aria-label="Infinite" />
              </div>
            ) : (
              <div className="relative min-w-0 flex-1">
                <RiveProgressBar value={battery.level} className="w-full" />
              </div>
            )}
            <PersistentBattery className="w-[56px]" />
          </motion.div>

          <div className="mt-6 flex flex-col gap-3">
            <motion.div {...reveal(0.1)} className="overflow-hidden rounded-[18px] bg-linear-to-br from-[#3F6BFF] to-[#9B51E0] pt-8">
              <div className="-mt-8 mb-px h-8 px-4 text-[18px] font-extrabold italic leading-8 text-white">INFINITE</div>
              <button
                type="button"
                onClick={() => setBatteryUnlimited(!battery.unlimited)}
                className={`flex h-[72px] w-full cursor-pointer items-center gap-3 rounded-[18px] border-[1.5px] p-3.5 text-left transition-[transform,background-color,border-color] active:scale-[0.98] ${
                  battery.unlimited
                    ? "border-[#7C5CF0] bg-[#F1EEFE] dark:bg-[#251F45]"
                    : "border-black/10 bg-white dark:border-white/12 dark:bg-[#1A1C22]"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-linear-to-br from-[#3F6BFF] to-[#9B51E0]">
                  <InfinityIcon className="h-6 w-6 text-white" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-extrabold leading-[22px] text-[#2C2C2C] dark:text-white">
                  Infinite
                </span>
                <span className="shrink-0 text-sm font-extrabold uppercase leading-5 text-[#7C5CF0] dark:text-[#A78BFA]">
                  {battery.unlimited ? "On" : "Free trial"}
                </span>
              </button>
            </motion.div>

            <motion.div {...reveal(0.15)}>
              <EnergyCard
                icon={<Zap className="h-6 w-6 text-[#01A17F]" fill="currentColor" />}
                tint="#E9F5F0"
                darkTint="#133A35"
                title="Recharge"
                tag={
                  <span className="flex items-center gap-1.5 text-[#2F80ED] dark:text-[#5AA2FF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/stats/gem.png" alt="" draggable={false} className="h-4 w-4 select-none object-contain" />
                    {RECHARGE_COST}
                  </span>
                }
                disabled={full || battery.unlimited}
                onClick={refillBattery}
              />
            </motion.div>

            <motion.div {...reveal(0.2)}>
              <EnergyCard
                icon={<Play className="h-5 w-5 text-[#FF8D42]" fill="currentColor" />}
                tint="#FFF3DE"
                darkTint="#3A2A1A"
                title={`+${BONUS_UNITS} energy`}
                tag="Watch ad"
                tagClassName="text-[#818185] dark:text-[#9FA19F]"
                disabled={full || battery.unlimited}
                onClick={() => addBatteryUnits(BONUS_UNITS)}
              />
            </motion.div>

            <motion.div {...reveal(0.25)}>
              <EnergyCard
                icon={<Zap className="h-6 w-6 text-[#2F80ED]" fill="currentColor" />}
                tint="#E5EFFD"
                darkTint="#1B2B40"
                title={`+${BONUS_UNITS} energy`}
                tag="Free"
                tagClassName="text-[#01A17F]"
                disabled={full || battery.unlimited || hold !== null}
                onClick={claimFreeEnergy}
              />
            </motion.div>
          </div>
        </div>
      </div>
      <Confetti active={celebrating} />
    </main>
  );
}
