"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { RiveButtonFace, RIVE_BUTTON_H, RIVE_BUTTON_W } from "./RiveButtonFace";

// Firefox restores a button's disabled state across reloads, so after a
// reload the DOM can disagree with the server HTML (hydration mismatch).
// autocomplete="off" opts out. Spread in because React's types leave
// `autoComplete` off <button>, though the attribute works there.
const NO_STATE_RESTORE = { autoComplete: "off" };

// A click holds the button pressed for PRESS_HOLD_MS, releases it, and only
// then (at CLICK_DELAY_MS) runs the caller's `onClick` — otherwise a click
// that navigates to the next screen unmounts the button before its press
// animation has visibly played.
const PRESS_HOLD_MS = 150;
const CLICK_DELAY_MS = 330;

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

// The brand tone is drawn by Rive (`btn-click.riv`, see RiveButtonFace):
// plain-text children become the file's own label via its `Text` run,
// so every screen's CTA text shows up on the artwork itself.

/** Flattens plain-text children ("Continue", `{cta}`, ["Step ", 2]) into
 * one string, or null when they include anything richer (an icon etc.). */
function plainText(children: ReactNode): string | null {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    const parts = children.map(plainText);
    return parts.every((part) => part !== null) ? parts.join("") : null;
  }
  return null;
}

interface Button3DProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  tone?: Button3DTone;
  /** The pale diagonal shine that sweeps left-to-right across the face every
   * 5s. Defaults to on for the brand tone (the tone the reference itself
   * used) and off for the others, where it'd fight the tone's own color. */
  shine?: boolean;
  /** Fires the instant the button is clicked — unlike `onClick`, which waits
   * for the press animation (CLICK_DELAY_MS). For immediate feedback such as
   * a click sound. */
  onPress?: () => void;
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
  onClick,
  onPress,
  ...rest
}: Button3DProps) {
  const showShine = shine ?? tone === "brand";
  const { face, depth, text } = TONE_STYLES[tone];

  // `pressed` shows the same pressed look as `:active`, but held on purpose
  // for PRESS_HOLD_MS after a click; `pending` swallows repeat clicks while
  // the delayed `onClick` is still waiting to run.
  const [pressed, setPressed] = useState(false);
  // Brand tone only: each click bumps this to replay Rive's press clip.
  const [pressCount, setPressCount] = useState(0);
  const pending = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    if (pending.current) return;
    onPress?.();
    pending.current = true;
    setPressed(true);
    setPressCount((n) => n + 1);
    timers.current.push(
      window.setTimeout(() => setPressed(false), PRESS_HOLD_MS),
      window.setTimeout(() => {
        pending.current = false;
        onClick(e);
      }, CLICK_DELAY_MS),
    );
  };

  if (tone === "brand") {
    const label = plainText(children);
    return (
      <button
        type="button"
        {...NO_STATE_RESTORE}
        disabled={disabled}
        style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}
        className={`relative block border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-60 grayscale" : "cursor-pointer"
        } ${className ?? ""}`}
        {...rest}
        onClick={handleClick}
      >
        <RiveButtonFace
          label={label ?? ""}
          pressCount={pressCount}
          shine={showShine && !disabled}
        />
        {label === null ? (
          // Richer content (e.g. an icon + text) can't go into the Rive text
          // run, so it's overlaid in HTML instead.
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-center text-xl font-medium text-primary-foreground">
            <span className="relative flex items-center gap-2">{children}</span>
          </span>
        ) : (
          // The visible label is drawn on the canvas; keep it readable to
          // screen readers too.
          <span className="sr-only">{label}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      {...NO_STATE_RESTORE}
      disabled={disabled}
      style={{ transform: TILT_TRANSFORM }}
      className={`group relative block border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className ?? ""}`}
      {...rest}
      onClick={handleClick}
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
            : `${pressed ? "translate-y-0" : "-translate-y-3 group-active:translate-y-0"} ${face} ${text}`
        }`}
        style={{ clipPath: CHAMFER }}
      >
        {showShine && !disabled && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="animate-button-shine absolute inset-y-0 left-0 w-1/4">
              <span className="absolute inset-y-0 left-[10%] w-[45%] -skew-x-12 bg-white/90" />
              <span className="absolute inset-y-0 left-[65%] w-[30%] -skew-x-12 bg-white/90" />
            </span>
          </span>
        )}
        <span className="relative">{children}</span>
      </span>
    </button>
  );
}
