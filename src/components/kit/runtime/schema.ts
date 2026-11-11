/**
 * The screen data file format. A module is one JSON file (`src/data/modules/<id>.json`); the
 * runtime (`ModuleRunner`, `ScreenRunner`) plays it with the kit. Nothing in it is code.
 */

import type { AnswersLook } from "../options/Answers";
import type { OptionData } from "../types";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/**
 * A node is anything that can stand on a screen or be a prop. Beyond plain JSON it has four
 * kinds of object, told apart by their one special key:
 *
 *   { "$": "kit:title", "props": {...}, "children": [...] }   a component (kit, module or an html tag)
 *   { "$ctx": "api.hexSpoken" }                               a value the runner supplies when it draws (see `NodeContext`)
 *   { "$ref": "datatypes.noteGrouping" }                      a named function or component of the app (a callback, an icon)
 *   { "$fn": { "arity": 1, "body": <node> } }                 a function from its arguments (`arg0`, `arg1`...) to a node
 *   { "$by": ["checked"], "cases": { "false": <node>, "true": <node> } }   one node or another by yes/no values the runner supplies
 */
export type ElementNode = { $: string; props?: Record<string, Json>; children?: Json[] };
export type CtxNode = { $ctx: string };
export type RefNode = { $ref: string };
export type FnNode = { $fn: { arity: number; body: Json } };
/** A decision table: the value of each `$by` path (true or false) picks the case, written `"true,false"`. */
export type ByNode = { $by: string[]; cases: Record<string, Json> };

/** What a question's answer needs: its words and, optionally, a picture (a path), an emoji, a card colour or a picture of its own (`node`, for object cards). */
export type DataOption = OptionData & { node?: Json };
export type { OptionData };

type StageTitle = {
  /** A title of its own for this stage, in place of the screen's. */
  title?: string;
  titleSize?: number;
};

/** One question: what Hex says, a picture, and the answers. */
export type QuizStageData = StageTitle & {
  kind: "quiz";
  line: string;
  question?: string;
  /** The picture between Hex's line and the answers; `$ctx` values: `attempt`, `picked`, `checked`, `correct`, `hexSpoken`. */
  visual?: Json;
  /** How the answers are drawn (see `Answers`): `rows`, `tiles` (pictures), `objects` (small cards to tap) or `trueFalse` (two big cards; the options are `true` and `false`). */
  answers: AnswersLook;
  /** `trueFalse`: the words on the two cards, [for true, for false] (Yes / No). */
  yesNo?: [string, string];
  /** `rows`: shorter rows, for answers that are only words. */
  compact?: boolean;
  /** Hex and his line stay once it is checked. */
  keepLine?: boolean;
  options: DataOption[];
  correctId: string;
  /** Other picks that are fine too: acknowledged with their own panel, and the learner goes on without a retry. */
  alsoOk?: { ids: string[]; title: string; text: string };
  rightTitle: string;
  right: string;
  wrongTitle?: string;
  wrong: string;
  hintText?: string;
  /** A picture the hint brings in under the question's picture. */
  hintVisual?: Json;
  /** The hint shows by itself when the learner tries again. */
  hintOnMiss?: boolean;
  /** A wrong object spills water as it is picked (object cards). */
  spill?: boolean;
  /** The answers wait until Hex has said his line, then bounce in. */
  optionsAfterHex?: boolean;
  ctaLabel?: string;
  nextLabel?: string;
};

/** Something to do instead of a question. */
export type InteractionStageData = StageTitle & {
  kind: "interaction";
  line?: string;
  bubbleWidth?: number;
  alignTop?: boolean;
  /** Only to look at: Continue waits for Hex to finish his line. */
  ready?: boolean;
  /** What stands under Hex's line; `$ctx` values: `api` (and its parts: `api.done`, `api.hexSpoken`...). */
  content: Json;
  finishPanel?: { title: string; text: string };
  ctaLabel?: string;
  nextLabel?: string;
};

export type StageData = QuizStageData | InteractionStageData;

/**
 * The Rive scene behind a screen (a `LessonArtboard` with `scene`), and what plays on it as the learner answers.
 * A scene is kept for the whole module, so each screen says everything it needs of it.
 */
export type SceneData = {
  /** Which scene: `trek`, `bottle`, `names`, `items`, `shop`, `wallet` (see the kit's `scenes.tsx`). */
  name: string;
  /** Values set on it while this screen shows (`{ "noWater": true }`). */
  values?: Record<string, boolean | number | string>;
  /** A trigger fired each time something is got right (a right answer, an interaction done). */
  onRight?: string;
  /** A trigger fired each time something is got wrong (a wrong answer, a slip). */
  onWrong?: string;
  /** A trigger fired when the screen opens, and again for each new try. */
  onTry?: string;
};

/** A screen made of stages (one progress step). */
export type StagedScreenData = {
  step: number;
  /** The title; `*words*` in teal. */
  title: string;
  titleSize?: number;
  /** The Rive scene behind the screen, in place of the module's `scene` picture and the pale default. */
  scene?: SceneData;
  /** A picture behind the whole screen. */
  backdrop?: Json;
  /** `gem`: going on from the last stage opens the gem popup first. */
  finish?: "gem";
  stages: StageData[];
};

/** A screen that is one whole component of the app (a recap, "what comes next"). */
export type ComponentScreenData = { step: number; component: string };

export type ScreenData = StagedScreenData | ComponentScreenData;

export const isStaged = (screen: ScreenData): screen is StagedScreenData => "stages" in screen;

/** How a module goes from screen to screen: who skips what, and where a struggling learner is sent back to. */
export type FlowData = {
  /** Screen → the screens that must all have been answered right the first time, with no hint, for it to be skipped. */
  skips: Record<string, number[]>;
  /** Screen → the screen that taught the idea (sent there once), or a `$ref` to a function that picks it. */
  detours: Record<string, number | RefNode>;
};

/** How a module's screens are drawn where modules differ (each is a choice of the module's design). */
export type ModuleLook = {
  /** `centred`: Hex and the words as one centred group (default); `side`: the words at the left, Hex at the right. */
  sheet?: "centred" | "side";
  /** Rows of answers: the space between them (px, default 6) and the size of their words (px, default 14). */
  rows?: { gap?: number; fontSize?: number };
  /** A line longer than this many letters goes on a card in place of Hex's bubble. */
  cardLine?: number;
  /** Hex's bubble width by the length of his line: the first entry whose `upTo` is not less than it. */
  bubble?: { upTo?: number; width: number }[];
  /** How far (px) the body rises when a result sheet comes up over tiles of answers (default 180) or object cards (default 150). */
  tileLift?: number;
  /** Interactions stand at the top of their room, instead of in the middle. */
  topAligned?: boolean;
};

export type ModuleData = {
  /** The module's id: `datatypes`, `operators`, `conditions`. */
  id: string;
  title: string;
  /** Its place on the level path. */
  level: number;
  /** How many screens: the progress bar's total. */
  steps: number;
  flow: FlowData;
  /** The screen the gem popup of a `finish: "gem"` screen leads to. */
  afterGem?: number;
  look?: ModuleLook;
  /** A picture behind every screen of the module, in place of the pale default. */
  scene?: Json;
  screens: Record<string, ScreenData>;
};

/** What the runner hands to a node when it draws it: `$ctx` paths are looked up here. */
export type NodeContext = Record<string, unknown>;
