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
import { SelectControl } from "@/tool/toolcraft/components/controls/select";
import { SwitchControl } from "@/tool/toolcraft/components/controls/boolean";
import { ColorValueControl } from "@/tool/toolcraft/components/controls/color/color-value-control";
import { FileDropControl } from "@/tool/toolcraft/components/controls/file-drop";
import { Button } from "@/tool/toolcraft/components/primitives";

import {
  ToolCanvasShell,
  downloadCanvasPng,
  useImageSource,
} from "@/tool/components/creative/creative-common";

type Algorithm =
  | "bayer2"
  | "bayer4"
  | "bayer8"
  | "floyd"
  | "atkinson"
  | "noise"
  | "threshold";

type PaletteId = "custom" | "gameboy" | "cga" | "pico8";

const DEFAULTS = {
  pixelSize: 4,
  contrast: 110,
  bias: 0,
  algorithm: "bayer4" as Algorithm,
  palette: "custom" as PaletteId,
  invert: false,
  darkColor: "#0b0b12",
  lightColor: "#8ab4ff",
};

const ALGORITHM_OPTIONS = [
  { label: "Bayer 2×2 (coarse)", value: "bayer2" },
  { label: "Bayer 4×4 (classic)", value: "bayer4" },
  { label: "Bayer 8×8 (fine)", value: "bayer8" },
  { label: "Floyd–Steinberg", value: "floyd" },
  { label: "Atkinson (old Mac)", value: "atkinson" },
  { label: "Noise", value: "noise" },
  { label: "Hard threshold", value: "threshold" },
];

const PALETTE_OPTIONS = [
  { label: "Custom (2 colors)", value: "custom" },
  { label: "Game Boy", value: "gameboy" },
  { label: "CGA", value: "cga" },
  { label: "PICO-8", value: "pico8" },
];

/** mono palettes map luminance → shades; rgb palettes quantise full colour */
const PRESET_PALETTES: Record<
  Exclude<PaletteId, "custom">,
  { mode: "mono" | "rgb"; colors: string[] }
