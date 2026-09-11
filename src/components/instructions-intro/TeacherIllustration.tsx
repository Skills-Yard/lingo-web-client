import { RobuEyeBlink } from "./RobuEyeBlink";

interface TeacherIllustrationProps {
  className?: string;
  fit?: "contain" | "cover";
  variant?: "card" | "bleed";
  imageLight?: string;
  imageDark?: string;
  alt?: string;
  showNote?: boolean;
  noteClassName?: string;
  /** Tucks Robu into the corner of the note bubble, as if it wrote the note. */
  showRobu?: boolean;
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
  showRobu = false,
}: TeacherIllustrationProps) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const frameClass =
    variant === "bleed"
      ? "rounded-[12px]"
      : "border rounded-[12px] shadow-sm";

  return (
    <div className={`relative w-full overflow-hidden ${frameClass} ${className}`}>
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
          className={`absolute right-5 top-5 max-w-36 rounded-[12px] rounded-bl-sm bg-white px-4 py-3.5 text-[#2C2C2C] drop-shadow-[1px_1px_12.8px_rgba(0,0,0,0.12)] ${noteClassName}`}
        >
          <span
            aria-hidden
            className="absolute left-2.5 top-1.5 font-serif text-4xl leading-none text-primary"
          >
            &ldquo;
          </span>
          <span className="relative block pt-3 text-[15px] font-semibold leading-[1.34]">
            Open Your Notebook
          </span>
          {showRobu && (
            <div className="teacher-note-robu" aria-hidden="true">
              <RobuEyeBlink className="h-full w-full" />
            </div>
          )}
        </div>
      )}

      {showNote && showRobu && (
        <style>{`
          .teacher-note-robu {
            position: absolute;
            top: 0.4rem;
            right: 0.4rem;
            width: 1.75rem;
            height: 1.75rem;
            animation: teacher-note-robu-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          @keyframes teacher-note-robu-in {
            from { transform: scale(0.4); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .teacher-note-robu { animation: none; }
          }
        `}</style>
      )}
    </div>
  );
}
