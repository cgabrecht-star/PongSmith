/**
 * Korrigiert falsch gematchte Descriptions aus dem Racketinsight-Import.
 *
 * Fehler:
 * - yasaka-rakza-x bekam die Description von yasaka-rakza-xx (verschiedene Produkte)
 * - yasaka-rakza-7 bekam die Description von yasaka-rakza-z (verschiedene Produkte)
 *   → yasaka-rakza-7 hatte aber vorher die korrekte Description (1361 Zeichen)
 *     die wurde durch den zweiten Fuzzy-Match-Update überschrieben
 *
 * Lösung:
 * - yasaka-rakza-x: Description auf NULL zurücksetzen (kein Racketinsight-Review für dieses exakte Produkt)
 * - yasaka-rakza-7: Description auf NULL zurücksetzen, damit wir die korrekte Version neu einspielen können
 *
 * Usage: npm run db:fix-wrong-descriptions
 */

import { db } from "../index";
import { rubbers } from "../schema";
import { eq, isNull } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("=== Fix Wrong Descriptions ===\n");

  // 1. Aktuellen Stand prüfen
  const yasakaRows = await db
    .select({ id: rubbers.id, slug: rubbers.slug, name: rubbers.name, description: rubbers.description })
    .from(rubbers);

  const rakzaX = yasakaRows.find((r) => r.slug === "yasaka-rakza-x");
  const rakza7 = yasakaRows.find((r) => r.slug === "yasaka-rakza-7");

  console.log("Aktuell:");
  console.log(`  yasaka-rakza-x: ${rakzaX?.description ? rakzaX.description.substring(0, 80) + "…" : "NULL"}`);
  console.log(`  yasaka-rakza-7: ${rakza7?.description ? rakza7.description.substring(0, 80) + "…" : "NULL"}`);

  // 2. Falsche Descriptions zurücksetzen
  if (rakzaX?.description) {
    await db.update(rubbers).set({ description: null }).where(eq(rubbers.slug, "yasaka-rakza-x"));
    console.log("\n✓ yasaka-rakza-x: Description auf NULL zurückgesetzt");
  }

  // yasaka-rakza-7: korrekte Description aus JSON neu laden und einspielen
  const dataFile = path.join(process.cwd(), "db", "data", "racketinsight-rubbers.json");
  const raw = await fs.readFile(dataFile, "utf-8");
  const riData: Array<{ slug: string; description: string }> = JSON.parse(raw);

  const rakza7Data = riData.find((r) => r.slug === "yasaka-rakza-7");
  if (rakza7Data && rakza7?.id) {
    await db.update(rubbers)
      .set({ description: rakza7Data.description })
      .where(eq(rubbers.slug, "yasaka-rakza-7"));
    console.log(`✓ yasaka-rakza-7: Korrekte Description wiederhergestellt (${rakza7Data.description.length} Zeichen)`);
  }

  // 3. Überprüfung
  console.log("\nNach Fix:");
  const updatedRows = await db
    .select({ slug: rubbers.slug, description: rubbers.description })
    .from(rubbers);

  const checkX = updatedRows.find((r) => r.slug === "yasaka-rakza-x");
  const check7 = updatedRows.find((r) => r.slug === "yasaka-rakza-7");
  console.log(`  yasaka-rakza-x: ${checkX?.description ? checkX.description.substring(0, 80) + "…" : "NULL"}`);
  console.log(`  yasaka-rakza-7: ${check7?.description ? check7.description.substring(0, 80) + "…" : "NULL"}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
