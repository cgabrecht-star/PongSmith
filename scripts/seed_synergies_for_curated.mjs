/**
 * Berechnet + insertet Synergien für alle is_manually_curated Hölzer
 * die noch keine Synergien haben.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

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
    avgSpeed >= 8.3 ? "offensive_topspin" :
    avgSpeed <= 6.5 ? "defensive" :
    "allround";

  const synergyScore =
    playStyleTarget === "offensive_topspin" ? scoreOffensive :
    playStyleTarget === "defensive" ? scoreDefensive :
    scoreAllround;

  return { synergyScore, scoreOffensive, scoreAllround, scoreDefensive, scoreMaterial,
    tempoMatch: tempoAllround, controlReserve, spinPotential,
    weightBalance: 75, styleFit: 75, ttrTarget, playStyleTarget };
}

// Hölzer die curated sind aber keine synergies haben
const curatedBlades = await sql`
  SELECT b.id, b.name,
         b.speed_norm, b.control_norm, b.community_speed, b.community_control
    FROM blades b
   WHERE b.is_manually_curated = true
     AND NOT EXISTS (SELECT 1 FROM synergies s WHERE s.blade_id = b.id)`;

console.log(`Curated Hölzer ohne Synergien: ${curatedBlades.length}\n`);

if (curatedBlades.length === 0) {
  await sql.end();
  process.exit(0);
}

const rubbers = await sql`
  SELECT id, name, type,
         speed_norm, spin_norm, control_norm,
         community_speed, community_spin, community_control
    FROM rubbers WHERE is_active = true AND type = 'smooth'`;

console.log(`Smooth-Beläge: ${rubbers.length}\n`);

let totalCreated = 0;
for (const blade of curatedBlades) {
  const rows = rubbers.map(rubber => {
    const s = computeSynergyApprox(blade, rubber);
    return {
      blade_id: blade.id,
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
    };
  });

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await sql`INSERT INTO synergies ${sql(chunk)} ON CONFLICT DO NOTHING`;
  }
  totalCreated += rows.length;
  console.log(`✓ ${blade.name}: ${rows.length} Synergien`);
}

console.log(`\nTotal: ${totalCreated} Synergie-Einträge erstellt.`);
await sql.end();
