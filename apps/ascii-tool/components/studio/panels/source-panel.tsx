"use client";

import type { ChangeEvent, DragEvent } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/studio/studio-primitives";
import { formatBytes } from "@/components/studio/studio-helpers";

type SourcePanelProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  isBusy: boolean;
  isImage: boolean;
  isGif: boolean;
  dragActive: boolean;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  openFilePicker: () => void;
  runConversion: () => void;
  acceptedFileTypes: string;
};

export function SourcePanel({
  inputRef,
  selectedFile,
  isBusy,
  isImage,
  isGif,
  dragActive,
  onFileInputChange,
  onDragOver,
  onDragLeave,
  onDrop,
  openFilePicker,
  runConversion,
  acceptedFileTypes,
}: SourcePanelProps) {
  const fileName = selectedFile?.name ?? "";
  const fileSize = selectedFile ? formatBytes(selectedFile.size) : "";

  return (
    <Panel title="Source">
      <input
        ref={inputRef}
        accept={acceptedFileTypes}
        className="hidden"
        onChange={onFileInputChange}
        type="file"
      />

      <button
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md border border-dashed px-3 py-3 text-left transition-colors",
          dragActive
            ? "border-foreground bg-accent"
            : "border-border text-muted-foreground hover:border-foreground/40 hover:bg-accent/30",
        )}
        onClick={openFilePicker}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        type="button"
      >
        <Upload />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-foreground">
            {selectedFile ? fileName : "Drop or browse"}
          </div>
          <div className="text-[10px]">
            {selectedFile ? fileSize : "Video, Image, or GIF"}
          </div>
        </div>
      </button>

      {(!isImage || isGif) && (
        <div className="space-y-1.5">
          <Button
            className="h-7 w-full text-[10px] active:scale-[0.98] transition-transform"
            disabled={!selectedFile || isBusy}
            onClick={runConversion}
            size="sm"
          >
            {isBusy ? (
              <>
                <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                Generating Full Video…
              </>
            ) : (
              "Generate Full ASCII Video"
            )}
          </Button>
        </div>
      )}
    </Panel>
  );
}
