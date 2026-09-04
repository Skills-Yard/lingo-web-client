"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import type { QuestionnaireSlide } from "@/lib/constants/instructionsIntro";

interface QuestionnaireScreenProps {
  slide: QuestionnaireSlide;
  selectedId?: string | null;
  checked?: boolean;
  onSelect?: (itemId: string) => void;
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
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[1fr_1.9fr] md:gap-x-8 md:gap-y-6 md:min-h-full md:content-center md:items-start">
      {/* ── Left column — "Q." badge, heading, prompt, illustration ── */}
      <div className="flex flex-col gap-4 md:col-start-1 md:row-start-1 md:row-span-2 md:self-stretch md:border-r border-black/10 dark:border-white/10 md:pr-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[6px] bg-[#E9F5F0] dark:bg-[#0F2921]">
            <span className="text-2xl font-semibold leading-none text-primary">
              Q.
            </span>
          </span>
          <h1 className="text-2xl font-semibold leading-[1.34] tracking-tight text-[#2C2C2C] dark:text-white">
            <Highlight text={slide.title} terms={[slide.highlightWord]} />
          </h1>
        </div>

        <p className="text-sm font-medium leading-[1.5] text-[#666666] dark:text-neutral-400">
          {slide.description}
        </p>

        {/* Supporting illustration — desktop only (mobile keeps the compact spec) */}
        <div className="hidden md:mt-2 md:flex md:items-center md:justify-center">
          <Image
            src="/images/computer.png"
            alt=""
            width={480}
            height={360}
            className="h-auto w-full max-w-[360px] object-contain"
            priority
          />
        </div>
      </div>

      {/* ── Option cards — Frame 12 / 61 / 62 (idle) & Frame 11 (selected) ── */}
      <div className="flex flex-col gap-[18px] md:col-start-2 md:row-start-1 md:row-span-2 md:self-center">
        {slide.items.map((item) => {
          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              disabled={checked}
              className={`flex min-h-[92px] w-full items-center gap-4 rounded-[12px] px-5 py-4 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed ${
                isSelected
                  ? "border border-primary [background:linear-gradient(180deg,#FFFFFF_1.3%,#EEFAF6_67.42%)] dark:[background:linear-gradient(180deg,#15181E_1.3%,#0F2921_67.42%)]"
                  : "cursor-pointer border border-black/[0.04] bg-white shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] hover:border-primary/40 dark:border-white/[0.06] dark:bg-[#15181E]"
              } ${checked && !isSelected ? "opacity-50" : ""}`}
            >
              {/* Frame 23 — icon tile */}
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-[#E9F5F0] dark:bg-[#0F2921]">
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                )}
              </span>

              {/* label + description */}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold text-[#2C2C2C] dark:text-white">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
                    {item.description}
                  </span>
                )}
              </span>

              {/* Ellipse 2 — radio (Ellipse 6 fill when selected) */}
              <span
                className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-black/12 dark:border-white/20"
                }`}
              >
                {isSelected && (
                  <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Feedback — command9 Frame 13 + Frame 23/24, spans both columns ── */}
      {checked && selectedItem && (
        <div
          className={`relative overflow-hidden rounded-[12px] p-4 pr-28 md:col-span-2 md:row-start-3 md:pr-44 animate-pop-in ${
            isCorrect
              ? "[background:linear-gradient(180deg,rgba(223,255,248,0.68)_0%,rgba(255,255,255,0)_98.7%)] dark:[background:linear-gradient(180deg,rgba(1,161,127,0.20)_0%,rgba(255,255,255,0)_98.7%)]"
              : "[background:linear-gradient(180deg,rgba(255,226,226,0.68)_0%,rgba(255,255,255,0)_98.7%)] dark:[background:linear-gradient(180deg,rgba(220,38,38,0.20)_0%,rgba(255,255,255,0)_98.7%)]"
          }`}
        >
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
            <p className="mt-2 max-w-[260px] text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400 md:max-w-md">
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
            className="pointer-events-none absolute -bottom-1 right-1 h-[92px] w-auto object-contain md:bottom-1/2 md:right-6 md:h-[130px] md:translate-y-1/2"
          />
        </div>
      )}
    </div>
  );
}
