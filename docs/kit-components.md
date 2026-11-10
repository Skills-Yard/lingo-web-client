# The kit's components (decided)

The agreed list of reusable components. Every screen of every module is built from these and nothing else: the data says *which* component and *what it shows*; no module or screen has components of its own. Names were chosen by the team; "from" says what each one replaces.

## On every screen

| Component | What it is | From (today) |
|---|---|---|
| **LessonHeader** | Top bar: close button, progress bar, battery | `Header`, `CloseButton`, `ProgressBar`, `BatteryMeter` |
| **LessonFooter** | Bottom bar: the main button (Continue, Check, Next, Try again) with the hint button beside it when a screen has one | `ActionBar`, `PrimaryButton`, `HintButton` |
| **LessonTitle** | The headline, key words in teal | `Title` |
| **HexGuide** | Hex with his speech bubble (the line he says) | `HexSays`, `SpeechBubble`, `Hex` |
| **ResultSheet** | The sheet that slides up after an answer is checked: Hex, a title, a sentence. **One component**, set to right or wrong by the data | `Correct`, `Wrong`, `ResultPanel` |
| **Celebration** | Confetti and "+10 XP" for a right answer | `Celebrate` |
| **RewardPopup** | The gem / XP popup after a chapter | `RewardPopup` |
| **SoundButton** | Mute / unmute | `MuteButton` |
| **KeyText** | The big plain sentence that states the idea | `KeyText` |

Dropped: the purple note card (`Callout`) and the tip card (`TipCard`).

## Answers

**Answers** is one component; the data picks the look: **rows**, **tiles**, **object cards**, **true / false** (or yes / no). It also draws the question that stands above the answers.

Each of these is its own component: **PickAll** (tick all that apply), **WordChips**, **LessonSlider**, **LessonTextBox**.

## Activities (the things to do inside a screen)

| Component | What it is |
|---|---|
| **RevealCards** | Tap each card to see what it means |
| **SortGroups** | Put items into groups |
| **BlockBuilder** | Build an expression or condition by tapping blocks |
| **OrderSteps** | Put steps in the right order |
| **SwitchTable** | Flip switches and see the result (AND / OR / NOT) |
| **PredictRows** | Predict a result row by row |
| **MatchPairs** | Match items from two columns |
| **NumberLine** | A line with marks, a gate or a range |

## Scenes and media

| Component | What it is |
|---|---|
| **LessonArtboard** | A Rive file shown at the centre of a screen, as in Sequence and the earlier modules. **The data names which artboard to show** (the robot arm, the bedroom, the flip card, ...) and what plays on it |
| **HexGame** | Its own component: guide Hex over the tiles to the battery, by moves or by writing a program |
| **AudioClip** | A voice clip to play |
| **VideoPlayer** | A video with a play button |
| **LessonCards** | Cards or tiles of facts and numbers. Kept for now; to be revisited |

### Illustrations drawn in code (temporary)

Data Types, Operators, Conditions and Variable draw about 20 pictures in code (the bottle, wallet, classroom, school scene, event scene, weather card, calculator app, ...). They are placeholders: each will be replaced by a Rive artboard shown with **LessonArtboard**, as Sequence and the first modules already do. Until a `.riv` exists for one, it stays as it is. The list of screens that need an artboard comes from `/kit/export` ("Kit coverage").

Plain layout and pictures (`Stack`, `Row`, `Spacer`, `Card`, `Picture`) stay as the building blocks.

## Rules

1. Data may name only these components (plus the plain layout ones).
2. A new screen never adds a component; if it needs something new, the kit gets a new general component, or a new setting on an existing one.
3. `/kit/export` ("Kit coverage") is the progress meter: it lists components still used on one screen only and names two components share.

## Order of work (decided)

1. **The frame, across all modules:** LessonHeader, LessonFooter, LessonTitle, HexGuide, ResultSheet, Celebration, RewardPopup, SoundButton, KeyText, Answers and the separate inputs, each existing once.
2. The activities: merge the one-off components into the eight above.
3. The whole screens still written in code (the recaps, trek, thirsty, plan app).
4. Sequence and Command, from these components only.
5. Switch the live routes to the data runner and delete the old screen runners.
