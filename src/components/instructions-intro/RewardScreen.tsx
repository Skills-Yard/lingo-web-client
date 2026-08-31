"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ChevronRight } from "lucide-react";
import type { RewardSlide } from "@/lib/constants/instructionsIntro";

interface RewardScreenProps {
  slide: RewardSlide;
  onClaim?: () => void;
  onClaimStateChange?: (claimed: boolean) => void;
}

export function RewardScreen({
  slide,
  onClaim,
  onClaimStateChange,
}: RewardScreenProps) {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    setClaimed(true);
    onClaimStateChange?.(true);
    onClaim?.();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-2 md:min-h-full md:justify-center">
      {/* ── Heading — Frame 69: small "CLAIM" over the large green "reward" ── */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#2C2C2C] dark:text-white">
          {slide.highlightWord}
        </p>
        <h1 className="text-[44px] font-extrabold leading-none text-primary [font-family:'Abhaya_Libre_ExtraBold','Abhaya_Libre',Georgia,serif] md:text-[48px]">
          {slide.title}
        </h1>
      </div>

      {/* ── Hero — mascot on a soft glow; gem burst scatters once claimed ── */}
      <div className="relative flex h-[clamp(150px,26vh,267px)] w-full items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl [background:radial-gradient(circle_at_50%_60%,rgba(1,161,127,0.20),rgba(255,255,255,0)_70%)] dark:[background:radial-gradient(circle_at_50%_60%,rgba(1,161,127,0.30),rgba(9,12,19,0)_70%)]"
        />
        {claimed && (
          <>
            <Image
              src="/images/left-gems.png"
              alt=""
              width={171}
              height={178}
              className="pointer-events-none absolute left-0 top-1/2 w-20 -translate-y-1/2 select-none sm:w-24 md:w-28"
            />
            <Image
              src="/images/right-gems.png"
              alt=""
              width={171}
              height={178}
              className="pointer-events-none absolute right-0 top-1/2 w-20 -translate-y-1/2 select-none sm:w-24 md:w-28"
            />
          </>
        )}
        <Image
          src={slide.imageLight}
          alt="Reward"
          width={208}
          height={267}
          priority
          className="relative z-10 h-full w-auto max-w-full object-contain animate-pop-in"
        />
      </div>

      {claimed ? (
        <>
          {/* YOU GOT — Line 21 / Line 22 dividers around the label */}
          {slide.subtitle && (
            <div className="flex w-full items-center gap-3 animate-pop-in">
              <span className="h-px flex-1 bg-black/[0.08] dark:bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                {slide.subtitle}
              </span>
              <span className="h-px flex-1 bg-black/[0.08] dark:bg-white/10" />
            </div>
          )}

          {/* Reward cards — Frame 74 */}
          {slide.rewards && slide.rewards.length > 0 && (
            <div className="grid w-full grid-cols-2 gap-[18px] animate-pop-in">
              {slide.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex h-[76px] items-center justify-center gap-[11px] rounded-[6px] bg-[#1A1C22] shadow-[1px_1px_16px_3px_rgba(0,0,0,0.29)]"
                >
                  <Image
                    src={reward.icon}
                    alt=""
                    width={51}
                    height={50}
                    className="h-[50px] w-[50px] shrink-0 object-contain"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-semibold leading-none text-white">
                      {reward.value}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      {reward.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.actionDescription && (
            <p className="max-w-[233px] text-center text-xs font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
              {slide.actionDescription}
            </p>
          )}

          {slide.securityInfo && <SecurityCard slide={slide} />}
        </>
      ) : (
        <>
          {/* Claim Instantly — Frame 22 */}
          {slide.actionButtons?.map((button) => (
            <button
              key={button.id}
              type="button"
              onClick={() => button.id === "claim" && handleClaim()}
              className="h-[63px] w-full max-w-[280px] rounded-[6px] text-base font-semibold text-[#2C2C2C] shadow-[1px_1px_16px_3px_rgba(0,0,0,0.29)] transition-all hover:opacity-90 active:scale-95 [background:linear-gradient(90deg,#59EBCE_0%,#CCF772_100%)]"
            >
              {button.label}
            </button>
          ))}

          {slide.actionDescription && (
            <p className="max-w-[233px] text-center text-xs font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
              {slide.actionDescription}
            </p>
          )}

          {slide.securityInfo && <SecurityCard slide={slide} />}
        </>
      )}
    </div>
  );
}

function SecurityCard({ slide }: { slide: RewardSlide }) {
  return (
    <div className="flex h-[76px] w-full items-center rounded-[6px] bg-[#1A1C22] px-4 shadow-[1px_1px_16px_3px_rgba(0,0,0,0.29)]">
      <div className="mx-auto flex w-full max-w-[310px] items-center gap-3">
        <ShieldCheck className="h-[34px] w-[34px] shrink-0 text-[#7EEBC1]" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-white">{slide.securityInfo}</p>
          {slide.securitySubInfo && (
            <p className="mt-1 text-xs font-medium text-[#818185]">
              {slide.securitySubInfo}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#818185]" />
      </div>
    </div>
  );
}
