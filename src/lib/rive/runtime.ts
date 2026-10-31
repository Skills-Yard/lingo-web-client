import { RuntimeLoader } from "@rive-app/canvas";

/**
 * Point the Rive runtime at a same-origin copy of its WebAssembly binary.
 *
 * By default `@rive-app/canvas` downloads `rive.wasm` (~1.9 MB) from
 * unpkg.com the first time a canvas mounts. That third-party DNS + TLS +
 * fetch round-trip is the main reason the first Rive animation is slow to
 * appear. Serving the binary from `/public` lets it download in parallel
 * with the rest of the page, stay in the browser/CDN cache, and skip the
 * cross-origin hop.
 *
 * Keep `public/rive/*.wasm` in sync with the installed `@rive-app/canvas`
 * version (currently 2.42.0) — re-copy from `node_modules` on upgrade.
 */
const WASM_URL = "/rive/rive.wasm";
const WASM_FALLBACK_URL = "/rive/rive_fallback.wasm";

/**
 * Source for the reward-screen animation. Kept here so the component that
 * renders it and the flow that preloads it can never drift apart.
 */
export const REWARD_RIVE_SRC = "/animations/mera_updated_box.riv";

/**
 * The home screen's live platform: the slab Hex stands on. It is the
 * "PathBuilding" artboard in `hex.riv`, playing `PathBuilding_SM` on load.
 */
export const LIVE_PLATFORM = {
  artboard: "PathBuilding",
  stateMachine: "PathBuilding_SM",
  width: 88,
  height: 54,
} as const;

/**
 * The `.riv` for every Robu instance in the module 1 instructions-intro
 * flows — both the current branch's own (`src/components/instructions-intro`)
 * and its `-himanshu` counterpart (used by `/module1/review` and
 * `/module1/combined` to compare designs — both render the same Orbi rig, so
 * that comparison is of the layout/copy differences only) — RobuMascot (the
 * single persistent mascot that glides between every screen's anchor: its
 * boot-up intro sequence plays once, then settles into Robu's ambient idle
 * loop) and every standalone `<RobuEyeBlink>` / `<RobuReaction>` alike.
 *
 * "Artboard 1" / "Robu-StateMachine" rig — same artboard, state machine and
 * clip names as the earlier `orbi_part2.riv`. The onboarding flow uses the
 * fox rigs below instead (`ROBU_RIVE_SRC` / `HEX_RIVE_SRC`).
 */
export const ORBI_RIVE_SRC = "/animations/orbi_final.riv";

/**
 * The fox rig used by the onboarding flow's splash and notification fox
 * (`OnboardingSplash`).
 *
 * `-3`: adds a second, separate state machine ("splash screen") that drives
 * Robu's boot-up sequence on its own — internally chaining its own
 * "mouth idle " -> "mouth idle to hi " -> "hi " -> "mouth hi to idle " ->
 * "mouth idle "/"idle " clips, the same automatic (no-input) transition
 * pattern the original rig's single state machine used to use for its own
 * boot chain. RobuMascot now plays *that* state machine at mount instead of
 * the raw "hi " clip; "hi " itself moved to the greeting wave (see
 * useGreetingOverlay) that plays once screen 1's bubble shows. Every other
 * clip/artboard name is unchanged from the previous file.
 *
 * `-4`: renames the default state machine "State Machine 1" -> "Idle state"
 * and adds "laptop idle" / "tail idle" clips; "splash screen" and every clip
 * name the components play are unchanged from `-3`.
 *
 * `-5`: renames the talking clip "speak " -> "speak" (no trailing space) and
 * makes it the "Idle state" state machine's mouth-layer entry state; every
 * other clip/state-machine name is unchanged from `-4`.
 *
 * `-8`: adds the laptop clips ("laptop idle", "laptop taking out ",
 * "laptop typing ", "tail typing", "Excitement ") and the "laptop idle" /
 * "laptop_typing " state machines — see OnboardingFox's FoxPose. Every
 * earlier clip/state-machine name is unchanged from `-5`.
 *
 * `-9`: same clips as `-8`; renames the state machines to "laptop" (laptop
 * idle) and "excitement" (Excitement, then taking the laptop out after
 * 2.37s). Neither has inputs and "excitement"'s body layer has no entry
 * transition, so OnboardingFox still plays those clips directly.
 */
