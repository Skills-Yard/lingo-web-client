"use client";

import type { SceneTexts } from "@/lib/rive/operatorsHost";
import { OPERATOR_SHOP } from "@/lib/rive/runtime";
import { BAR_W } from "./column";
import { OperatorScene } from "./OperatorScene";

type Item = { /** What the label under the price tag says (the question's own words, e.g. "4 Notebooks"). */ name: string; /** The amount on the tag, without the rupee sign (it is drawn by the tag). */ price: string };

/**
 * The shop counter ("VAR_Shop", as screens 3 and 4 use it) for a question about a notebook and a pen: each with its price on the tag and
 * its label under it written as the question words it (the file has 50 and 20, "Notebook" and "Pen"), no eraser, and the hanging board with
 * `board` on it. As wide as the top bar (`BAR_W`), since the blocks of the question stand under it.
 */
export function ShopCounter({ notebook, pen, board }: { notebook: Item; pen: Item; board: { label: string; amount: string } }) {
  const texts: SceneTexts = {
    [OPERATOR_SHOP.text.boardAmount]: board.amount,
    [OPERATOR_SHOP.text.boardLabel]: board.label,
    [OPERATOR_SHOP.text.notebookName]: notebook.name,
    [OPERATOR_SHOP.text.penName]: pen.name,
    ...Object.fromEntries(OPERATOR_SHOP.text.notebookAmount.map((run) => [run, notebook.price])),
    ...Object.fromEntries(OPERATOR_SHOP.text.penAmount.map((run) => [run, pen.price])),
  };
  return <OperatorScene scene="shop" width={BAR_W} values={{ showEraser: false, showNames: true, showTotal: true, highlight: 0 }} texts={texts} />;
}
