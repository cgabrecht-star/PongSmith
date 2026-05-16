/**
 * 40+ wichtigste DE-Belag-Klassiker die in der DB fehlen.
 * Werte: speed/spin/control 1-10 (community-Skala normiert).
 * Quellen: Hersteller-Webseiten, TT-Shop, Tischtennis.biz (Mai 2026).
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const CLASSICS = [
  // Andro - sehr unterrepräsentiert in DE-Vereinen
  { mfg: "Andro", name: "Andro Hexer Pips+", type: "smooth", speed: 9.0, spin: 9.2, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 40 },
  { mfg: "Andro", name: "Andro Hexer Duro", type: "smooth", speed: 9.5, spin: 9.5, control: 8.0, hardMin: 50, hardMax: 50, topsheet: "grippy", price: 40 },
  { mfg: "Andro", name: "Andro Hexer Powergrip SFX", type: "smooth", speed: 9.0, spin: 9.4, control: 8.6, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 40 },
  { mfg: "Andro", name: "Andro Rasanter R37", type: "smooth", speed: 8.8, spin: 9.5, control: 8.8, hardMin: 37, hardMax: 37, topsheet: "grippy", price: 50 },
  { mfg: "Andro", name: "Andro Rasanter R48", type: "smooth", speed: 9.4, spin: 9.5, control: 8.3, hardMin: 48, hardMax: 48, topsheet: "grippy", price: 55 },
  { mfg: "Andro", name: "Andro Roxon 500", type: "smooth", speed: 8.5, spin: 9.0, control: 8.7, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 35 },
  { mfg: "Andro", name: "Andro Plaxon 400", type: "smooth", speed: 8.8, spin: 8.5, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 35 },
  { mfg: "Andro", name: "Andro Impuls Speed", type: "smooth", speed: 9.0, spin: 8.5, control: 8.0, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 32 },

  // Tibhar - mittlere Coverage, häufig genutzte fehlen
  { mfg: "Tibhar", name: "Tibhar Aurus Soft", type: "smooth", speed: 8.5, spin: 9.2, control: 9.0, hardMin: 42, hardMax: 42, topsheet: "grippy", price: 35 },
  { mfg: "Tibhar", name: "Tibhar Aurus Sound", type: "smooth", speed: 8.8, spin: 9.3, control: 8.8, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 38 },
  { mfg: "Tibhar", name: "Tibhar Genius Optimum", type: "smooth", speed: 8.5, spin: 9.0, control: 9.0, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 38 },
  { mfg: "Tibhar", name: "Tibhar Quantum X Pro", type: "smooth", speed: 9.3, spin: 9.4, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 45 },
  { mfg: "Tibhar", name: "Tibhar Sinus", type: "smooth", speed: 8.0, spin: 8.5, control: 9.2, hardMin: 40, hardMax: 40, topsheet: "neutral", price: 25 },
  { mfg: "Tibhar", name: "Tibhar Sinus Alpha", type: "smooth", speed: 8.3, spin: 8.7, control: 9.0, hardMin: 42, hardMax: 42, topsheet: "neutral", price: 28 },
  { mfg: "Tibhar", name: "Tibhar Volcano", type: "smooth", speed: 8.0, spin: 8.5, control: 9.0, hardMin: 40, hardMax: 40, topsheet: "neutral", price: 22 },

  // Yasaka - massiv unterrepräsentiert
  { mfg: "Yasaka", name: "Yasaka Mark V Flying Soft", type: "smooth", speed: 7.8, spin: 8.5, control: 9.4, hardMin: 35, hardMax: 35, topsheet: "neutral", price: 30 },
  { mfg: "Yasaka", name: "Yasaka Pryde", type: "smooth", speed: 9.2, spin: 9.4, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 50 },
  { mfg: "Yasaka", name: "Yasaka Sevenzig Speed", type: "smooth", speed: 9.0, spin: 8.8, control: 8.5, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 40 },
  { mfg: "Yasaka", name: "Yasaka Original 30", type: "smooth", speed: 7.5, spin: 8.0, control: 9.0, hardMin: 30, hardMax: 30, topsheet: "neutral", price: 22 },
  { mfg: "Yasaka", name: "Yasaka Phantom 0011 Infinity", type: "long_pips", speed: 5.5, spin: 6.0, control: 8.5, hardMin: 35, hardMax: 35, topsheet: "neutral", price: 30 },

  // Donic - Linien fehlen
  { mfg: "Donic", name: "Donic Coppa X1 Turbo", type: "smooth", speed: 9.0, spin: 9.2, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 40 },
  { mfg: "Donic", name: "Donic Coppa Tenero", type: "smooth", speed: 8.5, spin: 9.0, control: 9.0, hardMin: 40, hardMax: 40, topsheet: "grippy", price: 35 },
  { mfg: "Donic", name: "Donic Acuda Blue P1 Turbo", type: "smooth", speed: 9.3, spin: 9.5, control: 8.3, hardMin: 50, hardMax: 50, topsheet: "grippy", price: 50 },
  { mfg: "Donic", name: "Donic Bluestar A1", type: "smooth", speed: 8.5, spin: 9.0, control: 8.8, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 32 },
  { mfg: "Donic", name: "Donic Bluestar A2", type: "smooth", speed: 8.7, spin: 9.0, control: 8.7, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 32 },
  { mfg: "Donic", name: "Donic Bluestar A3", type: "smooth", speed: 8.5, spin: 8.8, control: 9.0, hardMin: 45, hardMax: 45, topsheet: "neutral", price: 30 },

  // Stiga - Hybrid + DNA-Linie
  { mfg: "Stiga", name: "Stiga DNA Pro M", type: "smooth", speed: 9.3, spin: 9.5, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "grippy", price: 50 },
  { mfg: "Stiga", name: "Stiga DNA Pro H", type: "smooth", speed: 9.5, spin: 9.5, control: 8.0, hardMin: 50, hardMax: 50, topsheet: "grippy", price: 50 },
  { mfg: "Stiga", name: "Stiga DNA Hybrid M", type: "smooth", speed: 9.0, spin: 9.7, control: 8.5, hardMin: 47, hardMax: 47, topsheet: "hybrid", price: 50, isCurated: true },
  { mfg: "Stiga", name: "Stiga DNA Hybrid XH", type: "smooth", speed: 9.5, spin: 9.8, control: 8.0, hardMin: 52, hardMax: 52, topsheet: "hybrid", price: 55, isCurated: true },
  { mfg: "Stiga", name: "Stiga Mantra M Sound", type: "smooth", speed: 8.0, spin: 8.5, control: 9.0, hardMin: 45, hardMax: 45, topsheet: "neutral", price: 30 },

  // Butterfly - Lücken
  { mfg: "Butterfly", name: "Butterfly Tenergy 19", type: "smooth", speed: 9.4, spin: 9.5, control: 8.0, hardMin: 36, hardMax: 36, topsheet: "grippy", price: 65 },
  { mfg: "Butterfly", name: "Butterfly Glayzer", type: "smooth", speed: 9.3, spin: 9.5, control: 8.5, hardMin: 40, hardMax: 40, topsheet: "grippy", price: 55 },
  { mfg: "Butterfly", name: "Butterfly Glayzer 09C", type: "smooth", speed: 9.0, spin: 10.0, control: 8.3, hardMin: 47, hardMax: 47, topsheet: "hybrid", price: 60 },
  { mfg: "Butterfly", name: "Butterfly Bryce Highspeed", type: "smooth", speed: 9.5, spin: 9.0, control: 8.0, hardMin: 50, hardMax: 50, topsheet: "grippy", price: 50 },

  // JOOLA
  { mfg: "JOOLA", name: "JOOLA Rhyzer Pro 45", type: "smooth", speed: 9.2, spin: 9.4, control: 8.5, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 50 },
  { mfg: "JOOLA", name: "JOOLA Maxxx 500", type: "smooth", speed: 9.0, spin: 9.0, control: 8.5, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 38 },
  { mfg: "JOOLA", name: "JOOLA Maxxx 450", type: "smooth", speed: 8.7, spin: 8.8, control: 8.7, hardMin: 42, hardMax: 42, topsheet: "grippy", price: 38 },

  // Nittaku
  { mfg: "Nittaku", name: "Nittaku Renanos Hold", type: "smooth", speed: 8.5, spin: 9.0, control: 9.0, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 45 },
  { mfg: "Nittaku", name: "Nittaku Hammond FA Pro", type: "smooth", speed: 9.0, spin: 8.8, control: 8.7, hardMin: 45, hardMax: 45, topsheet: "grippy", price: 45 },

  // DHS
  { mfg: "DHS", name: "DHS NEO Skyline TG3-60", type: "smooth", speed: 9.0, spin: 9.5, control: 8.5, hardMin: 39, hardMax: 39, topsheet: "sticky", price: 30 },

  // Material-Klassiker (Long Pips, Anti)
  { mfg: "Tibhar", name: "Tibhar Grass D.TecS", type: "long_pips", speed: 5.5, spin: 6.0, control: 8.5, hardMin: 35, hardMax: 35, topsheet: "neutral", price: 32 },
  { mfg: "SpinLord", name: "SpinLord Keiler", type: "long_pips", speed: 5.0, spin: 5.5, control: 9.0, hardMin: 32, hardMax: 32, topsheet: "neutral", price: 28 },
  { mfg: "SpinLord", name: "SpinLord Strahlkraft", type: "long_pips", speed: 6.0, spin: 6.5, control: 8.5, hardMin: 35, hardMax: 35, topsheet: "neutral", price: 30 },
  { mfg: "SpinLord", name: "SpinLord Waran", type: "long_pips", speed: 5.5, spin: 6.0, control: 8.8, hardMin: 33, hardMax: 33, topsheet: "neutral", price: 28 },
  { mfg: "Sauer & Troger", name: "Sauer & Troger Hass", type: "long_pips", speed: 5.0, spin: 5.5, control: 9.2, hardMin: 30, hardMax: 30, topsheet: "neutral", price: 32 },
  { mfg: "Sauer & Troger", name: "Sauer & Troger Schmerz", type: "long_pips", speed: 5.5, spin: 6.0, control: 8.8, hardMin: 32, hardMax: 32, topsheet: "neutral", price: 32 },
  { mfg: "Dr. Neubauer", name: "Dr. Neubauer Killer", type: "long_pips", speed: 6.0, spin: 6.5, control: 8.5, hardMin: 35, hardMax: 35, topsheet: "neutral", price: 30 },
];

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const mfgRows = await sql`SELECT id, name FROM manufacturers`;
const mfgMap = new Map(mfgRows.map(r => [r.name.toLowerCase(), r.id]));

console.log(`Versuche ${CLASSICS.length} Beläge einzufügen...\n`);
let inserted = 0;
const newRubberIds = [];
for (const c of CLASSICS) {
  let mfgId = mfgMap.get(c.mfg.toLowerCase());
  if (!mfgId) {
    // Hersteller anlegen falls nicht da
    const slug = slugify(c.mfg);
    const [created] = await sql`
      INSERT INTO manufacturers (name, slug)
      VALUES (${c.mfg}, ${slug})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`;
    mfgId = created.id;
    mfgMap.set(c.mfg.toLowerCase(), mfgId);
    console.log(`  + Neuer Hersteller: ${c.mfg}`);
  }

  const slug = slugify(c.name);
  const existing = await sql`SELECT id FROM rubbers WHERE name = ${c.name} OR slug = ${slug} LIMIT 1`;
  if (existing.length > 0) {
    console.log(`  - Existiert (oder slug-conflict): ${c.name}`);
    continue;
  }

  const result = await sql`
    INSERT INTO rubbers (
      manufacturer_id, name, slug, type,
      speed_norm, spin_norm, control_norm,
      community_speed, community_spin, community_control, community_review_count,
      topsheet_character, hardness_min, hardness_max,
      ttr_min, ttr_max, ttr_optimal,
      price_eur, is_active, is_manually_curated
    ) VALUES (
      ${mfgId}, ${c.name}, ${slug}, ${c.type},
      ${c.speed.toFixed(1)}, ${c.spin.toFixed(1)}, ${c.control.toFixed(1)},
      ${c.speed.toFixed(1)}, ${c.spin.toFixed(1)}, ${c.control.toFixed(1)}, 0,
      ${c.topsheet}, ${c.hardMin}, ${c.hardMax},
      1100, 1700, 1400,
      ${c.price}, true, true
    )
    RETURNING id, name, type
  `;
  inserted++;
  newRubberIds.push({ id: result[0].id, name: result[0].name, type: result[0].type });
  console.log(`  ✓ ${result[0].name}`);
}

console.log(`\n${inserted} Beläge eingefügt.\n`);

// ─── Synergien für jeden neuen Belag × alle aktiven Hölzer ─────────────
function computeSynergyApprox(blade, rubber) {
  const bs = parseFloat(blade.community_speed ?? blade.speed_norm ?? 7);
  const bc = parseFloat(blade.community_control ?? blade.control_norm ?? 7);
  const rs = parseFloat(rubber.community_speed ?? rubber.speed_norm ?? 7);
  const rsp = parseFloat(rubber.community_spin ?? rubber.spin_norm ?? 7);
  const rc = parseFloat(rubber.community_control ?? rubber.control_norm ?? 7);
  const avgSpeed = (bs + rs) / 2;
  const avgControl = (bc + rc) / 2;
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

  const tempoAllround = clamp(100 - Math.abs(avgSpeed - 7.5) * 12);
  const tempoOffensive = clamp(100 - Math.abs(avgSpeed - 8.7) * 12);
  const tempoDefensive = clamp(100 - Math.abs(avgSpeed - 6.5) * 12);
  const tempoMaterial = clamp(100 - Math.abs(avgSpeed - 6.0) * 12);
  const controlReserve = clamp(avgControl * 10);
  const spinPotential = clamp(rsp * 9 + bs * 2);
  const ttrTarget = Math.round(900 + avgSpeed * 90);

  const scoreAllround = clamp(tempoAllround * 0.35 + controlReserve * 0.4 + spinPotential * 0.25);
  const scoreOffensive = clamp(tempoOffensive * 0.4 + spinPotential * 0.4 + controlReserve * 0.2);
  const scoreDefensive = clamp(tempoDefensive * 0.3 + controlReserve * 0.55 + spinPotential * 0.15);
  const scoreMaterial = clamp(tempoMaterial * 0.25 + controlReserve * 0.55 + spinPotential * 0.2);

  const playStyleTarget =
    rubber.type !== "smooth" ? "material" :
    avgSpeed >= 8.3 ? "offensive_topspin" :
    avgSpeed <= 6.5 ? "defensive" : "allround";
  const synergyScore =
    playStyleTarget === "offensive_topspin" ? scoreOffensive :
    playStyleTarget === "defensive" ? scoreDefensive :
    playStyleTarget === "material" ? scoreMaterial :
    scoreAllround;

  return { synergyScore, scoreOffensive, scoreAllround, scoreDefensive, scoreMaterial,
    tempoMatch: tempoAllround, controlReserve, spinPotential,
    weightBalance: 75, styleFit: 75, ttrTarget, playStyleTarget };
}

if (newRubberIds.length > 0) {
  const blades = await sql`
    SELECT id, name, speed_norm, control_norm, community_speed, community_control
      FROM blades WHERE is_active = true`;
  console.log(`Aktive Hölzer: ${blades.length}\n`);

  let totalCreated = 0;
  for (const newRubber of newRubberIds) {
    const rubberFull = await sql`SELECT * FROM rubbers WHERE id = ${newRubber.id} LIMIT 1`;
    const rubber = rubberFull[0];

    const rows = blades.map(blade => {
      const s = computeSynergyApprox(blade, rubber);
      return {
        blade_id: blade.id,
        rubber_id: newRubber.id,
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
      };
    });

    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await sql`INSERT INTO synergies ${sql(chunk)} ON CONFLICT DO NOTHING`;
    }
    totalCreated += rows.length;
    console.log(`✓ ${newRubber.name}: ${rows.length} Synergien`);
  }
  console.log(`\nTotal: ${totalCreated} neue Synergien.`);
}

await sql.end();
console.log("\nFertig.");
