import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    // Don't write AGENTS.md into the repo on `next dev`.
    agentRules: false,
    devIndicators: false,
    // `*.dev.ts` files (the review-comments route) only exist under `next dev`.
    pageExtensions: phase === PHASE_DEVELOPMENT_SERVER ? ["dev.ts", "tsx", "ts"] : ["tsx", "ts"],
  };
}
