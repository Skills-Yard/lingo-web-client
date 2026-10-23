# Lingo: Rive spec for the Flutter app

**Audience:** Claude Code implementing Rive in the Flutter client. Self-contained. Names come from the web client (`lingo-web-client`) code and a strings scan of the `.riv` files; the files were never opened in the Rive editor. Items marked **UNVERIFIED** must not be wired until confirmed.

**Where to look:** section 2 = the two buttons and exactly when each input fires. Section 4 = every `hex.riv` artboard. **Section 5 = every screen: its text, button state and the trigger order. Section 5 is authoritative for *when* to fire.**

## Rules

1. **Names are exact** (case, spaces, digits): `Splash Screen`, `6.1 and 5.1 2`, `09`, `State Machine 1`. Never tidy them.
2. **Use `rive` 0.14+ data binding** (view models). The legacy `StateMachineController` / `SMITrigger` API cannot drive these files. Pin one version and read its README/source before coding; Dart snippets are uncompiled.
3. **Load each `.riv` once** (`File.asset(..., riveFactory: Factory.rive)`, after `RiveNative.init()`), share the `File`, build one `RiveWidgetController` per widget. Build no widget and fire no trigger before loading finishes.
4. **Never fire a trigger before the view-model instance is bound. Fire each trigger once per key** (the value at mount counts as handled). **Never fire two triggers in one frame**: queue them 150 ms apart (4.1).
5. **Do not invent inputs.** Write only the properties listed here.
6. If the app has dark mode, write boolean `darkTheme` on every view model that has it (null-safe: ignore if absent).

## 1. Files

| File | Artboards used | View model |
| --- | --- | --- |
| `btn-click.riv` | `OnboardingButton`, `ModuleButton` | `Button` |
| `battery.riv` | `BTRY-001_Battery_Design_V3` | `Battery` |
| `hex.riv` (~6 MB, parse once behind the splash) | 13 artboards, section 4 | `Onboarding`, `Notify_VM`, `Splash_VM`, `RewardChest`, `LessonComplete`, others default |

Assets: `assets/animations/{btn-click,battery,hex}.riv`.

## 2. Buttons: TWO DIFFERENT widgets (`btn-click.riv`)

> The project has two different Rive buttons: different artboards, different art, different behaviour. **Build two separate widgets, `OnboardingButton` and `ModuleButton`. Do not build one button with a flag, and never use one artboard for both.**

| Where | Widget |
| --- | --- |
| Onboarding flow CTA (every step), Home career-detail "Start this career" | `OnboardingButton` |
| Level 1 (`/module`): every numbered screen, the reward screen, the lesson-complete screen | `ModuleButton` |

| | `OnboardingButton` | `ModuleButton` |
| --- | --- | --- |
| Artboard / machine | `OnboardingButton` / `Onboarding_SM` | `ModuleButton` / `ModuleButton_SM` |
| Inputs written | `label`, `click`, `shine` | `label`, `click`, `shine`, `buttonState` |
| Disabled look | App applies a grayscale filter; shine stops | Rive draws it (`buttonState = 0`); shine keeps running |
| Right / wrong answer | not supported | `buttonState` 3 / 2 |

View model `Button` (both): `label` string, `click` trigger, `shine` trigger, `buttonState` number (module only; `1` unused). Size 371 × 113: `AspectRatio(371/113)`, `Fit.contain`, centred.

### 2.1 When each input fires

**Both buttons**

| Input | Fire when |
| --- | --- |
| `label` | Written before first paint, then whenever the label text changes. `""` draws no text (the screen overlays its own content). |
| `click` | The user taps while enabled and no previous tap is pending. Sequence: call `onPress` (click sound) at once → fire `click` → call `onPressed` 330 ms later. Ignore taps during those 330 ms. |
| `shine` | Once on mount, then every 5000 ms while shine is allowed (see below). |

**`OnboardingButton`**

| Condition | Result |
| --- | --- |
| Enabled | Shine runs. Writes nothing else. |
| Disabled (`onPressed == null`) | Grayscale filter, shine stops, taps ignored. |
| Hidden (splash; sign-up until its animation settles; while the Skip link is showing) | Opacity 0 and ignore pointer, keeping its space. |

It is disabled when **any** of these is true: the screen's voiceover has not finished (done, failed or skipped); `name` is empty; a question screen has no pick yet. Label is the step's CTA text (section 5); `Get Started` on the sign-up screen.

**`ModuleButton`**: `buttonState` decides everything. Evaluate in this order:

