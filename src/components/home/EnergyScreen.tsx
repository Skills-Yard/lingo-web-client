"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Infinity as InfinityIcon, Play, X, Zap } from "lucide-react";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { addBatteryUnits, batteryLabel, refillBattery, setBatteryUnlimited, useBattery } from "./batteryStore";
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

/**
 * `/energy` — the battery's own screen: how full it is, and the ways to top
 * it up. Opened by tapping the battery; full screen, so no nav or stats bar.
 */
export function EnergyScreen({ onClose }: { onClose: () => void }) {
  const battery = useBattery();
  const full = battery.level >= 100;

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
            <div className="relative h-12 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E9F5F0] dark:bg-[#133A35]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-[#01A17F]"
                initial={false}
                animate={{ width: battery.unlimited ? "100%" : `${battery.level}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-[#2C2C2C] dark:text-white">
                {battery.unlimited ? "∞" : batteryLabel(battery).replace("/", " / ")}
              </span>
            </div>
            <PersistentBattery className="w-[56px]" />
          </motion.div>

          <div className="mt-6 flex flex-col gap-3">
            <motion.div {...reveal(0.1)} className="overflow-hidden rounded-[18px] bg-gradient-to-r from-[#A855F7] via-[#3B82F6] to-[#38A3C9] pt-8">
              <div className="-mt-8 mb-px h-8 px-4 text-[18px] font-extrabold italic leading-8 text-white">SUPER</div>
              <button
                type="button"
                onClick={() => setBatteryUnlimited(!battery.unlimited)}
                className="flex h-[72px] w-full cursor-pointer items-center gap-3 rounded-[18px] border-[1.5px] border-black/10 bg-white p-3.5 text-left transition-transform active:scale-[0.98] dark:border-white/12 dark:bg-[#1A1C22]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#22C55E] via-[#3B82F6] to-[#A855F7]">
                  <InfinityIcon className="h-6 w-6 text-white" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-extrabold leading-[22px] text-[#2C2C2C] dark:text-white">
                  Unlimited
                </span>
                <span className="shrink-0 text-sm font-extrabold uppercase leading-5 text-[#C026D3] dark:text-[#E879F9]">
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
                disabled={full || battery.unlimited}
                onClick={() => addBatteryUnits(BONUS_UNITS)}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
