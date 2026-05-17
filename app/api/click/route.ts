/**
 * GET /api/click, Affiliate-Click-Tracking + Redirect
 *
 * Query-Params:
 *   shop:  ShopId (amazon | joola | tt-shop)
 *   type:  "blade" | "rubber"
 *   id:    Produkt-DB-ID
 *   s:     Recommendation-Session-ID (optional)
 *
 * Ablauf:
 *   1. Validieren
 *   2. Affiliate-Link generieren (search-basiert)
 *   3. Click in DB loggen (best-effort, nicht blockierend für den Redirect)
 *   4. 302-Redirect zum Shop
 *
 * Datenschutz: Wir speichern KEINE IP, KEINEN vollständigen User-Agent,
 * KEINE Cookies. Nur was nötig ist: was wurde wann geklickt + grobe Geräteart.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blades, rubbers, clicks, shopProducts, shops } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopLinks, SHOPS, type ShopId, type ProductRef } from "@/lib/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SHOPS: ShopId[] = [
  "tt-shop",
  "tischtennis-biz",
  "contra",
  "schoeler-micke",
  "joola",
  "amazon",
];

/** Verkürzt User-Agent auf grobe Kategorie, DSGVO-freundlich, kein Fingerprint. */
function shortenUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPhone|iPad/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Mac/.test(ua)) return "mac";
  if (/Linux/.test(ua)) return "linux";
  return "other";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shop") as ShopId | null;
  const productType = searchParams.get("type") as "blade" | "rubber" | null;
  const productIdRaw = searchParams.get("id");
  const sessionId = searchParams.get("s") ?? null;

  // ---- Validierung ----------------------------------------------------------

  if (!shopId || !VALID_SHOPS.includes(shopId)) {
    return NextResponse.json({ error: "invalid shop" }, { status: 400 });
  }
  if (productType !== "blade" && productType !== "rubber") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  const productId = Number(productIdRaw);
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  // ---- Produkt aus DB laden -------------------------------------------------

  let product: ProductRef | null = null;

  if (productType === "blade") {
    const rows = await db
      .select({
        id: blades.id,
        name: blades.name,
        manufacturerId: blades.manufacturerId,
      })
      .from(blades)
      .where(eq(blades.id, productId))
      .limit(1);
    if (rows.length > 0) {
      // Hersteller-Name nachladen
      const mfg = await db.query.manufacturers.findFirst({
        where: (m, { eq }) => eq(m.id, rows[0]!.manufacturerId),
      });
      product = {
        type: "blade",
        id: rows[0]!.id,
        name: rows[0]!.name,
        manufacturer: mfg?.name ?? "",
      };
    }
  } else {
    const rows = await db
      .select({
        id: rubbers.id,
        name: rubbers.name,
        manufacturerId: rubbers.manufacturerId,
      })
      .from(rubbers)
      .where(eq(rubbers.id, productId))
      .limit(1);
    if (rows.length > 0) {
      const mfg = await db.query.manufacturers.findFirst({
        where: (m, { eq }) => eq(m.id, rows[0]!.manufacturerId),
      });
      product = {
        type: "rubber",
        id: rows[0]!.id,
        name: rows[0]!.name,
        manufacturer: mfg?.name ?? "",
      };
    }
  }

  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  // ---- Affiliate-Link erzeugen ---------------------------------------------
  // Priorität: direkter Produkt-Link aus shop_products (vom Feed-Sync), fällt
  // sonst zurück auf generierten Such-Link. Direkter Link konvertiert
  // deutlich besser (Cookie sofort, User landet auf dem Produkt).

  const shopDomain = SHOPS[shopId]?.domain;
  let directUrl: string | null = null;
  if (shopDomain) {
    const direct = await db
      .select({
        affiliateUrl: shopProducts.affiliateUrl,
        shopProductUrl: shopProducts.shopProductUrl,
      })
      .from(shopProducts)
      .innerJoin(shops, eq(shopProducts.shopId, shops.id))
      .where(
        and(
          eq(shops.domain, shopDomain),
          eq(shopProducts.productType, productType),
          eq(shopProducts.productId, productId),
          eq(shopProducts.isActive, true),
        ),
      )
      .limit(1);
    if (direct.length > 0) {
      directUrl = direct[0].affiliateUrl ?? direct[0].shopProductUrl;
    }
  }

  let finalUrl: string;
  if (directUrl) {
    finalUrl = directUrl;
  } else {
    const links = getShopLinks(product);
    const link = links.find((l) => l.shop.id === shopId);
    if (!link) {
      return NextResponse.json(
        { error: `shop ${shopId} not configured or product not eligible` },
        { status: 400 }
      );
    }
    finalUrl = link.url;
  }

  // ---- Click loggen (best-effort) -------------------------------------------

  const referrer = req.headers.get("referer")?.slice(0, 200) ?? null;
  const userAgent = shortenUserAgent(req.headers.get("user-agent"));

  // Wir warten NICHT auf das DB-Insert, Klick-UX hat Vorrang vor Logging.
  void db
    .insert(clicks)
    .values({
      shopId: shopId,
      productType: productType,
      productId: productId,
      sessionId: sessionId,
      referrer: referrer,
      userAgentShort: userAgent,
    })
    .catch((err) => {
      console.error("[/api/click] DB-Insert fehlgeschlagen:", err);
    });

  // ---- Redirect zum Shop ----------------------------------------------------

  return NextResponse.redirect(finalUrl, { status: 302 });
}
