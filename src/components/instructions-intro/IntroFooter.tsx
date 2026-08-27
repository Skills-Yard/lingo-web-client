import { ArrowRight, Check, X, Sparkle } from "lucide-react";

export interface QuizFeedback {
  isCorrect: boolean;
  title: string;
  body: string;
}

/** "disabled" = nothing picked yet, "retry" = wrong answer checked, "go" = normal advance. */
export type PrimaryState = "disabled" | "retry" | "go";

interface IntroFooterProps {
  primaryLabel: string;
  primaryState: PrimaryState;
  onPrimaryAction: () => void;
  /** Quiz result banner shown above the button once an answer has been checked. */
  feedback?: QuizFeedback | null;
  /**
   * Full-width CTA bar (default). When false the CTA shrinks to a bottom-right pill
   * with an arrow — the "Got It" treatment on the teacher-intro screen (desktop).
   */
  ctaFullWidth?: boolean;
}

/** Fixed bottom bar: the optional quiz feedback banner plus the primary call-to-action. */
export function IntroFooter({
  primaryLabel,
  primaryState,
  onPrimaryAction,
  feedback,
  ctaFullWidth = true,
}: IntroFooterProps) {
  return (
    <footer className="shrink-0 px-4 pt-3 pb-3 bg-background dark:bg-[#0D1016]">
      <div className="w-full flex flex-col gap-3">
        {feedback && (
          <div
            className="w-full rounded-[6px] p-3.5 flex items-center justify-between gap-2 animate-pop-in overflow-hidden md:hidden"
            style={{
              background: feedback.isCorrect
                ? "linear-gradient(180deg, rgba(1,161,127,0.16) 0%, rgba(255,255,255,0) 98.7%)"
                : "linear-gradient(180deg, rgba(225,29,72,0.16) 0%, rgba(255,255,255,0) 98.7%)",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    feedback.isCorrect ? "bg-primary" : "bg-rose-600 dark:bg-rose-500"
                  }`}
                >
                  {feedback.isCorrect ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <h3
                  className={`text-base font-semibold leading-none ${feedback.isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {feedback.title}
                </h3>
              </div>
              <p
                className={`text-xs font-medium leading-[1.4] ${feedback.isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}
              >
                {feedback.body}
              </p>
            </div>

            <div className="relative w-27.5 h-21 shrink-0">
              <Sparkle
                className="absolute w-3.5 h-3.5 text-amber-400 fill-amber-400"
                style={{ left: 92, top: 0 }}
              />
              <Sparkle
                className="absolute w-3 h-3 text-[#ABA8FC] fill-[#ABA8FC]"
                style={{ left: 0, top: 49 }}
              />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-[#ABA8FC]" style={{ left: 2, top: 22 }} />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-[#FF8585]" style={{ left: 0, top: 25 }} />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-[#FF8585]" style={{ left: 106, top: 58 }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sliceAnswer.png"
                alt=""
                className="absolute w-20.5 h-19.75 object-contain -scale-x-100 animate-bounce-slow"
                style={{ left: 20, top: 5 }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onPrimaryAction}
          disabled={primaryState === "disabled"}
          className={`w-full h-13 rounded-[6px] font-medium text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer ${
            ctaFullWidth ? "" : "md:w-auto md:self-end md:min-w-44 md:px-10"
          } ${
            primaryState === "disabled"
              ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
              : primaryState === "retry"
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          <span>{primaryLabel}</span>
          <ArrowRight className={`w-5 h-5 ${ctaFullWidth ? "md:hidden" : ""}`} />
        </button>
      </div>
    </footer>
  );
}
