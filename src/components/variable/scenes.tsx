"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { VARIABLE_SCENES } from "@/lib/rive/runtime";
import { attachScene, detachScene, setSceneValues, type SceneName } from "@/lib/rive/variableHost";

/** Where a scene starts in the Figma frame, on every screen, as the Sequence room does (see `SceneBackdrop`): Hex's bubble stands clear above the heads. */
const FIGMA_TOP = 230;
/** The widest a scene is drawn on screen (px), as for the Sequence room (see `SceneBackdrop`): a phone's width fills the screen, a wider one gets the plain background at its sides. */
const MAX_SCREEN_W = 560;
/** The scene's width on the stage (a CSS length): the stage's full width, up to `MAX_SCREEN_W` on screen (the stage is scaled, so what is capped in screen px is divided by its scale). */
const SCENE_WIDTH = `min(var(--stage-w, ${VARIABLE_SCENES.width}px), calc(${MAX_SCREEN_W}px / var(--stage-scale, 1)))`;
/** Fades the scene into the page at its top and bottom only: its sides are left sharp. The bottom fade is short, as the scenes put labels and price tags near their lower edge. */
const FADE = "linear-gradient(180deg, transparent 0, #000 28px, #000 calc(100% - 26px), transparent 100%)";

/** The scene's one canvas (see `variableHost`), moved into this slot, which it fills. */
function SceneSlot({ scene }: { scene: SceneName }) {
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

/** A scene behind a screen, the artboard's own size at the stage's width: not boxed, and not shrunk for what stands over it. */
function SceneFrame({ scene }: { scene: SceneName }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center" style={{ top: stageTop(FIGMA_TOP), maskImage: FADE, WebkitMaskImage: FADE }}>
      <div className="relative shrink-0" style={{ width: SCENE_WIDTH, aspectRatio: `${VARIABLE_SCENES.width} / ${VARIABLE_SCENES.height}` }}>
        <SceneSlot scene={scene} />
      </div>
    </div>
  );
}

/**
 * The trail ("VAR_TrekScene"), behind every screen that has no scene of its own. The
 * file keeps what it was last given, so each screen says all three: `thirsty` (the
 * friends are thirsty), `noWater` (the river is gone) and `thinking` (a question is open).
 */
export function TrekBackdrop({ thirsty = false, noWater = false, thinking = false }: { thirsty?: boolean; noWater?: boolean; thinking?: boolean }) {
  useEffect(() => {
    setSceneValues("trek", { thirsty, noWater, thinking });
  }, [thirsty, noWater, thinking]);
  return <SceneFrame scene="trek" />;
}

/** The bottle ("VAR_Bottle"); the screen drives it (see `variableHost`'s `setSceneValues` and `rampBottleLevel`). */
export function BottleBackdrop() {
  return <SceneFrame scene="bottle" />;
}

/** The four objects ("VAR_Items"); the screen sets `pick` and fires `correct` / `wrong`. */
export function ItemsBackdrop() {
  return <SceneFrame scene="items" />;
}

/** The shop counter ("VAR_Shop"); each screen says what it shows and fires its triggers (see `ShopDrive`). */
export function ShopBackdrop() {
  return <SceneFrame scene="shop" />;
}

/** The wallet ("VAR_Wallet"); each screen says what it shows and fires its triggers (see `WalletDrive`). */
export function WalletBackdrop() {
  return <SceneFrame scene="wallet" />;
}

/** The labelled bottles ("VAR_Names"), their names always shown; the screen shuffles them. */
export function NamesBackdrop() {
  useEffect(() => {
    setSceneValues("names", { showLabels: true });
  }, []);
  return <SceneFrame scene="names" />;
}
