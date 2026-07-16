import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Monorepo: trace files from the workspace root, not just this app.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  reactCompiler: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/landing",
        destination: "/",
        permanent: true,
      },
      {
        // The pixel-distortion tool moved under the /tool zone.
        source: "/studio",
        destination: "/tool/pixel-distortion",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
