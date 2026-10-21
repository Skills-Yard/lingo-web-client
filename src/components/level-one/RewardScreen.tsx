"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, CircleHelp } from "lucide-react";
import { Poppins } from "next/font/google";
import { playClickSound } from "@/components/onboarding/clickSound";
import { levelOneHref } from "./LevelOneShell";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

/** The Figma frame this screen is laid out in. */
export const FRAME_W = 390;
export const FRAME_H = 844;
const MAX_SCALE = 1.5;

export const FLOAT_IN = { type: "spring", stiffness: 110, damping: 13 } as const;

export const useFrameScale = () => {
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => setScale(Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H, MAX_SCALE));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return scale;
};

/**
 * `/module?level=1&step=reward` — between screens 7 and 8 and not counted in
 * the 8: a closed gift ("Tap for reward!") that, once tapped, opens to "You
 * Got 5 gems, 24 coins" with a Claim button that goes on to screen 8.
 */
export function RewardScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const scale = useFrameScale();
  const [opened, setOpened] = useState(false);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white">
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        <Backdrop opened={opened} />

        <button
          type="button"
          onClick={() => {
            playClickSound();
            router.push(levelOneHref(7));
          }}
          aria-label="Back"
          className="absolute top-[51px] left-4 z-10 flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="absolute top-[51px] left-[335px] z-10 flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95"
        >
          <CircleHelp className="h-5 w-5" strokeWidth={1.6} />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {opened ? (
            <Reward key="reward" onClaim={onContinue ?? (() => router.push(levelOneHref(8)))} />
          ) : (
            <Gift key="gift" onOpen={() => setOpened(true)} />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/** The yellow background art: one picture per phase, cross-faded on open. */
function Backdrop({ opened }: { opened: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/level-one/reward-bg-closed.png" alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/level-one/reward-bg-open.png"
        alt=""
        draggable={false}
        className={`absolute inset-0 h-full w-full select-none transition-opacity duration-300 ${opened ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

const Sparkle = ({ className, white = false }: { className: string; white?: boolean }) => (
  <svg viewBox="0 0 24 28" aria-hidden className={`absolute ${className}`}>
    <defs>
      <linearGradient id="spark-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="9%" stopColor="#FDEA1F" />
        <stop offset="72%" stopColor="#FDB00B" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C13 9 15 12 24 14 C15 16 13 19 12 28 C11 19 9 16 0 14 C9 12 11 9 12 0Z"
      fill={white ? "#FFFFFF" : "url(#spark-gold)"}
    />
  </svg>
);

/** The closed gift: Hex peeking out, "Tap for reward!". */
function Gift({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        playClickSound();
        onOpen();
      }}
      aria-label="Tap for reward"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.12, transition: { duration: 0.2 } }}
      transition={FLOAT_IN}
      className="absolute inset-0 cursor-pointer outline-none"
    >
      <motion.img
        src="/images/level-one/gift-closed.png"
        alt=""
        draggable={false}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-[242px] left-1/2 h-[257px] w-[199px] max-w-none -translate-x-1/2 select-none"
      />
      <span
        className={`${poppins.className} absolute top-[573px] left-1/2 w-[187px] -translate-x-1/2 text-center text-[24px] leading-none font-semibold whitespace-nowrap text-[#444444]`}
      >
        Tap for <span className="text-[#FDB00B]">reward!</span>
      </span>
      <Sparkle className="top-[556px] left-[282px] h-[21px] w-[19px]" />
      <Sparkle className="top-[593px] left-[282px] h-[13px] w-[12px]" />
    </motion.button>
  );
}

const TILES = [
  { id: "gems", icon: "/images/level-one/reward-gem.png", size: "h-[49px] w-12", amount: "5", label: "GEMS", tint: "bg-[#E3FDF5]" },
  { id: "coins", icon: "/images/level-one/reward-coin.png", size: "h-[50px] w-[51px]", amount: "24", label: "COINS", tint: "bg-[#FEF6E2]" },
] as const;

/** The opened gift: "You Got" with the gems and coins, and Claim Instantly. */
function Reward({ onClaim }: { onClaim: () => void }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
    >
      <motion.img
        src="/images/level-one/gift-open.png"
        alt=""
        draggable={false}
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={FLOAT_IN}
        className="pointer-events-none absolute top-[168px] left-1/2 h-[280px] w-[258px] max-w-none -translate-x-1/2 select-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...FLOAT_IN, delay: 0.15 }}
        className="absolute inset-0"
      >
        <h1
          className={`${poppins.className} absolute top-[468px] left-1/2 -translate-x-1/2 text-[24px] leading-none font-semibold whitespace-nowrap text-[#444444]`}
        >
          You Got
        </h1>

        <div className="absolute top-[503px] left-4 flex w-[358px] items-center justify-between gap-[18px]">
          {TILES.map((tile) => (
            <div key={tile.id} className={`flex h-[76px] w-[170px] items-center justify-center gap-[11px] rounded-lg ${tile.tint}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tile.icon} alt="" draggable={false} className={`shrink-0 object-contain ${tile.size}`} />
              <span className={`${poppins.className} flex flex-col items-start gap-2`}>
                <span className="text-[20px] leading-none font-semibold text-[#444444]">{tile.amount}</span>
                <span className="text-[12px] leading-[1.4] font-medium text-[#01A17F]">{tile.label}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...FLOAT_IN, delay: 0.25 }}
        className="absolute inset-0"
      >
        <button
          type="button"
          aria-label="Claim Instantly"
          onClick={() => {
            playClickSound();
            onClaim();
          }}
          // The picture is the button plus its sparkles; sized so the button
          // itself is 213px wide, in the place the old one sat.
          className="absolute bottom-[144px] left-1/2 h-[98px] w-[257px] -translate-x-1/2 cursor-pointer transition-transform active:scale-[0.96]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/level-one/claim-button.png" alt="" draggable={false} className="h-full w-full select-none" />
        </button>
        <p className="absolute top-[711px] left-1/2 -translate-x-1/2 text-center text-[12px] leading-[1.4] font-medium whitespace-nowrap text-[#666666]">
          Reward added instantly.
        </p>
      </motion.div>
    </motion.div>
  );
}
