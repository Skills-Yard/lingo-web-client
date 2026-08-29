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
          className={`absolute top-5 right-5 max-w-32.5 bg-white text-[#2C2C2C] rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-lg ${noteClassName}`}
        >
          <span className="text-xs md:text-sm font-semibold leading-snug">Open Your Notebook</span>
        </div>
      )}
    </div>
  );
}
