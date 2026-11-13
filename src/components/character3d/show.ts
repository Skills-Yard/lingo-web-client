export type Picture = {
  src: string;
  alt: string;
  /** The file's own size: it only sets the picture's shape, it is drawn at a size that fits the stage. */
  width: number;
  height: number;
};

/**
 * Fills the stage behind the character, whatever plays.
 * bg.webp is bg.png (4.4 MB) resized to 1200 px wide: if bg.png changes, make it again.
 */
export const BACKDROP = "/bg/bg.webp";

/** What goes with one animation on the stage. */
export type Scene = {
  /**
   * Shown one at a time, a new one each time the animation starts over. After the
   * last there is a round with none (just the backdrop), and then it begins again.
   */
  pictures?: readonly Picture[];
  /** Spoken while the animation plays, from its start; the animation lasts as long as the voice. */
  voice?: string;
};

/** By animation id (see `ANIMATIONS` in `character.ts`). An animation that isn't here has nothing with it. */
export const SCENES: Readonly<Record<string, Scene>> = {
  gesture: {
    pictures: [
      { src: "/bg/botal.png", alt: "A bottle", width: 204, height: 208 },
      { src: "/bg/mountain.png", alt: "A mountain with a flag", width: 252, height: 254 },
      { src: "/bg/variable.png", alt: "A variable", width: 252, height: 254 },
    ],
  },
  // Any clip will do; the mouth follows the model's own lip-sync clip, so it matches best a line it was made for.
  talking: { voice: "/audios/sequenceModuleAudios/Lets_get_ready_again_Your_shoes_are_already_on.mp3" },
};

type TourStep = {
  /** An animation id. */
  id: string;
  /** How many times it plays through. Left out for one with a voice, which lasts as long as the voice. */
  loops?: number;
};

/** "Play all": the animations one after another, each blending into the next. */
export const TOUR: readonly TourStep[] = [
  { id: "levitate", loops: 2 },
  { id: "idle-b", loops: 1 },
  // One round per picture: the bottle, the mountain, the variable, then the backdrop alone.
  { id: "gesture", loops: 4 },
  { id: "talking" },
];

/** What the character goes back to once "Play all" has run through. */
export const TOUR_REST_ID = "idle-b";

/** The voice that "Play all" gets to, if any of its steps has one. */
export const TOUR_VOICE: string | undefined = TOUR.flatMap(({ id }) => SCENES[id]?.voice ?? [])[0];

/** Every picture, so they can all be loaded before their animation comes. */
export const PICTURES: readonly Picture[] = Object.values(SCENES).flatMap(({ pictures }) => pictures ?? []);

/** The picture on show in round `loops` of an animation (0 is its first round), or none. */
export const pictureAt = (pictures: readonly Picture[], loops: number): Picture | null =>
  pictures[loops % (pictures.length + 1)] ?? null;
