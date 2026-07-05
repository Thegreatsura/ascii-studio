"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/tool/components/ui/button";

export function ThemeToggle({ customClass }: { customClass?: string }) {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={customClass || "rounded-full w-9 h-9 border border-border bg-background/50 hover:bg-background transition-all shadow-sm"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="w-6 h-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#C5C5C5]" />
      <Moon className="absolute w-6 h-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#C5C5C5]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
