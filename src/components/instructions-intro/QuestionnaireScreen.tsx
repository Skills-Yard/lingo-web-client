"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import type { QuestionnaireSlide } from "@/lib/constants/instructionsIntro";
import { RobuAnchor } from "./RobuAnchor";
import { SpeechBubble } from "./SpeechBubble";

interface QuestionnaireScreenProps {
  slide: QuestionnaireSlide;
  selectedId?: string | null;
  checked?: boolean;
  onSelect?: (itemId: string) => void;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}

/** Wraps any of `terms` (case-insensitive) found in `text` with the brand green. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const clean = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (clean.length === 0) return <>{text}</>;

  const pattern = clean
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        clean.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function QuestionnaireScreen({
  slide,
  selectedId: externalSelectedId,
  checked: externalChecked,
  onSelect,
  instantSpeech,
  registerAnchor,
}: QuestionnaireScreenProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [localChecked] = useState(false);

  // Use external (flow-driven) state when provided, otherwise fall back to local.
  const selectedId =
    externalSelectedId !== undefined ? externalSelectedId : localSelectedId;
  const checked = externalChecked !== undefined ? externalChecked : localChecked;

  const selectedItem = selectedId
    ? slide.items.find((i) => i.id === selectedId)
    : null;
  const isCorrect = selectedItem?.isCorrect ?? false;

  const handleSelect = (id: string) => {
    if (checked) return;
    if (onSelect) onSelect(id);
    else setLocalSelectedId(id);
  };

  return (
    // Split gated on `lg:` (1024), not `md:` (768) — matches the same
    // Robu-vs-column-width mismatch fixed on the other screens, and keeps
    // Robu paired with his own speech bubble instead of the bubble sitting
    // alone atop the far-off options column between 768-1023px.
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_1.9fr] lg:gap-x-8 lg:gap-y-6 lg:items-start">
      {/* ── Left column — Robu (+ his bubble below `lg:`), prompt, illustration ── */}
      <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-stretch lg:border-r border-black/10 dark:border-white/10 lg:pr-8">
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <RobuAnchor
            registerAnchor={registerAnchor}
            // Robu's default box (up to 336px at `md:`) is centered on his
            // own (much smaller) art, but was still tall enough to leave a
            // lot of dead space in this row and dwarf the bubble beside him
            // — shrunk here (below `lg:`, where he's alone again in his own
            // column at the original size) to actually sit tidily beside it.
            className="shrink-0 h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40"
          />
          {/* Paired beside Robu below `lg:`; at `lg:`+ the original copy
              (further down, atop the options column) takes over instead so
              this one hides rather than showing the line twice. */}
          <div className="min-w-0 flex-1 lg:hidden">
            <SpeechBubble
              text={slide.title}
              highlight={slide.highlightWord}
              instant={instantSpeech}
              size="lg"
              tailCorner="bottom-left"
              bubbleClassName="sm:max-w-md"
            />
          </div>
        </div>

        <p className="text-base font-medium leading-[1.5] text-[#666666] dark:text-neutral-400">
          {slide.description}
        </p>

        {/* Supporting illustration — desktop only (mobile/tablet keep the compact spec) */}
        <div className="hidden lg:mt-2 lg:flex lg:items-center lg:justify-center">
          <Image
            src="/images/computer.png"
            alt=""
            width={480}
            height={360}
            className="h-auto w-full max-w-[360px] object-contain lg:max-w-[220px]"
            priority
          />
        </div>
      </div>

      {/* ── Option cards — Frame 12 / 61 / 62 (idle) & Frame 11 (selected) ── */}
      <div className="flex flex-col gap-[18px] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
        {/* Desktop-only copy — below `lg:` the copy beside Robu above
            handles this line instead. */}
        <div className="hidden lg:flex justify-start">
          <SpeechBubble
            text={slide.title}
            highlight={slide.highlightWord}
            instant={instantSpeech}
            size="lg"
            tailCorner="bottom-left"
            bubbleClassName="sm:max-w-md"
          />
        </div>
        {slide.items.map((item) => {
          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              disabled={checked}
              className={`flex min-h-[76px] sm:min-h-[92px] w-full items-center gap-3 sm:gap-4 rounded-[12px] px-4 py-3 sm:px-5 sm:py-4 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed ${
                isSelected
                  ? "border border-primary [background:linear-gradient(180deg,#FFFFFF_1.3%,#EEFAF6_67.42%)] dark:[background:linear-gradient(180deg,#15181E_1.3%,#0F2921_67.42%)]"
                  : "cursor-pointer border border-black/[0.04] bg-white shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] hover:border-primary/40 dark:border-white/[0.06] dark:bg-[#15181E]"
              } ${checked && !isSelected ? "opacity-50" : ""}`}
            >
              {/* Frame 23 — icon tile */}
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-[12px] bg-[#E9F5F0] dark:bg-[#0F2921]">
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt=""
                    width={28}
                    height={28}
                    className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                  />
                )}
              </span>

              {/* label + description */}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm sm:text-base font-semibold text-[#2C2C2C] dark:text-white">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs sm:text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
                    {item.description}
                  </span>
                )}
              </span>

              {/* Ellipse 2 — radio (Ellipse 6 fill when selected) */}
              <span
                className={`flex h-6 w-6 sm:h-6.5 sm:w-6.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-black/12 dark:border-white/20"
                }`}
              >
                {isSelected && (
                  <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-primary" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Feedback — command9 Frame 13 + Frame 23/24, spans both columns ──
          Desktop shows this inline panel; mobile keeps it in the footer (see
          IntroFooter). Always occupies this grid row (`invisible`, not a
          conditional unmount) once `checked` fires the min-height, even
          before that: mounting it only once the answer's checked used to
          grow this screen's total height at that exact moment, and since
          the whole slide sits in a vertically-centered flex column (see
          InstructionsIntroFlow), that growth pulled everything — the
          question, the options, all of it — upward to stay centered around
          the new, taller midpoint. Reserving the row from the start means
          the screen's height (and hence its centered position) never
          changes when the feedback actually appears. */}
      <div
        className={`hidden lg:block relative overflow-hidden rounded-[12px] p-4 pr-28 lg:col-span-2 lg:row-start-3 lg:pr-44 lg:min-h-[110px] ${
          checked && selectedItem ? "animate-pop-in" : "invisible"
        } ${
          isCorrect
            ? "[background:linear-gradient(180deg,rgba(223,255,248,0.68)_0%,rgba(255,255,255,0)_98.7%)] dark:[background:linear-gradient(180deg,rgba(1,161,127,0.20)_0%,rgba(255,255,255,0)_98.7%)]"
            : "[background:linear-gradient(180deg,rgba(255,226,226,0.68)_0%,rgba(255,255,255,0)_98.7%)] dark:[background:linear-gradient(180deg,rgba(220,38,38,0.20)_0%,rgba(255,255,255,0)_98.7%)]"
        }`}
      >
        {selectedItem && (
          <>
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ${
                  isCorrect ? "bg-primary" : "bg-destructive"
                }`}
              >
                {isCorrect ? (
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                ) : (
                  <X className="h-5 w-5 text-white" strokeWidth={3} />
                )}
              </span>
              <p
                className={`text-[18px] font-semibold ${
                  isCorrect ? "text-primary" : "text-destructive"
                }`}
              >
                {isCorrect ? "Correct, you got it!" : "Oops! Not quite."}
              </p>
            </div>

            {selectedItem.feedback && (
              <p className="mt-2 max-w-[260px] text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400 lg:max-w-md">
                {isCorrect ? (
                  <Highlight
                    text={selectedItem.feedback}
                    terms={[`${selectedItem.label}s`, selectedItem.label]}
                  />
                ) : (
                  selectedItem.feedback
                )}
              </p>
            )}

            <Image
              src={isCorrect ? "/images/sprouty.png" : "/images/sprouty-worng-ans.png"}
              alt=""
              width={140}
              height={130}
              className="pointer-events-none absolute -bottom-1 right-1 h-[92px] w-auto object-contain lg:bottom-1/2 lg:right-6 lg:h-[130px] lg:translate-y-1/2"
            />
          </>
        )}
      </div>
    </div>
  );
}
