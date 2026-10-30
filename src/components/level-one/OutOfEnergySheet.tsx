"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Infinity as InfinityIcon, Zap } from "lucide-react";
import { batteryEmpty, RECHARGE_COST, refillBattery, setBatteryUnlimited, useBattery } from "@/components/home/batteryStore";
import { LEARNER_STATS } from "@/components/home/learnerStats";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Button3D } from "@/components/ui/Button3D";
import { buttonBottomMargin } from "./ActionRow";

/** How long the battery's drop to 0 is left to show before the sheet comes up. */
const APPEAR_DELAY_MS = 600;

/** The sheet's widest width (px), and the room its button has inside the padding. */
const SHEET_MAX_W = 430;
const BUTTON_WIDTH = `(min(100vw, ${SHEET_MAX_W}px) - 40px)`;

const GEM_SRC = "/images/stats/gem.png";

type Choice = "infinite" | "recharge";

/** The tick on the chosen card's corner. */
function Chosen() {
  return (
    <span className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#2F80ED] ring-2 ring-white">
      <Check className="h-4 w-4 text-white" strokeWidth={3} />
    </span>
  );
}

type OptionProps = {
  chosen: boolean;
  onChoose: () => void;
};

function InfiniteOption({ chosen, onChoose }: OptionProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={chosen}
        onClick={onChoose}
        className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[18px] bg-linear-to-br from-[#3F6BFF] to-[#9B51E0] text-center transition-transform active:scale-[0.98]"
      >
        <span className="flex h-8 items-center justify-center text-base leading-8 font-extrabold text-white italic">INFINITE</span>
        <span
          className={`m-0.5 mt-0 flex flex-1 flex-col items-center gap-3 rounded-b-[16px] px-2 pt-5 pb-4 transition-colors ${chosen ? "bg-[#F4EFFE]" : "bg-white"}`}
        >
          <span className="flex h-11 w-[60px] items-center justify-center rounded-[12px] bg-linear-to-br from-[#3F6BFF] to-[#9B51E0]">
            <InfinityIcon className="h-6 w-6 text-white" strokeWidth={2.4} />
          </span>
          <span className="text-base leading-[22px] font-extrabold text-[#2C2C2C]">Unlimited</span>
          <span className="h-5 text-sm leading-5 font-extrabold text-[#7C5CF0] uppercase">Try free</span>
        </span>
      </button>
      {chosen && <Chosen />}
    </div>
  );
}

function RechargeOption({ chosen, onChoose }: OptionProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={chosen}
        onClick={onChoose}
        // The top padding lines the icon up with the unlimited card's (its banner is 32px).
        className={`flex h-full w-full cursor-pointer flex-col items-center gap-3 rounded-[18px] border-2 px-2 pt-[50px] pb-4 text-center transition-[transform,background-color,border-color] active:scale-[0.98] ${
          chosen ? "border-[#2F80ED] bg-[#F2F7FE]" : "border-black/10 bg-white"
        }`}
      >
        <span className="flex h-11 w-[60px] items-center justify-center rounded-[12px] bg-[#E9F5F0]">
          <Zap className="h-6 w-6 text-[#01A17F]" fill="currentColor" />
        </span>
        <span className="text-base leading-[22px] font-extrabold text-[#2C2C2C]">Recharge</span>
        <span className="flex h-5 items-center gap-1.5 text-base leading-5 font-extrabold text-[#2F80ED]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GEM_SRC} alt="" draggable={false} className="h-5 w-5 select-none object-contain" />
          {RECHARGE_COST}
        </span>
      </button>
      {chosen && <Chosen />}
    </div>
  );
}

const CTA_LABEL: Record<Choice, string> = {
  infinite: "Try infinite free",
  recharge: "Recharge now",
};

/** Whether the battery has run out, so the screen behind the sheet must not be played. */
export const useOutOfEnergy = () => batteryEmpty(useBattery());

/**
 * Shown once the battery has run out: a sheet that comes up from the bottom
 * over a dimmed screen, with the gems at its top right and the two ways to
 * go on — unlimited (a free trial) or a recharge. It has no way to be
 * dismissed: "No thanks" leaves the module. The screen behind it is made inert
 * by the shell (`useOutOfEnergy`), so nothing there can be played meanwhile.
 */
export function OutOfEnergySheet() {
  const router = useRouter();
  const empty = useOutOfEnergy();
  const [mounted, setMounted] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [choice, setChoice] = useState<Choice>("infinite");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!empty) return;
    const timer = window.setTimeout(() => setDelayed(true), APPEAR_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setDelayed(false);
    };
  }, [empty]);

  const goOn = () => {
    // Either one lifts the block: the sheet leaves as the battery stops being empty.
    if (choice === "infinite") setBatteryUnlimited(true);
    else refillBattery();
  };

  const leave = () => {
    playClickSound();
    router.push("/level");
  };

  const sheet: ReactNode = (
    <AnimatePresence>
      {empty && delayed && (
        <>
          <motion.div
            key="dim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[2000] bg-black/50"
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal
            aria-label="Out of energy"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{ maxWidth: SHEET_MAX_W }}
            className="fixed inset-x-0 bottom-0 z-[2001] mx-auto w-full rounded-t-[28px] bg-white px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] font-[family-name:var(--font-app-poppins)] text-[#2C2C2C] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"
          >
            <div className="flex justify-end">
              <span className="flex items-center gap-1.5 text-base font-extrabold text-[#2F80ED]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={GEM_SRC} alt="" draggable={false} className="h-5 w-5 select-none object-contain" />
                {LEARNER_STATS.gems}
              </span>
            </div>

            <h2 className="mt-5 text-center text-2xl leading-8 font-extrabold">Out of energy! Recharge to keep playing.</h2>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <InfiniteOption chosen={choice === "infinite"} onChoose={() => setChoice("infinite")} />
              <RechargeOption chosen={choice === "recharge"} onChoose={() => setChoice("recharge")} />
            </div>

            <div className="mt-6" style={{ marginBottom: buttonBottomMargin(BUTTON_WIDTH) }}>
              <Button3D riveVariant="module" onPress={playClickSound} onClick={goOn} className="w-full">
                {CTA_LABEL[choice]}
              </Button3D>
            </div>
            <button
              type="button"
              onClick={leave}
              className="mt-4 block w-full cursor-pointer py-3 text-center text-base font-extrabold tracking-wide text-[#2F80ED] uppercase transition-opacity active:opacity-60"
            >
              No thanks
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Portalled to the body: above everything on the screen (Hex included), at the device's own size.
  return mounted ? createPortal(sheet, document.body) : null;
}
