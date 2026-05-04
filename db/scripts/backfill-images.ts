/**
 * Befüllt imageUrl für alle Beläge und Hölzer die noch kein Bild haben.
 *
 * Strategie:
 * - Produkte mit revspin-sourceUrl → revspin.net/images/{type}/{slug}.jpg
 * - Produkte ohne sourceUrl (manuell eingefügt) → null bleibt, Sortiment zeigt Placeholder
 *
 * Usage: npm run db:backfill-images
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { isNull, like } from "drizzle-orm";

const REVSPIN_BASE = "https://revspin.net";

async function main() {
  console.log("=== Backfill Images ===\n");

  // ── Beläge ────────────────────────────────────────────────────────────────
  const allRubbers = await db.select({ id: rubbers.id, slug: rubbers.slug, sourceUrl: rubbers.sourceUrl, imageUrl: rubbers.imageUrl }).from(rubbers);
  const rubbersWithoutImage = allRubbers.filter(r => !r.imageUrl);

  console.log(`${rubbersWithoutImage.length} Beläge ohne Bild von ${allRubbers.length} gesamt`);

  let rubberUpdated = 0;
  for (const r of rubbersWithoutImage) {
    // Nur für revspin-Produkte (slug-basierte URL)
    const isRevspin = r.sourceUrl?.includes("revspin.net");
    if (!isRevspin && !r.slug) continue;

    const imageUrl = isRevspin
      ? `${REVSPIN_BASE}/images/rubber/${r.slug}.jpg`
      : null;

    if (!imageUrl) continue;

    await db.update(rubbers)
      .set({ imageUrl })
      .where(isNull(rubbers.imageUrl));

    rubberUpdated++;
  }

  // Effizienter: alle auf einmal mit CASE-ähnlicher Logik — einfach alle revspin-Beläge updaten
  const revspinRubbers = allRubbers.filter(r => r.sourceUrl?.includes("revspin.net") && !r.imageUrl);
  for (const r of revspinRubbers) {
    await db.update(rubbers)
      .set({ imageUrl: `${REVSPIN_BASE}/images/rubber/${r.slug}.jpg` })
      .where(isNull(rubbers.imageUrl));
  }

  // Einmal sauber: direkt alle revspin-Beläge per slug updaten
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`
    UPDATE rubbers
    SET image_url = CONCAT('https://revspin.net/images/rubber/', slug, '.jpg')
    WHERE image_url IS NULL
    AND source_url LIKE '%revspin.net%'
  `);
  console.log("✓ Beläge imageUrl gesetzt (revspin URL-Muster)");

  // ── Hölzer ────────────────────────────────────────────────────────────────
  await db.execute(sql`
    UPDATE blades
    SET image_url = CONCAT('https://revspin.net/images/blade/', slug, '.jpg')
    WHERE image_url IS NULL
    AND source_url LIKE '%revspin.net%'
  `);
  console.log("✓ Hölzer imageUrl gesetzt (revspin URL-Muster)");

  // Status
  const rubbersWithImage = await db.execute(sql`SELECT COUNT(*) FROM rubbers WHERE image_url IS NOT NULL`);
  const bladesWithImage = await db.execute(sql`SELECT COUNT(*) FROM blades WHERE image_url IS NOT NULL`);

  console.log(`\nErgebnis:`);
  console.log(`  Beläge mit Bild: ${(rubbersWithImage[0] as Record<string, unknown>)["count"]}`);
  console.log(`  Hölzer mit Bild: ${(bladesWithImage[0] as Record<string, unknown>)["count"]}`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
