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
  /** Hex speaks — while a screen's voiceover plays, before its own trigger. */
  talk: "talk",
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

export type HexOnboardingTrigger =
  (typeof HEX_ONBOARDING_TRIGGER)[keyof typeof HEX_ONBOARDING_TRIGGER];

/**
 * Reactions — the "6.1 and 5.1" artboard in `hex.riv`, used by the "Have you
 * worked with code" and "superpower level" questions. `Reactions_SM` reacts
 * to the picked option: set `option` (1-4) and fire `select`.
 */
export const REACTIONS_ARTBOARD = "6.1 and 5.1";
export const REACTIONS_STATE_MACHINE = "Reactions_SM";
export const REACTIONS_OPTION = "option";
export const REACTIONS_SELECT_TRIGGER = "select";

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
export const HEX_BACKGROUND = { artboard: "BG_Grid", stateMachine: "BG_SM" } as const;

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
