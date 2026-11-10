# Screen kit

`src/components/kit/` has one component for each thing that stands on a lesson screen. Every component takes **plain data** (strings, numbers, booleans, arrays) plus callbacks, so a screen can be described as data and put together from these at runtime.

- `/kit` shows every component working, with sample data (light and dark).
- `/kit/screen` is a whole lesson screen made from kit components alone (`components/kit/gallery/KitDemoScreen.tsx`): a good template for the runtime that will build screens from data.

Import from the barrel: `import { Title, OptionList, ScreenFrame } from "@/components/kit"`.

## Conventions

| Rule | What it means |
|---|---|
| Text is markup | Every text prop takes `*teal words*` and `**bold words**`. `Markup`, `parseMarkup`, `plainText` are exported. |
| Answers are controlled | A screen holds what is picked (`selectedId`) and tells the component when it has been `checked`. `correctId` marks the right one after checking; `revealCorrect={false}` shows only a wrong pick, so a retry is not given away. |
| Pictures | `image` is a file in `public/images/level-two/`, or a path starting with `/`. A missing file leaves an empty box, never a broken icon. |
| Layout | Components are normal flow (no absolute positions), so a screen decides where they stand. The ones laid over the whole screen (`Correct`, `Wrong`, `RewardPopup`) go in the frame's `overlay`. |
| Taps | Pressable components click, buzz (`feelTap`) and set `pointer-events-auto`, so they work inside the frame's non-interactive stage. |
| Callbacks | What a component reports (a pick, a press) comes back through callback props. Plain data cannot hold functions, so whatever runs a screen supplies them. |

## Components

### Layout
| Component | What it is |
|---|---|
| `ScreenFrame` | The frame of every lesson screen: header, main button row (+ hint), backdrop, `overlay`, `voiceover`. Scales a 390 × 844 stage as one piece. Wraps its children in `ScreenBody`. |
| `ScreenBody` | The column parts stand in, from the title down to just above the buttons. `lift` raises its bottom (use `RESULT_LIFT` while a result sheet is up). |
| `Backdrop` | `soft` (pale blue wash), `meadow` (Hex's grass), `room`, `none`. |
| `Stack`, `Row`, `Spacer`, `Card` | Flex primitives. `Spacer` pushes what follows it (the answers) to the bottom. |

### Header
| Component | What it is |
|---|---|
| `Header` | Cross + progress bar + battery. `step`/`total`, `answer` (bar reaction), `chargeBattery`, `persistent`. |
| `CloseButton`, `ProgressBar`, `BatteryMeter` | The parts. `persistent` (default) uses the session's one Rive bar/battery, which keeps its state between screens but can be on a page only once. `persistent={false}` gives each its own (the bar's fill then jumps instead of tweening). |

### Text
`Title` (headline, auto-sized), `Prompt` (the question over its answers), `BodyText`, `Note`, `TipCard` (`tip` / `info` / `success` / `warning`), `Expression` (calculations as blocks), `CodeBlock`.

### Hex
`Hex` (the character), `SpeechBubble` (a bubble on its own; `typed`), `HexSays` (Hex + bubble; types in step with a `Voiceover`).

### Answers (the option types)
| Component | Shape |
|---|---|
| `OptionList` | Rows with a picture, words and radio. `compact`, `control`, `stagger`. |
| `OptionGrid` | Tiles: `pair`, `three`, `grid` (2 × 2), `cards` (very big); `auto` picks by count. |
| `TrueFalse` | Two big cards, tick and cross; `labels` makes it Yes / No. |
| `MultiSelect` | Pick all that apply (checkbox rows). |
| `OptionChips` | Short answers as wrapping pills; one or `multiple`. |
| `OptionObjects` | Objects to tap as small cards: an emoji or picture over the name, three or two across; a wrong pick can `spill`. |
| `OptionRow`, `OptionTile` | The single row / tile the above are made of. |

