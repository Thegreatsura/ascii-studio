import React from "react";
import type { Metadata } from "next";
import AsciiAnimationsGrid from "@/components/landing/grid";
import AsciiFontStylesheet from "@/components/ascii-font-stylesheet";

const SHOWCASE_TITLE = "Showcase";
const SHOWCASE_DESCRIPTION =
  "Browse a community showcase of ASCII animations built with ascii studio — explore real-time, character-based art and find inspiration for your own.";

export const metadata: Metadata = {
  title: SHOWCASE_TITLE,
  description: SHOWCASE_DESCRIPTION,
  alternates: {
    canonical: "/showcase",
  },
  openGraph: {
    title: `${SHOWCASE_TITLE} — ascii studio`,
    description: SHOWCASE_DESCRIPTION,
    url: "/showcase",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SHOWCASE_TITLE} — ascii studio`,
    description: SHOWCASE_DESCRIPTION,
  },
};

const Page = () => {
  return (
    <div>
      <AsciiFontStylesheet />
      <AsciiAnimationsGrid />
    </div>
  );
};

export default Page;
