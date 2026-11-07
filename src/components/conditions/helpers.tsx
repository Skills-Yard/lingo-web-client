import type { ReactNode } from "react";
import { ExprBig } from "@/components/operators/visuals";
import { ExpressionStage } from "@/components/operators/interactions";
import { PredictTestStage, type PredictRow } from "./interactions";
import type { InteractionStage } from "./screen";

export { at, neutral, options, quiz, trueFalse, yesNo } from "@/components/operators/helpers";

/** A condition written big, as the top of a test (its words and symbols are separated by spaces). */
export const Condition = ({ text, size = 30 }: { text: string; size?: number }) => <ExprBig tokens={text.split(" ")} size={size} />;

/** The rows of a test: one per value, each with the test written out, and what it comes to. */
export const testRows = (values: readonly number[], truth: (value: number) => boolean, written: (value: number) => string): PredictRow[] =>
  values.map((value) => ({ label: String(value), sub: written(value), answer: truth(value) ? "True" : "False" }));

/** An interaction that builds a condition from blocks, with what Hex says, a hint for a wrong try and what the panel explains when it is right. */
export const build = (config: {
  line: string;
  tokens: readonly string[];
  accept: readonly (readonly string[])[];
  hint: string;
  panel: { title: string; text: string };
  prompt?: string;
  lead?: ReactNode;
}): InteractionStage => ({
  kind: "interaction",
  line: config.line,
  render: (api) => <ExpressionStage api={api} lead={config.lead} tokens={config.tokens} accept={config.accept} hint={config.hint} prompt={config.prompt} />,
  finishPanel: config.panel,
});

/** An interaction that predicts what a test gives, row by row. */
export const predict = (config: {
  line: string;
  rows: readonly PredictRow[];
  hint: string;
  header?: ReactNode;
  choices?: readonly string[];
  prompt?: string;
  panel?: { title: string; text: string };
}): InteractionStage => ({
  kind: "interaction",
  line: config.line,
  render: (api) => <PredictTestStage api={api} header={config.header} rows={config.rows} choices={config.choices} hint={config.hint} prompt={config.prompt} />,
  finishPanel: config.panel,
});

/** Both orders of two conditions joined by `and` / `or`, as written out in blocks. */
export const eitherOrder = (first: readonly string[], joiner: "and" | "or", second: readonly string[]): string[][] => [
  [...first, joiner, ...second],
  [...second, joiner, ...first],
];
