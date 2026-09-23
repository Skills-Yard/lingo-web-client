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
      <div className="flex items-center gap-1 pt-1">
        <div aria-hidden className="relative shrink-0 mr-2">
          <img src="/images/quesfoxi.png" alt="" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-lg font-semibold leading-snug text-[#1A1C22] sm:text-xl">
          {heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
              {span.text}
            </span>
          ))}
        </h1>
      </div>

      <div className="mt-6 flex-1 space-y-3 overflow-y-auto pb-4">
        {options.map((option) => {
          const selected = option.id === selectedId;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-colors ${
                selected ? "border-2 border-primary" : "border-black/10 border-b-4 border-b-[#E3D8B8]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
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

      <div className="w-full pb-6 pt-2">
        <Button3D onClick={onContinue} disabled={!selectedId} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
