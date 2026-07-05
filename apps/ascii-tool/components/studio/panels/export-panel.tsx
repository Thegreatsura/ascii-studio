"use client";

import { useState } from "react";
import {
  FileCode2,
  FileVideo,
  LoaderCircle,
  Copy,
  Image as ImageIcon,
  Download,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Panel } from "@/components/studio/studio-primitives";
import type { ExportingType } from "@/components/studio/studio-types";
import { cn } from "@/lib/utils";

type ExportType = "video" | "image" | "component";

type ExportPanelProps = {
  exportFileName: string;
  setExportFileName: (v: string) => void;
  canExport: boolean;
  exporting: ExportingType;
  exportFeedback: string | null;
  backgroundCopyFeedback: string | null;
  isImage: boolean;
  hasFrames: boolean;
  imageQuality: number;
  setImageQuality: (v: number) => void;
  isImageQualityDialogOpen: boolean;
  setIsImageQualityDialogOpen: (v: boolean) => void;
  onCopyCode: () => void;
  onExportVideo: () => void;
  onExportImage: () => Promise<void>;
  onExportComponent: () => void;
};

const exportTypes: {
  id: ExportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "video",
    label: "Video",
    description: "Export as MP4 animation",
    icon: <FileVideo className="h-4 w-4" />,
  },
  {
    id: "image",
    label: "Image",
    description: "Export as PNG file",
    icon: <ImageIcon className="h-4 w-4" />,
  },
  {
    id: "component",
    label: "Component",
    description: "Export as React component",
    icon: <FileCode2 className="h-4 w-4" />,
  },
];

export function ExportPanel({
  exportFileName,
  setExportFileName,
  exporting,
  isImage,
  hasFrames,
  imageQuality,
  setImageQuality,
  onCopyCode,
  onExportVideo,
  onExportImage,
  onExportComponent,
}: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExportType | null>(null);

  const visibleTypes = exportTypes.filter(
    (t) => !(t.id === "video" && isImage),
  );

  async function handleExport() {
    if (!selected) return;
    setOpen(false);
    setSelected(null);
    if (selected === "video") onExportVideo();
    else if (selected === "image") await onExportImage();
    else if (selected === "component") onExportComponent();
  }

  function handleCopy() {
    setOpen(false);
    setSelected(null);
    onCopyCode();
  }

  return (
    <Panel title="Export">
      <Button
        className="w-full h-8 text-xs gap-1.5"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-sm font-semibold">Export</DialogTitle>
          </DialogHeader>

          <div className="px-4 py-3 space-y-3">
            {/* File name */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                File name
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="Enter file name..."
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
              />
            </div>

            {/* Export type */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                How do you want to export?
              </Label>
              <div className="space-y-1">
                {visibleTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors",
                      selected === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        selected === t.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {t.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium leading-none mb-0.5">
                        {t.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground leading-none">
                        {t.description}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-opacity",
                        selected === t.id
                          ? "opacity-100 text-primary"
                          : "opacity-0",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Image quality — only when image selected */}
            {selected === "image" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Quality
                  </Label>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {imageQuality}x
                  </span>
                </div>
                <Slider
                  max={5}
                  min={1}
                  step={0.5}
                  value={[imageQuality]}
                  onValueChange={([v]) => setImageQuality(v)}
                />
              </div>
            )}
          </div>

          {/* Export footer */}
          <div className="px-4 py-3 border-t flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setOpen(false);
                setSelected(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={!selected || exporting !== null}
              onClick={handleExport}
            >
              {exporting !== null ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export
            </Button>
          </div>

          {/* Copy Code — separated at bottom */}
          <div className="px-4 pb-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              disabled={!hasFrames}
              onClick={handleCopy}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
