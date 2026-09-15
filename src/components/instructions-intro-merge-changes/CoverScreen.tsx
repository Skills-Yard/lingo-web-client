"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Sparkle } from "lucide-react";
import type {
  CoverSlide,
  CoverRevealSlide,
} from "@/lib/constants/instructionsIntro";
import {
  RobuAnchor,
  ROBU_DEFAULT_SIZE,
  ROBU_TRAILING_GAP_PULL,
} from "./RobuAnchor";
import { SpeechBubble } from "./SpeechBubble";
import { RevealModal } from "./RevealModal";
import { BoxLottie } from "./BoxLottie";
import Image from "next/image";

// Only the screen-1 <-> screen-2 title/illustration crossfade (and screen
// 1's own entrance fade) animates position/opacity any more — see the doc
// comment above the illustration/title slot below for why Robu's own row no
// longer does.
const WALK_TRANSITION = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface CoverScreenProps {
  slide: CoverSlide | CoverRevealSlide;
  /** True once "Next" has been pressed on the "cover-reveal" step. */
  revealed: boolean;
  /** Fired the first time the reveal card is tapped, so the flow can unlock
   * the footer's primary button. */
  onBoxTap: () => void;
  /** Whether the reveal card's modal is open. Lifted up to the flow (rather
   * than local state) so its Back button can close it as its own step
   * instead of only being reachable through the modal's own X/Escape. */
  modalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  /** Fired the instant Robu finishes "saying" the reveal-step intro line
   * (step 02, before the box is revealed) — collapses what used to be two
   * separate manual Next-presses on this screen into one: the reveal now
   * happens on its own as soon as that line finishes typing, instead of
   * waiting on a press the learner would have to make anyway. */
  onIntroTypingComplete?: () => void;
  /** Skip Robu's typewriter for whichever line is showing — set once this
   * component's slide has already been seen. */
  instantSpeech?: boolean;
  /** Registers where Robu (a single persistent mascot — see RobuStage) should
   * stand for whichever of screens 1/2 is active. */
  registerAnchor: (el: HTMLDivElement | null) => void;
  /** Whether Robu's one-shot entrance (RobuStage's `intro.riv` timeline) has
   * finished. Owned by the flow, shared with RobuStage, so this screen's own
   * "hold the heading/bubble back and keep Robu big" choreography stays
   * synced to the real animation instead of a guessed timer. */
  robuIntroDone: boolean;
}

/**
 * Steps 01–02 share this single component instance (see
 * InstructionsIntroFlow — both slide kinds render the same `<CoverScreen>`
 * call site) so this screen's own layout never remounts between them: only
 * its size/offset and the speech bubble change as `slide.kind` / `revealed`
 * change. Robu himself is a separate, single persistent instance (RobuStage)
 * that glides to wherever this component's anchor currently sits.
 *
 * Screen 2's own anchor now stays in exactly one spot for the screen's whole
 * life (see the layout doc comment below) instead of relocating once
 * revealed — Robu no longer "walks down" to crouch beside the reveal card;
 * he just shrinks in place and the prompt + card pop in underneath him.
 */
