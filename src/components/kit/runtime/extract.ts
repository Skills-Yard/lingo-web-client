import { Fragment, isValidElement, type ReactElement } from "react";
import { TINT } from "../tokens";
import { nameOf } from "./registry";
import { hydrate } from "./hydrate";
import type { DataOption, FlowData, Json, ModuleData, ModuleLook, NodeContext, OptionData, ScreenData, StageData } from "./schema";

/**
 * Reads the screens the modules define in code and writes them out as data (`schema.ts`). Used by
 * the `/kit/export` page. A screen's pictures and interactions are React elements and functions in
 * code; they come out as named component nodes, with what they depend on (`attempt`, `api`) left as `$ctx` markers.
 */

export type Issue = { where: string; problem: string };

const SENTINEL = Symbol("ctx-path");

/**
 * A stand-in for a value the runner will supply: any property read from it is itself a `$ctx` marker,
 * except the ones in `fixed`, which hold the literal value they are given.
 */
function ctxProxy(path: string, fixed: Record<string, unknown> = {}, keys: readonly string[] = []): unknown {
  return new Proxy(
    {},
    {
      get(_target, key) {
        if (key === SENTINEL) return path;
        if (typeof key === "symbol") return undefined;
        if (key in fixed) return fixed[key];
        return { $ctx: path ? `${path}.${key}` : key };
      },
      // `keys` are what spreading it (`{...api}`) gives.
      ownKeys: () => [...keys],
      getOwnPropertyDescriptor: (_target, key) => (typeof key === "string" && keys.includes(key) ? { enumerable: true, configurable: true, writable: true, value: fixed[key] ?? { $ctx: path ? `${path}.${key}` : key } } : undefined),
    },
  );
}

const pathOf = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  try {
    const path = (value as Record<symbol, unknown>)[SENTINEL];
    return typeof path === "string" ? path : undefined;
  } catch {
    return undefined;
  }
};

/** Values a function is tried with, to see whether what it draws depends on them in ways data cannot say. */
const ARG_SAMPLES: readonly unknown[] = [undefined, null, true, false, 0, 1, "x", {}];

const describe = (sample: unknown) => {
  try {
    return JSON.stringify(sample, (_key, value) => (typeof value === "function" ? "[fn]" : value)) ?? "undefined";
  } catch {
    return String(sample);
  }
};

/** A boolean input of something drawn, and where the runner finds it (`$ctx` path). */
type Flag = { name: string; path: string };

/** Something a screen draws from values the runner supplies (a picture, an interaction, a function). */
type Subject = {
  /** Draws it with stand-in inputs: the data then holds `$ctx` markers. */
  withStandIns: () => unknown;
  /** Draws it the way the original code does, for a sample of inputs. */
  original: (sample: unknown) => unknown;
  /** Draws it with literal values for its boolean inputs (and stand-ins for the rest). */
  withFlags?: (values: Record<string, boolean>) => unknown;
  flags: readonly Flag[];
  samples: readonly unknown[];
  contextOf: (sample: unknown) => NodeContext;
  stubsOf?: (sample: unknown) => Map<unknown, string>;
};

class Reader {
  issues: Issue[] = [];
  private where = "";

  /**
   * `stubs`: values that stand for something the runner supplies (a sample `api`, its callbacks), by
   * their `$ctx` path. `shallow`: a reader used only to compare, which does not check the functions it meets.
   */
  constructor(
    private stubs: Map<unknown, string> = new Map(),
    private shallow = false,
  ) {}

  at<T>(where: string, work: () => T): T {
    const before = this.where;
    this.where = where;
    try {
      return work();
    } finally {
      this.where = before;
    }
  }

  private issue(problem: string) {
    this.issues.push({ where: this.where, problem });
  }

  /**
   * Draws the data again with each sample and compares it with what the original code draws for the
   * same sample. The first difference is returned as a message (`null`: they agree).
   */
  private check(subject: Subject, tree: Json): string | null {
    for (const sample of subject.samples) {
      const probe = new Reader(subject.stubsOf?.(sample), true);
      let expected: Json;
      try {
        expected = probe.node(subject.original(sample));
      } catch {
        continue;
      }
      let actual: Json;
      try {
        actual = probe.node(hydrate(tree, subject.contextOf(sample)));
      } catch (error) {
        return `the data cannot be drawn again: ${(error as Error).message}`;
      }
      if (JSON.stringify(expected) !== JSON.stringify(actual)) return `the data does not reproduce the screen when given ${describe(sample)}`;
    }
    return null;
  }

