"use client";

import { useState } from "react";
import StudioNavbar from "@/components/studio-ui/navbar";
import PixelDistortion from "@/components/pixel-perfect/pixel-distortion";
import { Panel } from "@/tool/toolcraft/components/panel";
import {
  ControlItem,
  ControlList,
  ControlSection,
  ControlSectionHeader,
  PanelTitle,
} from "@/tool/toolcraft/components/control-layout";
import { SliderControl } from "@/tool/toolcraft/components/controls/slider";

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
      <div
        className="grid min-h-0 flex-1 gap-4"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) 300px",
          gridTemplateRows: "minmax(0, 1fr)",
        }}
      >
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

        {/* Controls — Toolcraft panel */}
        <div data-toolcraft-theme="light" className="min-h-0 h-full">
          <Panel
            className="h-full max-h-none w-full"
            onResetControls={() => setParams(DEFAULTS)}
            title="Controls"
          >
            <ControlSection>
              <ControlSectionHeader>
                <PanelTitle>Distortion</PanelTitle>
              </ControlSectionHeader>
              <ControlList>
                <ControlItem>
                  <SliderControl
                    name="Pixel Grid"
                    min={8}
                    max={120}
                    step={1}
                    value={params.grid}
                    onValueChange={(v) => set("grid", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Strength"
                    min={0}
                    max={0.12}
                    step={0.005}
                    value={params.strength}
                    onValueChange={(v) => set("strength", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Brush Size"
                    min={0.04}
                    max={0.4}
                    step={0.005}
                    value={params.brush}
                    onValueChange={(v) => set("brush", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Force"
                    min={10}
                    max={150}
                    step={5}
                    value={params.force}
                    onValueChange={(v) => set("force", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Relax"
                    min={0.8}
                    max={0.98}
                    step={0.005}
                    value={params.relax}
                    onValueChange={(v) => set("relax", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Momentum"
                    min={0.5}
                    max={0.97}
                    step={0.01}
                    value={params.momentum}
                    onValueChange={(v) => set("momentum", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Max Push"
                    min={1}
                    max={16}
                    step={1}
                    value={params.maxPush}
                    onValueChange={(v) => set("maxPush", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Sharpness (DPR)"
                    min={1}
                    max={3}
                    step={1}
                    unit="x"
                    value={params.dpr}
                    onValueChange={(v) => set("dpr", v)}
                  />
                </ControlItem>
              </ControlList>
            </ControlSection>
          </Panel>
        </div>
      </div>
    </main>
  );
}
