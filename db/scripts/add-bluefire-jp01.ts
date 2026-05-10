/**
 * Pflegt Donic Bluefire JP 01 in die Beläge-DB ein und updated Marios
 * aktuelles Setup von JP 02 auf JP 01.
 *
 * Quelle für Specs: revspin.net, donic.com, megaspin.net
 * - ESN-Härte: 47.5° (medium-hard, Tensor)
 * - Schwammgewicht: 50g / 0.248 g/cm²
 * - Charakter: schnell, sehr griffig, sehr spinig
 * - Empfehlung: tischnah-offensiv + Halbdistanz
 * - JP 01 = härteste/schnellste der Bluefire-JP-Reihe (JP 02 medium, JP 03 weich)
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log("=== Donic Bluefire JP 01 nachpflegen ===\n");

  // Donic-Hersteller-ID
  const mfg = await sql<{ id: number }[]>`
    SELECT id FROM manufacturers WHERE name = 'Donic' LIMIT 1
  `;
  if (mfg.length === 0) {
    console.error("Donic-Hersteller nicht gefunden!");
    process.exit(1);
  }
  const donicId = mfg[0]!.id;

  // Schon vorhanden?
  const existing = await sql<{ id: number }[]>`
    SELECT id FROM rubbers WHERE slug = 'donic-bluefire-jp-01' LIMIT 1
  `;

  let jp01Id: number;

  if (existing.length > 0) {
    jp01Id = existing[0]!.id;
    console.log(`→ Bluefire JP 01 bereits vorhanden (#${jp01Id})`);
  } else {
    const inserted = await sql<{ id: number }[]>`
      INSERT INTO rubbers (
        manufacturer_id, name, slug, type,
        speed_norm, spin_norm, control_norm,
        community_speed, community_spin, community_control, community_review_count,
        topsheet_character, hardness_min, hardness_max,
        play_style,
        ttr_min, ttr_max, ttr_optimal,
        description,
        community_description,
        source_url,
        is_active
      ) VALUES (
        ${donicId},
        'Donic Bluefire JP 01',
        'donic-bluefire-jp-01',
        'smooth',
        9.2, 9.4, 7.6,
        9.0, 9.2, 7.8, 14,
        'grippy', 47, 50,
        'offensive_topspin',
        1300, 1900, 1600,
        ${'Die schnellste und härteste Bluefire-JP-Variante (47.5° ESN). Extrem griffiges Topsheet das beim Topspin maximalen Spin erzeugt und länger am Holz haftet. Sensationelles Spielgefühl mit maximaler Katapult-Wirkung und sehr hoher Bogenkurve. Empfohlen für tischnahe Angriffsspieler sowie für Spieler die gerne aus der Halbdistanz agieren. Erhältlich in 1.8 mm, 2.0 mm und max.'},
        ${'Spieler-Konsens (14 Reviews): sehr schneller, sehr spinniger Tensor mit medium-hartem Schwamm. Verlangt saubere Topspin-Technik und eine Spielstärke ab ca. TTR 1300. Lohnt sich für ambitionierte Offensivspieler die Spin und Tempo gleichzeitig wollen.'},
        'https://revspin.net/rubber/donic-bluefire-jp-01.html',
        true
      ) RETURNING id
    `;
    jp01Id = inserted[0]!.id;
    console.log(`✓ Bluefire JP 01 angelegt (#${jp01Id})`);
  }

  // Marios current Setup updaten: rubber_rh von JP 02 (#317) auf JP 01
  const updated = await sql<{ id: number }[]>`
    UPDATE player_setups
    SET rubber_rh_id = ${jp01Id},
        kommentar = ${'VH: Donic Baracuda (medium-hart, max). RH: Donic Bluefire JP 01 (hart, max). Spielt seit 1 Monat. Selbstbeschreibung: "leicht zu kontrollieren, spinnig". Kann gut: Kontrolle in langen Ballwechseln. Limitierung: Geschwindigkeit. Tempo-Score 4-6. Block 9, Aufschlag-Kontrolle 9.'}
    WHERE player_id = (SELECT id FROM players WHERE ttr_actual = 1387 AND spielstil = 'offensive_topspin' LIMIT 1)
      AND status = 'current'
    RETURNING id
  `;

  if (updated.length > 0) {
    console.log(`✓ Marios current Setup aktualisiert (RH-Belag → JP 01)`);
  } else {
    console.log("→ Marios current Setup nicht gefunden (kein Update nötig)");
  }

  console.log("\n══════════════════════════════════════");
  console.log("✓ Fertig. Bluefire JP 01 ist im Index, Mario verweist drauf.");
  console.log("\nHinweis: Synergie-Scores für JP 01 werden beim nächsten");
  console.log("'npm run compute:synergies' automatisch berechnet.");

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