  /**
   * Writes something a screen draws as data. It is read with stand-in inputs first (compact); if that
   * does not reproduce the original code for every sample, it is read once for each combination of its boolean
   * inputs and written as a `$by` table over the ones that matter. If even that falls short, the issue is reported.
   */
  read(where: string, subject: Subject): Json {
    const scratch = new Reader(undefined, this.shallow);
    let tree: Json = null;
    let failure: string | null = null;
    try {
      tree = scratch.at(where, () => scratch.node(subject.withStandIns()));
    } catch (error) {
      failure = `could not be read: ${(error as Error).message}`;
    }
    if (!failure && scratch.issues.length === 0) {
      failure = this.shallow ? null : this.check(subject, tree);
      if (!failure) return tree;
    }
    if (subject.withFlags && subject.flags.length > 0 && !this.shallow) {
      let table: Json | null = null;
      try {
        table = this.tabulate(where, subject, subject.withFlags);
      } catch (error) {
        this.issues.push({ where, problem: `its code works on a value that is not a plain yes/no (${(error as Error).message}). Move that work into a named component or function (see registry.ts)` });
        return tree;
      }
      const problem = this.check(subject, table);
      if (problem) this.issues.push({ where, problem: `${problem}: its code decides something from a value that is not a plain yes/no. Move the decision into a named component or function (see registry.ts)` });
      return table;
    }
    this.issues.push(...scratch.issues);
    if (failure) this.issues.push({ where, problem: failure });
    return tree;
  }

  /** Draws it for every combination of its boolean inputs and keeps the ones that change the result. */
  private tabulate(where: string, subject: Subject, draw: (values: Record<string, boolean>) => unknown): Json {
    const count = subject.flags.length;
    const outputs: Json[] = [];
    for (let bits = 0; bits < 1 << count; bits += 1) {
      const values = Object.fromEntries(subject.flags.map((flag, index) => [flag.name, Boolean(bits & (1 << index))]));
      outputs.push(this.at(where, () => this.node(draw(values))));
    }
    const text = outputs.map((output) => JSON.stringify(output));
    const matters = subject.flags.map((_, index) => text.some((_, bits) => text[bits] !== text[bits ^ (1 << index)]));
    const keep = matters.flatMap((does, index) => (does ? [index] : []));
    if (keep.length === 0) return outputs[0];
    const cases: Record<string, Json> = {};
    for (let choice = 0; choice < 1 << keep.length; choice += 1) {
      const bits = keep.reduce((sum, flagIndex, place) => sum | (choice & (1 << place) ? 1 << flagIndex : 0), 0);
      cases[keep.map((_, place) => String(Boolean(choice & (1 << place)))).join(",")] = outputs[bits];
    }
    return { $by: keep.map((index) => subject.flags[index].path), cases };
  }

  /** Anything on a screen, as data. */
  node(value: unknown, depth = 0): Json {
    if (depth > 60) {
      this.issue("nested too deep");
      return null;
    }
    if (value === null || value === undefined) return null;
    if (typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) this.issue(`a number that is ${value}: something used a stand-in value in a calculation`);
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "function") {
      const stub = this.stubs.get(value);
      return stub !== undefined ? { $ctx: stub } : this.func(value as (...args: unknown[]) => unknown);
    }
    if (typeof value !== "object") {
      this.issue(`a ${typeof value} cannot be written as data`);
      return null;
    }
    const stub = this.stubs.get(value);
    if (stub !== undefined) return { $ctx: stub };
    const path = pathOf(value);
    if (path !== undefined) return { $ctx: path };
    if (Array.isArray(value)) return value.map((item) => this.node(item, depth + 1));
    if (isValidElement(value)) return this.element(value, depth);
    const out: Record<string, Json> = {};
    for (const [name, item] of Object.entries(value)) {
      if (item === undefined) continue;
      if (typeof item === "string" && item.includes("[object")) this.issue(`"${name}" holds "${item}": a stand-in value was turned into text`);
      out[name] = this.node(item, depth + 1);
    }
    return out;
  }

  /** A function: a named one of the app, or one that makes a node from its arguments. */
  private func(fn: (...args: unknown[]) => unknown): Json {
    const name = nameOf(fn);
    if (name) return { $ref: name };
    const arity = fn.length;
    const label = fn.name || "anonymous";
    const standIns = () => fn(...Array.from({ length: arity }, (_, index) => ctxProxy(`arg${index}`)));
    // A function that makes nothing is a callback: it has to be named (exported and registered) to be in the data.
    try {
      if (standIns() === undefined) {
        this.issue(`a function that makes nothing (${label}); name it in registry.ts if it is a callback`);
        return null;
      }
    } catch {
      // It cannot be called with stand-ins; `read` tries it with real values.
    }
    const flags: Flag[] = Array.from({ length: Math.min(arity, 2) }, (_, index) => ({ name: `arg${index}`, path: `arg${index}` }));
    const body = this.read(`${this.where} (function ${label})`, {
      withStandIns: standIns,
      original: (args) => fn(...(args as unknown[])),
      withFlags: arity <= 2 ? (values) => fn(...flags.map((flag) => values[flag.name])) : undefined,
      flags: arity <= 2 ? flags : [],
      samples: arity === 0 ? [[]] : arity === 1 ? ARG_SAMPLES.map((sample) => [sample]) : ARG_SAMPLES.flatMap((first) => ARG_SAMPLES.map((second) => [first, second])),
      contextOf: (args) => Object.fromEntries((args as unknown[]).map((arg, index) => [`arg${index}`, arg])),
    });
    return { $fn: { arity, body } };
  }

  private element(el: ReactElement, depth: number): Json {
    const { type } = el;
    const props = { ...(el.props as Record<string, unknown>) };
    const name = type === Fragment ? "#fragment" : typeof type === "string" ? type : nameOf(type);
    if (!name) {
      // A small pure component of a screen file (not exported): what it draws takes its place.
      if (typeof type === "function") {
        try {
          return this.node((type as (p: unknown) => unknown)(props), depth + 1);
        } catch {
          this.issue(`component "${(type as { name?: string }).name || "anonymous"}" is not registered and cannot be expanded (it uses hooks): export it and add its file to registry.ts`);
          return null;
        }
      }
      this.issue("a component of an unknown kind (not a function, not a tag)");
      return null;
    }
    delete props.ref;
    const rawChildren = props.children;
    delete props.children;
    const out: { $: string; props?: Record<string, Json>; children?: Json[] } = { $: name };
    const entries = Object.entries(props).filter(([, item]) => item !== undefined);
    if (entries.length) out.props = Object.fromEntries(entries.map(([key, item]) => [key, this.node(item, depth + 1)]));
    if (rawChildren !== undefined && rawChildren !== null) out.children = (Array.isArray(rawChildren) ? rawChildren : [rawChildren]).map((child) => this.node(child, depth + 1));
    return out;
  }
}

