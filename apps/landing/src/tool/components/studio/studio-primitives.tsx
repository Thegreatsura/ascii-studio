import React from "react";
import { Label } from "@/tool/components/ui/label";
import { Slider } from "@/tool/components/ui/slider";

/* ── Panel ─────────────────────────────────────────────────────────── */

export function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border ">
      <div className="border-b px-3 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-2 p-2.5">{children}</div>
    </div>
  );
}

/* ── Slider Field ──────────────────────────────────────────────────── */

export function SliderField({
  label,
  max,
  min,
  onValueChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  const displayValue = step && step < 1 ? value.toFixed(2) : String(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {displayValue}
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
      />
    </div>
  );
}

/* ── Stat ──────────────────────────────────────────────────────────── */

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[11px] font-medium tabular-nums">{value}</div>
    </div>
  );
}

/* ── Mobile Gate ──────────────────────────────────────────────────── */

export function MobileGate() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#09090b",
        color: "#fafafa",
        padding: "2rem",
        textAlign: "center",
        fontFamily:
          "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
      >
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        ASCII Studio
      </h1>
      <p
        style={{
          fontSize: "0.95rem",
          fontWeight: 400,
          color: "#a1a1aa",
          maxWidth: "280px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        ASCII Studio is available only on desktop. Please switch to a larger
        screen to use the full editor.
      </p>
    </div>
  );
}
