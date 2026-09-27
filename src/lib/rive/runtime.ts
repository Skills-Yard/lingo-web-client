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
 */
export const ROBU_RIVE_SRC = "/animations/foxi-5.riv";

/**
 * The onboarding flow's persistent fox (`OnboardingFox`). Same rig and clip
 * names as `ROBU_RIVE_SRC`, plus a "laptop" state machine (fox sitting with
 * its laptop — "laptop idle" / blink / "mouth idle " layers, no inputs) and
 * the one-shot "laptop typing " / looping "tail typing" clips the question
 * screens play when an option is picked.
 */
export const ONBOARDING_FOX_RIVE_SRC = "/animations/foxy-me-2.riv";

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
