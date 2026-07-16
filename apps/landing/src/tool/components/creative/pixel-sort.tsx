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
import { SegmentedControl } from "@/tool/toolcraft/components/controls/segmented";
import { SwitchControl } from "@/tool/toolcraft/components/controls/boolean";
import { FileDropControl } from "@/tool/toolcraft/components/controls/file-drop";
import { Button } from "@/tool/toolcraft/components/primitives";

import {
  ToolCanvasShell,
  downloadCanvasPng,
  useImageSource,
} from "@/tool/components/creative/creative-common";

type Direction = "horizontal" | "vertical";
type Channel = "lum" | "r" | "g" | "b";

const DEFAULTS = {
  direction: "horizontal" as Direction,
  low: 40,
  high: 180,
  channel: "lum" as Channel,
  reverse: false,
};

const MAX_WORK_WIDTH = 1000;

function brightness(d: Uint8ClampedArray, o: number): number {
  return 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2];
}

function channelValue(d: Uint8ClampedArray, o: number, channel: Channel): number {
  if (channel === "r") return d[o];
  if (channel === "g") return d[o + 1];
  if (channel === "b") return d[o + 2];
  return brightness(d, o);
}

export default function PixelSort(): React.JSX.Element {
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

    const { direction, low, high, channel, reverse } = params;
    const scale = Math.min(1, MAX_WORK_WIDTH / image.width);
    const W = Math.max(1, Math.round(image.width * scale));
    const H = Math.max(1, Math.round(image.height * scale));

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, W, H);
    const imageData = ctx.getImageData(0, 0, W, H);
    const d = imageData.data;

    const lineCount = direction === "horizontal" ? H : W;
    const lineLength = direction === "horizontal" ? W : H;

    // Offset of pixel (position along the line) within a given line.
    const offsetOf = (line: number, pos: number) =>
      direction === "horizontal"
        ? (line * W + pos) * 4
        : (pos * W + line) * 4;

    for (let line = 0; line < lineCount; line++) {
      let pos = 0;
      while (pos < lineLength) {
        while (pos < lineLength) {
          const b = brightness(d, offsetOf(line, pos));
          if (b >= low && b <= high) break;
          pos++;
        }
        const start = pos;
        while (pos < lineLength) {
          const b = brightness(d, offsetOf(line, pos));
          if (b < low || b > high) break;
          pos++;
        }
        const end = pos;
        if (end - start > 1) {
          const span: number[][] = [];
          for (let k = start; k < end; k++) {
            const o = offsetOf(line, k);
            span.push([d[o], d[o + 1], d[o + 2], d[o + 3], channelValue(d, o, channel)]);
          }
          span.sort((a, b) => a[4] - b[4]);
          if (reverse) span.reverse();
          for (let k = start; k < end; k++) {
            const o = offsetOf(line, k);
            const px = span[k - start];
            d[o] = px[0];
            d[o + 1] = px[1];
            d[o + 2] = px[2];
            d[o + 3] = px[3];
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
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
          <PanelTitle>Sort</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <SegmentedControl
              name="Direction"
              value={params.direction}
              options={[
                { label: "Rows", value: "horizontal" },
                { label: "Columns", value: "vertical" },
              ]}
              onValueChange={(v) => set("direction", v as Direction)}
            />
          </ControlItem>
          <ControlItem>
            <SegmentedControl
              name="Sort by"
              value={params.channel}
              options={[
                { label: "Lum", value: "lum" },
                { label: "R", value: "r" },
                { label: "G", value: "g" },
                { label: "B", value: "b" },
              ]}
              onValueChange={(v) => set("channel", v as Channel)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Low threshold"
              min={0}
              max={255}
              step={1}
              value={params.low}
              onValueChange={(v) => set("low", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="High threshold"
              min={0}
              max={255}
              step={1}
              value={params.high}
              onValueChange={(v) => set("high", v)}
            />
          </ControlItem>
          <ControlItem>
            <SwitchControl
              name="Reverse"
              checked={params.reverse}
              onCheckedChange={(v) => set("reverse", v)}
            />
          </ControlItem>
          <ControlItem>
            <Button
              className="w-full"
              size="sm"
              onClick={() =>
                downloadCanvasPng(canvasRef.current, `${fileName}-pixelsort`)
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
      title="Pixel Sort"
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
