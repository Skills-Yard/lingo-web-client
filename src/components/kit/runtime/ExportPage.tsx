"use client";

import { useState } from "react";
import { STEP as CONDITIONS_STEP, CONDITIONS_LEVEL, CONDITIONS_STEPS, DETOURS as CONDITIONS_DETOURS, SKIPS as CONDITIONS_SKIPS } from "@/components/conditions/conditions";
import { NextScreen } from "@/components/conditions/NextScreen";
import { SCREENS as CONDITIONS_SCREENS } from "@/components/conditions/conditionsScreens";
import { STEP as DATATYPES_STEP, DATATYPES_LEVEL, DATATYPES_STEPS, DETOURS as DATATYPES_DETOURS, SKIPS as DATATYPES_SKIPS } from "@/components/datatypes/datatypes";
import { SCREENS as DATATYPES_SCREENS } from "@/components/datatypes/datatypesScreens";
import { RecapScreen as DatatypesRecap } from "@/components/datatypes/RecapScreen";
import { STEP as OPERATORS_STEP, OPERATORS_LEVEL, OPERATORS_STEPS, DETOURS as OPERATORS_DETOURS, SKIPS as OPERATORS_SKIPS } from "@/components/operators/operators";
import { SCREENS as OPERATORS_SCREENS } from "@/components/operators/operatorsScreens";
import { RecapScreen as OperatorsRecap } from "@/components/operators/RecapScreen";
import { DRINK_HINT_STEPS, sceneOf, STEP as VARIABLE_STEP, DETOURS as VARIABLE_DETOURS, SKIPS as VARIABLE_SKIPS, VARIABLE_LEVEL, VARIABLE_STEPS } from "@/components/variable/variable";
import { PlanAppScreen } from "@/components/variable/PlanAppScreen";
import { RecapScreen as VariableRecap } from "@/components/variable/RecapScreen";
import { ThirstyScreen } from "@/components/variable/ThirstyScreen";
import { TrekScreen } from "@/components/variable/TrekScreen";
import { SCREENS as VARIABLE_SCREENS } from "@/components/variable/variableScreens";
import { readModule, type Issue, type ModuleSource } from "./extract";
import { duplicateNames } from "./registry";
import type { ModuleData, SceneData } from "./schema";

/**
 * The scene behind a Variable screen and what plays on it, as the module's own runner (`VariableQuizScreen`) decides
 * them in code: the trail says all three of its values on every screen (the file keeps what it was last given),
 * cheers a right answer and, on the first screens, points at the drink after a wrong one; the labelled bottles
 * always show their names and are shuffled for each try.
 */
const variableScene = (step: number): SceneData => {
  const name = sceneOf(step);
  if (name === "trek") return { name, values: { thirsty: false, noWater: step === VARIABLE_STEP.noWater, thinking: false }, onRight: "cheer", ...(DRINK_HINT_STEPS.includes(step) ? { onWrong: "drinkHint" } : {}) };
  if (name === "names") return { name, values: { showLabels: true }, onTry: "shuffle" };
  return { name };
};

const SOURCES: ModuleSource[] = [
  {
    id: "datatypes",
    title: "Data Types",
    level: DATATYPES_LEVEL,
    steps: DATATYPES_STEPS,
    screens: DATATYPES_SCREENS,
    skips: DATATYPES_SKIPS,
    detours: DATATYPES_DETOURS,
    components: { [DATATYPES_STEP.recap]: DatatypesRecap },
    // Hex's bubble is wide for any line of more than 30 letters (the module's own runner: `bubbleSize` in `DataTypesScreen`).
    look: { bubble: [{ upTo: 30, width: 190 }, { width: 248 }] },
  },
  {
    id: "operators",
    title: "Operators",
    level: OPERATORS_LEVEL,
    steps: OPERATORS_STEPS,
    screens: OPERATORS_SCREENS,
    skips: OPERATORS_SKIPS,
    detours: OPERATORS_DETOURS,
    components: { [OPERATORS_STEP.decision]: OperatorsRecap },
  },
  {
    id: "conditions",
    title: "Conditions",
    level: CONDITIONS_LEVEL,
    steps: CONDITIONS_STEPS,
    screens: CONDITIONS_SCREENS,
    skips: CONDITIONS_SKIPS,
    detours: CONDITIONS_DETOURS,
    components: { [CONDITIONS_STEP.next]: NextScreen },
    afterGem: CONDITIONS_STEP.next,
  },
  {
    id: "variable",
    title: "Variable",
    level: VARIABLE_LEVEL,
    steps: VARIABLE_STEPS,
    screens: VARIABLE_SCREENS,
    skips: VARIABLE_SKIPS,
    detours: VARIABLE_DETOURS,
    components: { [VARIABLE_STEP.trek]: TrekScreen, [VARIABLE_STEP.thirsty]: ThirstyScreen, [VARIABLE_STEP.plan]: PlanAppScreen, [VARIABLE_STEP.recap]: VariableRecap },
    // Each screen stands on a Rive scene (the trail, the bottle, the shop...), answers in rows or object cards, and shows the result sheet with the words at the left.
    sceneFor: variableScene,
    apiKeys: ["slip", "done", "finished"],
    quizLook: { grid: "objects", shortCards: 12 },
    look: {
      sheet: "side",
      // The usual rows, a little further apart and with larger words.
      rows: { gap: 10, fontSize: 16 },
      cardLine: 120,
      bubble: [{ upTo: 44, width: 190 }, { width: 240 }],
      tileLift: 150,
      topAligned: true,
    },
  },
];

