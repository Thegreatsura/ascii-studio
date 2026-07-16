"use client";

import * as React from "react";

import {
  ControlItem,
  ControlList,
  ControlSection,
  ControlSectionHeader,
  PanelTitle,
} from "@/tool/toolcraft/components/control-layout";
import { SliderControl } from "@/tool/toolcraft/components/controls/slider";
import { SwitchControl } from "@/tool/toolcraft/components/controls/boolean";
import { ColorValueControl } from "@/tool/toolcraft/components/controls/color/color-value-control";
import { FileDropControl } from "@/tool/toolcraft/components/controls/file-drop";
import { Button } from "@/tool/toolcraft/components/primitives";

import {
  ToolCanvasShell,
  downloadCanvasPng,
  useImageSource,
} from "@/tool/components/creative/creative-common";

const DEFAULTS = {
  spacing: 8,
  dotScale: 1.1,
  angle: 27,
  invert: false,
  ink: "#0b0b12",
  paper: "#f4f6ff",
};

const MAX_WORK_WIDTH = 1400;

export default function Halftone(): React.JSX.Element {
  const { image, fileName, onSelectFile } = useImageSource("/studio/meadow.png");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [params, setParams] = React.useState(DEFAULTS);

  const set = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => setParams((p) => ({ ...p, [key]: value }));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const { spacing, dotScale, angle, invert } = params;
    const scale = Math.min(1, MAX_WORK_WIDTH / image.width);
    const W = Math.max(1, Math.round(image.width * scale));
    const H = Math.max(1, Math.round(image.height * scale));

    // Sample brightness from a downscaled copy of the source.
    const src = document.createElement("canvas");
    src.width = W;
    src.height = H;
    const sctx = src.getContext("2d");
    if (!sctx) return;
    sctx.drawImage(image, 0, 0, W, H);
    const data = sctx.getImageData(0, 0, W, H).data;

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = params.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = params.ink;

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const cx = W / 2;
    const cy = H / 2;
    const diag = Math.hypot(W, H);
    const maxR = (spacing / 2) * dotScale;

    for (let gy = -diag / 2; gy < diag / 2; gy += spacing) {
      for (let gx = -diag / 2; gx < diag / 2; gx += spacing) {
        // Rotated lattice point mapped into image space.
        const ix = cx + gx * cos - gy * sin;
        const iy = cy + gx * sin + gy * cos;
        const px = Math.floor(ix);
        const py = Math.floor(iy);
        if (px < 0 || px >= W || py < 0 || py >= H) continue;
        const o = (py * W + px) * 4;
        const bright =
          (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
        const v = invert ? bright : 1 - bright;
        const r = v * maxR;
        if (r < 0.35) continue;
        ctx.beginPath();
        ctx.arc(ix, iy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [image, params]);

  const controls = (
    <>
      <ControlSection>
        <ControlSectionHeader>
          <PanelTitle>Source</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <FileDropControl accept="image/*" onFileSelect={onSelectFile} />
          </ControlItem>
        </ControlList>
      </ControlSection>

      <ControlSection>
        <ControlSectionHeader>
          <PanelTitle>Halftone</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <SliderControl
              name="Dot size"
              min={0.2}
              max={1.6}
              step={0.05}
              value={params.dotScale}
              onValueChange={(v) => set("dotScale", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Spacing"
              min={4}
              max={30}
              step={1}
              unit="px"
              value={params.spacing}
              onValueChange={(v) => set("spacing", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Angle"
              min={0}
              max={90}
              step={1}
              unit="°"
              value={params.angle}
              onValueChange={(v) => set("angle", v)}
            />
          </ControlItem>
          <ControlItem>
            <SwitchControl
              name="Invert"
              checked={params.invert}
              onCheckedChange={(v) => set("invert", v)}
            />
          </ControlItem>
        </ControlList>
      </ControlSection>

      <ControlSection>
        <ControlSectionHeader>
          <PanelTitle>Palette</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <ColorValueControl
              label="Ink"
              color={params.ink}
              onColorChange={(v) => set("ink", v)}
            />
          </ControlItem>
          <ControlItem>
            <ColorValueControl
              label="Paper"
              color={params.paper}
              onColorChange={(v) => set("paper", v)}
            />
          </ControlItem>
          <ControlItem>
            <Button
              className="w-full"
              size="sm"
              onClick={() =>
                downloadCanvasPng(canvasRef.current, `${fileName}-halftone`)
              }
            >
              Export PNG
            </Button>
          </ControlItem>
        </ControlList>
      </ControlSection>
    </>
  );

  return (
    <ToolCanvasShell
      title="Halftone"
      onReset={() => setParams(DEFAULTS)}
      controls={controls}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain"
      />
    </ToolCanvasShell>
  );
}
