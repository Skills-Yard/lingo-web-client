"use client";

import { useCallback, useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  DAYNIGHT_ARTBOARD,
  DAYNIGHT_STATE_MACHINE,
  DAYNIGHT_TRIGGERS,
  DAYNIGHT_ENTRY_STYLE,
  HEX_STOP_TALK_TRIGGER,
  randomHexTalkTrigger,
  type HexTalkTrigger,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";
import { useHexExit } from "./hexExit";

// FitWidth, pinned to the top: the scene always spans the full screen width and
// sits flush under the header. The slot's aspect ratio matches the artboard, so
// nothing is cropped.
const LAYOUT = new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter });

/**
 * The "DayNight" artboard's `DayNight_SM`: picking Morning / Afternoon /
 * Evening / Night fires that time of day's trigger on the `DayNight` view model.
 * While the voiceover plays he talks — a random `talk`/`talk2`/`talk3` for the
 * question and again for each option as it is read — and `stopTalk` follows
 * once it ends. A pick cuts the talk short (useHexRive puts `stopTalk` ahead
 * of the pick's trigger).
 */
export function DayNightHex({
  className,
  typing,
  selectedId,
  speaking = false,
  questionSpoken = 1,
  spokenOption = -1,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  selectedId: string | null;
  /** The question's voiceover is playing. */
  speaking?: boolean;
  /** 0..1 — how much of the question has been read; 1 once it has. */
  questionSpoken?: number;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption?: number;
}) {
  const { RiveComponent, ready, fireTrigger, fireNow } = useHexRive(
    LAYOUT,
    DAYNIGHT_STATE_MACHINE,
    DAYNIGHT_ARTBOARD,
    undefined,
    "daynight",
    DAYNIGHT_ENTRY_STYLE,
  );
  useHexExit(fireTrigger, ready);

  const talking = useRef(false);
  const lastTalk = useRef<HexTalkTrigger | null>(null);
  const talk = useCallback(() => {
    lastTalk.current = randomHexTalkTrigger(lastTalk.current);
    talking.current = true;
    fireTrigger(lastTalk.current);
  }, [fireTrigger]);

  const talkedQuestion = useRef(false);
  useEffect(() => {
    if (!ready || !speaking || questionSpoken >= 1 || talkedQuestion.current) return;
    talkedQuestion.current = true;
    talk();
  }, [ready, speaking, questionSpoken, talk]);

  const talkedOption = useRef(-1);
  useEffect(() => {
    if (!ready || spokenOption < 0 || talkedOption.current === spokenOption) return;
    talkedOption.current = spokenOption;
    talk();
  }, [ready, spokenOption, talk]);

  // Done reading (question, then the last option): end the talk.
  useEffect(() => {
    if (!ready || !talking.current || questionSpoken < 1 || spokenOption >= 0) return;
    talking.current = false;
    fireTrigger(HEX_STOP_TALK_TRIGGER);
  }, [ready, questionSpoken, spokenOption, fireTrigger]);

  // Only picks made while it's showing — never one from before it appeared.
  const lastTyping = useRef(typing);
  useEffect(() => {
    if (!ready || typing === lastTyping.current) return;
    lastTyping.current = typing;
    const trigger = selectedId ? DAYNIGHT_TRIGGERS[selectedId] : undefined;
    talking.current = false;
    if (trigger) fireNow(trigger);
  }, [ready, typing, selectedId, fireNow]);

  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
