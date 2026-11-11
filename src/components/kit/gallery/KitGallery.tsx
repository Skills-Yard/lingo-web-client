"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ARTBOARDS, KeyText, LessonCards, LessonTitle, VideoPlayer } from "../internal";
import {
  ActionBarDemo,
  AnswersDemo,
  AudioDemo,
  BatteryArtboardDemo,
  CelebrateDemo,
  FlipCardDemo,
  GameScreenDemo,
  GemDemo,
  HeaderDemo,
  HexSaysDemo,
  MultiSelectDemo,
  OptionChipsDemo,
  OrderListDemo,
  RegistryDemo,
  ResultDemo,
  RewardDemo,
  RobotDemo,
  SliderDemo,
  SortBucketsDemo,
  TextFieldDemo,
  VoiceoverDemo,
} from "./demos";
import { Demo, Panel, Section } from "./parts";

const SECTIONS = [
  ["frame", "On every screen"],
  ["answers", "Answers"],
  ["activities", "Activities"],
  ["scenes", "Scenes and media"],
  ["data", "From data"],
] as const;

/** `/kit` — the decided components (`docs/kit-components.md`), each working with sample data. */
export function KitGallery() {
  return (
    // Hex's canvas is far wider than the box he sits in (it is drawn at ~950px); `overflow-x-clip` keeps that from widening the page (unlike `hidden`, it leaves the sticky nav working).
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-14 overflow-x-clip px-5 py-8 text-[#444444] dark:text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-10 font-semibold">Screen kit</h1>
          <p className="mt-1 max-w-[680px] text-[14px] leading-5 text-[#6B7480] dark:text-white/60">The components every screen is built from. The name over each demo is the component; the data names these and nothing else.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/kit/screen" className="rounded-full bg-[#08A4AD] px-4 py-1.5 text-[14px] font-bold text-white shadow-[0_3px_0_#067F86]">
              See a whole screen →
            </Link>
            <Link href="/kit/compare?module=datatypes&step=1" className="rounded-full bg-[#7B61FF] px-4 py-1.5 text-[14px] font-bold text-white shadow-[0_3px_0_#5B3FD0]">
              Compare code vs data
            </Link>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Above the demos' own overlays (the reward popup is `z-[300]`), which would otherwise draw over it as the page scrolls. */}
      <nav className="sticky top-0 z-[400] -mx-5 flex flex-wrap gap-2 bg-white/90 px-5 py-3 backdrop-blur dark:bg-background/90">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-black/10 px-3 py-1 text-[13px] font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
            {label}
          </a>
        ))}
      </nav>

      <Section id="frame" title="On every screen" note="The same parts on every screen of every module; only the words and numbers change.">
        <Demo name="LessonHeader" note="Close button, progress bar and battery. The bar cheers or winces at each answer.">
          <HeaderDemo />
        </Demo>
        <Demo name="LessonFooter" note="The main button with the hint beside it; the hint folds away when used.">
          <ActionBarDemo />
        </Demo>
        <Demo name="LessonTitle">
          <Panel>
            <LessonTitle text="Let's *Go*" />
            <LessonTitle text="Which command *releases* the cube?" />
          </Panel>
        </Demo>
        <Demo name="KeyText">
          <Panel>
            <KeyText text="Integer (int) represents whole-number values." />
          </Panel>
        </Demo>
        <Demo name="HexGuide hex='left'">
          <HexSaysDemo hex="left" />
        </Demo>
        <Demo name="HexGuide hex='right'">
          <HexSaysDemo hex="right" />
        </Demo>
        <Demo name="ResultSheet" note="One component for right and wrong: the colour and Hex's reaction follow `correct`.">
          <ResultDemo />
        </Demo>
        <Demo name="Celebration" note="Confetti and +10 XP.">
          <CelebrateDemo />
        </Demo>
        <Demo name="RewardPopup">
          <RewardDemo />
        </Demo>
        <Demo name="SoundButton · AudioClip">
          <AudioDemo />
        </Demo>
      </Section>

      <Section id="answers" title="Answers" note="One Answers component; the data picks the look. Pick, then Check; Hint points at the right one.">
        <Demo name="Answers look='rows'">
          <AnswersDemo look="rows" />
        </Demo>
        <Demo name="Answers look='tiles' (pair)">
          <AnswersDemo look="tiles" tiles="pair" />
        </Demo>
        <Demo name="Answers look='tiles' (three)">
          <AnswersDemo look="tiles" tiles="three" />
        </Demo>
        <Demo name="Answers look='tiles' (grid)">
          <AnswersDemo look="tiles" tiles="grid" />
        </Demo>
        <Demo name="Answers look='tiles' (cards)">
          <AnswersDemo look="tiles" tiles="cards" />
        </Demo>
        <Demo name="Answers look='objects'">
          <AnswersDemo look="objects" />
        </Demo>
        <Demo name="Answers look='trueFalse'">
          <AnswersDemo look="trueFalse" />
        </Demo>
        <Demo name="PickAll">
          <MultiSelectDemo />
        </Demo>
        <Demo name="WordChips">
          <OptionChipsDemo />
        </Demo>
        <Demo name="LessonSlider">
          <SliderDemo />
        </Demo>
        <Demo name="LessonTextBox">
          <TextFieldDemo />
        </Demo>
      </Section>

      <Section id="activities" title="Activities" note="The things to do inside a screen. OrderSteps and SortGroups are built; RevealCards, BlockBuilder, SwitchTable, PredictRows, MatchPairs and NumberLine are still the module-specific pieces that will be merged into them (see /kit/export, Kit coverage).">
        <Demo name="OrderSteps" note="Drag the rows into order.">
          <OrderListDemo />
        </Demo>
        <Demo name="SortGroups" note="One component, three looks (the data picks): columns (drag a card into its group), free (group with no right answer), labels (tap a part, then its label).">
          <SortBucketsDemo />
        </Demo>
      </Section>

      <Section id="scenes" title="Scenes and media">
        <Demo name={`LessonArtboard name="robot-arm"`} note="The data names the artboard; triggers play on it.">
          <RobotDemo />
        </Demo>
        <Demo name={`LessonArtboard name="battery"`}>
          <BatteryArtboardDemo />
        </Demo>
        <Demo name={`LessonArtboard name="flip-card" tapTrigger`} note="Tap the card (or Flip) to turn it over. It shows the Sequence card, “Why does order matter?”.">
          <FlipCardDemo />
        </Demo>
        <Demo name="LessonArtboard src=… (any file)">
          <GemDemo />
        </Demo>
        <Demo name="LessonArtboard · names">
          <pre className="max-w-[390px] rounded-[12px] bg-[#1A1C22] p-3 text-[12px] leading-5 text-white">{Object.keys(ARTBOARDS).join("\n")}</pre>
        </Demo>
        <Demo name={`HexGame mode="program"`}>
          <GameScreenDemo mode="program" />
        </Demo>
        <Demo name={`HexGame mode="move"`}>
          <GameScreenDemo mode="move" />
        </Demo>
        <Demo name="VideoPlayer">
          <VideoPlayer src="/video/lumi.mp4" width={340} />
        </Demo>
        <Demo name="LessonCards" note="Cards of facts and numbers (kept for now).">
          <Panel>
            <LessonCards
              cards={[
                { id: "a", title: "Students", line: "registered", value: "30", tint: "green" },
                { id: "b", title: "Tickets", line: "sold", value: "43", tint: "cream" },
                { id: "c", title: "Prizes", line: "available", value: "12", tint: "lavender" },
              ]}
            />
          </Panel>
        </Demo>
        <Demo name="Voiceover" note="Plays clips and tells Hex when it speaks.">
          <VoiceoverDemo />
        </Demo>
      </Section>

      <Section id="data" title="From data" note="Whole modules played from their data files, and a piece of a screen written as data with what `renderKit` makes of it.">
        <Demo name="ModuleRunner" note="Each link plays the module from its data file, with the module's own score and flow.">
          <div className="flex flex-wrap gap-2">
            {[
              ["datatypes", "Data Types"],
              ["operators", "Operators"],
              ["conditions", "Conditions"],
              ["variable", "Variable"],
            ].map(([id, label]) => (
              <Link key={id} href={`/kit/play/${id}?step=1`} className="rounded-full bg-[#08A4AD] px-4 py-1.5 text-[14px] font-bold text-white shadow-[0_3px_0_#067F86]">
                Play {label} →
              </Link>
            ))}
            <Link href="/kit/export" className="rounded-full border border-[#08A4AD] px-4 py-1.5 text-[14px] font-bold text-[#08A4AD]">
              Kit coverage
            </Link>
          </div>
        </Demo>
        <RegistryDemo />
      </Section>
    </main>
  );
}