/** A card colour given as classes, as the kit's name for it (or the classes, if it is not one of the kit's). */
const TINT_BY_CLASS = new Map<string, string>(Object.entries(TINT).map(([name, classes]) => [classes, name]));

type AnyOption = { id: string; text: string; icon?: string; tint?: string; sub?: string; emoji?: string; node?: unknown };

const toOption = (reader: Reader, option: AnyOption, where: string): DataOption => {
  const out: DataOption = { id: option.id, text: option.text };
  if (option.icon) out.image = option.icon;
  if (option.sub) out.sub = option.sub;
  if (option.emoji) out.emoji = option.emoji;
  if (option.node !== undefined) out.node = reader.at(`${where} option ${option.id}`, () => reader.node(option.node));
  if (option.tint) out.tint = (TINT_BY_CLASS.get(option.tint) ?? option.tint) as OptionData["tint"];
  return out;
};

type AnyStage = { kind: "quiz" | "interaction"; [key: string]: unknown };
export type ScreenLike = { step: number; title: string; titleSize?: number; backdrop?: unknown; finish?: "gem"; stages: readonly AnyStage[] };

/** What a question's picture can be given: tries, picks, whether it is checked, whether Hex has spoken. */
const VISUAL_SAMPLES: readonly unknown[] = [0, 2].flatMap((attempt) =>
  [null, "1"].flatMap((picked) => [false, true].flatMap((checked) => [false, true].flatMap((correct) => [false, true].map((hexSpoken) => ({ attempt, picked, checked, correct, hexSpoken }))))),
);

const noop = () => {};

/** Everything an interaction can be given: its callbacks, and whether it has finished and whether Hex has spoken. */
const API_KEYS = ["slip", "done", "dismissHex", "takeContinue", "holdButton", "next", "finished", "hexSpoken", "lineTyped"] as const;

/** The samples of what an interaction is given (only the parts a module hands over, if it says which). */
const apiSamples = (keys: readonly string[]): readonly Record<string, unknown>[] =>
  [false, true].flatMap((hexSpoken) =>
    [false, true].map((finished) => {
      const all: Record<string, unknown> = { slip: noop, done: noop, dismissHex: noop, takeContinue: noop, holdButton: noop, next: noop, finished, hexSpoken, lineTyped: hexSpoken };
      return Object.fromEntries(Object.entries(all).filter(([key]) => keys.includes(key)));
    }),
  );

const stubsOfApi = (api: unknown) => {
  const stubs = new Map<unknown, string>([[api, "api"]]);
  for (const [name, value] of Object.entries(api as Record<string, unknown>)) if (typeof value === "function") stubs.set(value, `api.${name}`);
  return stubs;
};

