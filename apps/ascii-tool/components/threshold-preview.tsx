"use client";

import { useEffect, useRef, useState } from "react";

interface ThresholdPreviewProps {
  chars: string;
  file: File | null;
  invert: boolean;
  luminanceThreshold: number;
}

export default function ThresholdPreview({
  chars,
  file,
  invert,
  luminanceThreshold,
}: ThresholdPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("/threshold-sample.png");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // When `file` changes, attempt to load it as a video source to grab a frame.
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setVideoSrc(objectUrl);
      // Fallback if video frame extraction fails or to let the user see their own content
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setVideoSrc(null);
      setImageSrc("/threshold-sample.png");
    }
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let activeAsciiChars =
      chars ||
      " .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    if (invert) {
      activeAsciiChars = activeAsciiChars.split("").reverse().join("");
    }

    const processImage = (source: HTMLVideoElement | HTMLImageElement) => {
      // Calculate dimensions to maintain aspect ratio within 200x120 area for preview
      const maxW = 220;
      const maxH = 120;
      const w =
        source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const h =
        source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      if (!w || !h) return;

      const ratio = Math.min(maxW / w, maxH / h);
      const scaledW = Math.floor(w * ratio);
      const scaledH = Math.floor(h * ratio);

      canvas.width = scaledW;
      canvas.height = scaledH;

      // Draw original image briefly to get pixel data
      ctx.drawImage(source, 0, 0, scaledW, scaledH);
      const imageData = ctx.getImageData(0, 0, scaledW, scaledH);
      const data = imageData.data;

      // Clear to background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, scaledW, scaledH);

      // Compute font size to fit grid logic approximately
      const pxSize = 5;
      const columns = Math.floor(scaledW / pxSize);
      const rows = Math.floor(scaledH / pxSize);

      ctx.font = `${pxSize}px monospace`;
      ctx.fillStyle = "#ffffff"; // classic terminal green preview
      ctx.textBaseline = "top";

      const luminanceRange = Math.max(1, 255 - luminanceThreshold);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = c * pxSize;
          const y = r * pxSize;

          // Sample center pixel of the block
          const pIdx =
            ((y + Math.floor(pxSize / 2)) * scaledW +
              (x + Math.floor(pxSize / 2))) *
            4;

          // Simple luminance: 0.299*R + 0.587*G + 0.114*B (grayscale conversion)
          const pixelLum =
            0.299 * data[pIdx] +
            0.587 * data[pIdx + 1] +
            0.114 * data[pIdx + 2];

          if (pixelLum < luminanceThreshold) {
            continue; // Render nothing (space)
          }

          const charIndex = Math.floor(
            ((pixelLum - luminanceThreshold) * (activeAsciiChars.length - 1)) /
              luminanceRange,
          );
          const charToDraw = activeAsciiChars[charIndex] || " ";

          ctx.fillText(charToDraw, x, y);
        }
      }
    };

    if (videoSrc) {
      const video = document.createElement("video");
      video.src = videoSrc;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      // Seek to 1s or midway to get a good frame
      video.currentTime = 1.0;

      const handleLoadedData = () => {
        processImage(video);
      };
      const handleSeeked = () => {
        processImage(video);
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("seeked", handleSeeked);

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("seeked", handleSeeked);
      };
    } else if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        processImage(img);
      };
    }
  }, [chars, invert, luminanceThreshold, imageSrc, videoSrc]);

  return (
    <div className="mt-2 space-y-1 rounded-md border border-input bg-zinc-950 p-2 overflow-hidden shadow-sm flex flex-col w-full min-h-[140px]">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground self-start mb-1">
        Preview
      </span>
      <canvas
        ref={canvasRef}
        className="block w-full h-auto bg-black rounded"
      />
    </div>
  );
}
