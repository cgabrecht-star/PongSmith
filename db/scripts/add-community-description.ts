/**
 * Adds community_description column to rubbers and blades.
 * Workaround für drizzle-kit-Bug mit CHECK-Constraints.
 *
 * Usage: npm run db:add-community-description
 */
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Add community_description Column ===\n");

  await db.execute(sql`
    ALTER TABLE rubbers
    ADD COLUMN IF NOT EXISTS community_description text
  `);
  console.log("✓ rubbers.community_description hinzugefügt");

  await db.execute(sql`
    ALTER TABLE blades
    ADD COLUMN IF NOT EXISTS community_description text
  `);
  console.log("✓ blades.community_description hinzugefügt");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
