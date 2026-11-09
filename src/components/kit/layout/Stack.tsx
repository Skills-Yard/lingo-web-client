import type { ReactNode } from "react";
import { TINT } from "../tokens";
import type { Tint } from "../types";

type Align = "start" | "center" | "end" | "stretch";
type Justify = "start" | "center" | "end" | "between";

const ALIGN: Record<Align, string> = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
const JUSTIFY: Record<Justify, string> = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };

type FlexProps = {
  /** Space between the children (px). */
  gap?: number;
  align?: Align;
  justify?: Justify;
  /** Takes the room left over in its parent. */
  grow?: boolean;
  /** As wide as its parts, instead of the width of its parent. */
  fit?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Children one under the other. */
export function Stack({ gap = 12, align = "center", justify = "start", grow = false, fit = false, className = "", children }: FlexProps) {
  return (
    <div className={`flex ${fit ? "" : "w-full"} flex-col ${ALIGN[align]} ${JUSTIFY[justify]} ${grow ? "min-h-0 flex-1" : ""} ${className}`} style={{ gap }}>
      {children}
    </div>
  );
}

/** Children side by side. */
export function Row({ gap = 12, align = "center", justify = "center", grow = false, fit = false, wrap = false, className = "", children }: FlexProps & { wrap?: boolean }) {
  return (
    <div className={`flex ${fit ? "" : "w-full"} flex-row ${ALIGN[align]} ${JUSTIFY[justify]} ${wrap ? "flex-wrap" : ""} ${grow ? "min-h-0 flex-1" : ""} ${className}`} style={{ gap }}>
      {children}
    </div>
  );
}

/** Empty room that grows to fill what is left, pushing what comes after it to the end. */
export function Spacer({ size }: { size?: number }) {
  return size === undefined ? <div aria-hidden className="min-h-0 flex-1" /> : <div aria-hidden className="shrink-0" style={{ height: size }} />;
}

/** A soft card to group a few parts on. */
export function Card({ tint = "white", padded = true, className = "", children }: { tint?: Tint; padded?: boolean; className?: string; children?: ReactNode }) {
  return <div className={`w-full rounded-[12px] border-4 border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent ${TINT[tint]} ${padded ? "p-3" : ""} ${className}`}>{children}</div>;
}
