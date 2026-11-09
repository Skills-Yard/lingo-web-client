"use client";

import type { ReactNode } from "react";
import type { SymbolItem } from "@/components/kit/content/from-operators/interactions";
import { CompareDemo, GateCard, LineScale } from "@/components/kit/content/from-operators/visuals";

/**
 * The pictures above a `SymbolStage`, which change with the symbol tapped. They are components (not
 * inline functions) so a screen's data can name them: `current` is the item last tapped, or null.
 */

/** A comparison written as `left symbol right` with what it comes to; before anything is tapped, `idle` (or `fallback`'s example) shows. */
export function CompareHeader({ current, idle, fallback = "" }: { current: SymbolItem | null; idle?: ReactNode; fallback?: string }) {
  if (!current && idle) return <>{idle}</>;
  const [left, symbol, right] = (current?.example ?? fallback).split(" ");
  return <CompareDemo left={left} symbol={symbol} right={right} result={current?.result ?? true} />;
}

/** The marks on a number line with a gate at the middle one, the tapped number picked out and, with `card`, the gate open or shut. */
export function GateHeader({ marks, limit, current, card = false }: { marks: readonly number[]; limit: string; current: SymbolItem | null; card?: boolean }) {
  const picked = current ? Number(current.symbol) : null;
  const line = <LineScale marks={marks} picked={picked === null ? [] : [picked]} gate={marks[1]} gateLabel={limit} />;
  if (!card) return line;
  return (
    <div className="flex flex-col items-center gap-2">
      {line}
      {current && <GateCard score={Number(current.symbol)} open={current.result === true} />}
    </div>
  );
}
