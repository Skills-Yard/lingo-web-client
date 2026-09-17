"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { InstructionsIntroFlow as MergeChangesFlow } from "@/components/instructions-intro-merge-changes/InstructionsIntroFlow";
// `instructions-intro/` is both feat/res's own tree (compared against
// feat/merge-changes below) and, unrelatedly, "the current branch" `/`
// compares feat/himanshu against — same import, so it's aliased once and
// reused as both `ResFlow` and `CurrentFlow` rather than imported twice.
import { InstructionsIntroFlow as ResFlow } from "@/components/instructions-intro/InstructionsIntroFlow";
import { InstructionsIntroFlow as HimanshuFlow } from "@/components/instructions-intro-himanshu/InstructionsIntroFlow";

const CurrentFlow = ResFlow;

type FlowComponent = typeof MergeChangesFlow;

/** The two trees `/` vs. `/combined` each interleave — see the pairing each
 * page passes in and this component's own doc comment below. */
export type FlowPair = [slotZero: FlowComponent, slotOne: FlowComponent];

/** `/combined`'s own pair — the SM/MD-XL responsive merge: feat/merge-changes
 * vs. this branch's own already-merged tree. */
export const MERGE_VS_RES: FlowPair = [MergeChangesFlow, ResFlow];

/** `/`'s own pair — feat/himanshu vs. this branch, unrelated to the
 * responsive merge above. Exactly the pairing `/` compared before this
 * branch also grew its own `/combined` tool. */
export const HIMANSHU_VS_CURRENT: FlowPair = [HimanshuFlow, CurrentFlow];

/** 0 = the pair's first design, 1 = its second. */
type Slot = 0 | 1;

// Same badge every screen's shared `IntroHeader` renders — identical markup
// in both trees — is the only outside signal this file reads to notice a
// screen change.
const STEP_BADGE_SELECTOR = "header span.text-primary.font-semibold";

interface Position {
  /** 0-based index into INSTRUCTIONS_INTRO_SLIDES — shared by both trees. */
  screenIndex: number;
  slot: Slot;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/** Same circular-reveal technique `ReviewClient`/`ThemeContext` use, minus
 * the click-origin (there's no click to anchor it to here — the swap is
 * triggered by the flow's own Next/Back, not a dedicated toggle) — it just
 * wipes from the screen center. */
function runCombinedChange(commit: () => void) {
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!doc.startViewTransition || prefersReduced) {
    commit();
    return;
  }

  doc.startViewTransition(() => {
    flushSync(commit);
  });
}

// One step forward in the interleaved sequence: same screen, other tree
// first (slot 0 -> 1); once both trees of a screen are shown, move to the
// next screen's first tree (slot 1 -> 0, screenIndex + 1).
function advance({ screenIndex, slot }: Position): Position {
  return slot === 0 ? { screenIndex, slot: 1 } : { screenIndex: screenIndex + 1, slot: 0 };
}

// Exact inverse of advance() — used when the badge goes backward (Back was
// pressed inside whichever flow is mounted).
function retreat({ screenIndex, slot }: Position): Position | null {
  if (slot === 1) return { screenIndex, slot: 0 };
  if (screenIndex === 0) return null;
  return { screenIndex: screenIndex - 1, slot: 1 };
}