All take `hintId` (the hint's orange fill and float), `checked`, `correctId` / `correctIds`.

### Other inputs
`Slider`, `TextField`, `OrderList` (drag rows into order), `SortBuckets` (tap an item, then its group).

### Result
`Correct` (green sheet) and `Wrong` (red sheet) slide up behind the main button with Hex: `open`, `title`, `text`, `centred`, `onPress` (tap to retry). `ResultPanel` picks by `correct`. `AnswerMark` (tick / cross), `Celebrate` (confetti + "+10 XP").

### Buttons
`ActionBar` (main button + hint, as at the bottom of every screen), `PrimaryButton` (`module` or `onboarding` look), `HintButton`, `PillButton`.

### Artboards
| Component | What it is |
|---|---|
| `Artboard` | Any Rive artboard: `src`, `artboard`, `stateMachine`, `size` / `bleed`, `properties` (view-model values), `darkThemeProperty`, `trigger={{ name, id }}` (a new `id` fires it again), `ref.fire(name)`. |
| `PresetArtboard` | One of the app's artboards by name (`ARTBOARDS`: battery, progress-bar, button, flip-card, robot-arm, bedroom-room, gem, level-background, lesson-complete, reward-chest, reward-background). Each entry's comment lists its properties and triggers. |
| `FlipCard` | The tap-to-turn card. |

### Audio
`AudioPlayer` (the voice-clip pill), `Voiceover` (plays clips and makes `Hex` talk and `HexSays` type in step), `MuteButton`, and `sounds` (`playClickSound`, `useSound`, `vibrate*`).

### Game
| Component | What it is |
|---|---|
| `GameScreen` | A playable level from data: `board` (`grid` / `row`), `start`, `goal`, `mode` (`program`: write commands, then Run; `move`: walk Hex step by step), `maxCommands`, `onResult`. |
| `GameBoard`, `MovePad`, `ProgramBuilder`, `CommandCards` | The board, the move buttons, the command editor, the read-only command list. |

### Media and rewards
`Picture`, `VideoPlayer`, `RewardPopup` (XP, gems, message), `LessonComplete` (the results artboard: `xp`, `accuracy`, `seconds`).

## Screens as data

The screens of the **Data Types, Operators, Conditions and Variable** modules (142 screens, 303 stages) are data files: `src/data/modules/datatypes.json`, `operators.json`, `conditions.json`, `variable.json`. `/kit/play/<module>?step=N` plays them (same steps as `/module/<module>?step=N`) with `ModuleRunner` → `ScreenRunner`, one implementation made of kit components that replaces the four screen components (`DataTypesScreen`, `OperatorsScreen`, `ConditionsScreen`, `VariableQuizScreen`).

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

Quiz stages are plain data: Hex's line, optional `question`, `visual`, `options` (`image`, `emoji`, `node`, `tint`), `correctId`, the two panel texts, `hintText`, `layout`, `compact`, `keepLine`, labels, and (Variable's) `alsoOk` (other picks that are fine too), `hintVisual`, `hintOnMiss`, `spill`. Interaction stages (tap, sort, reveal, build, ...) name their component and give it plain props. `schema.ts` has the types.

A **node** is plain JSON plus four kinds of object, told apart by their key:

