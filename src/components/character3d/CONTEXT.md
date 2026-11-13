# 3D character page: context for picking this up

Route `/character` (`src/app/character/page.tsx` renders `CharacterViewer`). Branch `feat/3d`.
Written at the end of the session that built it, so work can continue on another machine
(or in a new Claude session) without the chat. Facts here were checked in the code and in
headless Chrome on 2026-11-13; "not verified" says what wasn't.

Stack: Next 16.2.9, React 19, three 0.187, @react-three/fiber 9, @react-three/drei 10
(`OrbitControls` only), lucide-react, Tailwind v4 with the project's theme tokens.

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
