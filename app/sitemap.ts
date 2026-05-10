import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/**
 * /sitemap.xml — generiert dynamisch.
 *
 * Aktuell:
 *  - Statische Routen (Startseite, Sortiment)
 *  - Impressum/Datenschutz sind noindex → NICHT in Sitemap
 *
 * Später (wenn Detail-Routen /belag/[slug] und /holz/[slug] existieren):
 *  - Alle aktiven Produkt-Slugs aus der DB einlesen und ergänzen
 */

// Sitemap-Generierung läuft beim Build — DB-Verbindung kann scheitern in der
// Build-Phase. Daher schützen wir dynamische Daten mit try/catch.
export const revalidate = 86400; // 24 h Cache für Sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: config.siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${config.siteUrl}/sortiment`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${config.siteUrl}/mithelfen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  return staticRoutes;
}