| Node | Meaning |
|---|---|
| `{ "$": "kit:title", "props": {}, "children": [] }` | A component: `kit:<name>` (the kit, see `KIT`), `<module>.<Export>` (the modules' own, see `runtime/registry.ts`), or an html tag. |
| `{ "$ctx": "api.hexSpoken" }` | A value the runner supplies when it draws: a picture gets `attempt`, `picked`, `checked`, `correct`, `hexSpoken`; an interaction gets `api` (`done`, `slip`, `finished`, `hexSpoken`, ...). |
| `{ "$ref": "datatypes.noteGrouping" }` | A named function or component of the app (a callback, a flow rule). |
| `{ "$fn": { "arity": 1, "body": <node> } }` | A function from its arguments (`$ctx` `arg0`, `arg1`) to a node (the `header` of an interaction). |
| `{ "$by": ["api.finished"], "cases": { "true": <node>, "false": <node> } }` | A decision table: yes/no values the runner supplies pick the case. |

### Where modules differ: `look` and `scene`

A module's design choices are data too. `look` says how its sheet is laid out (`sheet`: `centred` or `side`), whether answer rows are `compactRows`, what a `grid` question draws (`tiles` or `objects`), how long a line may be before it goes on a card (`cardLine`), Hex's bubble widths (`bubble`), and whether interactions are `topAligned`. `scene` is a picture behind every screen (Variable's mountain trail). Leave them out for the Data Types look.

### Where the data comes from

The data was **generated from the screens as they were written in code**: `/kit/export` (development only) reads each module's `SCREENS` and flow, writes them as above and checks every picture, interaction and function by drawing the data again with sample values and comparing it with what the code draws (all 108 screens pass). If a screen's code decides something from a value the data cannot hold, the export reports it instead of writing it wrongly: move the decision into a named component or function and add its file to `runtime/registry.ts`. (That is how `operators/headers.tsx` and `ALL_ON` / `ANY_ON` / `FIRST_OFF` in `conditions/helpers.tsx` came about.) Press **Write src/data/modules/<id>.json** on the page to save. After that the data file can be edited by hand; re-exporting overwrites it with what the code says.

The screens are still written in code too, and the modules' own routes (`/module/<module>`) still play those. Once the data files are what you maintain, those screen files can go.

### How it is played

- `modules.ts` joins a data file to what is code: where the module's score is kept (`lingo.<module>-*` in session storage, shared with the module's own screens) and how `hexSpoken` is told to its interactions. The flow (skips and detours) is built from the data with `createAdaptiveFlow`.
- `ScreenRunner` holds a screen's state (pick, checked, hint, stage, try) and draws the stage with `ScreenFrame`, `Title`, `HexSays`, `OptionList` / `OptionGrid`, `Prompt`, `Correct` / `Wrong`, `Celebrate`; a screen's `finish: "gem"` opens the gem popup.
- `hydrate.tsx` turns nodes into elements; `registry.ts` is the list of names.
- A whole-screen component (a recap) plays as itself and leaves through its module's own routes.

`KIT`, `KitNode` and `renderKit` (in `registry.ts`) are the typed way to write a node by hand: `KitNode` is checked per component, so a wrong prop name is a compile error.

## Things to know

- **One module button.** The lesson button (`ActionBar`, `PrimaryButton look="module"`) is a single shared Rive canvas moved from screen to screen, so show one at a time. Same for the persistent progress bar and battery.
- **Every `.riv` is loaded before any page mounts**: `RiveAssetsGate` in the root layout holds the app back until each file is downloaded and parsed once (`src/lib/rive/riveCache.ts`), so kit pages need no gate of their own. Any canvas you add takes its file from `riveSource(src)` (spread it into `useRive` / `new Rive` in place of `src`), and a new `.riv` goes in `RIVE_FILES`.
- **Not in data yet:** the Sequence module and the Command module (Level 1 and 2, `/module/commands?step=`). Their screens are bespoke (robot and room scenes, drag games, audio) and need a "scene" in the data plus screen-by-screen rebuilds from kit parts. Variable's four whole-screen components (trek, thirsty, plan app, recap) are named in its data and play as themselves.
- **Reuse, not rewrite.** Hex, the result sheet, the Rive header parts, the audio pill, the hint float and Hex's board logic are the existing implementations (in `level-one`, `level-two`, `onboarding`, `sequence`, `ui`), wrapped in a data-shaped API. The modules' own screens still draw themselves; only `/kit/play` uses the kit and the data.
- **Not in the kit yet:** matching pairs (draw a line / tap-tap), the Sequence module's drag-to-arrange board, the Variable module's bottle and other one-off pictures, and the onboarding's 3D khaki option cards (`onboarding/optionCard.ts`) and dial.
