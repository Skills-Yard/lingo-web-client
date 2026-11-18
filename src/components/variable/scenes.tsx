"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
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
/** `SCENE_BOTTOM` for a scene that has risen into the room under the title (see `SCENE_LIFT`): where a screen with no Hex bubble, whose scene starts there, has it end. */
export const SCENE_BOTTOM_LIFTED = `calc(${SCENE_BOTTOM} - ${SCENE_LIFT}px)`;
/** `SCENE_BOTTOM_LIFTED` for a scene drawn at its own size (stage px; y 431 on a phone): where the answers' room starts once a check has raised the scene. */
export const SCENE_BOTTOM_LIFTED_PHONE = SCENE_BOTTOM_PHONE - SCENE_LIFT;
/** The clear space (px) kept between a scene's bottom edge and what stands under it: the answers, the notes, the takeaways. */
export const GAP_BELOW_SCENE = 12;
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
function SceneFrame({ scene, lifted = false, children }: { scene?: SceneName; lifted?: boolean; children?: ReactNode }) {
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
        {scene ? <SceneSlot scene={scene} /> : children}
      </div>
    </motion.div>
  );
}

/*
 * The pair of scenes ("VAR_Bottle" on the left, "VAR_Wallet" on the right): two whole artboards drawn at `PAIR_SCALE`
 * of the scene's width, side by side. Each is placed by what it draws (its `*_SPAN`, artboard px: the bottle with its
 * amount tag and open lid, the wallet with its card, notes and tag), `PAIR_MARGIN` in from the screen's edge, so the
 * rest of the artboard (empty hills) runs off the screen's edge or under the other one. They are blended where they meet
 * (the middle of the gap between the two drawings): both are the same landscape on the same ground, so the two
 * pedestals read as one long one. Below, everything is a share of the scene's width.
 */
const PAIR_SCALE = 0.72;
const PAIR_MARGIN = 10;
const BOTTLE_SPAN = { from: 136, to: 329 };
const WALLET_SPAN = { from: 90, to: 360 };
/** The most the two blend over (px), and the clear room kept on each side of it. */
const PAIR_BLEND_MAX = 30;
const PAIR_BLEND_CLEAR = 3;
/** The pair fades out at its top and bottom edges (px), like a single scene (`FADE`), a little shorter as it is drawn smaller. */
const PAIR_FADE_V = "linear-gradient(180deg, transparent 0, #000 20px, #000 calc(100% - 18px), transparent 100%)";

const PAIR_LEFT = { left: PAIR_MARGIN - BOTTLE_SPAN.from * PAIR_SCALE, right: VARIABLE_SCENES.width - PAIR_MARGIN - WALLET_SPAN.to * PAIR_SCALE };
const BOTTLE_ENDS = PAIR_MARGIN + (BOTTLE_SPAN.to - BOTTLE_SPAN.from) * PAIR_SCALE;
const WALLET_STARTS = PAIR_LEFT.right + WALLET_SPAN.from * PAIR_SCALE;
const PAIR_BLEND = Math.min(PAIR_BLEND_MAX, WALLET_STARTS - BOTTLE_ENDS - 2 * PAIR_BLEND_CLEAR);
const PAIR_SEAM = (BOTTLE_ENDS + WALLET_STARTS) / 2;

/**
 * Where an artboard of the pair stands (its `left`, a share of the scene's width) and how it blends into its neighbour. The
 * wallet is the layer underneath and is opaque from where the blend starts; the bottle is drawn over it and fades out across
 * the blend. (Two half-transparent layers would let the white page show through in the middle as a pale band.)
 */
const pairPlace = (side: "left" | "right") => {
  const left = PAIR_LEFT[side];
  const width = VARIABLE_SCENES.width;
  const edge = (x: number) => `${(((x - left) / (PAIR_SCALE * width)) * 100).toFixed(2)}%`;
  const from = PAIR_SEAM - PAIR_BLEND / 2;
  const to = PAIR_SEAM + PAIR_BLEND / 2;
  const across = side === "left" ? `linear-gradient(90deg, #000 ${edge(from)}, transparent ${edge(to)})` : `linear-gradient(90deg, transparent ${edge(from - PAIR_BLEND_CLEAR)}, #000 ${edge(from)})`;
  return { left: `${((left / width) * 100).toFixed(2)}%`, mask: `${across}, ${PAIR_FADE_V}` };
};

function PairSlot({ scene, side }: { scene: SceneName; side: "left" | "right" }) {
  const { left, mask } = pairPlace(side);
  return (
    <div
      className="absolute"
      style={{
        left,
        top: `${((1 - PAIR_SCALE) / 2) * 100}%`,
        width: `${PAIR_SCALE * 100}%`,
        aspectRatio: `${VARIABLE_SCENES.width} / ${VARIABLE_SCENES.height}`,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <SceneSlot scene={scene} />
    </div>
  );
}

/** The bottle and the wallet side by side ("VAR_Bottle", "VAR_Wallet"); the screen sets the water and the balance (see `BottleWalletDrive`). */
export function BottleWalletBackdrop({ lifted = false }: { lifted?: boolean }) {
  return (
    <SceneFrame lifted={lifted}>
      <div className="absolute inset-0 overflow-hidden">
        <PairSlot scene="wallet" side="right" />
        <PairSlot scene="bottle" side="left" />
      </div>
    </SceneFrame>
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

/** What the pair of variable cards says: the name and value on each. */
export type VarCards = { name1: string; val1: string; name2: string; val2: string };

/** Screen 14's cards (the file's own): the bottle's level and its size. */
export const NAME_VALUE_CARDS: VarCards = { name1: "water_level", val1: "550 ml", name2: "bottle_capacity", val2: "1,000 ml" };

/** A part of the artboard, in its own px (see `SceneOverlay`). */
export type ArtboardRect = { x: number; y: number; width: number; height: number };

/** Where `rect` (artboard px) is, as a style for something placed in a `SceneOverlay`. */
export const artboardRect = ({ x, y, width, height }: ArtboardRect) => ({
  left: `${(x / VARIABLE_SCENES.width) * 100}%`,
  top: `${(y / VARIABLE_SCENES.height) * 100}%`,
  width: `${(width / VARIABLE_SCENES.width) * 100}%`,
  height: `${(height / VARIABLE_SCENES.height) * 100}%`,
});

/**
 * A box laid exactly over the scene behind the screen (see `SceneFrame`, at rest, not lifted), for what goes on its
 * parts, such as something to tap on the artboard: place each with `artboardRect`. It is placed inside what starts at
 * `BELOW_TITLE` (an interaction's area, under a one-line title), and takes no taps itself, only what is in it.
 */
export function SceneOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: SCENE_TOP - BELOW_TITLE }}>
      <div className="relative shrink-0" style={{ width: SCENE_WIDTH, aspectRatio: `${VARIABLE_SCENES.width} / ${VARIABLE_SCENES.height}` }}>
        {children}
      </div>
    </div>
  );
}

/** The classroom and its attendance board ("VAR_Classroom"); the screen sets the counts and what is lit (see `ClassroomDrive`). */
export function ClassroomBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="classroom" lifted={lifted} />;
}

/** The little app on a phone ("VAR_MiniApp"); the screen sets what it shows and lights (see `MiniAppDrive`). */
export function MiniAppBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="miniApp" lifted={lifted} />;
}

/** The chapter's wrap-up ("VAR_Complete"): the idea with the things the chapter used around it; the screen sets `focus` and fires `celebrate`. */
export function CompleteBackdrop({ lifted = false }: { lifted?: boolean }) {
  return <SceneFrame scene="complete" lifted={lifted} />;
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
