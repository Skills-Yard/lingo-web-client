# hex.riv — implementation guide

How `public/animations/hex.riv` is wired into the Lingo web client (Next.js, `@rive-app/react-canvas`), and how to rebuild the same behaviour in Flutter.

Everything below was read from the web source. The `.riv` binary itself was not opened, so names are the ones the code uses. To confirm them against the file, open the `/hex` page in the web app: it lists every artboard, animation and state machine in `hex.riv` and plays them one by one.

---

## 1. What hex.riv is

One Rive file (~2.3 MB) that holds **every onboarding visual**, not just the Hex character. Different screens select different artboards from it.

| Artboard | Used for | State machine(s) | View model |
|---|---|---|---|
| `HEX` | The Hex character on every onboarding screen | `HEX-Entry`, `HEX-Floating`, `HEX-Hello`, `HEX-Excited`, `HEX-Happy_Jump`, `HEX-Holding_Tab`, `HEX-Typing`, `HEX-Curious`, `HEX-Pointing`, `Onboarding` | `Onboarding` |
| `6.1 and 5.1` | Hex reacting to a picked option (2 question screens) | `Reactions_SM` | `Onboarding` |
| `HEX_Notify` (390×360) | Notification-permission screen: Hex + popup in one | `Notify_SM` | `Notify_VM` |
| `Splash Screen` | Splash, then sign-up screen | `Splash_SM` | `Splash_VM` |
| `09` | Full-screen "You're all set!" scene, one-shot | `Onboarding_complete` | none |
| `BG_Grid` | Animated grid background, loops | `BG_SM` | none |

Two ways of driving it, and you need both:

1. **Pose per state machine.** On the `HEX` artboard each pose is its own state machine (`HEX-<Pose>`). A screen plays exactly one at a time. Switching pose = stop the current machine, play another.
2. **Data binding (view models).** The `Onboarding` state machine (and the Reactions / Notify / Splash ones) is stepped by **triggers and numbers on a view model instance**, not by legacy state-machine inputs.

---

## 2. Web architecture

```
src/lib/rive/runtime.ts                     constants: file path, artboard / state machine / view model / trigger names, timings
                                            + configureRiveRuntime() (self-hosted WASM)
src/components/onboarding/robu/useHexRive.ts   the one hook every Hex canvas goes through
src/components/onboarding/robu/
  OnboardingFox.tsx          the flow's single Hex: idle / hello / excited / tap / Onboarding beats
  ZoxTabFox.tsx              question row: tablet, typing, fidget
  OnboardingQuestionHex.tsx  question screens driven by the Onboarding machine
  ReactionsHex.tsx           "6.1 and 5.1" artboard
  NotifyHex.tsx              "HEX_Notify" artboard
  HexScene.tsx               full-screen "09" scene
  HexBackground.tsx          "BG_Grid"
  OnboardingSplash.tsx       "Splash Screen" (uses useRive directly, not useHexRive)
src/components/onboarding/foxStage.tsx      positions one persistent Hex over per-screen "slots", tap detection
src/lib/constants/onboarding.ts             ONBOARDING_STEPS: which screen uses which beat / scene / hexMode
src/app/hex/page.tsx                        debug player for the file
```

### 2.1 Runtime setup

`configureRiveRuntime()` points Rive at a same-origin `rive.wasm` (`public/rive/`) instead of the default unpkg download. This is a web-only startup optimisation and has no Flutter equivalent.

### 2.2 The core hook — `useHexRive(layout, state, artboard = "HEX", viewModel = "Onboarding")`

