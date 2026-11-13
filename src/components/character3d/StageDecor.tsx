import Image from "next/image";
import { BACKDROP, PICTURES, type Picture } from "./show";

/*
 * What the stage shows around the character: a backdrop behind it and a picture
 * beside it. Every picture is always in the page (invisible until its turn), so
 * each is loaded before it is needed and appears at once. They are not
 * `display: none`, which would keep the browser from loading them ahead.
 */

/** Goes before the canvas: the canvas is transparent and draws over it. */
export const StageBackdrop = () => (
  // Taller than the stage and anchored at its bottom, so the image's last rows (they
  // carry a stray "Activate Windows" watermark) fall below the stage and are cut off.
  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-[-12%]">
    <Image
      src={BACKDROP}
      alt=""
      fill
      // Plain files, not Next's image optimizer: in dev it can leave a request hanging for good.
      unoptimized
      // Starts loading with the page, but after what the page needs (the character).
      loading="eager"
      fetchPriority="low"
      className="object-cover object-bottom"
    />
  </div>
);

type StagePictureProps = {
  /** One of `PICTURES`; none for no picture. */
  picture: Picture | null;
};

/** Goes after the canvas, over it, and lets drags through to it. */
export const StagePicture = ({ picture }: StagePictureProps) => (
  <div className="pointer-events-none absolute top-[16%] left-[7%] w-[28%] max-w-47.5">
    {PICTURES.map(({ src, alt, width, height }) => {
      const shown = src === picture?.src;
      return (
        <Image
          key={src}
          src={src}
          alt={shown ? alt : ""}
          width={width}
          height={height}
          unoptimized
          loading="eager"
          fetchPriority="low"
          className={`h-auto w-full drop-shadow-lg ${
            shown ? "animate-[popIn_0.4s_ease-out_both] motion-reduce:animate-none" : "absolute top-0 left-0 opacity-0"
          }`}
        />
      );
    })}
  </div>
);
