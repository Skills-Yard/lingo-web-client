"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { SHOW_INSTALL_GUIDE_EVENT, isIosDevice, isStandalone } from "@/hooks/useFullscreen";

const DISMISSED_KEY = "lingo-install-hint-dismissed";

/** A one-time, dismissible tip on iPhone Safari: how to get the full screen view. */
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Storage blocked (private tab) — show the tip anyway.
    }
    if (isIosDevice() && !isStandalone()) setVisible(true);
  }, []);

  // The full screen button on iPhone Safari opens the guide on demand.
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener(SHOW_INSTALL_GUIDE_EVENT, show);
    return () => window.removeEventListener(SHOW_INSTALL_GUIDE_EVENT, show);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Dismissed for this visit only.
    }
  };

  return (
    <div
      role="status"
      className="fixed inset-x-3 z-[100] flex items-center gap-3 rounded-xl bg-[#2C2C2C] px-4 py-3 text-[13px] leading-snug font-medium text-white shadow-lg"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <Share className="h-5 w-5 shrink-0 text-[#2AD2BC]" />
      <span className="min-w-0 flex-1">
        For full screen: tap Share <b>→ Add to Home Screen</b>, then open Lingo from your home screen.
      </span>
      <button type="button" aria-label="Close tip" onClick={dismiss} className="shrink-0 p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
