"use client";

import React, { useState } from "react";
import ASCIIAnimation from "@/components/ascii-animation";
import { blueFireFrames } from "@/components/blue-fire";
import { Label } from "@/components/ui/label";
import {
  type ASCIITextEffect,
  DEFAULT_ASCII_APPEARANCE,
} from "@/lib/ascii-appearance";

const EFFECTS: { id: ASCIITextEffect; label: string }[] = [
  { id: "none", label: "None" },
  { id: "matrix", label: "Matrix" },
  { id: "neon", label: "Neon" },
  { id: "glitch", label: "Glitch" },
  { id: "gradient", label: "Gradient" },
  { id: "burn", label: "Burn" },
  { id: "neural", label: "Neural" },
  { id: "video", label: "Video" },
];

const COLORS = ["#79A4FF", "#ffffff", "#00ff95", "#ff4d6d", "#ffb020", "#b388ff"];

export default function StudioPage() {
  const [effect, setEffect] = useState<ASCIITextEffect>("none");
  const [threshold, setThreshold] = useState(0);
  const [textColor, setTextColor] = useState("#79A4FF");
  const [fontSize, setFontSize] = useState(8);
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Studio</h1>
            <p className="text-xs text-muted-foreground">
              Live ASCII effects preview
            </p>
          </div>
        </div>

        {/* Preview (left, large) + Controls (right, narrow) */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Preview */}
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Preview
              </span>
              <span className="text-[10px] text-muted-foreground">
                {EFFECTS.find((e) => e.id === effect)?.label} effect
              </span>
            </div>
            <div className="flex min-h-[60vh] items-center justify-center overflow-hidden p-4">
              <div className="h-[60vh] w-full">
                <ASCIIAnimation
                  className="h-full w-full"
                  frames={blueFireFrames}
                  fps={30}
                  chars={" .:░▒▓█"}
                  fitToContainer
                  isPlaying={isPlaying}
                  appearance={{
                    ...DEFAULT_ASCII_APPEARANCE,
                    backgroundColor: "transparent",
                    borderRadius: 0,
                    fontSize,
                    lineHeight: 0.78,
                    showFrameCounter: false,
                    textColor,
                    textEffect: effect,
                    textEffectThreshold: threshold,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <Panel title="Effect">
              <div className="grid grid-cols-2 gap-1.5">
                {EFFECTS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEffect(e.id)}
                    className={`h-7 rounded-md border text-[11px] transition-colors ${
                      effect === e.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              <SliderField
                label="Threshold"
                value={threshold}
                min={0}
                max={200}
                step={5}
                onChange={setThreshold}
              />
            </Panel>

            <Panel title="Appearance">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Text Color
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextColor(c)}
                      className={`size-6 rounded-md border transition-transform hover:scale-110 ${
                        textColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <SliderField
                label="Font Size"
                value={fontSize}
                min={4}
                max={20}
                step={1}
                onChange={setFontSize}
              />
            </Panel>

            <Panel title="Playback">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="h-8 w-full rounded-md border text-xs font-medium transition-colors hover:bg-muted/60"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}

function SliderField({
  label,
  max,
  min,
  step,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
    </div>
  );
}
