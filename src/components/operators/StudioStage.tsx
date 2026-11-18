"use client";

import { useEffect } from "react";
import { fireScene } from "@/lib/rive/operatorsHost";
import { OperatorScene } from "./OperatorScene";

/** What the studio's card says (see `OPERATOR_STUDIO`): its heading, a line under it and the pill under that. */
export type StudioCard = { title: string; meaning: string; example: string };

/**
 * The Operators studio (see `OPERATOR_STUDIO`) as the picture of a question, over its answers: it is not tapped.
 * `card` is what the card beside the keys says. `pick` is the key lifted (`OPERATOR_STUDIO.pick`; none while
 * nothing is picked, or when the picked answer has no key), and `verdict` plays the studio's `correct` / `wrong`
 * once the answer is checked. `attempt` is bumped on each try again, so the verdict plays again.
 */
export function StudioVisual({ card, pick, verdict, attempt }: { card: StudioCard; pick: number; verdict: "correct" | "wrong" | null; attempt: number }) {
  useEffect(() => {
    if (verdict) fireScene("studio", verdict);
  }, [verdict, attempt]);

  return <OperatorScene scene="studio" values={{ mode: 0, pick, infoTitle: card.title, infoMeaning: card.meaning, infoExample: card.example, infoSay: "" }} />;
}
