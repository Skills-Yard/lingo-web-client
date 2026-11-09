"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { ChevronLeft, Infinity as InfinityIcon, Maximize, Minimize } from "lucide-react";
import { setBatteryUnlimited, useBattery } from "@/components/home/batteryStore";
import { useFullscreen } from "@/hooks/useFullscreen";
import { energyHref } from "@/lib/routes";

/** The fills of Level 1's answer cards (see InstructionQuizScreen), at rest. */
const TINTS = {
  lavender: "bg-[#F6F4FE]",
  rose: "bg-[#FFF4F6]",
  cream: "bg-[#FFF9F0]",
} as const;

export type PanelTint = keyof typeof TINTS;

/** Level 1's answer card is `selected` once picked: a green edge and fill. */
const SELECTED = "border-[#008566] bg-[#F2FBF8]! dark:bg-[#0F2921]!";

type PanelButtonProps = Omit<HTMLMotionProps<"button">, "whileTap"> & {
  tint?: PanelTint;
  /** The option that is on / current: drawn like a picked answer card. */
  selected?: boolean;
};

/**
 * An option in the panel, as 3D as the answer cards of Level 1's "Instructions
 * are…" screen: a tinted card on a 4px khaki edge that the card sinks onto when
 * pressed. Exported so a screen's extra options (see `extraOptions`) match.
 */
export function PanelButton({ tint = "lavender", selected = false, className = "", ...props }: PanelButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.97, y: 4 }}
      className={`mt-2.5 flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-[12px] border-b-4 px-3 text-[16px] font-medium text-[#2C2C2C] shadow-[0_3px_0_rgba(0,0,0,0.06)] transition-[color,background-color,border-color,box-shadow] active:border-b-0 active:shadow-none disabled:cursor-default disabled:opacity-35 disabled:active:border-b-4 disabled:active:shadow-[0_3px_0_rgba(0,0,0,0.06)] dark:bg-[#15181E] dark:text-white ${TINTS[tint]} ${selected ? SELECTED : "border-[#BDBA99]"} ${className}`}
      {...props}
    />
  );
}

/** How long the battery is held before the dev panel opens. */
const HOLD_MS = 600;

type BatteryMenuProps = {
  /** The battery itself — tapping it opens `/energy`, holding it the dev panel. */
  children: ReactNode;
  /** Sizes and places the wrapper, which must be positioned (`absolute` or
   * `relative`): the panel opens under it, right-aligned. */
  className?: string;
  /** Styles the pressable around `children`. */
  buttonClassName?: string;
  /** Adds a Back option to the panel. */
  onBack?: () => void;
  /** More options for a screen that needs them, below the built-in ones.
   * Given a function that closes the panel. */
  extraOptions?: (close: () => void) => ReactNode;
};

/**
 * A tap on the battery opens the Energy screen. TEMPORARY — FOR DEVS ONLY: a
 * hold opens a hidden testing panel (theme, full screen, infinite battery);
 * nothing about it looks pressable (no pointer, hover or focus ring).
 */
export function BatteryMenu({ children, className = "", buttonClassName = "", onBack, extraOptions }: BatteryMenuProps) {
  const fullscreen = useFullscreen();
  const { unlimited } = useBattery();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Where the panel opens: under the battery, right-aligned (fixed, in viewport px).
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const router = useRouter();
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);

  const startHold = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      setOpen(true);
    }, HOLD_MS);
  };
  const cancelHold = () => clearTimeout(holdTimer.current);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && (ref.current?.contains(e.target) || panelRef.current?.contains(e.target))) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className={className}>
      <button
        type="button"
        tabIndex={-1}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          if (open) return setOpen(false);
          router.push(energyHref(window.location.pathname + window.location.search));
        }}
        // A hold must open the panel, not the browser's long-press menu.
        onContextMenu={(e) => e.preventDefault()}
        className={`cursor-default outline-none select-none [-webkit-touch-callout:none] ${buttonClassName}`}
      >
        {children}
      </button>
      {/* Portalled to the body and drawn above everything (Hex included): inside the header it would sit under him. */}
      {mounted && createPortal(
      <AnimatePresence>
        {open && anchor && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Developer testing panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            // Long option lists scroll inside the panel instead of running off the screen.
            style={{
              transformOrigin: "100% 0%",
              top: anchor.top,
              right: anchor.right,
              maxHeight: `calc(100dvh - ${anchor.top}px - 12px)`,
            }}
            className="scrollbar-none fixed z-[2147483647] w-[270px] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
          >
            <p className="text-[13px] leading-[18px] text-[#818185] dark:text-[#9FA19F]">
              For testing by devs only. Temporary.
            </p>
            {onBack && (
              <PanelButton
                onClick={() => {
                  setOpen(false);
                  onBack();
                }}
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </PanelButton>
            )}
            {fullscreen.available && (
              <PanelButton onClick={fullscreen.toggle}>
                {fullscreen.active ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                {fullscreen.active ? "Exit full screen" : "Full screen"}
              </PanelButton>
            )}
            <PanelButton onClick={() => setBatteryUnlimited(!unlimited)}>
              <InfinityIcon className="h-5 w-5" />
              {unlimited ? "Back to normal battery" : "Infinite battery"}
            </PanelButton>
            {extraOptions?.(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  );
}
