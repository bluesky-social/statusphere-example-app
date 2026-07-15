import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@atproto/tap", "thread-stream", "pino"],
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
