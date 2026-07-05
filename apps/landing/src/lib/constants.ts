// Shared design constants used across the landing UI.

/** Brand radial gradient used for highlighted/selected surfaces. */
export const BRAND_GRADIENT =
  "radial-gradient(152.32% 683.53% at 108.86% 152.32%, #6395FF 0%, #F3F7FF 100%)";

/**
 * Base URL of the ASCII studio tool app.
 * Defaults to the local tool workspace (bun run dev → base port 3100).
 * Override with NEXT_PUBLIC_TOOL_URL for production.
 */
export const TOOL_URL =
  process.env.NEXT_PUBLIC_TOOL_URL ?? "http://localhost:3100";

/** Direct link to the studio inside the tool app. */
export const TOOL_STUDIO_URL = `${TOOL_URL}/studio`;
