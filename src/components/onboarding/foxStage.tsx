"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { OnboardingFox } from "./robu/OnboardingFox";

/**
 * One fox for the whole onboarding flow. Screens don't render their own fox;
 * they place an invisible `<FoxSlot>` where it should stand, and a single
 * persistent fox (see `PersistentFox`, rendered once by OnboardingFlow,
 * outside the screen crossfades) follows whichever slot is current. So when
 * two screens put the fox in the same spot it simply stays there — no
 * second canvas fading in with a flash — and when they don't, the same fox
 * glides (and scales) from one spot to the other.
 */

interface SlotInfo {
  ref: RefObject<HTMLDivElement | null>;
  talking: boolean;
  greet: boolean;
  excited: boolean;
  laptop: boolean;
  typing: number;
  hidden: boolean;
}

interface FoxStage {
  register: (id: string, slot: SlotInfo) => void;
  unregister: (id: string) => void;
}

const FoxStageContext = createContext<FoxStage | null>(null);

/**
 * The flow's slot registry. The most recently mounted slot is the current
 * one — during a screen crossfade that's the incoming screen's.
 */
export function useFoxStage() {
  const slots = useRef(new Map<string, SlotInfo>());
  const [active, setActive] = useState<SlotInfo | null>(null);
  const stage = useMemo<FoxStage>(() => {
    const refresh = () => setActive([...slots.current.values()].pop() ?? null);
    return {
      register: (id, slot) => {
        slots.current.set(id, slot);
        refresh();
      },
      unregister: (id) => {
        slots.current.delete(id);
        refresh();
      },
    };
  }, []);
  return { stage, active };
}

export function FoxStageProvider({ stage, children }: { stage: FoxStage; children: React.ReactNode }) {
  return <FoxStageContext.Provider value={stage}>{children}</FoxStageContext.Provider>;
}

interface FoxSlotProps {
  className?: string;
  style?: CSSProperties;
  /** Moves the fox's mouth while true. */
  talking?: boolean;
  /** Waves hello once when this slot becomes current. */
  greet?: boolean;
  /** Plays the "excitement" state machine while true (standing only). */
  excited?: boolean;
  /** Seats the fox at its laptop instead of standing. */
  laptop?: boolean;
  /** With `laptop`: set to a new unique value (e.g. `Date.now()`) to have the
   * fox type one pass on its laptop. 0 on every (re)mounted screen, so
   * arriving — forward or back — never replays a pass from before. */
  typing?: number;
  /** The fox glides here and then fades out, handing over to a fox the
   * screen draws itself (the notification screen's peeking fox). Leaving
   * for a visible slot, it waits for that screen's fox to go first, then
   * reappears here and glides on. */
  hidden?: boolean;
}

/** Where the fox should stand on this screen — sized like the fox itself. */
export function FoxSlot({
  className,
  style,
  talking = false,
  greet = false,
  excited = false,
  laptop = false,
  typing = 0,
  hidden = false,
}: FoxSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const stage = useContext(FoxStageContext);

  useEffect(() => {
    stage?.register(id, { ref, talking, greet, excited, laptop, typing, hidden });
  }, [stage, id, talking, greet, excited, laptop, typing, hidden]);
  useEffect(() => () => stage?.unregister(id), [stage, id]);

  // Outside the flow (no stage), just draw a fox in place.
  if (!stage) {
    if (hidden) return null;
    return (
      <OnboardingFox
        className={className}
        style={style}
        talking={talking}
        greet={greet}
        excited={excited}
        laptop={laptop}
        typing={typing}
      />
    );
  }
  return <div ref={ref} aria-hidden className={className} style={style} />;
}

/** The fox is drawn at this size and scaled to each slot — scaling (a
 * transform) keeps the Rive canvas from being re-sized every frame while it
 * glides between slots of different sizes. As big as the biggest slot. */
const BASE_SIZE = 256;
const GLIDE = { stiffness: 210, damping: 30, mass: 1 } as const;
/** Arriving at a hidden slot: fade out as the glide lands. */
const HIDE_FADE = { duration: 0.25, delay: 0.3 } as const;
/** Leaving a hidden slot: how long the screen's own fox gets to leave
 * before this one reappears and glides on. */
const UNHIDE_DELAY_MS = 350;

/**
 * The flow's one fox. Every frame it reads the current slot's on-screen box
 * and springs toward it — which tracks a slot that's itself moving (the
 * talking screens' lift) and glides across when the slot changes. It fades
 * out on screens with no slot and reappears in place (no glide) at the next
 * one. A hidden slot (see FoxSlot's `hidden`) is glided to and then faded
 * out at — the fox stays "parked" there, so the next slot is glided to from
 * that spot rather than just appearing.
 */
export function PersistentFox({
  containerRef,
  slot,
}: {
  containerRef: RefObject<HTMLElement | null>;
  slot: SlotInfo | null;
}) {
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, GLIDE);
  const y = useSpring(0, GLIDE);
  const scale = useSpring(1, GLIDE);
  const opacity = useMotionValue(0);
  const shown = useRef(false);
  /** Invisible, but resting at a hidden slot's spot (see above). */
  const parked = useRef(false);
  /** When a parked fox may reappear and glide on. */
  const unhideAt = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const container = containerRef.current;
      const el = slot?.ref.current;
      if (container && slot && el) {
        const c = container.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const tx = r.left - c.left;
        const ty = r.top - c.top;
        const ts = r.width / BASE_SIZE;
        const move = (glide: boolean) => {
          if (glide && !reduceMotion) {
            x.set(tx);
            y.set(ty);
            scale.set(ts);
          } else {
            x.jump(tx);
            y.jump(ty);
            scale.jump(ts);
          }
        };
        if (slot.hidden) {
          unhideAt.current = null;
          if (shown.current) {
            shown.current = false;
            parked.current = true;
            animate(opacity, 0, reduceMotion ? { duration: 0.25 } : HIDE_FADE);
          }
          move(parked.current);
        } else if (shown.current) {
          move(true);
        } else if (parked.current && !reduceMotion) {
          unhideAt.current ??= performance.now() + UNHIDE_DELAY_MS;
          if (performance.now() >= unhideAt.current) {
            unhideAt.current = null;
            parked.current = false;
            shown.current = true;
            animate(opacity, 1, { duration: 0.25 });
            move(true);
          }
        } else {
          parked.current = false;
          shown.current = true;
          move(false);
          animate(opacity, 1, { duration: 0.35 });
        }
      } else {
        parked.current = false;
        unhideAt.current = null;
        if (shown.current) {
          shown.current = false;
          animate(opacity, 0, { duration: 0.25 });
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [containerRef, slot, reduceMotion, x, y, scale, opacity]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-[5] origin-top-left"
      style={{ x, y, scale, opacity, width: BASE_SIZE, height: BASE_SIZE }}
    >
      <OnboardingFox
        className="h-full w-full"
        talking={slot?.talking ?? false}
        greet={slot?.greet ?? false}
        excited={slot?.excited ?? false}
        laptop={slot?.laptop ?? false}
        typing={slot?.typing ?? 0}
      />
    </motion.div>
  );
}