export const ROBU_RIVE_SRC = "/animations/foxi-9.riv";

/**
 * The old two-theme Robu rig — kept only for the unused legacy copy in
 * `instructions-intro-robu-position-heading-consistency` (not routed from
 * any page). Both `instructions-intro` and `instructions-intro-himanshu` use
 * `ORBI_RIVE_SRC` above instead.
 */
export const ROBU_RIVE_SRC_LIGHT = "/animations/robu_dark.riv";
export const ROBU_RIVE_SRC_DARK = "/animations/foxi.riv";

/** Pick Robu's `.riv` for the given theme — see `ROBU_RIVE_SRC_LIGHT`/`_DARK`. */
export function getRobuRiveSrc(theme: "light" | "dark"): string {
  return theme === "dark" ? ROBU_RIVE_SRC_DARK : ROBU_RIVE_SRC_LIGHT;
}

let configured = false;

/**
 * Register the local WASM URLs with Rive's global loader. Safe to call
 * repeatedly and from any component — only the first call has an effect,
 * and it must run before the first `useRive()` mounts.
 */
export function configureRiveRuntime(): void {
  if (configured) return;
  configured = true;

  RuntimeLoader.setWasmUrl(WASM_URL);
  RuntimeLoader.setWasmFallbackUrl(WASM_FALLBACK_URL);
}

/**
 * Hex — `hex.riv`, artboard "HEX". The one character rig for every onboarding
 * screen. It has no inputs or view model: each pose is its own state machine
 * (named `HEX-<Pose>`), and a screen plays exactly one of them at a time.
 */
export const HEX_RIVE_SRC = "/animations/hex.riv";
export const HEX_ARTBOARD = "HEX";

export const HEX_STATE = {
  /** Entrance — the splash. */
  entry: "HEX-Entry",
  /** Resting loop — every screen that has no pose of its own. */
  idle: "HEX-Floating",
  /** The greeting screen's wave. */
  hello: "HEX-Hello",
  /** Plays the screen's "excitement" beat ("Are you ready?"). */
  excited: "HEX-Excited",
  /** Played for `HEX_TAP_MS` on every tap on Hex. */
  tap: "HEX-Happy_Jump",
  /** Question screens: holding his tablet, looking at the user. */
  tablet: "HEX-Holding_Tab",
  /** Question screens: on each option pick. */
  typing: "HEX-Typing",
  /** Question screens: fidgets when left alone. */
  fidget: "HEX-Curious",
  /** Notification screen: pointing down at the Allow button. */
  pointing: "HEX-Pointing",
  /** The onboarding sequence — driven by `HEX_ONBOARDING_TRIGGER`s on the
   * `Onboarding` view model rather than by switching machines. */
  onboarding: "Onboarding",
} as const;

export type HexState = (typeof HEX_STATE)[keyof typeof HEX_STATE];

/** The view model bound to both the "HEX" and the reactions artboard. */
export const HEX_VIEW_MODEL = "Onboarding";

/** Triggers on `HEX_VIEW_MODEL` that step the `Onboarding` state machine. */
export const HEX_ONBOARDING_TRIGGER = {
  /** Resting — the time-commitment screen's stand-in for `showQuestion`. */
  idle: "idle",
  /** Ambient idle flourish — fired on a loop wherever Hex has nothing else to do. */
  idleAmbient: "idle5a",
  /** Thumbs up — Hex approving a right answer. */
  continueThumb: "continueThumb",
  /** Greeting screen: Hex enters, fired before `hi` (after `entryStyle` is set). */
  enter: "enter",
  /** An entrance that zooms Hex in — fired in place of `enter`. */
  enterZoom: "enterZoom",
  /** Leaving the greeting screen forward (Continue) / backward (Back). */
  exitLeft: "exitLeft",
  exitRight: "exitRight",
  /** Leaving straight down (the day / night screen). */
  exitBottom: "exitBottom",
  /** Greeting screen. */
  hi: "hi",
  /** "Are you ready?" screen. */
  ready: "ready",
  /** A question appears. */
  showQuestion: "showQuestion",
  /** An option is picked. */
  selectOption: "selectOption",
  /** "Good news" screen. */
  celebrate: "celebrate",
  /** "Building Career Path..." screen. */
  buildCareerPath: "buildCareerPath",
  /** A tap on Hex. */
  tap: "tap",
} as const;

