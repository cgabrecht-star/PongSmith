/**
 * Erweiterter Bild-Downloader v2 — findet auch Bilder auf Hersteller-Sites die
 * keinen og:image-Meta-Tag haben.
 *
 * Verbesserungen ggü. v1:
 *  - Sammelt ALLE großen <img>-Elemente auf der Seite (nicht nur in main/article)
 *  - Wenn keine Hersteller-URL aus Recherche → versucht Hersteller-Suche-Patterns
 *  - Slug-Match-Heuristik: bevorzugt Bilder deren Dateiname Teile des Slugs enthält
 *  - Filtert Logos, Icons, kleine Thumbnails, Banner aus
 *
 * Usage: npm run db:download-images-v2
 *        npm run db:download-images-v2 -- --slug dr-neubauer-killer
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
const MIN_IMAGE_AREA = 30000; // ~175x175 minimum
const MIN_IMAGE_BYTES = 3000;

interface ResearchEntry {
  slug: string;
  manufacturerUrl?: string | null;
  imageUrl?: string | null;
  manufacturer?: string;
}

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
 * Scoring-Funktion für Bild-Kandidaten.
 * Höher = wahrscheinlicher das Produktbild.
 */
function scoreImage(
  url: string,
  width: number,
  height: number,
  alt: string,
  className: string,
  slugTokens: string[],
): number {
  let score = 0;
  const lower = url.toLowerCase();
  const altLower = alt.toLowerCase();
  const classLower = className.toLowerCase();

  // Größe — größeres Bild = besser, aber nicht zu groß (Banner)
  const area = width * height;
  if (area < MIN_IMAGE_AREA) return -1000;
  if (area > 4_000_000) score -= 30; // wahrscheinlich Banner
  else score += Math.min(40, area / 50000);

  // Slug-Match in URL
  for (const tok of slugTokens) {
    if (tok.length >= 3 && lower.includes(tok)) score += 25;
  }
  // Slug-Match in alt
  for (const tok of slugTokens) {
    if (tok.length >= 3 && altLower.includes(tok)) score += 15;
  }

  // Negativ-Marker — Logo, Icon, Banner etc.
  if (/(logo|icon|favicon|sprite|placeholder|loading|spinner|avatar|banner|hero|background)/i.test(lower)) score -= 60;
  if (/(logo|icon|banner)/i.test(classLower)) score -= 40;

  // Positive Marker — Produkt
  if (/(product|item|article)/i.test(lower)) score += 10;
  if (/(product|item|cover|main)/i.test(classLower)) score += 15;

  // Aspect-Ratio — Produkt-Bilder sind meist quadratisch oder leicht hochformatig
  const aspect = width / height;
  if (aspect >= 0.6 && aspect <= 1.6) score += 15;
  else if (aspect > 3 || aspect < 0.3) score -= 30; // sehr breit/schmal = vermutlich Banner

  return score;
}