type Result = { data: ModuleData; issues: Issue[] };

/** Every component node of a piece of data (anything with a `$` name). */
const componentNames = (node: unknown, into: string[] = []): string[] => {
  if (Array.isArray(node)) node.forEach((item) => componentNames(item, into));
  else if (typeof node === "object" && node !== null) {
    const record = node as Record<string, unknown>;
    if (typeof record.$ === "string") into.push(record.$);
    Object.values(record).forEach((item) => componentNames(item, into));
  }
  return into;
};

/**
 * How much of the data is built from the kit: every node should be `kit:*`. What is not is a module's own
 * (a whole screen written in code), and the kit's content components used on one screen only are the
 * one-offs still to be merged into something general.
 */
function coverage(results: Record<string, Result>) {
  const perModule = Object.entries(results).map(([id, { data }]) => {
    const names = componentNames(data.screens);
    const own = names.filter((name) => !name.startsWith("kit:") && name.includes("."));
    return { id, total: names.length, kit: names.length - own.length, own: [...new Set(own)] };
  });
  const screensUsing = new Map<string, Set<string>>();
  for (const [id, { data }] of Object.entries(results)) {
    for (const [step, screen] of Object.entries(data.screens)) {
      for (const name of componentNames(screen)) if (name.startsWith("kit:")) (screensUsing.get(name) ?? screensUsing.set(name, new Set()).get(name)!).add(`${id}:${step}`);
    }
  }
  const oneOffs = [...screensUsing].filter(([, used]) => used.size === 1).map(([name]) => name);
  return { perModule, oneOffs };
}

declare global {
  interface Window {
    __kitExport?: Record<string, Result>;
  }
}

/**
 * `/kit/export` (development only): reads the modules' screens as they are written in code and
 * writes them as data files (`src/data/modules/<id>.json`). Run it again after changing a screen in code.
 */
export function ExportPage() {
  const [results, setResults] = useState<Record<string, Result> | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});

  const read = () => {
    const next: Record<string, Result> = {};
    for (const source of SOURCES) next[source.id] = readModule(source);
    window.__kitExport = next;
    setResults(next);
    setSaved({});
  };

  const save = async (id: string) => {
    if (!results) return;
    const response = await fetch("/kit/export/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, data: results[id].data }) });
    const message = response.ok ? `written (${((await response.json()) as { bytes: number }).bytes} bytes)` : `failed: ${await response.text()}`;
    setSaved((now) => ({ ...now, [id]: message }));
  };

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-5 py-8 text-[#444444] dark:text-white">
      <h1 className="text-[28px] font-semibold">Export screens as data</h1>
      <div>
        <button type="button" onClick={read} className="cursor-pointer rounded-md border border-[#08A4AD] px-3 py-1.5 text-[13px] font-bold text-[#08A4AD]">
          Read the screens from code
        </button>
      </div>
      {results && (
        <section className="flex flex-col gap-1 rounded-xl border border-[#08A4AD]/50 p-4 text-[13px]">
          <h2 className="text-[18px] font-semibold">Kit coverage</h2>
          {(() => {
            const { perModule, oneOffs } = coverage(results);
            return (
              <>
                {perModule.map(({ id, total, kit, own }) => (
                  <p key={id}>
                    <b>{id}</b>: {kit} of {total} component nodes are kit components{own.length ? ` · module's own: ${own.join(", ")}` : ""}
                  </p>
                ))}
                <p>
                  <b>Used on one screen only ({oneOffs.length}), to merge into general components:</b> {oneOffs.join(", ") || "none"}
                </p>
                <p>
                  <b>Same name, different component ({duplicateNames().length}), to merge:</b> {duplicateNames().join(", ") || "none"}
                </p>
              </>
            );
          })()}
        </section>
      )}
      {results &&
        SOURCES.map(({ id, title }) => {
          const { data, issues } = results[id];
          const stages = Object.values(data.screens).reduce((sum, screen) => sum + ("stages" in screen ? screen.stages.length : 0), 0);
          return (
            <section key={id} data-module={id} className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/15">
              <h2 className="text-[20px] font-semibold">
                {title} <span className="text-[14px] font-normal text-[#6B7480]">— {Object.keys(data.screens).length} screens, {stages} stages, {issues.length} issues</span>
              </h2>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => save(id)} className="cursor-pointer rounded-md bg-[#08A4AD] px-3 py-1.5 text-[13px] font-bold text-white">
                  Write src/data/modules/{id}.json
                </button>
                <span className="text-[13px]">{saved[id]}</span>
              </div>
              {issues.length > 0 && (
                <ul className="list-disc pl-5 text-[13px] text-[#D42421]">
                  {issues.map((issue, index) => (
                    <li key={index}>
                      <b>{issue.where}</b>: {issue.problem}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
    </main>
  );
}
