# 3D character page: context for picking this up

Route `/character` (`src/app/character/page.tsx` renders `CharacterViewer`). Branch `feat/3d`.
Written at the end of the session that built it, so work can continue on another machine
(or in a new Claude session) without the chat. Facts here were checked in the code and in
headless Chrome on 2026-11-13; "not verified" says what wasn't.

Stack: Next 16.2.9, React 19, three 0.187, @react-three/fiber 9, @react-three/drei 10
(`OrbitControls` only), lucide-react, Tailwind v4 with the project's theme tokens.

> **Three characters now: `girl.glb`, `Male.glb` (Boy) and `Male_anime.glb` (Anime)** (2026-11-20; between 11-19 and 11-20 the
> "male" was the anime file and `Male.glb` was unused; `Character_Final.glb` is still unused). Everything below that says
> "Character_Final" / Levitate / Sitting / Gesture / lip-sync describes the old model. What changed, and why:
> - **Picking one.** Hold the battery (the dev panel of `BatteryMenu`): "3D character" Girl / Boy / Anime (ids `girl`, `boy`,
>   `anime`). The pick is kept in local storage (`characterLook.ts`, a small store with no three.js, so the menu doesn't
>   pull three in; a saved `"male"` from the two-choice days is read as `anime`). `sharedCharacter.ts` loads the picked one
>   (default girl); a switch loads the other in the background (the button says "Boy…" meanwhile), the screens then switch
>   and the old one is freed after 1 s. `useCharacter` (the `/character` page) follows the pick too. `Male.glb` and
>   `Male_anime.glb` are spelt exactly so (capital M).
> - `MODELS` in `character.ts` gives each file, its size and which clip plays for `idle-b` and `talking`:
>   girl → `mixamo.com` for both; boy → `Breathing.001` and `Talking` (Mixamo rig `mixamorig:`, one mesh, no morph targets so no
>   lip-sync; the file also has `Head Nod` and four `mixamo.com…` clips, unused); anime → `Breathing` and `Talking` (the file also has `Gesture`, `Head_nod`,
>   `Talking_both_hand` and `T-Pose`, unused). `ANIMATIONS` is two entries, "Idle" and "Talking" (Talking plays its voice). `TOUR` in `show.ts`
>   is Idle then Talking; the Gesture pictures in `SCENES` are unused.
> - **Lip-sync:** the girl (a Tripo mesh on the Mixamo rig) and the boy have no morph targets, so none. `Male_anime.glb` is an anime
>   (VRoid-style) model: 3 skinned meshes (Body, Face, Hair), 15 materials, bones named `J_Bip_…` (not Mixamo), and 57 face morph
>   targets (`Fcl_MTH_A/I/U/E/O`, …) with a clip `Face-LipSyncAction` (39.5 s, mouth shapes only, made for a line we don't have, so
>   a stand-in like the old one). It is wired as the `lipSync` of his `talking` in `MODELS.male` (`clipsOf`'s second argument):
>   the mouth moves while he talks, on `/character` and on the sequence screens; it doesn't follow the words. The clip's first
>   0.9 s is a closed mouth.
> - **Anime's dark patch on the jaw.** His materials have no metallic/roughness factor, so glTF's default applies
>   (metal 1, rough 1): a fully metal surface ignores the hemisphere light and only the key lamp lights it, so the side of the
>   jaw facing away from it is black (it looks like a beard). Reproduced in a bare three.js page, so it is the file, not the app.
>   `material.metalness = 0` removes it, but then skin and shirt come out pale (the user disliked a pale look before).
>   Not applied; decide on the look (or re-export the materials with metallic 0 from Blender).
> - **Girl: old clips and `Idle.glb` do not retarget onto her.** Her bones' local axes are turned 90° about the vertical
>   relative to the other rigs (hips rest `[-0.5, 0.5, -0.5, 0.5]` vs `[-0.707, 0, 0, 0.707]`), so the copy-the-rotations
>   `retarget` in `character.ts` made her vanish (tried with Idle B). More animations for her should be exported from
>   Mixamo for this same girl (then they are her own clips). `Male_anime.glb` has a different rig
>   (`J_Bip_…`), so `retarget` (Mixamo bone names only) can't be used for him: only the clips of his own file.
> - `girl.glb` has a **floor slab** (`Cube`, a plain mesh); `removeProps` drops any non-skinned mesh.
> - Her clip carries her 0.5 m up from her bind pose (it stands her on the ground), so `stand()` measures the size and
>   footing from the first animation's **first frame**, not the bind pose (`boundsIn`). Measured in the bind pose she floated.
> - **Lighting is the original** (`SceneLights` in `CharacterScene.tsx`: a hemisphere light 1.3, a key lamp 2.8, a rim lamp 1.6; no
>   environment map). The girl can look duller here than in Blender: her glTF material is plain (base-color texture only,
>   no emission or factor), so Blender's HDRI / view transform, or a node the exporter drops (Brightness/Contrast, HSV,
>   Emission), would explain it. A brighter version (three's `RoomEnvironment` as fill, lamps turned down, and a
>   brightness slider in the battery menu) was built and then removed on request; the hands came out pale in it.
> - **`girl.glb`'s texture is 8192×8192** (about 350 MB of GPU memory, over many phones' 4096 limit); resizing it to
>   2048–4096 in Blender would also shrink the 15 MB file. Not done. `Male_anime.glb` is 11.4 MB (22 PNG images).
> - Checked in headless Chrome (390×844): `/character` and `/module/sequence-3d?step=1` and `?step=3` for the girl; the
>   battery hold menu and switching to the male on `step=1`. With `Male_anime.glb` (2026-11-19): `/character` (Idle and Talking
>   both play, the mouth opens in Talking) and `step=1` (arm gesture and mouth during the voice, then Idle) / `step=3`;
>   it loads, faces the camera, stands on the ground. With the three-way menu (2026-11-20, headless Chrome 390×844, mouse): the
>   menu shows Girl / Boy / Anime; on `step=1` picking Boy while the girl was on show marks it, stores `boy` and the screen
>   switched to the boy; `/character` loads Boy and Anime (Idle, Talking screenshots look right: standing on the ground,
>   facing the camera) and a stored `"male"` opens Anime. Not checked: a real phone, load times on a slow connection, a touch
>   (not mouse) hold on the battery, the boy or anime on `step=7`, the boy's Talking clip beyond one screenshot (nothing of
>   `/character` Talking for him was watched in motion), the button's "Boy…" loading state.

