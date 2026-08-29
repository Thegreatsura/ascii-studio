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
    default: SITE_NAME,
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
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        {/* Satoshi is the body face, so it is the only render-blocking font the
         * landing page can justify. The ~33 families the ASCII renderer offers
         * now load only on the routes that run it (see AsciiFontStylesheet). */}
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
