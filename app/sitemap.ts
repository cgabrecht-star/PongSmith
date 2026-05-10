import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { db } from "@/db";
import { blades, rubbers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * /sitemap.xml — generiert dynamisch.
 *
 * Beinhaltet:
 *  - Statische Routen (Start, Sortiment, Mithelfen)
 *  - ALLE aktiven Produkte als /belag/[slug] und /holz/[slug]
 *  - Priorität nach Datenqualität: Produkte mit Reviews > nur mit Specs
 *
 * Impressum/Datenschutz sind noindex → NICHT in Sitemap.
 */

export const revalidate = 86400; // 24 h Cache

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: config.siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${config.siteUrl}/sortiment`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${config.siteUrl}/mithelfen`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Produkt-URLs aus DB — robust gegen DB-Ausfall beim Build
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const [rubberRows, bladeRows] = await Promise.all([
      db.select({
        slug: rubbers.slug,
        reviews: rubbers.communityReviewCount,
        updatedAt: rubbers.updatedAt,
      }).from(rubbers).where(eq(rubbers.isActive, true)),
      db.select({
        slug: blades.slug,
        reviews: blades.communityReviewCount,
        updatedAt: blades.updatedAt,
      }).from(blades).where(eq(blades.isActive, true)),
    ]);

    productRoutes = [
      ...rubberRows.map((r) => ({
        url: `${config.siteUrl}/belag/${r.slug}`,
        lastModified: r.updatedAt ?? now,
        // Mehr Reviews → höhere Priorität (max 0.8 für einzelne Produkte)
        priority: Math.min(0.8, 0.5 + ((r.reviews ?? 0) / 50) * 0.3),
        changeFrequency: "monthly" as const,
      })),
      ...bladeRows.map((b) => ({
        url: `${config.siteUrl}/holz/${b.slug}`,
        lastModified: b.updatedAt ?? now,
        priority: Math.min(0.8, 0.5 + ((b.reviews ?? 0) / 50) * 0.3),
        changeFrequency: "monthly" as const,
      })),
    ];
  } catch (err) {
    console.error("[sitemap] DB-Lookup fehlgeschlagen:", err);
  }

  return [...staticRoutes, ...productRoutes];
}
