import type { OnboardingListOption, TextSpan } from "@/lib/constants/onboarding";
import { Button3D } from "@/components/ui/Button3D";
import { OnboardingFox } from "./robu/OnboardingFox";

interface QuestionListScreenProps {
  heading: TextSpan[];
  options: OnboardingListOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cta: string;
  onContinue: () => void;
  className?: string;
}

/**
 * A single-select question, options laid out as a vertical list of cards
 * (career, motivation) — see QuestionGridScreen for the other question
 * shape this flow uses (experience/Python level, a 2x2 illustrated grid).
 */
export function QuestionListScreen({
  heading,
  options,
  selectedId,
  onSelect,
  cta,
  onContinue,
  className,
}: QuestionListScreenProps) {
  return (
    <div className={`flex flex-1 flex-col min-h-0 bg-white px-4 ${className ?? ""}`}>
      <div className="flex shrink-0 items-center gap-1 pt-1">
        <div aria-hidden className="relative shrink-0 mr-2">
          <img src="/images/quesfoxi.png" alt="" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
        </div>
        <h1 className="text-lg font-semibold leading-snug text-[#1A1C22] sm:text-xl">
          {heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
              {span.text}
            </span>
          ))}
        </h1>
      </div>

      {/* Options share the leftover height (each capped at its natural
          size), so all six shrink to fit a short phone instead of pushing
          the CTA off-screen. `overflow-y-auto` is only a last resort for
          e.g. a phone in landscape. */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2 sm:mt-5 sm:gap-3">
        {options.map((option) => {
          const selected = option.id === selectedId;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`flex max-h-16 min-h-11 w-full flex-1 shrink-0 basis-0 items-center gap-3 rounded-xl border bg-white px-4 text-left transition-colors ${
                selected ? "border-2 border-primary" : "border-black/10 border-b-4 border-b-[#E3D8B8]"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  selected ? "rounded-md bg-[#1A1C22] text-white" : "bg-black/5 text-[#1A1C22]"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-[#1A1C22] sm:text-base">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-full shrink-0 pb-4 pt-2 sm:pb-6">
        <Button3D onClick={onContinue} disabled={!selectedId} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
