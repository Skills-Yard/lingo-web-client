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
