/**
 * Berechnet alle Holz × Belag Synergien und schreibt sie in Supabase.
 * v2: Nutzt Synergie-Engine v2 mit stil-spezifischen Scores + Härte-Match.
 *
 * Idempotent — bei erneutem Ausführen werden bestehende Scores überschrieben.
 *
 * Usage: npm run compute:synergies
 */

import { db } from "../index";
import { blades, rubbers, synergies } from "../schema";
import { computeSynergy } from "../../lib/synergy";
import { sql } from "drizzle-orm";

// Größere Batches = weniger DB-Round-trips
const BATCH_SIZE = 500;

// Nur Produkte mit mindestens einem echten Community-Rating (kein reiner Fallback)
const MIN_REVIEW_COUNT = 3;

async function main() {
  console.log("=== Synergie-Berechnung v2 (Vollkatalog + Stil-Scores) ===");
  console.log(`  Qualitätsfilter: >= ${MIN_REVIEW_COUNT} Community-Reviews\n`);

  const allBlades = await db.select().from(blades).where(
    sql`community_review_count >= ${MIN_REVIEW_COUNT} AND (community_speed IS NOT NULL OR speed_norm IS NOT NULL)`
  );
  const allRubbers = await db.select().from(rubbers).where(
    sql`community_review_count >= ${MIN_REVIEW_COUNT} AND (community_speed IS NOT NULL OR speed_norm IS NOT NULL)`
  );

  const total = allBlades.length * allRubbers.length;
  console.log(
    `${allBlades.length} Hölzer × ${allRubbers.length} Beläge = ${total} Kombinationen\n`,
  );

  // Bestehende Synergien löschen — frische Berechnung
  await db.delete(synergies);
  console.log("Alte Synergien gelöscht. Berechne neu...\n");

  let count = 0;
  let batch: (typeof synergies.$inferInsert)[] = [];

  for (const blade of allBlades) {
    for (const rubber of allRubbers) {
      const result = computeSynergy(
        {
          id: blade.id,
          speedNorm: blade.speedNorm ? parseFloat(blade.speedNorm) : null,
          controlNorm: blade.controlNorm ? parseFloat(blade.controlNorm) : null,
          communitySpeed: blade.communitySpeed ? parseFloat(blade.communitySpeed) : null,
          communityControl: blade.communityControl ? parseFloat(blade.communityControl) : null,
          stiffness: blade.stiffness as "soft" | "medium" | "stiff" | "very_stiff" | null ?? null,
        },
        {
          id: rubber.id,
          type: rubber.type,
          speedNorm: rubber.speedNorm ? parseFloat(rubber.speedNorm) : null,
          spinNorm: rubber.spinNorm ? parseFloat(rubber.spinNorm) : null,
          controlNorm: rubber.controlNorm ? parseFloat(rubber.controlNorm) : null,
          communitySpeed: rubber.communitySpeed ? parseFloat(rubber.communitySpeed) : null,
          communitySpin: rubber.communitySpin ? parseFloat(rubber.communitySpin) : null,
          communityControl: rubber.communityControl ? parseFloat(rubber.communityControl) : null,
          hardnessMin: rubber.hardnessMin ?? null,
          topsheetCharacter: rubber.topsheetCharacter as "sticky" | "grippy" | "neutral" | null ?? null,
        },
      );

      batch.push({
        bladeId: result.bladeId,
        rubberId: result.rubberId,
        synergyScore: result.synergyScore,
        // v2: stil-spezifische Scores
        scoreOffensive: result.scoreOffensive,
        scoreAllround: result.scoreAllround,
        scoreDefensive: result.scoreDefensive,
        scoreMaterial: result.scoreMaterial,
        // Sub-Scores
        tempoMatch: result.tempoMatch,
        controlReserve: result.controlReserve,
        spinPotential: result.spinPotential,
        weightBalance: result.weightBalance,
        styleFit: result.styleFit,
        playStyleTarget: result.playStyleTarget,
        ttrTarget: result.ttrTarget,
      });

      count++;

      if (batch.length >= BATCH_SIZE) {
        await db.insert(synergies).values(batch);
        batch = [];
        // Fortschritt nur alle 5000 ausgeben (nicht bei jedem Batch)
        if (count % 5000 < BATCH_SIZE) {
          process.stdout.write(`\r  ${count} / ${total} (${Math.round((count / total) * 100)}%) ...`);
        }
      }
    }
  }

  // Restliche Einträge
  if (batch.length > 0) {
    await db.insert(synergies).values(batch);
    process.stdout.write(`\r  ${count} / ${total} (100%)`);
  }

  console.log("\n");

  // Auswertung: Score-Verteilung
  const stats = await db.execute(sql`
    SELECT
      MIN(synergy_score) AS min,
      MAX(synergy_score) AS max,
      ROUND(AVG(synergy_score), 1) AS avg,
      COUNT(*) FILTER (WHERE synergy_score >= 80) AS high,
      COUNT(*) FILTER (WHERE synergy_score >= 60 AND synergy_score < 80) AS mid,
      COUNT(*) FILTER (WHERE synergy_score < 60) AS low
    FROM synergies
  `);

  const s = stats[0] as Record<string, unknown>;
  console.log("Score-Verteilung:");
  console.log(`  Min: ${s["min"]}  Max: ${s["max"]}  Ø: ${s["avg"]}`);
  console.log(`  ≥80 (stark):   ${s["high"]}`);
  console.log(`  60–79 (solide): ${s["mid"]}`);
  console.log(`  <60 (schwach): ${s["low"]}`);

  // Top-5 Kombinationen
  const top5 = await db.execute(sql`
    SELECT
      b.name AS blade,
      r.name AS rubber,
      s.synergy_score,
      s.play_style_target,
      s.ttr_target
    FROM synergies s
    JOIN blades b ON b.id = s.blade_id
    JOIN rubbers r ON r.id = s.rubber_id
    ORDER BY s.synergy_score DESC
    LIMIT 5
  `);

  console.log("\nTop 5 Kombinationen:");
  for (const row of top5) {
    const r = row as Record<string, unknown>;
    console.log(
      `  ${String(r["synergy_score"]).padStart(3)} | ${String(r["blade"]).padEnd(35)} + ${String(r["rubber"]).padEnd(30)} | ${r["play_style_target"]} TTR${r["ttr_target"]}`,
    );
  }

  console.log(`\n✓ ${count} Synergien gespeichert.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fehler:", err);
  process.exit(1);
});
