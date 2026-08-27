interface TeacherIllustrationProps {
  /**
   * Sizing for the outer container. Each screen passes its own height/aspect so the
   * two usages stay independent — the intro is a tall panel, the quiz version a short banner.
   * Defaults to the intro height (275px).
   */
  className?: string;
  /** How the teacher image fills the container. */
  fit?: "contain" | "cover";
  /**
   * "card" — bordered, rounded panel (quiz screen).
   * "bleed" — edge-to-edge image with no frame (intro screen).
   */
  variant?: "card" | "bleed";
  /** Light-theme artwork. Each screen can pass its own (intro vs quiz use different images). */
  imageLight?: string;
  /** Dark-theme artwork. */
  imageDark?: string;
  alt?: string;
  /** Overlay the "Open Your Notebook" speech card on the image. */
  showNote?: boolean;
  /** Extra classes for the note overlay (e.g. "md:hidden" to only show it on mobile). */
  noteClassName?: string;
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
          className={`absolute top-5 right-5 max-w-32.5 bg-white text-[#2C2C2C] rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-lg ${noteClassName}`}
        >
          <span className="text-xs md:text-sm font-semibold leading-snug">Open Your Notebook</span>
        </div>
      )}
    </div>
  );
}
