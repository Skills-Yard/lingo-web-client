"use client";

import { useEffect, useRef, useState } from "react";

const DIR = "/images/level-two/";

/**
 * A picture from `public/images/level-two/` that is drawn once the file is
 * there: until then it leaves nothing but the (fixed-size) slot its parent
 * gives it, instead of a broken-image icon.
 */
export function SlotImage({ file, className }: { file: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);
  // The failed request can finish before React has attached `onError`.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  if (missing) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={`${DIR}${file}`} alt="" draggable={false} onError={() => setMissing(true)} className={`select-none ${className ?? ""}`} />
  );
}
