"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HintButton } from "@/components/level-one/HintButton";
import { AnswerTray, OPTION_GAP, TRAY_CARD_GAP, TRAY_CHARACTER, TRAY_LIST, TRAY_LIST_WIDTH, trayRise } from "@/components/sequence/AnswerTray";
import { CharacterOnStage, Column, SPEECH_STAGE, type SpeechStage } from "@/components/sequence/CharacterStage";
import { PatternBackdrop } from "@/components/sequence/PatternBackdrop";
import { playClickSound } from "@/components/onboarding/clickSound";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { nextAfter, noteAnswer } from "@/lib/moduleReview";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { AnswerCards } from "./AnswerCards";
import { aboveButtons, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "./LevelTwoShell";
import { levelTwoHref, type Choice, type Span, type TitleLines } from "./levelTwo";

/**
 * The hint button (the regular one, `HintButton`, as it looks beside the main button elsewhere: the same 57 px) stands over the tray's
 * top right instead: its right edge in line with the rows' (`fromEdge` from the column's edge), `overTray` over the tray's top edge.
 * `HintButton`'s slot is the button's width plus its 10 px gap, the button at the slot's left.
 */
const HINT = { size: 57, gap: 10, fromEdge: 16, overTray: 16 } as const;

/** A Command module question that the 3D character asks (screens 3 and 11): three rows on the grey tray. */
export type CharacterQuiz = {
  /** Its place in the module (`?step=`). */
  step: number;
  title: TitleLines;
  /** The words the character says with its voice; with no voice it "reads" them at typing pace. */
  line: readonly Span[];
  choices: readonly Choice[];
  correctId: string;
  /** The result panel's sentence after a right pick and after a miss. */
  right: ReactNode;
  wrong: ReactNode;
  /** The panel's title, where it isn't the default. */
  rightTitle?: string;
  wrongTitle?: string;
  /** Clips read when the screen opens (the title, then the line); cut off once the answer is checked. */
  voiceover: readonly string[];
};

/**
 * A Command module question, the 3D way (the Sequence module's "tray" look, from the same Figma frame): the lavender
 * pattern background, the chosen character close up in the middle asking the question aloud, and three rows on a grey tray
 * over its legs. The character opens low and rises as the answers come in (at three quarters of the question), with the hint
 * button at the tray's top right. There is no main button until an answer is picked; it then comes up as Check, which checks the
 * pick (right is green, a miss red, the result panel slides up and the rows go), and then Continue moves on, whether or not it
 * was right (a miss is asked again at the end, see `moduleReview`), like the module's other quizzes.
 */
export function CharacterQuizScreen({ quiz }: { quiz: CharacterQuiz }) {
  const { step } = quiz;
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  // The hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  // How far the character is in what it says: the answers come in at three quarters and stay; the buttons wait until it is all said.
  const [stage, setStage] = useState<SpeechStage>(SPEECH_STAGE.opening);
  const [reached, setReached] = useState<SpeechStage>(SPEECH_STAGE.opening);
  if (stage > reached) setReached(stage);
  const spoken = stage === SPEECH_STAGE.done;
  const optionsShown = reached >= SPEECH_STAGE.options;
  const correct = selectedId === quiz.correctId;
  const voiceover = checked ? undefined : quiz.voiceover;

  // The learner picks an answer: the hint's hand goes.
  const pick = (id: string) => {
    answerHint.stop();
    setSelectedId(id);
  };

  const check = () => {
    answerHint.stop();
    setChecked(true);
    noteAnswer(step, correct);
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  return (
    <LevelTwoShell
      step={step}
      voiceover={voiceover}
      scene={<PatternBackdrop />}
      answer={answer}
      // The main button is not there until an answer is picked; then it comes up and says Check (Continue once checked).
      ctaHidden={selectedId === null}
      ctaDisabled={!spoken}
      ctaLabel={checked ? "Continue" : "Check"}
      onContinue={() => (checked ? router.push(nextAfter(step, correct, levelTwoHref(step + 1))) : check())}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? quiz.rightTitle : quiz.wrongTitle}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct ? quiz.right : quiz.wrong}
          </FeedbackPanel>
        </div>
      }
    >
      <Column>
        {/* Silent once the answer is checked (the result has no voice): the character just stands. */}
        <CharacterOnStage
          line={quiz.line}
          silenced={!voiceover}
          onStage={setStage}
          centered
          // Opens down by the main button and rises as the answers come in.
          lowered={!optionsShown}
          withHint={false}
          framing="bust"
          top={stageTop(TRAY_CHARACTER.top)}
          height={TRAY_CHARACTER.height}
          fade={TRAY_CHARACTER.fade}
        />
        {/* The hint comes in with the tray and folds away once the answer is checked; until the question has been said it is dimmed. */}
        {optionsShown && (
          <div
            className="absolute"
            style={{
              right: HINT.fromEdge - HINT.gap,
              width: HINT.size + HINT.gap,
              height: HINT.size,
              bottom: `calc(${aboveButtons(TRAY_CARD_GAP)} + ${trayRise(TRAY_LIST)}px + ${HINT.overTray}px)`,
            }}
          >
            <HintButton
              visible={!checked}
              count={1}
              size={{ width: `${HINT.size}px`, height: `${HINT.size}px`, lift: "0px" }}
              disabled={!spoken}
              onPress={() => {
                playClickSound();
                answerHint.press(quiz.correctId);
              }}
            />
          </div>
        )}
      </Column>

      <ScreenTitle oneLine>
        <TitleText lines={quiz.title} />
      </ScreenTitle>

      <AnswerTray shown={optionsShown} gone={checked} stand={TRAY_LIST} />

      {/* The answers aren't there until the character has said most of the question; then they slide up (their own entrance). */}
      {optionsShown && (
        <AnswerCards
          choices={quiz.choices}
          correctId={quiz.correctId}
          selectedId={selectedId}
          checked={checked}
          // The character is the picture behind the rows: when the result comes they go where they stand (so they never run up over it), and so do not bounce.
          fadeOut={checked}
          pointedId={answerHint.pointedId}
          withHint={false}
          rise={0}
          bottomGap={TRAY_CARD_GAP}
          width={TRAY_LIST_WIDTH}
          endGap={0}
          gap={OPTION_GAP}
          bounceRight
          onPick={pick}
        />
      )}
      {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
      {answerHint.hand}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}

/** Screen 3 — `/module/commands?step=3`: the original quiz's pictures and result texts, the answers as the design draws them (no full stops). */
const WHAT_JUST_HAPPENED_3D: CharacterQuiz = {
  step: 3,
  title: [[{ text: "What just " }, { text: "happened?", teal: true }]],
  line: [{ text: "What did the robot do after " }, { text: "Pick Up", teal: true }, { text: "?" }],
  choices: [
    { id: "picked", text: "Robot picked up the cube", icon: "step-4.1.svg" },
    { id: "table", text: "Robot moved the table", icon: "step-4.2.svg" },
    { id: "nothing", text: "Nothing happened", icon: "step-4.3.svg" },
  ],
  correctId: "picked",
  rightTitle: "Exactly!",
  right: "The robot followed the instructions and picked up the cube.",
  wrongTitle: "Let’s look again!",
  wrong: "Watch what robot does after you select the instruction.",
  voiceover: MODULE_AUDIO.whatJustHappened,
};

/** Screen 11 — `/module/commands?step=11`: what instructions are known as (the original screen's rows and texts). */
const INSTRUCTIONS_ARE_3D: CharacterQuiz = {
  step: 11,
  title: [[{ text: "Instructions", teal: true }, { text: " are…" }]],
  line: [{ text: "Instructions are…" }],
  choices: [
    { id: "statement", text: "Statement", icon: "/images/level-one/statement.png" },
    { id: "command", text: "Command", icon: "/images/level-one/command.png" },
    { id: "question", text: "Question", icon: "/images/level-one/question.png" },
  ],
  correctId: "command",
  right: (
    <>
      Yes! Instructions in a program are called <b>commands.</b>
    </>
  ),
  wrong: (
    <>
      Remember: Instructions in a program are called <b>commands.</b>
    </>
  ),
  voiceover: MODULE_AUDIO.instructionsAre,
};

/** Screen 3's component (the page is a server component, so it is handed a component, not the data above). */
export const WhatJustHappenedScreen = () => <CharacterQuizScreen quiz={WHAT_JUST_HAPPENED_3D} />;

/** Screen 11's component. */
export const InstructionsAreScreen = () => <CharacterQuizScreen quiz={INSTRUCTIONS_ARE_3D} />;
