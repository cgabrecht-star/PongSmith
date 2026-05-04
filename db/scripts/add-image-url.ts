/**
 * Fügt image_url Spalte zu rubbers und blades hinzu.
 * Usage: dotenv -e .env.local -- tsx db/scripts/add-image-url.ts
 */
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Füge image_url Spalten hinzu...");

  await db.execute(sql`
    ALTER TABLE rubbers ADD COLUMN IF NOT EXISTS image_url varchar(500);
  `);
  console.log("✓ rubbers.image_url");

  await db.execute(sql`
    ALTER TABLE blades ADD COLUMN IF NOT EXISTS image_url varchar(500);
  `);
  console.log("✓ blades.image_url");

  console.log("Fertig.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
