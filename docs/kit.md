# Screen kit

`src/components/kit/` has one component for each thing that stands on a lesson screen. Every component takes **plain data** (strings, numbers, booleans, arrays) plus callbacks, so a screen can be described as data and put together from these at runtime.

- `/kit` shows every component working, with sample data (light and dark).
- `/kit/screen` is a whole lesson screen made from kit components alone (`components/kit/gallery/KitDemoScreen.tsx`): a good template for the runtime that will build screens from data.

Import from the barrel: `import { LessonTitle, Answers, ScreenFrame } from "@/components/kit"`.

## Conventions

| Rule | What it means |
|---|---|
| Text is markup | Every text prop takes `*teal words*` and `**bold words**`. `Markup`, `parseMarkup`, `plainText` are exported. |
| Answers are controlled | A screen holds what is picked (`selectedId`) and tells the component when it has been `checked`. `correctId` marks the right one after checking; `revealCorrect={false}` shows only a wrong pick, so a retry is not given away. |
| Pictures | `image` is a file in `public/images/level-two/`, or a path starting with `/`. A missing file leaves an empty box, never a broken icon. |
| Layout | Components are normal flow (no absolute positions), so a screen decides where they stand. The ones laid over the whole screen (`ResultSheet`, `RewardPopup`, `Celebration`) go in the frame's `overlay`. |
| Taps | Pressable components click, buzz (`feelTap`) and set `pointer-events-auto`, so they work inside the frame's non-interactive stage. |
| Callbacks | What a component reports (a pick, a press) comes back through callback props. Plain data cannot hold functions, so whatever runs a screen supplies them. |

## Components

The decided list is `kit/index.ts` (`docs/kit-components.md` says why and what each replaced); `kit/internal.ts` also exports the parts they are made of, for the gallery. `KIT` in `kit/registry.ts` maps the data name (`kit:lesson-title`) to each component. **A component's props are its TypeScript type (`<Name>Props`): that is the one place that is always current. This page says what each is for.** Everything below is shown working on `/kit` (it opens on a **New** section).

Older names (the chat history and old commits use them): `Header` → `LessonHeader`, `ActionBar` → `LessonFooter`, `Title` → `LessonTitle`, `HexSays` → `HexGuide`, `Correct` / `Wrong` / `ResultPanel` → `ResultSheet`, `Celebrate` → `Celebration`, `MuteButton` → `SoundButton`, `AudioPlayer` → `AudioClip`, `MultiSelect` → `PickAll`, `OptionChips` → `WordChips`, `Slider` → `LessonSlider`, `TextField` → `LessonTextBox`, `OrderList` → `OrderSteps`, `SortBuckets` → `SortGroups`, `GameScreen` → `HexGame`, `PresetArtboard` / `FlipCard` → `LessonArtboard`, `OptionList` / `OptionGrid` / `OptionObjects` / `TrueFalse` → looks of `Answers`.

### On every screen
| Component | What it is |
|---|---|
| `LessonHeader` | The one header (the live lesson shell draws exactly this): a raised cross, the progress bar, and the battery on a raised face (a tap opens Energy, a hold the hidden dev panel with Back). `step`/`total`, `onClose`, `onPrevious`, `answer` (bar reaction), `batteryStep` (the screen whose battery share is spent), `persistent`. Parts (internal): `CloseButton`, `ProgressBar`, `BatteryMeter`; `persistent` (default) uses the session's one Rive bar/battery, which keeps its state between screens but can be on a page only once, `persistent={false}` gives each its own (the bar's fill then jumps instead of tweening). |
| `LessonFooter` | The bottom row: the main button (Continue, Check, Next, Try again) with the hint button beside it. `label`, `onContinue`, `disabled`, `locked`, `light`, `cube`, `hint: { visible, onUse }`, `answer`. Sizes itself from `ScreenFrame`. |
| `LessonTitle` | The headline; `*teal*` words, `size`, `oneLine`, `width`. |
| `KeyText` | The big plain sentence that states the idea of a "Meet ..." screen. |
| `HexGuide` | Hex with his speech bubble: `text`, `hex` (`left` / `right` / `top`), `width`, `leaving`, `onSpoken`, `cue`. Types in step with a `Voiceover`. (Parts, internal: `Hex`, `SpeechBubble`.) |
| `ResultSheet` | The sheet that slides up after a check: **one component** for right and wrong (`correct`), `open`, `title`, `text`, `centred`, `onPress` (tap to retry). Goes in the frame's `overlay`. |
| `Celebration` · `RewardPopup` · `SoundButton` | Confetti and "+10 XP"; the gem / XP popup after a chapter; mute / unmute. |
| `ScreenFrame` · `ScreenBody` | The frame of every lesson screen (header, footer, backdrop, `overlay`, `voiceover`; a 390 × 844 stage scaled as one piece) and the column the parts stand in (`lift` raises its bottom, `RESULT_LIFT` while a sheet is up). `Backdrop` (internal): `soft`, `meadow`, `room`, `none`. |

