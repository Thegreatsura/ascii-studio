"use client";

import { useState } from "react";
import StudioNavbar from "@/components/studio-ui/navbar";
import PixelDistortion from "@/components/pixel-perfect/pixel-distortion";

const IMAGE = "/studio/meadow.png";

const DEFAULTS = {
  grid: 40,
  strength: 0.045,
  relax: 0.9,
  force: 70,
  brush: 0.125,
  maxPush: 8,
  momentum: 0.9,
  dpr: 2,
};

export default function StudioPage() {
  const [params, setParams] = useState(DEFAULTS);

  const set = <K extends keyof typeof DEFAULTS>(key: K, value: number) =>
    setParams((p) => ({ ...p, [key]: value }));

  return (
    <main className="flex h-screen flex-col gap-4 bg-background p-4 font-satoshi">
      <StudioNavbar />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_260px] gap-4">
        {/* Preview */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <PixelDistortion
            image={IMAGE}
            className="h-full w-full"
            grid={params.grid}
            strength={params.strength}
            relax={params.relax}
            force={params.force}
            brush={params.brush}
            maxPush={params.maxPush}
            momentum={params.momentum}
            dpr={params.dpr}
          />
        </div>

        {/* Controls */}
        <div className="space-y-5 overflow-y-auto rounded-xl border bg-white p-4">
            <Slider
              label="Pixel Grid"
              value={params.grid}
              min={8}
              max={120}
              step={1}
              format={(v) => `${v}`}
              onChange={(v) => set("grid", v)}
            />
            <Slider
              label="Strength"
              value={params.strength}
              min={0}
              max={0.12}
              step={0.005}
              format={(v) => v.toFixed(3)}
              onChange={(v) => set("strength", v)}
            />
            <Slider
              label="Brush Size"
              value={params.brush}
              min={0.04}
              max={0.4}
              step={0.005}
              format={(v) => v.toFixed(3)}
              onChange={(v) => set("brush", v)}
            />
            <Slider
              label="Force"
              value={params.force}
              min={10}
              max={150}
              step={5}
              format={(v) => `${v}`}
              onChange={(v) => set("force", v)}
            />
            <Slider
              label="Relax"
              value={params.relax}
              min={0.8}
              max={0.98}
              step={0.005}
              format={(v) => v.toFixed(3)}
              onChange={(v) => set("relax", v)}
            />
            <Slider
              label="Momentum"
              value={params.momentum}
              min={0.5}
              max={0.97}
              step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => set("momentum", v)}
            />
            <Slider
              label="Max Push"
              value={params.maxPush}
              min={1}
              max={16}
              step={1}
              format={(v) => `${v}`}
              onChange={(v) => set("maxPush", v)}
            />
            <Slider
              label="Sharpness (DPR)"
              value={params.dpr}
              min={1}
              max={3}
              step={1}
              format={(v) => `${v}x`}
              onChange={(v) => set("dpr", v)}
            />
        </div>
      </div>
    </main>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(value)}
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
