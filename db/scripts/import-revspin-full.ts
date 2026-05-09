/**
 * Importiert revspin-rubbers-full.json in die DB.
 *
 * - Validiert Community-Ratings (nur Werte 1–10 akzeptiert)
 * - Erkennt Belagtyp aus Name + Flags
 * - Setzt playStyle aus Speed/Control-Werten
 * - Upsert — sicher mehrfach ausführbar
 *
 * Usage: npm run db:import-revspin-full
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../index";
import { manufacturers, rubbers } from "../schema";
import { eq } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "db", "data");

// ---------------------------------------------------------------------------
// Validierung
// ---------------------------------------------------------------------------

/** Community-Ratings von Revspin sind auf 1–10 normiert.
 *  Werte >10 sind Parsing-Fehler (Hersteller-Rohdaten eingemischt). */
function validRating(val: number | null): string | null {
  if (val === null || val === undefined) return null;
  if (val < 1 || val > 10) return null; // ungültig
  return val.toFixed(1);
}

function normMfg(raw: number | null, scale: number | null): string | null {
  if (raw === null || scale === null || scale === 0) return null;
  const n = Math.min((raw / scale) * 10, 10);
  return n.toFixed(1);
}

// ---------------------------------------------------------------------------
// Rubber-Typ aus Name + Flags erkennen
// ---------------------------------------------------------------------------

type RubberType = "smooth" | "short_pips" | "long_pips" | "anti";

function detectRubberType(name: string, isAnti: boolean | null, isTensor: boolean | null): RubberType {
  const n = name.toLowerCase();
  if (isAnti) return "anti";
  if (n.includes("anti")) return "anti";
  if (n.includes("long pips") || n.includes("long-pips") || n.includes("long pip")) return "long_pips";
  if (n.includes("short pips") || n.includes("short-pips") || n.includes("short pip")) return "short_pips";
  // Bekannte Long-Pips-Serien
  if (n.includes("curl p") || n.includes("spectol") || n.includes("grass") ||
      n.includes("dornenglanz") || n.includes("grizzly") || n.includes("marder") ||
      n.includes("waran") || n.includes("phantom") || n.includes("killer") ||
      n.includes("desperado") || n.includes("explosion") || n.includes("golem") ||
      n.includes("super block") || n.includes("abs 2") || n.includes("secret flow")) {
    return "long_pips";
  }
  return "smooth";
}

// ---------------------------------------------------------------------------
// PlayStyle aus Community-Ratings ableiten
// ---------------------------------------------------------------------------

type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";

function detectPlayStyle(
  type: RubberType,
  speed: number | null,
  control: number | null
): PlayStyle {
  if (type === "anti" || type === "long_pips") return "material";
  if (type === "short_pips") {
    if (speed !== null && speed >= 8) return "offensive_topspin";
    return "material";
  }
  if (speed === null) return "allround";
  if (speed >= 8.5) return "offensive_topspin";
  if (speed >= 7.0) return "allround";
  if (speed >= 5.5) return "defensive";
  return "defensive";
}

// ---------------------------------------------------------------------------
// TTR-Ranges aus Speed/Control schätzen
// ---------------------------------------------------------------------------

function estimateTTR(speed: number | null, type: RubberType): { ttrMin: number; ttrMax: number; ttrOptimal: number } {
  if (type === "anti" || type === "long_pips") {
    return { ttrMin: 800, ttrMax: 1800, ttrOptimal: 1300 };
  }
  if (speed === null) return { ttrMin: 900, ttrMax: 1600, ttrOptimal: 1300 };
  if (speed >= 9.0) return { ttrMin: 1400, ttrMax: 2200, ttrOptimal: 1800 };
  if (speed >= 8.0) return { ttrMin: 1100, ttrMax: 1900, ttrOptimal: 1500 };
  if (speed >= 6.5) return { ttrMin: 900, ttrMax: 1700, ttrOptimal: 1300 };
  return { ttrMin: 800, ttrMax: 1500, ttrOptimal: 1100 };
}

// ---------------------------------------------------------------------------
// Hersteller-Cache
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

