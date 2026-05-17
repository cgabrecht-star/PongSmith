/**
 * Vercel-Cron-Endpoint: zieht den Adcell-Produkt-Feed von tischtennis.biz
 * und aktualisiert shop_products + prices.
 *
 * Geschützt via CRON_SECRET (Vercel setzt automatisch den Header
 * "x-vercel-cron: 1" beim Cron-Trigger, zusätzlich validieren wir
 * "authorization: Bearer <CRON_SECRET>" damit niemand manuell triggern
 * kann).
 *
 * Schedule siehe vercel.json.
 */

import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Max-Duration auf 5 Min, das Sync läuft normal in ~10s aber wir geben Luft.
export const maxDuration = 300;

const SHOP_DOMAIN = "tischtennis.biz";
const FEED_URL = process.env.TT_BIZ_FEED_URL ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
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

function parseGermanNumber(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/\./g, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function classifyProduct(deeplink: string, _hersteller: string, titel: string): "blade" | "rubber" | null {
  const u = deeplink.toLowerCase();
  if (u.includes("tischtennisbelaege") || u.includes("belaege/")) return "rubber";
  if (u.includes("tischtennishoelzer") || u.includes("hoelzer/")) return "blade";
  const t = titel.toLowerCase();
  if (t.includes("belag")) return "rubber";
  if (t.includes("holz")) return "blade";
  return null;
}

export async function GET(req: NextRequest) {
  // Auth: nur Vercel-Cron oder mit korrektem Bearer-Token
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const auth = req.headers.get("authorization");
  const tokenOk = CRON_SECRET && auth === `Bearer ${CRON_SECRET}`;
  if (!isVercelCron && !tokenOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!FEED_URL) {
    return NextResponse.json({ error: "TT_BIZ_FEED_URL not set" }, { status: 500 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const startedAt = Date.now();
  const sql = postgres(process.env.DATABASE_URL);

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Feed fetch failed: ${res.status}` },
        { status: 502 },
      );
    }
    const csv = await res.text();
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 502 });
    }

    const header = parseCsvLine(lines[0]);
    const COL = {
      deeplink: header.indexOf("Deeplink"),
      title: header.indexOf("Produkt-Titel"),
      price: header.indexOf("Preis (Brutto)"),
      manufacturer: header.indexOf("Hersteller"),
      availability: header.indexOf("Verfügbarkeit"),
      deliveryTime: header.indexOf("Lieferzeit"),
    };
    for (const [k, v] of Object.entries(COL)) {
      if (v === -1) {
        return NextResponse.json(
          { error: `CSV header missing: ${k}` },
          { status: 502 },
        );
      }
    }

    const shopRows = await sql`SELECT id FROM shops WHERE domain = ${SHOP_DOMAIN} LIMIT 1`;
    if (shopRows.length === 0) {
      return NextResponse.json({ error: "shop row missing" }, { status: 500 });
    }
    const shopId = shopRows[0].id;

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

    const bladeIdx = new Map<string, Map<string, number>>();
    const rubberIdx = new Map<string, Map<string, number>>();
    for (const b of blades) {
      const mfg = (b.manufacturer as string).toLowerCase();
      if (!bladeIdx.has(mfg)) bladeIdx.set(mfg, new Map());
      bladeIdx.get(mfg)!.set(normalizeName(b.name as string), b.id as number);
    }
    for (const r of rubbers) {
      const mfg = (r.manufacturer as string).toLowerCase();
      if (!rubberIdx.has(mfg)) rubberIdx.set(mfg, new Map());
      rubberIdx.get(mfg)!.set(normalizeName(r.name as string), r.id as number);
    }

    let matched = 0;
    let upserted = 0;
    let priceRowsAppended = 0;
    let unmatched = 0;
    const now = new Date();

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i]);
      if (fields.length < header.length) continue;

      const deeplink = fields[COL.deeplink];
      const title = fields[COL.title];
      const manufacturer = fields[COL.manufacturer];
      if (!deeplink || !title || !manufacturer) continue;

      const productType = classifyProduct(deeplink, manufacturer, title);
      if (!productType) continue;

      const mfg = manufacturer.toLowerCase();
      const idx = productType === "blade" ? bladeIdx.get(mfg) : rubberIdx.get(mfg);
      if (!idx) {
        unmatched++;
        continue;
      }

      const normTitle = normalizeName(title);
      const normTitleNoMfg = normalizeName(title.replace(new RegExp(`^${manufacturer}\\s*`, "i"), ""));
      let productId = idx.get(normTitle) ?? idx.get(normTitleNoMfg);
      if (!productId) {
        for (const [k, v] of idx) {
          if (k.length >= 6 && (normTitle.includes(k) || k.includes(normTitleNoMfg))) {
            productId = v;
            break;
          }
        }
      }
      if (!productId) {
        unmatched++;
        continue;
      }
      matched++;

      const price = parseGermanNumber(fields[COL.price]);
      const stockText = `${fields[COL.availability]} ${fields[COL.deliveryTime]}`.toLowerCase();
      const inStock =
        stockText.includes("sofort lieferbar") ||
        stockText.includes("lieferbar") ||
        stockText.includes("auf lager");

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
      upserted++;

      if (price != null) {
        const last = await sql`
          SELECT price, in_stock FROM prices
          WHERE shop_product_id = ${inserted[0].id}
          ORDER BY scraped_at DESC LIMIT 1
        `;
        const changed =
          last.length === 0 ||
          Number(last[0].price) !== price ||
          last[0].in_stock !== inStock;
        if (changed) {
          await sql`
            INSERT INTO prices (shop_product_id, price, in_stock, scraped_at)
            VALUES (${inserted[0].id}, ${price}, ${inStock}, ${now})
          `;
          priceRowsAppended++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      shop: SHOP_DOMAIN,
      durationMs: Date.now() - startedAt,
      matched,
      unmatched,
      upserted,
      priceRowsAppended,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/sync-tischtennis-biz]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await sql.end();
  }
}
