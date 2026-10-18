import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.110",
    "172.25.80.1",
    "192.168.1.131",
    "172.25.48.1",
    "172.17.48.1",
    "renounce-vowel-country.ngrok-free.dev",
  ],
};

export default nextConfig;
