"use client";

import { useRef, useState } from "react";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import {
  LessonFooter,
  AnswerMark,
  Artboard,
  type ArtboardHandle,
  AudioClip,
  BatteryMeter,
  Celebration,
  ResultSheet,
  CommandCards,
  GameBoard,
  HexGame,
  LessonHeader,
  HexGuide,
  type HexState,
  type KitNode,
  LessonComplete,
  MovePad,
  PickAll,
  SoundButton,
  WordChips,
  OptionGrid,
  OptionList,
  type OptionData,
  OrderSteps,
  type OrderItem,
  type PlanItem,
  LessonArtboard,
  Answers,
  type AnswersLook,
  ProgramBuilder,
  RewardPopup,
  LessonSlider,
  SortGroups,
  LessonTextBox,
  TrueFalse,
  type TriggerRequest,
  Voiceover,
  renderKit,
  type AnswerResult,
  type GridLayout,
} from "../internal";
import { Panel, Phone, Tool, Tools } from "./parts";

/* ------------------------------------------------------------------ results */

export function ResultDemo() {
  const [shown, setShown] = useState<"none" | "correct" | "wrong">("none");
  return (
    <div className="flex flex-col gap-2">
      <Phone height={360}>
        <div className="absolute inset-x-0 top-6 text-center text-[14px] text-[#6B7480] dark:text-white/60">The sheet slides up behind the main button</div>
        <ResultSheet correct={shown !== "wrong"} open={shown !== "none"} title={shown === "wrong" ? "Not quite" : "Exactly!"} text={shown === "wrong" ? "Remember: the teacher is giving an **instruction**." : "The teacher is giving an **instruction**."} />
      </Phone>
      <Tools>
        <Tool label="Correct" active={shown === "correct"} onClick={() => setShown("correct")} />
        <Tool label="Wrong" active={shown === "wrong"} onClick={() => setShown("wrong")} />
        <Tool label="Close" onClick={() => setShown("none")} />
      </Tools>
    </div>
  );
}

export function CelebrateDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <Tool
        label="Celebration!"
        onClick={() => {
          setOn(false);
          requestAnimationFrame(() => setOn(true));
          window.setTimeout(() => setOn(false), 2500);
        }}
      />
      <Celebration active={on} />
    </div>
  );
}

export function AnswerMarkDemo() {
  return (
    <div className="flex items-center gap-3">
      <AnswerMark kind="correct" />
      <AnswerMark kind="wrong" />
      <AnswerMark kind="correct" size={40} />
      <AnswerMark kind="wrong" size={40} />
    </div>
  );
}

/* ------------------------------------------------------------------ answers */

const ROWS: OptionData[] = [
  { id: "picked", text: "Robot picked up the cube.", image: "step-4.1.svg" },
  { id: "table", text: "Robot moved the table.", image: "step-4.2.svg" },
  { id: "nothing", text: "Nothing happened.", image: "step-4.3.svg" },
];

/** The controls every single-choice demo shares: Check, Hint, Reset. */
function useSingle(correctId: string) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hinted, setHinted] = useState(false);
  const tools = (
    <Tools>
      <Tool label="Check" onClick={() => selectedId && setChecked(true)} active={checked} />
      <Tool label="Hint" onClick={() => setHinted(true)} active={hinted && !checked} />
      <Tool
        label="Reset"
        onClick={() => {
          setSelectedId(null);
          setChecked(false);
          setHinted(false);
        }}
      />
    </Tools>
  );
  return { selectedId, setSelectedId, checked, hintId: hinted ? correctId : null, tools };
}

export function OptionListDemo() {
  const single = useSingle("picked");
  return (
    <Panel>
      <OptionList options={ROWS} selectedId={single.selectedId} onSelect={single.setSelectedId} checked={single.checked} correctId="picked" hintId={single.hintId} />
      {single.tools}
    </Panel>
  );
}

const OBJECTS: OptionData[] = [
  { id: "bottle", text: "Water bottle", emoji: "💧" },
  { id: "ball", text: "Football", emoji: "⚽" },
  { id: "lunch", text: "Lunchbox", emoji: "🍱" },
];

