/**
 * Multi-Shop-Affiliate-Link-Generator.
 *
 * Strategie: Wir verlinken zu ALLEN relevanten DE-TT-Shops, nicht nur zu
 * denen mit denen wir aktuell einen Affiliate-Vertrag haben. Sobald ein
 * Affiliate-Programm aktiv wird (z.B. Adcell-TT-Shop), wird der Link
 * automatisch um den Tracking-Code erweitert.
 *
 * Für nicht-Affiliate-Shops liefern wir saubere Such-URLs ohne Tracking.
 * Diese werden trotzdem durch /api/click geleitet, damit wir intern
 * messen welche Shops am meisten geklickt werden (Daten für künftige
 * Affiliate-Verhandlungen).
 */

const AMAZON_TAG = process.env.AFFILIATE_AMAZON_TAG ?? "";
const AWIN_PUBLISHER_ID = process.env.AFFILIATE_AWIN_PUBLISHER_ID ?? "";

// Awin-Advertiser (Erweitern wenn weitere Awin-Partner kommen)
const AWIN_ADVERTISERS = {
  joola: { id: "101601", domain: "joola.de", name: "JOOLA" },
} as const;

type AwinAdvertiserKey = keyof typeof AWIN_ADVERTISERS;

// ─── Shop-Pool: alle 7 DE-TT-relevanten Shops ─────────────────────────────

export type ShopId =
  | "tt-shop"
  | "tischtennis-biz"
  | "contra"
  | "schoeler-micke"
  | "joola"
  | "amazon";

export interface ShopMeta {
  id: ShopId;
  name: string;
  domain: string;
  /** Wie der Affiliate-Link aktuell zustandekommt */
  affiliate: "amazon" | "awin" | "adcell" | "none";
  /** Aktueller Status — beeinflusst nur die Anzeige (z.B. "Provision aktiv") */
  affiliateActive: boolean;
}

export const SHOPS: Record<ShopId, ShopMeta> = {
  "tt-shop": {
    id: "tt-shop",
    name: "TT-Shop",
    domain: "tt-shop.de",
    affiliate: "adcell",
    affiliateActive: false, // Adcell-Bewerbung ausstehend
  },
  "tischtennis-biz": {
    id: "tischtennis-biz",
    name: "Tischtennis.biz",
    domain: "tischtennis.biz",
    affiliate: "adcell",
    affiliateActive: false,
  },
  contra: {
    id: "contra",
    name: "Contra Sport",
    domain: "contra.de",
    affiliate: "none",
    affiliateActive: false,
  },
  "schoeler-micke": {
    id: "schoeler-micke",
    name: "Schöler+Micke",
    domain: "schoeler-micke.de",
    affiliate: "none",
    affiliateActive: false,
  },
  joola: {
    id: "joola",
    name: "JOOLA",
    domain: "joola.de",
    affiliate: "awin",
    affiliateActive: Boolean(AWIN_PUBLISHER_ID),
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    domain: "amazon.de",
    affiliate: "amazon",
    affiliateActive: Boolean(AMAZON_TAG),
  },
};

/**
 * Reihenfolge in der Shop-Liste:
 * 1. TT-Spezialisten (höchste Conversion bei TT-Produkten)
 * 2. JOOLA (nur JOOLA-Produkte)
 * 3. Amazon (Universal-Fallback, kürzeste Cookie)
 */
export const SHOP_ORDER: ShopId[] = [
  "tt-shop",
  "tischtennis-biz",
  "contra",
  "schoeler-micke",
  "joola",
  "amazon",
];

// ─── URL-Generatoren pro Shop ─────────────────────────────────────────────

function searchQuery(productName: string, manufacturer?: string): string {
  const nameLower = productName.toLowerCase();
  const mfgLower = (manufacturer ?? "").toLowerCase().trim();
  const needsMfg = mfgLower && !nameLower.includes(mfgLower);
  return needsMfg ? `${manufacturer} ${productName}` : productName;
}

