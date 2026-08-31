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

export function RewardScreen({ slide, onClaim, onClaimStateChange }: RewardScreenProps) {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    setClaimed(true);
    onClaimStateChange?.(true);
    onClaim?.();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 sm:gap-4 min-h-full justify-center py-2">
      {/* ── Heading — small "CLAIM" above, large green "reward" below ── */}
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {slide.highlightWord}
        </p>
        <h1 className="text-[26px] md:text-3xl font-bold tracking-tight text-primary">
          {slide.title}
        </h1>
      </div>

      {/* ── Hero — mascot on a radial glow; confetti scatter only once claimed ── */}
      <div className="relative flex h-[clamp(120px,22vh,208px)] w-full items-center justify-center">
        <Image
          src="/images/ring.png"
          alt=""
          width={400}
          height={400}
          className="pointer-events-none absolute left-1/2 top-0 h-full w-auto max-w-[280px] -translate-x-1/2 select-none"
        />
        {claimed && (
          <>
            <Image
              src="/images/left-gems.png"
              alt=""
              width={160}
              height={160}
              className="pointer-events-none absolute left-0 top-1/2 w-16 -translate-y-1/2 select-none sm:w-20 md:w-24"
            />
            <Image
              src="/images/right-gems.png"
              alt=""
              width={160}
              height={160}
              className="pointer-events-none absolute right-0 top-1/2 w-16 -translate-y-1/2 select-none sm:w-20 md:w-24"
            />
          </>
        )}
        <Image
          src={slide.imageLight}
          alt="Reward"
          width={320}
          height={320}
          priority
          className="relative z-10 h-full w-auto max-w-full object-contain animate-pop-in"
        />
      </div>

      {claimed ? (
        <>
          {/* YOU GOT */}
          {slide.subtitle && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary animate-pop-in">
              {slide.subtitle}
            </p>
          )}

          {/* Reward cards */}
          {slide.rewards && slide.rewards.length > 0 && (
            <div className="grid w-full grid-cols-2 gap-3 animate-pop-in">
              {slide.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 rounded-xl bg-[#1A1C22] px-4 py-2.5"
                >
                  <Image
                    src={reward.icon}
                    alt={reward.label}
                    width={40}
                    height={40}
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-lg font-bold text-white">{reward.value}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {reward.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.actionDescription && (
            <p className="max-w-xs text-center text-xs sm:text-sm text-muted-foreground">
              {slide.actionDescription}
            </p>
          )}

          {slide.securityInfo && <SecurityCard slide={slide} />}
        </>
      ) : (
        <>
          {/* Claim button */}
          {slide.actionButtons?.map((button) => (
            <button
              key={button.id}
              onClick={() => button.id === "claim" && handleClaim()}
              className="w-full rounded-xl bg-linear-to-r from-emerald-400 to-lime-300 px-4 py-3.5 text-base font-semibold text-emerald-900 shadow-lg shadow-emerald-500/20 transition-all hover:opacity-90 hover:shadow-xl active:scale-95"
            >
              {button.label}
            </button>
          ))}

          {slide.actionDescription && (
            <p className="max-w-xs text-center text-xs sm:text-sm text-muted-foreground">
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
    <div className="flex w-full items-center gap-3 rounded-xl bg-[#1A1C22] px-4 py-3">
      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{slide.securityInfo}</p>
        {slide.securitySubInfo && (
          <p className="text-xs text-neutral-400">{slide.securitySubInfo}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
    </div>
  );
}
