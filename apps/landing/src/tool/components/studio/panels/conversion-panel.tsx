"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/tool/components/ui/button";
import { Input } from "@/tool/components/ui/input";
import { Label } from "@/tool/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/tool/components/ui/select";
import { Panel, SliderField } from "@/tool/components/studio/studio-primitives";
import { ASCII_CHAR_PRESETS } from "@/tool/lib/ascii-appearance";
import {
  DEFAULT_CONVERSION,
  type ConversionSettings,
} from "@/tool/components/studio/studio-types";

type ConversionPanelProps = {
  conversion: ConversionSettings;
  setConversion: React.Dispatch<React.SetStateAction<ConversionSettings>>;
};

export function ConversionPanel({
  conversion,
  setConversion,
}: ConversionPanelProps) {
  return (
    <Panel title="Conversion">
      <SliderField
        label="Columns"
        max={400}
        min={10}
        step={5}
        value={conversion.columns}
        onValueChange={(v) => setConversion((c) => ({ ...c, columns: v }))}
      />
      <SliderField
        label="Threshold"
        max={200}
        min={0}
        step={5}
        value={conversion.luminanceThreshold}
        onValueChange={(v) =>
          setConversion((c) => ({ ...c, luminanceThreshold: v }))
        }
      />

      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Charset
        </Label>
        <Select
          value={
            ASCII_CHAR_PRESETS.find((p) => p.chars === conversion.chars)?.id ??
            "custom"
          }
          onValueChange={(presetId) => {
            const preset = ASCII_CHAR_PRESETS.find((p) => p.id === presetId);
            if (preset) {
              setConversion((c) => ({ ...c, chars: preset.chars }));
            }
          }}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {ASCII_CHAR_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <span className="flex items-center justify-between w-full">
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 font-mono truncate max-w-[120px]">
                    {preset.chars.trim() || " "}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        className="h-7 font-mono text-[10px]"
        placeholder="Custom chars"
        value={conversion.chars}
        onChange={(e) =>
          setConversion((c) => ({ ...c, chars: e.target.value }))
        }
      />

      <div className="flex gap-2">
        <Button
          className="h-7 flex-1 text-[10px] active:scale-[0.98] transition-transform"
          onClick={() => setConversion((c) => ({ ...c, invert: !c.invert }))}
          size="sm"
          variant={conversion.invert ? "default" : "outline"}
        >
          {conversion.invert ? "Inverted" : "Invert"}
        </Button>
        <Button
          className="h-7 text-xs gap-1 "
          onClick={() => setConversion(DEFAULT_CONVERSION)}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </Panel>
  );
}
