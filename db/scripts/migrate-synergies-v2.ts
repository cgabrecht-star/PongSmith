/**
 * Fügt die 4 stil-spezifischen Score-Spalten zur synergies-Tabelle hinzu.
 * Einmalig ausführen — idempotent (IF NOT EXISTS).
 *
 * Usage: npx dotenv -e .env.local -- tsx db/scripts/migrate-synergies-v2.ts
 */
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Migration: synergies v2 — stil-spezifische Scores ===\n");

  await db.execute(sql`
    ALTER TABLE synergies
      ADD COLUMN IF NOT EXISTS score_offensive  SMALLINT,
      ADD COLUMN IF NOT EXISTS score_allround   SMALLINT,
      ADD COLUMN IF NOT EXISTS score_defensive  SMALLINT,
      ADD COLUMN IF NOT EXISTS score_material   SMALLINT
  `);

  console.log("✓ Spalten score_offensive, score_allround, score_defensive, score_material angelegt.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
