/**
 * Importiert revspin-blades-full.json in die DB.
 * Validiert Community-Ratings (nur 1–10), setzt playStyle + TTR-Schätzung.
 *
 * Usage: npm run db:import-revspin-full-blades
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../index";
import { manufacturers, blades } from "../schema";
import { eq } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "db", "data");

function validRating(val: number | null): string | null {
  if (val === null || val === undefined) return null;
  if (val < 1 || val > 10) return null;
  return val.toFixed(1);
}

function normMfg(raw: number | null, scale: number | null): string | null {
  if (raw === null || scale === null || scale === 0) return null;
  return Math.min((raw / scale) * 10, 10).toFixed(1);
}

type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";

function detectPlayStyle(speed: number | null): PlayStyle {
  if (speed === null) return "allround";
  if (speed >= 8.5) return "offensive_topspin";
  if (speed >= 6.5) return "allround";
  return "defensive";
}

function estimateTTR(speed: number | null): { ttrMin: number; ttrMax: number; ttrOptimal: number } {
  if (speed === null) return { ttrMin: 900, ttrMax: 1700, ttrOptimal: 1300 };
  if (speed >= 9.0) return { ttrMin: 1300, ttrMax: 2200, ttrOptimal: 1800 };
  if (speed >= 7.5) return { ttrMin: 1000, ttrMax: 1800, ttrOptimal: 1400 };
  if (speed >= 6.0) return { ttrMin: 800, ttrMax: 1600, ttrOptimal: 1200 };
  return { ttrMin: 700, ttrMax: 1400, ttrOptimal: 1000 };
}

async function buildManufacturerCache(): Promise<Map<string, number>> {
  const rows = await db.select().from(manufacturers);
  const cache = new Map<string, number>();
  for (const row of rows) {
    cache.set(row.name.toLowerCase(), row.id);
    cache.set(row.slug.toLowerCase(), row.id);
  }
  return cache;
}

async function getOrCreateManufacturer(cache: Map<string, number>, name: string): Promise<number | null> {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
  const [inserted] = await db.insert(manufacturers).values({ name, slug }).onConflictDoNothing().returning();
  if (inserted) { cache.set(key, inserted.id); console.log(`  + Neuer Hersteller: ${name}`); return inserted.id; }
  const existing = await db.select().from(manufacturers).where(eq(manufacturers.slug, slug));
  if (existing[0]) { cache.set(key, existing[0].id); return existing[0].id; }
  return null;
}

interface BladeFull {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number;
  communitySpeed: number | null;
  communityControl: number | null;
  mfgDescription: string | null;
  mfgSpeed: number | null;
  mfgControl: number | null;
  mfgScale: number | null;
}

async function main() {
  console.log("=== Import: revspin-blades-full.json → DB ===\n");

  const file = path.join(DATA_DIR, "revspin-blades-full.json");
  let data: BladeFull[];
  try {
    data = JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    console.error("revspin-blades-full.json nicht gefunden.");
    process.exit(1);
  }

  console.log(`${data.length} Hölzer geladen.`);
  const cache = await buildManufacturerCache();

  let inserted = 0, invalid = 0, skipped = 0;

  for (const b of data) {
    if (!b.slug || !b.name) { skipped++; continue; }

    const speedVal = b.communitySpeed !== null && b.communitySpeed >= 1 && b.communitySpeed <= 10 ? b.communitySpeed : null;
    const ctrlVal  = b.communityControl !== null && b.communityControl >= 1 && b.communityControl <= 10 ? b.communityControl : null;

    if (speedVal === null && ctrlVal === null) { invalid++; continue; }

    const manufacturerId = await getOrCreateManufacturer(cache, b.manufacturer);
    if (!manufacturerId) { skipped++; continue; }

    const playStyle = detectPlayStyle(speedVal);
    const { ttrMin, ttrMax, ttrOptimal } = estimateTTR(speedVal);

    try {
      await db.insert(blades).values({
        manufacturerId,
        name: b.name,
        slug: b.slug,
        speedRaw:     b.mfgSpeed   !== null ? String(b.mfgSpeed)   : null,
        controlRaw:   b.mfgControl !== null ? String(b.mfgControl) : null,
        speedRawScale: b.mfgScale,
        speedNorm:    normMfg(b.mfgSpeed,   b.mfgScale),
        controlNorm:  normMfg(b.mfgControl, b.mfgScale),
        communitySpeed:        validRating(speedVal),
        communityControl:      validRating(ctrlVal),
        communityReviewCount:  b.reviewCount ?? 0,
        description:  b.mfgDescription ?? null,
        sourceUrl:    b.sourceUrl,
        playStyle,
        ttrMin,
        ttrMax,
        ttrOptimal,
        isActive: true,
      }).onConflictDoUpdate({
        target: blades.slug,
        set: {
          communitySpeed:       validRating(speedVal),
          communityControl:     validRating(ctrlVal),
          communityReviewCount: b.reviewCount ?? 0,
        },
      });
      inserted++;
    } catch (err) {
      console.error(`  ✗ ${b.slug}: ${(err as Error).message.substring(0, 80)}`);
      skipped++;
    }
  }

  console.log("\n══════════════════════════════");
  console.log(`  Geladen:            ${data.length}`);
  console.log(`  Importiert/Updated: ${inserted}`);
  console.log(`  Ungültige Ratings:  ${invalid} (gefiltert)`);
  console.log(`  Übersprungen:       ${skipped}`);
  console.log("\n✓ Import abgeschlossen.");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
