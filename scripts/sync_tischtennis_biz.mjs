/**
 * Sync Tischtennis.biz Adcell-Produkt-Feed → unsere DB.
 *
 * Quelle:
 *   - Lokale CSV (data/tischtennis-biz-feed.csv) für lokales Testen.
 *   - Per Env-Var FEED_URL kann der Cron-Job die CSV direkt von Adcell holen.
 *
 * Was passiert:
 *   1. CSV parsen (Semikolon, gequotete Felder, deutsche Zahlen)
 *   2. Nur Zeilen mit JOOLA-/Xiom-Belägen oder JOOLA-/Cornilleau-Hölzern
 *   3. Fuzzy-Match auf blades/rubbers per (manufacturer + Name normalisiert)
 *   4. Upsert in shop_products mit affiliate_url, Preis, Verfügbarkeit
 *   5. Append in prices-History
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync_tischtennis_biz.mjs
 *   node --env-file=.env.local scripts/sync_tischtennis_biz.mjs --dry-run
 *   node --env-file=.env.local scripts/sync_tischtennis_biz.mjs --feed-url=https://...
 */

import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const FEED_URL_ARG = process.argv.find((a) => a.startsWith("--feed-url="));
const FEED_URL = FEED_URL_ARG ? FEED_URL_ARG.slice("--feed-url=".length) : process.env.TT_BIZ_FEED_URL;

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_CSV = join(__dirname, "..", "data", "tischtennis-biz-feed.csv");

const SHOP_DOMAIN = "tischtennis.biz";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Parsed eine CSV-Zeile mit Semikolon-Trennung und Anführungszeichen. */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ";" && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

