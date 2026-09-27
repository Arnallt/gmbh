import type { NextConfig } from "next";

// GitHub Pages serves this project from /<repo>; the Pages workflow sets PAGES_BASE_PATH.
// Local dev and other hosts leave it empty.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
