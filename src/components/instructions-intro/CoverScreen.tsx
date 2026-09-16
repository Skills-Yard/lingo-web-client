"use client";

import { AnimatePresence, motion } from "framer-motion";
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

  // Screen 1 has the bubble on Robu's left (Robu on the right); screen 2
  // flips that (Robu moves to the left, bubble to the right).
  const robuSideOrder = !isReveal ? "order-2" : "order-1";
  const bubbleSideOrder = !isReveal ? "order-1" : "order-2";

  const robu = (
    // A plain (non-motion) wrapper on purpose: this only reserves Robu's
    // spot now (see RobuAnchor's doc comment) — position/size changes here
    // should land instantly, not animate, since RobuStage is what glides the
    // real mascot smoothly from wherever it last stood to this new rect.
    // Animating both the anchor *and* the mascot chasing it would fight each
    // other. Robu stays this one persistent anchor across screens 1 and 2
    // (its `order` just flips) instead of living inside a branch that swaps.
    <div className={`relative ${robuSideOrder}`}>
      <RobuAnchor registerAnchor={registerAnchor} className={robuSize} />
    </div>
  );

  return (
    <div
      className={`flex w-full flex-1 flex-col items-center gap-0 sm:gap-0 md:min-h-full ${
        // Screen 2 only: center the whole hero+heading+card block vertically
        // in the available area instead of it hugging the top with a big
        // empty gap below (screen 1 keeps its own bespoke entrance spacing).
        isReveal ? "justify-center" : ""
      }`}
    >
      {/* ── Screen 2 only, and only once there's room for two columns
          (`lg:` — same split point GameBoardScreen uses for board/controls):
          switches from the flex-col stack (used everywhere below `lg`, and
          for screen 1 at every width) to a 2-col grid — Robu (with the
          heading text now beside him instead of above) and the reveal card
          stacked in the left column, the "thinking" illustration alone in
          the right column, spanning both rows so it centers against their
          combined height. The three children below are the exact same three
          the flex-col layout stacks (hero row, heading slot, card) — only
          their `lg:` placement changes; their mobile `order-*` values
          (`heroOrder`/`headingOrder`/the card's own fixed `order-3`) are
          untouched, so below `lg` this is pixel-identical to before this
          grid existed. Only one copy of the illustration ever renders (it
          just grows at `lg:` along with the rest of its column instead of a
          second, desktop-only copy being drawn elsewhere); the heading
          slot's own big headline text hides at `lg:` since the hero row
          shows that same line beside Robu there instead. ── */}
      <div
        className={`flex w-full flex-col items-center ${
          // Gated on `lg:` (1024), not `md:` (768): Robu's own box (sized to
          // match every other screen's resting Robu — see ROBU_DEFAULT_SIZE)
          // is nearly as wide as a two-column split leaves room for between
          // 768-1023px, which used to run the bubble straight into the
          // illustration there. Staying single-column (image below, like
          // mobile) until `lg:` gives both siblings the whole row's width
          // instead of a too-narrow column.
          isReveal ? "lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-12" : ""
        }`}
      >
        {/* ── Robu + speech bubble — laid out as real flex siblings (not
            absolute-positioned) so on narrow screens the bubble shrinks and
            wraps to stay glued to Robu instead of running off the edge.
            `flex-wrap` is the actual guarantee of that on the smallest
            phones (~320-360px): Robu's own fixed size plus the bubble's own
            max-width can still add up to more than the available width
            there, so rather than the bubble running past the edge, it drops
            to its own line underneath him — same fallback RobuSays uses for
            its wider bubble. Nothing here animates its own layout any more
            (no `layout` prop, no CSS `transition` on min-height/padding):
            Robu's own anchor lives inside it, and RobuStage is what glides
            the real mascot smoothly to wherever this row's *final* position
            ends up. Letting this row's own height/order also animate meant
            RobuStage was chasing a target that kept moving for the whole
            700ms of that transition too, roughly doubling how long Robu
            took to settle. The bubble's own content swap (below) still
            crossfades on its own, so the now-instant reorder doesn't read
            as a cut. At `lg:`, this row anchors the left column (row 1 of
            2), left-aligned instead of centered. ── */}
        <div
          className={`relative top-2 z-10 flex-col w-full items-start justify-center gap-0 sm:gap-0  ${heroOrder} ${
            revealed
              ? "min-h-0 pt-1 sm:pt-2 md:pt-0"
              : isReveal
                ? "min-h-[20vh] sm:min-h-[40vh] sm:pt-10 md:min-h-[30vh] md:pt-6"
                : "min-h-[15vh] sm:min-h-[40vh] sm:pt-10 md:min-h-[45vh] md:pt-14"
          } ${isReveal ? "lg:col-start-1 lg:row-start-1" : ""}`}
        >
          {/* Screen 1 — greeting bubble to the left of Robu, tail pointing
              down-right into it; two little accent ticks above echo the
              reference design's "speaking" marks. Screen 2 — bubble sits to
              Robu's right instead, tail pointing back down-left into it.
              Robu itself (below) is NOT branched here — only its `order`
              flips — so it stays mounted and glides across instead of
              disappearing from one side and popping in on the other. */}
          <div
            className={`flex w-full flex-wrap ${
              // Screen 2 (both before and after the card reveals) centers the
              // bubble on Robu's own vertical center instead of pinning it to
              // the top of his (much taller than his art) box — screen 1's
              // greeting keeps its original top alignment.
              isReveal ? "items-center" : "items-start"
            } justify-center ${isReveal ? "lg:flex-nowrap lg:justify-start" : ""}`}
          >
            {!isReveal && !entering && (
              // Bubble waits for Robu's entrance to settle instead of popping
              // in alongside a Robu that's still arriving.
              <div className={`relative -mr-6 ${bubbleSideOrder}`}>
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
                  tailCorner="bottom-right"
                  instant={instantSpeech}
                />
              </div>
            )}

            {robu}

            {isReveal && (
              // `min-w-0` unconditionally (not just at `lg:`): a flex item's
              // default `min-width: auto` refuses to shrink below its
              // content's own unwrapped width, which — now that the bubble
              // text scales up to `text-4xl` — is wide enough to overflow
              // the viewport below `lg:` instead of wrapping inside the
              // bubble's own max-width. `lg:flex-1` (only at `lg:`, where
              // the row goes single-line/nowrap) additionally sizes this to
              // fill whatever room Robu's (much wider than his art) box
              // actually leaves, so it doesn't run into the illustration
              // column on the right.
              <div
                className={`relative min-w-0 lg:-ml-6 lg:flex-1 ${bubbleSideOrder}`}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={revealed ? "prompt" : "intro"}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {revealed ? (
                      <>
                        {/* Mobile/tablet — short prompt bubble, unchanged. */}
                        <div className="lg:hidden">
                          <SpeechBubble
                            text={slide.robuPrompt}
                            tailCorner="bottom-left"
                            instant={instantSpeech}
                          />
                        </div>
                        {/* Desktop — the full line, right beside Robu
                            instead of the short prompt, since the standalone
                            headline above the illustration hides at `lg:`
                            (see the heading slot) in favor of living here. */}
                        <div className="hidden lg:block">
                          <SpeechBubble
                            text={slide.robuIntro}
                            highlight={slide.robuIntroHighlight}
                            instant={instantSpeech}
                            size="heading"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Mobile/tablet — this line is long enough that the
                            row wraps: Robu ends up on the line above instead
                            of beside the bubble, so the tail points up into
                            him instead of the desktop "beside him" corner —
                            otherwise it reads as talking to empty space. */}
                        <div className="lg:hidden">
                          <SpeechBubble
                            text={slide.robuIntro}
                            highlight={slide.robuIntroHighlight}
                            tailCorner="top-right"
                            instant={instantSpeech}
                            // Voices screen 2's title line. Only this (always-
                            // mounted, just CSS-hidden past `lg:`) copy carries
                            // the audio — the `hidden lg:block` copy right
                            // below renders the exact same text, and mounting
                            // the clip on both would double-play it. Sound has
                            // no notion of "hidden", so it plays either way
                            // regardless of which copy is actually visible.
                            audioSrc="/audios/screen_2_audio.mpeg"
                          />
                        </div>
                        {/* Desktop — row stays one line (Robu to the left),
                            tail points back down-left into him as before. */}
                        <div className="hidden lg:block">
                          <SpeechBubble
                            text={slide.robuIntro}
                            highlight={slide.robuIntroHighlight}
                            tailCorner="bottom-left"
                            instant={instantSpeech}
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── This slot is either the shared title+description heading (page
            1) or, on page 2, the "thinking" illustration — up throughout page
            2, both before and after it's revealed. Fades in once Robu's
            entrance settles rather than appearing with it. At `lg:`, this
            becomes the right column, spanning both of the left column's rows
            (hero row + card) so it centers against their combined height —
            its own headline text hides there since the hero row shows that
            line beside Robu instead (see above). ── */}
        <motion.div
          layout="position"
          initial={false}
          animate={{ opacity: entering ? 0 : 1, y: entering ? 8 : 0 }}
          transition={WALK_TRANSITION}
          className={`px-4 text-center sm:px-6 ${headingOrder} ${
            isReveal
              ? "lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:px-0"
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
                className="mx-auto flex h-full flex-col items-center justify-center gap-3"
              >
                {/* Once revealed, Robu's own bubble switches over to the
                    full line instead of the short "Hey, Click this box"
                    prompt at `lg:` (see the hero row above) — so this copy
                    of it hides there to avoid saying the same thing twice;
                    it only shows below `lg:`, where Robu's own bubble stays
                    the short prompt. Always `instant`, not tied to
                    `instantSpeech`: this exact line was just typed out a
                    second ago in Robu's own bubble, so re-running the
                    typewriter here would read as a stutter, not a fresh
                    line — it fades in already fully formed instead. */}
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
                    className="lg:hidden"
                  >
                    <SpeechBubble
                      text={slide.robuIntro}
                      highlight={slide.robuIntroHighlight}
                      instant
                      size="heading"
                    />
                  </motion.div>
                )}
                {/* Natural size is 743x512 (~1.45:1) — `width`/`height` set
                    that intrinsic ratio for Next/Image, `h-auto` + the `w-*`
                    classes below are what actually size it on screen, so it
                    scales up cleanly instead of being squeezed into a fixed
                    box with the wrong aspect ratio. Light/dark are two
                    actual images (not a CSS filter) swapped via `dark:` —
                    mirrors every other theme-aware asset in this flow. Up
                    for both of page 2's states (not just once revealed).
                    One copy only — see this block's own doc comment above. */}
                <Image
                  src="/images/thinkingWhite.png"
                  alt=""
                  aria-hidden="true"
                  width={743}
                  height={512}
                  className="h-auto w-44 object-contain dark:hidden sm:w-64 md:w-72 lg:w-full lg:max-w-md"
                />
                <Image
                  src="/images/thinkingBlack.png"
                  alt=""
                  aria-hidden="true"
                  width={743}
                  height={512}
                  className="hidden h-auto w-44 object-contain dark:block sm:w-64 md:w-72 lg:w-full lg:max-w-md"
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

        {/* ── Reveal card — hidden until "Next" pops it in. At `lg:` this is
            row 2 of the left column, directly under Robu. ── */}
        {isReveal && revealed && (
          <button
            type="button"
            onClick={() => {
              onOpenModal();
              onBoxTap();
            }}
            className="animate-pop-in order-3 -mt-2 flex h-36 w-full max-w-md items-center gap-4 rounded-[8px] bg-[#1A1C22] p-4 text-left shadow-lg transition-all duration-150 hover:bg-[#22252e] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-mt-1 sm:h-40 sm:gap-6 sm:p-5 md:h-44 md:gap-8 md:p-6 lg:col-start-1 lg:row-start-2 lg:mt-4"
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
      </div>

      {/* ── Modal portal — Robu followed the learner in ── */}
      {isReveal && modalOpen && (
        <RevealModal slide={slide} onClose={onCloseModal} />
      )}
    </div>
  );
}

