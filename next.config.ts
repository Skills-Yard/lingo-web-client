import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.30.144.1", "192.168.1.109"],
  async headers() {
    // Static media is large and rarely changes: let the browser/CDN keep it
    // (revalidating in the background) instead of re-downloading each visit.
    const cache = (value: string) => [{ key: "Cache-Control", value }];
    return [
      { source: "/rive/:path*", headers: cache("public, max-age=31536000, immutable") },
      {
        source: "/:dir(animations|audios|images|json|video)/:path*",
        headers: cache("public, max-age=86400, stale-while-revalidate=604800"),
      },
    ];
  },
};

export default nextConfig;