async function findBestImage(
  page: import("playwright").Page,
  slug: string,
): Promise<string | null> {
  const tokens = slug.split("-").filter((t) => t.length >= 3);

  // Workaround: page.evaluate mit pageFunction als String — umgeht tsx __name Bug
  return page.evaluate(`(function() {
    const tokens = ${JSON.stringify(tokens)};
    const MIN_AREA = ${MIN_IMAGE_AREA};

    const scoreImg = function(url, w, h, alt, cls) {
      let s = 0;
      const lower = url.toLowerCase();
      const altLower = alt.toLowerCase();
      const classLower = cls.toLowerCase();
      const area = w * h;
      if (area < MIN_AREA) return -1000;
      if (area > 4000000) s -= 30;
      else s += Math.min(40, area / 50000);
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (tok.length >= 3 && lower.indexOf(tok) >= 0) s += 25;
        if (tok.length >= 3 && altLower.indexOf(tok) >= 0) s += 15;
      }
      if (/(logo|icon|favicon|sprite|placeholder|loading|spinner|avatar|banner|hero|background)/i.test(lower)) s -= 60;
      if (/(logo|icon|banner)/i.test(classLower)) s -= 40;
      if (/(product|item|article)/i.test(lower)) s += 10;
      if (/(product|item|cover|main)/i.test(classLower)) s += 15;
      const aspect = w / h;
      if (aspect >= 0.6 && aspect <= 1.6) s += 15;
      else if (aspect > 3 || aspect < 0.3) s -= 30;
      return s;
    };

    const ogEl = document.querySelector('meta[property="og:image"]');
    const og = ogEl ? ogEl.getAttribute("content") : null;

    const allImgs = document.querySelectorAll("img");
    const candidates = [];

    for (let i = 0; i < allImgs.length; i++) {
      const img = allImgs[i];
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 100 || h < 100) continue;
      const src = img.currentSrc || img.src
        || img.getAttribute("data-src") || img.getAttribute("data-lazy-src")
        || img.getAttribute("data-original");
      if (!src) continue;
      const sc = scoreImg(src, w, h, img.alt || "", img.className || "");
      if (sc > 0) candidates.push({ url: src, score: sc });
    }

    if (og) candidates.push({ url: og, score: scoreImg(og, 600, 600, "", "") + 10 });

    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < ldScripts.length; i++) {
      try {
        const json = JSON.parse(ldScripts[i].textContent || "{}");
        const items = Array.isArray(json) ? json : [json];
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          const t = item["@type"];
          const isProd = (typeof t === "string" && /product/i.test(t))
                     || (Array.isArray(t) && t.some(function(x) { return /product/i.test(x); }));
          if (isProd) {
            let img = item.image;
            if (typeof img === "object" && img !== null && !Array.isArray(img)) img = img.url;
            if (Array.isArray(img)) img = (img[0] && img[0].url) || img[0];
            if (typeof img === "string") {
              candidates.push({ url: img, score: scoreImg(img, 600, 600, "", "") + 30 });
            }
          }
        }
      } catch (e) {}
    }

    candidates.sort(function(a, b) { return b.score - a.score; });
    return candidates.length > 0 ? candidates[0].url : null;
  })()`);
}

async function downloadImage(
  imageUrl: string, refererUrl: string, outPath: string,
): Promise<{ ok: boolean; ext?: string; reason?: string }> {
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
    if (buf.length < MIN_IMAGE_BYTES) return { ok: false, reason: `Zu klein (${buf.length} bytes)` };
    await fs.writeFile(outPath + "." + ext, buf);
    return { ok: true, ext };
  } catch (err) {
    return { ok: false, reason: (err as Error).message.substring(0, 80) };
  }
}

interface ProductRow {
  slug: string;
  imageUrl: string | null;
  kind: "rubber" | "blade";
}

async function main() {
  const args = process.argv.slice(2);
  const slugFilter = args.indexOf("--slug") >= 0 ? args[args.indexOf("--slug") + 1] : null;
  const force = args.includes("--force");

  console.log("=== Bild-Downloader v2 (erweiterter Scraper) ===\n");
  await fs.mkdir(PRODUCTS_DIR, { recursive: true });

  const research = await loadResearchEntries();

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
  if (!force) {
    products = products.filter((p) => !p.imageUrl?.startsWith("/products/"));
  }

  // Nur Produkte mit manufacturerUrl im Research
  const todo = products.filter((p) => research.get(p.slug)?.manufacturerUrl);

  console.log(`${products.length} ohne lokales Bild, ${todo.length} mit Hersteller-URL.\n`);
  if (todo.length === 0) { console.log("Nichts zu tun."); process.exit(0); }

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
      const url = research.get(product.slug)!.manufacturerUrl!;

      process.stdout.write(`[${i + 1}/${todo.length}] ${product.slug}... `);

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        // Lazy-Loading triggern
        await page.evaluate(async () => {
          window.scrollTo(0, 200);
          await new Promise((r) => setTimeout(r, 400));
          window.scrollTo(0, 600);
          await new Promise((r) => setTimeout(r, 400));
        });
        await sleep(1000);

        const imgUrl = await findBestImage(page, product.slug);
        if (!imgUrl) {
          console.log("✗ kein passendes Bild");
          failures.push({ slug: product.slug, reason: "Kein passendes Bild auf Seite" });
          failed++;
          continue;
        }

        const absoluteUrl = new URL(imgUrl, url).href;
        const outBase = path.join(PRODUCTS_DIR, product.slug);
        const result = await downloadImage(absoluteUrl, url, outBase);

        if (!result.ok) {
          console.log(`✗ Download: ${result.reason}`);
          failures.push({ slug: product.slug, reason: result.reason ?? "" });
          failed++;
          continue;
        }

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
  console.log(`  Erfolgreich:    ${success}`);
  console.log(`  Fehlgeschlagen: ${failed}`);
  if (failures.length > 0) {
    console.log("\nNicht geklappt:");
    failures.forEach((f) => console.log(`  - ${f.slug}: ${f.reason}`));
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
