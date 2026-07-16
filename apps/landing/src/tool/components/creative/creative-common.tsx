"use client";

import * as React from "react";
import StudioNavbar from "@/components/studio-ui/navbar";
import { Panel } from "@/tool/toolcraft/components/panel";

/**
 * Shared chrome for the creative canvas tools: top nav, a large preview area on
 * the left, and a Toolcraft control panel on the right — mirroring the
 * pixel-distortion page so every tool feels like part of one studio.
 */
export function ToolCanvasShell({
  title,
  onReset,
  controls,
  children,
}: {
  title: string;
  onReset?: () => void;
  controls: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
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
        <div className="flex items-center justify-center overflow-hidden rounded-xl border bg-[#0d0d0f]">
          {children}
        </div>
        <div data-toolcraft-theme="light" className="min-h-0 h-full">
          <Panel
            className="h-full max-h-none w-full"
            onResetControls={onReset}
            title={title}
          >
            {controls}
          </Panel>
        </div>
      </div>
    </main>
  );
}

/**
 * Loads a default sample image and swaps in a user-dropped file. Returns the
 * decoded <img> element (ready to draw to a canvas) plus a file handler.
 */
export function useImageSource(defaultSrc: string): {
  image: HTMLImageElement | null;
  fileName: string;
  onSelectFile: (file: File) => void;
} {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = React.useState("sample");

  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = defaultSrc;
  }, [defaultSrc]);

  const onSelectFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
  }, []);

  return { image, fileName, onSelectFile };
}

/** Downloads a canvas as a PNG. */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement | null,
  fileName: string,
): void {
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName || "export"}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/** Draws `image` into `width`×`height` with letterboxing, returns fitted rect. */
export function fitContain(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
  };
}
