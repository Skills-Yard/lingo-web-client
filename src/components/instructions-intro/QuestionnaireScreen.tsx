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

export function QuestionnaireScreen({
  slide,
  selectedId: externalSelectedId,
  checked: externalChecked,
  onSelect,
}: QuestionnaireScreenProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [localChecked, setLocalChecked] = useState(false);

  // Use external state if provided, otherwise use local state
  const selectedId = externalSelectedId !== undefined ? externalSelectedId : localSelectedId;
  const checked = externalChecked !== undefined ? externalChecked : localChecked;

  const selectedItem = selectedId ? slide.items.find(i => i.id === selectedId) : null;
  const isCorrect = selectedItem?.isCorrect ?? false;

  const handleSelect = (id: string) => {
    if (!checked) {
      onSelect?.(id);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          <span className="text-primary">{slide.highlightWord}</span>{" "}
          <span className="text-foreground">{slide.title}</span>
        </h1>
      </div>

      {/* Questionnaire Items - Always Show */}
      <div className="flex flex-col gap-3 md:gap-4">
        {slide.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            disabled={checked}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer group ${
              selectedId === item.id
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-border bg-background hover:border-primary/40 dark:border-neutral-700"
            } ${checked ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
              {item.icon && (
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Label */}
            <p className="flex-1 text-left font-semibold text-foreground">
              {item.label}
            </p>

            {/* Radio Button / Checkmark */}
            <div className="shrink-0 w-6 h-6 rounded-full border-2 border-border dark:border-neutral-600 flex items-center justify-center transition-all"
              style={{
                borderColor: selectedId === item.id ? "var(--primary-color)" : undefined,
                backgroundColor: selectedId === item.id ? "var(--primary-color)" : undefined,
              }}>
              {selectedId === item.id && (
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Feedback Message - Show After Check */}
      {checked && selectedItem && (
        <div className={`p-4 rounded-lg border-l-4 flex gap-3 items-start ${
          isCorrect
            ? "bg-green-50 dark:bg-green-900/20 border-l-green-500"
            : "bg-red-50 dark:bg-red-900/20 border-l-red-500"
        }`}>
          <div className="shrink-0 mt-1">
            {isCorrect ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${
              isCorrect
                ? "text-green-900 dark:text-green-200"
                : "text-red-900 dark:text-red-200"
            }`}>
              {isCorrect ? "Correct, you got it!" : "Oops! Not quite."}
            </p>
            {selectedItem.feedback && (
              <p className={`text-sm mt-1 ${
                isCorrect
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}>
                {selectedItem.feedback}
              </p>
            )}
          </div>
          {/* Mascot in top right */}
          <div className="shrink-0">
            <Image
              src={isCorrect ? "/images/sprouty.png" : "/images/sprouty-worng-ans.png"}
              alt="Feedback"
              width={60}
              height={60}
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