/** How long Hex's exit plays before the flow moves to the next screen. */
export const HEX_EXIT_MS = 700;

/** Same, for the `exitBottom` exit used by the day / night scene. */
export const HEX_EXIT_BOTTOM_MS = 700;

/** Every screen opens the same way: `entryStyle` is set to `style`, `enter` is
 * fired, and the screen's own triggers follow it. */
export const HEX_ENTER_STYLE = { property: "entryStyle", style: 7 } as const;

/** An `entryStyle` that depends on how the user arrived: via Continue
 * (`forward`) or via Back (`back`). */
export type HexDirectionalEntryStyle = {
  readonly forward: number;
  readonly back: number;
};
const FORWARD_3_BACK_4: HexDirectionalEntryStyle = { forward: 3, back: 4 };

/** Screens that enter with a different `entryStyle`, by step id. */
export const HEX_ENTRY_STYLE_BY_STEP: Readonly<
  Record<string, number | HexDirectionalEntryStyle>
> = {
  greeting: 5,
  "ready-check": 7,
  career: FORWARD_3_BACK_4,
  "good-news": 6,
  pythonLevel: FORWARD_3_BACK_4,
  experience: FORWARD_3_BACK_4,
  "building-path": FORWARD_3_BACK_4,
  "all-set": 0,
  name: 7,
  motivation: FORWARD_3_BACK_4,
  timeCommitment: FORWARD_3_BACK_4,
  learningTime: 7,
  notifications: 2,
  streak: FORWARD_3_BACK_4,
  "three-months": 5,
  startingPoint: FORWARD_3_BACK_4,
};

/** The time-commitment screen's dial on `HEX_VIEW_MODEL`: set `minutes` to
 * the picked value, then turn `counting` on to play Hex's count. */
export const HEX_TIME_COUNT = {
  minutes: "minutes",
  counting: "counting",
} as const;

/** The boolean on every Hex view model that switches the rig's colours:
 * `true` for the dark theme, `false` for light. */
export const HEX_DARK_THEME = "darkTheme";

export type HexOnboardingTrigger =
  (typeof HEX_ONBOARDING_TRIGGER)[keyof typeof HEX_ONBOARDING_TRIGGER];

/** Hex speaks — while a screen's voiceover plays, before its own trigger.
 * Each is a different talking animation on `HEX_VIEW_MODEL`; one is picked at
 * random per line via `randomHexTalkTrigger`. */
export const HEX_TALK_TRIGGERS = ["talk", "talk2", "talk3"] as const;

export type HexTalkTrigger = (typeof HEX_TALK_TRIGGERS)[number];

/** Fired the moment a talk ends, before whichever trigger follows it. */
export const HEX_STOP_TALK_TRIGGER = "stopTalk";

export const isHexTalkTrigger = (name: string): boolean =>
  (HEX_TALK_TRIGGERS as readonly string[]).includes(name);

/** A random talk trigger — never `previous`, so back-to-back lines differ. */
export const randomHexTalkTrigger = (
  previous?: HexTalkTrigger | null,
): HexTalkTrigger => {
  const choices = HEX_TALK_TRIGGERS.filter((trigger) => trigger !== previous);
  return choices[Math.floor(Math.random() * choices.length)] ?? "talk";
};

/**
 * Reactions — the "6.1 and 5.1 2" artboard in `hex.riv`, used by both grid
 * questions (superpower level, worked with code). `Reactions_SM` reacts
 * to the picked option: set `option` (1-4) and fire `select`.
 */
export const REACTIONS_ARTBOARD = "6.1 and 5.1 2";
export const REACTIONS_STATE_MACHINE = "Reactions_SM";
export const REACTIONS_OPTION = "option";
/** Number on the artboard's data that picks which question's reactions play. */
export const REACTIONS_SCREEN = "screen";
export const REACTIONS_SELECT_TRIGGER = "select";

/**
 * Day / night — the "DayNight" artboard in `hex.riv`, the best-time-of-day
 * question's scene (city skyline, sun and Hex). `daynight_sm` takes the same
 * `option` (1-4) + `select` inputs as the reactions artboard.
 */
