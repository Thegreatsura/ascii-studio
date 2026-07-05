import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: trace files from the workspace root, not just this app.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    useCache: true,
  },
  devIndicators: false,
  eslint: {
    // eslint-config-next's plugins don't resolve through bun's isolated
    // store during `next build`; run lint as its own step, not on build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