### Answers and inputs
| Component | What it is |
|---|---|
| `Answers` | **One component for every question**; `look`: `rows` (picture, words, radio; `compact`, `control`, `rowGap`, `rowFont`, `pictureRoom`), `tiles` (`tiles`: `pair`, `three`, `grid`, `cards`, or `auto` by count), `objects` (small cards to tap, `spill`), `trueFalse` (`yesNo` words). `question` stands above. Usual way: the screen holds `selectedId` and says when it is `checked` (`correctId`, `revealCorrect`, `hintId`). With **`instant`** each tap is checked at once and it holds the pick itself (`correctId`, `onRight`, `onWrong`, `wrongNote`). Parts (internal): `OptionList`, `OptionGrid`, `OptionObjects`, `TrueFalse`, `OptionRow`, `OptionTile`. |
| `PickAll` · `WordChips` | Tick all that apply (checkbox rows); short answers as wrapping pills (one, or several). |
| `LessonSlider` · `LessonTextBox` | A slider; a text field. |

### Activities (the things to do inside a screen)
They tell the screen through `api` (`slip` for a miss, `done` when finished, `finished`) and stand in an interaction stage. One component each, the data picks the `look`:

| Component | Looks | State |
|---|---|---|
| `SortGroups` | `columns` (drag cards into group boxes), `free` (group with no right answer), `labels` (tap a part, then its label) | built, in the data |
| `RevealCards` | tapped by the learner: `cards`, `scenes`, `share`, `flip`; introduced by Hex one per stage (`focus`): `situations`, `operators`, `jobs`, `tour` | built, in the data |
| `OrderSteps` | `drag` (numbered rows dragged up and down, checked by the screen), `tap` (steps tapped in order) | `drag` built; `tap` written, no screen uses it yet |
| `MatchPairs` | drag each card onto its place (a name onto its price); `places`, `cards`, words and `scene` come from the data | built; used by the code screen Variable 19, **the data file needs a re-export** |
| `BlockBuilder` | build an expression or condition from blocks | written (`kit/inputs/`), **not yet exported, registered or used** |
| `SwitchTable` | `combinations` (AND / OR / NOT), `switches` | written, **not yet exported, registered or used** |
| `PredictRows` | `predict` (row by row), `reveal` (tap a row to show its result columns) | written, **not yet exported, registered or used** |
| NumberLine | marks, a gate or a range | **not started** |

The facades (`SortGroups`, `RevealCards`, ...) choose among the older one-screen components in `kit/content/from-<module>/`; folding their shared code together is a later, internal step that does not change the data.

### Scenes and media
| Component | What it is |
|---|---|
| `LessonArtboard` | The screen's Rive artboard, by `name` (a preset in `ARTBOARDS`: `battery`, `progress-bar`, `button`, `flip-card`, `robot-arm`, `bedroom-room`, `gem`, `level-background`, `lesson-complete`, `reward-chest`, `reward-background`; each entry's comment lists its properties and triggers) or `src`. `properties` (view-model values), `trigger={{ name, id }}` (a new `id` fires it again), `tapTrigger`. With **`scene`** (`trek`, `bottle`, `names`, `items`, `shop`, `wallet`) it is the picture *behind* the screen (see "The scene behind a screen"). The plain `Artboard` is internal. |
| `HexGame` | Guide Hex over the tiles to the battery: `board` (`grid` / `row`), `start`, `goal`, `mode` (`program`: write commands, then Run; `move`: walk step by step), `maxCommands`, `onResult`. Parts (internal): `GameBoard`, `MovePad`, `ProgramBuilder`, `CommandCards`. |
| `AudioClip` · `VideoPlayer` · `Voiceover` | A voice-clip pill; a video with a play button; plays clips and tells Hex when it speaks (`sounds`: `playClickSound`, `useSound`, `vibrate*`). |
| `LessonCards` | Cards or tiles of facts and numbers (kept for now). `LessonComplete` (internal): the results artboard (`xp`, `accuracy`, `seconds`). |
| `Picture` · `Stack` · `Row` · `Spacer` · `Card` | Plain building blocks. `Spacer` pushes what follows it (the answers) to the bottom. |

