/**
 * Umfassender DB-Audit. Prüft:
 *  - Lücken in Pflichtfeldern
 *  - Inkonsistente Werte (TTR-Range, Speed/Spin/Control außerhalb 0-10)
 *  - DB-Type vs description-Inhalt (LP-Belag mit description die "invertiert" sagt)
 *  - Doppelte Slugs, fehlende Hersteller
 *  - Sortiment-Filter würden für jeden Spielstil etwas finden?
 *
 * Usage: npm run db:audit
 */
import { db } from "../index";
import { rubbers, blades, manufacturers, synergies } from "../schema";
import { eq, sql, isNull } from "drizzle-orm";

async function main() {
  console.log("=== DB-Audit ===\n");

  // ── Hersteller ────────────────────────────────────────────────────────
  const mfgs = await db.select().from(manufacturers);
  console.log(`◆ Hersteller: ${mfgs.length}`);

  // ── Beläge ────────────────────────────────────────────────────────────
  const allRubbers = await db.select().from(rubbers);
  console.log(`◆ Beläge: ${allRubbers.length} (aktiv: ${allRubbers.filter((r) => r.isActive).length})`);

  const noMfg = allRubbers.filter((r) => !mfgs.find((m) => m.id === r.manufacturerId));
  if (noMfg.length > 0) console.log(`  ⚠ ${noMfg.length} Beläge ohne gültigen Hersteller-Bezug`);

  const noDesc = allRubbers.filter((r) => r.isActive && !r.description);
  console.log(`  ○ ${noDesc.length} Beläge ohne Hersteller-Beschreibung`);

  const noCommDesc = allRubbers.filter((r) => r.isActive && !r.communityDescription);
  console.log(`  ○ ${noCommDesc.length} Beläge ohne Community-Beschreibung`);

  const noImage = allRubbers.filter((r) => r.isActive && !r.imageUrl);
  console.log(`  ○ ${noImage.length} Beläge ohne Bild`);

  const noSpeedNorm = allRubbers.filter((r) => r.isActive && r.speedNorm === null && r.communitySpeed === null);
  console.log(`  ${noSpeedNorm.length > 0 ? "⚠" : "○"} ${noSpeedNorm.length} Beläge ohne Speed-Wert`);

  // Werte außerhalb 0-10
  const oobRubbers = allRubbers.filter((r) => {
    const checks = [r.speedNorm, r.spinNorm, r.controlNorm, r.communitySpeed, r.communitySpin, r.communityControl];
    return checks.some((v) => v !== null && (parseFloat(v) < 0 || parseFloat(v) > 10));
  });
  if (oobRubbers.length > 0) {
    console.log(`  ⚠ ${oobRubbers.length} Beläge mit Werten außerhalb 0-10:`);
    oobRubbers.forEach((r) => console.log(`     - ${r.slug}`));
  }

  // Beläge nach Typ
  const byType = allRubbers.reduce<Record<string, number>>((acc, r) => {
    if (r.isActive) acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  Typen-Verteilung:`, byType);

  // Beläge nach Spielstil
  const byStyle = allRubbers.reduce<Record<string, number>>((acc, r) => {
    if (r.isActive) {
      const k = r.playStyle ?? "(null)";
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, {});
  console.log(`  Spielstil-Verteilung:`, byStyle);

  // ── Hölzer ────────────────────────────────────────────────────────────
  const allBlades = await db.select().from(blades);
  console.log(`\n◆ Hölzer: ${allBlades.length} (aktiv: ${allBlades.filter((b) => b.isActive).length})`);

  const bNoDesc = allBlades.filter((b) => b.isActive && !b.description);
  console.log(`  ○ ${bNoDesc.length} Hölzer ohne Hersteller-Beschreibung`);

  const bNoComm = allBlades.filter((b) => b.isActive && !b.communityDescription);
  console.log(`  ○ ${bNoComm.length} Hölzer ohne Community-Beschreibung`);

  const bNoImage = allBlades.filter((b) => b.isActive && !b.imageUrl);
  console.log(`  ○ ${bNoImage.length} Hölzer ohne Bild`);

  const bByStyle = allBlades.reduce<Record<string, number>>((acc, b) => {
    if (b.isActive) {
      const k = b.playStyle ?? "(null)";
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, {});
  console.log(`  Spielstil-Verteilung:`, bByStyle);

  // ── Synergien ─────────────────────────────────────────────────────────
  const synCount = await db.select({ c: sql<number>`count(*)::int` }).from(synergies);
  console.log(`\n◆ Synergien: ${synCount[0]?.c ?? 0}`);

  const synByStyle = await db
    .select({ style: synergies.playStyleTarget, c: sql<number>`count(*)::int` })
    .from(synergies)
    .groupBy(synergies.playStyleTarget);
  console.log(`  Spielstil-Verteilung:`, synByStyle);

  // ── Berater-Test: für jeden Spielstil müssen Empfehlungen kommen ──────
  console.log(`\n◆ Berater-Test (TTR 1300, alle Spielstile):`);
  for (const style of ["offensive_topspin", "allround", "defensive", "material"] as const) {
    const r = await db.select({ c: sql<number>`count(*)::int` })
      .from(synergies)
      .where(sql`${synergies.playStyleTarget} = ${style} AND ${synergies.ttrTarget} BETWEEN 1000 AND 1600`);
    const count = r[0]?.c ?? 0;
    const flag = count >= 3 ? "✓" : "⚠";
    console.log(`  ${flag} ${style}: ${count} Synergien im Bereich 1000-1600`);
  }

  // ── Sortiment-Filter-Test ─────────────────────────────────────────────
  console.log(`\n◆ Sortiment-Filter-Test:`);
  for (const t of ["smooth", "long_pips", "short_pips", "anti"] as const) {
    const c = allRubbers.filter((r) => r.isActive && r.type === t).length;
    const flag = c > 0 ? "✓" : "⚠";
    console.log(`  ${flag} Beläge Typ '${t}': ${c}`);
  }

  // ── Konsistenz: DB-Typ vs description-Inhalt ──────────────────────────
  console.log(`\n◆ Type-vs-Description-Heuristik:`);
  const suspicious: { slug: string; type: string; reason: string }[] = [];
  for (const r of allRubbers.filter((x) => x.isActive && x.description)) {
    const desc = r.description!.toLowerCase();
    if (r.type === "long_pips" && /\binverted\b|invertiert|tensor|spring sponge|katapult/.test(desc)) {
      suspicious.push({ slug: r.slug, type: r.type, reason: "type=long_pips aber description erwähnt Tensor/Inverted" });
    }
    if (r.type === "smooth" && /\blong pips?\b|lange noppen|störwirkung|noppen-außen-belag/.test(desc)) {
      suspicious.push({ slug: r.slug, type: r.type, reason: "type=smooth aber description erwähnt Lange Noppen/Störwirkung" });
    }
    if (r.type === "anti" && /tensor|spring sponge|aggressiv.*topspin/.test(desc)) {
      suspicious.push({ slug: r.slug, type: r.type, reason: "type=anti aber description erwähnt Tensor/aggressiv" });
    }
  }
  if (suspicious.length === 0) {
    console.log("  ✓ Keine offensichtlichen Type-Description-Konflikte");
  } else {
    suspicious.forEach((s) => console.log(`  ⚠ ${s.slug} (${s.type}) — ${s.reason}`));
  }

  // ── Doppelte Slugs ────────────────────────────────────────────────────
  const dupRubberSlugs = allRubbers
    .map((r) => r.slug)
    .filter((s, i, a) => a.indexOf(s) !== i);
  const dupBladeSlugs = allBlades
    .map((b) => b.slug)
    .filter((s, i, a) => a.indexOf(s) !== i);
  if (dupRubberSlugs.length > 0) console.log(`\n⚠ Doppelte Belag-Slugs: ${dupRubberSlugs.join(", ")}`);
  if (dupBladeSlugs.length > 0) console.log(`\n⚠ Doppelte Holz-Slugs: ${dupBladeSlugs.join(", ")}`);

  console.log("\n══════════════════════════════ Audit fertig.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
