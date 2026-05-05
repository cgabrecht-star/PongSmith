/**
 * Backfill für play_style bei Belägen und Hölzern.
 *
 * Heuristik basierend auf Speed-Wert (community oder norm):
 *   Speed >= 8.5 → offensive_topspin
 *   Speed 6.5-8.5 → allround
 *   Speed < 6.5 → defensive
 *
 * Gilt nur für Beläge mit type='smooth' (Material-Beläge haben bereits "material").
 *
 * Usage: npm run db:backfill-play-styles
 */
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { and, eq, isNull } from "drizzle-orm";

function styleFromSpeed(speed: number | null): "offensive_topspin" | "allround" | "defensive" {
  if (speed === null) return "allround";
  if (speed >= 8.5) return "offensive_topspin";
  if (speed >= 6.5) return "allround";
  return "defensive";
}

async function main() {
  console.log("=== Backfill Play-Styles ===\n");

  // ── Beläge (nur invertierte ohne playStyle) ───────────────────────────
  const targetRubbers = await db
    .select({
      id: rubbers.id, slug: rubbers.slug,
      speedNorm: rubbers.speedNorm, communitySpeed: rubbers.communitySpeed,
    })
    .from(rubbers)
    .where(and(eq(rubbers.type, "smooth"), isNull(rubbers.playStyle)));

  console.log(`${targetRubbers.length} invertierte Beläge ohne playStyle gefunden.`);

  const styleCounts: Record<string, number> = {};
  for (const r of targetRubbers) {
    const speed = r.communitySpeed ? parseFloat(r.communitySpeed) : (r.speedNorm ? parseFloat(r.speedNorm) : null);
    const style = styleFromSpeed(speed);
    styleCounts[style] = (styleCounts[style] ?? 0) + 1;
    await db.update(rubbers).set({ playStyle: style }).where(eq(rubbers.id, r.id));
  }
  console.log(`✓ Beläge gesetzt:`, styleCounts);

  // ── Hölzer ohne playStyle ─────────────────────────────────────────────
  const targetBlades = await db
    .select({
      id: blades.id, slug: blades.slug,
      speedNorm: blades.speedNorm, communitySpeed: blades.communitySpeed,
    })
    .from(blades)
    .where(isNull(blades.playStyle));

  console.log(`\n${targetBlades.length} Hölzer ohne playStyle gefunden.`);

  const bladeStyleCounts: Record<string, number> = {};
  for (const b of targetBlades) {
    const speed = b.communitySpeed ? parseFloat(b.communitySpeed) : (b.speedNorm ? parseFloat(b.speedNorm) : null);
    const style = styleFromSpeed(speed);
    bladeStyleCounts[style] = (bladeStyleCounts[style] ?? 0) + 1;
    await db.update(blades).set({ playStyle: style }).where(eq(blades.id, b.id));
  }
  console.log(`✓ Hölzer gesetzt:`, bladeStyleCounts);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
