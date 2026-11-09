"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { feelTap } from "../feel";

export type VideoPlayerProps = {
  /** The video: a path under `public/` (`/video/...`). */
  src: string;
  /** A picture shown until it is played. */
  poster?: string;
  /** The video's width (px or CSS length); its shape is 16:9 unless `aspect` says otherwise. */
  width?: number | string;
  aspect?: number;
  /** Called when the video has played to the end. */
  onEnded?: () => void;
  /** Called the first time it is played. */
  onPlay?: () => void;
  className?: string;
};

/** A video on a rounded card, with a big play button over its first frame. Once started it has the browser's own controls. */
export function VideoPlayer({ src, poster, width = "100%", aspect = 16 / 9, onEnded, onPlay, className = "" }: VideoPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  return (
    <div className={`pointer-events-auto relative max-w-full overflow-hidden rounded-lg bg-black shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${className}`} style={{ width, aspectRatio: aspect }}>
      <video
        ref={video}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        controls={started}
        onEnded={onEnded}
        className="size-full object-cover"
      />
      {!started && (
        <button
          type="button"
          aria-label="Play video"
          onClick={() => {
            feelTap();
            setStarted(true);
            onPlay?.();
            void video.current?.play();
          }}
          className="absolute top-1/2 left-1/2 flex size-[69px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[#F0F0FF] bg-white shadow-[1px_1px_13.2px_3px_rgba(0,0,0,0.25)] transition-transform active:scale-95"
        >
          <Play aria-hidden className="ml-1 size-[26px] fill-[#00B8A9] text-[#00B8A9]" />
        </button>
      )}
    </div>
  );
}
