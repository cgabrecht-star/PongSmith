/**
 * Räumt Parser-Artefakte aus den Description-Feldern auf:
 *  - Führende Kommata, Bindestriche, Leerzeichen
 *  - Doppelte Leerzeichen
 *  - Trailing Whitespace
 *
 * Usage: npm run db:clean-descriptions
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";

function clean(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/^[\s,;:.\-–—|]+/, "")        // Leading punctuation/whitespace
    .replace(/^["'`]+|["'`]+$/g, "")       // Stray quotes at start/end
    .replace(/\s{2,}/g, " ")               // Double spaces → single
    .replace(/\s+([,.!?;:])/g, "$1")       // Space-before-punctuation → no space
    .trim();
}

async function main() {
  console.log("=== Description-Artefakte säubern ===\n");

  let rubberFixed = 0;
  let bladeFixed = 0;

  const dbRubbers = await db.select({
    id: rubbers.id,
    slug: rubbers.slug,
    description: rubbers.description,
    communityDescription: rubbers.communityDescription,
  }).from(rubbers);

  for (const r of dbRubbers) {
    const newDesc = clean(r.description);
    const newComm = clean(r.communityDescription);
    if (newDesc !== r.description || newComm !== r.communityDescription) {
      await db.update(rubbers).set({
        description: newDesc,
        communityDescription: newComm,
      }).where(eq(rubbers.id, r.id));
      rubberFixed++;
    }
  }

  const dbBlades = await db.select({
    id: blades.id,
    slug: blades.slug,
    description: blades.description,
    communityDescription: blades.communityDescription,
  }).from(blades);

  for (const b of dbBlades) {
    const newDesc = clean(b.description);
    const newComm = clean(b.communityDescription);
    if (newDesc !== b.description || newComm !== b.communityDescription) {
      await db.update(blades).set({
        description: newDesc,
        communityDescription: newComm,
      }).where(eq(blades.id, b.id));
      bladeFixed++;
    }
  }

  console.log(`✓ ${rubberFixed} Beläge bereinigt`);
  console.log(`✓ ${bladeFixed} Hölzer bereinigt`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
