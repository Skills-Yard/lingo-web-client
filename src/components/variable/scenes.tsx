"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, type Transition } from "framer-motion";
import { HEX_SLOT } from "@/components/level-two/HexBubble";
import { VARIABLE_SCENES } from "@/lib/rive/runtime";
import { attachScene, detachScene, setSceneValues, type SceneName } from "@/lib/rive/variableHost";

/** Where what is under a one-line title starts (stage px). */
export const BELOW_TITLE = 125;
/**
 * How far Hex's row (him and his bubble) is lifted from `BELOW_TITLE`: as high as it can go under the title (the
 * bubble's top edge is 12px below the row's top, so 8px under the title's box). Its lower edge (86px tall, with its
 * 3px edge) then stands above the picture's top: the trail's heads (y 222) and the bottle's open lid (y 220) on a
 * phone. On a wider screen the scene is drawn larger from the same top, so its picture starts lower still.
 */
export const HEX_LIFT = 12;
/** Where Hex's row starts on every screen with a one-line title (stage px). */
export const HEX_ROW_TOP = BELOW_TITLE - HEX_LIFT;
/** The bubble's height (its three-line size, as every Variable bubble is) and the flat edge drawn under it (px). */
const BUBBLE_HEIGHT = 86;
const BUBBLE_EDGE = 3;
/**
 * Where a scene starts on every screen (stage px): where Hex's bubble ends, edge included (y 214 on a phone), so no
 * part of the picture, nor of the sky fading in at its top, is under the bubble. That is 21 below where the Sequence
 * room starts (Figma 230, see `SceneBackdrop`). Any lower and the bottle's and the name bottles' bases (they end at
 * y 476 on a phone) go further under the answer cards, which start at 471; as it is, only their ground shadow and
 * the last few px of glass are covered.
 */
const SCENE_TOP = HEX_ROW_TOP + (HEX_SLOT - BUBBLE_HEIGHT) / 2 + BUBBLE_HEIGHT + BUBBLE_EDGE;
/** How far a scene rises once a right answer has sent Hex and his bubble away (px): it takes the room they leave, until it starts where the bubble started, under the title. */
const SCENE_LIFT = SCENE_TOP - BELOW_TITLE;
/** Its way up: it sets off as they do (the bubble and Hex are gone in about 0.3s) and settles after them. */
const LIFT_UP: Transition = { duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] };
/** And back down, for a stage that starts over. */
const LIFT_DOWN: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };
/** The widest a scene is drawn on screen (px), as for the Sequence room (see `SceneBackdrop`): a phone's width fills the screen, a wider one gets the plain background at its sides. */
const MAX_SCREEN_W = 560;
/** The scene's width on the stage (a CSS length): the stage's full width, up to `MAX_SCREEN_W` on screen (the stage is scaled, so what is capped in screen px is divided by its scale). */
const SCENE_WIDTH = `min(var(--stage-w, ${VARIABLE_SCENES.width}px), calc(${MAX_SCREEN_W}px / var(--stage-scale, 1)))`;
/** Where a scene ends (a CSS length, stage px): its top, plus its height, which follows its width (y 520 on a phone). For what stands on the scene's bottom edge. */
export const SCENE_BOTTOM = `calc(${SCENE_TOP}px + ${SCENE_WIDTH} * ${VARIABLE_SCENES.height} / ${VARIABLE_SCENES.width})`;
/** `SCENE_BOTTOM` for a scene drawn at its own size (stage px): what it is on a 390px-wide phone, and the lowest anything pinned to the edge should go, as a wider window draws the scene larger and the edge lower, into what stands under it. */
export const SCENE_BOTTOM_PHONE = SCENE_TOP + VARIABLE_SCENES.height;
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

/**
 * A scene behind a screen, the artboard's own size at the stage's width: not boxed, and not shrunk for what stands
 * over it. `lifted`: it has risen into the room Hex and his bubble left (see `SCENE_LIFT`).
 */
function SceneFrame({ scene, lifted = false }: { scene: SceneName; lifted?: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ y: lifted ? -SCENE_LIFT : 0 }}
      transition={lifted ? LIFT_UP : LIFT_DOWN}
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
      style={{ top: SCENE_TOP, maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <div className="relative shrink-0" style={{ width: SCENE_WIDTH, aspectRatio: `${VARIABLE_SCENES.width} / ${VARIABLE_SCENES.height}` }}>
        <SceneSlot scene={scene} />
      </div>
    </motion.div>
  );
}

/**
 * A window onto part of a scene, for a scene shown in a card instead of behind the screen: the scene is drawn
 * `zoom` times its own size and shifted so that `crop` (artboard px) fills the window, which clips the rest.
 * The scene is the one canvas the screens share (see `variableHost`), so it can't be behind the screen at the
 * same time.
 */
export function SceneWindow({ scene, crop, zoom, className = "" }: { scene: SceneName; crop: { x: number; y: number; width: number; height: number }; zoom: number; className?: string }) {
  return (
    <div aria-hidden className={`relative shrink-0 overflow-hidden ${className}`} style={{ width: crop.width * zoom, height: crop.height * zoom }}>
      <div className="absolute" style={{ left: -crop.x * zoom, top: -crop.y * zoom, width: VARIABLE_SCENES.width * zoom, height: VARIABLE_SCENES.height * zoom }}>
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
export function TrekBackdrop({ thirsty = false, noWater = false, thinking = false, lifted = false }: { thirsty?: boolean; noWater?: boolean; thinking?: boolean; lifted?: boolean }) {
  useEffect(() => {
    setSceneValues("trek", { thirsty, noWater, thinking });
  }, [thirsty, noWater, thinking]);
  return <SceneFrame scene="trek" lifted={lifted} />;
}

/** The bottle ("VAR_Bottle"); the screen drives it (see `variableHost`'s `setSceneValues` and `rampBottleLevel`). */
export function BottleBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="bottle" lifted={lifted} />;
}

/** The pair of variable cards ("VAR_VarCard"); the screen sets their names and values (see `VarCardDrive`). */
export function VarCardBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="varCard" lifted={lifted} />;
}

/** The four objects ("VAR_Items"); the screen sets `pick` and fires `correct` / `wrong`. */
export function ItemsBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="items" lifted={lifted} />;
}

/** The shop counter ("VAR_Shop"); each screen says what it shows and fires its triggers (see `ShopDrive`). */
export function ShopBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="shop" lifted={lifted} />;
}

/** The wallet ("VAR_Wallet"); each screen says what it shows and fires its triggers (see `WalletDrive`). */
export function WalletBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="wallet" lifted={lifted} />;
}

/** The labelled bottles ("VAR_Names"), their names always shown; the screen shuffles them. */
export function NamesBackdrop({ lifted = false }: { lifted?: boolean }) {
  useEffect(() => {
    setSceneValues("names", { showLabels: true });
  }, []);
  return <SceneFrame scene="names" lifted={lifted} />;
}
