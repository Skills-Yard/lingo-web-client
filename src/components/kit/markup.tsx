import { Fragment, type ReactNode } from "react";
import type { Span } from "@/components/level-two/levelTwo";

/**
 * The little markup the kit's texts understand, so a screen's words stay a plain string:
 *   `*teal*`   picks words out in the brand's teal gradient ("Let's *Go*")
 *   `**bold**` makes them bold
 */
export type Piece = { text: string; teal?: boolean; bold?: boolean };

const MARKS = /\*\*(.+?)\*\*|\*(.+?)\*/g;

export function parseMarkup(source: string): Piece[] {
  const pieces: Piece[] = [];
  let at = 0;
  for (const match of source.matchAll(MARKS)) {
    if (match.index > at) pieces.push({ text: source.slice(at, match.index) });
    if (match[1] !== undefined) pieces.push({ text: match[1], bold: true });
    else pieces.push({ text: match[2], teal: true });
    at = match.index + match[0].length;
  }
  if (at < source.length) pieces.push({ text: source.slice(at) });
  return pieces;
}

/** The words with their marks taken out. */
export const plainText = (source: string) => parseMarkup(source).map((piece) => piece.text).join("");

/** The words as runs of text with the teal ones marked (what Hex's bubble takes). */
export const toSpans = (source: string): Span[] => parseMarkup(source).map(({ text, teal }) => ({ text, teal }));

/**
 * Text with its marks drawn. With `visible`, only that many letters show and the
 * rest are laid out unseen, so centred lines never shift as the words are typed in.
 */
export function Markup({ text, visible, tealClassName = "text-level-gradient" }: { text: string; visible?: number; tealClassName?: string }): ReactNode {
  let before = 0;
  return parseMarkup(text).map((piece, index) => {
    const seen = visible === undefined ? piece.text.length : Math.max(0, Math.min(piece.text.length, visible - before));
    before += piece.text.length;
    const className = piece.teal ? tealClassName : undefined;
    const content = (
      <>
        {piece.text.slice(0, seen)}
        {seen < piece.text.length && <span className="invisible">{piece.text.slice(seen)}</span>}
      </>
    );
    // Bold is a real `<b>`, which the result panels colour (see `FeedbackPanel`).
    return <Fragment key={index}>{piece.bold ? <b className={className}>{content}</b> : <span className={className}>{content}</span>}</Fragment>;
  });
}