export function CoverScreen({
  slide,
  revealed,
  onBoxTap,
  modalOpen,
  onOpenModal,
  onCloseModal,
  onIntroTypingComplete,
  instantSpeech,
  registerAnchor,
  robuIntroDone,
}: CoverScreenProps) {
  const isReveal = slide.kind === "cover-reveal";

  // Robu's very first entrance (step 01 only): his `intro.riv` timeline
  // plays big and centered, alone — heading and bubble stay held back, and
  // Robu stays at this bigger size, until that animation actually finishes.
  // This never re-triggers on `revealed` toggling or on later slides, since
  // `robuIntroDone` only ever flips true once for the whole session.
  const entering = slide.kind === "cover" && !robuIntroDone;

  // Robu shrinks once revealed — just his own size, not his position (see
  // the layout doc comment below) — and starts out bigger still, centered,
  // for the entrance above. The default, steady-state greeting size is the
  // same shared `ROBU_DEFAULT_SIZE` every other screen's resting Robu uses
  // (see RobuAnchor) — not its own bespoke value — so he reads as literally
  // the same size everywhere, not just a similar one.
  const robuSize = entering
    ? "h-99 w-99 sm:h-144 sm:w-144 md:h-180 md:w-180"
    : revealed
      ? "h-26 w-26 sm:h-40 sm:w-40 md:h-56 md:w-56"
      : ROBU_DEFAULT_SIZE;

  const robu = (
    // A plain (non-motion) wrapper on purpose: this only reserves Robu's
    // spot now (see RobuAnchor's doc comment) — position/size changes here
    // should land instantly, not animate, since RobuStage is what glides the
    // real mascot smoothly from wherever it last stood to this new rect.
    // One call site, one slot, for this whole screen's life — see the
    // layout doc comment below for why that changed.
    <div className="relative left-[-12px]">
      {/* Idea lightbulb — screen 2 only, echoes the original cover art */}
      {isReveal && (
        <div
          aria-hidden
          className="absolute top-4 left-20 text-primary sm:-top-7 sm:-right-3 md:-top-9 md:-right-4"
        >
          <Lightbulb
            className="h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9"
            strokeWidth={1.75}
          />
          <Sparkle className="absolute -left-3 top-1.5 h-2 w-2 fill-current opacity-70 sm:-left-4 sm:top-2 sm:h-2.5 sm:w-2.5" />
        </div>
      )}
      <RobuAnchor registerAnchor={registerAnchor} className={robuSize} />
    </div>
  );

  return (
    <div
      className={`flex w-full flex-1 flex-col items-center gap-0 md:min-h-full ${
        // Screen 1 (not the reveal step) centers its whole block — Robu row
        // + heading — at true vertical middle of the available height.
        !isReveal ? "justify-center" : ""
      } ${
        // From `lg:` up, screen 2 becomes a real 2-column layout: Robu and
        // everything he "says" (heading, then — once revealed — the prompt
        // and reveal card) live in a fixed left column; the "thinking"
        // illustration sits in a fixed right column, vertically centered
        // against the left column's full height. Both columns keep the
        // exact same position for the screen's whole life — only content
        // *inside* the left column appears in place as `revealed` flips,
        // nothing ever relocates between columns or rows. Screen 1 has no
        // second column (no illustration), so it stays the plain centered
        // stack at every width, unchanged.
        isReveal ? "lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-12" : ""
      }`}
    >
      {/* ── Left column (screen 2) / the only column (screen 1): Robu, his
          heading, and — once revealed — the prompt + reveal card, all
          stacked in one fixed column. Robu himself never relocates within
          this screen any more: the anchor below sits in exactly the same
          slot before and after `revealed` — only his own size (`robuSize`)
          and the sibling content beneath him change. ── */}
      <div
        className={`flex w-full flex-col items-center ${
          isReveal ? "lg:col-start-1 lg:items-start lg:text-left" : ""
        }`}
      >
        {/* ── Robu's one fixed anchor slot — laid out as a real flex sibling
            (not absolute-positioned) so on narrow screens the greeting
            wraps to stay glued to him instead of running off the edge.
            `min-h-*` below reserves his tallest (pre-reveal, default-size)
            footprint *always* — not just before `revealed` — so this slot's
            height never changes and nothing below it ever jumps when he
            shrinks or the prompt/card appear. `lg:` cancels that reserve:
            the grid's own `items-center` centers the row against the
            illustration's height instead. ── */}
        <div
          className={`relative top-2 z-10 flex w-full flex-col items-center justify-center gap-0 ${
            isReveal
              ? "min-h-[20vh] sm:min-h-[40vh] sm:pt-10 md:min-h-[45vh] md:pt-14 lg:min-h-0 lg:items-start lg:pt-0"
              : ""
          }`}
        >
          {/* Screen 1 — greeting reads as a plain heading beside Robu (no
              bubble chrome). Screen 2 keeps its own bubble treatment below. */}
          <div className="flex w-full items-center justify-center lg:justify-start">
            {!isReveal && !entering && (
              // Bubble waits for Robu's entrance to settle instead of popping
              // in alongside a Robu that's still arriving.
              <div className={`relative min-w-0 ${ROBU_TRAILING_GAP_PULL}`}>
                <SpeechBubble
                  text={slide.robuGreeting}
                  highlight={slide.robuGreetingHighlight}
                  instant={instantSpeech}
                  size="heading"
                />
              </div>
            )}
            {robu}
          </div>
        </div>

        {/* Screen 2's own heading — up for the whole screen (both before and
            after reveal), right under Robu's fixed slot instead of a second
            anchor further down. */}
        {isReveal && (
          <div className="w-full">
            <SpeechBubble
              text={slide.robuIntro}
              highlight={slide.robuIntroHighlight}
              instant={instantSpeech}
              size="heading"
              onTypingComplete={!revealed ? onIntroTypingComplete : undefined}
            />
          </div>
        )}

        {/* ── Reveal prompt + card — pop in below Robu's fixed slot once
            revealed, instead of him walking down to a second anchor beside
            them. ── */}
        {isReveal && revealed && (
          <div className="flex w-full flex-col items-center gap-3 lg:items-start">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key="prompt"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <SpeechBubble
                  text={slide.robuPrompt}
                  tailCorner="bottom-left"
                  instant={instantSpeech}
                />
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => {
                onOpenModal();
                onBoxTap();
              }}
              className="animate-pop-in flex h-36 w-full max-w-md items-center gap-4 rounded-[8px] bg-[#1A1C22] p-4 text-left shadow-lg transition-all duration-150 hover:bg-[#22252e] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-40 sm:gap-6 sm:p-5 md:h-44 md:gap-8 md:p-6"
              aria-label={`${slide.revealLabel} about ${slide.revealSubject}`}
            >
              <div className="flex h-28 w-28 shrink-0 items-center justify-center sm:h-30 sm:w-30 md:h-32 md:w-32">
                {/* Plays once, right as this card mounts (i.e. as soon as the
                    reveal step appears) — no loop. Square and sized to fill
                    the card's own height (minus its padding) so the box
                    reads at full size instead of being squeezed down to fit
                    a narrow slot. */}
                <BoxLottie className="h-full w-full" />
              </div>
              <div className="text-left">
                <p className="text-sm text-white font-medium sm:text-[15px] md:text-base">
                  {slide.revealLabel}
                </p>
                <p className="text-sm text-[#BEBEBE] font-medium sm:text-[15px] md:text-base">
                  about
                </p>
                <p className="text-lg font-semibold tracking-wide text-primary sm:text-xl md:text-2xl">
                  {slide.revealSubject}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Right column (screen 2) / bottom slot (screen 1): the "thinking"
          illustration, or the shared title+description heading. Fixed in
          its own column from `lg:` up — spans and centers against the left
          column's full height — and its own position never depends on
          `revealed`; only the left column's content changes around it.
          Fades in once Robu's entrance settles rather than appearing with
          it (screen 1 only — `entering` is always false on screen 2). ── */}
      <motion.div
        layout="position"
        initial={false}
        animate={{ opacity: entering ? 0 : 1, y: entering ? 8 : 0 }}
        transition={WALK_TRANSITION}
        className={`px-4 text-center sm:px-6 ${
          isReveal
            ? "lg:col-start-2 lg:h-full lg:px-0 lg:flex lg:items-center lg:justify-center"
            : ""
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isReveal ? (
            <motion.div
              key="thinking-image"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex flex-col items-center justify-center gap-3"
            >
              {/* Natural size is 743x512 (~1.45:1) — `width`/`height` set
                  that intrinsic ratio for Next/Image, `h-auto` + the fixed
                  `w-*` classes below are what actually size it on screen at
                  every breakpoint (including the base one), so it never
                  depends on the `width` attribute for its rendered size —
                  that's also why `width` itself stays constant instead of
                  varying with `revealed`: this image must render at the
                  exact same size and position whether or not the reveal has
                  fired yet. Light/dark are two actual images (not a CSS
                  filter) swapped via `dark:` — mirrors every other
                  theme-aware asset in this flow. */}
              <Image
                src="/images/thinkingWhite.png"
                alt=""
                aria-hidden="true"
                width={743}
                height={512}
                className="h-auto w-44 object-contain dark:hidden sm:w-64 md:w-72 lg:w-80"
              />
              <Image
                src="/images/thinkingBlack.png"
                alt=""
                aria-hidden="true"
                width={743}
                height={512}
                className="hidden h-auto w-44 object-contain dark:block sm:w-64 md:w-72 lg:w-80"
              />
            </motion.div>
          ) : (
            <motion.div
              key="title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h1 className="text-xl font-semibold tracking-tight leading-tight sm:text-2xl md:text-3xl">
                <span className="text-foreground">{slide.title}</span>{" "}
                <span className="text-primary">{slide.highlightTitle}</span>
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-relaxed text-muted-foreground md:max-w-sm md:text-base">
                {slide.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Modal portal — Robu followed the learner in ── */}
      {isReveal && modalOpen && (
        <RevealModal slide={slide} onClose={onCloseModal} />
      )}
    </div>
  );
}
