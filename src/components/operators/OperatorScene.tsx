"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { attachScene, detachScene, showScene, type OperatorSceneName, type SceneTexts, type SceneValues } from "@/lib/rive/operatorsHost";
import { OPERATOR_SCENES } from "@/lib/rive/runtime";

/** The widest a scene is drawn on the stage (px): a phone's width fills the screen, a wider window gets the plain page at its sides. */
const MAX_WIDTH = 480;
/**
 * Fades the scene into the page on every side, so it never reads as a box: a stage that is short of room draws it
 * smaller than the screen is wide, and its edges would show.
 */
const FADE = "linear-gradient(180deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%), linear-gradient(90deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%)";

/** The scene's one canvas (see `operatorsHost`), moved into this slot, which it fills. */
function SceneSlot({ scene }: { scene: OperatorSceneName }) {
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const host = attachScene(scene, element);
    const observer = new ResizeObserver(() => host.rive?.resizeDrawingSurfaceToCanvas());
    observer.observe(element);
    return () => {
      observer.disconnect();
      detachScene(scene);
    };
  }, [scene]);

  return <div ref={slot} className="absolute inset-0" />;
}

/**
 * An Operators scene (see `OPERATOR_SCENES`) as the picture of a question, over its answers: it is not tapped.
 * `values` is the data it shows (every other value is as the file has it), `texts` the words it has in place of the
 * file's own (by their place in the artboard).
 */
export function OperatorScene({ scene, values, texts, width }: { scene: OperatorSceneName; values: SceneValues; texts?: SceneTexts; /** How wide it is drawn (a CSS length), in place of the stage's width: a stage with more under it draws it smaller. */ width?: string }) {
  const key = JSON.stringify(values);
  const textsKey = JSON.stringify(texts ?? {});

  useEffect(() => {
    showScene(scene, JSON.parse(key) as SceneValues, JSON.parse(textsKey) as SceneTexts);
  }, [scene, key, textsKey]);

  return (
    <div
      aria-hidden
      className="pointer-events-none relative shrink-0 dark:brightness-[0.75]"
      style={{
        width: width ?? `min(var(--stage-w, ${OPERATOR_SCENES.width}px), ${MAX_WIDTH}px)`,
        aspectRatio: `${OPERATOR_SCENES.width} / ${OPERATOR_SCENES.height}`,
        maskImage: FADE,
        WebkitMaskImage: FADE,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <SceneSlot scene={scene} />
    </div>
  );
}
