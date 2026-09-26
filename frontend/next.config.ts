import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' || process.env.DOCKER === '1' ? 'standalone' : undefined,
};

export default nextConfig;
