/**
 * Seedet die wichtigsten DE-Allround-Klassiker die bisher fehlen.
 * Markiert mit is_manually_curated = true, damit sie durch den
 * community_review_count >= 10 Filter rutschen.
 *
 * Synergie-Werte werden für jedes neue Holz × alle aktiven smooth-Beläge
 * berechnet via vereinfachter Heuristik (siehe computeSynergyApprox unten).
 * Ist eine Approximation der richtigen Synergy-Engine, aber gut genug
 * für die DB-Sortierung.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

// ─── 25 fehlende DE-Klassiker ─────────────────────────────────────────────
const CLASSICS = [
  // Stiga
  { mfg: "Stiga", name: "Stiga Allround Wood NCT", composition: "5+0", stiffness: "medium", layers: 5, weight: [78, 86], speed: 5, control: 9, price: 50, playStyle: "allround" },
  { mfg: "Stiga", name: "Stiga Energy Wood NCT", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 55, playStyle: "allround" },
  { mfg: "Stiga", name: "Stiga Optimum Sense", composition: "5+0 Sense-Griff", stiffness: "medium", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 60, playStyle: "allround" },
  // Donic
  { mfg: "Donic", name: "Donic Persson Powerallround", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 70, playStyle: "allround" },
  { mfg: "Donic", name: "Donic Persson Allplay", composition: "5+0", stiffness: "soft", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 50, playStyle: "allround" },
  { mfg: "Donic", name: "Donic Appelgren Allplay", composition: "5+0", stiffness: "soft", layers: 5, weight: [78, 86], speed: 5, control: 9, price: 45, playStyle: "allround" },
  // Andro
  { mfg: "Andro", name: "Andro Roxon Treiber CO Allround", composition: "5+2 Carbon", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 80, playStyle: "allround" },
  { mfg: "Andro", name: "Andro Treiber LX Allround", composition: "5+0", stiffness: "medium", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 70, playStyle: "allround" },
  { mfg: "Andro", name: "Andro Synteliac VCI ALL", composition: "5+2 Carbon innen", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 95, playStyle: "allround" },
  { mfg: "Andro", name: "Andro CC ALL Plus", composition: "5+0", stiffness: "medium", layers: 5, weight: [80, 88], speed: 6, control: 8, price: 65, playStyle: "allround" },
  // Tibhar
  { mfg: "Tibhar", name: "Tibhar Stratus Allround Classic", composition: "5+0", stiffness: "soft", layers: 5, weight: [78, 86], speed: 5, control: 9, price: 40, playStyle: "allround" },
  { mfg: "Tibhar", name: "Tibhar Aeolus Pro", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 55, playStyle: "allround" },
  { mfg: "Tibhar", name: "Tibhar Champ All", composition: "5+0", stiffness: "soft", layers: 5, weight: [76, 84], speed: 5, control: 9, price: 30, playStyle: "allround" },
  // Joola
  { mfg: "JOOLA", name: "JOOLA Champ All", composition: "5+0", stiffness: "soft", layers: 5, weight: [78, 86], speed: 5, control: 9, price: 25, playStyle: "allround" },
  { mfg: "JOOLA", name: "JOOLA Allplay", composition: "5+0", stiffness: "soft", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 35, playStyle: "allround" },
  { mfg: "JOOLA", name: "JOOLA Aruna ALL+", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 60, playStyle: "allround" },
  { mfg: "JOOLA", name: "JOOLA Energon Allround", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 80, playStyle: "allround" },
  // Yasaka
  { mfg: "Yasaka", name: "Yasaka Sweden Classic", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 55, playStyle: "allround" },
  { mfg: "Yasaka", name: "Yasaka Sweden Allround", composition: "5+0", stiffness: "soft", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 50, playStyle: "allround" },
  { mfg: "Yasaka", name: "Yasaka Han Hua", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 70, playStyle: "allround" },
  { mfg: "Yasaka", name: "Yasaka Excellence", composition: "5+0", stiffness: "medium", layers: 5, weight: [80, 88], speed: 5, control: 9, price: 45, playStyle: "allround" },
  // Butterfly
  { mfg: "Butterfly", name: "Butterfly Centerfold", composition: "5+0", stiffness: "soft", layers: 5, weight: [78, 86], speed: 5, control: 9, price: 45, playStyle: "allround" },
  { mfg: "Butterfly", name: "Butterfly Korbel SK7 Classic", composition: "7+0", stiffness: "medium", layers: 7, weight: [85, 93], speed: 6, control: 8, price: 70, playStyle: "allround" },
  { mfg: "Butterfly", name: "Butterfly Maze Performance", composition: "5+0", stiffness: "medium", layers: 5, weight: [82, 90], speed: 6, control: 8, price: 80, playStyle: "allround" },
  { mfg: "Butterfly", name: "Butterfly Allround Made in Sweden", composition: "5+0", stiffness: "soft", layers: 5, weight: [78, 86], speed: 4, control: 9, price: 40, playStyle: "allround" },
];

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Vereinfachte Synergie-Approximation (Logik ähnlich lib/synergy.ts).
// Holz und Belag haben jeweils Speed/Control-Werte 1-10. Spin nur Belag.
// Output: scores 0-100.
function computeSynergyApprox(blade, rubber) {
  const bs = parseFloat(blade.community_speed ?? blade.speed_norm ?? 7);
  const bc = parseFloat(blade.community_control ?? blade.control_norm ?? 7);
  const rs = parseFloat(rubber.community_speed ?? rubber.speed_norm ?? 7);
  const rsp = parseFloat(rubber.community_spin ?? rubber.spin_norm ?? 7);
  const rc = parseFloat(rubber.community_control ?? rubber.control_norm ?? 7);

  const avgSpeed = (bs + rs) / 2;
  const avgControl = (bc + rc) / 2;

  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

  // Tempo-Match: Sweet-Spot bei avgSpeed=8 für Allround
  const tempoAllround = clamp(100 - Math.abs(avgSpeed - 7.5) * 12);
  const tempoOffensive = clamp(100 - Math.abs(avgSpeed - 8.7) * 12);
  const tempoDefensive = clamp(100 - Math.abs(avgSpeed - 6.5) * 12);
  const tempoMaterial = clamp(100 - Math.abs(avgSpeed - 6.0) * 12);

  // Kontroll-Reserve
  const controlReserve = clamp(avgControl * 10);

  // Spin-Potenzial
  const spinPotential = clamp(rsp * 9 + bs * 2);

  // TTR-Target aus avgSpeed ableiten
  const ttrTarget = Math.round(900 + avgSpeed * 90);

  // Allround-Score = balance aus Tempo + Control
  const scoreAllround = clamp((tempoAllround * 0.35) + (controlReserve * 0.4) + (spinPotential * 0.25));
  const scoreOffensive = clamp((tempoOffensive * 0.4) + (spinPotential * 0.4) + (controlReserve * 0.2));
  const scoreDefensive = clamp((tempoDefensive * 0.3) + (controlReserve * 0.55) + (spinPotential * 0.15));
  const scoreMaterial = clamp((tempoMaterial * 0.25) + (controlReserve * 0.55) + (spinPotential * 0.2));

  const playStyleTarget =
    avgSpeed >= 8.3 ? "offensive_topspin" :
    avgSpeed <= 6.5 ? "defensive" :
    "allround";

  const synergyScore =
    playStyleTarget === "offensive_topspin" ? scoreOffensive :
    playStyleTarget === "defensive" ? scoreDefensive :
    scoreAllround;

  return {
    synergyScore,
    scoreOffensive, scoreAllround, scoreDefensive, scoreMaterial,
    tempoMatch: tempoAllround,
    controlReserve,
    spinPotential,
    weightBalance: 75,
    styleFit: 75,
    ttrTarget,
    playStyleTarget,
  };
}

// ─── Manufacturer-Cache ──────────────────────────────────────────────────
const mfgRows = await sql`SELECT id, name FROM manufacturers`;
const mfgMap = new Map(mfgRows.map(r => [r.name.toLowerCase(), r.id]));

// ─── Insert blades ────────────────────────────────────────────────────────
console.log("Inserting blades...\n");
let inserted = 0;
const newBladeIds = [];
for (const c of CLASSICS) {
  const mfgId = mfgMap.get(c.mfg.toLowerCase());
  if (!mfgId) {
    console.log(`  ⚠ Hersteller nicht gefunden: ${c.mfg} (skip ${c.name})`);
    continue;
  }

  // Existiert schon?
  const existing = await sql`SELECT id FROM blades WHERE name = ${c.name} LIMIT 1`;
  if (existing.length > 0) {
    console.log(`  - Existiert: ${c.name}`);
    continue;
  }

  const slug = slugify(c.name);
  const result = await sql`
    INSERT INTO blades (
      manufacturer_id, name, slug,
      speed_norm, control_norm,
      community_speed, community_control, community_review_count,
      composition, stiffness, layers, weight_min, weight_max,
      play_style, ttr_min, ttr_max, ttr_optimal,
      price_eur, is_active, is_manually_curated
    ) VALUES (
      ${mfgId}, ${c.name}, ${slug},
      ${c.speed.toFixed(1)}, ${c.control.toFixed(1)},
      ${c.speed.toFixed(1)}, ${c.control.toFixed(1)}, 0,
      ${c.composition}, ${c.stiffness}, ${c.layers}, ${c.weight[0]}, ${c.weight[1]},
      ${c.playStyle}, 1100, 1700, 1400,
      ${c.price}, true, true
    )
    RETURNING id, name
  `;
  inserted++;
  newBladeIds.push({ id: result[0].id, name: result[0].name });
  console.log(`  ✓ ${result[0].name}`);
}

console.log(`\n${inserted} Hölzer eingefügt.\n`);

// ─── Synergien für neue Hölzer × alle aktiven smooth-Beläge berechnen ───
if (newBladeIds.length > 0) {
  console.log(`Berechne Synergien für ${newBladeIds.length} neue Hölzer...\n`);

  const rubbers = await sql`
    SELECT id, name, type,
           speed_norm, spin_norm, control_norm,
           community_speed, community_spin, community_control
      FROM rubbers
     WHERE is_active = true
       AND type = 'smooth'`;

  console.log(`Aktive smooth-Beläge: ${rubbers.length}`);

  let synergiesCreated = 0;
  for (const newBlade of newBladeIds) {
    const bladeFull = await sql`SELECT * FROM blades WHERE id = ${newBlade.id} LIMIT 1`;
    const blade = bladeFull[0];

    const rows = [];
    for (const rubber of rubbers) {
      const s = computeSynergyApprox(blade, rubber);
      rows.push({
        blade_id: newBlade.id,
        rubber_id: rubber.id,
        synergy_score: s.synergyScore,
        score_offensive: s.scoreOffensive,
        score_allround: s.scoreAllround,
        score_defensive: s.scoreDefensive,
        score_material: s.scoreMaterial,
        tempo_match: s.tempoMatch,
        control_reserve: s.controlReserve,
        spin_potential: s.spinPotential,
        weight_balance: s.weightBalance,
        style_fit: s.styleFit,
        ttr_target: s.ttrTarget,
        play_style_target: s.playStyleTarget,
      });
    }

    // Bulk insert (in chunks gegen Statement-Length)
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await sql`INSERT INTO synergies ${sql(chunk)} ON CONFLICT DO NOTHING`;
    }
    synergiesCreated += rows.length;
    console.log(`  ✓ ${newBlade.name}: ${rows.length} Synergien`);
  }
  console.log(`\nGesamt: ${synergiesCreated} Synergie-Einträge erstellt.`);
}

await sql.end();
console.log("\nFertig.");
