import { Check, X } from "lucide-react";

/** The small round tick or cross that says an answer is right or wrong. */
export function AnswerMark({ kind, size = 26, className = "" }: { kind: "correct" | "wrong"; size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={kind === "correct" ? "Correct" : "Wrong"}
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${kind === "correct" ? "bg-[#01A17F]" : "bg-[#E5484D]"} ${className}`}
      style={{ width: size, height: size }}
    >
      {kind === "correct" ? <Check aria-hidden strokeWidth={3.2} style={{ width: size * 0.6, height: size * 0.6 }} /> : <X aria-hidden strokeWidth={3.2} style={{ width: size * 0.6, height: size * 0.6 }} />}
    </span>
  );
}