Other internal parts: text (`Prompt`, `Note`, `TipCard`), buttons (`PrimaryButton` with a `module` or `onboarding` look, `HintButton`, `PillButton`), `AnswerMark` (tick / cross).

## Screens as data

The screens of the **Data Types, Operators, Conditions and Variable** modules (142 screens) are data files: `src/data/modules/datatypes.json`, `operators.json`, `conditions.json`, `variable.json`. `/kit/play/<module>?step=N` plays them (same steps as `/module/<module>?step=N`) with `ModuleRunner` → `ScreenRunner`, one implementation made of kit components that replaces the four screen components (`DataTypesScreen`, `OperatorsScreen`, `ConditionsScreen`, `VariableQuizScreen`).

### What a data file holds

```jsonc
{
  "id": "datatypes", "title": "Data Types", "level": 4, "steps": 30,
  "flow": { "skips": { "15": [14] }, "detours": { "9": 6 } },   // detours can be { "$ref": "operators.explainDetour" }
  "screens": {
    "2": {
      "step": 2, "title": "What do you *notice?*",
      "stages": [{
        "kind": "quiz",
        "line": "Notice the difference among his details!",       // Hex's line
        "visual": { "$": "datatypes.StudentProfileCard" },        // the picture: a component by name
        "options": [{ "id": "same", "text": "They all look same", "image": "/images/..." }],
        "correctId": "different", "rightTitle": "Exactly!", "right": "...", "wrong": "...", "hintText": "..."
      }]
    },
    "9": { "step": 9, "title": "Sort the *numbers!*", "stages": [{
        "kind": "interaction", "line": "Drag each number to Integer or Float.",
        "content": { "$": "datatypes.SortStage", "props": { "api": { "$ctx": "api" }, "items": [ ... ] } },
        "finishPanel": { "title": "Excellent!", "text": "..." }
    }] },
    "30": { "step": 30, "component": "datatypes.RecapScreen" }       // a whole-screen component
  }
}
```

Quiz stages are plain data: Hex's line, optional `question`, `visual`, `options` (`image`, `emoji`, `node`, `tint`), `correctId`, the two panel texts, `hintText`, `answers` (how the answers look: `rows`, `tiles`, `objects` or `trueFalse`, with `yesNo` for the words of the last; always written out, never worked out by the runner), `compact` (shorter `rows`), `keepLine`, labels, and (Variable's) `alsoOk` (other picks that are fine too), `hintVisual`, `hintOnMiss`, `spill`. Interaction stages (tap, sort, reveal, build, ...) name their component and give it plain props. `schema.ts` has the types.

A **node** is plain JSON plus four kinds of object, told apart by their key:

