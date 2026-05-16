/**
 * Import-Skript für gescrapte Marken-JSONs aus data/scraped/.
 *
 * Verhalten:
 *  - Bestehende Produkte (Match auf name): UPDATE fehlender Felder.
 *    Nichts überschreiben was schon da ist (außer Preis-Update wenn UVP fehlt).
 *  - Neue Produkte: INSERT mit is_manually_curated = true.
 *  - Synergies werden für NEU eingefügte Produkte automatisch berechnet.
 *
 * Aufruf:
 *   node --env-file=.env.local scripts/import_scraped.mjs --dry-run
 *   node --env-file=.env.local scripts/import_scraped.mjs            # echter Import
 *   node --env-file=.env.local scripts/import_scraped.mjs --only=donic  # nur eine Marke
 */
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const SCRAPED_DIR = "data/scraped";
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = args.find(a => a.startsWith("--only="))?.split("=")[1]?.toLowerCase();

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

console.log(DRY_RUN ? "═══ DRY-RUN ═══ (keine Schreib-Operationen)" : "═══ ECHTER IMPORT ═══");
console.log(ONLY ? `Marken-Filter: ${ONLY}` : "Alle Marken in data/scraped/");
console.log("");

// ─── Manufacturer-Cache ─────────────────────────────────────────────────
const mfgRows = await sql`SELECT id, name FROM manufacturers`;
const mfgMap = new Map(mfgRows.map(r => [r.name.toLowerCase(), r.id]));

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function getOrCreateManufacturer(name) {
  const key = name.toLowerCase();
  if (mfgMap.has(key)) return mfgMap.get(key);
  if (DRY_RUN) {
    console.log(`  [dry] würde Hersteller erstellen: ${name}`);
    return -1;
  }
  const slug = slugify(name);
  const [created] = await sql`
    INSERT INTO manufacturers (name, slug) VALUES (${name}, ${slug})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
  mfgMap.set(key, created.id);
  console.log(`  + Neuer Hersteller: ${name}`);
  return created.id;
}

// ─── Synergie-Approximation ──────────────────────────────────────────────
function computeSynergyApprox(blade, rubber) {
  const bs = parseFloat(blade.community_speed ?? blade.speed_norm ?? 7);
  const bc = parseFloat(blade.community_control ?? blade.control_norm ?? 7);
  const rs = parseFloat(rubber.community_speed ?? rubber.speed_norm ?? 7);
  const rsp = parseFloat(rubber.community_spin ?? rubber.spin_norm ?? 7);
  const rc = parseFloat(rubber.community_control ?? rubber.control_norm ?? 7);
  const avgSpeed = (bs + rs) / 2;
  const avgControl = (bc + rc) / 2;
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
  const tempoAll = clamp(100 - Math.abs(avgSpeed - 7.5) * 12);
  const tempoOff = clamp(100 - Math.abs(avgSpeed - 8.7) * 12);
  const tempoDef = clamp(100 - Math.abs(avgSpeed - 6.5) * 12);
  const tempoMat = clamp(100 - Math.abs(avgSpeed - 6.0) * 12);
  const ctrlRes = clamp(avgControl * 10);
  const spinPot = clamp(rsp * 9 + bs * 2);
  const ttr = Math.round(900 + avgSpeed * 90);
  const sAll = clamp(tempoAll * 0.35 + ctrlRes * 0.4 + spinPot * 0.25);
  const sOff = clamp(tempoOff * 0.4 + spinPot * 0.4 + ctrlRes * 0.2);
  const sDef = clamp(tempoDef * 0.3 + ctrlRes * 0.55 + spinPot * 0.15);
  const sMat = clamp(tempoMat * 0.25 + ctrlRes * 0.55 + spinPot * 0.2);
  const style = rubber.type !== "smooth" ? "material" :
    avgSpeed >= 8.3 ? "offensive_topspin" :
    avgSpeed <= 6.5 ? "defensive" : "allround";
  const score = style === "offensive_topspin" ? sOff :
    style === "defensive" ? sDef : style === "material" ? sMat : sAll;
  return {
    synergy_score: score, score_offensive: sOff, score_allround: sAll,
    score_defensive: sDef, score_material: sMat, tempo_match: tempoAll,
    control_reserve: ctrlRes, spin_potential: spinPot,
    weight_balance: 75, style_fit: 75, ttr_target: ttr, play_style_target: style,
  };
}

// ─── Speed-Normalisierung von Hersteller-Skala auf 1-10 ─────────────────
function normSpeed(raw, scale) {
  if (raw == null || scale == null) return null;
  const n = Math.min((raw / scale) * 10, 10);
  return n.toFixed(1);
}

// ─── Verarbeitet einen Eintrag ──────────────────────────────────────────
const stats = { brands: 0, bladesInserted: 0, bladesUpdated: 0, rubbersInserted: 0, rubbersUpdated: 0, synergies: 0, skipped: 0 };
const newBladeIds = [];
const newRubberIds = [];

async function importProduct(p, brandName) {
  if (p.type === "blade") return importBlade(p, brandName);
  if (p.type === "rubber") return importRubber(p, brandName);
  console.log(`  ? unbekannter type: ${p.name}`);
  stats.skipped++;
}

/** Brand-Prefix sicherstellen: "Stratus Powerwood" + brand "Tibhar"
 *  → "Tibhar Stratus Powerwood". Wenn schon enthalten: unverändert. */
function canonicalName(name, brand) {
  const n = name.trim();
  if (n.toLowerCase().startsWith(brand.toLowerCase())) return n;
  return `${brand} ${n}`;
}

/** Fuzzy-Slug: ignoriert alle Trennzeichen + Leerzeichen für Match.
 *  "tibhar-stratus-power-wood" === "tibhar-stratus-powerwood" (beide → tibharstratuspowerwood) */
function fuzzySlug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

async function findExisting(table, name, brand) {
  const cName = canonicalName(name, brand);
  const slug = slugify(cName);
  const fuzzy = fuzzySlug(cName);
  // 1. exakter Match
  const exact = await sql`SELECT * FROM ${sql(table)} WHERE name = ${cName} OR slug = ${slug} LIMIT 1`;
  if (exact.length > 0) return exact[0];
  // 2. Fuzzy-Match: alle aktiven Einträge dieses Herstellers durchgehen
  // (klein genug pro Marke, kein Perf-Issue)
  const mfgId = mfgMap.get(brand.toLowerCase());
  if (!mfgId) return null;
  const candidates = await sql`SELECT * FROM ${sql(table)} WHERE manufacturer_id = ${mfgId} AND is_active = true`;
  return candidates.find(c => fuzzySlug(c.name) === fuzzy) ?? null;
}

async function importBlade(p, brandName) {
  const cName = canonicalName(p.name, brandName);
  const slug = slugify(cName);
  const existingRow = await findExisting("blades", p.name, brandName);
  const existing = existingRow ? [existingRow] : [];
  const b = p.blade ?? {};
  const speedNorm = b.speedRaw != null ? normSpeed(b.speedRaw, b.speedScale ?? 10) : null;
  const ctrlNorm = b.controlRaw != null ? normSpeed(b.controlRaw, b.speedScale ?? 10) : null;

  if (existing.length > 0) {
    const ex = existing[0];
    const updates = {};
    if (!ex.composition && b.composition) updates.composition = b.composition;
    if (!ex.stiffness && b.stiffness) updates.stiffness = b.stiffness;
    if (!ex.layers && b.layers) updates.layers = b.layers;
    if (!ex.weight_min && b.weightAvgGrams) {
      updates.weight_min = Math.max(60, b.weightAvgGrams - 4);
      updates.weight_max = b.weightAvgGrams + 4;
    }
    if (!ex.price_eur && p.uvpEur != null) updates.price_eur = p.uvpEur;
    if (!ex.image_url && p.imageUrl) updates.image_url = p.imageUrl;
    if (!ex.description && p.descriptionDe) updates.description = p.descriptionDe;
    if (Object.keys(updates).length === 0) { stats.skipped++; return; }
    if (DRY_RUN) {
      console.log(`  [dry] UPDATE blade ${p.name}: ${Object.keys(updates).join(", ")}`);
    } else {
      await sql`UPDATE blades SET ${sql(updates)}, updated_at = NOW() WHERE id = ${ex.id}`;
    }
    stats.bladesUpdated++;
    return;
  }

  // NEU
  const mfgId = await getOrCreateManufacturer(brandName);
  if (mfgId === -1) { stats.skipped++; return; }
  if (DRY_RUN) {
    console.log(`  [dry] INSERT blade ${p.name} (${b.composition ?? "-"}, ${p.uvpEur ?? "k.A."}€)`);
    stats.bladesInserted++;
    return;
  }
  const [inserted] = await sql`
    INSERT INTO blades (
      manufacturer_id, name, slug,
      speed_norm, control_norm, community_speed, community_control, community_review_count,
      composition, stiffness, layers, weight_min, weight_max,
      play_style, ttr_min, ttr_max, ttr_optimal,
      price_eur, image_url, description,
      is_active, is_manually_curated
    ) VALUES (
      ${mfgId}, ${cName}, ${slug},
      ${speedNorm}, ${ctrlNorm}, ${speedNorm}, ${ctrlNorm}, 0,
      ${b.composition ?? null}, ${b.stiffness ?? null}, ${b.layers ?? null},
      ${b.weightAvgGrams ? Math.max(60, b.weightAvgGrams - 4) : null},
      ${b.weightAvgGrams ? b.weightAvgGrams + 4 : null},
      ${(p.category ?? "").includes("ALL") ? "allround" : (p.category ?? "").includes("DEF") ? "defensive" : "offensive_topspin"},
      1100, 1700, 1400,
      ${p.uvpEur ?? null}, ${p.imageUrl ?? null}, ${p.descriptionDe ?? null},
      true, true
    )
    RETURNING id, name`;
  newBladeIds.push(inserted.id);
  stats.bladesInserted++;
}

async function importRubber(p, brandName) {
  const cName = canonicalName(p.name, brandName);
  const slug = slugify(cName);
  const existingRow = await findExisting("rubbers", p.name, brandName);
  const existing = existingRow ? [existingRow] : [];
  const r = p.rubber ?? {};
  const speedNorm = r.speedRaw != null ? normSpeed(r.speedRaw, r.speedScale ?? 10) : null;
  const spinNorm = r.spinRaw != null ? normSpeed(r.spinRaw, r.speedScale ?? 10) : null;
  const ctrlNorm = r.controlRaw != null ? normSpeed(r.controlRaw, r.speedScale ?? 10) : null;

  if (existing.length > 0) {
    const ex = existing[0];
    const updates = {};
    if (!ex.topsheet_character && r.topsheetCharacter) updates.topsheet_character = r.topsheetCharacter;
    if (!ex.hardness_min && (r.hardnessMin != null ? Math.round(r.hardnessMin) : null)) {
      updates.hardness_min = (r.hardnessMin != null ? Math.round(r.hardnessMin) : null);
      updates.hardness_max = (r.hardnessMax != null ? Math.round(r.hardnessMax) : null) ?? (r.hardnessMin != null ? Math.round(r.hardnessMin) : null);
    }
    if (!ex.price_eur && p.uvpEur != null) updates.price_eur = p.uvpEur;
    if (!ex.image_url && p.imageUrl) updates.image_url = p.imageUrl;
    if (!ex.description && p.descriptionDe) updates.description = p.descriptionDe;
    if (Object.keys(updates).length === 0) { stats.skipped++; return; }
    if (DRY_RUN) {
      console.log(`  [dry] UPDATE rubber ${p.name}: ${Object.keys(updates).join(", ")}`);
    } else {
      await sql`UPDATE rubbers SET ${sql(updates)}, updated_at = NOW() WHERE id = ${ex.id}`;
    }
    stats.rubbersUpdated++;
    return;
  }

  // NEU
  const mfgId = await getOrCreateManufacturer(brandName);
  if (mfgId === -1) { stats.skipped++; return; }
  if (DRY_RUN) {
    console.log(`  [dry] INSERT rubber ${p.name} (${r.topsheetCharacter ?? "-"}, ${p.uvpEur ?? "k.A."}€)`);
    stats.rubbersInserted++;
    return;
  }
  const [inserted] = await sql`
    INSERT INTO rubbers (
      manufacturer_id, name, slug, type,
      speed_norm, spin_norm, control_norm,
      community_speed, community_spin, community_control, community_review_count,
      topsheet_character, hardness_min, hardness_max,
      ttr_min, ttr_max, ttr_optimal,
      price_eur, image_url, description,
      is_active, is_manually_curated
    ) VALUES (
      ${mfgId}, ${cName}, ${slug}, ${r.rubberType ?? "smooth"},
      ${speedNorm}, ${spinNorm}, ${ctrlNorm},
      ${speedNorm}, ${spinNorm}, ${ctrlNorm}, 0,
      ${r.topsheetCharacter ?? null}, ${(r.hardnessMin != null ? Math.round(r.hardnessMin) : null) ?? null}, ${(r.hardnessMax != null ? Math.round(r.hardnessMax) : null) ?? (r.hardnessMin != null ? Math.round(r.hardnessMin) : null) ?? null},
      1100, 1700, 1400,
      ${p.uvpEur ?? null}, ${p.imageUrl ?? null}, ${p.descriptionDe ?? null},
      true, true
    )
    RETURNING id, name`;
  newRubberIds.push(inserted.id);
  stats.rubbersInserted++;
}

// ─── Synergies für neu eingefügte Produkte ──────────────────────────────
async function generateSynergiesForNew() {
  if (DRY_RUN || (newBladeIds.length === 0 && newRubberIds.length === 0)) return;

  // Für neue Hölzer × alle aktiven smooth-Beläge
  if (newBladeIds.length > 0) {
    const rubbers = await sql`SELECT id, name, type, speed_norm, spin_norm, control_norm,
      community_speed, community_spin, community_control FROM rubbers WHERE is_active = true AND type = 'smooth'`;
    console.log(`\nGeneriere Synergies für ${newBladeIds.length} neue Hölzer × ${rubbers.length} Beläge...`);
    for (const bId of newBladeIds) {
      const [blade] = await sql`SELECT id, speed_norm, control_norm, community_speed, community_control FROM blades WHERE id = ${bId}`;
      const rows = rubbers.map(rubber => {
        const s = computeSynergyApprox(blade, rubber);
        return { blade_id: bId, rubber_id: rubber.id, ...s };
      });
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await sql`INSERT INTO synergies ${sql(rows.slice(i, i + CHUNK))} ON CONFLICT DO NOTHING`;
      }
      stats.synergies += rows.length;
    }
  }

  // Für neue Beläge × alle aktiven Hölzer
  if (newRubberIds.length > 0) {
    const blades = await sql`SELECT id, name, speed_norm, control_norm, community_speed, community_control
      FROM blades WHERE is_active = true`;
    console.log(`Generiere Synergies für ${newRubberIds.length} neue Beläge × ${blades.length} Hölzer...`);
    for (const rId of newRubberIds) {
      const [rubber] = await sql`SELECT id, type, speed_norm, spin_norm, control_norm,
        community_speed, community_spin, community_control FROM rubbers WHERE id = ${rId}`;
      const rows = blades.map(blade => {
        const s = computeSynergyApprox(blade, rubber);
        return { blade_id: blade.id, rubber_id: rId, ...s };
      });
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await sql`INSERT INTO synergies ${sql(rows.slice(i, i + CHUNK))} ON CONFLICT DO NOTHING`;
      }
      stats.synergies += rows.length;
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────
const files = (await fs.readdir(SCRAPED_DIR)).filter(f => f.endsWith(".json"));
for (const file of files) {
  const brandSlug = file.replace(".json", "").toLowerCase();
  if (ONLY && brandSlug !== ONLY) continue;

  const raw = await fs.readFile(path.join(SCRAPED_DIR, file), "utf8");
  const data = JSON.parse(raw);
  const meta = data[0]?._meta ?? {};
  const brandName = meta.marke ?? brandSlug;
  const products = data.slice(1);

  console.log(`\n━━━ ${brandName} (${products.length} Produkte) ━━━`);
  stats.brands++;
  for (const p of products) {
    await importProduct(p, brandName);
  }
}

await generateSynergiesForNew();

console.log("\n═══ ZUSAMMENFASSUNG ═══");
console.log(`Marken verarbeitet:    ${stats.brands}`);
console.log(`Hölzer neu eingefügt:  ${stats.bladesInserted}`);
console.log(`Hölzer geupdated:      ${stats.bladesUpdated}`);
console.log(`Beläge neu eingefügt:  ${stats.rubbersInserted}`);
console.log(`Beläge geupdated:      ${stats.rubbersUpdated}`);
console.log(`Übersprungen (keine Änderung): ${stats.skipped}`);
console.log(`Neue Synergie-Einträge: ${stats.synergies}`);
if (DRY_RUN) console.log("\n(DRY-RUN, nichts wurde wirklich geschrieben.)");

await sql.end();
