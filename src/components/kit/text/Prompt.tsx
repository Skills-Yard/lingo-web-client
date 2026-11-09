import type { CSSProperties, ReactNode } from "react";
import { Markup } from "../markup";
import { TEXT } from "../tokens";

/** The question set just above its answers, on a soft white plate so it reads over any picture behind it. */
export function Prompt({ text, className = "", style }: { text: string; className?: string; style?: CSSProperties }) {
  return (
    <p style={style} className={`rounded-[12px] bg-white/85 px-3 py-1.5 text-center text-[16px] leading-[22px] font-semibold text-[#444444] dark:bg-[#15181E]/85 dark:text-white ${className}`}>
      <Markup text={text} />
    </p>
  );
}

/** Small helper text: a hint of what to do, a note under a picture. `error` is the red line a screen shows when something is not right yet. */
export function Note({ text, children, tone = "muted", className = "" }: { text?: string; children?: ReactNode; tone?: "muted" | "error"; className?: string }) {
  return (
    <p className={`text-center ${tone === "error" ? "min-h-5 text-[13px] leading-5 font-medium text-[#D42421]" : TEXT.note} ${className}`}>
      {text !== undefined ? <Markup text={text} /> : children}
    </p>
  );
}

/** The big, plain sentence that states the idea of a "Meet ..." screen ("Integer (int) represents whole-number values."). */
export function KeyText({ text, children, className = "" }: { text?: string; children?: ReactNode; className?: string }) {
  return (
    <p className={`w-[320px] text-center text-[19px] leading-[26px] font-semibold text-[#444444] dark:text-white ${className}`}>
      {text !== undefined ? <Markup text={text} /> : children}
    </p>
  );
}
