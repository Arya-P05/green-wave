import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    basePath: "/writing",
    // Don't write AGENTS.md into the repo on `next dev`.
    agentRules: false,
    devIndicators: false,
    // `*.dev.ts` files (the review-comments route) only exist under `next dev`.
    pageExtensions: phase === PHASE_DEVELOPMENT_SERVER ? ["dev.ts", "tsx", "ts"] : ["tsx", "ts"],
    async redirects() {
      const legacyHost = [{ type: "host" as const, value: "writing.aryap.me" }];
      return [
        {
          source: "/",
          has: legacyHost,
          destination: "https://aryap.me/writing",
          statusCode: 301,
          basePath: false,
        },
        {
          source: "/writing",
          has: legacyHost,
          destination: "https://aryap.me/writing",
          statusCode: 301,
          basePath: false,
        },
        {
          source: "/writing/:path*",
          has: legacyHost,
          destination: "https://aryap.me/writing/:path*",
          statusCode: 301,
          basePath: false,
        },
        {
          source: "/:path*",
          has: legacyHost,
          destination: "https://aryap.me/writing/:path*",
          statusCode: 301,
          basePath: false,
        },
      ];
    },
  };
}
