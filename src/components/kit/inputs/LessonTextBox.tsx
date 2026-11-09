"use client";

export type LessonTextBoxProps = {
  value: string;
  onChange: (value: string) => void;
  /** Enter is pressed. */
  onSubmit?: () => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  /** Shown under the field in red. */
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

/** A line of text to type, on a rounded card. */
export function LessonTextBox({ value, onChange, onSubmit, label, placeholder, maxLength, error, autoFocus = false, disabled = false, className = "" }: LessonTextBoxProps) {
  return (
    <label className={`pointer-events-auto flex w-full flex-col gap-1.5 ${className}`}>
      {label && <span className="text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{label}</span>}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={!!error}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit?.();
        }}
        className={`h-14 w-full rounded-[12px] border-2 bg-white px-4 text-[18px] font-medium text-[#444444] shadow-[0_3px_0_rgba(0,0,0,0.06)] transition-colors outline-none placeholder:text-[#A9B0B7] focus:border-[#08A4AD] disabled:opacity-60 dark:bg-[#15181E] dark:text-white dark:placeholder:text-white/35 ${
          error ? "border-[#E5484D]" : "border-[#E4E7EB] dark:border-white/15"
        }`}
      />
      {error && <span className="text-[13px] leading-5 font-medium text-[#D42421]">{error}</span>}
    </label>
  );
}
