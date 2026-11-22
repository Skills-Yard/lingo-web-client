"use client";

import { Canvas } from "@react-three/fiber";
import { AnimatedCharacter, SceneLights } from "./CharacterScene";
import { retryCachedCharacter, useCachedCharacter } from "./characterCache";
import type { CharacterId } from "./characterLook";

/**
 * The 3D character on the mentor picker's card: the real model (`Male.glb`, `girl.glb`,
 * `Male_anime.glb`), idling, framed from the head to the thighs. One canvas for the whole
 * picker, with the model swapped as the arrows move (a canvas made per card would make a
 * WebGL context each time). While a model loads the card shows its progress.
 *
 * The camera is level and straight on, like the shared canvas's (`portraitHost.tsx`); every
 * model is 1.8 tall standing on y = 0, so this shows 1.38 of height: 0.56 to 1.94.
 */
const CAMERA_POSITION: [number, number, number] = [0, 1.25, 2.4];
const NO_ROTATION: [number, number, number] = [0, 0, 0];

/** The card only shows the character idling; it never loops into anything. */
const ignoreLoop = () => {};

/** Downloading is this much of the percentage; parsing and decoding the textures is the rest. */
const DOWNLOAD_SHARE = 0.85;

type MentorStageProps = {
  id: CharacterId;
  name: string;
  /** The card's colour, for the loading ring. */
  accent: string;
};

export function MentorStage({ id, name, accent }: MentorStageProps) {
  const preview = useCachedCharacter(id);
  const character = preview.status === "ready" ? preview.character : null;
  const fraction = preview.status === "loading" ? (preview.phase === "download" ? preview.fraction * DOWNLOAD_SHARE : DOWNLOAD_SHARE) : 0;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.1, far: 50, position: CAMERA_POSITION, rotation: NO_ROTATION }}
        gl={{ antialias: true, alpha: true }}
        // No tone mapping, as on the other canvases: the textures keep their own colours.
        flat
      >
        {character && <SceneLights lights={character.lights} />}
        {character && (
          <AnimatedCharacter key={id} character={character} animationId="idle-b" runToken={0} playing lipSync={false} onLoop={ignoreLoop} />
        )}
      </Canvas>

      {!character && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[14px] leading-5 font-medium text-[#444444] dark:text-white">
          {preview.status === "error" ? (
            <>
              <p>{name} didn&apos;t load.</p>
              <button
                type="button"
                onClick={() => retryCachedCharacter(id)}
                className="cursor-pointer rounded-full px-4 py-1 text-white"
                style={{ backgroundColor: accent }}
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <span
                aria-hidden
                className="size-9 animate-spin rounded-full border-[3px] border-black/10 dark:border-white/15"
                style={{ borderTopColor: accent }}
              />
              <p>
                Loading {name}…
                {fraction > 0 ? ` ${Math.round(fraction * 100)}%` : ""}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
