import type { ComponentType } from "react";

/** How far (px) the canvas reaches past Hex's box: wide, since he exits
 * sideways, but little above and below. */
export const HEX_BLEED = { x: 420, y: 30 } as const;

/**
 * Hex's Rive canvas, drawn `HEX_BLEED` past the box he stands in. Pass `HEX_BLEED` to `useHexRive` too, so the artboard is still
 * fitted into the box itself: he looks exactly as big and sits exactly where
 * he did, but his entrance and exit moves are no longer cut off at the box's
 * edges.
 */
export function HexBleed({ Canvas }: { Canvas: ComponentType<{ className?: string }> }) {
  return (
    // `data-hex-box`: the box he stands in (not the bled canvas), which the
    // hidden dev panel (see DevPanel) uses as his tap target.
    <div data-hex-box className="relative h-full w-full">
      <div className="absolute" style={{ inset: `-${HEX_BLEED.y}px -${HEX_BLEED.x}px` }}>
        <Canvas className="h-full w-full" />
      </div>
    </div>
  );
}
