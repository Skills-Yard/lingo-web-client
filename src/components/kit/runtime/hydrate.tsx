import { createElement, type ReactNode } from "react";
import type { Json, NodeContext } from "./schema";
import { resolveName } from "./registry";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The value at a dotted path (`api.hexSpoken`) of what the runner supplied. */
function lookup(context: NodeContext, path: string): unknown {
  let value: unknown = context;
  for (const part of path.split(".")) {
    if (part === "") continue;
    if (!isRecord(value) && typeof value !== "function") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/** A component the data names but the app does not have: shown as a red note instead of crashing the screen. */
const missing = (name: string, key?: string | number) =>
  createElement("span", { key, className: "rounded bg-red-100 px-1 text-[11px] text-red-700" }, `missing component: ${name}`);

/**
 * Turns data into what React draws (see `schema.ts` for the four kinds of node). `context` holds
 * what the screen's runner supplies — a question's `attempt` and `hexSpoken`, an interaction's `api`.
 */
export function hydrate(node: Json | undefined, context: NodeContext, key?: string | number): unknown {
  if (node === null || node === undefined || typeof node !== "object") return node ?? undefined;
  if (Array.isArray(node)) return node.map((child, index) => hydrate(child, context, index));
  const record = node as Record<string, Json>;

  if (typeof record.$ctx === "string") return lookup(context, record.$ctx);
  if (typeof record.$ref === "string") return resolveName(record.$ref);
  if (Array.isArray(record.$by) && isRecord(record.cases)) {
    const picked = (record.$by as string[]).map((path) => String(Boolean(lookup(context, path)))).join(",");
    return hydrate((record.cases as Record<string, Json>)[picked], context, key);
  }
  if (isRecord(record.$fn)) {
    const { arity, body } = record.$fn as { arity: number; body: Json };
    const made = (...args: unknown[]) => hydrate(body, { ...context, ...Object.fromEntries(args.map((arg, index) => [`arg${index}`, arg])) });
    // Keeps the number of arguments the original function declared.
    return Object.defineProperty(made, "length", { value: arity });
  }
  if (typeof record.$ === "string") {
    const type = resolveName(record.$);
    if (type === undefined) return missing(record.$, key);
    const props = Object.fromEntries(Object.entries((record.props as Record<string, Json> | undefined) ?? {}).map(([name, value]) => [name, hydrate(value, context)]));
    const children = ((record.children as Json[] | undefined) ?? []).map((child, index) => hydrate(child, context, index)) as ReactNode[];
    return createElement(type as string, key === undefined ? props : { ...props, key }, ...children);
  }
  return Object.fromEntries(Object.entries(record).map(([name, value]) => [name, hydrate(value, context)]));
}

/** `hydrate`, as something to put in JSX. */
export const hydrateNode = (node: Json | undefined, context: NodeContext): ReactNode => hydrate(node, context) as ReactNode;
