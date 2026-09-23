"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type Button3DTone = "brand" | "dark" | "destructive";

// Face/depth/text classes per tone. "Depth" is the darker layer the face
// sits on top of — picked by hand per tone (rather than derived with a CSS
// filter) so each stays a deliberate, readable shade instead of whatever
// brightness()/contrast() happens to produce.
const TONE_STYLES: Record<Button3DTone, { face: string; depth: string; text: string }> = {
  brand: { face: "bg-primary", depth: "bg-[#004635]", text: "text-primary-foreground" },
  dark: { face: "bg-[#1A1C22]", depth: "bg-black", text: "text-white" },
  destructive: { face: "bg-destructive", depth: "bg-[#7A1B1B]", text: "text-destructive-foreground" },
};

// The chamfered "label plate" silhouette from the reference design — every
// corner cut at an angle instead of a plain rounded rect. Both the face and
// depth layers below share this exact clip, so the depth layer only ever
// peeks out as a matching-shaped sliver, never a rectangular edge poking out
// past the chamfer.
const CHAMFER =
  "polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)";

// How far the face sits above its own depth layer at rest, and therefore
// how far it travels on press — this is the "clickable top to bottom" push.
const RAISE_PX = 6;

interface Button3DProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  tone?: Button3DTone;
  /** The two pale diagonal accent stripes from the reference design.
   * Defaults to on for the brand tone (that's the tone the reference itself
   * used) and off for the others, where they'd fight the tone's own color. */
  stripes?: boolean;
  className?: string;
}

/**
 * The app's one 3D "push" button, replacing plain flat `<button>`s for
 * primary actions (IntroFooter's Next/Continue/Claim, PreLoginScreen's Get
 * Started, ...): a raised face sitting `RAISE_PX` above its own darker depth
 * layer, both clipped to the same chamfered silhouette. Press (mouse, touch,
 * or keyboard) drops the face all the way down onto the depth layer — the
 * "clickable top to bottom" travel the reference asked for — and it springs
 * back up on release. The depth layer is sized exactly to the face's own
 * box (not a separate fixed height), so together they're one `<button>`
 * hit-target spanning the whole visible shape, not just the raised top.
 */
export function Button3D({
  children,
  tone = "brand",
  stripes,
  disabled,
  className,
  ...rest
}: Button3DProps) {
  const showStripes = stripes ?? tone === "brand";
  const { face, depth, text } = TONE_STYLES[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      className={`group relative block border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className ?? ""}`}
      {...rest}
    >
      {/* Depth — fixed in place; only ever visible as the sliver the face
          uncovers by rising above it (or fully, once pressed down onto
          it). */}
      <span
        aria-hidden
        className={`absolute inset-0 ${disabled ? "bg-muted-foreground/40" : depth}`}
        style={{ clipPath: CHAMFER }}
      />
      {/* Face — the raised, pressable layer. Its own natural box (padding
          etc., set by the caller via `className`) is what actually sizes
          the button; the depth layer above just matches it via `inset-0`. */}
      <span
        className={`relative flex items-center justify-center gap-2 overflow-hidden px-6 py-4 text-center text-lg font-semibold transition-transform duration-100 ease-out ${
          disabled
            ? `translate-y-0 bg-muted text-muted-foreground`
            : `-translate-y-1.5 group-active:translate-y-0 ${face} ${text}`
        }`}
        style={{ clipPath: CHAMFER }}
      >
        {showStripes && !disabled && (
          <>
            <span
              aria-hidden
              className="absolute left-[18%] top-0 h-full w-[9%] -skew-x-12 bg-[#FFFBD0]/90"
            />
            <span
              aria-hidden
              className="absolute left-[29%] top-0 h-full w-[6%] -skew-x-12 bg-[#FFFBD0]/90"
            />
          </>
        )}
        <span className="relative">{children}</span>
      </span>
    </button>
  );
}
