import { ChevronLeft, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface IntroHeaderProps {
  stepNumber: number;
  stepTotal: number;
  bookmarked: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
}

/** Fixed top bar: back button, step counter + progress segments, bookmark and theme toggle. */
export function IntroHeader({
  stepNumber,
  stepTotal,
  bookmarked,
  onBack,
  onToggleBookmark,
}: IntroHeaderProps) {
  return (
    <header className="shrink-0 flex items-center justify-between gap-2.5 px-4 pt-4 pb-3 select-none">
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-card border border-border text-foreground hover:bg-surface-strong transition-all active:scale-95 cursor-pointer shadow-xs"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="grow md:grow-0 md:w-72 flex flex-col items-center gap-1.5 px-2 md:mr-auto md:ml-6">
        <div className="text-xs font-medium tracking-wider flex items-center gap-1">
          <span className="text-primary font-semibold">
            {String(stepNumber).padStart(2, "0")}
          </span>
          <span className="text-muted-foreground">
            / {String(stepTotal).padStart(2, "0")}
          </span>
        </div>
        <div className="w-full flex gap-1">
          {Array.from({ length: stepTotal }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full grow transition-all duration-300 ${
                i < stepNumber ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleBookmark}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all active:scale-95 cursor-pointer shadow-xs ${
            bookmarked
              ? "bg-secondary border-primary/40 text-primary"
              : "bg-card border-border text-muted-foreground"
          }`}
          aria-label="Bookmark"
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
        </button>
        <ThemeToggle className="w-10 h-10 rounded-lg" />
      </div>
    </header>
  );
}