async function getOrCreateManufacturer(cache: Map<string, number>, name: string): Promise<number | null> {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const slug = name.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-");

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

  const existing = await db.select().from(manufacturers).where(eq(manufacturers.slug, slug));
  if (existing[0]) { cache.set(key, existing[0].id); return existing[0].id; }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface RubberFull {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number;
  communitySpeed: number | null;
  communitySpin: number | null;
  communityControl: number | null;
  tackinessScore: number | null;
  spongeHardnessScore: number | null;
  gearsScore: number | null;
  isTensor: boolean | null;
  isAnti: boolean | null;
  mfgDescription: string | null;
  mfgSpeed: number | null;
  mfgSpin: number | null;
  mfgControl: number | null;
  mfgScale: number | null;
}

async function main() {
  console.log("=== Import: revspin-rubbers-full.json → DB ===\n");

  const file = path.join(DATA_DIR, "revspin-rubbers-full.json");
  let data: RubberFull[];
  try {
    data = JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    console.error("revspin-rubbers-full.json nicht gefunden.");
    process.exit(1);
  }

  console.log(`${data.length} Beläge geladen.`);

  const cache = await buildManufacturerCache();

  let inserted = 0, updated = 0, skipped = 0, invalid = 0;

  for (const r of data) {
    if (!r.slug || !r.name) { skipped++; continue; }

    // Validierung: mindestens ein gültiger Community-Rating
    const speedVal = r.communitySpeed !== null && r.communitySpeed >= 1 && r.communitySpeed <= 10 ? r.communitySpeed : null;
    const spinVal  = r.communitySpin  !== null && r.communitySpin  >= 1 && r.communitySpin  <= 10 ? r.communitySpin  : null;
    const ctrlVal  = r.communityControl !== null && r.communityControl >= 1 && r.communityControl <= 10 ? r.communityControl : null;

    if (speedVal === null && spinVal === null && ctrlVal === null) {
      invalid++;
      continue; // Keine verwertbaren Daten
    }

    const manufacturerId = await getOrCreateManufacturer(cache, r.manufacturer);
    if (!manufacturerId) { skipped++; continue; }

    const rubberType = detectRubberType(r.name, r.isAnti, r.isTensor);
    const playStyle = detectPlayStyle(rubberType, speedVal, ctrlVal);
    const { ttrMin, ttrMax, ttrOptimal } = estimateTTR(speedVal, rubberType);

    // Topsheet-Charakter aus Tackiness
    const tackiness = r.tackinessScore;
    const topsheetCharacter = tackiness !== null
      ? (tackiness >= 7 ? "sticky" : tackiness >= 4 ? "grippy" : "neutral")
      : null;

    // Schwammhärte aus spongeHardnessScore (Revspin 1–10 → umkehren für Grad-Schätzung)
    // Revspin "Sponge Hardness" 1=very soft, 10=very hard → Schätzung in Grad
    const hardnessMin = r.spongeHardnessScore !== null && r.spongeHardnessScore >= 1 && r.spongeHardnessScore <= 10
      ? Math.round(30 + (r.spongeHardnessScore / 10) * 25) // ~30–55 Grad
      : null;

    try {
      const result = await db
        .insert(rubbers)
        .values({
          manufacturerId,
          name: r.name,
          slug: r.slug,
          type: rubberType,
          speedRaw: r.mfgSpeed !== null ? String(r.mfgSpeed) : null,
          spinRaw:  r.mfgSpin  !== null ? String(r.mfgSpin)  : null,
          controlRaw: r.mfgControl !== null ? String(r.mfgControl) : null,
          speedRawScale: r.mfgScale,
          speedNorm:   normMfg(r.mfgSpeed,   r.mfgScale),
          spinNorm:    normMfg(r.mfgSpin,    r.mfgScale),
          controlNorm: normMfg(r.mfgControl, r.mfgScale),
          communitySpeed:   validRating(speedVal),
          communitySpin:    validRating(spinVal),
          communityControl: validRating(ctrlVal),
          communityReviewCount: r.reviewCount ?? 0,
          topsheetCharacter: topsheetCharacter as any,
          hardnessMin,
          playStyle,
          ttrMin,
          ttrMax,
          ttrOptimal,
          description: r.mfgDescription ?? null,
          sourceUrl: r.sourceUrl,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: rubbers.slug,
          set: {
            communitySpeed:      validRating(speedVal),
            communitySpin:       validRating(spinVal),
            communityControl:    validRating(ctrlVal),
            communityReviewCount: r.reviewCount ?? 0,
            topsheetCharacter:   topsheetCharacter as any,
            hardnessMin,
          },
        })
        .returning({ id: rubbers.id });

      if (result.length > 0) inserted++;
    } catch (err) {
      console.error(`  ✗ ${r.slug}: ${(err as Error).message.substring(0, 80)}`);
      skipped++;
    }
  }

  console.log("\n══════════════════════════════");
  console.log(`  Geladen:           ${data.length}`);
  console.log(`  Importiert/Updated: ${inserted}`);
  console.log(`  Ungültige Ratings: ${invalid} (gefiltert)`);
  console.log(`  Übersprungen:      ${skipped}`);
  console.log("\n✓ Import abgeschlossen.");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