function buildSearchUrl(shop: ShopId, productName: string, manufacturer?: string): string | null {
  const query = searchQuery(productName, manufacturer);
  const q = encodeURIComponent(query);

  switch (shop) {
    case "tt-shop":
      return `https://www.tt-shop.de/de/search?text=${q}`;
    case "tischtennis-biz":
      return `https://www.tischtennis.biz/?s=${q}`;
    case "contra":
      return `https://www.contra.de/de/search?sSearch=${q}`;
    case "schoeler-micke":
      return `https://www.schoeler-micke.de/search?q=${q}`;
    case "joola":
      return `https://joola.de/de/search?q=${q}`;
    case "amazon":
      if (!AMAZON_TAG) return null;
      return `https://www.amazon.de/s?k=${q}&tag=${AMAZON_TAG}`;
  }
}

/** Wrappt eine Ziel-URL in einen Awin-Deeplink (nur für aktive Awin-Advertiser). */
function wrapAwinDeeplink(advertiserKey: AwinAdvertiserKey, targetUrl: string): string | null {
  if (!AWIN_PUBLISHER_ID) return null;
  const adv = AWIN_ADVERTISERS[advertiserKey];
  const encoded = encodeURIComponent(targetUrl);
  return `https://www.awin1.com/cread.php?awinmid=${adv.id}&awinaffid=${AWIN_PUBLISHER_ID}&p=${encoded}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface ProductRef {
  type: "blade" | "rubber";
  id: number;
  name: string;
  manufacturer: string;
}

export interface ShopLinkOut {
  shop: ShopMeta;
  /** Finale Ziel-URL (mit Affiliate-Wrap falls vorhanden) */
  url: string;
  /** Wie der Link erzeugt wurde */
  linkType: "search" | "direct";
  /** Hat der User Affiliate-Schutz (== bringt uns Provision)? */
  affiliateActive: boolean;
}

/**
 * Liefert Shop-Links für ein Produkt — eine Liste über alle relevanten
 * DE-TT-Shops. Reihenfolge nach SHOP_ORDER.
 *
 * Regel: JOOLA-Shop wird nur für JOOLA-eigene Produkte verlinkt
 * (sonst Awin-Verlinkung sinnlos).
 */
export function getShopLinks(product: ProductRef): ShopLinkOut[] {
  const out: ShopLinkOut[] = [];

  for (const shopId of SHOP_ORDER) {
    const shop = SHOPS[shopId];

    // JOOLA-Shop nur bei JOOLA-Produkten
    if (shopId === "joola") {
      const isJoola = product.manufacturer.trim().toLowerCase() === "joola";
      if (!isJoola) continue;

      const targetUrl = buildSearchUrl("joola", product.name, product.manufacturer);
      if (!targetUrl) continue;

      // Wenn Awin aktiv: durch Awin-Deeplink wrappen, sonst direkter Link
      const finalUrl = shop.affiliateActive
        ? wrapAwinDeeplink("joola", targetUrl)
        : targetUrl;

      if (finalUrl) {
        out.push({
          shop,
          url: finalUrl,
          linkType: "search",
          affiliateActive: shop.affiliateActive,
        });
      }
      continue;
    }

    // Alle anderen Shops: einfache Such-URL
    const url = buildSearchUrl(shopId, product.name, product.manufacturer);
    if (!url) continue;

    out.push({
      shop,
      url,
      linkType: "search",
      affiliateActive: shop.affiliateActive,
    });
  }

  return out;
}

/**
 * Interne Tracking-URL — durchläuft /api/click bevor sie zum Shop führt.
 * Damit messen wir welche Shops geklickt werden (auch ohne Affiliate),
 * Daten helfen bei künftigen Programm-Verhandlungen.
 */
export function buildTrackingUrl(opts: {
  shopId: ShopId;
  productType: "blade" | "rubber";
  productId: number;
  sessionId?: string;
}): string {
  const params = new URLSearchParams({
    shop: opts.shopId,
    type: opts.productType,
    id: String(opts.productId),
  });
  if (opts.sessionId) params.set("s", opts.sessionId);
  return `/api/click?${params.toString()}`;
}
