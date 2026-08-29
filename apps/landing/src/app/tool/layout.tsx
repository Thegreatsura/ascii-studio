import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelGrid } from "geist/font/pixel";
import { ThemeProvider } from "@/tool/components/theme-provider";
import { Toaster } from "@/tool/components/ui/sonner";
import AsciiFontStylesheet from "@/components/ascii-font-stylesheet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ascii studio",
  description: "Upload a video and convert it into animated ASCII frames.",
};

// Nested layout for the /tool zone. The root layout owns <html>/<body> and
// global CSS; here we only scope the tool's fonts, theme, and background.
export default function ToolLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelGrid.variable} ${geistSans.className} min-h-screen antialiased bg-[#F2F6FF]`}
    >
      <AsciiFontStylesheet />
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
        {children}
        <Toaster />
      </ThemeProvider>
    </div>
  );
}
