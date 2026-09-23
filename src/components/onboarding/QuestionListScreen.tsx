import type { OnboardingListOption, TextSpan } from "@/lib/constants/onboarding";
import { Button3D } from "@/components/ui/Button3D";

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
    <div className={`flex flex-1 flex-col bg-white px-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3 pt-2">
        <div
          aria-hidden
          className="relative flex h-14 w-14 shrink-0 items-center justify-center"
        >
          <span className="absolute -left-1 -top-1 text-lg font-bold text-[#8B5CF6]">?</span>
          <span className="absolute -right-1 -top-1 text-lg font-bold text-[#8B5CF6]">?</span>
          <svg viewBox="0 0 100 100" className="h-12 w-12">
            <polygon points="50,5 90,40 90,95 10,95 10,40" fill="#22C08C" />
          </svg>
        </div>
        <h1 className="pt-1 text-lg font-semibold leading-snug text-[#1A1C22] sm:text-xl">
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
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 text-left transition-colors ${
                selected ? "border-2 border-primary" : "border-black/10"
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
              {!selected && (
                <span
                  aria-hidden
                  className="absolute -right-2 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 bg-[#D9CBA3]"
                />
              )}
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
