/**
 * Behebt die 10 Mismatches aus dem Konsistenz-Check:
 *  - 9 Produkte: communityDescription auf NULL (besser keine Info als falsche)
 *  - 1 Produkt: DB-Typ-Korrektur (dr-neubauer-abs-2 ist Anti, nicht LP)
 *
 * Diese Slugs sollten danach in einem erneuten Recherche-Batch
 * mit präziseren Suchbegriffen neu geholt werden.
 *
 * Usage: npm run db:fix-mismatches
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq, inArray } from "drizzle-orm";

// Aus consistency-report.json — diese Slugs sind verdächtig
const RUBBER_SLUGS_TO_NULL = [
  "dr-neubauer-killer",
  "spinlord-marder",
  "dr-neubauer-abs-2",
  "juic-999-elite",
  "friendship-729-cream",
  "tibhar-grass-dtecs",
  "andro-hexer",
  "joola-express-ultra",
];

const BLADE_SLUGS_TO_NULL = [
  "butterfly-joo-se-hyuk",
  "xiom-hayabusa-z",
];

async function main() {
  console.log("=== Mismatches beheben ===\n");

  // 1. Community-Texte auf NULL bei verdächtigen Beläge
  await db.update(rubbers)
    .set({ communityDescription: null })
    .where(inArray(rubbers.slug, RUBBER_SLUGS_TO_NULL));
  console.log(`✓ ${RUBBER_SLUGS_TO_NULL.length} Beläge: communityDescription auf NULL gesetzt`);

  // 2. Community-Texte auf NULL bei verdächtigen Hölzern
  await db.update(blades)
    .set({ communityDescription: null })
    .where(inArray(blades.slug, BLADE_SLUGS_TO_NULL));
  console.log(`✓ ${BLADE_SLUGS_TO_NULL.length} Hölzer: communityDescription auf NULL gesetzt`);

  // 3. DB-Typ-Korrektur: dr-neubauer-abs-2 ist Anti (nicht LP wie bisher)
  await db.update(rubbers)
    .set({ type: "anti" })
    .where(eq(rubbers.slug, "dr-neubauer-abs-2"));
  console.log(`✓ dr-neubauer-abs-2: Typ auf 'anti' korrigiert (war fälschlich 'long_pips')`);

  console.log("\nFertig. Diese Produkte können in einem präzisen Recherche-Batch nachgeholt werden.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
