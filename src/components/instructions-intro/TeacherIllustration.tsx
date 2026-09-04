interface TeacherIllustrationProps {
  className?: string;
  fit?: "contain" | "cover";
  variant?: "card" | "bleed";
  imageLight?: string;
  imageDark?: string;
  alt?: string;
  showNote?: boolean;
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
        </div>
      )}
    </div>
  );
}
