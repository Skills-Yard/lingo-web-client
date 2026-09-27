// The one Robu size used everywhere he appears at rest (every screen's own
// anchor, via RobuSays/GameBoardScreen/RobuScreen/CoverScreen's greeting
// state) — kept as a single constant so every screen renders the *same*
// Robu size instead of each picking its own. CoverScreen's `revealed` state
// (Robu crouched beside the reveal card) and its one-shot `entering` pose
// are deliberately their own, different sizes for those specific moments —
// this constant is only "Robu's normal resting size". Safe to keep bumping
// here — both rows that pair Robu with a speech bubble (RobuSays' and
// CoverScreen's own) now wrap the bubble onto its own line instead of
// overflowing if there's ever not enough room beside him.
export const ROBU_DEFAULT_SIZE = "h-48 w-48 sm:h-90 sm:w-90 md:h-126 md:w-126";

// Robu's Rive artboard (`orbi.riv`'s "Artboard 1") draws the actual
// character well inside its own bounds — measured against the real canvas
// pixels (not a guess): at rest, the character only spans ~37%-71% of its
// square anchor box's width, dead-centered neither left nor right. Every
// anchor box built from `ROBU_DEFAULT_SIZE` (RobuSays' left-side placement,
// CoverScreen's own greeting row) therefore reserves a big strip of empty
// canvas to Robu's *right* before his neighboring bubble/heading even
// starts — that's the "so much space"/gap every screen reads as, not
// anything in the flex/margin layout around the anchor. Since Rive's
// Fit.Contain scales proportionally to the box, this ~29% dead strip is the
// same fraction at every breakpoint, so one pull-in class (sized to
// `ROBU_DEFAULT_SIZE`'s own w-32/sm:w-60/md:w-84 track) closes it back down
// everywhere instead of each screen guessing its own margin.
export const ROBU_TRAILING_GAP_PULL = "-ml-7 sm:-ml-15 md:-ml-21";

interface RobuAnchorProps {
  /** Registers (or, on unmount, unregisters via `null`) this element as the
   * spot where Robu currently belongs. The actual mascot lives once — see
   * RobuStage — and glides over to whichever anchor is currently mounted, so
   * this div only needs to reserve the right size and sit in the right place
   * in each screen's own layout (flex order, grid placement, all of it);
   * it never draws Robu itself. */
  registerAnchor: (el: HTMLDivElement | null) => void;
  className?: string;
}

/**
 * Invisible placeholder marking where the single, persistent Robu (see
 * RobuStage's doc comment) should currently stand. `invisible` (not
 * `hidden`/`display:none`) so it still occupies its box — every screen's
 * existing sizing/positioning logic keeps working unchanged, Robu just isn't
 * actually drawn here.
 */
export function RobuAnchor({ registerAnchor, className }: RobuAnchorProps) {
  return <div ref={registerAnchor} aria-hidden className={`invisible  ${className ?? ""}`} />;
}
