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
export const ROBU_DEFAULT_SIZE = "h-32 w-32 sm:h-60 sm:w-60 md:h-84 md:w-84";

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
  return <div ref={registerAnchor} aria-hidden className={`invisible ${className ?? ""}`} />;
}
