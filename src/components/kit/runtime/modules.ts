import { createAdaptiveFlow } from "@/lib/adaptiveFlow";
import { answeredClean as conditionsClean, conditionsAccuracy, noteAnswer as conditionsNote, noteStruggle as conditionsStruggle, struggled as conditionsStruggled } from "@/components/conditions/conditionsScore";
import { cleanRight as datatypesClean, datatypesAccuracy, noteAnswer as datatypesNote, noteStruggle as datatypesStruggle, struggled as datatypesStruggled } from "@/components/datatypes/datatypesScore";
import { answeredClean as operatorsClean, noteAnswer as operatorsNote, noteStruggle as operatorsStruggle, operatorsAccuracy, struggled as operatorsStruggled } from "@/components/operators/operatorsScore";
import { cleanRight as variableClean, noteAnswer as variableNote, noteStruggle as variableStruggle, struggled as variableStruggled, variableAccuracy } from "@/components/variable/variableScore";
import conditionsData from "@/data/modules/conditions.json";
import datatypesData from "@/data/modules/datatypes.json";
import operatorsData from "@/data/modules/operators.json";
import variableData from "@/data/modules/variable.json";
import { resolveName } from "./registry";
import type { ModuleData } from "./schema";

/**
 * What a module needs besides its data file: where its score is kept, and how its interactions are told
 * about Hex's line. (The data file holds the screens and the flow; these are the parts that are code.)
 */
type Scoring = {
  noteAnswer: (step: number, stage: number, clean: boolean) => void;
  noteStruggle: (step: number, kind: "miss" | "hint") => void;
  struggled: (step: number) => boolean;
  /** Right the first time and without the hint (`skips` is the module's own, for a screen that counts as answered because it was skipped). */
  cleanRight: (step: number, skips: ModuleData["flow"]["skips"]) => boolean;
  accuracy: () => number;
};

/**
 * What `hexSpoken` means to the module's interactions: `spoken` Hex has finished his line; `typed` that, or there is
 * no line to wait for; `always` it is never waited for.
 */
type HexMode = "spoken" | "typed" | "always";

const recursive = (clean: (step: number) => boolean) => {
  const check = (step: number, skips: ModuleData["flow"]["skips"]): boolean => clean(step) || (skips[step]?.every((other) => check(other, skips)) ?? false);
  return check;
};

const SOURCES: Record<string, { data: ModuleData; scoring: Scoring; hex: HexMode }> = {
  datatypes: {
    data: datatypesData as unknown as ModuleData,
    scoring: { noteAnswer: datatypesNote, noteStruggle: datatypesStruggle, struggled: datatypesStruggled, cleanRight: (step) => datatypesClean(step), accuracy: datatypesAccuracy },
    hex: "spoken",
  },
  operators: {
    data: operatorsData as unknown as ModuleData,
    scoring: { noteAnswer: operatorsNote, noteStruggle: operatorsStruggle, struggled: operatorsStruggled, cleanRight: recursive(operatorsClean), accuracy: operatorsAccuracy },
    hex: "typed",
  },
  conditions: {
    data: conditionsData as unknown as ModuleData,
    scoring: { noteAnswer: conditionsNote, noteStruggle: conditionsStruggle, struggled: conditionsStruggled, cleanRight: recursive(conditionsClean), accuracy: conditionsAccuracy },
    hex: "always",
  },
  variable: {
    data: variableData as unknown as ModuleData,
    scoring: { noteAnswer: variableNote, noteStruggle: variableStruggle, struggled: variableStruggled, cleanRight: (step) => variableClean(step), accuracy: variableAccuracy },
    hex: "always",
  },
};

/** Where a screen of a module played from its data lives. */
export const playHref = (id: string, step: number | string) => `/kit/play/${id}?step=${step}`;

export type PlayableModule = {
  data: ModuleData;
  hex: HexMode;
  scoring: Scoring;
  flow: { next: (step: number) => string; previous: (step: number) => string; reset: () => void };
  href: (step: number | "complete") => string;
};

const built = new Map<string, PlayableModule>();

/** A module ready to play: its data, and the flow its data describes (skips and detours) joined to where its score is kept. */
export function playable(id: string): PlayableModule | undefined {
  const cached = built.get(id);
  if (cached) return cached;
  const source = SOURCES[id];
  if (!source) return undefined;
  const { data, scoring, hex } = source;
  const skips = Object.fromEntries(Object.entries(data.flow.skips).map(([step, list]) => [Number(step), list]));
  const detours = Object.fromEntries(
    Object.entries(data.flow.detours).map(([step, rule]) => [Number(step), typeof rule === "number" ? rule : (resolveName(rule.$ref) as () => number | undefined)]),
  );
  const href = (step: number | "complete") => playHref(id, step);
  const flow = createAdaptiveFlow({
    steps: data.steps,
    hrefOf: href,
    home: "/kit",
    skips,
    detours,
    cleanRight: (step) => scoring.cleanRight(step, data.flow.skips),
    struggled: scoring.struggled,
    // The same places as the module's own flow, so both ways through a module share what the learner has done.
    detourKey: `lingo.${id}-detour`,
    detouredKey: `lingo.${id}-detoured`,
  });
  const mod: PlayableModule = { data, hex, scoring, flow, href };
  built.set(id, mod);
  return mod;
}

export const playableIds = () => Object.keys(SOURCES);
