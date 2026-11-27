"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, type Transition } from "framer-motion";
import { attachScene, detachScene, playSceneIntro, showScene, type SceneIntro, type SceneTexts, type SceneValues } from "@/lib/rive/datatypesHost";
import { DATATYPES_SCENES, type DatatypesSceneName } from "@/lib/rive/runtime";

/** How far Hex's row (him and his bubble) is lifted on a screen with a scene, up into the title's room (px): the Variable module's. */
export const HEX_LIFT = 12;
/** Where a scene starts, from the top of Hex's row (px): where his bubble ends, edge included (86 tall, centred in his 110px slot, under a 3px edge). */
const SCENE_BELOW_ROW = 101;
/** The widest a scene is drawn on screen (px): a phone's width fills the screen, a wider one gets the plain background at its sides. */
const MAX_SCREEN_W = 560;
/**
 * The widest a scene is drawn on the stage (px): the stage is 844 tall however wide it gets, and a phone shaped 9:16 (the
 * widest a phone is) makes it 475 wide. The scene always fills the device's width (it is never narrower than the screen),
 * so it has to be at least that wide, and so about 70px taller than its own size there: what stands under it (see
 * `UnderScene`) then sits over its floor, instead of under the main button. A window wider than a phone gets the plain
 * background at the scene's sides, as the scene stops growing here (a wider one would be taller than the room it has).
 */
const MAX_SCENE_W = 480;
/** The scene's width on the stage (a CSS length): the stage's full width, which is the device's width, up to `MAX_SCENE_W` and up to `MAX_SCREEN_W` on screen (the stage is scaled, so what is capped in screen px is divided by its scale). */
const SCENE_WIDTH = `min(var(--stage-w, ${DATATYPES_SCENES.width}px), calc(${MAX_SCREEN_W}px / var(--stage-scale, 1)), ${MAX_SCENE_W}px)`;
/** Fades the scene into the page at its top and bottom only: its sides are left sharp. */
const FADE = "linear-gradient(180deg, transparent 0, #000 28px, #000 calc(100% - 26px), transparent 100%)";
/** Its way up once a right answer has sent Hex and his bubble away: it sets off as they do and settles after them. */
export const LIFT_UP: Transition = { duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] };
/** And back down, for a stage that starts over. */
export const LIFT_DOWN: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

/**
 * How large (times its own size) every scene is drawn on a stage with nothing under it, no options and no buttons (a
 * look-only stage): the same for all of them. Its sides run past the screen's edges; the stage after it, with something
 * to tap or pick, draws the scene at its own size again.
 */
export const LARGE_SCENE = 1.3;

/**
 * `LIFT_UP` / `LIFT_DOWN` as a CSS transition of `property`, for what hangs from the scene (a question's answers, an interaction under
 * it): it sets off and settles with the scene.
 */
export const liftCss = (property: string, lifted: boolean) => `${property} ${lifted ? 0.55 : 0.4}s cubic-bezier(0.22, 1, 0.36, 1) ${lifted ? 0.12 : 0}s`;

/** How a scene's size changes from one stage to the next: slow and smooth, so it is watched settling. */
const SCALE_EASE: Transition = { duration: 0.9, ease: [0.45, 0, 0.2, 1] };

/** Where a scene starts (stage px) on a screen whose title block ends at `titleEnd`. */
export const sceneTop = (titleEnd: number) => titleEnd - HEX_LIFT + SCENE_BELOW_ROW;

/** How far (px) a scene rises once Hex's line above it has gone: into the room his row left. What stands under the scene can rise with it. */
export const sceneLift = (titleEnd: number) => sceneTop(titleEnd) - titleEnd;

/** The scene's height on the stage (a CSS length): it follows its width (y 520 on a phone). */
export const sceneHeight = `calc(${SCENE_WIDTH} * ${DATATYPES_SCENES.height} / ${DATATYPES_SCENES.width})`;

/** The scene's one canvas (see `datatypesHost`), moved into this slot, which it fills. */
function SceneSlot({ scene }: { scene: DatatypesSceneName }) {
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
 * A scene behind a screen (see `DATATYPES_SCENES`), the artboard's own size at the stage's width: not boxed, and
 * not shrunk for what stands over it. `values` is what it shows, and `texts` the words it has in place of the file's
 * own (see `SceneTexts`). `titleEnd` is where the screen's title block ends. `lifted`: a right answer has sent Hex
 * and his bubble away, and the scene rises into their room.
 */
export function SceneBackdrop({
  scene,
  values,
  texts,
  intro,
  titleEnd,
  lifted = false,
  scale = 1,
  maxHeight,
  cutMove,
  top: startsAt,
}: {
  scene: DatatypesSceneName;
  values: SceneValues;
  texts?: SceneTexts;
  /** What plays as the scene shows (see `SceneIntro`). */
  intro?: SceneIntro;
  titleEnd: number;
  lifted?: boolean;
  scale?: number;
  /** Where it starts (a CSS length, stage px), in place of just under Hex's row: for a screen with no Hex line, whose scene stands where the screen wants it. */
  top?: string;
  /**
   * The most height (a CSS length) the scene shows. The scene always fills the device's width, so on a short, wide screen it is taller than the room
   * the controls leave it: it is then cut at that height, from the bottom (its floor), and fades out there, instead of the controls standing over it.
   */
  maxHeight?: string;
  /** A CSS transition for `maxHeight`, where it changes with the stage (the scene gives way to the answers once checked), so the cut is eased in, not a jump. */
  cutMove?: string;
}) {
  const top = startsAt ?? sceneTop(titleEnd);
  const key = JSON.stringify(values);
  const textsKey = JSON.stringify(texts ?? {});
  useEffect(() => {
    showScene(scene, JSON.parse(key) as SceneValues, JSON.parse(textsKey) as SceneTexts);
  }, [scene, key, textsKey]);
  // The intro: plays when the scene shows, not again when its data changes.
  const introKey = JSON.stringify(intro ?? null);
  useEffect(() => {
    const wanted = JSON.parse(introKey) as SceneIntro | null;
    if (wanted) playSceneIntro(scene, wanted);
  }, [scene, introKey]);

  return (
    <motion.div
      aria-hidden
      initial={false}
      // `scale`: how large it is drawn (1 is its own size), from its top edge; a change (a larger look at it on one stage, its own size on the next) is eased slowly.
      animate={{ y: lifted ? -sceneLift(titleEnd) : 0, scale }}
      transition={{ ...(lifted ? LIFT_UP : LIFT_DOWN), scale: SCALE_EASE }}
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center overflow-hidden dark:brightness-[0.75]"
      style={{ top, maxHeight, transition: cutMove, maskImage: FADE, WebkitMaskImage: FADE, transformOrigin: "50% 0%" }}
    >
      <div className="relative shrink-0" style={{ width: SCENE_WIDTH, aspectRatio: `${DATATYPES_SCENES.width} / ${DATATYPES_SCENES.height}` }}>
        <SceneSlot scene={scene} />
      </div>
    </motion.div>
  );
}
