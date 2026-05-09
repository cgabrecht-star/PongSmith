/**
 * Befüllt hardnessMin/hardnessMax + topsheetCharacter für Beläge.
 *
 * Datenquelle: db/data/revspin-rubbers-full.json (bereits vorhanden)
 * → spongeHardnessScore (Community-Rating 1–10) → Grad-Schätzung
 * → tackinessScore (Community-Rating 1–10) → topsheetCharacter
 *
 * Kein erneutes Scraping nötig — nutzt vorhandene JSON-Daten.
 *
 * Mapping spongeHardnessScore → Schwammhärte in Grad (Näherungswerte):
 *   1–2  → sehr weich   → 28–34°
 *   3–4  → weich        → 34–40°
 *   5–6  → mittel       → 40–46°
 *   7–8  → hart         → 45–52°
 *   9–10 → sehr hart    → 50–58°
 *
 * Mapping tackinessScore → topsheetCharacter:
 *   ≥ 7.5 → sticky  (chinesische klebrige Beläge)
 *   ≥ 4.5 → grippy  (europäische griffige Beläge)
 *   < 4.5 → neutral
 *
 * Usage: npm run db:backfill-hardness
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../index";
import { sql } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "db", "data");
const RUBBER_FILE = "revspin-rubbers-full.json";

// ---------------------------------------------------------------------------
// Mapping-Funktionen
// ---------------------------------------------------------------------------

interface HardnessRange {
  min: number;
  max: number;
}

/**
 * Wandelt Community-Härte-Score (1–10) in geschätzte Grad-Bandbreite um.
 * Basis: Erfahrungswerte aus Revspin-Reviews vs. Hersteller-Angaben.
 */
function scoreToHardness(score: number): HardnessRange {
  if (score >= 9.0) return { min: 52, max: 60 };
  if (score >= 7.5) return { min: 46, max: 54 };
  if (score >= 6.0) return { min: 40, max: 48 };
  if (score >= 4.5) return { min: 35, max: 43 };
  if (score >= 3.0) return { min: 30, max: 38 };
  return { min: 25, max: 35 };
}

/**
 * Wandelt Tackiness-Score in Topsheet-Charakter um.
 */
function scoreToTopsheet(score: number): "sticky" | "grippy" | "neutral" {
  if (score >= 7.5) return "sticky";
  if (score >= 4.5) return "grippy";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

interface RevspinRubber {
  slug: string;
  spongeHardnessScore: number | null;
  tackinessScore: number | null;
}

async function main() {
  console.log("=== Backfill: Härte + Topsheet-Charakter ===\n");

  // JSON laden
  let rubberData: RevspinRubber[];
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, RUBBER_FILE), "utf-8");
    rubberData = JSON.parse(raw) as RevspinRubber[];
  } catch {
    console.error(`${RUBBER_FILE} nicht gefunden. Zuerst npm run scrape:rubbers-full ausführen.`);
    process.exit(1);
  }

  console.log(`JSON-Einträge geladen: ${rubberData.length}`);

  // Nur Einträge mit nutzbaren Werten
  const usable = rubberData.filter(
    (r) => r.spongeHardnessScore !== null || r.tackinessScore !== null
  );
  console.log(`Davon mit Härte- oder Tackiness-Daten: ${usable.length}\n`);

  let hardnessUpdated = 0;
  let topsheetUpdated = 0;
  let notFound = 0;

  for (const r of usable) {
    // Rubber in DB per Slug finden
    const dbRows = (await db.execute(sql`
      SELECT id, hardness_min, hardness_max, topsheet_character
      FROM rubbers
      WHERE slug = ${r.slug}
    `)) as {
      id: number;
      hardness_min: number | null;
      hardness_max: number | null;
      topsheet_character: string | null;
    }[];

    if (dbRows.length === 0) {
      notFound++;
      continue;
    }

    const row = dbRows[0]!;
    const updates: string[] = [];

    // Härte nur setzen wenn noch nicht vorhanden
    if (
      r.spongeHardnessScore !== null &&
      r.spongeHardnessScore >= 1 &&
      r.spongeHardnessScore <= 10 &&
      row.hardness_min === null
    ) {
      const range = scoreToHardness(r.spongeHardnessScore);
      await db.execute(sql`
        UPDATE rubbers
        SET hardness_min = ${range.min}, hardness_max = ${range.max}, updated_at = NOW()
        WHERE id = ${row.id}
      `);
      hardnessUpdated++;
      updates.push(`Härte ${range.min}–${range.max}°`);
    }

    // Topsheet nur setzen wenn noch nicht vorhanden
    if (
      r.tackinessScore !== null &&
      r.tackinessScore >= 1 &&
      r.tackinessScore <= 10 &&
      row.topsheet_character === null
    ) {
      const character = scoreToTopsheet(r.tackinessScore);
      await db.execute(sql`
        UPDATE rubbers
        SET topsheet_character = ${character}, updated_at = NOW()
        WHERE id = ${row.id}
      `);
      topsheetUpdated++;
      updates.push(`Topsheet: ${character}`);
    }

    if (updates.length > 0) {
      // Stiller Erfolg — zu viele Ausgaben würden das Terminal fluten
    }
  }

  console.log("══════════════════════════════════════════");
  console.log(`  Härte befüllt:        ${hardnessUpdated}`);
  console.log(`  Topsheet befüllt:     ${topsheetUpdated}`);
  console.log(`  Slug nicht in DB:     ${notFound}`);

  // Auswertung: Wie ist die Topsheet-Verteilung jetzt?
  const dist = (await db.execute(sql`
    SELECT
      topsheet_character,
      COUNT(*) AS cnt
    FROM rubbers
    WHERE topsheet_character IS NOT NULL
    GROUP BY topsheet_character
    ORDER BY cnt DESC
  `)) as { topsheet_character: string; cnt: number }[];

  console.log("\n── Topsheet-Verteilung (gesamt) ──");
  for (const d of dist) {
    console.log(`  ${d.topsheet_character.padEnd(10)}: ${d.cnt}`);
  }

  // Auswertung: Härte-Abdeckung
  const hardnessCoverage = (await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE hardness_min IS NOT NULL) AS with_hardness,
      COUNT(*) AS total
    FROM rubbers
  `)) as { with_hardness: number; total: number }[];

  const hc = hardnessCoverage[0]!;
  console.log(`\n── Härte-Abdeckung ──`);
  console.log(`  Mit Härte: ${hc.with_hardness} / ${hc.total} Beläge`);

  console.log("\n✓ Fertig.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
