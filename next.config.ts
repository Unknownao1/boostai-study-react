import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"]
  },
  outputFileTracingRoot: __dirname
};

export default nextConfig;