/** The one Answers component in each of its looks. */
export function AnswersDemo({ look, tiles }: { look: AnswersLook; tiles?: Exclude<GridLayout, "auto"> }) {
  const options = look === "rows" ? ROWS : look === "tiles" ? GRIDS[tiles ?? "pair"].options : look === "objects" ? OBJECTS : [{ id: "true", text: "True" }, { id: "false", text: "False" }];
  const correctId = look === "rows" ? "picked" : look === "tiles" ? GRIDS[tiles ?? "pair"].correctId : look === "objects" ? "bottle" : "true";
  const single = useSingle(correctId);
  return (
    <Panel>
      <Answers look={look} tiles={tiles} options={options} selectedId={single.selectedId} onSelect={single.setSelectedId} checked={single.checked} correctId={correctId} hintId={single.hintId} spill={look === "objects"} question={look === "trueFalse" ? "12 is a whole number." : undefined} />
      {single.tools}
    </Panel>
  );
}

export function OptionListCompactDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const words: OptionData[] = [{ id: "a", text: "Integer" }, { id: "b", text: "Float" }, { id: "c", text: "String" }, { id: "d", text: "Boolean" }];
  return (
    <Panel>
      <OptionList options={words} selectedId={selectedId} onSelect={setSelectedId} compact control="radio" />
    </Panel>
  );
}

const GRIDS: Record<Exclude<GridLayout, "auto">, { options: OptionData[]; correctId: string }> = {
  pair: {
    options: [
      { id: "pickup", text: "Pick Up", image: "step-9.1.svg", tint: "lavender" },
      { id: "putdown", text: "Put Down", image: "step-9.2.svg", tint: "cream" },
    ],
    correctId: "putdown",
  },
  three: {
    options: [
      { id: "pickup", text: "Pick Up", image: "step-13.1.svg", tint: "green" },
      { id: "putdown", text: "Put Down", image: "step-13.2.svg", tint: "cream" },
      { id: "target", text: "Place in Target", image: "step-13.3.svg", tint: "blue" },
    ],
    correctId: "target",
  },
  grid: {
    options: [
      { id: "a", text: "Whole numbers", image: "step-11.1.svg", tint: "blue" },
      { id: "b", text: "Decimals", image: "step-11.2.svg", tint: "lavender" },
      { id: "c", text: "Words", image: "step-11.3.svg", tint: "green" },
      { id: "d", text: "Yes or no", image: "step-11.4.svg", tint: "cream" },
    ],
    correctId: "a",
  },
  cards: {
    options: [
      { id: "asking", text: "Asking Question", image: "/images/level-one/asking-question.png", tint: "lavender" },
      { id: "giving", text: "Giving Instruction", image: "/images/level-one/giving-instruction.png", tint: "cream" },
    ],
    correctId: "giving",
  },
};

export function OptionGridDemo({ layout }: { layout: Exclude<GridLayout, "auto"> }) {
  const { options, correctId } = GRIDS[layout];
  const single = useSingle(correctId);
  return (
    <Panel>
      <OptionGrid layout={layout} options={options} selectedId={single.selectedId} onSelect={single.setSelectedId} checked={single.checked} correctId={correctId} hintId={single.hintId} />
      {single.tools}
    </Panel>
  );
}

export function TrueFalseDemo() {
  const [value, setValue] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  return (
    <Panel>
      <p className="text-center text-[16px] font-semibold text-[#444444] dark:text-white">12 is a whole number.</p>
      <TrueFalse value={value} onSelect={setValue} checked={checked} correct />
      <Tools>
        <Tool label="Check" onClick={() => value !== null && setChecked(true)} active={checked} />
        <Tool
          label="Reset"
          onClick={() => {
            setValue(null);
            setChecked(false);
          }}
        />
      </Tools>
    </Panel>
  );
}

export function MultiSelectDemo() {
  const options: OptionData[] = [
    { id: "name", text: "Aarav", sub: "a name" },
    { id: "age", text: "12", sub: "an age" },
    { id: "city", text: "Hyderabad", sub: "a city" },
    { id: "weight", text: "36.7", sub: "a weight" },
  ];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  return (
    <Panel>
      <p className="text-center text-[16px] font-semibold text-[#444444] dark:text-white">Which ones are text?</p>
      <PickAll options={options} selectedIds={selectedIds} onToggle={(id) => setSelectedIds((now) => (now.includes(id) ? now.filter((entry) => entry !== id) : [...now, id]))} checked={checked} correctIds={["name", "city"]} compact />
      <Tools>
        <Tool label="Check" onClick={() => selectedIds.length > 0 && setChecked(true)} active={checked} />
        <Tool
          label="Reset"
          onClick={() => {
            setSelectedIds([]);
            setChecked(false);
          }}
        />
      </Tools>
    </Panel>
  );
}

