import {
  AnimationClip,
  Box3,
  Group,
  Mesh,
  Quaternion,
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

/** The character: a Mixamo-rigged avatar with its textures, and several animations in the same file. */
const MODEL_SRC = "/animations/Character_Final.glb";
/** Its size on disk: the progress bar's total until (or unless) the server reports a usable `Content-Length`. */
const MODEL_BYTES = 3_954_748;

type AnimationBase = {
  id: string;
  label: string;
};

type AnimationSpec =
  /**
   * One of the clips stored in the model's own file, by the name it was exported with.
   * `lipSync` names another of its clips, one that only moves the mouth (the face's
   * morph targets); it plays together with this one.
   */
  | (AnimationBase & { clip: string; lipSync?: string })
  /** A Mixamo animation exported "without skin", in a file of its own. */
  | (AnimationBase & { src: string });

/**
 * Every animation the page offers; each one loops until another is picked. The
 * first plays when the page opens. To add one, either name another clip of the
 * model, or export it from Mixamo (same skeleton, "without skin"), put the .glb in
 * `public/animations` and add its path: it is retargeted onto the character when it
 * loads. What goes with an animation on the stage (a backdrop, pictures, a voice)
 * is in `show.ts`.
 */
export const ANIMATIONS: readonly AnimationSpec[] = [
  { id: "idle-a", label: "Idle A", clip: "Idle_A" },
  { id: "idle-b", label: "Idle B", src: "/animations/Idle.glb" },
  { id: "talking", label: "Talking", clip: "Idle_Talking", lipSync: "LS_line_12" },
  { id: "levitate", label: "Levitate", clip: "Levitate_Idle" },
  { id: "sitting", label: "Sitting", clip: "Sitting_Idle" },
  { id: "gesture", label: "Gesture", clip: "mixamo.com" },
];

/** The character is scaled to this height, in scene units (metres), whatever units the file is in. */
export const CHARACTER_HEIGHT = 1.8;

export type CharacterAnimation = {
  id: string;
  label: string;
  clip: AnimationClip;
  /** Moves the mouth while `clip` plays. */
  lipSync: AnimationClip | null;
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
  // The headers in next.config.ts let the browser keep an animation for a day. A
  // versioned URL changes with the file, so it can; an unversioned one (dev) is
  // checked with the server every time, or a replaced file would show up a day late.
  const response = await fetch(versionedUrl(src), { signal, cache: versions[src] ? "default" : "no-cache" });
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

/**
 * The hips bone. Files name it `mixamorig_Hips`, `mixamorig1_Hips` or `mixamorig:Hips`;
 * the loader drops the colon (it is reserved in animation track names), so `mixamorigHips`.
 */
const HIPS = /^mixamorig\d*[_:]?Hips$/;

const findHips = (root: Object3D) => {
  const objects: Object3D[] = [];
  root.traverse((object) => objects.push(object));
  return objects.find((object) => HIPS.test(object.name));
};

/** The rotation of the space the hips live in, i.e. of the rig node above them (Blender's export turns it 90° about X). */
const hipsFrame = (hips: Object3D) => hips.parent?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();

/**
 * Makes a clip exported with another Mixamo skeleton play on this one. The two
 * files name their bones with a different prefix (`mixamorig_`, `mixamorig1_`,
 * `mixamorig`), so the tracks are renamed. Only the rotations and the hips'
 * movement are kept, since every other bone's position is that character's own
 * bone length, not motion (copying it would reshape the character).
 *
 * The hips' rotation and movement are in the space of the rig above them. When the
 * two rigs are turned differently (Blender's export stands the armature up with a
 * 90° turn the other exporters don't have) they are turned into the target's space,
 * so the character doesn't end up lying down.
 */
const retarget = (clip: AnimationClip, source: Object3D, target: Object3D, id: string) => {
  const from = findHips(source);
  const to = findHips(target);
  if (!from || !to) {
    throw new Error(`The ${id} animation needs a Mixamo skeleton (bones named mixamorig…Hips).`);
  }
  const fromPrefix = from.name.replace(/Hips$/, "");
  const toPrefix = to.name.replace(/Hips$/, "");

  source.updateMatrixWorld(true);
  target.updateMatrixWorld(true);
  const intoTarget = hipsFrame(to).invert().multiply(hipsFrame(from));
  // A character whose hips stand lower moves its hips proportionally less.
  const fromHeight = from.getWorldPosition(new Vector3()).y;
  const toHeight = to.getWorldPosition(new Vector3()).y;
  const hipsScale = fromHeight > 0 && toHeight > 0 ? toHeight / fromHeight : 1;

  const hipsRotations = (values: ArrayLike<number>) => {
    const out = new Float32Array(values.length);
    const rotation = new Quaternion();
    for (let i = 0; i < values.length; i += 4) {
      rotation.fromArray(values, i).premultiply(intoTarget).toArray(out, i);
    }
    return out;
  };
  const hipsMovement = (values: ArrayLike<number>) => {
    const out = new Float32Array(values.length);
    const position = new Vector3();
    for (let i = 0; i < values.length; i += 3) {
      position.fromArray(values, i).applyQuaternion(intoTarget).multiplyScalar(hipsScale).toArray(out, i);
    }
    return out;
  };

  const tracks: KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf(".");
    const bone = track.name.slice(0, dot);
    const property = track.name.slice(dot + 1);
    if (!bone.startsWith(fromPrefix)) continue;

    const name = `${toPrefix}${bone.slice(fromPrefix.length)}.${property}`;
    const isHips = bone === from.name;
    if (property === "quaternion") {
      tracks.push(new QuaternionKeyframeTrack(name, track.times, isHips ? hipsRotations(track.values) : track.values));
    } else if (property === "position" && isHips) {
      tracks.push(new VectorKeyframeTrack(name, track.times, hipsMovement(track.values)));
    }
  }
  return new AnimationClip(id, clip.duration, tracks);
};

const loadAnimations = async (model: Group, files: Map<string, ArrayBuffer>, own: AnimationClip[]) =>
  Promise.all(
    ANIMATIONS.map(async (spec): Promise<CharacterAnimation> => {
      const { id, label } = spec;
      if ("clip" in spec) {
        const named = (clipName: string) => {
          const found = own.find(({ name }) => name === clipName);
          if (!found) {
            const available = own.map(({ name }) => `"${name}"`).join(", ");
            throw new Error(`${MODEL_SRC} has no "${clipName}" animation (it has ${available || "none"}).`);
          }
          return found;
        };
        return { id, label, clip: named(spec.clip), lipSync: spec.lipSync ? named(spec.lipSync) : null };
      }
      const buffer = files.get(spec.src);
      if (!buffer) throw new Error(`${spec.src} was not downloaded.`);
      const gltf = await parseGlb(buffer);
      if (!gltf.animations[0]) throw new Error(`${spec.src} has no animation.`);
      return { id, label, clip: retarget(gltf.animations[0], gltf.scene, model, id), lipSync: null };
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
  for (const spec of ANIMATIONS) {
    if ("src" in spec) files.set(spec.src, await download({ src: spec.src, signal }));
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
