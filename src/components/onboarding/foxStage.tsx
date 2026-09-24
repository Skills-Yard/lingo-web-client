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
}

/** Where the fox should stand on this screen — sized like the fox itself. */
export function FoxSlot({ className, style, talking = false, greet = false }: FoxSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const stage = useContext(FoxStageContext);

  useEffect(() => {
    stage?.register(id, { ref, talking, greet });
  }, [stage, id, talking, greet]);
  useEffect(() => () => stage?.unregister(id), [stage, id]);

  // Outside the flow (no stage), just draw a fox in place.
  if (!stage) {
    return <OnboardingFox className={className} style={style} talking={talking} greet={greet} />;
  }
  return <div ref={ref} aria-hidden className={className} style={style} />;
}

/** The fox is drawn at this size and scaled to each slot — scaling (a
 * transform) keeps the Rive canvas from being re-sized every frame while it
 * glides between slots of different sizes. As big as the biggest slot. */
const BASE_SIZE = 256;
const GLIDE = { stiffness: 210, damping: 30, mass: 1 } as const;

/**
 * The flow's one fox. Every frame it reads the current slot's on-screen box
 * and springs toward it — which tracks a slot that's itself moving (the
 * talking screens' lift) and glides across when the slot changes. It fades
 * out on screens with no slot and reappears in place (no glide) at the next
 * one.
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

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const container = containerRef.current;
      const el = slot?.ref.current;
      if (container && el) {
        const c = container.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const tx = r.left - c.left;
        const ty = r.top - c.top;
        const ts = r.width / BASE_SIZE;
        if (!shown.current || reduceMotion) {
          x.jump(tx);
          y.jump(ty);
          scale.jump(ts);
        } else {
          x.set(tx);
          y.set(ty);
          scale.set(ts);
        }
        if (!shown.current) {
          shown.current = true;
          animate(opacity, 1, { duration: 0.35 });
        }
      } else if (shown.current) {
        shown.current = false;
        animate(opacity, 0, { duration: 0.25 });
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
      <OnboardingFox className="h-full w-full" talking={slot?.talking ?? false} greet={slot?.greet ?? false} />
    </motion.div>
  );
}
