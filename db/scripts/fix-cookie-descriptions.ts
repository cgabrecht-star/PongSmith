/**
 * Bereinigt falsche Beschreibungen (Cookie-Banner-Text) aus der DB.
 * Setzt description auf NULL wenn sie Cookie-/Datenschutz-Text enthält.
 *
 * Usage: npm run db:fix-cookie-descriptions
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { sql } from "drizzle-orm";

const BAD_PATTERNS = [
  "cookie",
  "vendors want",
  "personal data is used",
  "your permission",
  "privacy",
  "consent",
  "GDPR",
  "opt-out",
  "data collection",
];

function isBadDescription(desc: string | null): boolean {
  if (!desc) return false;
  const lower = desc.toLowerCase();
  return BAD_PATTERNS.some(p => lower.includes(p.toLowerCase()));
}

async function main() {
  console.log("=== Bereinigung: Cookie-Beschreibungen → NULL ===\n");

  // Beläge
  const rubberRows = await db.execute(sql`
    SELECT id, slug, description FROM rubbers WHERE description IS NOT NULL
  `);
  let rubberFixed = 0;
  for (const r of rubberRows as any[]) {
    if (isBadDescription(r.description)) {
      await db.execute(sql`UPDATE rubbers SET description = NULL WHERE id = ${r.id}`);
      console.log(`  ✓ Belag bereinigt: ${r.slug}`);
      rubberFixed++;
    }
  }

  // Hölzer
  const bladeRows = await db.execute(sql`
    SELECT id, slug, description FROM blades WHERE description IS NOT NULL
  `);
  let bladeFixed = 0;
  for (const b of bladeRows as any[]) {
    if (isBadDescription(b.description)) {
      await db.execute(sql`UPDATE blades SET description = NULL WHERE id = ${b.id}`);
      console.log(`  ✓ Holz bereinigt: ${b.slug}`);
      bladeFixed++;
    }
  }

  console.log(`\n══════════════════════════════`);
  console.log(`  Beläge bereinigt: ${rubberFixed}`);
  console.log(`  Hölzer bereinigt: ${bladeFixed}`);
  console.log(`\n✓ Fertig.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
