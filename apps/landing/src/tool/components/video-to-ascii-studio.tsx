"use client";

import {
  useRef,
  useState,
  useTransition,
  useEffect,
  useMemo,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import {
  DEFAULT_ASCII_APPEARANCE,
  type ASCIIAppearance,
} from "@/tool/lib/ascii-appearance";
import {
  buildASCIIAnimationReactComponentSource,
  exportASCIIAnimationAsReactComponent,
  exportASCIIAnimationAsVideo,
  exportASCIIAsImage,
} from "@/tool/lib/ascii-export";
import { cn } from "@/tool/lib/utils";
import {
  generateSingleFrame,
  convertVideoToAsciiFrames,
} from "@/tool/lib/ascii-processor";

/* ── Studio modules ───────────────────────────────────────────────── */
import {
  ACCEPTED_FILE_TYPES,
  MAX_PREVIEW_FPS,
  STUDIO_FPS,
  DEFAULT_CONVERSION,
  type ConversionSettings,
  type ConversionResponse,
  type SizeUnit,
  type ExportingType,
} from "@/tool/components/studio/studio-types";
import { MobileGate } from "@/tool/components/studio/studio-primitives";

/* ── Panels ───────────────────────────────────────────────────────── */
import { SourcePanel } from "@/tool/components/studio/panels/source-panel";
import { CanvasPanel } from "@/tool/components/studio/panels/canvas-panel";
import { ConversionPanel } from "@/tool/components/studio/panels/conversion-panel";
import { AppearancePanel } from "@/tool/components/studio/panels/appearance-panel";
import { ExportPanel } from "@/tool/components/studio/panels/export-panel";
import { StudioPreview } from "@/tool/components/studio/studio-preview";

/* ═══════════════════════════════════════════════════════════════════ */

export default function VideoToAsciiStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversionToastIdRef = useRef<string | number | null>(null);
  const previewToastIdRef = useRef<string | number | null>(null);

  /* ── Mobile gate ──────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  /* ── Core state ───────────────────────────────────────────────── */
  const [appearance, setAppearance] = useState<ASCIIAppearance>(
    DEFAULT_ASCII_APPEARANCE,
  );
  const [conversion, setConversion] =
    useState<ConversionSettings>(DEFAULT_CONVERSION);

  const [dragActive, setDragActive] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportingType>(null);
  const [imageQuality, setImageQuality] = useState(2);
  const [isImageQualityDialogOpen, setIsImageQualityDialogOpen] =
    useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionPhase, setConversionPhase] = useState<
    "idle" | "generating" | "done"
  >("idle");
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportFileName, setExportFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  const [previewFrame, setPreviewFrame] = useState<{
    frame: string;
    rows: number;
    columns: number;
    colorUrl?: string;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewTime, setPreviewTime] = useState(1.0);
  const [previewTimeDraft, setPreviewTimeDraft] = useState(1.0);
  const [isGapsLinked, setIsGapsLinked] = useState(false);
  const [backgroundWidth, setBackgroundWidth] = useState(80);
  const [backgroundWidthUnit, setBackgroundWidthUnit] =
    useState<SizeUnit>("vw");
  const [backgroundHeight, setBackgroundHeight] = useState(100);
  const [backgroundHeightUnit, setBackgroundHeightUnit] =
    useState<SizeUnit>("vh");
  const [backgroundResponsive, setBackgroundResponsive] = useState(true);
  const [backgroundCopyFeedback, setBackgroundCopyFeedback] = useState<
    string | null
  >(null);
  const [previewIsPlaying, setPreviewIsPlaying] = useState(true);
  const [studioTheme, setStudioTheme] = useState<"light" | "dark">("light");

  /* ── Derived values ───────────────────────────────────────────── */
  const estimatedSize = useMemo(() => {
    const cols = result
      ? result.columns
      : (previewFrame?.columns ?? conversion.columns);
    const rows = result ? result.rows : (previewFrame?.rows ?? 0);
    if (!rows) return null;

    const charWidth = appearance.fontSize * (0.6 + appearance.letterSpacing);
    const charHeight = appearance.fontSize * appearance.lineHeight;

    return {
      w: Math.round(cols * charWidth),
      h: Math.round(rows * charHeight),
    };
  }, [
    result,
    previewFrame,
    conversion.columns,
    appearance.fontSize,
    appearance.letterSpacing,
    appearance.lineHeight,
  ]);

  const isBusy = isRunning || isPending;
  const isImage = selectedFile?.type.startsWith("image/") ?? false;
  const isGif = selectedFile?.type === "image/gif";
  const canExport =
    Boolean(result?.frames.length) || (isImage && Boolean(previewFrame?.frame));
  const previewPlaybackFps = Math.min(STUDIO_FPS, MAX_PREVIEW_FPS);

  const backgroundWidthCss = `${Math.max(1, Math.round(backgroundWidth))}${backgroundWidthUnit}`;
  const backgroundHeightCss = `${Math.max(1, Math.round(backgroundHeight))}${backgroundHeightUnit}`;

  const backgroundAppearance = useMemo(
    () => ({
      ...appearance,
      backgroundColor: "transparent",
      borderRadius: 0,
      showFrameCounter: false,
    }),
    [appearance],
  );

  const embeddedBackgroundFrames = useMemo(() => {
    if (result?.frames?.length) return result.frames;
    if (previewFrame?.frame) return [previewFrame.frame];
    return [] as string[];
  }, [result, previewFrame]);

  const previewKey = result
    ? `${result.fileName}-${result.frameCount}-${result.columns}-${result.rows}`
    : previewFrame
      ? `preview-${conversion.columns}-${conversion.luminanceThreshold}-${conversion.chars}-${conversion.invert}`
      : "demo-preview";

  const fullBackgroundSnippet = useMemo(() => {
    return buildASCIIAnimationReactComponentSource({
      appearance: backgroundAppearance,
      componentName: "AsciiWebsiteBackgroundGenerated",
      fps: STUDIO_FPS,
      frames: embeddedBackgroundFrames,
      chars: result?.chars || conversion.chars,
    });
  }, [
    backgroundAppearance,
    conversion.chars,
    embeddedBackgroundFrames,
    result,
  ]);

  /* ── Effects ──────────────────────────────────────────────────── */

  // Video duration detection
  useEffect(() => {
    if (!selectedFile) {
      setVideoDuration(0);
      setPreviewTime(1.0);
      setPreviewTimeDraft(1.0);
      return;
    }
    if (selectedFile.type.startsWith("image/")) {
      setVideoDuration(0);
      setPreviewTime(0);
      setPreviewTimeDraft(0);
      return;
    }
    const v = document.createElement("video");
    v.src = URL.createObjectURL(selectedFile);
    v.onloadedmetadata = () => {
      setVideoDuration(v.duration);
      const defaultTime = Math.min(1.0, v.duration / 2);
      setPreviewTime(defaultTime);
      setPreviewTimeDraft(defaultTime);
      URL.revokeObjectURL(v.src);
    };
  }, [selectedFile]);

  useEffect(() => {
    setPreviewTimeDraft(previewTime);
  }, [previewTime]);

  // Abort any in-flight conversion on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Live preview generation
  useEffect(() => {
    if (!selectedFile) {
      setPreviewFrame(null);
      return;
    }
    let isCancelled = false;
    const updatePreview = async () => {
      setIsPreviewLoading(true);
      try {
        const res = await generateSingleFrame(selectedFile, {
          chars: conversion.chars,
          columns: conversion.columns,
          invert: conversion.invert,
          luminanceThreshold: conversion.luminanceThreshold,
          time: previewTime,
        });
        if (!isCancelled) setPreviewFrame(res);
      } catch (err) {
        console.error("Preview failed:", err);
      } finally {
        if (!isCancelled) setIsPreviewLoading(false);
      }
    };
    const timeout = setTimeout(updatePreview, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [
    selectedFile,
    previewTime,
    conversion.chars,
    conversion.columns,
    conversion.invert,
    conversion.luminanceThreshold,
  ]);

  // Preview loading toast
  useEffect(() => {
    if (isPreviewLoading && !result) {
      if (previewToastIdRef.current === null) {
        previewToastIdRef.current = toast.loading("Updating live preview...", {
          duration: Infinity,
        });
      } else {
        toast.loading("Updating live preview...", {
          id: previewToastIdRef.current,
          duration: Infinity,
        });
      }
      return;
    }
    if (previewToastIdRef.current !== null) {
      toast.dismiss(previewToastIdRef.current);
      previewToastIdRef.current = null;
    }
  }, [isPreviewLoading, result]);

  // Conversion progress toast
  useEffect(() => {
    if (!(isRunning || conversionProgress > 0)) {
      if (conversionToastIdRef.current !== null) {
        toast.dismiss(conversionToastIdRef.current);
        conversionToastIdRef.current = null;
      }
      return;
    }
    const phaseText =
      conversionPhase === "generating"
        ? "Generating ASCII..."
        : conversionPhase === "done"
          ? "Completed"
          : "Conversion progress";
    const message = `${phaseText} ${Math.round(conversionProgress)}%`;

    if (conversionPhase === "done") {
      if (conversionToastIdRef.current !== null) {
        toast.success(message, {
          id: conversionToastIdRef.current,
          duration: 3000,
        });
        conversionToastIdRef.current = null;
      } else {
        toast.success(message, { duration: 3000 });
      }
      return;
    }
    if (conversionToastIdRef.current === null) {
      conversionToastIdRef.current = toast.loading(message, {
        duration: Infinity,
      });
    } else {
      toast.loading(message, {
        id: conversionToastIdRef.current,
        duration: Infinity,
      });
    }
  }, [conversionPhase, conversionProgress, isRunning]);

  // Toast cleanup
  useEffect(() => {
    return () => {
      if (conversionToastIdRef.current !== null)
        toast.dismiss(conversionToastIdRef.current);
      if (previewToastIdRef.current !== null)
        toast.dismiss(previewToastIdRef.current);
    };
  }, []);

  // Paste handler
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            const pastedFile = new File(
              [file],
              `pasted-image-${Date.now()}.png`,
              { type: file.type },
            );
            updateSelectedFile(pastedFile);
            break;
          }
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Auto-switch to live preview on settings change (cancel any in-flight run)
  useEffect(() => {
    abortRef.current?.abort();
    setResult((current) => (current ? null : current));
  }, [conversion]);

  /* ── Handlers ─────────────────────────────────────────────────── */

  function openFilePicker() {
    inputRef.current?.click();
  }

  function updateSelectedFile(file: File | null) {
    if (!file) return;
    abortRef.current?.abort();
    setResult(null);
    setPreviewFrame(null);
    setIsPreviewLoading(false);
    setConversionProgress(0);
    setConversionPhase("idle");
    setSelectedFile(file);
    setExportFileName(file.name.replace(/\.[^.]+$/, ""));
    setExportFeedback(null);
    setBackgroundCopyFeedback(null);
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    updateSelectedFile(event.target.files?.[0] ?? null);
  }

  function onDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragActive(false);
    updateSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function runConversion() {
    if (!selectedFile) {
      toast.error("Choose a video first.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setExportFeedback(null);
    setIsRunning(true);
    setConversionProgress(0);
    setConversionPhase("generating");
    let conversionSucceeded = false;

    try {
      const res = await convertVideoToAsciiFrames(
        selectedFile,
        {
          chars: conversion.chars,
          columns: conversion.columns,
          invert: conversion.invert,
          luminanceThreshold: conversion.luminanceThreshold,
          fps: STUDIO_FPS,
        },
        (ratio) => setConversionProgress(Math.round(ratio * 100)),
        controller.signal,
      );

      startTransition(() => setResult(res));
      conversionSucceeded = true;
      setConversionPhase("done");
      setConversionProgress(100);
    } catch (conversionError) {
      // Aborted runs (settings change, new file, unmount) are silent.
      if (
        conversionError instanceof DOMException &&
        conversionError.name === "AbortError"
      ) {
        return;
      }
      const message =
        conversionError instanceof Error
          ? conversionError.message
          : "Failed to convert the video.";
      toast.error(message);
      setConversionPhase("idle");
      setConversionProgress(0);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsRunning(false);
      }
      if (conversionSucceeded) {
        window.setTimeout(() => {
          setConversionPhase("idle");
          setConversionProgress(0);
        }, 1200);
      }
    }
  }

  /* ── Export handlers ──────────────────────────────────────────── */

  async function onExportVideo() {
    if (!result) {
      setExportFeedback("Convert first.");
      return;
    }
    setExportFeedback(null);
    setExporting("video");
    try {
      await exportASCIIAnimationAsVideo({
        appearance,
        fileName: exportFileName || result.fileName,
        fps: STUDIO_FPS,
        frames: result.frames,
        chars: result.chars,
      });
      setExportFeedback("Video exported.");
    } catch (exportError) {
      setExportFeedback(
        exportError instanceof Error ? exportError.message : "Export failed.",
      );
    } finally {
      setExporting(null);
    }
  }

  function onExportComponent() {
    if (!embeddedBackgroundFrames.length) {
      setExportFeedback("Generate preview or convert first.");
      return;
    }
    setExportFeedback(null);
    setExporting("component");
    try {
      exportASCIIAnimationAsReactComponent({
        appearance: backgroundAppearance,
        fileName: exportFileName || result?.fileName || "ascii-component",
        fps: STUDIO_FPS,
        frames: embeddedBackgroundFrames,
        chars: result?.chars || conversion.chars,
      });
      setExportFeedback("Standalone component exported.");
    } catch (exportError) {
      setExportFeedback(
        exportError instanceof Error ? exportError.message : "Export failed.",
      );
    } finally {
      setExporting(null);
    }
  }

  async function onExportImage() {
    const frame = result?.frames[0] || previewFrame?.frame;
    if (!frame) {
      setExportFeedback("Choose or convert first.");
      return;
    }
    setExportFeedback(null);
    setExporting("image");
    try {
      await exportASCIIAsImage({
        appearance,
        fileName: exportFileName || (selectedFile?.name ?? "ascii-image"),
        frame,
        chars: result?.chars || conversion.chars,
        quality: imageQuality,
      });
      setExportFeedback("Image exported.");
    } catch (exportError) {
      setExportFeedback(
        exportError instanceof Error ? exportError.message : "Export failed.",
      );
    } finally {
      setExporting(null);
    }
  }

  async function copyFullBackgroundSnippet() {
    if (!embeddedBackgroundFrames.length) {
      setBackgroundCopyFeedback("Generate preview or full conversion first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(fullBackgroundSnippet);
      setBackgroundCopyFeedback(null);
      toast.success("Full background component (with frames) copied.");
    } catch {
      setBackgroundCopyFeedback("Clipboard failed. Copy manually.");
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */

  if (isMobile) return <MobileGate />;

  return (
    <section
      className={cn(
        "mx-auto w-full border border-border bg-background p-3 text-foreground shadow-sm transition-colors",
        studioTheme === "dark" && "dark",
      )}
    >
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "240px 1fr", alignItems: "start" }}
      >
        {/* ── Sidebar ─────────────────────────────────── */}
        <div className="space-y-3">
          <a
            href="https://asciistudio.space/"
            className="inline-flex border w-full rounded-md p-2 items-center gap-1.5 text-xs hover:text-muted-foreground  transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </a>

          <SourcePanel
            inputRef={inputRef}
            selectedFile={selectedFile}
            isBusy={isBusy}
            isImage={isImage}
            isGif={isGif ?? false}
            dragActive={dragActive}
            onFileInputChange={onFileInputChange}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            openFilePicker={openFilePicker}
            runConversion={runConversion}
            acceptedFileTypes={ACCEPTED_FILE_TYPES}
          />

          <CanvasPanel
            backgroundWidth={backgroundWidth}
            backgroundWidthUnit={backgroundWidthUnit}
            backgroundHeight={backgroundHeight}
            backgroundHeightUnit={backgroundHeightUnit}
            backgroundResponsive={backgroundResponsive}
            setBackgroundWidth={setBackgroundWidth}
            setBackgroundWidthUnit={setBackgroundWidthUnit}
            setBackgroundHeight={setBackgroundHeight}
            setBackgroundHeightUnit={setBackgroundHeightUnit}
            setBackgroundResponsive={setBackgroundResponsive}
          />

          <ConversionPanel
            conversion={conversion}
            setConversion={setConversion}
          />

          <AppearancePanel
            appearance={appearance}
            setAppearance={setAppearance}
            isGapsLinked={isGapsLinked}
            setIsGapsLinked={setIsGapsLinked}
          />

          <ExportPanel
            exportFileName={exportFileName}
            setExportFileName={setExportFileName}
            canExport={canExport}
            exporting={exporting}
            exportFeedback={exportFeedback}
            backgroundCopyFeedback={backgroundCopyFeedback}
            isImage={isImage}
            hasFrames={embeddedBackgroundFrames.length > 0}
            imageQuality={imageQuality}
            setImageQuality={setImageQuality}
            isImageQualityDialogOpen={isImageQualityDialogOpen}
            setIsImageQualityDialogOpen={setIsImageQualityDialogOpen}
            onCopyCode={copyFullBackgroundSnippet}
            onExportVideo={onExportVideo}
            onExportImage={onExportImage}
            onExportComponent={onExportComponent}
          />
        </div>

        {/* ── Preview ─────────────────────────────────── */}
        <StudioPreview
          result={result}
          previewFrame={previewFrame}
          estimatedSize={estimatedSize}
          backgroundWidthCss={backgroundWidthCss}
          backgroundHeightCss={backgroundHeightCss}
          backgroundResponsive={backgroundResponsive}
          backgroundAppearance={backgroundAppearance}
          conversionChars={conversion.chars}
          previewPlaybackFps={previewPlaybackFps}
          previewKey={previewKey}
          previewIsPlaying={previewIsPlaying}
          setPreviewIsPlaying={setPreviewIsPlaying}
          studioTheme={studioTheme}
          setStudioTheme={setStudioTheme}
          selectedFile={selectedFile}
          isImage={isImage}
          videoDuration={videoDuration}
          previewTimeDraft={previewTimeDraft}
          setPreviewTimeDraft={setPreviewTimeDraft}
          setPreviewTime={setPreviewTime}
          setResult={setResult}
        />
      </div>
    </section>
  );
}