/** Deutsches Zahlenformat → Number. "1.049,00" → 1049, "40,41" → 40.41 */
function parseGermanNumber(s) {
  if (!s) return null;
  const cleaned = s.replace(/\./g, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Schlanke Normalisierung für Fuzzy-Matching von Produktnamen. */
function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Bestimmt aus URL/Kategorie ob's ein Belag oder Holz ist (oder unbekannt). */
function classifyProduct(deeplink, hersteller, titel) {
  const u = deeplink.toLowerCase();
  if (u.includes("tischtennisbelaege") || u.includes("belaege/")) return "rubber";
  if (u.includes("tischtennishoelzer") || u.includes("hoelzer/")) return "blade";
  // Fallback aus Titel: "Holz" / "Belag"
  const t = titel.toLowerCase();
  if (t.includes("belag")) return "rubber";
  if (t.includes("holz")) return "blade";
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function loadCsv() {
  if (FEED_URL) {
    console.log(`Lade CSV von ${FEED_URL}...`);
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
    return await res.text();
  }
  console.log(`Lade lokale CSV: ${LOCAL_CSV}`);
  return readFileSync(LOCAL_CSV, "utf-8");
}

const sql = postgres(process.env.DATABASE_URL);

try {
  const csv = await loadCsv();
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);

  const COL = {
    deeplink: header.indexOf("Deeplink"),
    title: header.indexOf("Produkt-Titel"),
    description: header.indexOf("Produktbeschreibung"),
    price: header.indexOf("Preis (Brutto)"),
    currency: header.indexOf("Währung"),
    ean: header.indexOf("europäische Artikelnummer EAN"),
    manufacturer: header.indexOf("Hersteller"),
    imageUrl: header.indexOf("Produktbild-URL"),
    availability: header.indexOf("Verfügbarkeit"),
    deliveryTime: header.indexOf("Lieferzeit"),
  };
  for (const [k, v] of Object.entries(COL)) {
    if (v === -1) throw new Error(`CSV-Header fehlt: ${k}`);
  }

  // Shop-ID
  const shopRows = await sql`SELECT id FROM shops WHERE domain = ${SHOP_DOMAIN} LIMIT 1`;
  if (shopRows.length === 0) throw new Error(`Shop ${SHOP_DOMAIN} nicht in shops-Tabelle`);
  const shopId = shopRows[0].id;

  // Alle Blades + Rubbers für Matching laden (mit Hersteller-Name)
  const blades = await sql`
    SELECT b.id, b.name, m.name AS manufacturer
    FROM blades b
    INNER JOIN manufacturers m ON b.manufacturer_id = m.id
    WHERE b.is_active = true
  `;
  const rubbers = await sql`
    SELECT r.id, r.name, m.name AS manufacturer
    FROM rubbers r
    INNER JOIN manufacturers m ON r.manufacturer_id = m.id
    WHERE r.is_active = true
  `;

  // Index pro Hersteller → Map(normalizedName → id)
  const bladeIdx = new Map();
  const rubberIdx = new Map();
  for (const b of blades) {
    const mfg = b.manufacturer.toLowerCase();
    if (!bladeIdx.has(mfg)) bladeIdx.set(mfg, new Map());
    bladeIdx.get(mfg).set(normalizeName(b.name), b.id);
  }
  for (const r of rubbers) {
    const mfg = r.manufacturer.toLowerCase();
    if (!rubberIdx.has(mfg)) rubberIdx.set(mfg, new Map());
    rubberIdx.get(mfg).set(normalizeName(r.name), r.id);
  }

  const stats = {
    total: 0,
    skippedNotProduct: 0,
    skippedNoMatch: 0,
    matchedBlades: 0,
    matchedRubbers: 0,
    upserted: 0,
    priceRowsAppended: 0,
  };
  const unmatched = [];
  const now = new Date();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < header.length) continue;
    stats.total++;

    const deeplink = fields[COL.deeplink];
    const title = fields[COL.title];
    const priceStr = fields[COL.price];
    const manufacturer = fields[COL.manufacturer];
    const availability = fields[COL.availability];

    if (!deeplink || !title || !manufacturer) {
      stats.skippedNotProduct++;
      continue;
    }

    const productType = classifyProduct(deeplink, manufacturer, title);
    if (!productType) {
      stats.skippedNotProduct++;
      continue;
    }

    // Match: Hersteller + normalisierter Name. Wir versuchen sowohl den Titel
    // direkt als auch ohne Hersteller-Präfix (für Fälle wo unsere DB ohne
    // Marke speichert).
    const mfg = manufacturer.toLowerCase();
    const idx = productType === "blade" ? bladeIdx.get(mfg) : rubberIdx.get(mfg);
    if (!idx) {
      stats.skippedNoMatch++;
      continue;
    }

    const normTitle = normalizeName(title);
    const normTitleNoMfg = normalizeName(title.replace(new RegExp(`^${manufacturer}\\s*`, "i"), ""));

    let productId = idx.get(normTitle) ?? idx.get(normTitleNoMfg);
    // Letzte Chance: substring-Match
    if (!productId) {
      for (const [k, v] of idx) {
        if (k.length >= 6 && (normTitle.includes(k) || k.includes(normTitleNoMfg))) {
          productId = v;
          break;
        }
      }
    }

    if (!productId) {
      stats.skippedNoMatch++;
      unmatched.push({ type: productType, manufacturer, title });
      continue;
    }

    if (productType === "blade") stats.matchedBlades++;
    else stats.matchedRubbers++;

    const price = parseGermanNumber(priceStr);
    const deliveryTime = fields[COL.deliveryTime] ?? "";
    const stockText = `${availability} ${deliveryTime}`.toLowerCase();
    const inStock =
      stockText.includes("sofort lieferbar") ||
      stockText.includes("lieferbar") ||
      stockText.includes("auf lager");

    if (DRY_RUN) {
      console.log(`  [dry] ${productType.padEnd(6)} #${productId.toString().padStart(4)} ${manufacturer} ${title} → ${price ?? "?"}€ (${inStock ? "✓" : "✗"})`);
      continue;
    }

    // Upsert shop_products
    const inserted = await sql`
      INSERT INTO shop_products (
        shop_id, product_type, product_id,
        shop_product_url, affiliate_url,
        latest_price, latest_in_stock, last_synced_at,
        is_active
      ) VALUES (
        ${shopId}, ${productType}, ${productId},
        ${deeplink}, ${deeplink},
        ${price}, ${inStock}, ${now},
        true
      )
      ON CONFLICT (shop_id, product_type, product_id) DO UPDATE SET
        shop_product_url = EXCLUDED.shop_product_url,
        affiliate_url = EXCLUDED.affiliate_url,
        latest_price = EXCLUDED.latest_price,
        latest_in_stock = EXCLUDED.latest_in_stock,
        last_synced_at = EXCLUDED.last_synced_at,
        is_active = true
      RETURNING id
    `;
    stats.upserted++;

    // Preis-History (nur wenn Preis vorhanden und Wert oder Stock sich
    // geändert hat — sonst wird's irgendwann aufgebläht).
    if (price != null) {
      const last = await sql`
        SELECT price, in_stock FROM prices
        WHERE shop_product_id = ${inserted[0].id}
        ORDER BY scraped_at DESC LIMIT 1
      `;
      const changed = last.length === 0 || Number(last[0].price) !== price || last[0].in_stock !== inStock;
      if (changed) {
        await sql`
          INSERT INTO prices (shop_product_id, price, in_stock, scraped_at)
          VALUES (${inserted[0].id}, ${price}, ${inStock}, ${now})
        `;
        stats.priceRowsAppended++;
      }
    }
  }

  console.log("\n═══ Tischtennis.biz Sync ═══");
  console.log(`Zeilen gesamt:       ${stats.total}`);
  console.log(`  davon kein Holz/Belag: ${stats.skippedNotProduct}`);
  console.log(`  davon nicht gematcht:  ${stats.skippedNoMatch}`);
  console.log(`Hölzer gematcht:     ${stats.matchedBlades}`);
  console.log(`Beläge gematcht:     ${stats.matchedRubbers}`);
  console.log(`Upserts:             ${stats.upserted}`);
  console.log(`Preis-History +:     ${stats.priceRowsAppended}`);
  if (DRY_RUN) console.log("(DRY-RUN, nichts geschrieben.)");
  if (unmatched.length > 0 && unmatched.length <= 25) {
    console.log("\nNicht gematcht (Sample):");
    for (const u of unmatched.slice(0, 25)) {
      console.log(`  - ${u.type} ${u.manufacturer} "${u.title}"`);
    }
  } else if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} nicht gematcht (zu viele zum Anzeigen).`);
  }
} finally {
  await sql.end();
}
