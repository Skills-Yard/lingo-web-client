import { SpeechBubble } from "./SpeechBubble";

interface TeacherIllustrationProps {
  className?: string;
  fit?: "contain" | "cover";
  variant?: "card" | "bleed";
  imageLight?: string;
  imageDark?: string;
  alt?: string;
  showNote?: boolean;
  noteClassName?: string;
  /** Holds the note's own text back (typed nothing yet) until this flips
   * true — lets a caller sequence it to start only once Robu's own line has
   * finished, instead of both typing at the same time. Defaults to true so
   * the note types immediately for any caller that doesn't care to gate it. */
  noteStartTyping?: boolean;
  /** Skip the note's typewriter and show its line immediately — mirrors the
   * flow's own `instantSpeech` for a screen already seen. */
  noteInstant?: boolean;
  /** Fires once the note's own line has fully typed out. */
  onNoteTypingComplete?: () => void;
  /** True once the note has finished typing and should call attention to
   * itself — same glow treatment as screen 2's reveal card. */
  noteHighlighted?: boolean;
}

/** Teacher-at-the-whiteboard illustration shared by the "Teacher Says" intro and the quiz screen. */
export function TeacherIllustration({
  className = "h-68.75 max-sm:h-[280px]",
  fit = "contain",
  variant = "card",
  imageLight = "/images/teacherWhite.png",
  imageDark = "/images/teacherBlack.png",
  alt = "Teacher explaining at the whiteboard",
  showNote = true,
  noteClassName = "",
  noteStartTyping = true,
  noteInstant,
  onNoteTypingComplete,
  noteHighlighted,
}: TeacherIllustrationProps) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const frameClass =
    variant === "bleed" ? "rounded-[12px]" : "border rounded-[12px] shadow-sm";

  return (
    <div
      className={`relative w-full overflow-hidden ${frameClass} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageLight}
        alt={alt}
        className={`w-full h-full dark:hidden ${fitClass}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageDark}
        alt={alt}
        className={`w-full h-full hidden dark:block ${fitClass}`}
      />
      {showNote && (
        <div
          className={`absolute right-5 top-5 max-w-36 rounded-[12px] rounded-bl-sm bg-white px-4 py-3.5 text-[#2C2C2C] drop-shadow-[1px_1px_12.8px_rgba(0,0,0,0.12)] transition-shadow ${
            noteHighlighted ? "animate-card-glow" : ""
          } ${noteClassName}`}
        >
          <span
            aria-hidden
            className="absolute left-2.5 top-1.5 font-serif text-4xl leading-none text-primary"
          >
            &ldquo;
          </span>

          <span className="relative block min-h-[1.34em] pt-3 text-[15px] font-semibold leading-[1.34]">
            {noteStartTyping && (
              <SpeechBubble
                text="Open Your Notebook"
                size="plain"
                instant={noteInstant}
                onTypingComplete={onNoteTypingComplete}
              />
            )}
          </span>

          <span
            aria-hidden
            className="absolute bottom-0.5 right-2.5 font-serif text-4xl leading-none text-primary"
          >
            &rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
