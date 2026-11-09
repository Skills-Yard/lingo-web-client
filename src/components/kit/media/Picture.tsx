"use client";

import { useState } from "react";
import { Markup } from "../markup";

const DIR = "/images/level-two/";

export type PictureProps = {
  /** A file in `public/images/level-two/`, or a path that starts with "/". */
  src: string;
  /** What the picture shows, for screen readers. Leave out for a decoration. */
  alt?: string;
  /** Its width and height (px or any CSS length). The picture is kept whole inside them. */
  width?: number | string;
  height?: number | string;
  fit?: "contain" | "cover";
  /** Rounded corners (px), or `true` for 8. */
  rounded?: boolean | number;
  /** A line under the picture (`*teal*` words). */
  caption?: string;
  className?: string;
};

/**
 * A picture for a screen. If the file is not there (yet) it leaves just the empty box instead of
 * a broken-image icon, so a screen can name pictures that have not been drawn.
 */
export function Picture({ src, alt, width, height, fit = "contain", rounded = false, caption, className = "" }: PictureProps) {
  const [missing, setMissing] = useState(false);
  const radius = rounded === true ? 8 : rounded === false ? 0 : rounded;
  return (
    <figure className={`flex max-w-full flex-col items-center gap-2 ${className}`}>
      <div className="flex max-w-full items-center justify-center overflow-hidden" style={{ width, height, borderRadius: radius }}>
        {!missing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src.startsWith("/") ? src : `${DIR}${src}`}
            alt={alt ?? ""}
            aria-hidden={alt ? undefined : true}
            draggable={false}
            onError={() => setMissing(true)}
            className={`max-h-full max-w-full select-none ${fit === "cover" ? "h-full w-full object-cover" : "object-contain"}`}
          />
        )}
      </div>
      {caption && (
        <figcaption className="text-center text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
          <Markup text={caption} />
        </figcaption>
      )}
    </figure>
  );
}
