/**
 * Analysiert die Datenqualität pro Produkt im Sortiment.
 * Zeigt Verteilung über die 3 Tiers: complete / partial / stub.
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL fehlt"); process.exit(1); }

const sql = postgres(DATABASE_URL, { max: 1 });

async function main() {
  console.log("=== Datenqualitäts-Analyse Sortiment ===\n");

  // ---- Beläge ---------------------------------------------------------------
  console.log("BELÄGE:");
  const rubbers = await sql<{
    id: number;
    name: string;
    has_specs: boolean;
    has_community: boolean;
    review_count: number;
    has_desc: boolean;
    has_comm_desc: boolean;
    has_hardness: boolean;
  }[]>`
    SELECT
      id,
      name,
      (community_speed IS NOT NULL OR speed_norm IS NOT NULL) AS has_specs,
      (community_speed IS NOT NULL AND community_review_count >= 3) AS has_community,
      COALESCE(community_review_count, 0) AS review_count,
      (description IS NOT NULL AND LENGTH(description) > 50) AS has_desc,
      (community_description IS NOT NULL AND LENGTH(community_description) > 30) AS has_comm_desc,
      (hardness_min IS NOT NULL) AS has_hardness
    FROM rubbers
    WHERE is_active = true
  `;

  let rComplete = 0, rPartial = 0, rStub = 0;
  for (const r of rubbers) {
    const score = (r.has_specs ? 1 : 0) + (r.has_community ? 1 : 0) + (r.has_desc ? 1 : 0);
    if (score >= 3) rComplete++;
    else if (r.has_specs) rPartial++;
    else rStub++;
  }
  console.log(`  Vollständig (Specs + Community + Desc): ${rComplete}`);
  console.log(`  Grundlegend (mind. Specs):              ${rPartial}`);
  console.log(`  Stub (kaum Daten):                      ${rStub}`);
  console.log(`  GESAMT:                                  ${rubbers.length}`);

  // Stichproben für Stubs zeigen
  const stubExamples = rubbers
    .filter((r) => !r.has_specs)
    .slice(0, 10)
    .map((r) => r.name);
  if (stubExamples.length > 0) {
    console.log(`\n  Beispiel-Stubs: ${stubExamples.join(", ")}`);
  }

  // ---- Hölzer ---------------------------------------------------------------
  console.log("\nHÖLZER:");
  const blades = await sql<{
    id: number;
    name: string;
    has_specs: boolean;
    has_community: boolean;
    has_desc: boolean;
    has_composition: boolean;
  }[]>`
    SELECT
      id,
      name,
      (community_speed IS NOT NULL OR speed_norm IS NOT NULL) AS has_specs,
      (community_speed IS NOT NULL AND community_review_count >= 3) AS has_community,
      (description IS NOT NULL AND LENGTH(description) > 50) AS has_desc,
      (composition IS NOT NULL) AS has_composition
    FROM blades
    WHERE is_active = true
  `;

  let bComplete = 0, bPartial = 0, bStub = 0;
  for (const b of blades) {
    const score = (b.has_specs ? 1 : 0) + (b.has_community ? 1 : 0) + (b.has_desc ? 1 : 0);
    if (score >= 3) bComplete++;
    else if (b.has_specs) bPartial++;
    else bStub++;
  }
  console.log(`  Vollständig (Specs + Community + Desc): ${bComplete}`);
  console.log(`  Grundlegend (mind. Specs):              ${bPartial}`);
  console.log(`  Stub (kaum Daten):                      ${bStub}`);
  console.log(`  GESAMT:                                  ${blades.length}`);

  const bStubExamples = blades.filter((b) => !b.has_specs).slice(0, 10).map((b) => b.name);
  if (bStubExamples.length > 0) {
    console.log(`\n  Beispiel-Stubs: ${bStubExamples.join(", ")}`);
  }

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
