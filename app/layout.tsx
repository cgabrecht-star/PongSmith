import type { Metadata } from "next";
import Script from "next/script";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

// ── Metadata ────────────────────────────────────────────────────────────────
// Vollständige SEO/Social-Tags. metadataBase ist Pflicht für openGraph + canonical.

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${config.siteName} — ${config.siteTagline}`,
    template: `%s · ${config.siteName}`,
  },
  description: config.siteDescription,
  applicationName: config.siteName,
  authors: [{ name: "Christoph Gabrecht" }],
  keywords: [
    "Tischtennis Beratung",
    "Tischtennis Schläger",
    "Belag Empfehlung",
    "Holz Empfehlung",
    "TTR Schläger",
    "Vereinsspieler Ausrüstung",
    "TT Setup",
    "Spielstil Beratung",
    "Tischtennis KI",
  ],
  creator: "PongSmith",
  publisher: "PongSmith",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: config.siteUrl,
    siteName: config.siteName,
    title: `${config.siteName} — ${config.siteTagline}`,
    description: config.siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.siteName} — ${config.siteTagline}`,
    description: config.siteDescription,
  },
  alternates: {
    canonical: config.siteUrl,
  },
  category: "sports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${bebasNeue.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          backgroundColor: "#0e0e0e",
          color: "#fafaf7",
          minHeight: "100vh",
        }}
      >
        {children}

        {/* Plausible Analytics — cookie-frei, DSGVO-konform, in EU gehostet */}
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            data-domain={config.plausibleDomain}
            src={config.plausibleScript}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