| Condition | `buttonState` | Label on quiz screens |
| --- | --- | --- |
| A checked answer exists and it is **correct** | **3** | Continue |
| A checked answer exists and it is **wrong** | **2** | Continue |
| No answer, button disabled | **0** | Check |
| No answer, enabled | **4** | Check (Continue elsewhere) |

Shine always runs (even at 0). The answer is created once per Check press as `AnswerResult(id++, correct)` and stays set until the screen is left. **Clear it when a quiz is reset** (the web does not on the teacher quiz, which is a bug; do not copy it). The same `AnswerResult` also drives the progress bar's `correct` / `wrong` (4.6) and the result panel (section 5).

```dart
// Shared tap/shine timing only. Each widget below fixes its OWN artboard.
mixin _CtaTiming<T extends StatefulWidget> on State<T> {
  late final RiveSlot slot;   // RiveSlot: 4.1
  Timer? _shine; bool _pending = false;
  void startShine(bool on) {
    _shine?.cancel(); if (!on) return;
    slot.fire('shine');
    _shine = Timer.periodic(const Duration(seconds: 5), (_) => slot.fire('shine'));
  }
  void tap(VoidCallback? onPressed, VoidCallback? onPress) {
    if (onPressed == null || _pending) return;
    onPress?.call(); _pending = true; slot.fire('click');
    Timer(const Duration(milliseconds: 330), () { _pending = false; if (mounted) onPressed(); });
  }
}

class OnboardingButton extends StatefulWidget {          // artboard OnboardingButton
  const OnboardingButton({super.key, required this.label, required this.onPressed, this.onPress});
  final String label; final VoidCallback? onPressed, onPress;
  @override State<OnboardingButton> createState() => _OnboardingButtonState();
}
class _OnboardingButtonState extends State<OnboardingButton> with _CtaTiming {
  @override void initState() { super.initState();
    slot = RiveSlot(RiveAssets.i.button, artboard: 'OnboardingButton', stateMachine: 'Onboarding_SM');
    slot.setString('label', widget.label); startShine(widget.onPressed != null); }
  @override void didUpdateWidget(OnboardingButton o) { super.didUpdateWidget(o);
    slot.setString('label', widget.label);
    if ((o.onPressed == null) != (widget.onPressed == null)) startShine(widget.onPressed != null); }
  // build: grayscale ColorFiltered when onPressed == null; GestureDetector -> tap(...)
}

class ModuleButton extends StatefulWidget {              // artboard ModuleButton
  const ModuleButton({super.key, required this.label, required this.onPressed, this.onPress, this.answer});
  final String label; final VoidCallback? onPressed, onPress; final AnswerResult? answer;
  @override State<ModuleButton> createState() => _ModuleButtonState();
}
class _ModuleButtonState extends State<ModuleButton> with _CtaTiming {
  @override void initState() { super.initState();
    slot = RiveSlot(RiveAssets.i.button, artboard: 'ModuleButton', stateMachine: 'ModuleButton_SM');
    _apply(); startShine(true); }
  @override void didUpdateWidget(ModuleButton o) { super.didUpdateWidget(o); _apply(); }
  void _apply() { slot.setString('label', widget.label);
    final a = widget.answer;
    slot.setNumber('buttonState', a != null ? (a.correct ? 3 : 2) : (widget.onPressed == null ? 0 : 4)); }
  // build: no grayscale (Rive draws disabled); GestureDetector -> tap(...)
}
class AnswerResult { const AnswerResult(this.id, this.correct); final int id; final bool correct; }
```

Always wrap in `Semantics(button: true, label: label)` and exclude the Rive layer.

## 3. Battery (`battery.riv`)

Artboard `BTRY-001_Battery_Design_V3` (320 × 110), state machine `Battery_SM`, view model `Battery`. Colour (green / yellow / low / empty) is chosen inside the file from `level`.

| Property | Type | Rule |
| --- | --- | --- |
| `level` | number 0 to 100 | Write on mount and on every change. |
| `unlimited` | boolean | `true` shows the infinity sign. |
| `fullFlash` | trigger | Sparkle. Fire only when a lesson screen just spent battery. |
| `darkTheme` | boolean | From app theme. |
| `gain`, `spend`, `charging`, `bump`, `press`, `count` | **UNVERIFIED** | In the file, unused by web. Do not wire. |

