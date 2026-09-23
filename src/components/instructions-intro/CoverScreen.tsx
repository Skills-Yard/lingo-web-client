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
  /** True once the reveal card has been tapped. Drives the card's own
   * attention-grabbing glow (see `cardHighlight` below) — it should stop
   * calling attention to itself the instant it's been tapped, same moment
   * Robu's own nudge (`robuShake` in the flow) stops. */
  boxTapped: boolean;
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
 */
export function CoverScreen({
  slide,
  revealed,
  onBoxTap,
  boxTapped,
  modalOpen,
  onOpenModal,
  onCloseModal,
  onIntroTypingComplete,
  instantSpeech,
  registerAnchor,
  robuIntroDone,
}: CoverScreenProps) {
  const isReveal = slide.kind === "cover-reveal";

  // The instant the reveal card pops in (right after screen 2's audio +
  // heading finish and `revealed` flips true), give it its own glow so it
  // reads as the thing to tap next — same trigger/lifetime as Robu's own
  // `robuShake` nudge in the flow, just expressed on the card itself.
  const cardHighlight = isReveal && revealed && !boxTapped;

  // Robu's very first entrance (step 01 only): the bottom-attached
  // `<RobuSplash>` (InstructionsIntroFlow) plays alone — heading and bubble
  // stay held back, and the persistent gliding mascot (`<RobuStage>`) isn't
  // even mounted yet, until that finishes. This never re-triggers on
  // `revealed` toggling or on later slides, since `robuIntroDone` only ever
  // flips true once for the whole session.
  const entering = slide.kind === "cover" && !robuIntroDone;

  // The persistent mascot's inline anchor doesn't need its own bigger size
  // for the entrance any more — `<RobuSplash>` (positioned separately, see
  // InstructionsIntroFlow) covers that, and `<RobuStage>` isn't even mounted
  // until `entering` is already false. The default, steady-state greeting
  // size is the same shared `ROBU_DEFAULT_SIZE` every other screen's resting
  // Robu uses (see RobuAnchor) — not its own bespoke value — so he reads as
  // literally the same size everywhere, not just a similar one. `revealed`
  // (crouched beside the reveal card) stays its own, deliberately different
  // size for that specific moment.
  const robuSize = revealed
      ? "h-39 w-39 sm:h-60 sm:w-60 md:h-84 md:w-84"
      : ROBU_DEFAULT_SIZE;

  // Both fixed, always — this is what actually pins the heading in place.
  // Screen 2's top slot (`heroOrder`) reserves the exact same height whether
  // or not Robu is currently the one standing in it (see its own className
  // below), so the heading right after it (`headingOrder`) never has reason
  // to move: nothing above it ever changes size. Robu himself still moves —
  // once revealed he leaves this top slot for a second anchor of his own
  // further down, right above the reveal card — but that's a second,
  // separate slot appearing later in the tree, not a reorder of these two.
  const heroOrder = "order-1";
  const headingOrder = "order-2";

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
    // other. Reused at two different call sites below (screen 2's top slot
    // and its second, post-reveal anchor) rather than one that just flips
    // `order` — RobuAnchor is cheap to mount twice (see its own doc
    // comment: it's never more than an invisible measurement box), and the
    // real Rive canvas living once in RobuStage is what actually makes the
    // move between them read as a glide instead of a cut.
    <div className={`relative left-[-12px] ${robuSideOrder}`}
    >
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
      className={`flex w-full flex-1 flex-col items-center gap-0 sm:gap-0 md:min-h-full ${
        // Screen 1 (not the reveal step) centers its whole block — Robu row
        // + heading — at true vertical middle of the available height,
        // instead of relying on the fixed vh spacer below to fake it. That
        // spacer only ever approximated centering for one assumed viewport
        // height; flex centering here holds at any height.
        !isReveal ? "justify-center" : ""
      }`}
    >
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
      <motion.div
        layout
        transition={WALK_TRANSITION}
        className={`relative top-2 z-10 flex-col w-full items-start justify-center gap-0 sm:gap-0  ${heroOrder} ${
          !isReveal
            ? // Screen 1: no fixed vh spacer — the root's justify-center
              // above now centers this row + the heading below it together.
              ""
            : revealed
              ? // Screen 2, revealed: Robu already left this slot for his
                // second anchor above the reveal card (below), so holding it
                // at its pre-reveal height would just leave a dead gap up
                // top. Collapsing it — animated, via the `layout` prop above
                // — reclaims that space and lets the header bubble + every
                // sibling below ride up to fill the screen instead. Safe to
                // animate now (this used to stay fixed always, see the
                // sibling branch below): RobuStage measures its anchor every
                // frame (see its own doc comment) specifically so it can
                // keep pace with an ancestor's own layout animation like
                // this one, instead of only snapping once it settles.
                "min-h-0 pt-1 sm:pt-2"
              : // Screen 2, before reveal: reserves exactly Robu's entrance
                // height so the heading below him never jumps as he arrives.
                "min-h-[20vh] sm:min-h-[40vh] sm:pt-10 md:min-h-[45vh] md:pt-14"
        }`}
      >
        {/* Screen 1 — greeting reads as a plain heading beside Robu (no
            bubble chrome), matching every other current-branch screen's
            RobuSays default. Screen 2 keeps its own bubble treatment below. */}
        <div className="flex w-full items-center justify-center">
          {!isReveal && !entering && (
            // Bubble waits for Robu's entrance to settle instead of popping
            // in alongside a Robu that's still arriving.
            <div
              className={`relative min-w-0 ${ROBU_TRAILING_GAP_PULL} ${bubbleSideOrder}`}
            >
              {/* Invisible, already-complete copy of the line — reserves
                  this block's final width up front so the row above (now
                  `justify-center`) can center Robu + the greeting as a pair
                  without recomputing — and visibly sliding them sideways —
                  on every keystroke of the real typewriter underneath. Same
                  "invisible placeholder reserves the box" idiom RobuAnchor
                  itself uses. */}
              <SpeechBubble
                text={slide.robuGreeting}
                highlight={slide.robuGreetingHighlight}
                instant
                size="heading"
                className="invisible"
              />
              <SpeechBubble
                text={slide.robuGreeting}
                highlight={slide.robuGreetingHighlight}
                instant={instantSpeech}
                size="heading"
                className="absolute inset-0"
              />
            </div>
          )}

          {/* Robu himself only stands in this top slot while screen 2 hasn't
              revealed yet (or on screen 1, always — `revealed` never flips
              there). Once revealed he moves to his own second anchor further
              down, right above the card, and this slot collapses (see its
              own `layout` animation above) instead of staying reserved and
              empty. */}
          {(!isReveal || !revealed) && robu}
        </div>
      </motion.div>

      {/* ── Robu's second anchor — only once revealed, sitting right above
          the reveal card instead of stranded up top next to a heading he's
          no longer talking about. A real second `<RobuAnchor>` mount (not a
          reorder of the one above): cheap, since RobuAnchor is only ever an
          invisible measurement box (see its own doc comment) — the actual
          Rive mascot lives once, in RobuStage, and just glides over to
          whichever anchor is currently registered. ── */}
      {isReveal && (
        <SpeechBubble
          text={slide.robuIntro}
          highlight={slide.robuIntroHighlight}
          instant={instantSpeech}
          size="heading"
          onTypingComplete={!revealed ? onIntroTypingComplete : undefined}
          // Voices screen 2's title line: the typewriter is re-paced to this
          // audio's own duration, and the reveal card (gated on
          // `onIntroTypingComplete` above) now waits for the audio to
          // actually finish instead of just the text catching up to it.
          audioSrc="/audios/screen_2_audio.mpeg"
          // `self-start` (overriding the outer column's own `items-center`)
          // + a fixed left padding matching the title/description block
          // right below it: left as a plain flex child here, this heading
          // would recenter itself against the column on every keystroke
          // (its own shrink-to-fit width growing as the typewriter adds
          // characters), sliding sideways instead of holding still. Pinning
          // it to a fixed left edge means it only ever grows rightward.
          className="self-start px-4 sm:px-6"
        />
      )}
      {isReveal && revealed && (
        <div
          // `justify-start` (not `-center`): this bubble types out
          // `slide.robuPrompt` too, so a centered row would recompute its
          // center — and slide Robu + the bubble sideways — on every
          // keystroke, same as the rows above.
          className="relative z-10 order-3 flex w-full items-center justify-start gap-0"
        >
          {robu}
          <div className={`relative mr-6 ${bubbleSideOrder}`}>
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
          </div>
        </div>
      )}

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
              {/* Robu's own bubble never carries this line — it lives here
                  instead, for the whole of page 2 (typed once as soon as the
                  reveal step is reached, not just once revealed), styled as
                  a normal headline rather than a chat bubble, at a fixed
                  spot above the illustration. Its completion is what fires
                  the auto-reveal (see `onIntroTypingComplete`), so nothing
                  about this heading's own position or the image below it
                  ever needs to move when that happens. */}

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
          className={`animate-pop-in order-3 -mt-2 flex h-36 w-full max-w-md items-center gap-4 rounded-[8px] bg-[#1A1C22] p-4 text-left shadow-lg transition-all duration-150 hover:bg-[#22252e] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-mt-1 sm:h-40 sm:gap-6 sm:p-5 md:h-44 md:gap-8 md:p-6 ${
            cardHighlight ? "animate-card-glow" : ""
          }`}
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
