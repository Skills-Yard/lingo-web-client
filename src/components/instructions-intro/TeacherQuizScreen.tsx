import { Check, X } from "lucide-react";
import type { TeacherQuizSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";
import { RobuSays } from "./RobuSays";

interface TeacherQuizScreenProps {
  slide: TeacherQuizSlide;
  selected: number | null;
  checked: boolean;
  onSelect: (idx: number) => void;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}

export function TeacherQuizScreen({
  slide,
  selected,
  checked,
  onSelect,
  instantSpeech,
  registerAnchor,
}: TeacherQuizScreenProps) {
  const selectedOption = selected !== null ? slide.options[selected] : null;
  const isCorrect = !!selectedOption?.isCorrect;
  const showFeedback = checked && selectedOption;
  const feedbackTitle = isCorrect ? slide.correctTitle : slide.incorrectTitle;
  const feedbackBody = isCorrect ? slide.correctText : slide.incorrectText;

  return (
    // The 2-column split is gated on `lg:` (1024), not `md:` (768): Robu's
    // own box (ROBU_DEFAULT_SIZE, sized to match every other screen's
    // resting Robu) is wider than a `md:grid-cols-2` column leaves room for
    // between 768-1023px, which split him away from his own speech bubble.
    // RobuSays' side-switch (`sideLg`) already only kicks in at `lg:`, so
    // this now stays consistent with it instead of flipping to a 2-col grid
    // a breakpoint early. Below `lg:`, this renders exactly like it already
    // did below `md:` (single-column stack).
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-center lg:min-h-full lg:content-center">
      <RobuSays
        text={`${slide.highlightWord} ${slide.title}`}
        highlight={slide.highlightWord}
        instant={instantSpeech}
        side="right"
        sideLg="left"
        // Shrunk below `lg:` (not the shared ROBU_DEFAULT_SIZE, which
        // reaches 336px by `md:`) — that box's own mostly-empty padding was
        // leaving a big blank gap between the bubble and the illustration
        // below it once the row stays single-column through `lg:`.
        robuClassName="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40"
        className="lg:col-start-1 lg:row-start-1"
        registerAnchor={registerAnchor}
      />

      <TeacherIllustration
        className="h-64 lg:h-80 lg:col-start-1 lg:row-start-2"
        fit="contain"
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
      />

      <div className="flex flex-col gap-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
        {slide.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const Icon = opt.icon;

          let cardBorder = "border-border bg-card hover:border-muted-foreground/50";
          let radioStyle = "border-muted-foreground/60";
          let iconWrap =
            idx === 0
              ? "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300"
              : "bg-secondary text-primary";

          if (isSelected && !checked) {
            cardBorder = "border-primary bg-secondary ring-1 ring-primary/30";
            radioStyle = "border-primary";
            iconWrap = "bg-primary/15 text-primary";
          } else if (isSelected && checked) {
            if (opt.isCorrect) {
              cardBorder = "border-primary bg-secondary ring-1 ring-primary/40";
              radioStyle = "border-primary";
              iconWrap = "bg-primary/15 text-primary";
            } else {
              cardBorder = "border-rose-500 bg-rose-50/80 dark:bg-[#260c11] ring-1 ring-rose-500/40";
              radioStyle = "border-rose-500";
              iconWrap = "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400";
            }
          }

          return (
            <button
              key={opt.text}
              type="button"
              disabled={checked}
              onClick={() => onSelect(idx)}
              className={`min-h-17 w-full flex items-center justify-between p-3 rounded-[12px] border transition-all duration-200 text-left shadow-xs cursor-pointer active:scale-99 ${cardBorder}`}
            >
              <div className="flex items-center gap-3 min-w-0 grow">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconWrap}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-medium text-sm leading-tight text-foreground">
                    {opt.text}
                  </span>
                  <span
                    className={`text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1 ${
                      checked && isSelected ? "invisible" : ""
                    }`}
                  >
                    {opt.subtitle}
                  </span>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${radioStyle}`}
                >
                  {isSelected && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        checked && !opt.isCorrect ? "bg-rose-500" : "bg-primary"
                      }`}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Desktop shows the result inline with the options; mobile (now
            including tablet, up through the same `lg:` the grid above
            switches at) keeps it in the footer. */}
        {showFeedback && (
          <div
            className={`hidden lg:flex items-center justify-between gap-3 rounded-[12px] p-4 overflow-hidden animate-pop-in ${
              isCorrect ? "bg-primary/10" : "bg-rose-500/10"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isCorrect ? "bg-primary" : "bg-rose-600 dark:bg-rose-500"
                  }`}
                >
                  {isCorrect ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <h3
                  className={`text-sm font-semibold ${
                    isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {feedbackTitle}
                </h3>
              </div>
              <p
                className={`text-xs font-medium leading-snug ${
                  isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {feedbackBody}
              </p>
            </div>
            <img
              src="/images/sliceAnswer.png"
              alt=""
              className="w-16 h-16 object-contain shrink-0 -scale-x-100 animate-bounce-slow md:max-h-[100px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
