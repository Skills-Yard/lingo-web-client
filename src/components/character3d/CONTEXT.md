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
> - **Picking one.** Hold the battery (the dev panel of `BatteryMenu`): "Change character" opens the page `/choose-character` (see "Select your
>   Mentor" below; it replaced the Girl / Boy / Anime row, 2026-11-22). Ids `girl`, `boy`, `anime`. The pick is kept in local storage (`characterLook.ts`, a small store with no three.js, so the menu doesn't
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
>   targets (`Fcl_MTH_A/I/U/E/O`, …) with a clip `Face.001-LipSyncAction` (named `Face-LipSyncAction` until the user replaced the file on 2026-11-21; the new one also has `Idle`, `Head Nod`, `T-Pose.001`; 39.5 s, mouth shapes only, made for a line we don't have, so
>   a stand-in like the old one). It is wired as the `lipSync` of his `talking` in `MODELS.male` (`clipsOf`'s second argument):
>   the mouth moves while he talks, on `/character` and on the sequence screens; it doesn't follow the words. The clip's first
>   0.9 s is a closed mouth.
> - **Anime's dark patch on the jaw / "no texture" look (fixed 2026-11-22).** His materials have no metallic/roughness factor, so glTF's
>   default applies (metal 1, rough 1): a fully metal surface ignores the hemisphere light and only the key lamp lights it, so the
>   side of the jaw facing away from it was black (it looked like a beard) and everything looked flat next to the girl and boy, whose
>   files say metal 0, rough 0.9. `applyMatteDefaults` in `character.ts` now gives any material that has no metallic / roughness
>   factor in the file 0 / 0.9 (one that has them is untouched, so girl and boy are as before). Result in headless Chrome 390×844
>   dark: jaw clean. **Then it looked white/washed out next to a glTF viewer (same day):** the VRoid textures are flat "lit" colours
>   (skin `#FADFCB`-ish, shirt cream `242,232,222`), the default rig's key lamp 2.8 pushed the lit side near white and the other
>   side grey (cheek `207,191,178`). So each character now carries its own **light rig** (`LightRig` in `character.ts`, `Character.lights`,
>   `SceneLights lights=…` in the three canvases: `CharacterScene`, `portraitHost`, `MentorStage`). Girl and boy keep the original
>   (hemisphere 1.3, key 2.8, rim 1.6); anime has `FLAT_LIGHTS` (ambient 2.6, ground `#f2ece6`, key 1.1, rim 0.8). Measured on the
>   `/character` screenshot (390×844 dpr 2, dark): cheek `248,225,204` against the face texture `250,222,204`, shirt `236,223,210` against
>   its texture `242,232,222`. Checked: `/character` anime and girl (girl as before). **Not checked:** the portrait canvas on the
>   3D sequence screens and the mentor picker with the new rig (only type-checked), light mode, Talking, a real phone. The numbers
>   were tuned by pixel values, not by eye against the user's viewer (unknown which one).
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

### The 3D Sequence flow (`/module/sequence-3d?step=N`), 2026-11-21

From the Figma overview image (15 frames, 1047×167 px: only the titles of 1-8 could be read). **`?step=` is the place in the flow**
(`FLOW_3D` in `components/sequence/sequence3d.ts`), not the original module's step.

> **All of the original module's screens are in it now (2026-11-21): 27 frames, then `?step=complete`** (the user asked for every
> remaining screen in 3D, and chose: Hex stays on his board, and the original put-on screens 2-4 come back). The progress bar is
> `SEQUENCE_3D_STEPS` = `FLOW_3D.length` (27). **The numbers in the older notes below are from when the flow had 12 frames**; positions
> after 3 moved when the three put-on frames went in. Use this table (place = `?step=` in `/module/sequence-3d`, "orig" = `?step=` in
> `/module/sequence`):
>
> | place | frame | orig | place | frame | orig |
> |---|---|---|---|---|---|
> | 1 | intro (`Intro3DScreen`) | – | 15 | dress (`DressArrangeScreen`) | 12 |
> | 2 | aarav (`Story3DScreen`) | – | 16 | hexIntro | 13 |
> | 3 | putOnFirst (tray) | 1 | 17 | oneCommand | 14 |
> | 4 / 5 / 6 | socks / shoes / ready (`PutOnScreen`) | 2 / 3 / 4 | 18 | hexOrder | 15 |
> | 7 | whatDid | 5 | 19 | predict | 16 |
> | 8 | compare | 6 | 20 | predictNext | 17 |
> | 9 | shoesFirst (`Story3DScreen`) | – | 21 | fix | 18 |
> | 10 | whatWillHappen (tray list) | 7 | 22 / 23 | plan / planNext | 19 / 20 |
> | 11 | firstCommand | 8 | 24 | tea | 21 |
> | 12 | arrange | 9 | 25 / 26 | reflectOrder / reflectDecide | 22 / 23 |
> | 13 / 14 | meet / reveal | 10 / 11 | 27 | recap | 24 |
>
> - **How the added screens work:** they are the original screens as they are. Each asks `useSequenceFlow` for its place, next and
>   back (`PutOnScreen`, `HexScreen` (so `HexIntro`, `OneCommand`, `HexOrder`, `Predict`, `Fix`, `Plan`), `TeaScreen`, `RecapScreen`),
>   so they work in both routes. Where Hex speaks in a bubble (put-on 4-6, tea, 25, 26) the character's face stands there alone, with no
>   bubble (`HexStandIn`). **On the Hex-board screens (16-23) Hex himself stays: he is the game piece on the grid** (and in the result panel);
>   the tip card is unchanged. Nothing was added there for the 3D character (the user chose this).
> - `sequence3dNext/Previous` keep the original's rule: a learner who struggled on `plan` (22) skips `planNext` (23) both ways.
>   After 27 (the recap, via its gem popup) Next opens `/module/sequence-3d?step=complete` (the original's "Lesson complete!").
> - **The battery** charges one unit per *position* (the shell's `step`), 27 of them against 20 units; jumping to a later `?step=` with the
>   URL charges all screens skipped in one go (testing: set `sessionStorage` `lingo.battery` to
>   `{"level":100,"unlimited":true,"charged":0}`).
> - Checked in headless Chrome 390×844, light, Girl, battery unlimited (2026-11-21): 4, 16, 17, 18, 19, 21, 24, 25, 26, 27 and `complete`
>   render (face in the bubble on 4, 24, 26; Hex on the board on 16-21); no console errors; 16 → "Let's Try" → 17; 27 → Continue → gem → `complete`;
>   22 with a struggle noted: a wrong run is "Not yet", the right one (forward, right, forward, forward) → Next → **24** (23 skipped);
>   Back (the battery hold menu's Back, the X goes to `/level`) from 24 → 23, and → 22 with a struggle noted; from 17 → 16; 4 → 3; 1 → `/level`.
>   **Not checked:** playing through 4-6 (the socks and shoes animations), 13-15 on the new numbers, 20, 23 and 18-21 beyond opening them
>   (the right and wrong paths), the Tea and 25/26 answers, dark mode, Boy/Anime, voices (headless has no sound), a real phone,
>   `next build`. The 2D route `/module/sequence` still works after the change (its screens now go through `useSequenceFlow`, whose default is the original's
>   own): `?step=2` shows Hex in the bubble and Continue → 3; `?step=13` "Let's Try" → 14; `?step=24` Continue → gem → `?step=complete`; no console errors.

Older notes, with the 12-frame numbers: 1 Let's Learn Sequences
(`Intro3DScreen`), 2 Aarav is going out today! (`Story3DScreen`), 3 What to put on first? (`SequenceQuiz3DScreen` with `look="tray"`, see below), 4 What did you do?, 5 Compare both attempts, 8 What's the first command? (the original 2D
`SequenceQuizScreen`), 6 What if shoes go first? (`Story3DScreen`), 7 What will happen? (`SequenceQuiz3DScreen`, the original screen
7 retitled), 9 Arrange the instructions! (the original `ArrangeScreen` as it is, 2026-11-21: it asks `useSequenceFlow` for its place,
next and back, so it works in both routes; the character's face is in its bubble; its result panel still has Hex), 10-12 (see "Steps 10-12" below).
(Figma's frames 13-15, from the overview titles: One last challenge!, Why sequence matters, How to decide the order?; its 10-12: Meet the Sequence,
Why does order matter?, Let's guess first. The Figma flow has no Hex-board frames; they are here because the user asked for every screen.)
`/module/sequence?step=9` (the 2D route) is unchanged and still shows Hex; the 3D one's arrange is `/module/sequence-3d?step=12`.
- On the 2D screens reused here, **the character's face replaces Hex beside his bubble**: `HexBubble` shows what `HexStandIn`
  (a context in `level-two`) holds; `Sequence3dFlow` (in the route's layout) puts `CharacterAvatar` there (the shared canvas, cropped
  to the head by a 412 px slot at top -34 inside a 100 px box). The same provider gives those screens the 3D flow's next/previous/progress
  (`useSequenceFlow` in `sequenceFlow.tsx`; outside the route it is the original module's). The result panel still has Hex.
- **Step 3 is the Figma `sequence_3` frame (CSS pasted by the user), `look="tray"`:** the character stays in the middle, close up,
  with no room board; pattern background (`PatternBackdrop`: wash, spotlight, five "?" in the app font (the design says Fredoka, not loaded), dot
  grid; light mode only); the two cards (166×187, `TileCards` layout `tray`) stand on a grey `AnswerTray`. **2026-11-22 (asked for with design crops):**
  the yellow bulb (`TrayHint`) is gone: the hint is the regular one beside Continue (the shell's, `withHint` passed on to the tray and cards so
  they stand on the shorter button); the tray has 37 px above the cards (`TRAY_PAIR.lip`, measured from the design frame; the pasted CSS's 2 puts the
  cards against its edge); the cards keep the app's 3D edge (they were made flat the same day and put back on request: they are buttons);
  and the tray is see-through at its top (it always was, 50 % to solid), now that the character no longer fades out above it: its fade is
  `TRAY_CHARACTER.fade` = 84-96 % of its box, low down, whatever the tray's height (`trayFade` is removed). The tray goes when the answer is checked and the cards rise as before.
  Checked in headless Chrome (Girl, light, DPR 1) 390×844, 360×640, 412×915: open, and a Socks pick (green card, Continue on); step 10 opens with the same tray and hint.
  Not checked: dark mode, Boy/Anime, a real phone, the right/wrong panel after this change, the hint effect on the flat cards, the character's rise with the real voice (its drop changed with the new fade end and was not measured; it was 138 px).
- **The tray look's character opens low and rises when the answers come in (2026-11-21, asked for by the user).** Until the answers (the
  question's 75 %) the character stands lower, with the foot of its fade (`fade`'s end) 6 px over the main button's top, so there is no empty
  band between it and the button; when `lowered` (`CharacterOnStage`, passed `tray && !optionsShown`) goes off it slides up to its place
  in 0.8 s (`SHIFT`, a `y` motion value) as the tray and cards come in. The drop is measured, not a constant: a mark at `aboveButtons(6)`
  gives the button line in px and the drop is that minus where the fade ends (138 px on 390×844 and 126 on 390×667 for the pair of cards;
  229 for the list on step 10, whose tray is taller), re-measured when the stage resizes. Two traps found: the stage has no size while the
  screen is behind its loading bar (so `offsetParent` is null and the first measures read 92 px: measure on `parentElement` and skip a
  zero height), and the slide the first render starts (towards a drop not measured yet) wrote 0 over the measured value 0.8 s later
  (`rise.stop()` before `rise.set()`). Checked in headless Chrome (Girl, dark): the start frame on 390×844 and 390×667, and the rise (138 → 24 → 0
  px in about half a second) with the answers forced on, since headless had no audio progress that run to bring them in. Not checked: the
  rise with the real voice, light mode, Boy / Anime (the box is the same), a real phone. (An idle-sway "stabiliser" that followed the neck was tried
  first on a misreading and taken out again: `FramingCamera` still follows only the hips across.)
- **The battery and "Select your Mentor" (2026-11-21 design image; reworked 2026-11-22 on request).** **A tap on the battery opens the
  Energy screen everywhere, the 3D route included** (the 11-21 override, `batteryTap.tsx`, is gone). **Holding it opens the dev panel, which
  has a "Change character" button** (`BatteryMenu`) that goes to **`/choose-character?from=<where the battery is>`** (`chooseCharacterHref` in
  `lib/routes.ts`). **It was a popup (`MentorPicker`) until 2026-11-22, when it became a page on request; `MentorPicker.tsx` is deleted.**
  The page works from every screen that has the battery, not only the 3D route. Files: `app/choose-character/page.tsx` →
  `ChooseCharacterRoute.tsx` (reads `from`, `router.replace`s to it on Choose / Back / Escape, `/home` when opened by URL with no `from`;
  `replace`, so the browser's Back does not open the page again) → `ChooseCharacterScreen.tsx` (the UI).
  One mentor at a time, full screen: Back button and title "Select your Mentor", the name in a pill, the character, round arrows at its sides (they go round the three:
  Rio = `boy`, Veena = `girl`, Zane = `anime`, `MENTORS` in `characterLook.ts`; the names are guesses from the design image, whose
  characters are not ours) and a "Choose …" `Button3D`. The page's colour and arrows follow the mentor (`THEMES` in `ChooseCharacterScreen.tsx`,
  guessed from the image, with dark variants; the 430 px column is centred, the colour fills the viewport). The canvas's straight bottom edge (head to thigh) fades out with a mask over its
  lowest 18 %. **The character is the real model, idling** (`girl.glb`, `Male.glb`,
  `Male_anime.glb`), not a picture: `MentorStage.tsx` is one R3F canvas (camera level at `[0, 1.25, 2.4]`, head to thigh) whose character is
  swapped as the arrows move. `characterCache.ts` loads each model when its mentor first comes up (a ring and a percentage until then, "Try again" if
  it fails), keeps them while the page is open, and frees them 2 minutes after it closes. They are **separate copies from the shared
  character** (`sharedCharacter.ts`); the page has no shared canvas, so nothing is loaded twice any more, but the GPU memory (the girl's 8192² texture) is the cost, worth watching on phones.
  "Choose" calls `setCharacter` and returns at once: the screen it returns to loads the stored pick itself (no "Loading…" wait on the page any more).
  The mentor shown is the stored one until an arrow is used (derived from the store each render, so a server-rendered load shows the stored one once known).
  `public/images/mentors/{boy,girl,anime}.webp` (the old renders) are **no longer used**.
  **`AnimatedCharacter`'s cleanup no longer calls `mixer.uncacheRoot`** (`CharacterScene.tsx`): in dev R3F wraps its tree in StrictMode when
  Next does, so a newly mounted `AnimatedCharacter` ran its effects, the cleanup and its effects again on the same mixer, and `play()` after
  `uncacheRoot` threw `Cannot set properties of undefined (setting '_cacheIndex')` (the picker's canvas showed it every time). `stopAllAction()`
  alone still puts the bones back in the bind pose, and the mixer is garbage once the component is gone. Not understood: why the shared
  canvas (`PortraitHost`), which mounts the same component, never hit it.
  Checked in headless Chrome 390×844, dark, Girl, battery unlimited (2026-11-22): tap on the battery went to `/energy?from=…` on `/module/sequence-3d?step=2`
  and on `/module/sequence?step=2`; the hold showed "Change character" and no Girl / Boy / Anime row and stayed on the screen; the picker opened
  on Veena with the ring and a percentage, then the model; the arrows showed Zane (anime) and Rio (boy) as models, and back on Veena at once (kept);
  "Choose Zane" stored `{"character":"anime"}`, closed the card and the screen's face became the anime. No console errors beyond the `THREE.Clock`
  and Rive deprecation warnings. **Not checked:** the model's idle motion by eye (only stills), light mode, Escape and the outside tap, the failed-load
  state, a slow connection, a real phone or touch, the picker on the Home/Level screens, the `/energy` return button back to a 3D step.
  **The popup's checks above are for the old `MentorPicker`; the page that replaced it (2026-11-22) was checked on its own:** headless Chrome
  driven over CDP (device metrics 390×844 ×2, mobile, mouse events; the script is not kept), dark and light, battery unlimited, on
  `/module/sequence-3d?step=2`: the hold stays on the screen and the panel lists Back / Full screen / battery / Change character / theme; "Change character" →
  `/choose-character?from=%2Fmodule%2Fsequence-3d%3Fstep%3D2` (title, Back, both arrows, "Choose Veena"); Veena → Zane → Rio on the arrows (names, colours and
  models change); "Choose Rio" → `/module/sequence-3d?step=2` again, local storage `{"character":"boy"}`, and the screen's face is Rio's. `tsc` passes. No console
  errors beyond the `THREE.Clock` and Rive `stateMachines` deprecation warnings. **Not checked:** Back and Escape, a URL with no `from` (→ `/home`), a `from` that
  is not a path on this site, the page from Home / Level, a direct load of `/choose-character` (the server render and the first paint of a stored non-default pick),
  Girl/Zane as the pick returning to the 3D screen, a slow connection, a real phone. Plain `--window-size=390` headless Chrome lays out at 500 px (its minimum), which
  cuts the page: use device-metrics emulation.
  The dev server died during the checks (Turbopack panic, "memory allocation failed": the machine had ~100 MB of 7.5 GB free); if
  `npm run dev` then answers 500 "Unexpected end of JSON input", delete `.next` and start again.
- **Audio on the 3D route:** place 9 (shoes first) plays Hex's clips of the original screen (`SEQUENCE_AUDIO.socksFirst`: the title, then the
  line the bubble used to show). Hex has no clip for the other screens without one (1, 2, 4-7, 14-27 beyond 11-13): they need recording.
- **Step 7 is the Figma `sequence_7` frame (a screenshot from the user), `look="tray"` with a list** (2026-11-21): the same screen as step 3,
  but three rows instead of two cards. Numbers measured from the screenshot (390 px frame): rows 358 × 76, 16 in from each side, 6 apart
  (`TRAY_LIST*` in `AnswerTray.tsx`, passed to `AnswerCards` as `width`), the tray's top 40 above the first row (`TrayStand`: `TRAY_PAIR` is
  step 3's 187 + 2, `TRAY_LIST` is 240 + 40), the bulb 16 above the tray, 16 from the right. The character's fade (`trayFade`) moves up by how
  much taller the stand is than step 3's. The rows' text has no 34 px gap before the radio's empty spot (`AnswerCards` `endGap={0}`), which
  is what makes "Socks will be harder to put on" one line and "Shoes will come off automatically" two, as in the design. Texts are from the
  design (`WHAT_WILL_HAPPEN` in `sequence3d.ts`); the third icon is a new `icon-same-order.svg` (teal + violet arrows, colours sampled from the screenshot).
  **Differs from the design:** the screenshot shows no main button, we keep it (as on step 3), so our tray's top is ~65 px higher than the
  design's (461 against 526 in frame px) and the character is cut a little earlier. The right and wrong feedback texts are the original screen 7's, not from the design.
  Checked in headless Chrome 390×844, girl: light (open, pick, Continue → "Good thinking!" panel, wrong pick → "Not quite" → Try again → reset) and
  dark (open); step 3 still looks as before. Not checked: Boy/Anime on step 7, the bulb's hint effect on a row, a real phone, voices.
- **Place 8, "Compare both attempts" (2026-11-22, `Compare3DScreen`, from a Figma crop):** not the original `SequenceQuizScreen` any more (that stays
  on the 2D route). No Hex line and no face; two flat 166×187 cards (`PictureCards flat`) with the design's small icons, and the three answers hang
  right under them (`AnswerCards top`, from `PICTURES_TOP` 175 by Figma numbers, so spare room on a tall screen is above Continue), 358×76 rows
  with 52 px icons. The rows are buttons and keep the app's 3D edge (asked for); only the two picture cards are flat. Icons are `public/animations/svg/sequence-3d/3d-8-1..5.svg` (socks, shoes, actions, order, goal; 1.1-1.5 MB each, raster inside:
  worth re-exporting smaller). Texts are the design's, incl. the full stop in "The order of actions." (`COMPARE_3D` in `sequence3d.ts`, which
  `sequence3dAssets.ts` preloads in place of the old webp pictures). After a check the cards pull in (scale .8, from their top) and the rows rise 55 so
  the result panel never covers them. Checked in headless Chrome (Girl, light) 390×844 open, right ("Exactly!") and wrong ("Not quite"), 360×640 open.
  Not checked: 412×915 beyond the numbers, dark, Try again, the voice, a real phone.
- **The right answer bounces on the 3D route (2026-11-22, "the OG bounce" = `RightBounce`, copied from `dev`, `level-two/RightBounce.tsx`):** the
  right card/row squeezes, jumps with a shine and two stars, 0.2 s after Check, only on a right pick. `AnswerCards` and `TileCards` got
  `bounceRight`; `SequenceQuiz3DScreen` (3, 10) and `Compare3DScreen` (8) pass it, and the shared screens (`SequenceQuizScreen`: 7, 11, 25, 26; `PredictScreen`:
  19, 20) take it from `useSequenceFlow().bounceRight`, which is true only on the 3D route (the 2D route has no bounce, as before). Checked in headless
  Chrome 390×844 by sampling the card's box after Check: step 3 Socks (height 187 → 150 → 200 → 162 → 185 → 187, settles risen by the panel), step 8 "The order of actions."
  (76 → 61 → 66 → 76); a wrong pick (step 3 Shoes) stays 166×187 and does not bounce. **Options that fade away on a right answer do not bounce** (`play` is
  `state === "correct" && !fadeOut`): on the 3D route that is step 11 (Pick Up moves the robot, so the cards clear; checked: its card stays 163×184). Not looked at as a picture mid-jump, nor on 7, 10, 11, 19, 20, 25, 26, dark mode, a real phone.
- **Place 12 ("Arrange the instructions!", `ArrangeScreen`) has the design's empty slots (2026-11-22, Figma crop + CSS):** on the 3D route only
  (`useSequenceFlow().designSlots`, true there; the 2D route keeps its solid wells). Slots are 112×119, `#EEF0F7`, 2 px dashed `#BFC7D5`, radius 8, 14 apart, with a
  40 px `#BFC7D5` badge and the number in Poppins 500 16 px white (`designSlots` in `arrangeGeometry` / `ArrangeBoard`, board `GEO_3D`). **The cards are the
  same 112×119 and there are three** (second crop + CSS, same day): Place in target (blue, lower case "target"), Pick Up (pink `#FFF4F6`), and a third in lavender `#F6F4FE`: the crop shows "Pick Up" twice, but the user
  didn't want two Pick Ups and chose "a different name" for the extra; they gave none, so it is **"Put Down"** (the commands module's third command, icon `step-13.2.svg`; a name to confirm),
  for the two slots, which stand centred over the row of cards (`cardCount` in `arrangeGeometry`; `CARDS_3D`, board `GEO_3D`). Card = 4 px white border, 52 px picture box (image 52×36),
  16 px / 600 name with line height 100 %, 6 px gap (`design` on `ArrangeCard`). Put Down is never right (kind `putdown`). They share the geometry
  with the slots, so a card fills the slot it lands in. The 14 px gap is read off the crops (3 × 112 + 2 × 14 = 364 of the 390 frame). **Every other empty drag slot on the 3D route has the same look** (asked for: "everywhere the empty drag card should be of same design"): dashed `#BFC7D5` on `#EEF0F7` with the 40 px badge
  (`DESIGN_SLOT` / `DESIGN_BADGE` exported from `ArrangeBoard`) on the boards of 15, 18, 21, 24 and the places of `ChipList` (22, 23), each keeping its own size (108×84/100/124, 166×116, 80×80);
  only screen 12's slots and cards were resized to 112×119. The 2D route keeps the old wells. The cards of those screens, and screen 12's shadow behind a card, are as before. **Each card leaves a plain shadow in its tray place** (asked for: "cards don't have any shadow left behind", then "put that shadow on all drag options in whole module"; the standing "drag shadow always there" rule of the user's other branches, which `ArrangeBoard` here did not have): a `rgba(0,0,0,0.09)` shape the card's size behind each card from the start, shown when the card is dragged or tapped into a slot. **It is on every `ArrangeBoard` (12, 15, 18, 21, 24) and for the chips of `ChipList` (22, 23: it fades in with the chip and follows its place when the order changes), on both routes.** Not done: the Data Types `DragCard` and the onboarding time slider (other modules). **The shadows fade out (0.25 s) while the result popup is up, right or wrong, and come back on Try again** (`hideShadows` on `ArrangeBoard` and `ChipList`, given each screen's own "popup open" state: `resultShown` on 12 and 15, `phase === "checked"` on 18, 21, 22, 23, `checked` on 24). **The extra card drops down on Check** (asked for: "one extra option should drop down"; chosen from three readings): the card in no slot falls
  110 px and fades in 0.45 s (`dropUnused` on `ArrangeBoard`, `dropped` on `ArrangeCard`), right or wrong, then the board clears 0.4 s later (`fadeDelay` on `ArrangeDock`, which also
  delays the right-order rise). On "Try again" it comes back to its place. 3D route only. Checked in headless Chrome 390×844: open, three cards, cards tapped into the slots, the fall sampled (see the
  checked list in the reply of that day; not looked at: dark mode, the wrong-order path end to end, Try again, 360×640 with three cards, a real phone).
- **Place 13, "Meet the Sequence" (2026-11-22, `Meet3DScreen`, from a Figma crop):** not the original `MeetSequenceScreen` any more (that stays on the 2D route). Title without the
  full stop, two flat 166×187 cards ("Pick up", "Place in target", `PictureCards flat`, top Figma 165), and the character big underneath, close up (`framing="bust"`, box 690 tall from Figma top 228,
  head about 14 px under the cards, faded low down and running past the screen's bottom). **Gone: the small face with Hex's bubble row at the top, and the play button with the word-by-word
  definition.** The character says both clips instead (`meetSequence`, then `sequenceClip`, so the definition is heard, not read; the typed-reading fallback uses the definition's words).
  Not in the design crop and so not added: the thumbs-up pose (the crop is a render; we only have Idle and Talking). Checked in headless Chrome 390×844 (open). Not checked: other sizes, dark mode,
  Boy/Anime, the voice (headless has none), a real phone.
- **Place 18 ("Arrange the commands!", `HexOrderScreen`) game button pictures (2026-11-22):** "change the game button icons as per it is from the folder" was read as the Hex game screens' pictures in
  `public/animations/svg/game-path/` (`arrow-up.svg` for MOVE FORWARD, `arrow-right.svg` for TURN RIGHT, 52×52), which the user's other branches use for the game buttons (`MoveTile`) but this branch lacked;
  the four arrows were copied byte for byte from `feat/Sequence`/`variable-module` (same path, so a merge is clean). They replace the lucide arrow and rotate icons on the cards; tints, sizes and the
  boards are as before. Both routes (the screen is shared). **Not confirmed with the user:** the folder named could instead be `public/animations/svg/sequence-3d/` (it only holds screen 8's five files, nothing
  for 18) or `public/images/moves/` (PNGs with the label baked in). **Place 19 too ("fix the game button on screen 19 too"):** its game buttons are the numbered command cards of `CommandChips` (`HexScreen.tsx`, TURN RIGHT / MOVE FORWARD, 108 or 80 wide × 84 tall), now the same two arrows, 44 px (the card is only 84 tall; 52 would not fit two lines of name on the 80-wide cards). `CommandChips` is also place 20's (`PredictFollowUpScreen`), so that changed too. **Place 21's cards no longer shift when the result popup comes ("do not shift the game buttons as with the popup")**: `FixScreen` used to lift its cards (and the Replay pill) 200 px on Check so they stood clear above the panel; now they stay where they were (the 50 px `LIFT` they always had), and the panel covers what is under it (`ArrangeDock behindPanel`: z 0, so the panel, drawn later, is over the cards instead of the cards over its text). The other boards that rise on a result are unchanged and were not asked about: 12, 15 and 24 (arrange boards, on a right order or on Check) and the answer tiles of 19 and 20 (`TileCards rise`). **Place 22's two command buttons ("fix the game buttons on screen 22 too", then "buttons ko baki game buttons jaisa banado" after a popup question):** nothing on 22 shifts on the popup (chips at y 424 and buttons at 524 before and after; checked), so it was read as: make them the same design as the other game buttons. They are now `MoveTile` (new `sequence/MoveTile.tsx`, a copy of the user's other branches' `MoveTile`: flat 150.5×99, 12 px padding, 52 px arrow over a 14 px / 500 name, presses in to .97, fades while disabled (`dim`)), "Move Forward" on `#EDFAFE` and "Turn Right" on `#FFF4F6` (title case, as on those branches), 18 px apart; the raised 164×76 buttons with the picture beside the name are gone. They are 23 px taller, so the result popup covers more of them (it was covering 17 px of the old ones). Place 23 is the same component. **Places 21 and 22 (and 23, same component) too ("screen 21 aur 22 par bhi same icons laga do"):** `FixScreen` cards (44 px), `PlanScreen`'s two command buttons (28 px, they share a row with the name in 148 px) and `ChipList` chips (40 px, 80 tall) all use the same two arrows. The pictures now come from one place, `COMMAND_PICTURE` in `hexGrid.ts` (also used by 18 and 19); no lucide arrow or rotate icon is left in the sequence screens. Tints, sizes and boards are as before.
- **Place 24, "One last challenge!" (2026-11-22, `Tea3DScreen`, from a Figma crop; icons `public/animations/svg/sequence-3d/3d-24-1..3.svg` the user added: pour tea, heat water, tea bag):** not the
  original `TeaScreen` any more (that stays on the 2D route). Title with "!"; the face **with its bubble** ("Time for tea! Arrange the steps in order.", 154 wide, the short one: the crop shows a bubble, so
  `HexBubble` got `withBubble`, which draws it where the 3D route's `HexStandIn` normally suppresses it; this screen only) ; three design slots (numbered 1, 2, 3: the crop reads 1, 2, 2, taken as a typo)
  hanging right under that row (Figma top 285) and the tray of three 112×119 cards (blue "Place"-style tints: Pour tea cream, Heat water lavender, Add tea bag blue; 52 px pictures) standing 44 px above
  the main button. There is no picture on the screen, so it is one `ArrangeBoard` in a box from the slots' top to the button, **its lane (space between slots and tray) measured from that box**
  (`ResizeObserver`, `lane = height − 2 × 119`): a tall screen's spare room is between them. The board is not drawn until it has been measured (no slide on open). Nothing shifts when the result comes:
  the slots are above the panel and the (empty) tray is behind it. "Pour tea" replaces the original's "Pour water" (the crop's word). Checked in headless Chrome 390×844 (see the reply of that day).
- **Place 25, "Why sequence matter?" (2026-11-22, `REFLECT_ORDER_3D` in `sequence3d.ts`, from a Figma crop; icons `3d-25-1..3.svg` the user added: socks, blocks, check):** no longer
  `SequenceQuizScreen`: it is `SequenceQuiz3DScreen look="tray"` with a list of three, like place 10 (the character close up, the tray, the rows, bounce on the right one). Texts as drawn:
  "It sorts things alphabetically", "Steps happen in order" (new, a plausible wrong answer with its own message in `wrongBy`), "It helps reach the goal" (right). **The title is the crop's, "Why sequence
  matter?" (no "does", which the original and probably the intended one has: a design typo to confirm).** The hint is the regular button (the quiz's `noHint` is off here; every tray screen uses the
  shell's hint). `noRetry` stays (a pick moves on), and there is no voice (`audio.question` is empty: the answers come in at once). Checked in headless Chrome 390×844 (see the reply of that day).
- **Place 26, "How to decide the order?" (2026-11-22, `REFLECT_DECIDE_3D` in `sequence3d.ts`, from a Figma crop; icons `3d-26-1..3.svg`: arrow, command window, cycle):** the same as place 25: `SequenceQuiz3DScreen look="tray"`
  with the three rows of the original (what must happen first = right), the title as drawn (the original's was "Which command goes first?"), the regular hint, no voice, `noRetry`.
- **After the merge of `dev` into `feat/3d` (commit `1fb38a1`, 2026-11-22) the build was broken and was repaired (not committed):** `TileCards` / `AnswerCards` (dev's `pointedId` and plain `div` rows, my `top`, `iconGap`, `bounceRight`, `width`, `endGap` kept),
  `ArrangeBoard` (rebuilt on **dev's** version, which has the Variable module's `circles`, `lockedIds`, `tapOnly`, `pointedId` …, and my 3D parts re-applied on it: `cardCount`, `designSlots`, `DESIGN_SLOT` / `DESIGN_BADGE`, the `design` card, `dropUnused`,
  `hideShadows` (on dev's own home shadow), `ArrangeDock` `fadeDelay` / `behindPanel`), `ChipList` (one shadow per chip, from the list, so it can fade), `SequenceQuiz3DScreen` and `Compare3DScreen` (the new `useAnswerHint` hand and `pointedId` instead of
  `hinted`; `noHint` is gone from the quiz type, every quiz has the hint), `SequenceQuizScreen` (`onPick={pick}` so the hand goes), and the `noHint: false` lines of `REFLECT_*_3D`. `npx tsc --noEmit`, eslint and `npx next build` pass.
  **After the merge `node_modules` was behind:** `package.json` / the lockfile want `@rive-app/canvas` 2.50.0 but 2.42.0 was installed, so `public/rive/rive.wasm` (the 2.50.0 one) failed with the old runtime and the Rive parts (progress bar, button, robot) did not draw (console: "Import #0 env"). `npm install` (asked for and approved, 2026-11-22) brought it to 2.50.0; `package.json` and the lockfile did not change. Checked after that in headless Chrome 390×844: 12 (design slots, shadow left behind), 24 (all three placed, Check, "Nice!"), 3 (Socks, Check, "Nice!"), 8 (right row, "Exactly!"), and the hint's hand pointing at the right row on 8. Not rechecked since the merge: 10, 15, 18, 19, 21, 22, 25, 26, dark mode, a real phone.
- **Roomier lists and a full-width tray on the whole 3D route (2026-11-22, "put some gap between col options … make the option bg panel full width of the device"):** the rows of every list of answers are
  `OPTION_GAP` = 12 px apart instead of the design's 6 (`AnswerTray.tsx`; used by the tray lists 10, 25, 26 through `TRAY_LIST`'s height and `gap`, by `Compare3DScreen` (8), and by `SequenceQuizScreen`'s list (7) through the flow's `optionGap`:
  12 on the 3D route, 6 on the 2D one). The grey tray (`AnswerTray`) is no longer inside the 390 px `Column`: it runs edge to edge of the device (the stage is as wide as the screen), so on a short or wide screen it
  no longer stops short of the sides (checked on 360×640: it reaches both edges). The pair of cards (3) was not changed. Checked in headless Chrome: 25 and 8 and 7 at 390×844 (rows 88 apart = 76 + 12), 10 at 360×640.
- **Place 7 ("What did you do?") shows its bubble again (2026-11-22, "show the screen 7 bubble too on screen 7"):** `SequenceQuizScreen` got `withBubble` (passed to `HexBubble`), and the 3D page passes it for place 7 only: the original screen's line ("You wore socks first, then shoes, before heading out.") is typed in a bubble beside the character's face (it also leaves with the face on Check, as the original's does). Places 11 and the others still show the face alone. Checked in headless Chrome 390×844 (open only; not the Check).
- **What happens to the answers when the result popup comes, on the 3D route (2026-11-22; "if there is an image above the options … make the image exit, in artboard case the options disappear" and "if removing the image attach the options to the header with some space"):**
  (a) **A picture above a list leaves** (fades, slides up, shrinks a little) and the rows **go up to the header**, their top 24 px under the title (Figma 178; the title ends at 154): place 7 (`SequenceQuizScreen`, its close-up; flow flag `clearsPictures`, the rows
  use the new `AnswerCards riseTo`, which measures where they stand and rises by the difference, so it holds on any screen height) and place 8 (`Compare3DScreen`, `CHECKED_ANSWERS_RISE` computed from the same 178). The 2D route is unchanged (the picture is pulled in
  and kept). (b) **Where the picture is the 3D character (the tray lists 10, 25, 26) the rows disappear** where they stand (`fadeOut`, no rise), so they do not run up over it and, as the user asked before for options that disappear, they do not bounce. The tray pair (3) is
  unchanged. Checked in headless Chrome 390×844: 7 (right pick: rows at y 141), 8 (wrong pick: rows at y 141) and 25 (right pick: rows gone, character clear). Not checked: 10 and 26 (same code as 25), dark mode, a phone, how the rows look when the result text is long.
  **Needed an install (done by the user later on 2026-11-22; `node_modules` now has `@rive-app/canvas` 2.50.0 and `react-canvas` 4.39.0):** with `node_modules` still on 2.42.0 the page loaded `public/rive/rive.wasm` (the 2.50.0 one) with the old runtime and the Rive parts (progress bar, button, battery, robot) did not draw (console: "Import #0 env"). On a new machine or after pulling a bump of these, `npm install` first.
- **`feat/3d` merged into `variable-module` (commit `e3f797c`, 2026-11-22) was committed with conflict markers and a mangled `ArrangeBoard`; repaired on `variable-module` (uncommitted):** the real three-way merge (base `b9e30dc`) was recomputed for every file both sides changed and
  resolved keeping both: `SequenceQuizScreen` (variable-module's `optionsTop` / `underAbove` / `useBottomEdge` and `listRise`, plus `riseTo`, `gap`, `bounceRight`, `withBubble`, `clearsPictures`), `HexOrderScreen` / `ArrangeScreen` / `DressArrangeScreen` / `TeaScreen`
  (`ArrangeDock slotsTop` from variable-module with `hideShadows`, `fadeDelay`, `dropUnused`), `ArrangeBoard` (variable-module's `DockGeometry` / `slotsTop` split dock with the 3D `designSlots`, `cardCount`, `dropUnused`, `hideShadows`, `behindPanel`, `fadeDelay`),
  `AnswerCards` (`top` is `number | string`), and `PlanScreen` (the real `MoveTile` from `level-one/MoveHexScreen`, so `sequence/MoveTile.tsx`, which was a stand-in for `feat/3d`, is deleted here). `tsc`, eslint and `next build` pass. Looked at in headless Chrome 390×844: 12, 22 (chips and the real `MoveTile`s), 7 (the rows now hang under the picture, 12 apart,
  with the bubble), 24 (open). Not rechecked: 15, 18, 19, 21, 23, 25, 26, the popup states, the 2D route, dark mode. `next.config.ts`'s `allowedDevOrigins` is the user's own resolution and was left alone.
- **Steps 10-12 (2026-11-21)** are the original screens `MeetSequenceScreen` (10), `RevealCardScreen` (11) and `DressArrangeScreen` (12), each
  asking `useSequenceFlow` for its place/next/back like `ArrangeScreen`; 10 and 11 are otherwise as they are (the face in the bubble on 10).
  **12 is a guess:** it is the only story screen between 11 and the Hex ones, but the Figma title for frame 12 is "Let's guess first" and the
  screen keeps the original "Arrange the instructions!" (no design was seen). **12 is the original screen as it is**: the room art board with the
  sitting boy, the character's face beside the bubble (as on 9 and 10), the slots and cards. **Tried and taken out on request:** the big 3D character
  standing in the room over the boy (and, for the face too, a second view drawn from the shared canvas with `addAfterEffect` + `drawImage`, since the
  canvas can be in one box at a time). The boy is part of the Rive room and cannot be hidden, so slivers of his hoodie and hair showed behind the
  character; and with the character kept after the answer, the room's dressing animation (2D boy) played behind it. If a 3D character is wanted in the
  room again, the room needs a boy-less state (a Rive input) first.
  Checked in headless Chrome 390×844, light, Boy: 12 opens, then socks → shoes → Check → "Perfect!" with the room's dressing animation; 10 renders;
  the 2D `?step=12` is unchanged. Not checked: the wrong path, Try again, dark, Girl/Anime on 12, step 11, the Next from 9 into 10 and from 11 into 12, a real phone.
- **`PortraitFraming` ("full" | "bust")** in `portraitHost.tsx`: the pose also carries the camera. `bust` is the same level camera, closer
  (`[x, 1.369, 2.507]`, 1.44 m of height) and **follows the hips' x** each frame (the idle clip shifts weight sideways, which is ~60 px
  when close). Done in the camera, not by scaling the canvas up, so it stays sharp (the canvas is a fixed 380×680 on purpose).
  `CharacterOnStage` got `framing`, `height` and `fade` (a mask over its lower part, so the legs don't show through the tray).
- **No speech bubbles anywhere on the 3D route (removed on request, 2026-11-21); the face stays** where it was. `HexBubble` draws no
  `SpeechBubble` when `HexStandIn` is set (only the face, in a row as wide as face + bubble, so it does not move); the 2D route is unchanged.
  `Story3DScreen` has no `line` prop any more (place 9 lost its "Let's get ready again…" line, which had no voice). Every place that had a
  bubble (4-9, 11-13, 15, 24-26) now shows the face alone; where a screen had no voice (4-6, 9) it now has the title only. The Hex-board tip card
  is not a bubble and stays. **While the voice plays (`speaking`), the face box shows a small pill at its bottom left with three dots
  (light, lime, green) that swell one after the other** (`TalkingDots` in `CharacterAvatar.tsx`; colours and size guessed from a small
  screenshot of the design). Seen with `speaking` forced on (headless has no sound), dark mode only; not seen with a real voice. **Checked** (headless Chrome 390×844, dark, Girl, battery unlimited): 4, 9, 12, 24 show the face and no bubble;
  tsc has only an old `.next/types` error for a `probe-studio` page that is not in `src`; eslint clean. Not checked: the other places, light mode, Boy/Anime, the 2D route after this change.
- **Guessed, not read from the design:** the line the character says on 6 (now place 9), the Aarav title's teal word, which frames use the big
  character and which the small face (3, 7 big as before; 1 big; 2, 4, 5, 6, 8 small, from the thumbnails). Voices: 3 and 7 keep the
  3D clips (`SEQUENCE_3D_AUDIO`); 1, 2, 6 have none; 4, 5, 8 play the original module's Hex clips.
- Removed: `PutOnShoes3DScreen` and its audio entry `screen3` (the design has no such frame; the m4a files are still in `public/audios/3D-Screens`). The original `PutOnScreen`s (2-4) are in the flow instead (places 4-6, face in the bubble, no 3D voices).
- Checked in headless Chrome 390×844 light, girl: all of 1-8 render; Continue/Next go 1→2→3, 6→7, 4→5 (right answer, Check, Continue)
  and 8→`/module/sequence?step=9`. Boy: steps 1 and 2 look right (the face crop and the standing one); Anime: step 2's face crop shows the
  face a little low in the box. Step 3 tray look (Boy, 390×844, light and dark): open state, bulb, pick, wrong → "Oops!" → Try again → right → "Nice!" → Next → step 4.
  Step 9 (Girl, 390×844, light, headless Chrome): the face in the bubble, Pick Up + Place in Target + Check → "Perfect!" → Next → `/module/sequence?step=10`;
  the wrong order, the voice, Boy/Anime and dark mode on it were not checked.
  Not checked: step 3 with Girl/Anime in the close-up (only Boy was looked at), a real phone, the bulb's hint effect (only that it is there), the 4, 5, 8 wrong-answer paths, voices
  (headless has no sound), the Boy/Anime on steps 3-8.

The character is also used as a **picture on other screens** (the 3D copies of the Sequence screens, `/module/sequence-3d`):

| File | Job |
|---|---|
| `sharedCharacter.ts` | Loads the character **once** per visit (never freed) and reports progress; `useSharedCharacter()`. |
| `portraitHost.tsx` | `PortraitHost` (mounted in the route's layout, behind its loading bar) makes **one** R3F canvas, draws its first frames there (shaders, textures), and keeps it. The canvas lives in a parking box off screen and is moved into whichever screen's slot asks; its own size is fixed (380 x 680) and it is scaled to the slot by CSS, because a resized canvas rebuilds its drawing buffers (seconds on a slow machine). The screen sets the pose (animation, lip-sync) through `setPortraitPose`. |
| `CharacterPortrait.tsx` | The slot a screen renders: takes the shared canvas into its box (no controls, no taps) and sets the pose. Needs `PortraitHost` above it. |

`AnimatedCharacter` / `SceneLights` / `GroundShadow` are exported from `CharacterScene.tsx` for this; `AnimatedCharacter` has a `lipSync` prop (default true).

Add an animation: name another clip of the model, or export it from Mixamo ("without skin", same
skeleton), put the `.glb` in `public/animations`, add a line to `ANIMATIONS`.

### The Variable module with the 3D character (`/module/variable`, in place), 2026-11-22

The user asked for the Variable module "in the same format as sequence-3d": the chosen character instead of Hex, with the bubble, the design's
empty drag slots, and the rest exactly as it was. Done **in the original route** (no new one), with three small pieces:

- `src/app/module/variable/layout.tsx` wraps the route in `VariableCharacterGate` (a loading bar until the shared character and its canvas
  have drawn; `PortraitHost` mounted here) and `CharacterLook` (`sequenceFlow.tsx`: the 3D flow flags + `HexStandInProvider` with
  `CharacterAvatar` + `HexStandInKeepsBubble`).
- `HexStandInKeepsBubble` (`level-two/HexStandIn.tsx`) is a context that makes `HexBubble` draw its bubble **beside** the stand-in (the
  Sequence 3D route has the face alone, so there the bubble stays suppressed). Without the provider nothing changes.
- `ArrangeBoard`: with `designed` (the 3D flag or `geo.designSlots`) an empty slot has the design look even when the board asks for
  `highlightEmpty` (the breathing ring is still added), so Variable 19 (prices) and 27 (steps) get the grey dashed slot, green dashed for the open one.
- Every `HexBubble` of the module (quiz, Thirsty, Trek, PlanApp, narration) picks the face up through the provider; none was edited. The
  result panel's Hex robot and the "Lesson complete" robot stay (as in the Sequence 3D route).

**Title screen "Let's Learn Variables" (`?step=0`, added the same day):** `VariableIntroScreen` = the Sequence 3D intro's layout
(`CharacterIntro`, extracted from `Intro3DScreen.tsx`, which now uses it with the same look) + the design's tilted "age = 20" code tag (`AgeTag`,
upper right over the hair). It is **step 0 on purpose**: every PDF screen keeps its number (the old notes say "screen 19, 27"), the progress
total stays 34 (the bar starts empty), and the battery still restarts and spends at screen 1 (`chargeBatteryScreen`, `FIRST_SCREEN` = 1; step 0
spends nothing, checked: 100 → 95 on Continue). `/module/variable` with no `?step` and the home path open it (`HomeRoutes`). The character
only stands (Idle B): there is no thumbs-up clip (`ANIMATIONS` has only idle and talking), so the design's thumbs-up pose is not there.
Checked at 390×844, 360×640, 412×915 and 820×1180, Continue → step 1; the X still goes to `/level` (Back is the dev panel's `variablePrevious`).

**What was found, not changed:** no Variable quiz uses column rows. All answers are `acrossCards` (3 across or 2 x 2, words <= 2 or four
short ones), screen 16 is an info list, 27 is wide step cards with circle slots, 34 is a recap with no Hex. So there were no "rows
screens" to give the 76px 3D rows, and no scene-less screen with room for a big character (27 is full). The module's own option sizes
(`OPTION`), the bubble sizes and the scenes are as before.

Checked (headless Chrome, SwiftShader, 390×844 light; `tsc`, `eslint` on the touched files): all 34 screens at rest (face + bubble where Hex stood;
screens 1-15 pixel-compared with the old build: only the face box, animated scenes and the button sheen differ); step 3 wrong → Try again →
right (panel, confetti, face and bubble leave on a check); 15 wrong → right; 5 → Next; 19 by tap and by drag (match bounce, Next);
27 wrong tap; 14; `?step=complete`; 1, 19 and 27 again at 360×640 and 412×915. **Not checked:** dark mode, a real phone, voices (play was blocked),
the 27 full run to the end, the Variable interactions' later stages (6, 7, 13, 16 second stage) by hand, `next build`, and the other characters
(only the default one was in the browser).

### The Command module with the 3D character (`/module/commands`, in place), 2026-11-27

The user asked for the Variable module's kind of title screen plus the character on some question screens ("screen 3, 9, 11", three design
pictures). Only those four screens changed; Hex and the robot stay on every other screen.

- `src/app/module/commands/layout.tsx` wraps the route in `VariableCharacterGate` (loading bar until the shared character and canvas have drawn) and `CharacterFace`
  (`sequenceFlow.tsx`: **only** the `HexStandInProvider` with `CharacterAvatar framing="face"` + `HexStandInKeepsBubble`, 2026-11-27 on request: "replace the bubble Hex too").
  So **every `HexBubble` of the module (screens 2, 4, 5, 7, 8) shows the character's face in the small box with the bubble beside it**; the robot and the result panel's Hex
  are unchanged. **Screens 12 and 13 ("Imagine Teacher Says..", "What teacher is doing?"; one `TeacherFlow`, so one Hex across both) too (2026-11-27, "replace hex on screen 12 too")**:
  `TeacherSpeech` draws `useHexStandIn()` in Hex's 130 px slot (centred across, standing on the slot's bottom so the box clears the teacher's bubble, no float) instead of `OnboardingHex`;
  it comes up beside the bubble at "open your notebook", stays through the pick and sinks behind the options on Check, as Hex did. Checked in headless Chrome 390×844 (girl, anime): 12, Continue → 13,
  pick + Check → panel. Not checked: the intro moment (the face standing below the picture before the cue; the 14 s waits had already passed it), dark mode, a phone. Screens 14-16
  (examples, video, Hex's game) still have Hex. **Not `CharacterLook`**: that also sets the 3D flow's flags (bounce, design slots, next/previous), which this module doesn't want.
  **The face box has its own framing (`"face"` in `portraitHost.tsx`, `CharacterAvatar` `framing="face"`):** the avatar's default crop (head and shoulders cut from the full-length picture) put
  the face small and, with the idle sway, off to the left; `face` is a camera at 1.75 m, level at y 1.62 and following the head bone's x (`HEAD_NAME`), showing 1.0 m of height, the slot 201 px
  tall at top −53 so the 94 px inside the box show about 0.47 m (hair to chin about 0.33 m on all three characters, measured, with neck and collar under). Looked at zoomed (4×) for girl, boy and
  anime on screen 4. **The Sequence 3D and Variable avatars still use the default crop** (not asked for); `<CharacterAvatar framing="face" />` would give them the same.
  The box is the module-wide 100 px (`HEX_SLOT` − 10); the user's reference picture drew it smaller (about 80 px at 390 wide), not copied.
- **Step 0 = "Let's Learn Commands"** (`CommandIntroScreen`: `CharacterIntro` alone. **No terminal tag on it: it sat over the character's hair and the user asked for it gone**;
  `CommandTag` is still on screen 9). Step 0 on purpose, as in Variable:
  screens keep their numbers, `MODULE_STEPS` stays 16, the bar starts empty, the battery spends from screen 1. `/module/commands` with no `?step` and the home path
  (`HomeRoutes`, `commandsHref(0)`) open it; screen 1's Back goes to it.
- **Screens 3 and 11** = `CharacterQuizScreen` (`level-two/`), the Sequence tray look (pattern backdrop, close-up character that opens low and rises as the answers come
  in at 75 % of the voice, grey `AnswerTray`, three 76 px rows, rows go on Check) with the Command module's rules: `noteAnswer` / `nextAfter`
  (a miss is not retried, it is asked again in the review), Check then Continue. **(2026-11-27, asked for) There is no main button until an answer is picked**
  (`ctaHidden` on `LevelOneShell` / `ActionRow`, a new optional prop: faded and dropped 24 px, `inert`, slides up on the pick; no other screen passes it), and **the hint is the unchanged
  `HintButton` (57 px, orange bulb, badge) standing over the tray's top right** (right edge 16 from the column's, 16 over the tray's top edge, popped in with the tray, folds
  away on Check), not beside the main button. So the shell gets no `hint` here: the button is the full-width one and `withHint` is false in every `aboveButtons` call of the screen
  (rows and tray stand about 7 px higher than the Sequence tray's). Screen 3's answers have no full stops (the design's), its icons are the old `step-4.x.svg`;
  screen 11 keeps its rows and result texts and the old `/images/level-one/*.png` icons, with the title "Instructions are…" and no question badge. No robot move plays on screen 3 any more (there is no robot).
- **Screen 9** = `MeetCommand3DScreen`: title, the pale circle (`IntroBackdrop` now exported with a `circle` prop), the character head to belt fading into the voice clip's pill,
  the tag at the upper right. The design has no sentence under the clip, so "In Programming Languages, instructions are known as command." is only in the clip now.
  The character only stands: no thumbs-up clip exists (as for Variable's intro), and it does not talk while the clip plays.
- `MeetCommandScreen`, `InstructionQuizScreen` and `WHAT_JUST_HAPPENED` (`levelTwo.ts`) are no longer used by the route; left in place.
- Checked in headless Chrome (girl, light, battery unlimited): 0, 3, 9, 11 at 390×844 (3 and 9 also 360×640); 3 right → panel → Continue → 4; 11 wrong → panel → Continue → 12;
  `/module/commands` → 0 → Continue → 1; 9 → Continue → 10; 4 unchanged. `tsc` and eslint on the touched files pass (eslint reports `react-hooks/immutability` on `LevelOneShell.tsx` line 165, `stageScaleRef.current = …`: old, not from this work).
  The hidden button and the hint over the tray were looked at on 3 and 11 at 390×844 (open: no button, hint in place; pick → Check up; Check → panel, hint gone; the hint pressed on 11: hand + tint on Command) and 3 at 360×640.
  **Not checked:** dark mode, Boy/Anime, the voices
  (headless has no sound), the review pass for a missed 3 / 11, Back from 1 to 0, a real phone, `next build`.

### The Data Types module with the 3D character (`/module/datatypes`, in place), 2026-11-27

The user asked "do all the similar things with the datatypes too, replace hex everywhere with bubble with the character and also add an intro screen" (a picture of
the "Let's Learn Data types" title screen: character with arms crossed, no tag). Same recipe as the Command module, no new character pieces:

- `src/app/module/datatypes/layout.tsx` = `VariableCharacterGate` + `CharacterFace` (only the bubbles' Hex becomes the face box with its bubble beside it; **not** `CharacterLook`, so no
  bounce / design-slot / next-previous flags: the module keeps its own flow, its adaptive `datatypesNext`). Every `HexBubble` of the module (the line under the title on every screen)
  picks the face up through the context; none was edited.
- **`SceneTourStage` (screen 4, "Group A-D")** had its own floating `OnboardingHex`: it now draws `useHexStandIn()` in that box when there is one. The face box is full to its edges (no
  air above it as Hex had), so **with the stand-in the face is beside the bubble for every group** (left for A and B, right for C and D, the pair moving 0-24 px across with each) and the tour's
  row is one box tall (110): a first try with the face over the bubble made the row 196 and the groups stood 35 px (390×844) to 86 px (360×640) over the artboard. `GroupTourStage` (the older tour
  with `HexBubble`) is not on any screen. **Screen 4's quiz** ("Same kind" / "Different kinds") has the icons `all.svg` / `different.svg` (`P.lookSame` / `lookDifferent`, as screen 2).
- **Step 0 = "Let's Learn Data types"** (`DataTypesIntroScreen` = `CharacterIntro` alone, word "Data types"). Step 0 on purpose (as Variable / Commands): the screens keep their numbers 1-30,
  `DATATYPES_STEPS` stays 30, the bar starts empty, the battery spends from screen 1 (`STEP.intro` = 0; `isDatatypesStep` takes 0). `/module/datatypes` with no `?step` and the level
  path (`HomeRoutes`, `datatypesHref(0)`) open it. `datatypesPrevious`: 0 → `/level`, 1 → 0, the rest as the adaptive flow. `datatypesNext(0)` goes to 1 through the same flow (no skip or detour touches 0).
- **Screen 2 ("Meet Aarav!") has three answers as a column of rows with icons (2026-11-27, asked for):** "All the same", "Different kinds", "All numbers" ("All words" is gone; the right one is still
  "Different kinds"), icons `public/animations/svg/datatype-module/{all,different,numbers}.svg` (the user added them, untracked until committed; 1.2 MB each, raster inside) via `P.lookSame` /
  `lookDifferent` / `allNumbers`. `layout: "rows"` on the stage (an existing `QuizStage` field, which the Data Types screens had not used) makes `DataTypesScreen` use `AnswerCards` (the module's
  56 px rows, 40 px icons) instead of `OptionGrid`, and `answersHeight(options, false, asRows)` counts them as rows (196 px) so the scene gives them room. Which word to drop was my choice
  (the three icon names say numbers / different / all). Checked in headless Chrome 390×844: open, wrong ("Not quite" panel, rows rise) → Try again → right ("Exactly!") → Next → 3; 360×640: rows fit,
  but the scene is cut at its floor (the form's "Permission" row is hidden, 70 px less room than the old 2×2 cards left it). Not checked: dark mode, the hint's hand on a row, a real phone.
- **Screen 1 ("Let's organise our event!") has picture cards that hang from the artboard (2026-11-27, from a design picture):** four tinted cards two by two, each a picture over its word —
  Name (blue), Age (pink), Height (cream), All (lavender; `CARD_TINTS`), with the app's raised 3D edge (`RAISED`) and the module's picked / right / wrong looks and bounce. The words are the
  design's short ones ("Name", not "Student's name"); ids and the right answer ("all") are as before, so the form scene still outlines the picked row. `layout: "pictures"` on the stage →
  `PictureGrid` / `PICTURE_CARD` (108 × 92, 14 apart, 52 × 40 picture, centred, narrower than the 340 column as in the design) in `OptionCards.tsx`; `answersHeight(options, three, layout)` counts them (198 px).
  **Icons:** Age and Height are `public/animations/svg/datatype-module/age.svg` and `measure.svg` (the user's new files); that folder has **no icon for Name or All**, so those stay the first set
  (`public/images/datatypes/datatypeModule-1.1.svg` person, `1.4` grid, `P.needName` / `P.needAll`), which is what the design picture shows (its All is the 2×2 grid; the folder's `all.svg` is the three
  cards, used on screen 2). Checked in headless Chrome 390×844: open, wrong ("Not quite"), Try again, right ("Exactly!") → Next → 2, the hint (hand on All, orange tint); 360×640 open and wrong.
  Not checked: dark mode, a real phone, the card sizes against the design to the pixel (read off a 218 px wide picture: 108 wide, gap 14 are estimates).
- **Screen 5's question (5.2) has three picture cards in one row (2026-11-27, asked for):** Quantities (right), People's names, Yes/no answers ("Colours" removed); lavender / blue / green tints.
  `PictureGrid` goes three across for exactly three options (equal columns of the 340 px, 110 tall = `OPTION.pictureHeight`, a two-line room for the words, every picture fitted in 52 × 40). Icons:
  `datatype-module/quantities.svg` (the user's), the person `P.needName`, the Boolean type's traffic light `P.boolean` (**the folder has no icon for names or yes/no**; the traffic light looks thin).
  5.1's three info rows are unchanged. Checked 390×844 and 360×640: wrong → Try again → right → Continue → 6.
- **Screen 6's question (6.2) is the same three picture cards (2026-11-27, asked for):** Height (cream, `datatype-module/measure.svg`), Weight (blue, the user's new `datatype-module/weight.svg`),
  Both (lavender, right). **The folder has no icon for "Both"**: it uses `variable-module/both.svg` (the plus), `P.pickBoth`. Ids are unchanged, so the pick still glows `sel3` / `sel4` in the lab.
  Checked 390×844 and 360×640: open, wrong → Try again → right → Next → the third stage.
- **Screen 14 ("Let's check attendance!") is three picture cards too (2026-11-27, asked for):** Person's name (blue, `P.needName`), A quantity (lavender, `P.quantities`), Yes/no status (green, right,
  `P.boolean`: screen 5's three pictures). "A measurement" was removed (my choice: it overlaps "A quantity"). The ids and `correctId` `at(2)` are unchanged. Checked 390×844 and 360×640: wrong → Try
  again → right → Next → 15.
- **Screen 18's question (18.2, "Why is Student ID text…?") is three picture cards (2026-11-27, asked for):** Identifies someone (blue, `P.needName`, right), A decimal number (lavender, `P.allNumbers`
  = `datatype-module/numbers.svg`), True or False (green, `P.boolean`). "A height" was removed (my choice: the weakest wrong answer). 18.1 (the sorting stage with four type buttons) is unchanged. Checked
  390×844 and 360×640: wrong → Try again → right; Next then went to 17, which is the adaptive flow's detour after a miss on 18, not a bug.
- **Screen 19's two uses were made picture cards and that was undone on request (2026-11-27):** `SceneSortStage`'s `cards` mode, `SORT_CARD` and the bucket `tint` are gone; the two buttons are as before
  (the stage's usual tinted buttons with the cube and document pictures). Screen 19 is not a picture-card screen. **Screen 20 was tried the same way (three type cards, Boolean dropped) and undone on
  request too:** it is the four-type sorting with its five values again; the sorting stages (19, 20) are not picture-card screens.
- **Screen 23 ("Can you find the mistake?") has three picture cards in both stages (2026-11-27; the user pasted a summary line that said "Screen 23", and answered a popup with "both stages, 3 cards"):**
  23.1 (the question): Age (pink, `age.svg`), Height (cream, `measure.svg`, right), Is_present (green, traffic light); **"Name" was dropped (my choice)**; `layout: "pictures"`, ids unchanged so the pick
  still lights its row of the record. **23.2 (replace the wrong type) first got three type cards with Boolean dropped, then (same day, see "The four types look the same everywhere" below) went back to all four types two by two
  in the sorting buttons' format: the `cards` prop of `ChooseTypeStage` is gone.** The stage keeps its cards above the result panel (`keepOptions`) and the hint stands under them. Checked 390×844: open,
  wrong, right → Next → 23.2 open, wrong (red + hint), right ("Fixed!"). Not checked: dark mode, a real phone.
- **Screen 24's question (24.2, "Why is Player ID a String rather than an Integer?") is three picture cards (2026-11-27, asked for):** Identifies players (blue, `P.needName`, right), A yes/no value (green,
  `P.boolean`), A big number (lavender, `P.allNumbers`); **"A decimal number" was dropped (my choice: "A big number" is the better wrong answer against Integer)**. 24.1 (the five-value sorting with four
  type buttons) is unchanged: sorting stages are not picture-card screens (screens 19 and 20 were undone). Checked 390×844 and 360×640: wrong → Try again → right → Next (went to 20: the adaptive flow's
  detour after a miss on 24).
- **Screen 27's question ("Student ID “0045”: why is it treated as text?") is three picture cards (2026-11-27, asked for):** the same three as screen 18's: Identifies someone (blue, `P.needName`, right),
  A decimal number (lavender, `P.allNumbers`), True or False (green, `P.boolean`); **"A height" was dropped (my choice, as on 18)**. Checked 390×844 and 360×640: wrong → Try again → right ("Correct!") →
  Next (went to 12: the adaptive flow's detour after a miss on 27).
- **The four types look the same everywhere they are chosen (2026-11-27, "change the icons for all types … everywhere the types are options … same format as screen 20; if there is a value above them keep them flex
  (a row), if not 2 by 2"):**
  - **Icons:** `P.integer` / `float` / `string` / `boolean` (`pictures.ts`) are now the user's `public/animations/svg/datatype-module/{intiger,float,string,boolean}.svg` (orange #, green =, purple quotes, blue ✓✗;
    the Integer file is spelt `intiger`). They replace the cube, coins, alphabet and traffic-light pictures everywhere `P.*` is used, including the yes/no picture cards (screens 5, 14, 18, 24, 27, 23.1), screen 16's TRUE
    button, screen 17's four cards, screen 19's "Calculate a total" (`P.integer`) and the tabs of screen 29's drag board.
  - **A value above them** (the sorting stages: 3, 9, 18, 20, 21, 22, 24.1): the buttons in a row, `SceneSortStage`'s stacked format (screen 20's); the icon is 32 px (was 24). **Screens 3 and 9 were words-only 2×2
    plain buttons and now have the row with icons** (3: four across; 9: its two types side by side); `withoutIcons`, `SIMILAR_BUCKETS` and the `plain` / `columns` props there are gone.
  - **No value above them** (type quizzes 8.2, 25, 26, 28 and the type picker 23.2): two by two. The quizzes are `layout: "pictures"` with `typeOptions()` (each type's icon and its sorting button's tint: Integer blue,
    Float lavender, String green, Boolean cream; all four types, same colour wherever); 23.2's `ChooseTypeStage` has the sorting buttons' own look (68 px, icon over word, 13 px) two by two.
  - Not changed: screen 17's tap-to-see cards (four across, they are not an answer), screen 29's drag board (spots with the type's tab, not buttons), screen 4's groups. The quiz cards (108 × 92) and the
    sorting buttons (81 × 68) are the same family but not the same size.
  - Checked in headless Chrome: 390×844 every screen above opened (positions measured: sorting rows 4 px under the artboard, quizzes 12), 25 wrong → right → Next (went to 7: the adaptive detour), 23.2 wrong (red) →
    right ("Fixed!"); 360×640 3, 9, 18, 20, 22, 24, 25, 26, 28, 23.1: all clear of the main button. Not checked: dark mode, 8.2 at 360×640 (opened while still bouncing in), a real phone.
- **Every option hangs under what is above it, not on the main button (2026-11-27, "every options should attached to the artboard … if no artboard to the bubble … if no bubble to the question, header";
  replaces the 2026-11-15 "docked above Continue" rule).** Data Types only (Sequence and Variable already did this; Commands, Operators, Conditions were not touched).
  - Questions: all answer kinds hang at `answersTop` (`DataTypesScreen`): `underAbove(above + 12 + question)`, `above` = the scene's bottom, with no scene the bubble's, with no bubble the title's; never
    lower than the button row; checked, they rise with the scene by CSS `top` (`liftCss`) and never lower than the old place above the result panel. A `quiz.question` hangs between. `OptionGrid` got
    optional `top` / `move` (Operators, which shares it, passes neither) and `AnswerCards` optional `move`.
  - The scene is cut at its floor only where the answers cannot hang under it: before a check not on a 390×844 phone, after a check by what the risen answers need (eased, `SceneBackdrop` `cutMove`).
  - Interactions: `UnderScene` is one flex column to the button line with a spacer as tall as the scene that shrinks when the screen is short (so no measuring for the position), `SCENE_GAP` 4; the stage is
    counted at least `DOCK_MIN_H` 186. A risen scene is cut `sceneLift` less. `follow` / `HangingUnderScene` are gone (only screen 4 used them; it is an ordinary stage now).
  - What a stage says now stands **under** its buttons (`ScenePickStage`, `SceneRevealStage`, `ChooseTypeStage`). Sorting stages keep the card to place and "Tap the bin…" above the bins: that block hangs.
  - Screen 29 (no scene) hangs from the bubble already; `SortStage` lost its 8 px top padding.
  - Checked in headless Chrome by a script that opens every screen and stage (stage set through React's state) and measures: at 390×844, 360×640 and 390×932 questions are 12 stage px under the artboard
    and interactions 4, and nothing is under the main button; stages hit by dev reloads during the run, and 4 and 29 after their fixes, were run again. Contact sheets looked at for 390×844 and 360×640.
    On 360×640 the cut hides the lowest part of some artboards (screens 18 and 20 lose the bins' type tags; the formula is the same as before this change). Not checked: dark mode, Boy/Anime, a real phone,
    desktop widths, finishing every interaction by hand.
- The result panel's Hex (thumbs-up robot) and "Lesson complete" stay, as in the other modules ("everywhere" was read as every place Hex stands beside a bubble).
- Checked in headless Chrome (girl, light, CDP): 0 at 390×844 (title, character, Continue → 1; battery 100 → 100 on 0, → 95 on 1); 1, 2, 3, 5, 6, 9, 10, 13, 14, 17, 19, 22, 24, 25, 29, 30 at rest
  (face + bubble on all that have a line); 4 through all four groups at 390×844 and the middle two at 360×640; 1 right answer → "Exactly!" panel (Hex robot) → Next → 2. `tsc` and eslint on the touched files pass.
  **Not checked:** dark mode, Boy/Anime, the Back arrow 1 → 0 (it is the battery hold menu's Back, read in code only), the other screens' interactions (drag and sort stages) end to end, voices
  (headless has no sound), a real phone, `next build`.

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