> = {
  gameboy: {
    mode: "mono",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  cga: {
    mode: "rgb",
    colors: ["#000000", "#55ffff", "#ff55ff", "#ffffff"],
  },
  pico8: {
    mode: "rgb",
    colors: [
      "#000000", "#1d2b53", "#7e2553", "#008751",
      "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
      "#ff004d", "#ffa300", "#ffec27", "#00e436",
      "#29adff", "#83769c", "#ff77a8", "#ffccaa",
    ],
  },
};

const BAYER_2 = [
  [0, 2],
  [3, 1],
];

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const MAX_WORK_WIDTH = 1000;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** deterministic white noise in [0,1) so sliders don't reshuffle the grain */
function hashNoise(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** ordered-matrix threshold in [0,1), or 0.5 for hard threshold */
function orderedThreshold(algorithm: Algorithm, x: number, y: number): number {
  if (algorithm === "bayer2") return (BAYER_2[y % 2][x % 2] + 0.5) / 4;
  if (algorithm === "bayer4") return (BAYER_4[y % 4][x % 4] + 0.5) / 16;
  if (algorithm === "bayer8") return (BAYER_8[y % 8][x % 8] + 0.5) / 64;
  if (algorithm === "noise") return hashNoise(x, y);
  return 0.5;
}

const isErrorDiffusion = (a: Algorithm) => a === "floyd" || a === "atkinson";

/** distribute quantisation error to unvisited neighbours */
function diffuseError(
  buf: Float32Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  stride: number,
  channelOffset: number,
  err: number,
  algorithm: Algorithm,
): void {
  const at = (dx: number, dy: number, w: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    buf[(ny * cols + nx) * stride + channelOffset] += err * w;
  };
  if (algorithm === "floyd") {
    at(1, 0, 7 / 16);
    at(-1, 1, 3 / 16);
    at(0, 1, 5 / 16);
    at(1, 1, 1 / 16);
  } else {
    // Atkinson spreads only 3/4 of the error — gives that bright, crunchy look
    at(1, 0, 1 / 8);
    at(2, 0, 1 / 8);
    at(-1, 1, 1 / 8);
    at(0, 1, 1 / 8);
    at(1, 1, 1 / 8);
    at(0, 2, 1 / 8);
  }
}

export default function DitherLab(): React.JSX.Element {
  const { image, fileName, onSelectFile } = useImageSource("/studio/meadow.png");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [params, setParams] = React.useState(DEFAULTS);

  const set = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => setParams((p) => ({ ...p, [key]: value }));

  const shuffle = () => {
    const algorithms = ALGORITHM_OPTIONS.map((o) => o.value as Algorithm);
    const palettes = PALETTE_OPTIONS.map((o) => o.value as PaletteId);
    setParams((p) => ({
      ...p,
      algorithm: algorithms[Math.floor(Math.random() * algorithms.length)],
      palette: palettes[Math.floor(Math.random() * palettes.length)],
      pixelSize: 2 + Math.floor(Math.random() * 8),
      invert: Math.random() < 0.25,
    }));
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const { pixelSize, contrast, bias, algorithm, palette, invert } = params;

    // Resolve the active palette.
    const mode: "mono" | "rgb" =
      palette === "custom" ? "mono" : PRESET_PALETTES[palette].mode;
    const hexColors =
      palette === "custom"
        ? [params.darkColor, params.lightColor]
        : PRESET_PALETTES[palette].colors;
    const rgbColors = hexColors.map(hexToRgb);
    // mono palettes must run dark → light so level N maps to brightness N
    const monoColors =
      mode === "mono"
        ? [...rgbColors].sort(
            (a, b) =>
              0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2] -
              (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]),
          )
        : rgbColors;

    const scale = Math.min(1, MAX_WORK_WIDTH / image.width);
    const workW = Math.max(1, Math.round(image.width * scale));
    const workH = Math.max(1, Math.round(image.height * scale));
    const cols = Math.max(1, Math.floor(workW / pixelSize));
    const rows = Math.max(1, Math.floor(workH / pixelSize));

    // Downsample source to the dither grid.
    const src = document.createElement("canvas");
    src.width = cols;
    src.height = rows;
    const sctx = src.getContext("2d");
    if (!sctx) return;
    sctx.drawImage(image, 0, 0, cols, rows);
    const srcData = sctx.getImageData(0, 0, cols, rows);
    const px = srcData.data;

    const c = contrast / 100;
    const b = bias / 100;
    const adjust = (v: number) => {
      let n = v / 255;
      if (invert) n = 1 - n;
      n = (n - 0.5) * c + 0.5 + b;
      return Math.min(1, Math.max(0, n));
    };

    const out = sctx.createImageData(cols, rows);

    if (mode === "mono") {
      // Luminance → N shades.
      const levels = monoColors.length;
      const lum = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) {
        lum[i] = adjust(
          0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2],
        );
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const level = lum[idx] * (levels - 1);
          let pick: number;
          if (isErrorDiffusion(algorithm)) {
            pick = Math.min(levels - 1, Math.max(0, Math.round(level)));
            diffuseError(
              lum, cols, rows, x, y, 1, 0,
              (level - pick) / (levels - 1),
              algorithm,
            );
          } else {
            const base = Math.floor(level);
            const frac = level - base;
            const t = orderedThreshold(algorithm, x, y);
            pick = Math.min(levels - 1, frac > t ? base + 1 : base);
          }
          const [r, g, bl] = monoColors[pick];
          out.data[idx * 4] = r;
          out.data[idx * 4 + 1] = g;
          out.data[idx * 4 + 2] = bl;
          out.data[idx * 4 + 3] = 255;
        }
      }
    } else {
      // Full-colour quantisation to the palette.
      const buf = new Float32Array(cols * rows * 3);
      for (let i = 0; i < cols * rows; i++) {
        buf[i * 3] = adjust(px[i * 4]);
        buf[i * 3 + 1] = adjust(px[i * 4 + 1]);
        buf[i * 3 + 2] = adjust(px[i * 4 + 2]);
      }
      const SPREAD = 0.35; // ordered-dither perturbation strength
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const o = (y * cols + x) * 3;
          let r = buf[o];
          let g = buf[o + 1];
          let bl = buf[o + 2];
          if (!isErrorDiffusion(algorithm)) {
            const t = orderedThreshold(algorithm, x, y) - 0.5;
            r += t * SPREAD;
            g += t * SPREAD;
            bl += t * SPREAD;
          }
          // nearest palette colour
          let best = 0;
          let bestDist = Infinity;
          for (let k = 0; k < monoColors.length; k++) {
            const dr = r * 255 - monoColors[k][0];
            const dg = g * 255 - monoColors[k][1];
            const db = bl * 255 - monoColors[k][2];
            const dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
              bestDist = dist;
              best = k;
            }
          }
          const [pr, pg, pb] = monoColors[best];
          if (isErrorDiffusion(algorithm)) {
            diffuseError(buf, cols, rows, x, y, 3, 0, r - pr / 255, algorithm);
            diffuseError(buf, cols, rows, x, y, 3, 1, g - pg / 255, algorithm);
            diffuseError(buf, cols, rows, x, y, 3, 2, bl - pb / 255, algorithm);
          }
          const idx = y * cols + x;
          out.data[idx * 4] = pr;
          out.data[idx * 4 + 1] = pg;
          out.data[idx * 4 + 2] = pb;
          out.data[idx * 4 + 3] = 255;
        }
      }
    }

    sctx.putImageData(out, 0, 0);

    // Upscale (nearest-neighbour) onto the visible canvas.
    canvas.width = cols * pixelSize;
    canvas.height = rows * pixelSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
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
          <PanelTitle>Dither</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <SelectControl
              name="Algorithm"
              value={params.algorithm}
              options={ALGORITHM_OPTIONS}
              onValueChange={(v) => set("algorithm", v as Algorithm)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Pixel size"
              min={1}
              max={20}
              step={1}
              unit="px"
              value={params.pixelSize}
              onValueChange={(v) => set("pixelSize", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Contrast"
              min={0}
              max={300}
              step={5}
              unit="%"
              value={params.contrast}
              onValueChange={(v) => set("contrast", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Brightness"
              min={-50}
              max={50}
              step={1}
              value={params.bias}
              onValueChange={(v) => set("bias", v)}
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
            <SelectControl
              name="Palette"
              value={params.palette}
              options={PALETTE_OPTIONS}
              onValueChange={(v) => set("palette", v as PaletteId)}
            />
          </ControlItem>
          {params.palette === "custom" ? (
            <>
              <ControlItem>
                <ColorValueControl
                  label="Ink"
                  color={params.darkColor}
                  onColorChange={(v) => set("darkColor", v)}
                />
              </ControlItem>
              <ControlItem>
                <ColorValueControl
                  label="Light"
                  color={params.lightColor}
                  onColorChange={(v) => set("lightColor", v)}
                />
              </ControlItem>
            </>
          ) : null}
          <ControlItem>
            <Button
              className="w-full"
              size="sm"
              variant="secondary"
              onClick={shuffle}
            >
              Shuffle
            </Button>
          </ControlItem>
          <ControlItem>
            <Button
              className="w-full"
              size="sm"
              onClick={() =>
                downloadCanvasPng(canvasRef.current, `${fileName}-dither`)
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
      title="Dither Lab"
      onReset={() => setParams(DEFAULTS)}
      controls={controls}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    </ToolCanvasShell>
  );
}
