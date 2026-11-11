"use client";

import { useState } from "react";
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
  InstantAnswersDemo,
  MultiSelectDemo,
  OptionChipsDemo,
  OrderListDemo,
  RegistryDemo,
  ResultDemo,
  RewardDemo,
  RobotDemo,
  SceneDemo,
  SliderDemo,
  RevealCardsDemo,
  SortBucketsDemo,
  TextFieldDemo,
  VoiceoverDemo,
} from "./demos";
import { Demo, Panel, Section, Tool } from "./parts";

/**
 * What was merged or added lately, and where to see each: its demo on this page (`demo` is a section's id),
 * and the lesson screens that use it, played from their data (`[label, module, step]`).
 */
const NEW: readonly { name: string; what: string; demo: string; screens: readonly (readonly [string, string, number])[] }[] = [
  {
    name: "LessonHeader · LessonFooter",
    what: "The real lesson screens now draw these two: one header and one footer for every module.",
    demo: "frame",
    screens: [["any screen, e.g. Data Types 1", "datatypes", 1]],
  },
  {
    name: "Answers",
    what: "The cards stand on the raised edge, as in the lessons. New setting `instant`: a tap is checked at once, with no Check button.",
    demo: "answers",
    screens: [["instant: Data Types 23 (its second part)", "datatypes", 23]],
  },
  {
    name: "SortGroups",
    what: "One component, three looks. It replaced three one-screen components.",
    demo: "activities",
    screens: [
      ["columns: Data Types 9", "datatypes", 9],
      ["free: Data Types 3", "datatypes", 3],
      ["labels: Variable 14", "variable", 14],
    ],
  },
  {
    name: "RevealCards",
    what: "One component, eight looks. It replaced eight one-screen components.",
    demo: "activities",
    screens: [
      ["cards: Data Types 12", "datatypes", 12],
      ["scenes: Conditions 2", "conditions", 2],
      ["share: Conditions 13", "conditions", 13],
      ["flip: Operators 1", "operators", 1],
      ["situations: Operators 2", "operators", 2],
      ["operators: Operators 5", "operators", 5],
      ["jobs: Operators 6", "operators", 6],
      ["tour: Data Types 4", "datatypes", 4],
    ],
  },
  {
    name: "LessonArtboard scene",
    what: "The Rive scene behind a screen. The data names the scene and what plays on a right or a wrong answer.",
    demo: "scenes",
    screens: [
      ["trek: Variable 3", "variable", 3],
      ["items: Variable 4", "variable", 4],
      ["bottle: Variable 5", "variable", 5],
      ["names: Variable 12", "variable", 12],
      ["shop: Variable 18", "variable", 18],
      ["wallet: Variable 22", "variable", 22],
    ],
  },
];

/** Gives the lesson screens a battery that does not run out (it is kept in session storage), so "Out of energy" does not cover them. */
function unlimitedBattery() {
  try {
    sessionStorage.setItem("lingo.battery", JSON.stringify({ level: 100, unlimited: true, charged: 0 }));
  } catch {
    // Storage blocked: the battery will run down as it does in play.
  }
}

const SECTIONS = [
  ["new", "New"],
  ["frame", "On every screen"],
  ["answers", "Answers"],
  ["activities", "Activities"],
  ["scenes", "Scenes and media"],
  ["data", "From data"],
] as const;

/** `/kit` — the decided components (`docs/kit-components.md`), each working with sample data. */
export function KitGallery() {
  const [batterySet, setBatterySet] = useState(false);
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

      <Section id="new" title="New" note="What was merged or added lately. “Demo” jumps to it on this page; the other links open a real lesson screen that uses it, played from its data. Press “Unlimited battery” once first, or the lesson screens get covered by “Out of energy”.">
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-3">
            <Tool
              label={batterySet ? "Unlimited battery ✓" : "Unlimited battery"}
              active={batterySet}
              onClick={() => {
                unlimitedBattery();
                setBatterySet(true);
              }}
            />
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2">
            {NEW.map((item) => (
              <div key={item.name} className="flex flex-col gap-2 rounded-[16px] border border-black/10 bg-white/70 p-4 dark:border-white/15 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-mono text-[15px] leading-5 font-semibold text-[#08A4AD]">{item.name}</h3>
                  <a href={`#${item.demo}`} className="rounded-full bg-[#08A4AD] px-3 py-1 text-[12px] font-bold text-white">
                    Demo ↓
                  </a>
                </div>
                <p className="text-[13px] leading-5 text-[#444444] dark:text-white/80">{item.what}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.screens.map(([label, module, step]) => (
                    <Link key={label} href={`/kit/play/${module}?step=${step}`} target="_blank" className="rounded-full border border-[#7B61FF] px-2.5 py-0.5 text-[12px] font-semibold text-[#7B61FF] hover:bg-[#7B61FF]/10">
                      {label} ↗
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

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
        <Demo name="Answers instant" note="New. Each tap is checked at once, with no Check button: a wrong tap shakes red and gives its note, the right one turns green and the screen is told.">
          <InstantAnswersDemo />
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

      <Section id="activities" title="Activities" note="The things to do inside a screen. OrderSteps, SortGroups and RevealCards are built; BlockBuilder, SwitchTable, PredictRows, MatchPairs and NumberLine are still the module-specific pieces that will be merged into them (see /kit/export, Kit coverage).">
        <Demo name="OrderSteps" note="Drag the rows into order.">
          <OrderListDemo />
        </Demo>
        <Demo name="SortGroups" note="One component, three looks (the data picks): columns (drag a card into its group), free (group with no right answer), labels (tap a part, then its label).">
          <SortBucketsDemo />
        </Demo>
        <Demo name="RevealCards" note="One component, the data picks the look. Tapped by the learner: cards, scenes, share, flip. Introduced by Hex one per stage: situations, operators, jobs, tour. Three of them are shown here.">
          <RevealCardsDemo />
        </Demo>
      </Section>

      <Section id="scenes" title="Scenes and media">
        <Demo name={`LessonArtboard scene="…"`} note="New. The Rive scene behind a screen. Pick a scene, then play its triggers (what a screen plays on a right answer, a wrong one, a new try).">
          <SceneDemo />
        </Demo>
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
