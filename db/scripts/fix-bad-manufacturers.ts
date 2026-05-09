/**
 * Bereinigt fehlerhafte Hersteller-Einträge in der DB.
 *
 * Ursache: extractManufacturer() fällt auf name.split(" ")[0] zurück wenn der
 * Markenname unbekannt ist — dadurch entstehen Phantom-Hersteller wie
 * "(No", "Xi", "Der", "Air", "Three" etc.
 *
 * Strategie:
 *   1. Verdächtige Hersteller identifizieren (wenige Produkte, kurze/seltsame Namen)
 *   2. Produkte einem "Unknown" Fallback-Hersteller zuweisen
 *   3. Leere Hersteller-Einträge löschen
 *   4. Bericht ausgeben
 *
 * Usage: npm run db:fix-bad-manufacturers
 */

import { db } from "../index";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Muster für offensichtlich fehlerhafte Hersteller-Namen
// ---------------------------------------------------------------------------

/**
 * Bekannte legitime Hersteller (whitelist).
 * Alle anderen mit ≤3 Produkten gelten als verdächtig.
 */
const KNOWN_MANUFACTURERS = new Set([
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA", "Xiom",
  "DHS", "Nittaku", "Andro", "Yasaka", "Sanwei", "729", "Yinhe", "Galaxy",
  "Gewo", "Palio", "Globe", "Victas", "TSP", "SpinLord", "Spinlord",
  "Reactor", "Friendship", "Double Fish", "Dawei", "Juic", "Kokutaku",
  "Avalox", "Sword", "Giant Dragon", "Killerspin", "Tibhar", "Eastfield",
  "Sauer & Troger", "Dr. Neubauer", "Neubauer", "Xiao", "Cornilleau",
  "Donic", "Mizuno", "Timo", "Darker", "Hatins", "Hallmark", "Lion",
  "Revolution", "Newgy", "Andro", "Cross", "Double", "Flying",
  "Joola", "Nittaku", "Tibhar",
]);

// Explizit bekannte Fehl-Extraktionen
const OBVIOUSLY_BAD = new Set([
  "(No", "(no", "Der", "der", "Die", "die", "Das",
  "Air", "Three", "Xi", "Two", "Super",
]);

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function isSuspicious(name: string, productCount: number): boolean {
  // Offensichtlich falsch
  if (OBVIOUSLY_BAD.has(name)) return true;
  // Sehr kurz und nicht in Whitelist
  if (name.length <= 3 && !KNOWN_MANUFACTURERS.has(name)) return true;
  // Beginnt mit Klammer
  if (name.startsWith("(")) return true;
  // Nur 1 Produkt und nicht in Whitelist → verdächtig
  if (productCount === 1 && !KNOWN_MANUFACTURERS.has(name)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Bereinigung: Fehlerhafte Hersteller ===\n");

  // Alle Hersteller mit Produkt-Anzahl laden
  const mfrRows = (await db.execute(sql`
    SELECT
      m.id,
      m.name,
      m.slug,
      COUNT(DISTINCT r.id) AS rubber_count,
      COUNT(DISTINCT b.id) AS blade_count,
      (COUNT(DISTINCT r.id) + COUNT(DISTINCT b.id)) AS total_count
    FROM manufacturers m
    LEFT JOIN rubbers r ON r.manufacturer_id = m.id
    LEFT JOIN blades b ON b.manufacturer_id = m.id
    GROUP BY m.id, m.name, m.slug
    ORDER BY total_count ASC, m.name ASC
  `)) as { id: number; name: string; slug: string; total_count: number }[];

  // Verdächtige identifizieren
  const suspicious = mfrRows.filter((m) =>
    isSuspicious(m.name, Number(m.total_count))
  );

  console.log(`Hersteller gesamt:      ${mfrRows.length}`);
  console.log(`Davon verdächtig:       ${suspicious.length}\n`);

  if (suspicious.length === 0) {
    console.log("✓ Keine verdächtigen Hersteller gefunden.");
    process.exit(0);
  }

  console.log("Verdächtige Hersteller:");
  for (const m of suspicious) {
    console.log(`  • "${m.name}" (${m.total_count} Produkte)`);
  }

  // "Unknown"-Hersteller sicherstellen
  const unknownResult = await db.execute(sql`
    INSERT INTO manufacturers (name, slug)
    VALUES ('Unknown', 'unknown')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `);

  const unknownMfr = (await db.execute(sql`
    SELECT id FROM manufacturers WHERE slug = 'unknown'
  `)) as { id: number }[];

  if (unknownMfr.length === 0) {
    console.error("Konnte Unknown-Hersteller nicht finden/anlegen.");
    process.exit(1);
  }
  const unknownId = unknownMfr[0]!.id;
  console.log(`\n→ Unknown-Hersteller ID: ${unknownId}`);

  let movedRubbers = 0;
  let movedBlades = 0;
  let deletedMfr = 0;

  for (const m of suspicious) {
    // Produkte zu Unknown umziehen
    const rubberUpdate = await db.execute(sql`
      UPDATE rubbers SET manufacturer_id = ${unknownId}
      WHERE manufacturer_id = ${m.id}
    `);
    const bladeUpdate = await db.execute(sql`
      UPDATE blades SET manufacturer_id = ${unknownId}
      WHERE manufacturer_id = ${m.id}
    `);

    // Leeren Hersteller löschen
    await db.execute(sql`
      DELETE FROM manufacturers WHERE id = ${m.id}
    `);

    console.log(`  ✓ "${m.name}" → Unknown (${m.total_count} Produkte verschoben)`);
    movedRubbers += Number(m.total_count); // Approximate — exact split egal für Stats
    deletedMfr++;
  }

  // Abschluss-Bericht
  console.log("\n══════════════════════════════════════════");
  console.log(`  Hersteller gelöscht:    ${deletedMfr}`);
  console.log(`  Produkte zu Unknown:    ${suspicious.reduce((s, m) => s + Number(m.total_count), 0)}`);
  console.log("\n✓ Fertig.");

  // Zeige verbleibende Hersteller mit 1 Produkt zur manuellen Prüfung
  const singletons = (await db.execute(sql`
    SELECT
      m.name,
      m.slug,
      COALESCE(r.name, b.name) AS product_name
    FROM manufacturers m
    LEFT JOIN rubbers r ON r.manufacturer_id = m.id
    LEFT JOIN blades b ON b.manufacturer_id = m.id
    GROUP BY m.id, m.name, m.slug, r.name, b.name
    HAVING COUNT(DISTINCT r.id) + COUNT(DISTINCT b.id) = 1
    ORDER BY m.name
    LIMIT 30
  `)) as { name: string; slug: string; product_name: string }[];

  if (singletons.length > 0) {
    console.log("\n── Zur manuellen Prüfung: Hersteller mit nur 1 Produkt ──");
    for (const s of singletons) {
      console.log(`  • "${s.name}" → ${s.product_name}`);
    }
    console.log("  (Diese wurden nicht automatisch korrigiert)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
