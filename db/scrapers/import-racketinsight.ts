/**
 * Importiert racketinsight-rubbers.json in die DB.
 *
 * Strategie:
 *  - Matched per Slug-Normalisierung (z.B. "nittaku-fastarc-g1" → "nittaku-fastarc-g-1")
 *  - Alternativ per Name-Matching (case-insensitive, Leerzeichen/Bindestriche ignoriert)
 *  - Aktualisiert nur die `description` wenn sie bisher NULL ist
 *  - Schreibt einen Match-Report in die Konsole
 *
 * Usage:
 *   npm run import:racketinsight
 */

import { db } from "../index";
import { rubbers } from "../schema";
import { isNull, eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import type { RacketinsightRubber } from "./racketinsight";

const DATA_FILE = path.join(process.cwd(), "db", "data", "racketinsight-rubbers.json");

// ---------------------------------------------------------------------------
// Slug-Normalisierung: mehrere Bindestriche → einzeln, keine Doppelbuchstaben etc.
// ---------------------------------------------------------------------------

function normalizeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ähnlichkeit zweier Strings 0..1 (normalisierte Levenshtein-Distanz)
 */
function similarity(a: string, b: string): number {
  const na = normalizeSlug(a);
  const nb = normalizeSlug(b);
  if (na === nb) return 1;

  const len = Math.max(na.length, nb.length);
  if (len === 0) return 1;

  // Einfache Zeichenübereinstimmung als schnelle Heuristik
  const shorter = na.length < nb.length ? na : nb;
  const longer  = na.length < nb.length ? nb : na;
  let matches = 0;
  let pos = 0;
  for (const ch of shorter) {
    const idx = longer.indexOf(ch, pos);
    if (idx !== -1) { matches++; pos = idx + 1; }
  }
  return matches / len;
}

async function main() {
  console.log("=== Import Racketinsight → DB ===\n");

  // JSON laden
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const riRubbers: RacketinsightRubber[] = JSON.parse(raw);
  console.log(`${riRubbers.length} Racketinsight-Einträge geladen.\n`);

  // DB: alle Beläge laden
  const dbRubbers = await db
    .select({ id: rubbers.id, slug: rubbers.slug, name: rubbers.name, description: rubbers.description })
    .from(rubbers);

  console.log(`${dbRubbers.length} Beläge in der DB.\n`);

  let matched = 0;
  let updated = 0;
  let skipped = 0;
  let unmatched: string[] = [];

  for (const ri of riRubbers) {
    if (!ri.description || ri.description.trim().length < 50) {
      console.log(`  ⚠ ${ri.slug} — kein beschreibungstext, übersprungen`);
      skipped++;
      continue;
    }

    // 1. Exakter Slug-Match
    let dbEntry = dbRubbers.find((r) => normalizeSlug(r.slug) === normalizeSlug(ri.slug));

    // 2. Name-Match (case-insensitive)
    if (!dbEntry) {
      dbEntry = dbRubbers.find(
        (r) => r.name.toLowerCase().replace(/\s+/g, " ").trim() ===
               ri.name.toLowerCase().replace(/\s+/g, " ").trim()
      );
    }

    // 3. Fuzzy-Match: Slug-Ähnlichkeit ≥ 0.92 + Name-Präfix muss übereinstimmen
    // (Schwelle hoch genug um z.B. rakza-7 ≠ rakza-z zu vermeiden)
    if (!dbEntry) {
      const riPrefix = ri.slug.split("-").slice(0, 3).join("-"); // z.B. "yasaka-rakza-7"
      const best = dbRubbers
        .map((r) => ({ r, sim: similarity(r.slug, ri.slug) }))
        .filter((x) => {
          // Zusatz-Check: die ersten 3 Tokens müssen identisch sein
          const dbPrefix = x.r.slug.split("-").slice(0, 3).join("-");
          return dbPrefix === riPrefix;
        })
        .sort((a, b) => b.sim - a.sim)[0];

      if (best && best.sim >= 0.92) {
        dbEntry = best.r;
        console.log(`  ~ Fuzzy-Match (${(best.sim * 100).toFixed(0)}%): ${ri.slug} → ${best.r.slug}`);
      }
    }

    if (!dbEntry) {
      console.log(`  ✗ Kein Match für: ${ri.slug} ("${ri.name}")`);
      unmatched.push(ri.slug);
      continue;
    }

    matched++;

    // Nur updaten wenn description NULL
    if (dbEntry.description) {
      console.log(`  ○ ${dbEntry.slug} — hat bereits Beschreibung, übersprungen`);
      skipped++;
      continue;
    }

    await db
      .update(rubbers)
      .set({ description: ri.description })
      .where(eq(rubbers.id, dbEntry.id));

    console.log(
      `  ✓ ${dbEntry.slug} — Beschreibung eingetragen (${ri.description.length} Zeichen)`
    );
    updated++;
  }

  console.log("\n══════════════════════════════");
  console.log(`  Gescannt:   ${riRubbers.length}`);
  console.log(`  Gematched:  ${matched}`);
  console.log(`  Aktualisiert: ${updated}`);
  console.log(`  Übersprungen: ${skipped}`);
  console.log(`  Kein Match:   ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("\nOhne DB-Match:");
    unmatched.forEach((s) => console.log(`  - ${s}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
