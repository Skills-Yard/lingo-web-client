"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CharacterPortrait } from "@/components/character3d/CharacterPortrait";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { Column } from "./CharacterStage";
import { positionOf, SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";

/*
 * The first frame, "Let's Learn Sequences", laid out from the design's picture: the
 * two-line title with a sparkle, a big pale circle, the character from the head to
 * the hips filling the width in front of it (cropped by the main button). (The design's
 * tilted "[1, 2, 3, ...]" code window at the upper right was taken out on request.)
 * Numbers are stage px. The layout is `CharacterIntro`, which the Variable module's
 * "Let's Learn Variables" uses too (with its own tilted code tag as `children`).
 */

const POSITION = positionOf("intro");

const TITLE_AT = 100;

/** The circle behind the character. */
const CIRCLE = { left: 12, top: 242, size: 366 };

/**
 * The character: `bust` framing shows 1.44 m of height, with the head's top 0.2 of the way
 * down, so a box this tall puts the head at `top` + 0.2 * `height`. Its box is cut off just
 * over the main button, which is where the design's picture ends too.
 */
const CHARACTER = { top: 70, height: 672 };

const SPARKLE_COLOUR = "#3ED6EA";

/** Three short strokes fanning out from the lower left, as in the design. */
const Sparkle = ({ className }: { className: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke={SPARKLE_COLOUR} strokeWidth="2.6" strokeLinecap="round">
    <path d="M5 11 L7 3" />
    <path d="M10 16 L17 9" />
    <path d="M13 21 L21 19" />
  </svg>
);

/** The pale wash and the circle (light mode only, like the other backdrops); `circle` moves it, for a screen laid out like the intro. */
export const IntroBackdrop = ({ circle = CIRCLE }: { circle?: typeof CIRCLE }) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,#F1F2FD_0%,#F5F7FD_45%,#F6F7FD_100%)] dark:hidden">
    <Column>
      <div className="absolute rounded-full bg-[#E1E7FC]" style={{ left: circle.left, top: circle.top, width: circle.size, height: circle.size }} />
    </Column>
  </div>
);

/**
 * A module's first frame: "Let's Learn <word>" with a sparkle, the pale circle, the character standing (Idle B) in front of it
 * and Continue. `children` are laid out in the 390px column, over the character (stage px).
 */
export function CharacterIntro({
  step,
  total,
  onBack,
  onContinue,
  word,
  children,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onContinue: () => void;
  word: string;
  children?: ReactNode;
}) {
  return (
    <LevelTwoShell step={step} total={total} onBack={onBack} scene={<IntroBackdrop />} ctaLabel="Continue" onContinue={onContinue}>
      <Column>
        <div aria-hidden className="absolute inset-x-0 overflow-hidden" style={{ top: CHARACTER.top, bottom: aboveButtons(2) }}>
          <div className="absolute inset-x-0 top-0" style={{ height: CHARACTER.height }}>
            <CharacterPortrait animationId="idle-b" framing="bust" />
          </div>
        </div>
        {children}
      </Column>
      <ScreenTitle at={TITLE_AT}>
        <span className="block text-[34px] leading-[1.08] font-semibold text-[#0D186E] dark:text-white">Let’s Learn</span>
        <span className="relative inline-block text-[48px] leading-[1.08] font-bold">
          <span className="text-[#00A8B8]">{word}</span>
          <Sparkle className="absolute -top-[6px] -right-[30px] size-[26px]" />
        </span>
      </ScreenTitle>
    </LevelTwoShell>
  );
}

/**
 * The first frame, "Let's Learn Sequences": nothing to say yet, so the character just
 * stands (Idle B) and Continue moves on.
 */
export function Intro3DScreen() {
  const router = useRouter();
  return (
    <CharacterIntro
      step={POSITION}
      total={SEQUENCE_3D_STEPS}
      onBack={() => router.push(sequence3dPrevious(POSITION))}
      onContinue={() => router.push(sequence3dNext(POSITION))}
      word="Sequences"
    />
  );
}
