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
 * Robu mascot with the looping `eyeblink` timeline. Vector-only and tiny, used
 * on the closing instructions page and on the game screen.
 */
export const ROBU_EYEBLINK_RIVE_SRC = "/animations/robu_latest_day2.riv";

/**
 * Source for the "Meet Robu" character-intro animation (screen 09). Same
 * rationale as above — one constant shared by the renderer and the preloader.
 */
export const ROBU_RIVE_SRC = "/rive/robu.riv";

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
