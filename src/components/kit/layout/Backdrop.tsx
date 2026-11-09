import { SoftBackdrop } from "@/components/level-two/LevelTwoShell";

export type BackdropKind = "soft" | "meadow" | "room" | "none";

/** Fades the meadow in under the header and out above the buttons instead of ending in hard lines. */
const MEADOW_MASK = "linear-gradient(180deg, transparent 35px, #000 220px, #000 330px, transparent 448px)";

/** Where the wall meets the floor in the room picture, as a share of its height. */
const ROOM_HORIZON = "67%";

/**
 * The picture behind a screen:
 *   `soft`    a pale blue wash fading to white (light mode only; dark mode shows the plain background)
 *   `meadow`  the grass Hex's board stands on
 *   `room`    an empty room with a wall and a floor (light mode only)
 */
export function Backdrop({ kind = "soft" }: { kind?: BackdropKind }) {
  if (kind === "none") return null;
  if (kind === "soft") return <SoftBackdrop />;
  if (kind === "meadow") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 bg-[#F1F8C8] bg-cover bg-top bg-no-repeat"
        style={{ top: 60, backgroundImage: "url(/images/level-one/guide-hex-meadow.png)", maskImage: MEADOW_MASK, WebkitMaskImage: MEADOW_MASK }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-no-repeat dark:hidden"
      style={{ backgroundImage: "url(/images/level-two/flipCard-bg.svg)", backgroundPosition: `50% ${ROOM_HORIZON}` }}
    />
  );
}