export function OptionChipsDemo() {
  const options: OptionData[] = ["if", "else", "print", "while", "def", "return"].map((word) => ({ id: word, text: word }));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  return (
    <Panel>
      <p className="text-center text-[16px] font-semibold text-[#444444] dark:text-white">Tap the words that choose between two paths.</p>
      <WordChips options={options} selectedIds={selectedIds} multiple onSelect={(id) => setSelectedIds((now) => (now.includes(id) ? now.filter((entry) => entry !== id) : [...now, id]))} checked={checked} correctIds={["if", "else"]} />
      <Tools>
        <Tool label="Check" onClick={() => selectedIds.length > 0 && setChecked(true)} active={checked} />
        <Tool
          label="Reset"
          onClick={() => {
            setSelectedIds([]);
            setChecked(false);
          }}
        />
      </Tools>
    </Panel>
  );
}

/* ------------------------------------------------------------------- inputs */

export function SliderDemo() {
  const [ml, setMl] = useState(250);
  return (
    <Panel>
      <LessonSlider value={ml} onChange={setMl} min={0} max={1000} step={50} unit="ml" label="Amount of water" caption={ml === 500 ? "That's *500 ml*!" : "Slide to 500 ml"} />
    </Panel>
  );
}

export function TextFieldDemo() {
  const [name, setName] = useState("");
  return (
    <Panel>
      <LessonTextBox value={name} onChange={setName} label="What should I call you?" placeholder="Your name" maxLength={20} error={name.length > 0 && name.length < 2 ? "A little longer, please." : undefined} />
    </Panel>
  );
}

const STEPS: OrderItem[] = [
  { id: "heat", text: "Heat the water" },
  { id: "bag", text: "Put the tea bag in the cup" },
  { id: "pour", text: "Pour the hot water" },
  { id: "stir", text: "Stir and enjoy" },
];

export function OrderListDemo() {
  const [order, setOrder] = useState(["pour", "heat", "stir", "bag"]);
  const [checked, setChecked] = useState(false);
  const items = order.map((id) => STEPS.find((step) => step.id === id)!);
  return (
    <Panel>
      <OrderSteps items={items} onChange={setOrder} checked={checked} correctOrder={["heat", "bag", "pour", "stir"]} />
      <Tools>
        <Tool label="Check" onClick={() => setChecked(true)} active={checked} />
        <Tool
          label="Reset"
          onClick={() => {
            setOrder(["pour", "heat", "stir", "bag"]);
            setChecked(false);
          }}
        />
      </Tools>
    </Panel>
  );
}

export function SortBucketsDemo() {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const items = [
    { id: "12", text: "12" },
    { id: "36.7", text: "36.7" },
    { id: "25", text: "25" },
    { id: "148.5", text: "148.5" },
  ];
  return (
    <Panel>
      <SortGroups
        items={items}
        buckets={[
          { id: "int", label: "Integer", tint: "blue" },
          { id: "float", label: "Float", tint: "cream" },
        ]}
        placed={placed}
        onPlace={(id, bucket) =>
          setPlaced((now) => {
            const next = { ...now };
            if (bucket === null) delete next[id];
            else next[id] = bucket;
            return next;
          })
        }
        answers={{ "12": "int", "36.7": "float", "25": "int", "148.5": "float" }}
        checked={checked}
      />
      <Tools>
        <Tool label="Check" onClick={() => setChecked(true)} active={checked} />
        <Tool
          label="Reset"
          onClick={() => {
            setPlaced({});
            setChecked(false);
          }}
        />
      </Tools>
    </Panel>
  );
}

/* ---------------------------------------------------------------------- hex */

export function HexSaysDemo({ hex }: { hex: "left" | "right" | "top" }) {
  const [round, setRound] = useState(0);
  return (
    <Panel>
      <HexGuide key={round} text="Which command *releases* the cube?" hex={hex} entryKey={`gallery-${hex}-${round}`} />
      <Tools>
        <Tool label="Play again" onClick={() => setRound((n) => n + 1)} />
      </Tools>
    </Panel>
  );
}

/* ------------------------------------------------------------------- header */

