"use client";

import {
  Check,
  Search,
  Link as LinkIcon,
  Link2Off,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/tool/components/ui/button";
import { Input } from "@/tool/components/ui/input";
import { Label } from "@/tool/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/tool/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/tool/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/tool/components/ui/select";
import { ColorPicker } from "@/tool/components/ui/color-picker";
import { Panel, SliderField } from "@/tool/components/studio/studio-primitives";
import {
  ASCII_FONT_PRESETS,
  DEFAULT_ASCII_APPEARANCE,
  type ASCIIAppearance,
} from "@/tool/lib/ascii-appearance";
import { cn } from "@/tool/lib/utils";

type AppearancePanelProps = {
  appearance: ASCIIAppearance;
  setAppearance: React.Dispatch<React.SetStateAction<ASCIIAppearance>>;
  isGapsLinked: boolean;
  setIsGapsLinked: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AppearancePanel({
  appearance,
  setAppearance,
  isGapsLinked,
  setIsGapsLinked,
}: AppearancePanelProps) {
  function updateNumber(
    field: "fontSize" | "lineHeight" | "letterSpacing",
    value: number,
    min: number,
    max: number,
  ) {
    setAppearance((current) => ({
      ...current,
      [field]: Math.min(max, Math.max(min, value)),
    }));
  }

  function updateColor(field: "backgroundColor" | "textColor", value: string) {
    setAppearance((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <Panel title="Appearance">
      {/* Font Family */}
      <div className="space-y-1 ">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Font Family
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between h-7 text-xs font-normal px-3"
            >
              {ASCII_FONT_PRESETS.find((p) => p.value === appearance.fontFamily)
                ?.label ?? "System Mono"}
              <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput
                placeholder="Search fonts..."
                className="h-8 text-xs"
              />
              <CommandList>
                <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground text-center">
                  No font found.
                </CommandEmpty>
                <CommandGroup>
                  {ASCII_FONT_PRESETS.map((font) => (
                    <CommandItem
                      key={font.id}
                      value={font.label}
                      onSelect={() => {
                        setAppearance((a) => ({
                          ...a,
                          fontFamily: font.value,
                        }));
                      }}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          appearance.fontFamily === font.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {font.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Font Size */}
      <SliderField
        label="Font Size"
        max={24}
        min={0.5}
        step={0.1}
        value={appearance.fontSize}
        onValueChange={(v) => updateNumber("fontSize", v, 0.5, 24)}
      />

      {/* Gaps */}
      <div className="space-y-4 pt-1">
        <SliderField
          label="Vertical Gap"
          max={1.6}
          min={0.6}
          step={0.01}
          value={appearance.lineHeight}
          onValueChange={(v) => {
            const delta = v - appearance.lineHeight;
            updateNumber("lineHeight", v, 0.6, 1.6);
            if (isGapsLinked) {
              updateNumber(
                "letterSpacing",
                appearance.letterSpacing + delta,
                -0.5,
                1.0,
              );
            }
          }}
        />

        <SliderField
          label="Horizontal Gap"
          max={1.0}
          min={-0.5}
          step={0.01}
          value={appearance.letterSpacing}
          onValueChange={(v) => {
            const delta = v - appearance.letterSpacing;
            updateNumber("letterSpacing", v, -0.5, 1.0);
            if (isGapsLinked) {
              updateNumber(
                "lineHeight",
                appearance.lineHeight + delta,
                0.6,
                1.6,
              );
            }
          }}
        />

        <div className="flex justify-start">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-6 px-3 w-full text-[9px] font-bold uppercase tracking-tighter transition-all gap-1.5",
              isGapsLinked
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              const newLinked = !isGapsLinked;
              setIsGapsLinked(newLinked);
              if (newLinked) {
                setAppearance((prev) => ({
                  ...prev,
                  letterSpacing: 0,
                  lineHeight: 0.8,
                }));
              }
            }}
          >
            {isGapsLinked ? (
              <>
                <LinkIcon className="h-2.5 w-2.5" />
                Gaps Linked
              </>
            ) : (
              <>
                <Link2Off className="h-2.5 w-2.5" />
                Link Gaps
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Text Effect */}
      <div className="space-y-1 mt-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
            Text
          </label>
          <ColorPicker
            value={
              appearance.textColor.startsWith("#")
                ? (appearance.textColor as `#${string}`)
                : (`#${appearance.textColor}` as `#${string}`)
            }
            contrastColor={
              appearance.backgroundColor.startsWith("#")
                ? (appearance.backgroundColor as `#${string}`)
                : (`#${appearance.backgroundColor}` as `#${string}`)
            }
            onValueChange={({ hex }: { hex: string }) =>
              updateColor("textColor", hex)
            }
          >
            <button
              type="button"
              className="h-7 w-full flex items-center gap-2 rounded-md border border-input bg-background px-2 font-mono text-[10px] font-medium tracking-tight hover:bg-accent/50"
            >
              <span
                className="size-3.5 shrink-0 rounded-sm border border-black/10 shadow-sm"
                style={{
                  backgroundColor:
                    appearance.textColor === "transparent"
                      ? "#000000"
                      : appearance.textColor,
                }}
              />
              <span className="truncate">
                {appearance.textColor.toUpperCase()}
              </span>
            </button>
          </ColorPicker>
        </div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Text Effect
        </Label>
        <Select
          value={appearance.textEffect}
          onValueChange={(v: ASCIIAppearance["textEffect"]) =>
            setAppearance((a) => ({ ...a, textEffect: v }))
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="matrix">Matrix Rain</SelectItem>
            <SelectItem value="glitch">Digital Glitch</SelectItem>
            <SelectItem value="video">Hacker GIF</SelectItem>
            <SelectItem value="gradient">Rainbow Gradient</SelectItem>
            <SelectItem value="neural">Neural Spectrum</SelectItem>
          </SelectContent>
        </Select>

        {appearance.textEffect === "video" && (
          <div className="space-y-1 pt-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              GIF URL
            </Label>
            <Input
              className="h-7 text-[10px] font-mono"
              placeholder="https://..."
              value={appearance.gifUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAppearance((a) => ({ ...a, gifUrl: e.target.value }))
              }
            />
          </div>
        )}
      </div>

      {/* Counter + Reset */}
      <div className="flex gap-2 mt-2">
        <Button
          className="h-7 text-xs w-full gap-1"
          onClick={() => setAppearance(DEFAULT_ASCII_APPEARANCE)}
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
