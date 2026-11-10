"use client";

import { ArrowLeft } from "lucide-react";
import { GemRive } from "@/components/ui/GemRive";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { BatteryMenu } from "@/components/onboarding/BatteryMenu";
import { batteryCount, useBattery } from "../batteryStore";
import { LEARNER_STATS } from "../learnerStats";
import { LevelPathOptions } from "./LevelPathOptions";

interface LevelHeaderProps {
  onBack: () => void;
  title?: string;
  onDoubleClickTitle?: () => void;
  modulesDone: number;
  onCompleteModule: () => void;
  onUndoModule: () => void;
  onPickModule: (module: number) => void;
}

export function LevelHeader({
  onBack,
  title = "Data Analytics",
  onDoubleClickTitle,
  modulesDone,
  onCompleteModule,
  onUndoModule,
  onPickModule,
}: LevelHeaderProps) {
  const battery = useBattery();

  return (
    // Same gap above as the modules' headers: `--screen-top`.
    <header className="relative z-50 pt-(--screen-top) pb-5 flex items-center justify-between px-3 sm:px-5  bg-gradient-to-b from-white/95 via-white/80 to-transparent dark:from-[#0B132B]/95 dark:via-[#0B132B]/80">
      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 min-w-0 shrink">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to home"
          className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[#1E293B] transition-colors hover:bg-black/5 active:scale-95 dark:text-white dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
        </button>
        <h1
          className="text-[15px] sm:text-[19px] font-bold tracking-tight text-[#1E293B] dark:text-white whitespace-nowrap cursor-pointer select-none"
          onDoubleClick={onDoubleClickTitle}
          title="Double-click to test cycling level states"
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3.5 shrink-0 select-none">
        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3.5 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            <GemRive className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[14px] sm:text-[17px] leading-none">{LEARNER_STATS.gems}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-[#F59E0B] dark:text-[#FBBF24]">
            <img src="/images/idea.png" alt="" className="h-4.5 w-auto sm:h-6 select-none object-contain" />
            <span className="text-[14px] sm:text-[17px] leading-none">{LEARNER_STATS.hints}</span>
          </div>

          <BatteryMenu
            className="relative"
            buttonClassName="block text-left"
            extraOptions={(close) => (
              <LevelPathOptions
                done={modulesDone}
                onComplete={onCompleteModule}
                onUndo={onUndoModule}
                onPickModule={onPickModule}
                onClose={close}
              />
            )}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-[#01A17F] dark:text-[#34D399] cursor-pointer hover:opacity-85 transition-opacity">
              <PersistentBattery className="w-7 sm:w-9" />
              <span className="text-[14px] sm:text-[17px] leading-none">{batteryCount(battery)}</span>
            </div>
          </BatteryMenu>
        </div>
      </div>
    </header>
  );
}