export const DAYNIGHT_ARTBOARD = "DayNight";
export const DAYNIGHT_STATE_MACHINE = "DayNight_SM";
/** The `entryStyle` the day / night artboard enters with. */
export const DAYNIGHT_ENTRY_STYLE = 6;
/** Learning-time option id -> trigger on the `Onboarding` view model, which
 * is the artboard's own (it carries the entry / exit / talk triggers too). */
export const DAYNIGHT_TRIGGERS: Record<string, string> = {
  morning: "morning",
  afternoon: "noon",
  evening: "evening",
  night: "night",
};

/**
 * Full-screen Hex scenes in `hex.riv` — an artboard the size of the screen,
 * played in place of the flow's fox (see OnboardingStep's `hexScene`).
 * "09": Hex's "onboarding complete" moment, one-shot, no inputs.
 */
export const HEX_SCENE = {
  onboardingComplete: { artboard: "09", stateMachine: "Onboarding_complete" },
} as const;

export type HexScene = (typeof HEX_SCENE)[keyof typeof HEX_SCENE];

/** The onboarding flow's animated background — a transparent grid with
 * pulses (`BG_PULSES`, looping, no inputs) laid over the page colour. */
export const HEX_BACKGROUND = {
  artboard: "BG_Grid",
  stateMachine: "BG_SM",
} as const;

/**
 * Notify — the "HEX_Notify" artboard in `hex.riv` (390x360), the notification
 * screen's Hex *and* its permission popup in one. Its buttons aren't
 * clickable, so the screen supplies real ones. `Notify_SM` rests on
 * `NOTIFY_IDLE`; the `Notify_VM` view model's `show` trigger plays
 * `NOTIFY_SHOW` (Hex and the popup come in), `hide` plays `NOTIFY_HIDE`.
 */
export const NOTIFY_ARTBOARD = "HEX_Notify";
export const NOTIFY_STATE_MACHINE = "Notify_SM";
export const NOTIFY_VIEW_MODEL = "Notify_VM";
export const NOTIFY_TRIGGER = { show: "show", hide: "hide" } as const;
/** The artboard's size, for laying out the canvas at its own aspect. */
export const NOTIFY_ASPECT = 390 / 360;

/** Hex's home-screen widget — "HEX_Widget" in `hex.riv`, played by
 * `WidgetFull_SM`. It is the whole widget card the streak screen shows (it
 * replaced the phone-mockup PNG), so the canvas takes the artboard's own aspect. */
export const WIDGET_ARTBOARD = "HEX_Widget";
export const WIDGET_STATE_MACHINE = "WidgetFull_SM";
/** Used until the artboard's real size is read. */
export const WIDGET_FALLBACK_ASPECT = 0.957;

/** The level screen's background — the "ModuleBackground 2" artboard in
 * `hex.riv`, playing "State Machine 1" and repeated down the page. */
export const LEVEL_BACKGROUND = {
  src: HEX_RIVE_SRC,
  artboard: "ModuleBackground 2",
  stateMachine: "State Machine 1",
  /** Used until the artboard's real size is read. */
  fallbackAspect: 390 / 844,
} as const;

/** The lesson progress bar — "LESSON_ProgressBar" in `progressBar.riv`, played by
 * `ProgressBar_SM`; its `progress` property is the fill in percent (0-100). */
export const PROGRESS_BAR = {
  src: "/animations/progressBar.riv",
  artboard: "LESSON_ProgressBar",
  stateMachine: "ProgressBar_SM",
  property: "progress",
  /** CSS px of room around the bar for the effects that stray past its
   * artboard (see `applyCanvasBleed`). */
  bleed: 10,
  /** The track starts this many artboard px in from the artboard's left edge
   * (and so overruns its right edge by as much). The bar is drawn shifted
   * left by it, so the track itself fills the slot. `progressBar.riv`'s track
   * spans its 350px artboard edge to edge, so there is none to correct. */
  trackInset: 0,
  /** Number on the view model; held at `comboValue` for `comboHoldMs` whenever the fill changes. */
  comboProperty: "combo",
  comboValue: 3,
  comboHoldMs: 1000,
  /** Number on the view model, held at `screenHeightValue` for every screen. */
  screenHeightProperty: "screenH",
  screenHeightValue: -1,
  /** CSS px the canvas stops short of the screen's bottom when no button
   * artboard is on screen. With one, it stops at the artboard's top (see
   * `BUTTON.boxAttribute`), so nothing is drawn over the button. */
  bottomClearance: 113,
  /** Triggers on the view model, fired when an answer is checked. */
  correctTrigger: "correct",
  wrongTrigger: "wrong",
  /** A strike (see `moduleStreak`) waits this long, so it never lands in the
   * same frame as `correct` / `wrong` (one of two triggers fired together is
   * dropped) and starts with the fill's own tween. */
  strikeDelayMs: 150,
  /** `strikeLoop` is a boolean, not a trigger: it stays on until it is turned off
   * by hand, with `strikeWidth` (a number) held at `loopWidth` while it plays. */
  loopProperty: "strikeLoop",
  loopWidthProperty: "strikeWidth",
  loopWidth: 3,
} as const;

