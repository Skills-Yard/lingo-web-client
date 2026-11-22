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
> - **Picking one.** Hold the battery (the dev panel of `BatteryMenu`): "Change character" opens the mentor picker (see "Select your
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
  grid; light mode only); the two cards (166×187, `TileCards` layout `tray`) stand on a grey `AnswerTray` and the hint is its own bulb
  (`TrayHint`) above the tray's right end. The shell's hint is passed `visible: false` (a hint still exists, so the streak counts it).
  The bulb icon is drawn by hand, not the Fluent emoji. The tray goes when the answer is checked and the cards rise as before.
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
  has a "Change character" button** (`BatteryMenu`) that opens `MentorPicker` (`character3d/MentorPicker.tsx`, moved from `sequence/`). The
  picker works on every screen that has the battery, not only the 3D route; `BatteryMenu` loads it with `next/dynamic` (`ssr: false`) the
  first time it is opened, so three.js stays out of the other screens' bundles.
  One card at a time over a dimmed screen: title, the name in a pill, the character, round arrows at its sides (they go round the three:
  Rio = `boy`, Veena = `girl`, Zane = `anime`, `MENTORS` in `characterLook.ts`; the names are guesses from the design image, whose
  characters are not ours) and a "Choose …" `Button3D`. The card's colour and arrows follow the mentor (`THEMES` in `MentorPicker.tsx`,
  guessed from the image, with dark variants). **The character on the card is the real model, idling** (`girl.glb`, `Male.glb`,
  `Male_anime.glb`), not a picture: `MentorStage.tsx` is one R3F canvas (camera level at `[0, 1.25, 2.4]`, head to thigh) whose character is
  swapped as the arrows move. `mentorPreviews.ts` loads each model when its card first comes up (a ring and a percentage until then, "Try again" if
  it fails), keeps them while the picker is open, and frees them all 1 s after it closes. They are **separate copies from the shared
  character** (`sharedCharacter.ts`), so on the 3D route the current one is loaded twice (two canvases cannot share one scene graph); the
  GPU memory (the girl's 8192² texture) is the cost, worth watching on phones. "Choose" calls `setCharacter`; the button says "Loading…"
  while the shared character loads and the card closes when it is on show (at once on a screen with no shared character). A tap outside or Escape
  closes it with the character unchanged. `public/images/mentors/{boy,girl,anime}.webp` (the old renders) are **no longer used**.
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