**Store** (`level`, `unlimited`, `charged`; persist): starts at `level = 90` (18 of 20). Level 1 has 8 numbered screens, each costing 10: 80, 70, … 10. `chargeScreen(step)`: if `step == 1` refill to 90 and set `charged = 0`; if `step <= charged` return false; if `unlimited` count as paid but spend nothing; else `level = max(0, level − (step − charged) × 10)`; set `charged = step`; return whether it spent. Call it after the first frame of each Level 1 screen's header; **if it returned true, fire `fullFlash`**. Home card label: `round(level / 100 × 20)/20` (e.g. `18/20`), or `∞`.

**Where:** Level 1 header (44 px wide, calls `chargeScreen(step)` with the screen's step 1 to 8) and the home stat card (24 px wide, display only). **Not** in onboarding, reward or lesson-complete. Keep one long-lived `RiveSlot`, mount its `RiveWidget` with a `GlobalKey` so it keeps animating between screens.

## 4. `hex.riv`: the 13 artboards

| # | Artboard | State machine | View model | Fit / alignment |
| --- | --- | --- | --- | --- |
| 1 | `HEX` | `Onboarding` (live), `HEX-Floating` (home avatar) | `Onboarding` | contain / center |
| 2 | `6.1 and 5.1 2` | `Reactions_SM` | `Onboarding` | cover / center |
| 3 | `DayNight` | `DayNight_SM` | `Onboarding` | fitWidth / topCenter |
| 4 | `HEX_Notify` | `Notify_SM` | `Notify_VM` | contain / center |
| 5 | `Splash Screen` | `Splash_SM` | `Splash_VM` | fitWidth / center |
| 6 | `09` | `Onboarding_complete` | none | contain / bottomCenter |
| 7 | `BG_Grid` | `BG_SM` | none | cover / center |
| 8 | `HEX_Widget` | `Widget_SM` | none | contain / center |
| 9 | `PathBuilding` | `PathBuilding_SM` | default (`DataBind.auto()`) | contain / center |
| 10 | `ModuleBackground 2` | `State Machine 1` | none | fill / topCenter |
| 11 | `LESSON_ProgressBar` | `ProgressBar_SM` | default (`DataBind.auto()`) | contain / center |
| 12 | `REWARD_Chest` | `RewardChest_SM` | `RewardChest` | contain / center |
| 13 | `LESSON_Complete` | `LessonComplete_SM` | `LessonComplete` | fitWidth / center |

Bind `Onboarding` with `DataBind.byName('Onboarding')` (artboards 1 to 3, 6). Other artboards in the file (answer FX, hint bulb, combo burst, battery reward/drain, sleepy, gem counter) are **not used; do not build**.

### 4.1 Trigger queue (`RiveSlot`)

```dart
final _queue = Queue<String>(); Timer? _gap; bool _talking = false;
void fire(String n) { _queue.add(n); if (_gap == null) _drain(); }
void fireNow(String n) { _gap?.cancel(); _gap = null; _queue.clear(); fire(n); }   // user action cuts in
void _drain() {
  if (_queue.isEmpty) { _gap = null; return; }
  final next = _queue.first; final isTalk = const {'talk','talk2','talk3'}.contains(next);
  if (next == 'stopTalk') { _talking = false; }
  else if (_talking && !isTalk) {                    // close the mouth before any other trigger
    _talking = false; _vmi?.trigger('stopTalk')?.trigger();
    _gap = Timer(const Duration(milliseconds: 150), _drain); return;
  }
  _queue.removeFirst(); if (isTalk) _talking = true;
  _vmi?.trigger(next)?.trigger();
  _gap = Timer(const Duration(milliseconds: 150), _drain);
}
```

`RiveSlot` also builds the controller (`ArtboardSelector.byName` + `StateMachineSelector.byName`), binds the view model, and exposes `ready`, `setNumber`, `setBool`, `setString`, `hasNumber`, `reset()` (rebuild controller, clear queue, wait one gap). Changing the state machine on an artboard = new controller; dispose the old one after the next frame.

### 4.2 Artboard 1: `HEX`, view model `Onboarding`

| Property | Type | Meaning |
| --- | --- | --- |
| `talk`, `talk2`, `talk3` | trigger | A voiceover clip starts. Random, never the previous. |
| `stopTalk` | trigger | Talk ends (the queue inserts it automatically). |
| `entryStyle` | number 0 to 7 | Which entrance plays. Set before `enter`. |
| `enter` | trigger | Screen opens. |
| `exitRight` | trigger | Leaving **forward** (CTA / Continue pressed). |
| `exitLeft` | trigger | Leaving **backward** (Back pressed). |
| `exitBottom` | trigger | Leaving the `learningTime` (day/night) screen, **both** directions. |
| `hi`, `ready`, `celebrate`, `buildCareerPath`, `showQuestion` | trigger | The screen's beat. |
| `selectOption` | trigger | Option picked; only after `showQuestion`. |
| `idle` | trigger | Rest (time dial, Reactions). |
| `idle5a` | trigger | Ambient flourish on a timer. |
| `continueThumb` | trigger | Correct Level 1 answer. |
| `tap` | trigger | User taps Hex on a message screen that has a beat. |
| `minutes` / `counting` | number 0 to 20 / boolean | Time dial. |
| `darkTheme` | boolean | App theme. |

(`enterZoom` and the pose machines `HEX-Hello`, `HEX-Excited`, `HEX-Happy_Jump`, `HEX-Holding_Tab`, `HEX-Typing`, `HEX-Curious`, `HEX-Entry`, `HEX-Pointing` exist but no current screen uses them. Skip.)

**Opening a screen:** `reset()` when the controller is reused, set `entryStyle`, fire `enter`, then `talk*` and the beat inside the queue. `entryStyle`: `all-set` 0; `notifications` 2; `career`, `pythonLevel`, `experience`, `building-path`, `motivation`, `timeCommitment`, `startingPoint` **3 when arrived by Continue, 4 by Back**; `greeting`, `three-months` 5; `good-news` 6 (also DayNight and the current home path block); `ready-check`, `name`, `learningTime`, and anything else including Level 1 → 7.

**Leaving a screen:** the flow publishes one exit request `{direction, key}`: `exitRight` when the CTA is pressed, `exitLeft` when Back is pressed, `exitBottom` on `learningTime` either way. Every Hex on screen fires it once (ignore a request already in force at mount); navigate 700 ms later. Ignore a second press while exiting.

**Level 1 Hex** (teacher, video, feedback panel, game board; overdraw 420 / 30; `entryStyle` 7 unless stated): `enter` on entry; then `idle5a` immediately and every 4000 ms **unless** speaking, leaving or a cue is set; `talk*` per voice clip and `stopTalk` when it ends; cue `continueThumb` fires with `fireNow` 900 ms after the entrance; leaving = `fireNow('exitRight')` (`exitLeft` on the video screen), fade out ~0.8 s later.

### 4.3 Artboard 2: `6.1 and 5.1 2` (Reactions)

Square slot between heading and options, overdraw 420 / 30. Inputs: `screen` number, `option` number (1-based), `select` trigger, plus `idle`, `talk*`, `stopTalk`, `enter`, `entryStyle`, `exit*`.

| Step | `screen` | Note |
| --- | --- | --- |
| `career` | 2 | 6 options; `option` 5 and 6 **UNVERIFIED** |
| `pythonLevel` | 0 | remap picked position → artboard option via `[1, 4, 3, 2]` |
| `experience` | 0 | |
| `motivation` | 1 | 5 options |
| `startingPoint` | 3 | |

Sequence per question screen:

1. Arrival: `reset()` (not on the first question), set `screen`, fire `idle` first.
2. While the voice reads the question, fire a random `talk*` once; fire another for each option as the voice reaches it. When the question or the last option is finished, fire `idle`.
3. Pick (only a pick made while shown): if talking `fireNow('idle')`; set `screen`; set `option`; fire `select`. Every new pick repeats this.

### 4.4 Artboard 3: `DayNight`

Triggers `morning`, `noon`, `evening`, `night`; also `entryStyle` = 6, `enter`, `talk*`, `stopTalk`, `exitBottom`. Option id → trigger: `morning`→`morning`, `afternoon`→`noon`, `evening`→`evening`, `night`→`night`. Voice reads the question then each option: random `talk*` per read, `stopTalk` after the last. Pick: `fireNow(trigger)` (puts `stopTalk` first if talking). (Web comments mention `option`/`select`; the code uses the four triggers.)

### 4.5 Artboards 4 to 8

- **`HEX_Notify`** (390 × 360): fire `show` 300 ms after the screen faded in. `hide` unused. Its popup buttons are not tappable: the real "Allow Notifications" / "Don't Allow" buttons live below it.
- **`Splash Screen`**: plays from the first frame. At 2500 ms (from ready, not mount) fire `showSignUpScreen` and swap to sign-up on the same canvas. The sign-up animation settles at 5500 ms: enable the CTA then. Back to sign-up: fire again. Deep link to sign-up: fire as soon as ready. Layout fitWidth; if full-width height would overlap the footer CTA or the "Lingo" wordmark, use contain between them. The wordmark is Flutter text (section 5).
- **`09`**: one-shot full-screen "all set"; replaces Hex and the bubble. No inputs.
- **`BG_Grid`**: looping transparent grid behind the whole onboarding flow; opacity 0 on question and time-slider screens. One instance for the flow.
- **`HEX_Widget`**: autoplay, no inputs; on the streak screen over a phone mockup at left 6%, top 12%, 60% × 48% of the card.

### 4.6 Artboards 9 to 13

- **`PathBuilding`** (88 × 54 artboard px; one per home level):

  | Input | Type | When |
  | --- | --- | --- |
  | `pathState` | number | Every block: 0 not done, 1 done, 2 current & nearer right edge, 3 current & nearer left edge. |
  | `entryStyle` / `enter` | number / trigger | Current block on mount: `entryStyle = 6`, then `enter`. |
  | `idle5a` | trigger | Current block: first at 3200 ms, then every 4800 ms; pause while the popup is open or a lesson is starting. |
  | `letsGo` | boolean | Popup opened: `true`. Never reset by the web (**UNVERIFIED** whether `exitLetsGo` clears it). |
  | `letsGoFromLeft` / `letsGoFromRight` | trigger | Popup opened: a block on the left fires `letsGoFromRight`; on the right fires `letsGoFromLeft`. |
  | `exitLetsGo` | trigger | Popup dismissed (unless a lesson is starting). |
  | `startLesson` | trigger | Start pressed; navigate 1000 ms later. |

  Only the current level is tappable (152 × 104 hit box). Only blocks within ~300 px of the viewport hold a controller (`ListView.builder`, `cacheExtent: 300`). The current block's canvas must reach the screen edges (overdraw) so Hex's moves are not clipped; others 80 px.
- **`ModuleBackground 2`**: no inputs. Tile the artboard top to bottom to cover the path height (tile height = width ÷ artboard aspect; 390:844 until read). Behind content, no pointer events.
- **`LESSON_ProgressBar`** (**used in onboarding AND Level 1 headers**): inputs `progress` number 0 to 100, `combo` number, `correct` trigger, `wrong` trigger.
  - **Value:** `step ÷ total × 100`. Onboarding: `step` = questions answered so far (section 5.1 lists it per screen), `total` = 7. Level 1: `step` = screen step, `total` = 9.
  - **`progress`:** the property only jumps, so tween in the app from the last shown value: 150 ms delay, then 700 ms ease-out-cubic, writing each frame. The bar mounts at the last shown value (grows forward, shrinks back).
  - **`combo`:** whenever the fill changes, set `3`, then `0` after 1000 ms.
  - **`correct` / `wrong`:** Level 1 only. Fire once per new `AnswerResult.id`. Onboarding never fires them.
  - One long-lived instance (`GlobalKey`). Track starts 21 artboard px in from the left edge: draw the artboard shifted 21 px left. Header slot: 67 px from left; right edge 84 px (Level 1) or 16 px (onboarding); max 480 wide; overdraw 10 px.
- **`REWARD_Chest`**: input `open` trigger (section 5.2).
- **`LESSON_Complete`**: inputs `xp`, `accuracy`, `time` (number or string: **UNVERIFIED**; try number, fall back to a string `+40`, `92%`, `3:42`) and `play` trigger (section 5.2).

## 5. Screens

Common to every screen: the exit/entry rules in 4.2; the CTA is **always** `OnboardingButton` in onboarding and `ModuleButton` in Level 1 (section 2). Text below is the exact on-screen copy. "Voice" means the screen's voiceover; if the Flutter app has none, treat the voice as finished and `speaking = false`.

### 5.0 Message-screen driver (`greeting`, `ready-check`, `good-news`, `building-path`, `three-months`, `name`)

Hex (`HEX`, `Onboarding`) here is **one persistent Hex** in the web (it glides between screens); start with one `RiveWidget` per screen. Order of triggers:

1. On arrival: `reset()` if reused, `entryStyle`, `enter`.
2. **`talk*`**: once per screen, when the voice starts playing while the text is still typing.
3. **The beat** (`hi`, `ready`, `celebrate`, `buildCareerPath`, `showQuestion`): with a voice, fire it when all the text has finished typing (the text types in step with the voice); `ready-check` fires `ready` as soon as its *heading* has finished typing. With no voice or a failed voice, fire it at once on arrival. Fire once per screen.
4. **Skip** link (shown in place of the CTA while the voice plays, bubble screens only): stops the voice and shows all text at once; the beat then fires and the CTA appears.
5. **Tap on Hex** (message screens, not `name`): fire `tap`.
6. CTA / Back: exit (4.2).

### 5.1 Onboarding flow

Header from `greeting` onward (not on `splash` or `sign-up`): Back button (fires the exit `exitLeft`, then goes to the previous step; from `greeting` it goes back to `sign-up`, never to the splash) and the progress bar when listed; no battery, no step count. `BG_Grid` sits behind all of it. Question screens clear their answer on arrival (also when coming back), so the CTA starts disabled; the time dial starts at 10.

**`splash`** · no text (the artboard draws it) · CTA hidden · `Splash Screen`: autoplay; at 2500 ms fire `showSignUpScreen` and go to `sign-up`.

**`sign-up`** · Wordmark text over the artboard: "Welcome to" / "Lingo" / "All your learnings in one place." Below the CTA: "Already have an account? Log in" (inert, shown once settled). · CTA `OnboardingButton` **"Get Started"**: hidden until the sign-up animation settles (5500 ms after the trigger), then enabled · No header, no progress bar · On return via Back from `greeting`: fire `showSignUpScreen` again and hide the CTA until it settles.

**`greeting`** · Bubble: "Hey! I'm Hex,\nyour skills buddy" · CTA "Continue", disabled until voice done · No bar · `HEX` style 5: `enter` → `talk*` (voice starts) → `hi` (text typed).

**`ready-check`** · Heading: "A few quick questions to personalize your path." (sparkle icon, placed below Hex) · Bubble: "Are you ready?" · CTA "Yes!", disabled until voice done · No bar · `HEX` style 7: `enter` → `talk*` (two clips: heading, then bubble) → `ready` as soon as the heading has typed.

**`career`** · Heading: "What's the **career** you're chasing?" · 6 tiles: Software Engineer, Data Scientist, Data Analyst, DevOps, Cyber Security, Automation & Scripting · CTA "Continue", disabled until a tile is picked (and voice done) · Bar 1/7 · Reactions `screen` 2 (4.3). Style 3/4.

**`good-news`** · Bubble: "Good news: your {career} journey runs on **Python**, one of the most in-demand languages." (`{career}` = the chosen tile's label) · CTA "Yes!", disabled until voice done · Bar 1/7 · `HEX` style 6: `enter` → `talk*` → `celebrate`.

**`pythonLevel`** · Heading: "What's your Python superpower **level**?" · Options: Never used, Know the basics, Hands-on coder, Advanced · CTA "Continue", disabled until a pick · Bar 2/7 · Reactions `screen` 0, remap `[1,4,3,2]`.

**`experience`** · Heading: "Have you **worked** with code before?" · Options: No experience, A little exposure, Hands-on, Professional · CTA "Continue", disabled until a pick · Bar 3/7 · Reactions `screen` 0.

**`building-path`** · Heading (below Hex, sparkle): "Building Career Path..." · Bubble depends on the Python level: never used → "Perfect starting point! We'll build your Python foundation with {career} in mind."; basics → "Good, you're not starting from zero. We'll build toward {career}."; hands-on-coder → "Nice! We'll skip the basics and get you into real {career} work."; advanced → "Got it. We'll go deep and sharpen your skills specifically for {career}" · CTA "Continue", disabled until voice done · Bar 3/7 · `HEX` style 3/4: `enter` → `talk*` → `buildCareerPath`.

**`all-set`** · Text drawn by the `09` artboard · CTA "Continue" (no voice, enabled at once) · Bar 3/7 · `09` plays once; no Hex triggers.

**`name`** · Bubble prompt: "What should I call you?" + a text field (max 30 chars, focused on arrival, Enter submits when non-empty) · CTA "Continue", disabled until the trimmed name is non-empty and voice done · **No bar** · `HEX` style 7: `enter` → `showQuestion` on arrival. No `talk*`, no `tap`.

**`motivation`** · Heading: "What do you wish to **achieve**?" · Options: Switching careers, Landing my first job, Leveling up / Promotion, Personal project, Freelance · CTA "Continue", disabled until a pick · Bar 4/7 · Reactions `screen` 1.

**`timeCommitment`** · Heading: "How much **time** can you dedicate to learning each day?" · Dial: 5, 10, 15, 20 minutes (default 10, so the CTA is live at once once the voice is done) · CTA "Continue" · Bar 5/7 · `HEX` style 3/4, `Onboarding`, rest = `idle`: `enter` → `talk*` while the question is read → after the voice ends wait 450 ms → `minutes` = 10, `counting` = true (Hex counts up from 0). Dial touched: `fireNow('idle')`, then every change writes `minutes` first. Snaps to 5/10/15/20 with a haptic tick.

**`learningTime`** · Heading: "What is the best **time** in a day for you to learn?" · Options: Morning, Afternoon, Evening, Night · CTA "Continue", disabled until a pick · Bar 6/7 · `DayNight` (4.4): `entryStyle` 6, `enter`; pick → `morning` / `noon` / `evening` / `night`. Leaves with `exitBottom` on both Continue and Back.

**`notifications`** · Heading: "Get notified when it’s time to learn." · CTA "Allow Notifications" (requests the OS permission, then continues) + text button "Don't Allow" (continues without asking) · CTA disabled until voice done · No bar · `HEX_Notify` (4.5): `show` 300 ms after the screen faded in. Two short haptic pulses 650 ms after arrival (optional). Style 2.

**`streak`** · Heading: "Stay **one tap away** from your next lesson." · Phone-home-screen mockup image · CTA "Continue", disabled until voice done · No bar · `HEX_Widget` autoplays; no Hex character on this screen. The header fades out as the screen exits.

**`three-months`** · Bubble: "In 3 months you will be building real {career} projects on your own." · CTA "Yes!", disabled until voice done · Bar 6/7 · `HEX` style 5: `enter` → `talk*` → `showQuestion`.

**`startingPoint`** · Heading: "How do you want to begin your **path**?" · Options: Start from the basics, Skip ahead, I already know some of this, Let me choose where to start · CTA "Continue", disabled until a pick · Bar 7/7 · Reactions `screen` 3. CTA completes onboarding and opens the home.

### 5.2 Level 1 (`/module`)

Header on steps 1 to 8: Back, progress bar `step/9` (4.6), battery with `chargeScreen(step)` (3). Button: `ModuleButton`, `buttonState` per 2.1. Reward and lesson-complete have no header.

| Step | Copy | `ModuleButton` | Rive triggers |
| --- | --- | --- | --- |
| 1 | Chip "LEARN" · "Module 1 - Lesson 1" · "Think like a **programmer**" · "12 mystery cards are hidden in this module. Collect them all!" · Back goes home | "Let's begin", `4` | none |
| 2 | Flip card (tap or swipe): front and back are images ("Before we write code, let's learn how programmers think" / "Programmer is a problem solver.") | "Continue", `4` | none |
| 3 | "Let Suppose" / "**Teacher Says**" · picture of a teacher · speech bubble "Open Your Notebook" typed 2800 ms after the voice starts (6000 ms if no voice) | "Continue", `4` | Teacher Hex below |
| 4 | "**What** teacher is doing?" · options "Asking Question", "Giving Instruction" (**correct = Giving Instruction**) | "Check" `0` until a pick, then `4`; after Check "Continue" `3`/`2` | see below |
| 5 | Example cards carousel: "Parent eats the food", "Coach gives a command", "Traffic signal says stop" (auto-advances every 3600 ms unless the voice is reading a card) | "Continue to video", `4` | none |
| 6 | Hex asks "What are **instructions**?" · video card "Introduction to Instructions", 02:45, "Watch this short video to understand instructions with real examples." | "Continue", `4`; `0` once pressed (while Hex leaves) | Video Hex |
| 7 | "What are **instructions** known as?" · options "Statement", "Command" (**correct = Command**), "Question" | "Check" `0` until a pick, then `4`; after Check "Continue" `3`/`2` | see below |
| reward | Chest, help button, back button. No heading. | "Continue" (after the chest opens), `4` | `open` |
| 8 | Game board with Run / Reset controls | "Continue", `0` until a run has ended (reached the flag or not), then `4` | Game Hex |
| complete | "Lesson complete!" (drawn by the artboard) | "Continue", `4` | `xp`, `accuracy`, `time`, `play` |

**Hex per screen**
- **Step 3 (teacher Hex):** `enter`; `idle5a` now and every 4000 ms unless speaking; `talk*` when the voice starts, `stopTalk` when it ends. He stands below the picture, then moves beside the bubble when it appears (position animation, no trigger).
- **Step 4 and 7 quiz Hex:** see "Quiz sequence".
- **Step 6 (video Hex):** `enter`; `idle5a` loop; `talk*` / `stopTalk` with the voice; Continue pressed → `fireNow('exitLeft')`, navigate 700 ms later.
- **Step 8 (game Hex):** `enter`; `idle5a` every 4000 ms; no other triggers. One Hex walks the board tile to tile by animation only.

**Quiz sequence (steps 4 and 7).**

1. **Before a pick:** CTA "Check", `buttonState` 0. A hint button (left of the CTA, shrinks the CTA to 74% height) is visible until Check. The question is read once by the voice (step 4); step 7 has no voice. Step 4's teacher Hex and step 7's question Hex are on screen.
2. **Option picked:** the option is marked selected; `buttonState` → 4. The question Hex leaves: `fireNow('exitRight')` (step 7 Hex enters with `entryStyle` 6). Picking another option before Check just changes the pick.
3. **Hint used:** the correct card highlights and flips; once it stops flipping Hex moves onto it (animation only). Only while no option is picked.
4. **Check pressed** (only once; options lock): create `AnswerResult(id++, selected == correct)`. In the same moment:
   - `ModuleButton`: `buttonState` 3 if correct, 2 if wrong; label becomes "Continue".
   - `LESSON_ProgressBar`: fire `correct` or `wrong`.
   - The correct option turns green; a wrong pick turns red with an X. If correct, "+10 XP" pops on the right card and confetti plays.
   - The result panel slides up (spring stiffness 360, damping 32) with a Hex; hint button disappears.
5. **Panel Hex:** 250 ms after the panel is shown, `enter` (style 7); `idle5a` loop unless correct; **if correct**, `fireNow('continueThumb')` 900 ms after the entrance (that cue replaces the ambient loop).
6. **Panel copy:** correct → title "Correct! +10 XP"; wrong → "Not quite, try to remember!". Step 4 sentence: "Yes! " (correct) or "Remember: " (wrong) + "The teacher is giving an **instruction.**". Step 7 sentence: "Yes! Instructions in a program is called **commands.**" (correct) / "Remember: Instructions in a program are called **commands.**" (wrong).
7. **Continue pressed:** go to the next screen (step 4 → 5; step 7 → reward). The answer is cleared when the screen is left or the quiz resets; coming back to the quiz starts fresh.

**Reward screen (`REWARD_Chest`).** Background image `reward-bg.png` (cover). Chest box: square, `min(width − 32, 50% of height)`. Disabled until ready. Tap anywhere: click sound → fire `open` once → 600 ms later the "Continue" `ModuleButton` springs in (slides up 40 px, fades in, spring stiffness 110, damping 13). Before the chest opens the button does not exist. Back goes to step 7; Continue goes to step 8. The battery is not shown and spends nothing.

**Lesson complete (`LESSON_Complete`).** After ready: set `xp`, `accuracy`, `time` (display `+40`, `92%`, `3:42` if the properties are strings), then fire `play`. Use the real lesson result (the web hard-codes 40, 92, 222 s). "Continue" returns to the home path.

### 5.3 Home

| Area | Rive and triggers |
| --- | --- |
| Stat cards (streak, gems, battery) | Battery 24 px + label `18/20`; display only, no `fullFlash`. Streak and gems are images. |
| Backdrop | `ModuleBackground 2` tiles. |
| Path | One `PathBuilding` per level; per-input rules in 4.6. Popup opens (`letsGo` + `letsGoFrom…`); dismissed (`exitLetsGo`); **Start** fires `startLesson`, then Level 1 step 1 after 1000 ms. |
| Dashboard and home sections | `HEX-Floating` avatar, no binding. |
| Career detail | `OnboardingButton` "Start this career". |

## 6. App data the Rive layer reads

Theme `isDark`; voiceover `speaking`, `clip`, `questionSpoken` (0..1), `spokenOption` (-1 none) (no voiceover: `false`, `1`, `-1`, so beats fire at once); pick `typing` (millis, 0 none) and `selectedOption` (1-based); exit request `{direction, key}`; tap counter; lesson `step` (1..9) and `AnswerResult`; battery store; lesson result (xp, accuracy, seconds); path current level.

## 7. Timings (ms)

Trigger gap 150 · button click delay 330, shine 5000 · exit 700 · notify show 300 · dial count 450 · splash 2500, sign-up settle 5500 · Level 1 Hex idle 4000, thumb 900, panel Hex enter 250 · path idle first 3200 then 4800, startLesson 1000 · progress delay 150, tween 700, combo hold 1000 · chest Continue 600.

## 8. Confirm in the Rive editor (UNVERIFIED)

Battery `gain`/`spend`/`charging`/`bump`/`press`/`count`; Reactions `option` 5 and 6; `LESSON_Complete` property types; whether `exitLetsGo` clears `letsGo`; default view-model names of `PathBuilding` and `LESSON_ProgressBar`; which entrance each `entryStyle` number plays. Build a debug screen that lists every artboard, state machine and view-model property of the three files and check it against this document first.