export function HeaderDemo() {
  const [step, setStep] = useState(3);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Phone height={70}>
        <div className="absolute inset-x-0 top-5">
          <LessonHeader step={step} total={10} answer={answer} persistent={false} />
        </div>
      </Phone>
      <Tools>
        <Tool label="Step −" onClick={() => setStep((n) => Math.max(1, n - 1))} />
        <Tool label="Step +" onClick={() => setStep((n) => Math.min(10, n + 1))} />
        <Tool label="Right answer" onClick={() => setAnswer((now) => ({ id: (now?.id ?? 0) + 1, correct: true }))} />
        <Tool label="Wrong answer" onClick={() => setAnswer((now) => ({ id: (now?.id ?? 0) + 1, correct: false }))} />
      </Tools>
    </div>
  );
}

export function BatteryDemo() {
  return (
    <div className="flex items-center gap-6">
      <BatteryMeter level={100} persistent={false} />
      <BatteryMeter level={50} persistent={false} />
      <BatteryMeter level={10} persistent={false} />
    </div>
  );
}

/* ------------------------------------------------------------------ buttons */

export function ActionBarDemo() {
  const [hint, setHint] = useState(true);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Phone height={150}>
        <div className="absolute inset-x-0 bottom-0">
          <LessonFooter label="Check" hint={{ visible: hint, onUse: () => setHint(false) }} answer={answer} onContinue={() => setAnswer((now) => ({ id: (now?.id ?? 0) + 1, correct: true }))} />
        </div>
      </Phone>
      <Tools>
        <Tool label="Show hint" active={hint} onClick={() => setHint(true)} />
        <Tool label="Reset colour" onClick={() => setAnswer(null)} />
      </Tools>
    </div>
  );
}

/* ---------------------------------------------------------------- artboards */

/** A trigger request that fires again each time it is asked for. */
function useTrigger() {
  const [trigger, setTrigger] = useState<TriggerRequest | null>(null);
  return { trigger, fire: (name: string) => setTrigger((now) => ({ name, id: (now?.id ?? 0) + 1 })) };
}

export function RobotDemo() {
  const { trigger, fire } = useTrigger();
  return (
    <div className="flex flex-col gap-2">
      <LessonArtboard name="robot-arm" trigger={trigger} className="w-[390px] max-w-full" label="A robot arm at a table" />
      <Tools>
        {["pickUp", "putDown", "placeInTarget", "wrongClaw", "wrongCube", "reset"].map((name) => (
          <Tool key={name} label={name} onClick={() => fire(name)} />
        ))}
      </Tools>
    </div>
  );
}

export function BatteryArtboardDemo() {
  const { trigger, fire } = useTrigger();
  const [level, setLevel] = useState(70);
  return (
    <div className="flex flex-col gap-2">
      <LessonArtboard name="battery" properties={{ level }} trigger={trigger} className="w-[200px]" label="The battery" />
      <Tools>
        <Tool label="Level −" onClick={() => setLevel((n) => Math.max(0, n - 20))} />
        <Tool label="Level +" onClick={() => setLevel((n) => Math.min(100, n + 20))} />
        <Tool label="spend" onClick={() => fire("spend")} />
        <Tool label="gain" onClick={() => fire("gain")} />
      </Tools>
    </div>
  );
}

export function GemDemo() {
  const handle = useRef<ArtboardHandle>(null);
  return (
    <div className="flex flex-col gap-2">
      <Artboard ref={handle} src="/animations/gem" artboard="Gem" stateMachine="State Machine 1" bind={false} className="size-32" label="A gem" />
      <p className="max-w-[200px] text-[12px] leading-4 text-[#6B7480] dark:text-white/60">Any file, artboard and state machine by name.</p>
    </div>
  );
}

/* -------------------------------------------------------------------- audio */

export function AudioDemo() {
  return (
    <div className="flex items-center gap-4">
      <AudioClip src={MODULE_AUDIO.commandClip} standInSeconds={4} />
      <SoundButton />
    </div>
  );
}

