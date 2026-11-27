import {
  AnimationClip,
  AnimationMixer,
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
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
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { CharacterId } from "./characterLook";

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
 * Every animation the page offers, the same for every character; each one loops until
 * another is picked, and the first plays when the page opens. What goes with an
 * animation on the stage (a backdrop, pictures, a voice) is in `show.ts`. Each
 * character names the clip of its own file that plays for it, in `MODELS`.
 */
export const ANIMATIONS = [
  { id: "idle-b", label: "Idle" },
  { id: "talking", label: "Talking" },
] as const;

type AnimationId = (typeof ANIMATIONS)[number]["id"];

/**
 * The clips of a character's own file that play for each of `ANIMATIONS`, and (for the
 * ones that have it) the clip that moves the mouth with them.
 */
const clipsOf = (
  clips: Readonly<Record<AnimationId, string>>,
  lipSync: Readonly<Partial<Record<AnimationId, string>>> = {},
): AnimationSpec[] => ANIMATIONS.map(({ id, label }) => ({ id, label, clip: clips[id], lipSync: lipSync[id] }));

/**
 * The light a character is seen in: a hemisphere light (`ambient`, from above in white, from
 * below in `ground`), a key lamp from the front right and a teal rim lamp from behind. The
 * numbers are three's light intensities.
 */
export type LightRig = {
  ambient: number;
  ground: string;
  key: number;
  rim: number;
};

/** The original rig, tuned on the girl and the boy: their textures have the shading painted in. */
const DEFAULT_LIGHTS: LightRig = { ambient: 1.3, ground: "#8a94a6", key: 2.8, rim: 1.6 };

/**
 * The anime model's textures are flat "lit" colours (VRoid): a skin of #FADFCB is meant to be
 * seen at full strength, and the shade is the viewer's job. Under the default rig the key
 * lamp turns the lit side near white and the other side grey, so he looks washed out next to
 * the colours a glTF viewer shows (an even, all-round light). This rig is mostly ambient,
 * so the colours come out near the texture's own.
 */
const FLAT_LIGHTS: LightRig = { ambient: 2.6, ground: "#f2ece6", key: 1.1, rim: 0.8 };

type Model = {
  /** The file: a Mixamo-rigged avatar with its textures and its clips. */
  src: string;
  /** Its size on disk: the progress bar's total until (or unless) the server reports a usable `Content-Length`. */
  bytes: number;
  animations: readonly AnimationSpec[];
  /** The light it is seen in; the original rig when left out. */
  lights?: LightRig;
};

/**
 * The characters the learner can pick (see `characterLook.ts`). The anime girl uses her embedded idle clip for both states and has no lip-sync clip. The boy (`Male.glb`) is a Mixamo rig too,
 * with no morph targets (no lip-sync) and his own clips: `Breathing.001` and `Talking`
 * (the file also has `Head Nod` and a few `mixamo.com` clips, unused). The anime
 * character is a VRoid-style model, not a Mixamo one: its bones are `J_Bip_…`, so
 * `retarget` can't be used for him, only the clips of his own file. That file also has
 * 57 face morph targets and a `Face.001-LipSyncAction` clip (spelt `Face-LipSyncAction` before the file was replaced on 2026-11-21; 39.5 s, mouth shapes only, made
 * for some line we don't have, so a stand-in) that plays with his Talking. `Male.glb` and
 * `Male_anime.glb` are spelt exactly so: a host that cares about case needs it.
 */
const MODELS: Readonly<Record<CharacterId, Model>> = {
  girl: {
    src: "/animations/Anime_girl.glb",
    bytes: 36_384_312,
    animations: clipsOf({ "idle-b": "idle", talking: "idle" }),
  },
  boy: {
    src: "/animations/Male.glb",
    bytes: 7_526_420,
    animations: clipsOf({ "idle-b": "Breathing.001", talking: "Talking" }),
  },
  anime: {
    src: "/animations/Male_anime.glb",
    bytes: 11_394_316,
    animations: clipsOf({ "idle-b": "Breathing", talking: "Talking" }, { talking: "Face.001-LipSyncAction" }),
    lights: FLAT_LIGHTS,
  },
};

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
  /** The light it is seen in (`SceneLights`). */
  lights: LightRig;
};

export type LoadProgress = {
  /** Downloading the model, then parsing it and decoding its textures. */
  phase: "download" | "prepare";
  /** 0 to 1; only meaningful while downloading. */
  fraction: number;
};

