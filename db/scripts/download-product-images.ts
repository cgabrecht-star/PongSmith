/**
 * Lädt Produktbilder von Hersteller-Seiten und speichert sie lokal.
 *
 * Quelle: manufacturerUrl aus den Research-JSON-Dateien.
 * Strategie pro Produkt:
 *   1. Wenn bereits lokales Bild (/products/...) → überspringen
 *   2. Hersteller-Seite per Playwright laden
 *   3. Hauptbild finden (in dieser Reihenfolge):
 *      - og:image Meta-Tag
 *      - twitter:image Meta-Tag
 *      - JSON-LD product schema "image"
 *      - größtes <img> in <main>/<article>/<body>
 *   4. Bild downloaden mit Referer-Header (Hotlinking-Schutz umgehen)
 *   5. Speichern in public/products/{slug}.{ext}
 *   6. DB-imageUrl aktualisieren auf /products/{slug}.{ext}
 *
 * Usage: npm run db:download-images
 *        npm run db:download-images -- --slug butterfly-tenergy-05  (nur ein Produkt)
 *        npm run db:download-images -- --force                       (alle erneut)
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

chromium.use(StealthPlugin());

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");
const RESEARCH_DIR = path.join(process.cwd(), "db", "data", "research");
const DELAY = 1500;

// ─── Typen ──────────────────────────────────────────────────────────────────

interface ResearchEntry {
  slug: string;
  manufacturerUrl?: string | null;
  imageUrl?: string | null;
}

// ─── Hilfen ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadResearchEntries(): Promise<Map<string, ResearchEntry>> {
  const map = new Map<string, ResearchEntry>();
  const files = (await fs.readdir(RESEARCH_DIR)).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(RESEARCH_DIR, file), "utf-8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const entry of arr) {
          if (entry?.slug) map.set(entry.slug, entry);
        }
      }
    } catch {/* skip */}
  }
  return map;
}

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("svg")) return "svg";
  return "jpg";
}

function extFromUrl(url: string): string | null {
  const m = url.match(/\.(jpe?g|png|webp|gif|svg)(?:\?|$)/i);
  return m ? m[1]!.toLowerCase().replace("jpeg", "jpg") : null;
}

/**
 * Findet die wahrscheinlichste Produkt-Bild-URL auf der Seite.
 */
async function findProductImage(page: import("playwright").Page): Promise<string | null> {
  return page.evaluate(() => {
    // 1. Open Graph
    const og = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (og) return og;

    // 2. Twitter Card
    const tw = document.querySelector('meta[name="twitter:image"]')?.getAttribute("content")
            ?? document.querySelector('meta[property="twitter:image"]')?.getAttribute("content");
    if (tw) return tw;

    // 3. JSON-LD Product Schema
    const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of ldScripts) {
      try {
        const json = JSON.parse(script.textContent ?? "{}");
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            const img = item.image;
            if (typeof img === "string") return img;
            if (Array.isArray(img) && img.length > 0) return typeof img[0] === "string" ? img[0] : img[0]?.url;
            if (img?.url) return img.url;
          }
        }
      } catch {/* skip */}
    }

    // 4. Größtes Bild im Hauptinhalt
    const candidates = Array.from(document.querySelectorAll(
      "article img, main img, [class*='product'] img, [class*='Product'] img, [id*='product'] img"
    )) as HTMLImageElement[];
    let best: { url: string; area: number } | null = null;
    for (const img of candidates) {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const area = w * h;
      const src = img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
      if (src && area > 40000 && (!best || area > best.area)) {
        best = { url: src, area };
      }
    }
    return best?.url ?? null;
  });
}

async function downloadImage(imageUrl: string, refererUrl: string, outPath: string): Promise<{ ok: boolean; ext?: string; reason?: string }> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": refererUrl,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };

    const ct = res.headers.get("content-type");
    if (!ct?.startsWith("image/")) return { ok: false, reason: `Kein Bild (${ct})` };

    const ext = extFromUrl(imageUrl) ?? extFromContentType(ct);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) return { ok: false, reason: `Zu klein (${buf.length} bytes)` };

    const finalPath = outPath + "." + ext;
    await fs.writeFile(finalPath, buf);
    return { ok: true, ext };
  } catch (err) {
    return { ok: false, reason: (err as Error).message.substring(0, 80) };
  }
}

// ─── Haupt-Logik ────────────────────────────────────────────────────────────