function readStage(reader: Reader, stage: AnyStage, where: string, apiKeys: readonly string[]): StageData {
  const out: Record<string, Json> = { kind: stage.kind };
  for (const [key, value] of Object.entries(stage)) {
    if (key === "kind" || value === undefined) continue;
    if (key === "visual" && typeof value === "function") {
      const make = value as (ctx: unknown) => unknown;
      out.visual = reader.read(`${where} visual`, {
        withStandIns: () => make(ctxProxy("")),
        original: make,
        withFlags: (values) => make({ attempt: { $ctx: "attempt" }, picked: { $ctx: "picked" }, ...values }),
        flags: [{ name: "checked", path: "checked" }, { name: "correct", path: "correct" }, { name: "hexSpoken", path: "hexSpoken" }],
        samples: VISUAL_SAMPLES,
        contextOf: (ctx) => ctx as NodeContext,
      });
    } else if (key === "render" && typeof value === "function") {
      const make = value as (api: unknown) => unknown;
      out.content = reader.read(`${where} content`, {
        withStandIns: () => make(ctxProxy("api", {}, apiKeys)),
        original: make,
        withFlags: (values) => make(ctxProxy("api", values, apiKeys)),
        flags: [{ name: "finished", path: "api.finished" }, { name: "hexSpoken", path: "api.hexSpoken" }, { name: "lineTyped", path: "api.lineTyped" }].filter((flag) => apiKeys.includes(flag.name)),
        samples: apiSamples(apiKeys),
        contextOf: (api) => ({ api }),
        stubsOf: stubsOfApi,
      });
    } else if (key === "options") {
      out.options = (value as AnyOption[]).map((option) => toOption(reader, option, where)) as unknown as Json;
    } else if (typeof value === "function") {
      reader.at(where, () => reader.node(value));
    } else {
      out[key] = reader.at(`${where} ${key}`, () => reader.node(value));
    }
  }
  return out as unknown as StageData;
}

function readScreen(reader: Reader, screen: ScreenLike, label: string, apiKeys: readonly string[]): ScreenData {
  const out: Record<string, Json> = { step: screen.step, title: screen.title };
  if (screen.titleSize !== undefined) out.titleSize = screen.titleSize;
  if (screen.finish) out.finish = screen.finish;
  if (screen.backdrop !== undefined) out.backdrop = reader.at(`${label} backdrop`, () => reader.node(screen.backdrop));
  out.stages = screen.stages.map((stage, index) => readStage(reader, stage, `${label} stage ${index + 1}`, apiKeys)) as unknown as Json;
  return out as unknown as ScreenData;
}

export type ModuleSource = {
  id: string;
  title: string;
  level: number;
  steps: number;
  screens: Readonly<Record<number, ScreenLike>>;
  skips: Readonly<Record<number, readonly number[]>>;
  detours: Readonly<Record<number, number | (() => number | undefined)>>;
  /** Screens that are one whole component: step → the component. */
  components: Readonly<Record<number, unknown>>;
  afterGem?: number;
  look?: ModuleLook;
  /** A picture behind every screen of the module. */
  scene?: unknown;
  /** What an interaction of the module is given (default: everything the runner can give). */
  apiKeys?: readonly string[];
};

export function readModule(source: ModuleSource): { data: ModuleData; issues: Issue[] } {
  const reader = new Reader();
  const screens: Record<string, ScreenData> = {};
  for (const [step, screen] of Object.entries(source.screens)) screens[step] = readScreen(reader, screen, `${source.id} ${step}`, source.apiKeys ?? API_KEYS);
  for (const [step, component] of Object.entries(source.components)) {
    const name = nameOf(component);
    if (!name) reader.issues.push({ where: `${source.id} ${step}`, problem: "a whole-screen component that is not registered" });
    else screens[step] = { step: Number(step), component: name };
  }
  const flow: FlowData = { skips: {}, detours: {} };
  for (const [step, list] of Object.entries(source.skips)) flow.skips[step] = [...list];
  for (const [step, rule] of Object.entries(source.detours)) {
    if (typeof rule === "number") flow.detours[step] = rule;
    else {
      const name = nameOf(rule);
      if (name) flow.detours[step] = { $ref: name };
      else reader.issues.push({ where: `${source.id} detour ${step}`, problem: "a detour function that is not exported" });
    }
  }
  const ordered = Object.fromEntries(Object.entries(screens).sort(([a], [b]) => Number(a) - Number(b)));
  const scene = source.scene === undefined ? undefined : reader.at(`${source.id} scene`, () => reader.node(source.scene));
  const data: ModuleData = { id: source.id, title: source.title, level: source.level, steps: source.steps, flow, ...(source.afterGem ? { afterGem: source.afterGem } : {}), ...(source.look ? { look: source.look } : {}), ...(scene !== undefined ? { scene } : {}), screens: ordered };
  const seen = new Set<string>();
  const issues = reader.issues.filter((issue) => !seen.has(`${issue.where}|${issue.problem}`) && seen.add(`${issue.where}|${issue.problem}`));
  return { data, issues };
}
