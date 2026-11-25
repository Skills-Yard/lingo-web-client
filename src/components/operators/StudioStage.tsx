"use client";

import { useEffect } from "react";
import { fireScene, type OperatorSceneName, type SceneTexts } from "@/lib/rive/operatorsHost";
import { OPERATOR_STUDIO } from "@/lib/rive/runtime";
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
 * `mode` is the studio's (`OPERATOR_STUDIO.mode`, default 0, the four calculating keys beside the card): only mode 0 lifts a key
 * for `pick`; mode 3 (every operator key) is static but for the card's words.
 */
export function StudioVisual({ card, pick, verdict, attempt, width, mode = OPERATOR_STUDIO.mode.keys }: { card: StudioCard; pick: number; verdict: "correct" | "wrong" | null; attempt: number; width?: string; mode?: number }) {
  useEffect(() => {
    if (verdict) fireScene("studio", verdict);
  }, [verdict, attempt]);

  return <OperatorScene scene="studio" width={width} values={{ mode, pick, infoTitle: card.title, infoMeaning: card.meaning, infoExample: card.example, infoSay: "" }} />;
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
 * A stage that is only one of the Operators artboards in `mode`, as the file draws it (the modes used here are static, so nothing
 * is tapped). Continue goes on once Hex has said his line (`useTurn`).
 */
export function SceneTurn({ api, scene, mode, texts, bleed }: { api: InteractionApi; scene: OperatorSceneName; mode: number; /** The artboard's words in place of the file's own (by place, see `SceneTexts`). */ texts?: SceneTexts; /** Extra room under the artboard (see `OperatorScene`). */ bleed?: number }) {
  useTurn(api);
  return <OperatorScene scene={scene} values={{ mode }} texts={texts} bleed={bleed} />;
}

/**
 * A stage that is only the arithmetic artboard (see `OPERATOR_ARITH`) in `mode`: "What If Every Group Has the Same Quantity?"
 * opens on mode 1 (4 rows of 5 chairs), and "Can Everyone Get the Same Number?" has mode 2 (20 chocolates shared by four children)
 * between its questions.
 */
export function ArithmeticTurn({ api, mode }: { api: InteractionApi; mode: number }) {
  return <SceneTurn api={api} scene="arithmetic" mode={mode} />;
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
