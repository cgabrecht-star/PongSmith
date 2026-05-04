/**
 * Setzt alle imageUrls die noch auf revspin.net zeigen auf NULL.
 * (Revspin blockt Hotlinking → Bilder funktionieren eh nicht öffentlich)
 *
 * Usage: npm run db:clean-revspin-urls
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Revspin-URLs aus imageUrl entfernen ===\n");

  const r = await db.execute(sql`
    UPDATE rubbers SET image_url = NULL WHERE image_url LIKE '%revspin%'
  `);
  console.log(`✓ Beläge bereinigt`);

  const b = await db.execute(sql`
    UPDATE blades SET image_url = NULL WHERE image_url LIKE '%revspin%'
  `);
  console.log(`✓ Hölzer bereinigt`);

  // Statistik
  const rubberStats = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE image_url IS NOT NULL) AS with_image,
      COUNT(*) FILTER (WHERE image_url IS NULL) AS without_image
    FROM rubbers
  `);
  const bladeStats = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE image_url IS NOT NULL) AS with_image,
      COUNT(*) FILTER (WHERE image_url IS NULL) AS without_image
    FROM blades
  `);

  console.log("\nStatus:");
  console.log("  Beläge:", rubberStats[0]);
  console.log("  Hölzer:", bladeStats[0]);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
