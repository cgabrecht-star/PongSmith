import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/**
 * /robots.txt, generiert dynamisch.
 * - Suchmaschinen dürfen alles crawlen außer /api/* (interne Endpoints)
 * - Verweist auf die Sitemap
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}
