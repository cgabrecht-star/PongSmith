import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/**
 * /sitemap.xml — generiert dynamisch.
 * Statische Routen + alle aktiven Produkt-Detail-URLs (sobald die Routen existieren).
 *
 * Hinweis: Detail-Seiten /belag/[slug] und /holz/[slug] sind noch nicht gebaut
 * (Roadmap C.1). Sobald sie da sind, hier die DB-Slugs einlesen.
 */
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
      url: `${config.siteUrl}/impressum`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${config.siteUrl}/datenschutz`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return staticRoutes;
}
