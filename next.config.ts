import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * A short content hash for every file in `public/animations`, by its URL path.
 * The app asks for `…/hex.riv?v=<hash>` (see `src/lib/rive/riveCache.ts`), and
 * the header rule below lets the browser keep such a URL for a year: a file that
 * hasn't changed is never requested again (not even to revalidate it), and one
 * that has gets a new URL, so a redeploy is never served stale. Dev doesn't use
 * versions (a replaced file must show up at once), so none are computed there.
 */
const animationVersions = (): Record<string, string> => {
  const dir = path.join(process.cwd(), "public", "animations");
  const versions: Record<string, string> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const hash = createHash("sha1")
      .update(readFileSync(path.join(dir, entry.name)))
      .digest("hex");
    versions[`/animations/${entry.name}`] = hash.slice(0, 10);
  }
  return versions;
};

export default function config(phase: string): NextConfig {
  return {
    allowedDevOrigins: ["172.30.144.1", "192.168.1.106", "10.135.178.84"],
    env: {
      NEXT_PUBLIC_RIVE_VERSIONS: JSON.stringify(
        phase === PHASE_DEVELOPMENT_SERVER ? {} : animationVersions(),
      ),
    },
    async redirects() {
      // The Command module used to live at the bare `/module`; keep old links and bookmarks working.
      // Next carries the query (`?step=`) over to the destination.
      return [
        {
          source: "/module",
          destination: "/module/commands",
          permanent: false,
        },
      ];
    },
    async headers() {
      // Static media is large and rarely changes: let the browser/CDN keep it
      // (revalidating in the background) instead of re-downloading each visit.
      const cache = (value: string) => [{ key: "Cache-Control", value }];
      return [
        {
          source: "/rive/:path*",
          headers: cache("public, max-age=31536000, immutable"),
        },
        {
          source: "/:dir(animations|audios|images|json|video)/:path*",
          headers: cache(
            "public, max-age=86400, stale-while-revalidate=604800",
          ),
        },
        // After the rule above, so it wins: a versioned animation URL never changes content.
        {
          source: "/animations/:path*",
          has: [{ type: "query", key: "v" }],
          headers: cache("public, max-age=31536000, immutable"),
        },
      ];
    },
  };
}