```ts
const { rive, RiveComponent } = useRive({
  src: "/animations/hex.riv",
  artboard,
  autoplay: false,          // nothing plays until we pick a state machine
  layout,                   // Fit.Contain / Alignment.Center (see 2.5)
});

const viewModelInstance = useMemo(
  () => rive?.viewModelByName(viewModel)?.defaultInstance() ?? null,
  [rive, viewModel],
);

useEffect(() => {
  if (!rive) return;
  const playing = rive.playingStateMachineNames;
  if (playing.length > 0) rive.stop(playing);                       // 1. stop whatever plays
  if (state && rive.stateMachineNames.includes(state)) rive.play(state); // 2. play the new one
  if (viewModelInstance) rive.bindViewModelInstance(viewModelInstance);  // 3. REBIND after every play
}, [rive, state, viewModelInstance]);

const fireTrigger = (name) => viewModelInstance?.trigger(name)?.trigger();
const setNumber   = (name, v) => { const p = viewModelInstance?.number(name); if (p) p.value = v; };
```

Things the hook encodes that you must reproduce:

- `autoplay: false`, then explicitly play one named state machine.
- Only one state machine runs at a time. Always stop before play.
- The view model instance is the artboard's **default instance** of the named view model.
- **Rebind the view model instance after every `play`.** A machine started later is not bound automatically.
- `ready` = view model instance resolved. Never fire triggers before it.
- If the requested state machine doesn't exist in the artboard, do nothing (guard with `stateMachineNames.includes`).

### 2.3 Pose state machines (`HEX` artboard)

| Constant | State machine | When |
|---|---|---|
| `entry` | `HEX-Entry` | Entrance on the splash |
| `idle` | `HEX-Floating` | Resting loop. Default everywhere, also the home screen |
| `hello` | `HEX-Hello` | Greeting wave, 3000 ms (`HEX_HELLO_MS`) |
| `excited` | `HEX-Excited` | "Are you ready?" |
| `tap` | `HEX-Happy_Jump` | 1400 ms (`HEX_TAP_MS`) per tap on Hex |
| `tablet` | `HEX-Holding_Tab` | Question screens, resting |
| `typing` | `HEX-Typing` | 2200 ms (`HEX_TYPING_MS`) after each option pick |
| `fidget` | `HEX-Curious` | 2500 ms (`HEX_FIDGET_MS`) when idle 4–5 s on a question |
| `pointing` | `HEX-Pointing` | Pointing at the Allow button (defined, see notification screen) |
| `onboarding` | `Onboarding` | Trigger-driven sequence (2.4) |

Which pose is active is decided by plain React state in the component (see `OnboardingFox`):

```ts
let state = HEX_STATE.idle;
if (beat || questionKey) state = HEX_STATE.onboarding;
else if (tapping)        state = HEX_STATE.tap;
else if (waving)         state = HEX_STATE.hello;
else if (excited)        state = HEX_STATE.excited;
```

Timed poses are just `setTimeout`s that flip a boolean for N ms, then fall back to idle. The `.riv` doesn't time them out for you.

### 2.4 The `Onboarding` state machine and its triggers

Played on the `HEX` artboard. Stepped by triggers on the `Onboarding` view model:

| Trigger | Fired when |
|---|---|
| `talk` | Hex speaks: while a screen's voiceover is playing, **before** the screen's own trigger |
| `hi` | Greeting screen |
| `ready` | "Are you ready?" screen |
| `showQuestion` | A question appears (also used by several plain message screens) |
| `selectOption` | An option is picked |
| `celebrate` | "Good news" screen |
| `buildCareerPath` | "Building Career Path..." screen |
| `tap` | The user taps Hex (only while on a screen that has a beat) |