/** The robot arm behind the module's first screens — "CMD_RobotArm" in
 * `command.riv` (390x306), played by `Main`. The artboard binds the `RobotVM`
 * view model: each name in `triggers` is a trigger that plays that move, and
 * `targetLabel` is the text on the target box.
 *
 * The room is drawn past the artboard's edges (it doesn't clip): the wall and
 * window `overflowTop` px above it, the table's legs and the floor
 * `overflowBottom` px below it, so the whole picture is 390 x 600. */
export const COMMAND_ROBOT = {
  src: "/animations/command.riv",
  artboard: "CMD_RobotArm",
  stateMachine: "Main",
  width: 390,
  height: 306,
  overflowTop: 210,
  overflowBottom: 84,
  /** How far below the artboard's top the arm's highest point is, holding the cube. */
  armTop: 43,
  triggers: {
    pickUp: "pickUp",
    putDown: "putDown",
    placeInTarget: "placeInTarget",
    reset: "reset",
    showHint: "showHint",
    hideHint: "hideHint",
    wrongClaw: "wrongClaw",
    wrongCube: "wrongCube",
  },
  targetLabelProperty: "targetLabel",
  /** How long each move takes (its clip in the file), in seconds. The next
   * trigger is only taken once the machine is back at rest, so a move fired
   * sooner than this after another is dropped. */
  moveSeconds: {
    pickUp: 1.83,
    putDown: 1.63,
    // The "PlaceInTarget" clip (2.7s) and the "Success_In" (0.6s) that follows it:
    // a `reset` fired before that has played out is dropped.
    placeInTarget: 3.3,
    reset: 0.8,
    wrongClaw: 1.17,
    wrongCube: 1.17,
    // The hint plays on its own, beside the others.
    showHint: 0,
    hideHint: 0,
  },
} as const;

/** The battery — "BatteryArtboard-Main" in `battery.riv` (268x150), played by
 * `Battery_SM`. The artboard binds the `Battery` view model: `level` (0-100) is
 * the fill, `unlimited` swaps it for the infinity sign, `darkTheme` is `true`
 * in the dark theme and `false` in light, and the `fullFlash` trigger sparkles
 * across the whole battery. `spend` plays as a screen takes a unit; `gain`,
 * `fullFlash` and the `charging` boolean play as a streak gives one back (see
 * `moduleStreak`). The drawing fills the artboard edge to edge and its
 * empty-state glow spills about 7 units past it (the artboard does not clip),
 * so the canvas gets `bleed` units of room on every side. */
export const BATTERY = {
  src: "/animations/battery.riv",
  artboard: "BatteryArtboard-Main",
  stateMachine: "Battery_SM",
  levelProperty: "level",
  unlimitedProperty: "unlimited",
  darkThemeProperty: "darkTheme",
  fullFlashTrigger: "fullFlash",
  gainTrigger: "gain",
  spendTrigger: "spend",
  chargingProperty: "charging",
  /** How long `charging` stays on after a streak's charge. */
  chargingMs: 1500,
  /** `gain` and `fullFlash` are fired this far apart: one of two triggers fired in the same frame is dropped. */
  triggerGapMs: 150,
  width: 268,
  height: 150,
  bleed: 16,
} as const;