interface ProductRow {
  slug: string;
  imageUrl: string | null;
  kind: "rubber" | "blade";
}

async function main() {
  const args = process.argv.slice(2);
  const slugFilter = args.indexOf("--slug") >= 0 ? args[args.indexOf("--slug") + 1] : null;
  const force = args.includes("--force");

  console.log("=== Produkt-Bilder herunterladen ===\n");

  await fs.mkdir(PRODUCTS_DIR, { recursive: true });

  // Recherche-Daten laden
  const research = await loadResearchEntries();
  console.log(`${research.size} Recherche-Einträge geladen.\n`);

  // DB: Beläge + Hölzer
  const dbRubbers = await db.select({ slug: rubbers.slug, imageUrl: rubbers.imageUrl }).from(rubbers);
  const dbBlades = await db.select({ slug: blades.slug, imageUrl: blades.imageUrl }).from(blades);

  let products: ProductRow[] = [
    ...dbRubbers.map((r): ProductRow => ({ slug: r.slug, imageUrl: r.imageUrl, kind: "rubber" })),
    ...dbBlades.map((b): ProductRow => ({ slug: b.slug, imageUrl: b.imageUrl, kind: "blade" })),
  ];

  if (slugFilter) {
    products = products.filter((p) => p.slug === slugFilter);
    if (products.length === 0) { console.error(`✗ Slug nicht gefunden: ${slugFilter}`); process.exit(1); }
  }

  // Bereits lokal vorhandene überspringen (außer --force)
  if (!force) {
    products = products.filter((p) => !p.imageUrl?.startsWith("/products/"));
  }

  // Nur die mit manufacturerUrl bearbeiten
  const todo = products.filter((p) => research.get(p.slug)?.manufacturerUrl);

  console.log(`${products.length} Produkte zu prüfen, ${todo.length} mit manufacturerUrl in Recherche.\n`);

  if (todo.length === 0) {
    console.log("Nichts zu tun.");
    process.exit(0);
  }

  // Browser starten
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "de-DE",
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: {
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });

  let success = 0;
  let failed = 0;
  const failures: { slug: string; reason: string }[] = [];

  try {
    for (let i = 0; i < todo.length; i++) {
      const product = todo[i]!;
      const entry = research.get(product.slug)!;
      const url = entry.manufacturerUrl!;

      process.stdout.write(`[${i + 1}/${todo.length}] ${product.slug}... `);

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        // Lazy-loaded Bilder triggern
        await page.evaluate(() => window.scrollTo(0, 400));
        await sleep(800);

        const imgUrl = await findProductImage(page);
        if (!imgUrl) {
          console.log("✗ kein Bild gefunden");
          failures.push({ slug: product.slug, reason: "Kein Bild auf Seite gefunden" });
          failed++;
          continue;
        }

        // Relative URLs absolut machen
        const absoluteUrl = new URL(imgUrl, url).href;

        const outBase = path.join(PRODUCTS_DIR, product.slug);
        const result = await downloadImage(absoluteUrl, url, outBase);

        if (!result.ok) {
          console.log(`✗ Download: ${result.reason}`);
          failures.push({ slug: product.slug, reason: result.reason ?? "unbekannt" });
          failed++;
          continue;
        }

        // DB aktualisieren
        const localUrl = `/products/${product.slug}.${result.ext!}`;
        if (product.kind === "rubber") {
          await db.update(rubbers).set({ imageUrl: localUrl }).where(eq(rubbers.slug, product.slug));
        } else {
          await db.update(blades).set({ imageUrl: localUrl }).where(eq(blades.slug, product.slug));
        }
        console.log(`✓ ${result.ext!.toUpperCase()}`);
        success++;
      } catch (err) {
        const msg = (err as Error).message.substring(0, 80);
        console.log(`✗ ${msg}`);
        failures.push({ slug: product.slug, reason: msg });
        failed++;
      } finally {
        try { await page.close(); } catch {/* */}
      }

      await sleep(DELAY);
    }
  } finally {
    await browser.close();
  }

  console.log("\n══════════════════════════════");
  console.log(`  Erfolgreich:  ${success}`);
  console.log(`  Fehlgeschlagen: ${failed}`);

  if (failures.length > 0) {
    console.log("\nNicht heruntergeladen:");
    failures.forEach((f) => console.log(`  - ${f.slug}: ${f.reason}`));
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
