"use client";

import type { PopoverContentProps } from "@radix-ui/react-popover";
import {
  type HexColor,
  hexToHsva,
  type HslaColor,
  hslaToHsva,
  type HsvaColor,
  hsvaToHex,
  hsvaToHsla,
  hsvaToHslString,
  hsvaToRgba,
  type RgbaColor,
  rgbaToHsva,
} from "@uiw/color-convert";
import Hue from "@uiw/react-color-hue";
import Saturation from "@uiw/react-color-saturation";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function getColorAsHsva(
  color: `#${string}` | HsvaColor | HslaColor | RgbaColor,
): HsvaColor {
  if (typeof color === "string") {
    return hexToHsva(color);
  } else if ("h" in color && "s" in color && "v" in color) {
    return color;
  } else if ("r" in color) {
    return rgbaToHsva(color);
  } else {
    return hslaToHsva(color);
  }
}

type ColorPickerValue = {
  hex: string;
  hsl: HslaColor;
  rgb: RgbaColor;
};

type ColorPickerProps = {
  value?: `#${string}` | HsvaColor | HslaColor | RgbaColor;
  type?: "hsl" | "rgb" | "hex";
  contrastColor?: `#${string}` | HsvaColor | HslaColor | RgbaColor;
  swatches?: HexColor[];
  hideContrastRatio?: boolean;
  hideDefaultSwatches?: boolean;
  className?: string;
  onValueChange?: (value: ColorPickerValue) => void;
} & PopoverContentProps;

