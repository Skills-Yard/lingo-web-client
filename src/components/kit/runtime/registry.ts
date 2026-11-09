import { Fragment } from "react";
import * as conditionsFlow from "@/components/conditions/conditions";
import * as conditionsHelpers from "@/components/kit/content/from-conditions/helpers";
import * as conditionsInteractions from "@/components/kit/content/from-conditions/interactions";
import * as conditionsNext from "@/components/conditions/NextScreen";
import * as conditionsVisuals from "@/components/kit/content/from-conditions/visuals";
import * as datatypesFlow from "@/components/datatypes/datatypes";
import * as datatypesScore from "@/components/datatypes/datatypesScore";
import * as datatypesGroup from "@/components/kit/content/from-datatypes/GroupStage";
import * as datatypesTour from "@/components/kit/content/from-datatypes/GroupTourStage";
import * as datatypesInteractions from "@/components/kit/content/from-datatypes/interactions";
import * as datatypesRecap from "@/components/datatypes/RecapScreen";
import * as datatypesVisuals from "@/components/kit/content/from-datatypes/visuals";
import * as operatorsFlip from "@/components/kit/content/from-operators/FlipCarousel";
import * as operatorsHeaders from "@/components/kit/content/from-operators/headers";
import * as operatorsHelpers from "@/components/kit/content/from-operators/helpers";
import * as operatorsInteractions from "@/components/kit/content/from-operators/interactions";
import * as operatorsCards from "@/components/kit/content/from-operators/OperatorCardsStage";
import * as operatorsFlow from "@/components/operators/operators";
import * as operatorsRecap from "@/components/operators/RecapScreen";
import * as operatorsSituations from "@/components/kit/content/from-operators/SituationsStage";
import * as operatorsVisuals from "@/components/kit/content/from-operators/visuals";
import * as variableFlow from "@/components/variable/variable";
import * as variableInteractions from "@/components/kit/content/from-variable/interactions";
import * as variablePlan from "@/components/variable/PlanAppScreen";
import * as variableRecap from "@/components/variable/RecapScreen";
import * as variableScore from "@/components/variable/variableScore";
import * as variableScreenVisuals from "@/components/kit/content/from-variable/screenVisuals";
import * as variableThirsty from "@/components/variable/ThirstyScreen";
import * as variableTrek from "@/components/variable/TrekScreen";
import * as variableVisuals from "@/components/kit/content/from-variable/visuals";
import { KIT } from "../registry";

/**
 * The content components (the pictures and interactions inside screens) as the kit's own: named by what
 * they are (`ExpressionStage` is `kit:expression-stage`), whichever module's screens first needed them.
 * The keys are only where each file came from, to tell two components of the same name apart.
 */
const CONTENT: Record<string, readonly Record<string, unknown>[]> = {
  datatypes: [datatypesInteractions, datatypesVisuals, datatypesGroup, datatypesTour],
  operators: [operatorsInteractions, operatorsVisuals, operatorsFlip, operatorsCards, operatorsSituations, operatorsHelpers, operatorsHeaders],
  conditions: [conditionsInteractions, conditionsVisuals, conditionsHelpers],
  variable: [variableInteractions, variableVisuals, variableScreenVisuals],
};

/** What is still a module's own: the functions that decide where the learner goes (flow, score) and the whole screens that are not built from kit parts yet. */
const MODULE_OWN: Record<string, readonly Record<string, unknown>[]> = {
  datatypes: [datatypesRecap, datatypesScore, datatypesFlow],
  operators: [operatorsRecap, operatorsFlow],
  conditions: [conditionsNext, conditionsFlow],
  variable: [variableTrek, variableThirsty, variablePlan, variableRecap, variableScore, variableFlow],
};

const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

/** A component that is an object (`memo`, `forwardRef`) rather than a function. */
const isExotic = (value: unknown) => typeof value === "object" && value !== null && "$$typeof" in value;

const byName = new Map<string, unknown>();
const byValue = new Map<unknown, string>();

const add = (name: string, value: unknown) => {
  if (!byName.has(name)) byName.set(name, value);
  if (!byValue.has(value)) byValue.set(value, name);
};

for (const [name, component] of Object.entries(KIT)) add(`kit:${name}`, component);
/** Names two different components would share: the later one is suffixed with where it came from. They are the designs still to merge. */
const duplicates: string[] = [];

for (const [origin, spaces] of Object.entries(CONTENT)) {
  for (const space of spaces) {
    for (const [exported, value] of Object.entries(space)) {
      if (typeof value !== "function" && !isExotic(value)) continue;
      let name = `kit:${kebab(exported)}`;
      if (byName.has(name)) {
        if (byName.get(name) === value) continue;
        name = `${name}-${origin}`;
        duplicates.push(name);
      }
      add(name, value);
    }
  }
}
for (const [module, spaces] of Object.entries(MODULE_OWN)) {
  for (const space of spaces) {
    for (const [exported, value] of Object.entries(space)) {
      if (typeof value === "function" || isExotic(value)) add(`${module}.${exported}`, value);
    }
  }
}

export const duplicateNames = () => [...duplicates];

/** The component, function or html tag a data name stands for (`undefined` if nothing is registered under it). */
export function resolveName(name: string): unknown {
  if (name === "#fragment") return Fragment;
  if (name.includes(":") || name.includes(".")) return byName.get(name);
  return name;
}

/** The data name of a component or function of the app, if it has one. */
export const nameOf = (value: unknown): string | undefined => byValue.get(value);

/** Every name that can be used (for the data format's documentation and the exporter's report). */
export const registeredNames = (): string[] => [...byName.keys()];
