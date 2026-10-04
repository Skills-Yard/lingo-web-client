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
 * fox rigs below instead (`ROBU_RIVE_SRC` / `ONBOARDING_FOX_RIVE_SRC`).
 */
export const ORBI_RIVE_SRC = "/animations/orbi_final.riv";

/**
 * The fox rig used by the onboarding flow's splash and notification fox
 * (`OnboardingSplash`, `NotificationFox`).
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
 * The onboarding fox's rig — `zox-vector-2.riv`, artboard "Zox_Vector". No
 * state machine is played: the looping "Zox_Idle" clip runs all the time, and
 * the hi wave and tap giggle are clips played by name in its place for a
 * moment. Replaces `ROBU_RIVE_SRC` for the onboarding flow only; the
 * instructions-intro screens still use `foxi-9.riv`'s "Artboard 2".
 */
export const ONBOARDING_FOX_RIVE_SRC = "/animations/zox-vector-2.riv";
export const ONBOARDING_FOX_ARTBOARD = "Zox_Vector";
export const ONBOARDING_FOX_IDLE_ANIMATION = "Zox_Idle";
/** The only state machine played: it moves his eyes to follow the pointer
 * (its listener reads mouse moves over the canvas — see useEyeTracking). It has
 * no inputs, and nothing else about him depends on it. */
export const ONBOARDING_FOX_EYE_STATE_MACHINE = "Character_Joystick";
/** Played on every tap on Zox on a cut-scene screen. */
export const ONBOARDING_FOX_TAP_ANIMATION = "Zox_Tap_Giggle";
export const ONBOARDING_FOX_TAP_MS = 1400;
/** Artboard size of the onboarding fox, used to size the hi fox below to it. */
export const ONBOARDING_FOX_ARTBOARD_SIZE = { width: 420, height: 520 };

/**
 * The greeting screen's hi wave comes from `zox-2.riv` instead, faded in over
 * the main fox for the wave and faded out after: artboard "Character " (the
 * trailing space is part of the name), "Zox_Main" state machine, and the
 * "ZoxVM" view model's `hi` trigger. It's played for `GREETING_FOX_HI_MS` (the
 * wave is ~385 frames at 60fps).
 */
export const GREETING_FOX_RIVE_SRC = "/animations/zox-2.riv";
export const GREETING_FOX_ARTBOARD = "Character ";
export const GREETING_FOX_STATE_MACHINE = "Zox_Main";
export const GREETING_FOX_VIEW_MODEL = "ZoxVM";
export const GREETING_FOX_HI_TRIGGER = "hi";
export const GREETING_FOX_ARTBOARD_SIZE = { width: 479, height: 562 };
export const GREETING_FOX_HI_MS = 6600;

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
 * Zox on the question screens — `zox-tab-5.riv`, artboard "ZoxTabArtboard":
 * Zox with his tablet. Driven entirely by its "ZoxTabMain" state machine,
 * through the "ZoxTab" view model's triggers (`showTab`, `lookUser`,
 * `lookTab`, `typing`, `idle`, `blink`; `point` and `hideTab` are unused) —
 * no clip is played by name.
 */
export const ZOX_TAB_RIVE_SRC = "/animations/zox-tab-5.riv";
export const ZOX_TAB_ARTBOARD = "ZoxTabArtboard";
export const ZOX_TAB_STATE_MACHINE = "ZoxTabMain";
/** Played by name (no state machine) on the notification screen: Zox pointing
 * down at the Allow button — the one-shot "start" first (one second), then the
 * looping "clicking" for as long as the screen is up. */
export const ZOX_TAB_POINT_START_ANIMATION = "Pointing_for_allow screen 2 start";
export const ZOX_TAB_POINT_START_MS = 1000;
export const ZOX_TAB_POINT_CLICKING_ANIMATION = "Pointing_for_allow screen 2 clicking";
