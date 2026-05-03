/**
 * Importiert revspin-rubbers.json + revspin-blades.json in Supabase.
 * Führt einen Upsert durch — sicher mehrfach ausführbar.
 *
 * Usage: npm run scrape:import
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../index";
import { manufacturers, rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";
import type { RevspinRubber, RevspinBlade } from "./revspin";

const DATA_DIR = path.join(process.cwd(), "db", "data");

// ---------------------------------------------------------------------------
// Normalisierung: revspin-Score (1–10) → unsere Skala (1.0–10.0)
// revspin ist bereits 1–10, keine Umrechnung nötig — direkt übernehmen.
// ---------------------------------------------------------------------------

function norm(val: number | null): string | null {
  if (val === null) return null;
  return val.toFixed(1);
}

// ---------------------------------------------------------------------------
// Hersteller-Cache: Name → DB-ID
// ---------------------------------------------------------------------------

async function buildManufacturerCache(): Promise<Map<string, number>> {
  const rows = await db.select().from(manufacturers);
  const cache = new Map<string, number>();
  for (const row of rows) {
    cache.set(row.name.toLowerCase(), row.id);
    cache.set(row.slug.toLowerCase(), row.id);
  }
  return cache;
}

async function getOrCreateManufacturer(
  cache: Map<string, number>,
  name: string
): Promise<number | null> {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  // Neu anlegen
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [inserted] = await db
    .insert(manufacturers)
    .values({ name, slug })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    cache.set(key, inserted.id);
    console.log(`  + Neuer Hersteller: ${name}`);
    return inserted.id;
  }

  // Fallback: nochmal nachlesen
  const existing = await db.select().from(manufacturers).where(eq(manufacturers.slug, slug));
  if (existing[0]) {
    cache.set(key, existing[0].id);
    return existing[0].id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Beläge importieren
// ---------------------------------------------------------------------------

async function importRubbers(cache: Map<string, number>) {
  const file = path.join(DATA_DIR, "revspin-rubbers.json");
  let data: RevspinRubber[];

  try {
    data = JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    console.log("revspin-rubbers.json nicht gefunden — übersprungen.");
    return;
  }

  console.log(`\nImportiere ${data.length} Beläge...`);
  let inserted = 0;
  let skipped = 0;

  for (const r of data) {
    if (!r.slug || !r.name) { skipped++; continue; }

    const manufacturerId = await getOrCreateManufacturer(cache, r.manufacturer);
    if (!manufacturerId) { skipped++; continue; }

    await db
      .insert(rubbers)
      .values({
        manufacturerId,
        name: r.name,
        slug: r.slug,
        communitySpeed: norm(r.communitySpeed),
        communitySpin: norm(r.communitySpin),
        communityControl: norm(r.communityControl),
        communityReviewCount: r.reviewCount ?? 0,
        sourceUrl: r.sourceUrl,
      })
      .onConflictDoNothing(); // slug ist UNIQUE — kein doppelter Import

    inserted++;
  }

  console.log(`✓ Beläge: ${inserted} importiert, ${skipped} übersprungen.`);
}

// ---------------------------------------------------------------------------
// Hölzer importieren
// ---------------------------------------------------------------------------

async function importBlades(cache: Map<string, number>) {
  const file = path.join(DATA_DIR, "revspin-blades.json");
  let data: RevspinBlade[];

  try {
    data = JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    console.log("revspin-blades.json nicht gefunden — übersprungen.");
    return;
  }

  console.log(`\nImportiere ${data.length} Hölzer...`);
  let inserted = 0;
  let skipped = 0;

  for (const b of data) {
    if (!b.slug || !b.name) { skipped++; continue; }

    const manufacturerId = await getOrCreateManufacturer(cache, b.manufacturer);
    if (!manufacturerId) { skipped++; continue; }

    await db
      .insert(blades)
      .values({
        manufacturerId,
        name: b.name,
        slug: b.slug,
        communitySpeed: norm(b.communitySpeed),
        communityControl: norm(b.communityControl),
        communityReviewCount: b.reviewCount ?? 0,
        sourceUrl: b.sourceUrl,
      })
      .onConflictDoNothing();

    inserted++;
  }

  console.log(`✓ Hölzer: ${inserted} importiert, ${skipped} übersprungen.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Revspin Import ===");
  const cache = await buildManufacturerCache();
  await importRubbers(cache);
  await importBlades(cache);
  console.log("\n✓ Import abgeschlossen.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Import fehlgeschlagen:", err);
  process.exit(1);
});
