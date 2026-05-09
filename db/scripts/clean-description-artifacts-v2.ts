/**
 * Bereinigt Beschreibungs-Texte von Scraping-Artefakten.
 *
 * Probleme:
 * 1. Revspin-Boilerplate "There are N users using the X." am Anfang
 * 2. UTF-8-Encoding-Artefakte: "Â" (entsteht wenn UTF-8 als Latin-1 gelesen wurde)
 *    z.B. "control. Â The..." → eigentlich "control. The..." (NBSP wurde zu "Â\xA0")
 *
 * Idempotent — kann mehrfach laufen.
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL fehlt");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

function cleanDescription(text: string | null): string | null {
  if (!text) return text;
  let out = text;

  // 1. "There are N users using the [Name]." → entfernen
  // Format: "There are 1 users using the Andro Backside 2.0 C. <eigentliche Beschreibung>"
  out = out.replace(/^There (?:is|are) \d+ users? using the [^.]+\.\s*/i, "");

  // 2. UTF-8-Artefakte
  // "Â " → " " (NBSP fehlinterpretiert)
  out = out.replace(/Â /g, " ");
  // "Â\xA0" → " " (echtes NBSP nach Â)
  out = out.replace(/Â /g, " ");
  // Lone "Â" am Wortende oder zwischen Wörtern → entfernen
  out = out.replace(/Â/g, "");

  // 3. Mehrfache Leerzeichen → ein Leerzeichen
  out = out.replace(/[ \t]{2,}/g, " ");

  // 4. Trim
  out = out.trim();

  return out;
}

async function main() {
  console.log("=== Description Cleanup v2 ===\n");

  let totalUpdated = 0;

  for (const tableName of ["rubbers", "blades"] as const) {
    console.log(`→ ${tableName}...`);
    const rows = await sql<{
      id: number;
      name: string;
      description: string | null;
      community_description: string | null;
    }[]>`
      SELECT id, name, description, community_description
      FROM ${sql(tableName)}
      WHERE description IS NOT NULL OR community_description IS NOT NULL
    `;

    let updated = 0;
    for (const r of rows) {
      const newDesc = cleanDescription(r.description);
      const newComm = cleanDescription(r.community_description);
      const descChanged = newDesc !== r.description;
      const commChanged = newComm !== r.community_description;
      if (!descChanged && !commChanged) continue;

      await sql`
        UPDATE ${sql(tableName)}
        SET description = ${newDesc},
            community_description = ${newComm},
            updated_at = NOW()
        WHERE id = ${r.id}
      `;
      updated++;
    }

    console.log(`  ✓ ${updated} von ${rows.length} bereinigt`);
    totalUpdated += updated;
  }

  console.log(`\n✓ Fertig — ${totalUpdated} Datensätze aktualisiert.`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