Rules learned the hard way (they're comments in the source):

1. **Two triggers in the same frame are not both consumed.** `OnboardingQuestionHex` fires `showQuestion`, then waits `SELECT_AFTER_SHOW_MS = 150` before `selectOption` when both are due.
2. `selectOption` does nothing until `showQuestion` has moved the machine on. If the user picks before the question is "done", fire `showQuestion` first.
3. Fire each trigger **once per key**. The code tracks the last-fired key (`talkedKey`, `firedKey`, `shownFor`) in refs so re-renders and effect re-runs don't re-fire.
4. Don't fire anything until `ready`.
5. Counters (`tapCount`, `pickCount`, `typing = Date.now()`) are compared against a ref of the last value seen. The initial value on mount is treated as "already handled", so nothing fires on mount.

Question-screen flow (`OnboardingQuestionHex`):

```
screen appears ─► voiceover reading? ─ yes ─► fire `talk` once, wait
                                       no ─► fire `showQuestion`
user picks option ─► (if showQuestion was just fired: wait 150 ms) ─► fire `selectOption`
```

### 2.5 Layout

All Hex canvases use `Fit.Contain` + `Alignment.Center`, except:

| Canvas | Fit / Alignment |
|---|---|
| `HexBackground` (`BG_Grid`) | `Cover` / `Center`, transparent, sits behind the page colour |
| `HexScene` (`09`) | `Contain` / `BottomCenter`, full screen |
| `OnboardingSplash` | `FitWidth` / `Center`, switched to `Contain` when the artboard would overlap the footer CTA or the wordmark. Computed from `rive.bounds` |
| `NotifyHex` | `Contain`; container uses `NOTIFY_ASPECT = 390 / 360` |

### 2.6 Other artboards

**Reactions** (`6.1 and 5.1`, `Reactions_SM`): on an option pick, set number `option` (1–4, 1-based index of the picked option) then fire trigger `select`. Used by the "superpower level" and "worked with code" questions. Ignore picks made before the canvas appeared.

**Notify** (`HEX_Notify`, `Notify_SM`, view model `Notify_VM`): rests idle. Fire `show` ~300 ms after the screen has faded in (Hex and the popup animate in). `hide` exists but the web app never fires it, it crossfades the screen away. The popup's own buttons are not clickable, so the screen draws real buttons.

**Splash** (`Splash Screen`, `Splash_SM`, view model `Splash_VM`): `autoplay: true` with the state machine given up front. After 2500 ms fire trigger `showSignUpScreen`. The sign-up animation takes 5500 ms; the UI uses that as its "settled" signal. Firing the trigger again replays it (used when navigating back). The "Lingo" wordmark is a normal text widget laid over the canvas.

**Scene** (`09`, `Onboarding_complete`): one-shot, no inputs. Played in place of the Hex and the bubble. The artboard has its own text.

**Background** (`BG_Grid`, `BG_SM`): loops forever, no inputs, transparent.

### 2.7 One persistent Hex, many slots (`foxStage.tsx`)

Hex isn't re-created per screen. One `OnboardingFox` is mounted in an overlay and glides (spring `x`, `y`, `scale`) to the bounding box of whichever "slot" the current screen registers. A `requestAnimationFrame` loop reads the slot's rect each frame. The overlay is `pointer-events-none`, so **taps are detected with a window-level `pointerdown`** that hit-tests against the slot's rect, then bumps `tapCount`.

This is a web-layout concern. In Flutter you can either copy the single-overlay approach or simply mount a `RiveWidget` per screen (simpler, but loses the glide between screens).

### 2.8 Which screen uses what (`ONBOARDING_STEPS`)

| Step id | Hex behaviour |
|---|---|
| splash | `Splash Screen` / `Splash_SM` |
| pre-login | same canvas, `showSignUpScreen` fired, wordmark shown |
| greeting | beat `hi` (+ `talk` while voiceover plays) |
| ready-check | beat `ready` fired at the excitement moment |
| career | question, `hexMode: onboarding` |
| good-news | beat `celebrate` |
| pythonLevel, experience | question, `hexMode: reactions` (Reactions artboard) |
| starting-point | beat `buildCareerPath` |
| foundation, module-1, pace-great, three-months | beat `showQuestion` |
| all-set | scene `09` |
| motivation, learningTime, startingPoint | question, `hexMode: onboarding` |
| notifications | `HEX_Notify` |
| name, time-slider, streak | no Hex animation of their own |
| (question screens with no `hexMode`) | tablet poses: `Holding_Tab` → `Typing` → `Curious` |
| home screen | `HEX-Floating` |

---

## 3. Building the same thing in Flutter

### 3.1 Package and version

Use the **current `rive` package (0.14+, the "new" Rive Flutter runtime)**. Data binding / view models are only exposed through its new API. The old API (`RiveAnimation`, `StateMachineController`, `SMITrigger`, `SMINumber`) only handles legacy inputs and cannot drive the `Onboarding`, Reactions, Notify or Splash machines.

```yaml
dependencies:
  rive: ^0.14.0   # use the latest 0.14.x; check changelog for API drift

flutter:
  assets:
    - assets/animations/hex.riv
```

Copy `public/animations/hex.riv` to `assets/animations/hex.riv`. Same file, no re-export needed. It is the runtime that must support the features used (data binding), so keep the package current.

> The Dart snippets below follow the 0.14 API as I know it (`File.asset`, `RiveWidgetController`, `ArtboardSelector`, `StateMachineSelector`, `DataBind`, `ViewModelInstance`). I have not compiled them against your pubspec. Check method names against the package's docs/changelog if one doesn't resolve. The concepts (2.2–2.4) are what matter.

### 3.2 Constants (mirror `runtime.ts`)

```dart
// lib/rive/hex_rive.dart
const hexRivSrc = 'assets/animations/hex.riv';

abstract final class HexArtboard {
  static const hex = 'HEX';
  static const reactions = '6.1 and 5.1';
  static const notify = 'HEX_Notify';
  static const splash = 'Splash Screen';
  static const complete = '09';
  static const background = 'BG_Grid';
}

abstract final class HexState {
  static const entry = 'HEX-Entry';
  static const idle = 'HEX-Floating';
  static const hello = 'HEX-Hello';
  static const excited = 'HEX-Excited';
  static const tap = 'HEX-Happy_Jump';
  static const tablet = 'HEX-Holding_Tab';
  static const typing = 'HEX-Typing';
  static const fidget = 'HEX-Curious';
  static const pointing = 'HEX-Pointing';
  static const onboarding = 'Onboarding';
}

abstract final class HexTrigger {
  static const talk = 'talk';
  static const hi = 'hi';
  static const ready = 'ready';
  static const showQuestion = 'showQuestion';
  static const selectOption = 'selectOption';
  static const celebrate = 'celebrate';
  static const buildCareerPath = 'buildCareerPath';
  static const tap = 'tap';
}

abstract final class HexViewModel {
  static const onboarding = 'Onboarding';
  static const notify = 'Notify_VM';
  static const splash = 'Splash_VM';
}

const hexHello = Duration(milliseconds: 3000);
const hexTap = Duration(milliseconds: 1400);
const hexTyping = Duration(milliseconds: 2200);
const hexFidget = Duration(milliseconds: 2500);
const selectAfterShow = Duration(milliseconds: 150);
```

### 3.3 Load the file once, share it

On web every canvas loads the file itself (the browser cache makes that cheap). In Flutter, load `hex.riv` **once** (e.g. at app start or in a provider) and create one controller per widget from that shared `File`. Dispose controllers, not the shared file, until app shutdown.

```dart
final hexFile = await File.asset(hexRivSrc, riveFactory: Factory.rive);
```

### 3.4 The equivalent of `useHexRive`

```dart
class HexController {
  HexController._(this.controller, this.viewModel);

  final RiveWidgetController controller;
  final ViewModelInstance? viewModel;

  static HexController create(
    File file, {
    String artboard = HexArtboard.hex,
    String? stateMachine,
    String viewModel = HexViewModel.onboarding,
  }) {
    final controller = RiveWidgetController(
      file,
      artboardSelector: ArtboardSelector.byName(artboard),
      stateMachineSelector: stateMachine == null
          ? StateMachineSelector.byDefault()
          : StateMachineSelector.byName(stateMachine),
    );
    // Binds the named view model's default instance to the playing machine.
    final vmi = controller.dataBind(DataBind.byName(viewModel));
    return HexController._(controller, vmi);
  }

  void fire(String trigger) => viewModel?.trigger(trigger)?.trigger();

  void setNumber(String name, double value) {
    final p = viewModel?.number(name);
    if (p != null) p.value = value;
  }

  void dispose() => controller.dispose();
}
```

**Switching pose** is where Flutter differs from the web hook. A `RiveWidgetController` is built for one state machine. To change pose (`HEX-Floating` → `HEX-Hello`), **create a new `HexController` for the new state machine and swap it in** (dispose the old one). That mirrors the web's "stop, play another, rebind" and keeps the "bind after the machine starts" rule satisfied, because `dataBind` runs on each new controller.

```dart
class HexView extends StatefulWidget {
  const HexView({super.key, required this.file, required this.state,
      this.artboard = HexArtboard.hex, this.onReady});
  final File file;
  final String state;
  final String artboard;
  final void Function(HexController)? onReady;
  @override
  State<HexView> createState() => _HexViewState();
}

class _HexViewState extends State<HexView> {
  late HexController _hex = _build();

  HexController _build() =>
      HexController.create(widget.file, artboard: widget.artboard, stateMachine: widget.state);

  @override
  void initState() {
    super.initState();
    widget.onReady?.call(_hex);
  }

  @override
  void didUpdateWidget(HexView old) {
    super.didUpdateWidget(old);
    if (old.state != widget.state || old.artboard != widget.artboard) {
      final previous = _hex;
      setState(() => _hex = _build());
      widget.onReady?.call(_hex);
      previous.dispose();
    }
  }

  @override
  void dispose() { _hex.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => RiveWidget(
        controller: _hex.controller,
        fit: Fit.contain,
        alignment: Alignment.center,
      );
}
```

One caveat on swapping controllers: a pose swap resets the artboard to its start, same as stop/play on web. If you ever see a one-frame flash, keep the old widget visible until the new controller is built (an `AnimatedSwitcher` or building the controller before `setState`).

### 3.5 Poses with timers

Port the three tiny hooks straight to a state class. Timers replace `setTimeout`, cancel them in `dispose`.

```dart
// "play X for N ms, then back to idle"
Timer? _poseTimer;
void _playFor(String pose, Duration d) {
  _poseTimer?.cancel();
  setState(() => _state = pose);
  _poseTimer = Timer(d, () => setState(() => _state = HexState.idle));
}

// onTap of Hex:           _playFor(HexState.tap,    hexTap);
// greeting, after 400 ms: _playFor(HexState.hello,  hexHello);
// option picked:          _playFor(HexState.typing, hexTyping);
```

Fidget: schedule a `Timer` for a random 4000–5000 ms after the last input, play `HexState.fidget` for 2500 ms, reschedule. Restart on every pick or new screen.

### 3.6 Onboarding beats (question screens)

Port `OnboardingQuestionHex` logic exactly. State to hold: `shownFor` (screen id), `talkedFor` (screen id), `firedPickFor` (last pick timestamp), `selectTimer`.

```dart
void onQuestionChanged({
  required String screenId,
  required int typing,          // millis timestamp, 0 = none yet
  required bool speaking,
  required double questionSpoken, // 0..1, 1 when no voiceover
}) {
  final picked = typing != 0 && _firedPickFor != typing;
  var justShown = false;

  if (_shownFor != screenId) {
    final reading = questionSpoken < 1 && !picked;
    if (reading) {
      if (speaking && _talkedFor != screenId) {
        _talkedFor = screenId;
        _hex.fire(HexTrigger.talk);
      }
      return;
    }
    _shownFor = screenId;
    justShown = true;
    _selectTimer?.cancel();
    _hex.fire(HexTrigger.showQuestion);
  }

  if (!picked) return;
  _firedPickFor = typing;
  _selectTimer?.cancel();
  if (!justShown) {
    _hex.fire(HexTrigger.selectOption);
  } else {
    _selectTimer = Timer(selectAfterShow, () => _hex.fire(HexTrigger.selectOption));
  }
}
```

Message screens ("greeting", "good-news", ...) are simpler: when `voiceover` starts, fire `talk` once; when the screen's beat is due, fire that beat's trigger once (`HexTrigger.hi`, `.ready`, `.celebrate`, `.buildCareerPath`, `.showQuestion`). Keep a `firedKey` so rebuilds don't re-fire.

### 3.7 Reactions, Notify, Splash, Scene, Background

```dart
// Reactions: option is 1-based (1..4)
hex.setNumber('option', selectedOption.toDouble());
hex.fire('select');

// Notify: fire `show` ~300 ms after the screen has faded in
Timer(const Duration(milliseconds: 300), () => hex.fire('show'));

// Splash: 2500 ms in, fire the sign-up trigger; sign-up animation ~5500 ms
Timer(const Duration(milliseconds: 2500), () => hex.fire('showSignUpScreen'));
```

Controller creation for each:

| Screen | `HexController.create(...)` |
|---|---|
| Reactions | `artboard: '6.1 and 5.1', stateMachine: 'Reactions_SM'` (view model `Onboarding`) |
| Notify | `artboard: 'HEX_Notify', stateMachine: 'Notify_SM', viewModel: 'Notify_VM'` |
| Splash | `artboard: 'Splash Screen', stateMachine: 'Splash_SM', viewModel: 'Splash_VM'` |
| Scene | `artboard: '09', stateMachine: 'Onboarding_complete'` (no view model, skip `dataBind`) |
| Background | `artboard: 'BG_Grid', stateMachine: 'BG_SM'`, fit `cover`, behind everything |

Fit mapping: web `Fit.Contain` → Flutter `Fit.contain`, `Cover` → `Fit.cover`, `FitWidth` → `Fit.fitWidth`; `Alignment.BottomCenter` → `Alignment.bottomCenter`.

Notes for Flutter:

- Wrap decorative Hex widgets in `IgnorePointer` + `ExcludeSemantics` (the web uses `aria-hidden` and `pointer-events-none`).
- For taps, a `GestureDetector` around the `RiveWidget` is enough, no global pointer hit-testing needed unless you copy the single persistent overlay.
- Respect `MediaQuery.disableAnimations` where you add your own glide/slide motion (web checks `useReducedMotion`).
- Keep Splash's footer-overlap logic only if you have a footer CTA over the artboard. It uses the artboard's native bounds to decide between `fitWidth` and `contain`.

---

## 4. Porting checklist

- [ ] `rive` 0.14+ added; `hex.riv` copied into assets and declared in pubspec
- [ ] Constants file with the artboard / state machine / view model / trigger names above
- [ ] `File` loaded once and shared
- [ ] `HexController` that selects artboard + state machine and data-binds the view model **after** the machine is created
- [ ] Pose swap = new controller; old one disposed
- [ ] No trigger fired before the view model instance exists
- [ ] Each trigger fired once per screen/key; counters ignore their value at mount
- [ ] `selectOption` delayed 150 ms when it follows `showQuestion`
- [ ] Timed poses (hello 3000, tap 1400, typing 2200, fidget 2500) fall back to `HEX-Floating`
- [ ] Reactions: `option` set before `select`
- [ ] Notify `show` ~300 ms after fade-in; Splash `showSignUpScreen` at 2500 ms
- [ ] Verify names with the `/hex` web page if any state machine fails to resolve

## 5. Gotchas (short list)

1. View model binding is per started machine. Re-bind after every pose change.
2. Same-frame triggers get dropped. Space them out.
3. `selectOption` is a no-op until `showQuestion` has advanced the machine.
4. State machine names have exact casing and some artboards have spaces or digits (`Splash Screen`, `6.1 and 5.1`, `09`). Don't "clean" them.
5. The Hex machines don't end themselves. Poses like hello and tap are cut off by app timers; if durations in the `.riv` change, update the constants.
6. The web `README`-level source of truth is `src/lib/rive/runtime.ts`. If the designer renames something in Rive, that's the file that changes first, so diff it when you re-sync Flutter.
