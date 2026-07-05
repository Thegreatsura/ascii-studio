"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/studio/studio-primitives";
import type { SizeUnit } from "@/components/studio/studio-types";

type CanvasPanelProps = {
  backgroundWidth: number;
  backgroundWidthUnit: SizeUnit;
  backgroundHeight: number;
  backgroundHeightUnit: SizeUnit;
  backgroundResponsive: boolean;
  setBackgroundWidth: (v: number) => void;
  setBackgroundWidthUnit: (v: SizeUnit) => void;
  setBackgroundHeight: (v: number) => void;
  setBackgroundHeightUnit: (v: SizeUnit) => void;
  setBackgroundResponsive: React.Dispatch<React.SetStateAction<boolean>>;
};

export function CanvasPanel({
  backgroundWidth,
  backgroundWidthUnit,
  backgroundHeight,
  backgroundHeightUnit,
  backgroundResponsive,
  setBackgroundWidth,
  setBackgroundWidthUnit,
  setBackgroundHeight,
  setBackgroundHeightUnit,
  setBackgroundResponsive,
}: CanvasPanelProps) {
  return (
    <Panel title="Background Canvas">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-4 shrink-0">W</span>
          <Input
            className="h-7 text-xs flex-1"
            min={1}
            onChange={(e) => setBackgroundWidth(Number(e.target.value) || 1)}
            type="number"
            value={backgroundWidth}
          />
          <Select onValueChange={(v: SizeUnit) => setBackgroundWidthUnit(v)} value={backgroundWidthUnit}>
            <SelectTrigger className="h-7 text-xs w-[68px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="px">px</SelectItem>
              <SelectItem value="vw">vw</SelectItem>
              <SelectItem value="vh">vh</SelectItem>
              <SelectItem value="%">%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-4 shrink-0">H</span>
          <Input
            className="h-7 text-xs flex-1"
            min={1}
            onChange={(e) => setBackgroundHeight(Number(e.target.value) || 1)}
            type="number"
            value={backgroundHeight}
          />
          <Select onValueChange={(v: SizeUnit) => setBackgroundHeightUnit(v)} value={backgroundHeightUnit}>
            <SelectTrigger className="h-7 text-xs w-[68px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="px">px</SelectItem>
              <SelectItem value="vw">vw</SelectItem>
              <SelectItem value="vh">vh</SelectItem>
              <SelectItem value="%">%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        className="h-7 w-full text-[10px] mt-2"
        onClick={() => setBackgroundResponsive((c) => !c)}
        size="sm"
        variant={backgroundResponsive ? "default" : "outline"}
      >
        {backgroundResponsive
          ? "Responsive Fit Enabled"
          : "Responsive Fit Disabled"}
      </Button>
    </Panel>
  );
}
