"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Sparkle } from "lucide-react";
import type {
  CoverSlide,
  CoverRevealSlide,
} from "@/lib/constants/instructionsIntro";
import { RobuAnchor, ROBU_DEFAULT_SIZE } from "./RobuAnchor";
import { SpeechBubble } from "./SpeechBubble";
import { RevealModal } from "./RevealModal";
import { BoxLottie } from "./BoxLottie";
import Image from "next/image";

// The whole row swapping vertical position (bubble/heading trading places)
// as the reveal card shows up — Robu's own glide between anchors is handled
// entirely by RobuStage now, so this is only for everything else in the row.
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
 */
export function CoverScreen({
  slide,
  revealed,
  onBoxTap,
  modalOpen,
  onOpenModal,
  onCloseModal,
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

  // Robu shrinks once it's crouched next to the reveal card — and starts
  // out bigger still, centered, for the entrance above. The default,
  // steady-state greeting size is the same shared `ROBU_DEFAULT_SIZE` every
  // other screen's resting Robu uses (see RobuAnchor) — not its own bespoke
  // value — so he reads as literally the same size everywhere, not just a
  // similar one. `revealed` (crouched beside the reveal card) and `entering`
  // (the one-shot entrance pose) stay their own, deliberately different
  // sizes for those specific moments.
  const robuSize = entering
    ? "h-99 w-99 sm:h-144 sm:w-144 md:h-180 md:w-180"
    : revealed
      ? "h-26 w-26 sm:h-40 sm:w-40 md:h-56 md:w-56"
      : ROBU_DEFAULT_SIZE;

  // Robu (with its speech bubble) and the heading swap vertical order once
  // the reveal card shows up: Robu leaves its greeting spot at the top and
  // "walks" down to sit right above the card it wants tapped, bubble and all
  // — so the two are always right next to each other, never split across the
  // screen. Both blocks stay put in the tree the whole time (same parent,
  // same slot); only their flex `order` changes, so Robu's Rive canvas never
  // remounts.
  const heroOrder = revealed ? "order-2" : "order-1";
  const headingOrder = revealed ? "order-1" : "order-2";

  // Robu stays on the same side on every screen — the left, matching every
  // other screen's RobuSays default (see RobuAnchor/RobuSays) — instead of
  // screen 1 putting him on the right while screen 2 puts him on the left.
  const robuSideOrder = "order-1";
  const bubbleSideOrder = "order-2";

  const robu = (
    // A plain (non-motion) wrapper on purpose: this only reserves Robu's
    // spot now (see RobuAnchor's doc comment) — position/size changes here
    // should land instantly, not animate, since RobuStage is what glides the
    // real mascot smoothly from wherever it last stood to this new rect.
    // Animating both the anchor *and* the mascot chasing it would fight each
    // other. Robu stays this one persistent anchor across screens 1 and 2
    // (its `order` just flips) instead of living inside a branch that swaps.
    <div className={`relative ${robuSideOrder}`}>
      {/* Idea lightbulb — screen 2 only, echoes the original cover art */}
      {isReveal && (
        <div
          aria-hidden
          className="absolute top-4 left-20  text-primary sm:-top-7 sm:-right-3 md:-top-9 md:-right-4"
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
    <div className="flex w-full flex-1 flex-col items-center gap-0 sm:gap-0 md:min-h-full">
      {/* ── Robu + speech bubble — laid out as real flex siblings (not
          absolute-positioned) so on narrow screens the bubble shrinks and
          wraps to stay glued to Robu instead of running off the edge.
          `flex-wrap` is the actual guarantee of that on the smallest phones
          (~320-360px): Robu's own fixed size plus the bubble's own max-width
          can still add up to more than the available width there, so rather
          than the bubble running past the edge, it drops to its own line
          underneath him — same fallback RobuSays uses for its wider bubble.
          Nothing here animates its own layout any more (no `layout` prop,
          no CSS `transition` on min-height/padding): Robu's own anchor lives
          inside it, and RobuStage is what glides the real mascot smoothly to
          wherever this row's *final* position ends up. Letting this row's
          own height/order also animate meant RobuStage was chasing a target
          that kept moving for the whole 700ms of that transition too,
          roughly doubling how long Robu took to settle. The bubble's own
          content swap (below) still crossfades on its own, so the now-instant
          reorder doesn't read as a cut. ── */}
      <div
        className={`relative top-2 z-10 flex-col w-full items-start justify-center gap-0 sm:gap-0  ${heroOrder} ${
          revealed
            ? "min-h-0 py-0"
            : "min-h-[20vh] sm:min-h-[40vh] sm:pt-10 md:min-h-[45vh] md:pt-14"
        }`}
      >
        {/* Screen 1 — greeting bubble to the left of Robu, tail pointing
            down-right into it; two little accent ticks above echo the
            reference design's "speaking" marks. Screen 2 — bubble sits to
            Robu's right instead, tail pointing back down-left into it.
            Robu itself (below) is NOT branched here — only its `order`
            flips — so it stays mounted and glides across instead of
            disappearing from one side and popping in on the other. */}
        <div
          className={`flex w-full ${
            revealed ? "items-center" : "items-start"
          } justify-center`}
        >
          {!isReveal && !entering && (
            // Bubble waits for Robu's entrance to settle instead of popping
            // in alongside a Robu that's still arriving. Robu now sits on
            // its left (see `robuSideOrder`), so the tail points back
            // left toward him instead of right.
            <div className={`relative -ml-6 ${bubbleSideOrder}`}>
              <div
                aria-hidden
                className="absolute  left-3 flex gap-1 text-primary "
              >
                <span className="h-3 w-0.5 rotate-[-14deg] rounded-full bg-current sm:h-4" />
                <span className="h-2 w-0.5 rotate-10 rounded-full bg-current sm:h-2.5" />
              </div>
              <SpeechBubble
                text={slide.robuGreeting}
                highlight={slide.robuGreetingHighlight}
                tailCorner="bottom-left"
                instant={instantSpeech}
              />
            </div>
          )}

          {/* Robu's own bubble here only ever carries the short "Hey, Click
              this box" nudge, and only once revealed — his actual intro
              line (`robuIntro`) lives in the heading slot below instead, for
              both of page 2's states (see that slot's own comment), so it's
              never shown in two places at once. Thanks to the order-flip
              above, this row already sits directly above the reveal card
              once `revealed`, so the prompt reads as Robu talking right at
              the box. */}
          {isReveal && revealed && (
            <div className={`relative flex items-center justify-center mr-6 ${bubbleSideOrder}`}>
              <AnimatePresence initial={false}>
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
            </div>
          )}
          {robu}

        </div>
      </div>

      {/* ── This slot is either the shared title+description heading (page
          1) or, on page 2, the "thinking" illustration — up throughout page
          2, both before and after it's revealed. Fades in once Robu's
          entrance settles rather than appearing with it. ── */}
      <motion.div
        layout="position"
        initial={false}
        animate={{ opacity: entering ? 0 : 1, y: entering ? 8 : 0 }}
        transition={WALK_TRANSITION}
        className={`px-4 text-center sm:px-6 ${headingOrder}`}
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
              {/* Robu's own bubble no longer carries this line at all (see
                  that block's own comment) — it lives here instead, for
                  both of page 2's states, styled as a normal headline
                  (matching the reference image) rather than a chat bubble.
                  Normal typewriter (tied to `instantSpeech`): this is now
                  the only place the line is ever typed out. */}
              <SpeechBubble
                text={slide.robuIntro}
                highlight={slide.robuIntroHighlight}
                instant={instantSpeech}
                size="heading"
              />
              {/* Natural size is 743x512 (~1.45:1) — `width`/`height` set
                  that intrinsic ratio for Next/Image, `h-auto` + the `w-*`
                  classes below are what actually size it on screen, so it
                  scales up cleanly instead of being squeezed into a fixed
                  box with the wrong aspect ratio. Light/dark are two actual
                  images (not a CSS filter) swapped via `dark:` — mirrors
                  every other theme-aware asset in this flow. Both images
                  share identical sizing so only which one is visible ever
                  differs. Up for both of page 2's states. */}
              <Image
                src="/images/thinkingWhite.png"
                alt=""
                aria-hidden="true"
                width={743}
                height={512}
                className="h-auto w-44 object-contain dark:hidden sm:w-64 md:w-72"
              />
              <Image
                src="/images/thinkingBlack.png"
                alt=""
                aria-hidden="true"
                width={743}
                height={512}
                className="hidden h-auto w-44 object-contain dark:block sm:w-64 md:w-72"
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

      {/* ── Reveal card — hidden until "Next" pops it in ── */}
      {isReveal && revealed && (
        <button
          type="button"
          onClick={() => {
            onOpenModal();
            onBoxTap();
          }}
          className="animate-pop-in order-3 -mt-2 flex h-36 w-full max-w-md items-center gap-4 rounded-[8px] bg-[#1A1C22] p-4 text-left shadow-lg transition-all duration-150 hover:bg-[#22252e] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-mt-1 sm:h-40 sm:gap-6 sm:p-5 md:h-44 md:gap-8 md:p-6"
          aria-label={`${slide.revealLabel} about ${slide.revealSubject}`}
        >
          <div className="flex h-28 w-28 shrink-0 items-center justify-center sm:h-30 sm:w-30 md:h-32 md:w-32">
            {/* Plays once, right as this card mounts (i.e. as soon as the
                reveal step appears) — no loop. Square and sized to fill the
                card's own height (minus its padding) so the box reads at
                full size instead of being squeezed down to fit a narrow slot. */}
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
      )}

      {/* ── Modal portal — Robu followed the learner in ── */}
      {isReveal && modalOpen && (
        <RevealModal slide={slide} onClose={onCloseModal} />
      )}
    </div>
  );
}