## What the page does

- A Mixamo-rigged character (`Character_Final.glb`) on a stage, with a backdrop (`bg.webp`).
- Six animations, one chip each (the first, Idle A, plays on open): **Idle A, Idle B, Talking,
  Levitate, Sitting, Gesture**. All loop. Picking a chip plays that one on its own.
- **Gesture** also shows a picture per round: bottle, mountain, variable, then none, then round again.
- **Talking** plays a voice clip and the model's lip-sync clip (`LS_line_12`, mouth only).
- **Play all** runs the tour: Levitate (2 rounds) → Idle B (1) → Gesture (4 rounds, one picture each)
  → Talking (until its voice ends) → back to Idle B. Header shows "Gesture · 3 of 4". "Stop tour" ends it.
- Pause / Play (also pauses the voice), Auto-rotate, Reset view. Drag rotates; **zoom and pan are off on
  purpose** (the user asked: the wheel scrolls the page, pinch doesn't zoom).
- Dark and light theme, phone width (chips wrap).

## Files (`src/components/character3d/`)

| File | Job |
|---|---|
| `character.ts` | `ANIMATIONS` list; loads the model with a progress bar; loads and **retargets** animation files; scales the model to 1.8 m and stands it on y = 0; `disposeCharacter`. |
| `useCharacter.ts` | Hook: `loading` / `ready` / `error` state, retry, aborts and disposes on unmount. |
| `CharacterScene.tsx` | R3F canvas, lights, the animation mixer (body + lips per animation, 0.3 s cross-fade, tells the page when a round ends), baked ground shadow, `OrbitControls`. |
| `show.ts` | The "script": `BACKDROP`, `SCENES` (pictures / voice per animation id), `TOUR`, `TOUR_REST_ID`, `pictureAt`. **Edit this to change what goes with an animation or the tour order.** |
| `useShow.ts` | Reducer: which animation, `runToken`, paused, rounds played (`loops`), tour `step`. Pure logic, no tests exist. |
| `useVoice.ts` | One audio element for the page; starts with the animation, pauses with the page, reports `ended`/failed. |
| `StageDecor.tsx` | Backdrop and picture overlay (both load with the page so nothing pops in late). |
| `CharacterViewer.tsx` | The page UI: chips, buttons, stage, loading and error messages. |

The character is also used as a **picture on other screens** (the 3D copies of the Sequence screens, `/module/sequence-3d`):

| File | Job |
|---|---|
| `sharedCharacter.ts` | Loads the character **once** per visit (never freed) and reports progress; `useSharedCharacter()`. |
| `portraitHost.tsx` | `PortraitHost` (mounted in the route's layout, behind its loading bar) makes **one** R3F canvas, draws its first frames there (shaders, textures), and keeps it. The canvas lives in a parking box off screen and is moved into whichever screen's slot asks; its own size is fixed (380 x 680) and it is scaled to the slot by CSS, because a resized canvas rebuilds its drawing buffers (seconds on a slow machine). The screen sets the pose (animation, lip-sync) through `setPortraitPose`. |
| `CharacterPortrait.tsx` | The slot a screen renders: takes the shared canvas into its box (no controls, no taps) and sets the pose. Needs `PortraitHost` above it. |

`AnimatedCharacter` / `SceneLights` / `GroundShadow` are exported from `CharacterScene.tsx` for this; `AnimatedCharacter` has a `lipSync` prop (default true).

Add an animation: name another clip of the model, or export it from Mixamo ("without skin", same
skeleton), put the `.glb` in `public/animations`, add a line to `ANIMATIONS`.

## Assets (`public/`)

Used: `animations/Character_Final.glb` (3.9 MB, Blender export; 9 textured materials; 17 morph targets named
`mouthOpen, mouthSmile, sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, ih, oh, ou`; clips `Idle_A`,
`Idle_Talking`, `Levitate_Idle`, `mixamo.com` (the Gesture arm-out clip), `Sitting_Idle`, `LS_line_12`),
`animations/Idle.glb` (Idle B, 8.4 s), `bg/bg.webp`, `bg/botal.png`, `bg/mountain.png`, `bg/variable.png`,
`audios/sequenceModuleAudios/Lets_get_ready_again_Your_shoes_are_already_on.mp3` (Talking voice, 3.34 s).

Not used any more, still in git: `animations/Bouncing Fight Idle.glb` (**75 MB**, the first model),
`animations/Zombie Stand Up.glb` (removed from the page on request), `bg/bg.png` (source of `bg.webp`),
`bg/bag.png`, `bg/image 539-541.png`. The 75 MB file is in history (commit d753581) whatever happens now.

## Things that were not obvious (and cost time)

1. **Bone names.** The Blender export names bones `mixamorig:Hips`; three's loader drops the colon
   (reserved in track names), so the code sees `mixamorigHips`. `HIPS` regex in `character.ts` accepts
   `mixamorig_Hips`, `mixamorig1_Hips`, `mixamorig:Hips` and `mixamorigHips`.
2. **Retargeting** (used for `Idle.glb`): tracks are renamed by prefix; only rotations and the **hips'
   position** are kept (other bones' positions would reshape the character). The hips' rotation/position are
   turned into the target's space (Blender's armature node is turned 90° about X, FBX-style rigs aren't) and
   the hips' movement is scaled by the hips' height ratio. Without that a FBX-style clip lies the character down.
3. **Dev caching.** `next.config.ts` gives `/animations` and `/audios` a 1-day `Cache-Control` even in dev, so a
   replaced `.glb` of the same name looked old. `character.ts` fetches with `cache: "no-cache"` when the URL has
   no `?v=` hash (dev). Audio is not covered (same header, so likely a day; not tested): hard-refresh after
   replacing an mp3.
4. **Next's image optimizer hangs in dev** (Next 16.2.9): some `/_next/image?...` keys never answer (even
   `curl` times out) after mobile/DPR 2-3 requests get aborted, until the dev server restarts. So the stage images
   use `unoptimized`, and the 4.4 MB `bg.png` is served as a **53 KB `bg.webp`** (1200 px wide). If `bg.png`
   changes, regenerate it (it was made with headless Chrome: `OffscreenCanvas` + `convertToBlob({type:
   "image/webp", quality: 0.8})`; no package was installed).
5. **`bg.png` has a baked "Activate Windows" watermark** at its bottom-right. The backdrop box is 12% taller than
   the stage and anchored at the bottom, so those rows fall outside and are cut off. A clean image would be better.
6. **Frame clock.** The mixer is advanced by at most 0.1 s per frame, so on a slow machine (and in headless
   Chrome with software GL) everything runs in slow motion, including the tour. `frameloop` is `"demand"` while
   paused, so a paused page costs nothing.
7. **Camera framing** (`CAMERA_POSITION/TARGET` in `CharacterScene.tsx`) leaves room above the head for Levitate
   (it lifts the character ~0.4 m). The stage is `60vh`; `svh` made it tiny in emulation, so don't switch.
8. **Lint rule** `react-hooks/immutability` (it did fire): create the mixer and its actions inside one `useMemo`
   callback; don't assign properties of hook-supplied objects in effects. The tour advances in the reducer (on
   `loop` / `voiceEnded`), not in an effect that sets state.
9. **Sitting** has no chair, so the character sits in the air. **Gesture** is the `mixamo.com` clip: one arm out,
   then back, ~3.8 s.

## Voice and lip-sync (the weakest part)

- `LS_line_12` (3.63 s, 87 keys, weights for the 17 morph targets) was made for some specific spoken line that we
  do **not** have. The current mp3 is a stand-in picked by the user, so the mouth moves but does not match the
  words. Five existing mp3s of about the same length (3.55-3.71 s) were compared with the clip by loudness; none
  clearly matched.
- To fix: get the audio for "line 12", put it in `public/audios/...`, change `SCENES.talking.voice` in `show.ts`.
  (If its length differs from the lip clip, the page restarts body, lips and voice together each time the voice
  ends, so they never drift.)
- A voice that can't play is skipped in the tour and left silent when picked alone (no retry loop).
- `useVoice` keeps one `Audio` element and `prime()`s it from the "Play all" tap, so iPhones may allow the voice
  that starts later. **Not verified on a real iPhone.**

## Not verified

- Real GPU and real phones (all checks ran in headless Chrome with SwiftShader, desktop 1100×820 dark and 390×844 light).
- `next build` (the dev server shares `.next`; never run).
- The glasses material uses `KHR_materials_transmission`, which makes three render an extra pass. If phones are slow,
  set `material.transmission = 0` for it after loading.
- The voice itself was only seen through logged `play`/`ended` calls (headless has no sound).

## Run and check

```bash
npm install
npm run dev                      # open http://localhost:3000/character
npx tsc --noEmit
npx eslint src/components/character3d src/app/character
```

There is no test runner. The browser checks were done by driving headless Chrome over the DevTools protocol
(`chrome --headless=new --remote-debugging-port=9333 --enable-unsafe-swiftshader --use-angle=swiftshader
--autoplay-policy=no-user-gesture-required`), from Node 24's built-in `WebSocket`: click the chips by text, take
screenshots, log `HTMLMediaElement.play`. Those scripts were scratch files and are not in the repo.

## Open items, most useful first

1. The right audio for `LS_line_12` (see above).
2. Try it on a real phone (speed, the voice on iPhone, the glasses pass).
3. Decide on the unused files, especially the 75 MB `Bouncing Fight Idle.glb`
   (`git rm` stops it shipping; it stays in history).
4. `next build` once.
5. Cosmetic: the R3F `THREE.Clock` deprecation warning in the console is harmless.

## How the user likes to work (also in Claude's memory on the first machine, which does not travel)

- Writes Hinglish (Hindi in Roman script) and wants short answers in the same; often in a hurry.
- **Ask before installing any package** (name it and wait for a yes). Nothing was installed beyond
  `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`, which they approved.
- Don't commit or push unless asked.

## What was asked, in order

1. A 3D character page from `Bouncing Fight Idle.fbx` → switched to the `.glb` version, plus a second animation.
2. No zoom on the canvas.
3. `Character_Final.glb` (first untextured, then re-exported with textures and a lip-sync clip), then `Idle.glb`.
4. Gesture with `bg.png` and the pictures one by one; audio on Talking; remove Zombie Stand Up; **Play all**
   (Levitate → Idle → Gesture → Talking) next to single-animation chips.
5. Talking audio: `Lets_get_ready_again_Your_shoes_are_already_on.mp3`.
6. Backdrop on every animation, not only Gesture.
