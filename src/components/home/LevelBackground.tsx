"use client";

import { useEffect, useState } from "react";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { hexRiveSource } from "@/lib/rive/hexFile";
import { LEVEL_BACKGROUND } from "@/lib/rive/runtime";

const LAYOUT = new Layout({ fit: Fit.Fill, alignment: Alignment.TopCenter });

type TileProps = {
  aspect: number;
  onAspect?: (aspect: number) => void;
};

/** One playing copy of the background. */
function Tile({ aspect, onAspect }: TileProps) {
  const { rive, RiveComponent } = useRive({
    ...hexRiveSource(),
    artboard: LEVEL_BACKGROUND.artboard,
    stateMachine: LEVEL_BACKGROUND.stateMachine,
    autoplay: true,
    layout: LAYOUT,
  });

  // The artboard's own size decides the tile's aspect ratio.
  useEffect(() => {
    if (!rive || !onAspect) return;
    const { minX, maxX, minY, maxY } = rive.bounds;
    if (maxY > minY) onAspect((maxX - minX) / (maxY - minY));
  }, [rive, onAspect]);

  return (
    <div className="w-full" style={{ aspectRatio: aspect }}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}

/**
 * The level screen's backdrop: `hex.riv`'s "ModuleBackground 2" repeated top to bottom
 * to cover `height`, every copy playing its state machine. Fills a `relative`
 * parent, behind its content.
 */
export function LevelBackground({ width, height }: { width: number; height: number }) {
  const [aspect, setAspect] = useState<number>(LEVEL_BACKGROUND.fallbackAspect);
  const tileHeight = width / aspect;
  const count = tileHeight > 0 ? Math.max(1, Math.ceil(height / tileHeight)) : 1;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Tile key={i} aspect={aspect} onAspect={i === 0 ? setAspect : undefined} />
      ))}
    </div>
  );
}