type LoadOptions = {
  id: CharacterId;
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

const loadAnimations = async (specs: readonly AnimationSpec[], source: string, model: Group, files: Map<string, ArrayBuffer>, own: AnimationClip[]) =>
  Promise.all(
    specs.map(async (spec): Promise<CharacterAnimation> => {
      const { id, label } = spec;
      if ("clip" in spec) {
        const named = (clipName: string) => {
          const found = own.find(({ name }) => name === clipName);
          if (!found) {
            const available = own.map(({ name }) => `"${name}"`).join(", ");
            throw new Error(`${source} has no "${clipName}" animation (it has ${available || "none"}).`);
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

/**
 * glTF says a material with no metallic or roughness factor is fully metal and fully
 * rough, and three follows that. The anime file (a VRoid export) sets neither, so he
 * rendered as bare metal: skin and cloth took no light from the hemisphere lamp, only a
 * glint from the key lamp, so he looked flat and the side of his jaw went black. The
 * girl's and the boy's files set metal 0 and rough 0.9; a material that doesn't say gets
 * those. One that does say is left alone.
 */
const MATTE_METALNESS = 0;
const MATTE_ROUGHNESS = 0.9;

const applyMatteDefaults = (gltf: GLTF) => {
  const definitions: { materials?: { pbrMetallicRoughness?: { metallicFactor?: number; roughnessFactor?: number } }[] } = gltf.parser.json;
  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const material of materialsOf(object)) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      const index = gltf.parser.associations.get(material)?.materials;
      const pbr = index === undefined ? undefined : definitions.materials?.[index]?.pbrMetallicRoughness;
      if (pbr?.metallicFactor === undefined) material.metalness = MATTE_METALNESS;
      if (pbr?.roughnessFactor === undefined) material.roughness = MATTE_ROUGHNESS;
    }
  });
};

/**
 * Takes out what isn't part of the skinned character. The file also has a floor slab
 * (a plain box); it would show on the stage and its bounds would skew `stand`.
 */
const removeProps = (model: Group) => {
  const props: Mesh[] = [];
  model.traverse((object) => {
    if (object instanceof Mesh && !(object instanceof SkinnedMesh)) props.push(object);
  });
  for (const prop of props) {
    prop.removeFromParent();
    prop.geometry.dispose();
  }
};

/**
 * The model's bounds in `pose`, the first frame of a clip. Measured there, not in the
 * bind pose: a clip can carry the character a long way from it (girl.glb's lifts it
 * 0.5 m, so that it stands on the ground), and that is where it is seen.
 */
const boundsIn = (model: Group, pose: AnimationClip | undefined) => {
  const mixer = new AnimationMixer(model);
  if (pose) {
    mixer.clipAction(pose).play();
    mixer.update(0);
  }
  model.updateMatrixWorld(true);
  // A skinned mesh keeps the bounds it was first measured with; measure again in this pose.
  model.traverse((object) => {
    if (object instanceof SkinnedMesh) object.computeBoundingBox();
  });
  const box = new Box3().setFromObject(model);
  mixer.uncacheRoot(model);
  model.updateMatrixWorld(true);
  return box;
};

/** Scales the model to `CHARACTER_HEIGHT`, centres it on the origin and stands it on y = 0, as it is in `pose`. */
const stand = (model: Group, pose: AnimationClip | undefined) => {
  const box = boundsIn(model, pose);
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

export const loadCharacter = async ({ id, signal, onProgress }: LoadOptions): Promise<Character> => {
  const { src, bytes, animations: specs, lights = DEFAULT_LIGHTS } = MODELS[id];
  // The small animation files first: one that's missing fails now, not after the big model.
  const files = new Map<string, ArrayBuffer>();
  for (const spec of specs) {
    if ("src" in spec) files.set(spec.src, await download({ src: spec.src, signal }));
  }

  const modelBuffer = await download({
    src,
    signal,
    progress: {
      bytes,
      onProgress: (fraction) => onProgress({ phase: "download", fraction }),
    },
  });
  signal.throwIfAborted();

  onProgress({ phase: "prepare", fraction: 1 });
  await nextPaint();
  signal.throwIfAborted();

  const gltf = await parseGlb(modelBuffer);
  removeProps(gltf.scene);
  applyMatteDefaults(gltf);
  const animations = await loadAnimations(specs, src, gltf.scene, files, gltf.animations);
  return { scene: stand(gltf.scene, animations[0]?.clip), model: gltf.scene, animations, lights };
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
