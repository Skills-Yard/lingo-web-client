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
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 9px)";

// The whole button leans back a few degrees around its own top edge — the
// "tilted backward in 3D" look the reference asks for — rather than sitting
// perfectly flat. `perspective()` as part of the same transform (rather than
// a `perspective` property on a parent) keeps the tilt self-contained to
// just this element, no extra wrapper needed. Modest on purpose: much more
// than this and the label starts reading as skewed rather than tilted.
const TILT_TRANSFORM = "perspective(300px) rotateX(25deg)";

// The brand tone is drawn from two pre-rendered images instead of CSS: the
// face (`top-part.png`, already drawn in perspective) sitting on the slab
// (`bottom-part.png`). Measured in the images' own pixels — both are ~1076px
// wide. The face is solid down to its row 160, and the slab's black top
// outline starts at its own row 19, so the slab sits at row 142 of the face:
// that outline lands just under the face's bottom edge with no see-through
// gap between them (at 145 a ~2px transparent row showed as a white line).
// Together they stack into one shape 199px tall.
const IMG_FACE = "/images/polygon-btn/top-part.png";
const IMG_SLAB = "/images/polygon-btn/bottom-part.png";
const IMG_W = 1076;
const IMG_H = 199;
const FACE_H = 162;
const SLAB_TOP = 142;
const SLAB_H = 57;

interface Button3DProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  tone?: Button3DTone;
  /** The pale diagonal shine that sweeps left-to-right across the face every
   * 5s. Defaults to on for the brand tone (the tone the reference itself
   * used) and off for the others, where it'd fight the tone's own color. */
  shine?: boolean;
  className?: string;
}

/**
 * The app's one 3D "push" button: a raised face sitting a few pixels above
 * its own darker depth layer, the whole thing tilted back slightly in 3D,
 * with a pale shine sweeping across the face every 5s. Press (mouse, touch,
 * or keyboard) drops the face down onto the depth layer, springing back on
 * release. The depth layer is sized exactly to the face's own box (not a
 * separate fixed height), so together they're one `<button>` hit-target
 * spanning the whole visible shape, not just the raised top.
 */
export function Button3D({
  children,
  tone = "brand",
  shine,
  disabled,
  className,
  ...rest
}: Button3DProps) {
  const showShine = shine ?? tone === "brand";
  const { face, depth, text } = TONE_STYLES[tone];

  if (tone === "brand") {
    return (
      <button
        type="button"
        disabled={disabled}
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}
        className={`group relative block border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-60 grayscale" : "cursor-pointer"
        } ${className ?? ""}`}
        {...rest}
      >
        {/* Slab — fixed in place; the face drops onto it when pressed. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_SLAB}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute left-0 w-full select-none"
          style={{ top: `${(SLAB_TOP / IMG_H) * 100}%`, height: `${(SLAB_H / IMG_H) * 100}%` }}
        />
        {/* Face — the pressable layer, carrying the label and shine. */}
        <span
          className={`absolute inset-x-0 top-0 flex items-center justify-center gap-2 text-center text-xl font-medium text-primary-foreground transition-transform duration-100 ease-out ${
            // Pressed, the face drops ~20% of its own height — about the
            // slab's visible thickness — so it lands down on the slab.
            disabled ? "" : "group-active:translate-y-[20%]"
          }`}
          style={{ height: `${(FACE_H / IMG_H) * 100}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMG_FACE}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
          />
          {showShine && !disabled && (
            // Masked by the face image itself, so the shine never spills
            // past the face's angled edges.
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{
                maskImage: `url(${IMG_FACE})`,
                maskSize: "100% 100%",
                WebkitMaskImage: `url(${IMG_FACE})`,
                WebkitMaskSize: "100% 100%",
              }}
            >
              <span className="animate-button-shine absolute inset-y-0 left-0 w-1/4">
                <span className="absolute inset-y-0 left-[10%] w-[45%] -skew-x-12 bg-[#FFFBD0]/90" />
                <span className="absolute inset-y-0 left-[65%] w-[30%] -skew-x-12 bg-[#FFFBD0]/90" />
              </span>
            </span>
          )}
          <span className="relative flex items-center gap-2">{children}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      style={{ transform: TILT_TRANSFORM }}
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
        className={`relative flex items-center justify-center gap-2 overflow-hidden px-6 py-5 text-center text-lg font-semibold transition-transform duration-100 ease-out ${
          disabled
            ? "translate-y-0 bg-muted text-muted-foreground"
            : `-translate-y-3 group-active:translate-y-0 ${face} ${text}`
        }`}
        style={{ clipPath: CHAMFER }}
      >
        {showShine && !disabled && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="animate-button-shine absolute inset-y-0 left-0 w-1/4">
              <span className="absolute inset-y-0 left-[10%] w-[45%] -skew-x-12 bg-[#FFFBD0]/90" />
              <span className="absolute inset-y-0 left-[65%] w-[30%] -skew-x-12 bg-[#FFFBD0]/90" />
            </span>
          </span>
        )}
        <span className="relative">{children}</span>
      </span>
    </button>
  );
}
