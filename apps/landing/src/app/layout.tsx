import type { Metadata } from "next";
import "./globals.css";
import { SearchProvider } from "@/components/landing/search-context";
import { Analytics } from "@vercel/analytics/next";
import { GeistPixelGrid } from "geist/font/pixel";
import { Agentation } from "agentation";

const geistPixelGrid = GeistPixelGrid;

const SITE_URL = "https://asciistudio.space";
const SITE_NAME = "ascii studio";
const SITE_TITLE = "ascii studio — Turn Videos into ASCII Art & Animations";
const SITE_DESCRIPTION =
  "Convert videos and images into real-time ASCII art and animations right in your browser. Customize density, contrast, and character sets, then export your creations.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — ascii studio",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "ascii art",
    "ascii animation",
    "video to ascii",
    "ascii converter",
    "ascii generator",
    "ascii art maker",
    "text art",
    "ascii studio",
  ],
  authors: [{ name: "Vansh Nagar", url: "https://github.com/vansh-nagar" }],
  creator: "Vansh Nagar",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ascii studio — turn videos into ASCII art and animations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web)",
    browserRequirements: "Requires a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Vansh Nagar",
      url: "https://github.com/vansh-nagar",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${geistPixelGrid.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro&family=Anton&family=Audiowide&family=Bebas+Neue&family=Chakra+Petch&family=Cinzel&family=Courier+Prime&family=Cutive+Mono&family=DM+Mono&family=DotGothic16&family=Fira+Code&family=Fira+Mono&family=IBM+Plex+Mono&family=Inconsolata&family=Inter&family=JetBrains+Mono&family=Josefin+Sans&family=Montserrat&family=Orbitron&family=Outfit&family=Overpass+Mono&family=Playfair+Display&family=Poppins&family=Press+Start+2P&family=Roboto+Mono&family=Saira+Stencil+One&family=Share+Tech+Mono&family=Silkscreen&family=Source+Code+Pro&family=Space+Mono&family=Syne&family=Teko&family=Ubuntu+Mono&family=VT323&display=swap"
        />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?font=satoshi@300,400,500,700&font=cabinet-grotesk@400,500,700&display=swap"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SearchProvider>
          {children}
          <Analytics />
          {process.env.NODE_ENV === "development" && <Agentation />}
        </SearchProvider>
      </body>
    </html>
  );
}