| Node | Meaning |
|---|---|
| `{ "$": "kit:title", "props": {}, "children": [] }` | A component: `kit:<name>` (the kit, see `KIT`), `<module>.<Export>` (the modules' own, see `runtime/registry.ts`), or an html tag. |
| `{ "$ctx": "api.hexSpoken" }` | A value the runner supplies when it draws: a picture gets `attempt`, `picked`, `checked`, `correct`, `hexSpoken`; an interaction gets `api` (`done`, `slip`, `finished`, `hexSpoken`, ...). |
| `{ "$ref": "datatypes.noteGrouping" }` | A named function or component of the app (a callback, a flow rule). |
| `{ "$fn": { "arity": 1, "body": <node> } }` | A function from its arguments (`$ctx` `arg0`, `arg1`) to a node (the `header` of an interaction). |
| `{ "$by": ["api.finished"], "cases": { "true": <node>, "false": <node> } }` | A decision table: yes/no values the runner supplies pick the case. |

### Where modules differ: `look` and `scene`

A module's design choices are data too. `look` says how its sheet is laid out (`sheet`: `centred` or `side`), how long a line may be before it goes on a card (`cardLine`), Hex's bubble widths (`bubble`), how far the body rises for big answers under the result sheet (`tileLift`), and whether interactions are `topAligned`. (How a question's answers look is **not** a module setting any more: each quiz stage says `answers` itself. The code screens still say `layout: "grid"`; the exporter turns that and the module's `QuizLook` in `ExportPage.tsx` into `answers` and `compact`.) `scene` is a picture behind every screen (Variable's mountain trail). Leave them out for the Data Types look.

`Answers` usually works as pick, then Check (the screen holds the pick). With `instant` it checks each tap at once and holds the pick itself: give it `correctId`, `onRight` (the stage's `{ "$ctx": "api.done" }`), `onWrong` (`api.slip`) and a `wrongNote`; it stands inside an interaction stage, as on Data Types 23.

A module's row style is in `look` too: `rows: { gap, fontSize }` (Variable's rows stand 10 apart with 16px words).

### The scene behind a screen

A screen can stand on a Rive scene: `"scene": { "name": "trek", "values": { "noWater": true }, "onRight": "cheer", "onWrong": "drinkHint" }`. `name` is one of the kit's scenes (`artboard/scenes.tsx`: `trek`, `bottle`, `names`, `items`, `shop`, `wallet`), `values` are set on it while the screen shows, and the triggers play as the learner answers: `onRight` / `onWrong` each time something is got right or wrong, `onTry` when the screen opens and for each new try. The runner draws it with `<LessonArtboard scene="trek" properties={...} />`, which is also how to put one behind a screen by hand. A scene is one canvas kept for the whole module, so what one screen did to it (the bottle filled) is still there on the next; pictures inside a stage can drive it further (Variable's `ItemsDrive`, `WalletDrive`...). A screen with a scene shows it in place of the module's `scene` picture and the pale default.

### Where the data comes from

The data was **generated from the screens as they were written in code**: `/kit/export` (development only) reads each module's `SCREENS` and flow, writes them as above and checks every picture, interaction and function by drawing the data again with sample values and comparing it with what the code draws (all 108 screens pass). If a screen's code decides something from a value the data cannot hold, the export reports it instead of writing it wrongly: move the decision into a named component or function and add its file to `runtime/registry.ts`. (That is how `operators/headers.tsx` and `ALL_ON` / `ANY_ON` / `FIRST_OFF` in `conditions/helpers.tsx` came about.) Press **Write src/data/modules/<id>.json** on the page to save. After that the data file can be edited by hand; re-exporting overwrites it with what the code says.

The screens are still written in code too, and the modules' own routes (`/module/<module>`) still play those. Once the data files are what you maintain, those screen files can go.

### How it is played

- `modules.ts` joins a data file to what is code: where the module's score is kept (`lingo.<module>-*` in session storage, shared with the module's own screens) and how `hexSpoken` is told to its interactions. The flow (skips and detours) is built from the data with `createAdaptiveFlow`.
- `ScreenRunner` holds a screen's state (pick, checked, hint, stage, try) and draws the stage with `ScreenFrame`, `LessonTitle`, `HexGuide`, `Answers`, `ResultSheet`, `Celebration` and, behind it, the screen's `scene`; a screen's `finish: "gem"` opens the gem popup.
- `hydrate.tsx` turns nodes into elements; `registry.ts` is the list of names.
- A whole-screen component (a recap) plays as itself and leaves through its module's own routes.

`KIT`, `KitNode` and `renderKit` (in `registry.ts`) are the typed way to write a node by hand: `KitNode` is checked per component, so a wrong prop name is a compile error.

## Things to know

- **One module button.** The lesson button (`LessonFooter`, which uses `PrimaryButton look="module"`) is a single shared Rive canvas moved from screen to screen, so show one at a time. Same for the persistent progress bar and battery.
- **Every `.riv` is loaded before any page mounts**: `RiveAssetsGate` in the root layout holds the app back until each file is downloaded and parsed once (`src/lib/rive/riveCache.ts`), so kit pages need no gate of their own. Any canvas you add takes its file from `riveSource(src)` (spread it into `useRive` / `new Rive` in place of `src`), and a new `.riv` goes in `RIVE_FILES`.
- **Not in data yet:** the Sequence module and the Command module (Level 1 and 2, `/module/commands?step=`). Their screens are bespoke (robot and room scenes, drag games, audio) and need a "scene" in the data plus screen-by-screen rebuilds from kit parts. Variable's four whole-screen components (trek, thirsty, plan app, recap) are named in its data and play as themselves.
- **Reuse, not rewrite.** Hex, the result sheet, the Rive header parts, the audio pill, the hint float and Hex's board logic are the existing implementations (in `level-one`, `level-two`, `onboarding`, `sequence`, `ui`), wrapped in a data-shaped API. The modules' own screens still draw themselves; only `/kit/play` uses the kit and the data.
- **Not in the kit yet:** the Sequence module's drag-to-arrange board, the Variable module's bottle and other one-off pictures, and the onboarding's 3D khaki option cards (`onboarding/optionCard.ts`) and dial.