/** The brand CTA button — "AllButton" in `progressBar.riv` (360 x 73), played by
 * `ModuleButton_SM`. One artboard draws every button in the app: the `switchStyle`
 * number on its `AllButtonVM` view model picks the look (`style`). The artboard is
 * cropped to the drawn button, so the face fills it edge to edge. `label` is the
 * text, and the `shine` and `click` triggers play the highlight sweep and the press. */
export const BUTTON = {
  src: PROGRESS_BAR.src,
  artboard: "AllButton",
  stateMachine: "ModuleButton_SM",
  width: 360,
  height: 73,
  /** Where the drawn button sits in the artboard, as shares of its height. */
  face: { top: 0, bottom: 1 },
  /** Set on every button's box, which is the artboard's own rect (squeezed to
   * fit beside the hint), so the progress bar can end its canvas at its top. */
  boxAttribute: "data-button-artboard",
  /** The art reaches past the artboard (the face's lip 5 units below it, the
   * `electric` effect up to 17 on every side), and Rive clips at the canvas edge,
   * so the canvas gets this many artboard units of room on every side while the
   * button's box stays exactly the artboard's size (see `applyArtboardBleed`). */
  bleed: 20,
  /** The empty room the previous artboards (371 x 113, one per look) left above
   * and below the drawn button, as CSS shares of the button's width. A layout
   * that was built around that room pads the button with it. */
  room: {
    module: { top: "5.12%", bottom: "5.51%" },
    onboarding: { top: "6.47%", bottom: "3.23%" },
  },
  labelProperty: "label",
  styleProperty: "switchStyle",
  style: { module: 0, onboarding: 1 },
  /** The artboard starts in the module look and morphs into the onboarding one
   * when `switchStyle` is set (it takes 0.25s of Rive's time): a button that is
   * drawn per screen stays hidden for this long. A module button's `buttonState`
   * changes at once. */
  styleSwitchSeconds: 0.3,
  shineTrigger: "shine",
  clickTrigger: "click",
  /** Plays the electric effect, which reaches up to 17 units past the artboard
   * (see `bleed`): fired with every strike and battery charge of the progress bar. */
  electricTrigger: "electric",
  /** How long the `Electric` clip plays, in seconds. */
  electricSeconds: 0.67,
  /** Same cadence the old CSS shine used (`animate-button-shine`, 5s). */
  shineEveryMs: 5000,
} as const;

/** The module look (`BUTTON.style.module`): its `buttonState` number picks the art. */
export const MODULE_BUTTON = {
  stateProperty: "buttonState",
  state: { disabled: 0, wrong: 2, correct: 3, enabled: 4 },
} as const;

/** The reward screen's chest — "REWARD_Chest" in `hex.riv`, played by
 * `RewardChest_SM`. Firing `open` on the `RewardChest` view model opens it. */
export const REWARD_CHEST = {
  artboard: "REWARD_Chest",
  stateMachine: "RewardChest_SM",
  viewModel: "RewardChest",
  openTrigger: "open",
} as const;

export const HEX_HELLO_MS = 3000;
export const HEX_TAP_MS = 1400;
export const HEX_TYPING_MS = 2200;
export const HEX_FIDGET_MS = 2500;

/**
 * Splash — the "Splash Screen" artboard in `hex.riv` (same file as Hex). It
 * plays the `Splash_SM` state machine, data-bound to the `Splash_VM` view
 * model; firing that view model's `showSignUpScreen` trigger animates the
 * sign-up screen in.
 */
export const SPLASH_RIVE_SRC = HEX_RIVE_SRC;
export const SPLASH_ARTBOARD = "Splash Screen";
export const SPLASH_STATE_MACHINE = "Splash_SM";
export const SPLASH_VIEW_MODEL = "Splash_VM";
export const SPLASH_SHOW_SIGNUP_TRIGGER = "showSignUpScreen";

/** The lesson-complete screen — "LESSON_Complete" in `hex.riv`, played by
 * `LessonComplete_SM`. Set `xp`, `accuracy` and `time` on the `LessonComplete`
 * view model, then fire `play`. */
export const LESSON_COMPLETE = {
  artboard: "LESSON_Complete",
  stateMachine: "LessonComplete_SM",
  viewModel: "LessonComplete",
  xpProperty: "xp",
  accuracyProperty: "accuracy",
  timeProperty: "time",
  playTrigger: "play",
} as const;
