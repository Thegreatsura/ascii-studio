"use client";

import { useRef, useState } from "react";
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
import { SwitchControl } from "@/tool/toolcraft/components/controls/boolean";
import { FileDropControl } from "@/tool/toolcraft/components/controls/file-drop";
import { Button } from "@/tool/toolcraft/components/primitives";
import { downloadCanvasPng } from "@/tool/components/creative/creative-common";

const DEFAULT_IMAGE = "/studio/meadow.png";

const DEFAULTS = {
  grid: 40,
  strength: 0.045,
  relax: 0.9,
  force: 70,
  brush: 0.125,
  maxPush: 8,
  momentum: 0.9,
  dpr: 2,
  rgbShift: 0.35,
  pixelate: 0,
  wander: true,
  wanderSpeed: 0.8,
};

export default function StudioPage() {
  const [params, setParams] = useState(DEFAULTS);
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const previewRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => setParams((p) => ({ ...p, [key]: value }));

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
        <div
          ref={previewRef}
          className="overflow-hidden rounded-xl border bg-white"
        >
          <PixelDistortion
            image={image}
            className="h-full w-full"
            grid={params.grid}
            strength={params.strength}
            relax={params.relax}
            force={params.force}
            brush={params.brush}
            maxPush={params.maxPush}
            momentum={params.momentum}
            dpr={params.dpr}
            rgbShift={params.rgbShift}
            pixelate={params.pixelate}
            wander={params.wander}
            wanderSpeed={params.wanderSpeed}
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
                <PanelTitle>Source</PanelTitle>
              </ControlSectionHeader>
              <ControlList>
                <ControlItem>
                  <FileDropControl
                    accept="image/*"
                    onFileSelect={(file) => setImage(URL.createObjectURL(file))}
                  />
                </ControlItem>
              </ControlList>
            </ControlSection>

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

            <ControlSection>
              <ControlSectionHeader>
                <PanelTitle>Effects</PanelTitle>
              </ControlSectionHeader>
              <ControlList>
                <ControlItem>
                  <SliderControl
                    name="RGB Split"
                    min={0}
                    max={2}
                    step={0.05}
                    value={params.rgbShift}
                    onValueChange={(v) => set("rgbShift", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Pixelate"
                    min={0}
                    max={200}
                    step={5}
                    value={params.pixelate}
                    onValueChange={(v) => set("pixelate", v)}
                  />
                </ControlItem>
              </ControlList>
            </ControlSection>

            <ControlSection>
              <ControlSectionHeader>
                <PanelTitle>Motion</PanelTitle>
              </ControlSectionHeader>
              <ControlList>
                <ControlItem>
                  <SwitchControl
                    name="Auto wander"
                    checked={params.wander}
                    onCheckedChange={(v) => set("wander", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <SliderControl
                    name="Wander speed"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={params.wanderSpeed}
                    onValueChange={(v) => set("wanderSpeed", v)}
                  />
                </ControlItem>
                <ControlItem>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() =>
                      downloadCanvasPng(
                        previewRef.current?.querySelector("canvas") ?? null,
                        "pixel-distortion",
                      )
                    }
                  >
                    Export PNG
                  </Button>
                </ControlItem>
              </ControlList>
            </ControlSection>
          </Panel>
        </div>
      </div>
    </main>
  );
}
