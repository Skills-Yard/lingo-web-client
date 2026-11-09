"use client";

import { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setClickSoundMuted } from "@/components/onboarding/clickSound";
import { useLevelMuted } from "@/components/level-one/levelMuted";

/** The sound toggle: mutes the voiceover, the audio player and the click sounds together. */
export function SoundButton({ className = "" }: { className?: string }) {
  const [muted, toggle] = useLevelMuted();
  useEffect(() => setClickSoundMuted(muted), [muted]);
  return (
    <button
      type="button"
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      aria-pressed={muted}
      onClick={toggle}
      className={`pointer-events-auto flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#444444] transition-transform active:scale-95 dark:text-white/70 ${className}`}
    >
      {muted ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
    </button>
  );
}
