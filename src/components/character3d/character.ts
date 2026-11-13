import {
  AnimationClip,
  Box3,
  Group,
  Mesh,
  QuaternionKeyframeTrack,
  SkinnedMesh,
  Texture,
  Vector3,
  VectorKeyframeTrack,
  type KeyframeTrack,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** The character: a Mixamo rig with its skin textures, and its own animation. */
const MODEL_SRC = "/animations/Bouncing Fight Idle.glb";
/** Its size on disk: the progress bar's total until (or unless) the server reports a usable `Content-Length`. */
const MODEL_BYTES = 75_237_812;

type AnimationSpec = {
  id: string;
  label: string;
  /** Loops until another is picked; otherwise plays once and holds its last pose. */
  loop: boolean;
  /** The file the clip is in: a Mixamo animation exported "without skin". `null` is the model's own clip. */
  src: string | null;
};

/**
 * Every animation the page offers. To add one, export it from Mixamo (same
 * character skeleton, "without skin"), put the .glb in `public/animations` and
 * add a line here: it is retargeted onto the character when it loads.
 */
export const ANIMATIONS: readonly AnimationSpec[] = [
  { id: "fight-idle", label: "Bouncing Fight Idle", loop: true, src: null },
  { id: "stand-up", label: "Zombie Stand Up", loop: false, src: "/animations/Zombie Stand Up.glb" },
];

/** The character is scaled to this height, in scene units (metres), whatever units the file is in. */
export const CHARACTER_HEIGHT = 1.8;

export type CharacterAnimation = {
  id: string;
  label: string;
  loop: boolean;
  clip: AnimationClip;
};

export type Character = {
  /** What goes in the scene: the model, scaled to `CHARACTER_HEIGHT` and standing on y = 0. */
  scene: Group;
  /** The rig as loaded; the animation mixer's root. */
  model: Group;
  animations: CharacterAnimation[];
};

export type LoadProgress = {
  /** Downloading the model, then parsing it and decoding its textures. */
  phase: "download" | "prepare";
  /** 0 to 1; only meaningful while downloading. */
  fraction: number;
};

type LoadOptions = {
  signal: AbortSignal;
  onProgress: (progress: LoadProgress) => void;
};

/**
 * Production builds name each `public/animations` file `…?v=<content hash>` (see
 * `next.config.ts`) and let the browser keep that URL for a year; without it (dev)
 * the file is revalidated instead. That matters for a file this big.
 */
const versions: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_RIVE_VERSIONS ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
})();

const versionedUrl = (src: string) => {
  const version = versions[src];
  return version ? `${src}?v=${version}` : src;
};

type DownloadOptions = {
  src: string;
  signal: AbortSignal;
  /** Expected size and a progress callback, for a file big enough to need a progress bar. */
  progress?: { bytes: number; onProgress: (fraction: number) => void };
};

const download = async ({ src, signal, progress }: DownloadOptions): Promise<ArrayBuffer> => {
  const response = await fetch(versionedUrl(src), { signal });
  if (!response.ok) throw new Error(`${src} didn't load (HTTP ${response.status}).`);
  if (!progress || !response.body) return response.arrayBuffer();

  // A compressed response streams more (decoded) bytes than `Content-Length` counts.
  const length = Number(response.headers.get("Content-Length"));
  const total = length && !response.headers.get("Content-Encoding") ? length : progress.bytes;

  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  let percent = -1;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array<ArrayBuffer>);
    received += value.byteLength;
    // One update per whole percent, not one per network chunk.
    const next = Math.min(Math.floor((received / total) * 100), 100);
    if (next !== percent) {
      percent = next;
      progress.onProgress(next / 100);
    }
  }
  return new Blob(chunks).arrayBuffer();
};

/** Lets the browser paint (the "Preparing" message) before the heavy parse starts. */
const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

/** Parses a GLB; resolves once its textures have decoded, so the character never appears untextured. */
const parseGlb = (buffer: ArrayBuffer) => new GLTFLoader().parseAsync(buffer, "");

const HIPS = /^mixamorig\d*_Hips$/;

const findHips = (root: Object3D) => {
  const objects: Object3D[] = [];
  root.traverse((object) => objects.push(object));
  return objects.find((object) => HIPS.test(object.name));
};

