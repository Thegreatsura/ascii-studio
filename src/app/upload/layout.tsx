import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase Dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function StudioDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
