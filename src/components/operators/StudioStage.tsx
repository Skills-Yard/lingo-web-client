"use client";

import { useEffect } from "react";
import { fireScene } from "@/lib/rive/operatorsHost";
import { OperatorScene } from "./OperatorScene";
import type { InteractionApi } from "./screen";
import { useTurn } from "./SituationsStage";

/** What the studio's card says (see `OPERATOR_STUDIO`): its heading, a line under it and the pill under that. */
export type StudioCard = { title: string; meaning: string; example: string };

/**
 * The Operators studio (see `OPERATOR_STUDIO`) as the picture of a question, over its answers: it is not tapped.
 * `card` is what the card beside the keys says. `pick` is the key lifted (`OPERATOR_STUDIO.pick`; none while
 * nothing is picked, or when the picked answer has no key), and `verdict` plays the studio's `correct` / `wrong`
 * once the answer is checked. `attempt` is bumped on each try again, so the verdict plays again. `width` (a CSS length) draws it
 * smaller than the stage is wide, where Hex's line stays up after the answer and the room left to the picture is short.
 */
export function StudioVisual({ card, pick, verdict, attempt, width }: { card: StudioCard; pick: number; verdict: "correct" | "wrong" | null; attempt: number; width?: string }) {
  useEffect(() => {
    if (verdict) fireScene("studio", verdict);
  }, [verdict, attempt]);

  return <OperatorScene scene="studio" width={width} values={{ mode: 0, pick, infoTitle: card.title, infoMeaning: card.meaning, infoExample: card.example, infoSay: "" }} />;
}

/**
 * The studio of "Calculate or Compare?": mode 1 (its two cards, Calculate and Compare, as the file draws them), with
 * nothing picked out. It is the same picture on both turns and on the quiz, so the screen has one artboard from end to end.
 */
export function StudioJobs() {
  return <OperatorScene scene="studio" values={{ mode: 1 }} />;
}

/**
 * The turn of one job on "Calculate or Compare?": `StudioJobs`, the same picture on both turns, Hex says which job it is.
 * Continue goes on once he has said his line (`useTurn`).
 */
export function StudioJobsTurn({ api }: { api: InteractionApi }) {
  useTurn(api);
  return <StudioJobs />;
}

/**
 * The turn of one operator on "Meet the Operators!": the studio's card says the operator's name, what it does and an
 * example, and its key is lifted a moment after the stage opens (while Hex introduces it). `before` is the key that was
 * lifted on the turn before, so the hand-over from one operator to the next reads as the key changing, not as a restart
 * (`OPERATOR_STUDIO.pick.none` on the first turn). Continue goes on to the next stage once Hex has said his line.
 */
export function StudioTurnStage({ api, card, pick, before }: { api: InteractionApi; card: StudioCard; pick: number; before: number }) {
  const lit = useTurn(api);
  return <StudioVisual card={card} pick={lit ? pick : before} verdict={null} attempt={0} />;
}
