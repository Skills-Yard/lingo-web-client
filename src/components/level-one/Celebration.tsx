"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Confetti } from "./Confetti";
import { XpBurst } from "./FeedbackPanel";

const CelebrationContext = createContext<() => void>(() => {});

/**
 * Holds the win confetti and "+10 XP" above the screens, in a layout that stays
 * mounted from one step to the next. A screen that asks for it with
 * `useCelebrate` can then be left (Next on its last stage) while the burst plays on.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [burst, setBurst] = useState(0);
  const celebrate = useCallback(() => setBurst((previous) => previous + 1), []);

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      {burst > 0 && (
        <>
          <Confetti key={`confetti-${burst}`} active />
          <XpBurst key={`xp-${burst}`} show />
        </>
      )}
    </CelebrationContext.Provider>
  );
}

/** Starts a burst of confetti and "+10 XP" that outlives the screen that asked for it. */
export const useCelebrate = () => useContext(CelebrationContext);
