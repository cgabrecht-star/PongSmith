/**
 * Affiliate-Link-Generator
 *
 * Strategie: Search-Deeplinks statt Produkt-URL-Mapping.
 * Wir generieren on-the-fly Such-Links zu den Shops — funktioniert für alle
 * Produkte sofort, kein manuelles Mapping nötig.
 *
 * - Amazon: Suche mit Produktname + Tracking-Tag
 * - Awin/JOOLA: JOOLA-Suche, gewrapped in Awin-Tracking-URL
 * - Adcell/TT-Shop: Slot vorhanden, Aktivierung sobald Adcell-Bewerbung durch ist
 */

// ---------------------------------------------------------------------------
// Konfiguration aus ENV
// ---------------------------------------------------------------------------

const AMAZON_TAG = process.env.AFFILIATE_AMAZON_TAG ?? "";
const AWIN_PUBLISHER_ID = process.env.AFFILIATE_AWIN_PUBLISHER_ID ?? "";

// Bekannte Awin-Advertiser. Sobald weitere Programme genehmigt werden,
// hier ergänzen — Code muss sonst nicht angefasst werden.
const AWIN_ADVERTISERS = {
  joola: { id: "101601", domain: "joola.de", name: "JOOLA" },
} as const;

type AwinAdvertiserKey = keyof typeof AWIN_ADVERTISERS;

// ---------------------------------------------------------------------------
// Shop-Definition (für UI + Tracking)
// ---------------------------------------------------------------------------

export type ShopId = "amazon" | "joola" | "tt-shop"; // tt-shop = später via Adcell

export interface ShopMeta {
  id: ShopId;
  name: string;
  active: boolean;
  network: "amazon" | "awin" | "adcell";
  commissionPercent: number; // grobe Schätzung
  cookieDays: number;
}

export const SHOPS: Record<ShopId, ShopMeta> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    active: Boolean(AMAZON_TAG),
    network: "amazon",
    commissionPercent: 4,
    cookieDays: 1,
  },
  joola: {
    id: "joola",
    name: "JOOLA",
    active: Boolean(AWIN_PUBLISHER_ID),
    network: "awin",
    commissionPercent: 5,
    cookieDays: 30,
  },
  "tt-shop": {
    id: "tt-shop",
    name: "TT-Shop",
    active: false, // wird auf true sobald Adcell genehmigt + ID gesetzt
    network: "adcell",
    commissionPercent: 8,
    cookieDays: 30,
  },
};

// ---------------------------------------------------------------------------
// Marken-Erkennung — welche Marken passen zu welchem Shop?
// ---------------------------------------------------------------------------

/** JOOLA-Suche bei JOOLA selbst macht nur Sinn für JOOLA-Produkte. */
function isJoolaProduct(manufacturer: string): boolean {
  return manufacturer.trim().toLowerCase() === "joola";
}

// ---------------------------------------------------------------------------
// Link-Generatoren
// ---------------------------------------------------------------------------

/**
 * Amazon-Suchlink mit Tracking-Tag.
 * Amazon credits ALLES was der User in 24h kauft — auch andere Produkte als das gesuchte.
 */
function buildAmazonSearchLink(productName: string, manufacturer?: string): string | null {
  if (!AMAZON_TAG) return null;
  // Hersteller nur voranstellen wenn er nicht bereits im Produktnamen vorkommt
  // (z.B. "Butterfly Tenergy 05" → nicht "Butterfly Butterfly Tenergy 05")
  const nameLower = productName.toLowerCase();
  const mfgLower = (manufacturer ?? "").toLowerCase().trim();
  const needsMfg = mfgLower && !nameLower.includes(mfgLower);
  const query = needsMfg ? `${manufacturer} ${productName}` : productName;
  const encoded = encodeURIComponent(query);
  return `https://www.amazon.de/s?k=${encoded}&tag=${AMAZON_TAG}`;
}

/**
 * Awin-Deeplink zu einer Ziel-URL des Advertisers.
 * Format: https://www.awin1.com/cread.php?awinmid=ADV_ID&awinaffid=PUB_ID&p=ENCODED_URL
 */
function buildAwinDeeplink(advertiserKey: AwinAdvertiserKey, targetUrl: string): string | null {
  if (!AWIN_PUBLISHER_ID) return null;
  const adv = AWIN_ADVERTISERS[advertiserKey];
  const encoded = encodeURIComponent(targetUrl);
  return `https://www.awin1.com/cread.php?awinmid=${adv.id}&awinaffid=${AWIN_PUBLISHER_ID}&p=${encoded}`;
}

/**
 * JOOLA-Suchlink, gewrapped in Awin-Tracking.
 */
function buildJoolaSearchLink(productName: string): string | null {
  // joola.de Suchpfad — fallback auf Startseite wenn Suche schwach ist
  const targetUrl = `https://www.joola.de/search?q=${encodeURIComponent(productName)}`;
  return buildAwinDeeplink("joola", targetUrl);
}

// ---------------------------------------------------------------------------
// Public API: Shop-Links für ein Produkt generieren
// ---------------------------------------------------------------------------

export interface ProductRef {
  /** "blade" oder "rubber" — für Tracking */
  type: "blade" | "rubber";
  /** DB-ID — für Click-Tracking */
  id: number;
  /** Anzeigename, z.B. "Bluestorm Z1" */
  name: string;
  /** Hersteller, z.B. "Donic" */
  manufacturer: string;
}

export interface ShopLink {
  shop: ShopMeta;
  /** Direkt-URL zum Shop (kann zum Tracking durch /api/click geleitet werden) */
  url: string;
  /** Wie der Link erzeugt wurde — "search" oder "direct" (manuelles Mapping später) */
  linkType: "search" | "direct";
}

/**
 * Liefert alle aktiven Affiliate-Links für ein Produkt, sortiert nach
 * erwartetem Wert (Provision × Cookie-Laufzeit).
 *
 * Reihenfolge: TT-Shop > JOOLA > Amazon
 */
export function getShopLinks(product: ProductRef): ShopLink[] {
  const links: ShopLink[] = [];

  // 1. TT-Shop (Adcell, später) — wird hier ergänzt sobald aktiv
  // if (SHOPS["tt-shop"].active) { ... }

  // 2. JOOLA — nur sinnvoll wenn JOOLA-eigenes Produkt
  if (SHOPS.joola.active && isJoolaProduct(product.manufacturer)) {
    const url = buildJoolaSearchLink(product.name);
    if (url) {
      links.push({ shop: SHOPS.joola, url, linkType: "search" });
    }
  }

  // 3. Amazon — Fallback für alle Produkte
  if (SHOPS.amazon.active) {
    const url = buildAmazonSearchLink(product.name, product.manufacturer);
    if (url) {
      links.push({ shop: SHOPS.amazon, url, linkType: "search" });
    }
  }

  return links;
}

/**
 * Erzeugt eine interne Tracking-URL die durch /api/click läuft.
 * Vorteile: Wir sehen welche Produkte/Shops geklickt werden, der User
 * sieht eine pongsmith.de-URL (Vertrauen), und wir können später Logik
 * dazwischenschalten (A/B, Rate-Limiting, etc.).
 */
export function buildTrackingUrl(opts: {
  shopId: ShopId;
  productType: "blade" | "rubber";
  productId: number;
  /** Recommendation-Session-ID für spätere Conversion-Attribution */
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