/**
 * `/combined` — one interleaved walkthrough of both branches' instructions-
 * intro designs for the SM/MD-XL responsive merge: screen 1 in
 * feat/merge-changes' design, then screen 1 in feat/res's (this branch's)
 * design, then screen 2 in feat/merge-changes' design, and so on — lets you
 * flip through every screen at every breakpoint and compare the two source
 * designs directly against the merged result (`feat/res`'s own tree here
 * IS the merge target: SM/mobile classes backported from feat/merge-changes,
 * md:/lg:/xl: classes kept as feat/res's own). `instructions-intro-merge-
 * changes/` is a frozen, standalone copy of feat/merge-changes' tree as it
 * stood at merge time — it never changes as `instructions-intro/` itself is
 * edited, so this comparison stays stable. The root `/` page runs this same
 * component over the *other* pair (feat/himanshu vs. this branch), and
 * `/review` still exists separately for comparing any two trees as full,
 * manually-switchable flows rather than interleaved.
 *
 * Neither tree's `InstructionsIntroFlow` gained a prop for this — each
 * screen's own Next/Back still just calls its own internal goNext/goBack,
 * completely unaware anything's being interleaved. This component instead
 * watches the shared header's step badge (identical markup in both trees)
 * to notice that happened, then swaps in a fresh mount of whichever
 * {design, screen} is next in the interleaved sequence — a full unmount +
 * mount of a different component tree, driven automatically by the flow's
 * own navigation instead of a switch click. `onComplete` (normally "the
 * whole flow is done") covers the one case a badge change can't: advancing
 * off the very last screen, where the mounted flow calls it instead of
 * moving its own index forward.
 *
 * Every step here is a full remount of a different component tree (a
 * different design, always), which would otherwise make Robu replay his
 * one-shot entrance animation on every single screen — exactly the "fresh
 * canvas cutting in" problem `RobuMascot`'s own doc comment describes.
 * `robuIntroSeen` latches true the first time we move off the very first
 * mount, and every mount after that passes `skipRobuIntro` so Robu picks up
 * straight in his ambient loop instead of re-entering from scratch.
 */
export function CombinedClient({
  initialScreenIndex,
  flows = MERGE_VS_RES,
  restartHref = "/combined",
}: {
  initialScreenIndex: number;
  /** Which two trees to interleave — defaults to `/combined`'s own pair.
   * `/` passes `HIMANSHU_VS_CURRENT` instead (see the exports above). */
  flows?: FlowPair;
  /** Where "Start over" links once every screen's been shown in both
   * designs — defaults to `/combined` itself; `/` passes `"/"`. */
  restartHref?: string;
}) {
  const [position, setPosition] = useState<Position>({
    screenIndex: initialScreenIndex,
    slot: 0,
  });
  const [done, setDone] = useState(false);
  const [robuIntroSeen, setRobuIntroSeen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // The badge number (`screenIndex + 1`) the currently-mounted flow started
  // at — what an observed badge change is measured against to tell a real
  // Next/Back apart from the fresh mount's own initial render.
  const baselineBadge = position.screenIndex + 1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || done) return;

    const onStepChange = () => {
      const badge = container.querySelector(STEP_BADGE_SELECTOR);
      const n = badge ? parseInt(badge.textContent ?? "", 10) : NaN;
      if (Number.isNaN(n)) return;

      if (n === baselineBadge + 1) {
        setRobuIntroSeen(true);
        runCombinedChange(() => setPosition((p) => advance(p)));
      } else if (n === baselineBadge - 1) {
        setRobuIntroSeen(true);
        setPosition((p) => retreat(p) ?? p);
      }
      // n === baselineBadge is just the fresh mount rendering — not a nav.
    };

    const observer = new MutationObserver(onStepChange);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [baselineBadge, done]);

  // Fires when the mounted flow's own Next is pressed on its last screen —
  // the one forward step that never shows up as a badge change (see above).
  const handleComplete = () => {
    if (position.slot === 0) {
      setRobuIntroSeen(true);
      runCombinedChange(() => setPosition((p) => advance(p)));
    } else {
      // Last design of the last screen — nothing left to interleave.
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <p className="text-lg font-semibold">
          That&apos;s every screen, in both designs.
        </p>
        <a href={restartHref} className="text-sm text-primary underline">
          Start over
        </a>
      </div>
    );
  }

  const [slotZeroFlow, slotOneFlow] = flows;
  const Flow = position.slot === 0 ? slotZeroFlow : slotOneFlow;

  return (
    <div ref={containerRef}>
      <Flow
        key={`${position.slot}-${position.screenIndex}`}
        initialIndex={position.screenIndex}
        onComplete={handleComplete}
        skipRobuIntro={robuIntroSeen}
      />
    </div>
  );
}
