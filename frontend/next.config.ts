import type { NextConfig } from "next";

const config: NextConfig = {
  // Ship only the files the server actually reaches. public/ and static/
  // remain explicit Docker layers so their cache changes independently.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  // This repository is intentionally not a JavaScript workspace rooted at a
  // parent package-lock. Make the frontend itself the only resolution root.
  turbopack: { root: process.cwd() },

  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31_536_000,
  },
};

export default config;