/**
 * Makes a clip exported with another Mixamo skeleton play on this one. The two
 * files name their bones with a different prefix (`mixamorig_` and `mixamorig1_`),
 * so the tracks are renamed; and only the rotations and the hips' movement are
 * kept, since every other bone's position is that character's own bone length,
 * not motion (copying it would reshape the character).
 */
const retarget = (clip: AnimationClip, source: Object3D, target: Object3D, id: string) => {
  const from = findHips(source);
  const to = findHips(target);
  if (!from || !to) {
    throw new Error(`The ${id} animation needs a Mixamo skeleton (bones named mixamorig…_Hips).`);
  }
  const fromPrefix = from.name.replace(/Hips$/, "");
  const toPrefix = to.name.replace(/Hips$/, "");
  // A character whose hips stand lower moves its hips proportionally less.
  const hipsScale = from.position.y > 0 && to.position.y > 0 ? to.position.y / from.position.y : 1;

  const tracks: KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf(".");
    const bone = track.name.slice(0, dot);
    const property = track.name.slice(dot + 1);
    if (!bone.startsWith(fromPrefix)) continue;

    const name = `${toPrefix}${bone.slice(fromPrefix.length)}.${property}`;
    if (property === "quaternion") {
      tracks.push(new QuaternionKeyframeTrack(name, track.times, track.values));
    } else if (property === "position" && bone === from.name) {
      tracks.push(new VectorKeyframeTrack(name, track.times, track.values.map((v) => v * hipsScale)));
    }
  }
  return new AnimationClip(id, clip.duration, tracks);
};

const loadAnimations = async (model: Group, files: Map<string, ArrayBuffer>, own: AnimationClip[]) =>
  Promise.all(
    ANIMATIONS.map(async ({ id, label, loop, src }): Promise<CharacterAnimation> => {
      if (src === null) {
        if (!own[0]) throw new Error(`${MODEL_SRC} has no animation.`);
        return { id, label, loop, clip: own[0] };
      }
      const buffer = files.get(src);
      if (!buffer) throw new Error(`${src} was not downloaded.`);
      const gltf = await parseGlb(buffer);
      if (!gltf.animations[0]) throw new Error(`${src} has no animation.`);
      return { id, label, loop, clip: retarget(gltf.animations[0], gltf.scene, model, id) };
    }),
  );

/** Scales the model to `CHARACTER_HEIGHT`, centres it on the origin and stands it on y = 0. */
const stand = (model: Group) => {
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = Number.isFinite(size.y) && size.y > 0 ? CHARACTER_HEIGHT / size.y : 1;

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;

  // A skinned mesh's bounds are those of its bind pose, so it would be culled
  // (vanish) while it animates outside them.
  model.traverse((object) => {
    if (object instanceof Mesh) object.frustumCulled = false;
  });

  const scene = new Group();
  scene.add(model);
  scene.scale.setScalar(scale);
  return scene;
};

export const loadCharacter = async ({ signal, onProgress }: LoadOptions): Promise<Character> => {
  // The small animation files first: one that's missing fails now, not after the big model.
  const files = new Map<string, ArrayBuffer>();
  for (const { src } of ANIMATIONS) {
    if (src) files.set(src, await download({ src, signal }));
  }

  const modelBuffer = await download({
    src: MODEL_SRC,
    signal,
    progress: {
      bytes: MODEL_BYTES,
      onProgress: (fraction) => onProgress({ phase: "download", fraction }),
    },
  });
  signal.throwIfAborted();

  onProgress({ phase: "prepare", fraction: 1 });
  await nextPaint();
  signal.throwIfAborted();

  const gltf = await parseGlb(modelBuffer);
  const animations = await loadAnimations(gltf.scene, files, gltf.animations);
  return { scene: stand(gltf.scene), model: gltf.scene, animations };
};

const materialsOf = (mesh: Mesh): Material[] =>
  Array.isArray(mesh.material) ? mesh.material : [mesh.material];

/** Frees the GPU memory: three doesn't release geometry or textures when an object leaves the scene. */
export const disposeCharacter = (root: Object3D) => {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of materialsOf(object)) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.dispose();
      }
      material.dispose();
    }
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
  });
};