function ColorPicker({
  value,
  children,
  type = "hex",
  contrastColor,
  swatches = [],
  hideContrastRatio,
  hideDefaultSwatches,
  onValueChange,
  className,
  ...props
}: ColorPickerProps) {
  const [colorType, setColorType] = React.useState(type);
  const [colorHsv, setColorHsv] = React.useState<HsvaColor>(
    value ? getColorAsHsva(value) : { h: 0, s: 0, v: 0, a: 1 },
  );
  const [hexInputValue, setHexInputValue] = React.useState(() =>
    hsvaToHex(value ? getColorAsHsva(value) : { h: 0, s: 0, v: 0, a: 1 }),
  );
  const contrastColorHsva = React.useMemo(
    () => (contrastColor ? getColorAsHsva(contrastColor) : undefined),
    [contrastColor],
  );

  React.useEffect(() => {
    if (value) {
      const nextColor = getColorAsHsva(value);
      setColorHsv(nextColor);
      setHexInputValue(hsvaToHex(nextColor));
    }
  }, [value]);

  const handleValueChange = (color: HsvaColor) => {
    onValueChange?.({
      hex: hsvaToHex(color),
      hsl: hsvaToHsla(color),
      rgb: hsvaToRgba(color),
    });

    setColorHsv(color);
    setHexInputValue(hsvaToHex(color));
  };

  return (
    <Popover {...props}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={cn("w-[240px] p-0", className)}
        {...props}
        style={
          {
            "--selected-color": hsvaToHslString(colorHsv),
          } as React.CSSProperties
        }
      >
        <div className="space-y-2 p-3">
          <Saturation
            hsva={colorHsv}
            onChange={(newColor) => {
              handleValueChange(newColor);
            }}
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: "4/2",
              borderRadius: "0.25rem",
            }}
            className="border border-border"
          />
          <Hue
            hue={colorHsv.h}
            onChange={(newHue) => {
              handleValueChange({ ...colorHsv, ...newHue });
            }}
            pointer={({ left, top, prefixCls }) => (
              <div
                className={`${prefixCls}-pointer`}
                style={{
                  position: "absolute",
                  left,
                  top: top ?? "50%",
                }}
              >
                <div
                  className={`${prefixCls}-fill`}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "9999px",
                    backgroundColor: hsvaToHex(colorHsv),
                    boxShadow:
                      "rgb(255 255 255) 0px 0px 0px 1.5px, rgb(0 0 0 / 35%) 0px 1px 3px 0px",
                    transform: "translate(-7px, -50%)",
                  }}
                />
              </div>
            )}
            className="[&>div:first-child]:overflow-hidden [&>div:first-child]:!rounded"
            style={
              {
                width: "100%",
                height: "0.75rem",
                borderRadius: "0.25rem",
                "--alpha-pointer-background-color": hsvaToHex(colorHsv),
                "--alpha-pointer-box-shadow":
                  "rgb(255 255 255) 0px 0px 0px 1.5px, rgb(0 0 0 / 35%) 0px 1px 3px 0px",
              } as React.CSSProperties
            }
          />

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-7 shrink-0 justify-between px-2 text-[10px] uppercase"
                >
                  {colorType}
                  <ChevronDownIcon
                    className="ms-1 opacity-60"
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={colorType === "hex"}
                  onCheckedChange={() => setColorType("hex")}
                >
                  HEX
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={colorType === "hsl"}
                  onCheckedChange={() => setColorType("hsl")}
                >
                  HSL
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={colorType === "rgb"}
                  onCheckedChange={() => setColorType("rgb")}
                >
                  RGB
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex grow">
              {colorType === "hsl" && (
                <ObjectColorInput
                  value={hsvaToHsla(colorHsv)}
                  label="hsl"
                  onValueChange={(value) => {
                    setColorHsv(hslaToHsva(value));
                  }}
                />
              )}
              {colorType === "rgb" && (
                <ObjectColorInput
                  value={hsvaToRgba(colorHsv)}
                  label="rgb"
                  onValueChange={(value) => {
                    setColorHsv(rgbaToHsva(value));
                  }}
                />
              )}
              {colorType === "hex" && (
                <Input
                  className="h-7 flex font-mono text-[10px]"
                  value={hexInputValue}
                  onChange={(e) => {
                    const nextValue = e.target.value
                      .replace(/[^#0-9a-fA-F]/g, "")
                      .slice(0, 7);
                    setHexInputValue(nextValue);

                    if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
                      handleValueChange(hexToHsva(nextValue));
                    }
                  }}
                  onBlur={() => {
                    setHexInputValue(hsvaToHex(colorHsv));
                  }}
                />
              )}
            </div>
          </div>
          {swatches.length > 0 || (!hideDefaultSwatches && <Separator />)}
          {!hideDefaultSwatches && (
            <div className="flex flex-wrap justify-start gap-1.5">
              {[
                "#F8371A",
                "#F97C1B",
                "#FAC81C",
                "#3FD0B6",
                "#2CADF6",
                "#6462FC",
                ...swatches,
              ]
                .sort((a, b) => hexToHsva(a).h - hexToHsva(b).h)
                .map((color) => (
                  <button
                    type="button"
                    key={`${color}-swatch`}
                    style={
                      {
                        "--swatch-color": color,
                      } as React.CSSProperties
                    }
                    onClick={() => handleValueChange(hexToHsva(color))}
                    onKeyUp={(e) =>
                      e.key === "Enter"
                        ? handleValueChange(hexToHsva(color))
                        : null
                    }
                    aria-label={`Set color to ${color}`}
                    className="size-4.5 cursor-pointer rounded-full bg-[var(--swatch-color)] ring-2 ring-[var(--swatch-color)00] ring-offset-1 ring-offset-background transition-all duration-100 hover:ring-[var(--swatch-color)]"
                  />
                ))}
            </div>
          )}
          {!hideContrastRatio && (
            <>
              <Separator />
              <ContrastRatio
                color={colorHsv}
                contrastColor={contrastColorHsva}
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type ContrastRatioProps = {
  color: HsvaColor;
  contrastColor?: HsvaColor;
};

function ContrastRatio({ color, contrastColor }: ContrastRatioProps) {
  const selectedHex = hsvaToHex(color);
  const compareHex = hsvaToHex(contrastColor ?? hexToHsva("#ffffff"));

  const contrastRatio = React.useMemo(() => {
    const toSRGB = (channelValue: number) => {
      const channel = channelValue / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    };

    const getLuminance = (hex: string) => {
      const rgb = hsvaToRgba(hexToHsva(hex));
      const r = toSRGB(rgb.r);
      const g = toSRGB(rgb.g);
      const b = toSRGB(rgb.b);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(selectedHex);
    const l2 = getLuminance(compareHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  }, [compareHex, selectedHex]);

  const ValidationBadge = ({
    ratio,
    ratioLimit,
    className,
    children,
    ...props
  }: {
    ratio: number;
    ratioLimit: number;
  } & Omit<BadgeProps, "variant">) => (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 rounded-full text-muted-foreground",
        ratio >= ratioLimit &&
          "border-transparent bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        className,
      )}
      {...props}
    >
      {ratio >= ratioLimit ? <CheckIcon size={16} /> : <XIcon size={16} />}
      {children}
    </Badge>
  );

  return (
    <div className="flex flex-col gap-2 items-start justify-between">
      <div className="flex items-center gap-4">
        <div
          className="flex size-10 items-center justify-center rounded border"
          style={{ backgroundColor: compareHex }}
        >
          <span className="font-medium" style={{ color: selectedHex }}>
            A
          </span>
        </div>
        <div className="flex flex-col justify-between">
          <span className="whitespace-nowrap text-nowrap text-xs text-muted-foreground">
            Contrast Ratio
          </span>
          <span className="text-sm">{contrastRatio}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <ValidationBadge
          className="text-[10px] px-1 py-0.5 h-5 min-w-6"
          ratio={contrastRatio}
          ratioLimit={4.5}
        >
          AA
        </ValidationBadge>
        <ValidationBadge
          className="text-[10px] px-1 py-0.5 h-5 min-w-6"
          ratio={contrastRatio}
          ratioLimit={7}
        >
          AAA
        </ValidationBadge>
      </div>
    </div>
  );
}

type ObjectColorInputProps =
  | {
      label: "hsl";
      value: HslaColor;
      onValueChange?: (value: HslaColor) => void;
    }
  | {
      label: "rgb";
      value: RgbaColor;
      onValueChange?: (value: RgbaColor) => void;
    };

function ObjectColorInput({
  value,
  label,
  onValueChange,
}: ObjectColorInputProps) {
  function handleChange(val: HslaColor | RgbaColor) {
    if (!onValueChange) {
      return;
    }

    if (label === "hsl") {
      onValueChange({
        ...(value as HslaColor),
        ...(val as Partial<HslaColor>),
      });
      return;
    }

    onValueChange({
      ...(value as RgbaColor),
      ...(val as Partial<RgbaColor>),
    });
  }
  return (
    <div className="-mt-px flex">
      <div className="relative min-w-0 flex-1 focus-within:z-10">
        <Input
          className="peer h-7 rounded-e-none px-2 text-[10px] shadow-none [direction:inherit]"
          value={label === "hsl" ? value.h.toFixed(0) : value.r}
          onChange={(e) =>
            handleChange({
              ...value,
              [label === "hsl" ? "h" : "r"]: e.target.value,
            })
          }
        />
      </div>
      <div className="relative -ms-px min-w-0 flex-1 focus-within:z-10">
        <Input
          className="peer h-7 rounded-none px-2 text-[10px] shadow-none [direction:inherit]"
          value={label === "hsl" ? value.s.toFixed(0) : value.g}
          onChange={(e) =>
            handleChange({
              ...value,
              [label === "hsl" ? "s" : "g"]: e.target.value,
            })
          }
        />
      </div>
      <div className="relative -ms-px min-w-0 flex-1 focus-within:z-10">
        <Input
          className="peer h-7 rounded-s-none px-2 text-[10px] shadow-none [direction:inherit]"
          value={label === "hsl" ? value.l.toFixed(0) : value.b}
          onChange={(e) =>
            handleChange({
              ...value,
              [label === "hsl" ? "l" : "b"]: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}

export { ColorPicker };
export type { ColorPickerProps, ColorPickerValue };
