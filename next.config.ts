import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't write AGENTS.md into the repo on `next dev`.
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
