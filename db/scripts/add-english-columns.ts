/**
 * Fügt englische Beschreibungs-Spalten hinzu (rubbers + blades).
 * Workaround für drizzle-kit-Bug — direkt per SQL.
 *
 * Usage: npm run db:add-english-columns
 */
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Add English Description Columns ===\n");

  await db.execute(sql`ALTER TABLE rubbers ADD COLUMN IF NOT EXISTS description_en text`);
  console.log("✓ rubbers.description_en");

  await db.execute(sql`ALTER TABLE rubbers ADD COLUMN IF NOT EXISTS community_description_en text`);
  console.log("✓ rubbers.community_description_en");

  await db.execute(sql`ALTER TABLE blades ADD COLUMN IF NOT EXISTS description_en text`);
  console.log("✓ blades.description_en");

  await db.execute(sql`ALTER TABLE blades ADD COLUMN IF NOT EXISTS community_description_en text`);
  console.log("✓ blades.community_description_en");

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
