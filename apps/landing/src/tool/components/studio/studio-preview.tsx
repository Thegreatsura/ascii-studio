"use client";

import { Moon, Pause, Play, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/tool/components/ui/button";
import { Label } from "@/tool/components/ui/label";
import { Slider } from "@/tool/components/ui/slider";
import { Stat } from "@/tool/components/studio/studio-primitives";
import ASCIIAnimation from "@/tool/components/ascii-animation";
import type { ASCIIAppearance } from "@/tool/lib/ascii-appearance";
import type { ConversionResponse } from "@/tool/components/studio/studio-types";

type StudioPreviewProps = {
  result: ConversionResponse | null;
  previewFrame: {
    frame: string;
    rows: number;
    columns: number;
    colorUrl?: string;
  } | null;
  estimatedSize: { w: number; h: number } | null;
  backgroundWidthCss: string;
  backgroundHeightCss: string;
  backgroundResponsive: boolean;
  backgroundAppearance: ASCIIAppearance;
  conversionChars: string;
  previewPlaybackFps: number;
  previewKey: string;
  previewIsPlaying: boolean;
  setPreviewIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  studioTheme: "light" | "dark";
  setStudioTheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
  /* timeline scrubber */
  selectedFile: File | null;
  isImage: boolean;
  videoDuration: number;
  previewTimeDraft: number;
  setPreviewTimeDraft: (v: number) => void;
  setPreviewTime: (v: number) => void;
  setResult: React.Dispatch<React.SetStateAction<ConversionResponse | null>>;
};

export function StudioPreview({
  result,
  previewFrame,
  estimatedSize,
  backgroundWidthCss,
  backgroundHeightCss,
  backgroundResponsive,
  backgroundAppearance,
  conversionChars,
  previewPlaybackFps,
  previewKey,
  previewIsPlaying,
  setPreviewIsPlaying,
  studioTheme,
  setStudioTheme,
  selectedFile,
  isImage,
  videoDuration,
  previewTimeDraft,
  setPreviewTimeDraft,
  setPreviewTime,
  setResult,
}: StudioPreviewProps) {
  return (
    <div style={{ position: "sticky", top: "12px" }}>
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span>
            Preview
          </span>
        
           <div className=" gap-2 flex">
              <Button
                className="h-8 gap-2 text-xs"
                variant="outline"
                onClick={() => setPreviewIsPlaying((c) => !c)}
                size="sm"
                type="button"
              >
                {previewIsPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {previewIsPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                className="h-8 gap-2 text-xs"
                onClick={() =>
                  setStudioTheme((c) =>
                    c === "dark" ? "light" : "dark",
                  )
                }
                size="sm"
                type="button"
                variant="outline"
              >
                {studioTheme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                {studioTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
        </div>

        <div className="overflow-auto p-3"> 
          <div
            className="mx-auto relative border-dashed border-2"
            style={{
              width: backgroundWidthCss,
              height: backgroundHeightCss,
              maxWidth: "100%",
              maxHeight: "70vh",
              overflow: "hidden",
              background:
                "repeating-linear-gradient(45deg, hsl(var(--muted) / 0.28), hsl(var(--muted) / 0.28) 12px, transparent 12px, transparent 24px)",
            }}
          >
            <ASCIIAnimation
              appearance={backgroundAppearance}
              className="w-full h-full"
              chars={conversionChars}
              colorUrl={previewFrame?.colorUrl}
              fitToContainer={backgroundResponsive}
              fps={previewPlaybackFps}
              isPlaying={previewIsPlaying}
              frameCount={result ? result.frameCount : 120}
              frameFolder="ascii_frames_1773421882491/frame_images"
              frames={
                result
                  ? result.frames
                  : previewFrame
                    ? [previewFrame.frame]
                    : undefined
              }
              key={`${previewKey}-${backgroundWidthCss}-${backgroundHeightCss}-${backgroundResponsive}`}
            />
          </div>
        </div>

        {/* Timeline Scrubber */}
        {selectedFile && !result && !isImage && (
          <div className="border-t px-4 py-2 bg-muted/20">
            <div className="flex items-center justify-between mb-1.5 min-w-0 overflow-hidden">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                Timeline Scrubber
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-3 w-3 rounded-full hover:bg-accent/50 p-0"
                  onClick={() => {
                    const resetTime = Math.min(1.0, videoDuration / 2);
                    setPreviewTime(resetTime);
                    setPreviewTimeDraft(resetTime);
                  }}
                  title="Reset timeline"
                >
                  <RotateCcw className="h-2 w-2" />
                </Button>
              </Label>
              <span className="text-[9px] tabular-nums font-mono text-muted-foreground">
                {Math.floor(previewTimeDraft / 60)}:
                {(previewTimeDraft % 60).toFixed(1).padStart(4, "0")} /{" "}
                {Math.floor(videoDuration / 60)}:
                {(videoDuration % 60).toFixed(1).padStart(4, "0")}
              </span>
            </div>
            <Slider
              max={videoDuration || 100}
              min={0}
              step={0.1}
              value={[previewTimeDraft]}
              onValueChange={([v]) => setPreviewTimeDraft(v)}
              onValueCommit={([v]) => {
                setPreviewTime(v);
                setResult(null);
              }}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 border-t">
          <Stat
            label="Frames"
            value={
              result
                ? String(result.frameCount)
                : previewFrame
                  ? "1 (Live)"
                  : "—"
            }
          />
          <Stat
            label="Grid"
            value={
              result
                ? `${result.columns}×${result.rows}`
                : previewFrame
                  ? `${previewFrame.columns}×${previewFrame.rows}`
                  : "—"
            }
          />
          <Stat
            label="Resolution"
            value={
              estimatedSize
                ? `${estimatedSize.w}×${estimatedSize.h}px`
                : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}