export function VoiceoverDemo() {
  const [round, setRound] = useState(0);
  return (
    <Panel>
      {round > 0 ? (
        <Voiceover key={round} clips={MODULE_AUDIO.meetCommand}>
          <HexGuide text="In programming languages, instructions are known as *commands*." entryKey={`voice-${round}`} />
        </Voiceover>
      ) : (
        <p className="py-6 text-center text-[13px] text-[#6B7480] dark:text-white/60">Press play: Hex talks while the clip plays, and his words type in step with it.</p>
      )}
      <Tools>
        <Tool label={round > 0 ? "Play again" : "Play"} onClick={() => setRound((n) => n + 1)} />
      </Tools>
    </Panel>
  );
}

/* --------------------------------------------------------------------- game */

export function GameBoardDemo() {
  const [hex, setHex] = useState<HexState>({ col: 0, row: 2, dir: 0 });
  return (
    <Panel>
      <GameBoard kind="grid" hex={hex} battery={{ col: 2, row: 0 }} width={300} />
      <Tools>
        <Tool label="Bottom-left" onClick={() => setHex({ col: 0, row: 2, dir: 0 })} />
        <Tool label="Centre" onClick={() => setHex({ col: 1, row: 1, dir: 1 })} />
        <Tool label="Top-right" onClick={() => setHex({ col: 2, row: 0, dir: 2 })} />
      </Tools>
    </Panel>
  );
}

export function MovePadDemo() {
  const [last, setLast] = useState("nothing yet");
  return (
    <Panel>
      <MovePad
        controls={[
          { id: "straight", label: "Go Straight", icon: "up" },
          { id: "back", label: "Go Back", icon: "down" },
        ]}
        onPress={setLast}
      />
      <p className="text-[12px] text-[#6B7480] dark:text-white/60">Pressed: {last}</p>
    </Panel>
  );
}

export function ProgramBuilderDemo() {
  const [items, setItems] = useState<PlanItem[]>([{ id: 1, command: "forward" }]);
  return (
    <Panel>
      <ProgramBuilder palette={["forward", "right"]} items={items} max={4} onChange={setItems} onRun={() => undefined} onReset={() => setItems([])} />
    </Panel>
  );
}

export function CommandCardsDemo() {
  return (
    <Panel>
      <CommandCards commands={["forward", "forward", "right"]} active={1} />
    </Panel>
  );
}

export function GameScreenDemo({ mode }: { mode: "program" | "move" }) {
  const [result, setResult] = useState<string>("No result yet.");
  return (
    <Panel width={390}>
      <HexGame
        key={mode}
        mode={mode}
        board="grid"
        goal={mode === "program" ? { col: 0, row: 0 } : { col: 2, row: 2 }}
        maxCommands={4}
        onResult={(r) => setResult(r.correct ? "Result: Hex reached the battery." : `Result: ended on column ${r.end.col}, row ${r.end.row}.`)}
      />
      <p className="text-[12px] text-[#6B7480] dark:text-white/60">{result}</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ rewards */

export function RewardDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Phone height={560}>
        <RewardPopup open={open} onClose={() => setOpen(false)} message="You won 1 Gem as you followed the given command." autoCloseMs={null} />
      </Phone>
      <Tools>
        <Tool label="Open" onClick={() => setOpen(true)} />
      </Tools>
    </div>
  );
}

export function LessonCompleteDemo() {
  const [round, setRound] = useState(1);
  return (
    <div className="flex flex-col gap-2">
      <Phone height={640}>
        <LessonComplete key={round} xp={40} accuracy={92} seconds={222} />
      </Phone>
      <Tools>
        <Tool label="Play again" onClick={() => setRound((n) => n + 1)} />
      </Tools>
    </div>
  );
}

/* ----------------------------------------------------------------- registry */

/** A piece of a screen as data — only parts that need no callbacks, so it can be written out as JSON. */
export const SAMPLE_TREE: KitNode = {
  type: "stack",
  props: { gap: 10 },
  children: [
    { type: "lesson-title", props: { text: "Meet the *Command*" } },
    { type: "key-text", props: { text: "In programming, an instruction is called a command." } },
    { type: "name-value-card", props: { rows: [{ name: "Is_present", value: "True", tone: "on" }, { name: "Is_logged_in", value: "False", tone: "off" }] } },
  ],
};

export function RegistryDemo() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <pre className="max-h-[420px] w-[390px] max-w-full overflow-auto rounded-[12px] bg-[#1A1C22] p-3 text-[12px] leading-5 text-white">{JSON.stringify(SAMPLE_TREE, null, 2)}</pre>
      <Panel>{renderKit(SAMPLE_TREE)}</Panel>
    </div>
  );
}
