import { ASCII_CHAR_PRESETS } from "@/tool/lib/ascii-appearance";

/* ── API Response Types ───────────────────────────────────────────── */

export type ConversionResponse = {
  columns: number;
  fileName: string;
  fileSize: number;
  fps: number;
  frameCount: number;
  frames: string[];
  rows: number;
  chars: string;
};

/* ── Settings ─────────────────────────────────────────────────────── */

export type ConversionSettings = {
  chars: string;
  columns: number;
  invert: boolean;
  luminanceThreshold: number;
};

export type SizeUnit = "px" | "vw" | "vh" | "%";

export type ConversionPhase = "idle" | "generating" | "done";

export type ExportingType = "component" | "video" | "image" | null;

/* ── Constants ────────────────────────────────────────────────────── */

// Only browser-decodable container/codecs (mp4/H.264, webm, mov/H.264) plus images.
export const ACCEPTED_FILE_TYPES =
  ".mp4,.webm,.mov,.png,.jpg,.jpeg,.webp,.gif";

export const QUALITY_PRESETS = [
  { id: "low", label: "Low (Performance)", columns: 60 },
  { id: "mid", label: "Mid (Balanced)", columns: 130 },
  { id: "high", label: "High (Detail)", columns: 220 },
] as const;

export const MAX_PREVIEW_FPS = 24;
export const STUDIO_FPS = 30;

export const DEFAULT_CONVERSION: ConversionSettings = {
  chars: ASCII_CHAR_PRESETS[0].chars,
  columns: QUALITY_PRESETS[1].columns,
  invert: false,
  luminanceThreshold: 30,
};
