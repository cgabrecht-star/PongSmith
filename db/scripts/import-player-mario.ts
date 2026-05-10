/**
 * Importiert das Mario-Krause-Interview (erster Vereinsspieler) in die DB.
 *
 * Datenquelle: handschriftlicher SETUP_INVENTUR-Bogen, fotografiert + transkribiert.
 *
 * Idempotent — kann mehrfach laufen, prüft auf bestehenden Spieler-Eintrag
 * über (ttr + spielstil + jahre_aktiv) als Soft-Key.
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

// ── Produkt-IDs aus DB-Lookup (find-mario-products.ts) ───────────────────
const PRODUCTS = {
  // Aktuelles Setup
  blade_current_id: 327,        // Donic Original True Carbon Inner
  rubber_vh_current_id: 22,     // Donic Baracuda
  rubber_rh_current_id: 317,    // Donic Bluefire JP 02 (Mario hat JP01, nicht in DB)
  // Vorheriges Setup
  blade_previous_id: 76,        // Andro Gauzy SL OFF (Mario hat "Gauzy OFF SC")
  rubber_previous_vh_id: 24,    // Tibhar Evolution MX-P (sowohl VH als RH)
  rubber_previous_rh_id: 24,
};

async function main() {
  console.log("=== Import: Mario Krause (Shakehands e.V.) ===\n");

  // ── 1. Spieler anlegen ──────────────────────────────────────────────────
  const existing = await sql<{ id: number }[]>`
    SELECT id FROM players
    WHERE ttr_actual = 1387 AND spielstil = 'offensive_topspin' AND jahre_aktiv = 1
    LIMIT 1
  `;

  let playerId: number;
  if (existing.length > 0) {
    playerId = existing[0]!.id;
    console.log(`→ Spieler existiert bereits (#${playerId}), update wird übersprungen.`);
  } else {
    const inserted = await sql<{ id: number }[]>`
      INSERT INTO players (ttr_actual, ttr_range, jahre_aktiv, spielstil, hand, notizen)
      VALUES (
        1387,
        '1300-1400',
        1,
        'offensive_topspin',
        'right',
        ${'Vereinsspieler Shakehands e.V. Dresden. Training 2x/Woche. Erstes Interview von PongSmith — Mai 2026.'}
      )
      RETURNING id
    `;
    playerId = inserted[0]!.id;
    console.log(`✓ Spieler angelegt #${playerId}`);
  }

  // ── 2. Aktuelles Setup ──────────────────────────────────────────────────
  const setupCurrentExists = await sql<{ id: number }[]>`
    SELECT id FROM player_setups
    WHERE player_id = ${playerId} AND status = 'current' AND blade_id = ${PRODUCTS.blade_current_id}
    LIMIT 1
  `;

  if (setupCurrentExists.length === 0) {
    await sql`
      INSERT INTO player_setups (
        player_id, status,
        blade_id, rubber_vh_id, rubber_rh_id,
        score_tempo, score_spin, score_kontrolle, score_gesamtzufriedenheit,
        wechselgrund,
        kommentar
      ) VALUES (
        ${playerId}, 'current',
        ${PRODUCTS.blade_current_id}, ${PRODUCTS.rubber_vh_current_id}, ${PRODUCTS.rubber_rh_current_id},
        6, 9, 9, 9,
        ${'Vorheriges Setup zu schwer und anspruchsvoll'},
        ${'VH: Donic Baracuda (medium-hart, max). RH: Donic Bluefire JP 01 (hart, max) — DB hat nur JP 02 indexiert. Spielt seit 1 Monat. Selbstbeschreibung: "leicht zu kontrollieren, spinnig". Kann gut: Kontrolle in langen Ballwechseln. Limitierung: Geschwindigkeit. Tempo-Score 4-6 (zwei Bewertungen). Block 9, Aufschlag-Kontrolle 9.'}
      )
    `;
    console.log("✓ Aktuelles Setup angelegt");
  } else {
    console.log("→ Aktuelles Setup bereits vorhanden");
  }

  // ── 3. Vorheriges Setup ─────────────────────────────────────────────────
  const setupPreviousExists = await sql<{ id: number }[]>`
    SELECT id FROM player_setups
    WHERE player_id = ${playerId} AND status = 'previous' AND blade_id = ${PRODUCTS.blade_previous_id}
    LIMIT 1
  `;

  if (setupPreviousExists.length === 0) {
    await sql`
      INSERT INTO player_setups (
        player_id, status,
        blade_id, rubber_vh_id, rubber_rh_id,
        wechselgrund,
        kommentar
      ) VALUES (
        ${playerId}, 'previous',
        ${PRODUCTS.blade_previous_id}, ${PRODUCTS.rubber_previous_vh_id}, ${PRODUCTS.rubber_previous_rh_id},
        ${'Zu schwer und anspruchsvoll für TTR 1387 Offensiv-Spieler'},
        ${'Mario gab als Holz "Andro Gauzy OFF SC" an — DB-Match: Andro Gauzy SL OFF. Beläge VH+RH: Tibhar Evolution MX-P beidseitig. Wechsel hat das Problem voll gelöst (Mario: "Ja, voll").'}
      )
    `;
    console.log("✓ Vorheriges Setup angelegt");
  } else {
    console.log("→ Vorheriges Setup bereits vorhanden");
  }

  // ── 4. Beobachtung / O-Ton ─────────────────────────────────────────────
  const obsExists = await sql<{ id: number }[]>`
    SELECT id FROM observations WHERE player_id = ${playerId} LIMIT 1
  `;

  if (obsExists.length === 0) {
    await sql`
      INSERT INTO observations (
        player_id,
        beobachtete_staerken,
        defizite,
        eigene_empfehlung
      ) VALUES (
        ${playerId},
        ${'Selbsteinschätzung Block + Aufschlag-Kontrolle stark (je 9/10). Spin-Erzeugung 9.'},
        ${'Eigene Tempo-Bewertung 4-6 — Setup limitiert ihn nach eigener Aussage in der Geschwindigkeit.'},
        ${'Mario würde sich selbst KEIN anderes Setup empfehlen ("passt schon"). Wunsch: mehr ausprobieren können — Leihstellung hilfreich. Informiert sich über Mannschaftskollegen, mytischtennis-Forum, YouTube.'}
      )
    `;
    console.log("✓ Beobachtung angelegt");
  } else {
    console.log("→ Beobachtung bereits vorhanden");
  }

  // ── Zusammenfassung ─────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════");
  console.log(`✓ Mario Krause (#${playerId}) komplett importiert.`);
  console.log("\nNächste Schritte (manuell):");
  console.log("- Donic Bluefire JP 01 in DB anlegen (härtere Variante von JP 02)");
  console.log("- Klären: 'Andro Gauzy OFF SC' = Andro Gauzy SL OFF? Mario nachfragen.");

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
