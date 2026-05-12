import type { Metadata } from "next";
import Script from "next/script";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";
import { LanguageProvider } from "@/lib/language-context";

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
    default: `${config.siteName}, ${config.siteTagline}`,
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
    title: `${config.siteName}, ${config.siteTagline}`,
    description: config.siteDescription,
    // Bild wird automatisch aus app/opengraph-image.tsx generiert
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.siteName}, ${config.siteTagline}`,
    description: config.siteDescription,
    // Twitter nutzt automatisch das OG-Bild
  },
  alternates: {
    canonical: config.siteUrl,
  },
  category: "sports",
  // Search-Engine Verification, Tokens kommen aus ENV-Vars
  // GOOGLE_SITE_VERIFICATION   (von search.google.com/search-console)
  // BING_SITE_VERIFICATION     (von bing.com/webmasters)
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.BING_SITE_VERIFICATION && {
      other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION },
    }),
  },
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
        {/* Schema.org JSON-LD, Organization + WebSite für Sitelinks/Knowledge-Panel */}
        <Script
          id="schema-org-root"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${config.siteUrl}/#organization`,
                  name: config.siteName,
                  url: config.siteUrl,
                  logo: `${config.siteUrl}/founder-chris.jpg`,
                  description: config.siteDescription,
                  founder: {
                    "@type": "Person",
                    name: "Christoph Gabrecht",
                  },
                  sameAs: [],
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: "hallo@pongsmith.de",
                    contactType: "customer support",
                    availableLanguage: ["German", "English"],
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "DE",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": `${config.siteUrl}/#website`,
                  url: config.siteUrl,
                  name: config.siteName,
                  description: config.siteTagline,
                  publisher: { "@id": `${config.siteUrl}/#organization` },
                  inLanguage: ["de", "en"],
                },
              ],
            }),
          }}
        />

        <LanguageProvider>
          {children}
        </LanguageProvider>

        {/* Plausible Analytics, cookie-frei, DSGVO-konform, in EU gehostet */}
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
