/**
 * Revspin.net Vollständiger Blade-Scraper
 *
 * Holt alle Hölzer aus dem Revspin-Katalog.
 * Nur Hölzer mit MIN_REVIEWS oder mehr werden gespeichert.
 *
 * Ausgabe: db/data/revspin-blades-full.json
 *
 * Usage:
 *   npm run scrape:blades-full
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

chromium.use(StealthPlugin());

const BASE = "https://revspin.net";
const CATALOG_URL = `${BASE}/blade/`;
const DELAY_BETWEEN_PAGES = 2000;
const MIN_REVIEWS = 5;
const DATA_DIR = path.join(process.cwd(), "db", "data");
const OUTPUT_FILE = "revspin-blades-full.json";
const EXISTING_FILE = "revspin-blades.json";

export interface RevspinBladeFull {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number;
  communitySpeed: number | null;
  communityControl: number | null;
  vibrationsScore: number | null;
  weightScore: number | null;
  consistencyScore: number | null;
  durabilityScore: number | null;
  overallScore: number | null;
  mfgDescription: string | null;
  mfgSpeed: number | null;
  mfgControl: number | null;
  mfgScale: number | null;
}

const MFG_SCALE: Record<string, number> = {
  butterfly: 13,
  stiga: 10, donic: 10, tibhar: 10, joola: 10, xiom: 10,
  yasaka: 10, andro: 10, dhs: 10, nittaku: 10, victas: 10,
  gewo: 10, tsp: 10, sanwei: 10, yinhe: 10, palio: 10,
  galaxy: 10, "dr. neubauer": 10, spinlord: 10,
};

const KNOWN_MANUFACTURERS = [
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA", "Xiom",
  "DHS", "Nittaku", "Andro", "Yasaka", "Sanwei", "729", "Yinhe", "Galaxy",
  "Gewo", "Palio", "Globe", "Victas", "TSP", "SpinLord", "Spinlord",
  "Dr. Neubauer", "Kokutaku", "Avalox", "Friendship", "Dawei",
  "Sauer & Troger", "Double Fish",
];

function extractManufacturer(name: string): string {
  for (const m of KNOWN_MANUFACTURERS) {
    if (name.toLowerCase().startsWith(m.toLowerCase())) return m;
  }
  return name.split(" ")[0] ?? "Unknown";
}

function getMfgScale(manufacturer: string): number {
  return MFG_SCALE[manufacturer.toLowerCase()] ?? 10;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function loadJson<T>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T[];
  } catch { return []; }
}

async function saveJson(filename: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
}

async function fetchAllSlugs(context: any): Promise<string[]> {
  console.log("→ Lade Revspin Blade-Katalog...");
  const page = await context.newPage();
  try {
    await page.goto(CATALOG_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2000);
    const slugs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((a: any) => a.href)
        .filter((h: string) => h.includes("revspin.net/blade/") && h.endsWith(".html"));
      const unique = [...new Set(links)] as string[];
      return unique.map((h: string) => h.split("/blade/")[1]?.replace(".html", "") ?? "").filter(Boolean);
    });
    console.log(`✓ ${slugs.length} Holz-Slugs gefunden.`);
    return slugs as string[];
  } finally { await page.close(); }
}

async function scaleBlade(
  context: any,
  slug: string,
  retries = 2
): Promise<RevspinBladeFull | null | "skip"> {
  const url = `${BASE}/blade/${slug}.html`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(DELAY_BETWEEN_PAGES);

      const data = await page.evaluate(() => {
        const name =
          document.querySelector("h1")?.textContent?.trim() ??
          document.title.replace(" Reviews", "").trim();

        const ratingHeadingText = Array.from(document.querySelectorAll("h2, h3, h4"))
          .find((h: any) => h.textContent?.includes("User Ratings"))
          ?.textContent?.trim() ?? "";
        const reviewCountMatch = ratingHeadingText.match(/\((\d+)\)/);
        const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1]!) : 0;
        const countEl = document.querySelector(".count[itemprop='reviewCount'], .count");
        const reviewCountAlt = parseInt((countEl as any)?.textContent?.trim() ?? "0") || 0;
        const finalReviewCount = Math.max(reviewCount, reviewCountAlt);

        const ratings: Record<string, number | null> = {};
        const bodyText = (document.body as any).innerText;
        const lines = bodyText.split("\n").map((l: string) => l.trim()).filter(Boolean);
        for (const line of lines) {
          const match = line.match(/^(Speed|Control|Vibrations|Weight|Consistency|Durability|Overall)\s+(\d+\.?\d*)/i);
          if (match) { ratings[match[1]!.toLowerCase()] = parseFloat(match[2]!); }
        }

        const descEl = Array.from(document.querySelectorAll("p"))
          .find((p: any) => p.textContent && p.textContent.trim().length > 50 && !p.textContent.includes("cookie"));
        const mfgDescription = (descEl as any)?.textContent?.trim() ?? null;

        const mfgRatings: Record<string, number | null> = {};
        const allTables = document.querySelectorAll(".ProductRatingTable");
        if (allTables.length >= 2) {
          allTables[1]!.querySelectorAll("tr").forEach((row: any) => {
            const label = row.querySelector(".cell_label")?.textContent?.trim().toLowerCase() ?? "";
            const valueRaw = row.querySelector(".cell_rating")?.textContent?.trim() ?? "";
            const value = parseFloat(valueRaw.split(/\s+/)[0] ?? "");
            if (label && !isNaN(value)) mfgRatings[label] = value;
          });
        }

        return { name, reviewCount: finalReviewCount, ratings, mfgRatings, mfgDescription };
      });

      if (data.reviewCount < MIN_REVIEWS) { await page.close(); return "skip"; }

      const manufacturer = extractManufacturer(data.name);
      const mfgScale = getMfgScale(manufacturer);
      await page.close();

      return {
        slug, name: data.name, manufacturer, sourceUrl: url,
        reviewCount: data.reviewCount,
        communitySpeed: data.ratings["speed"] ?? null,
        communityControl: data.ratings["control"] ?? null,
        vibrationsScore: data.ratings["vibrations"] ?? null,
        weightScore: data.ratings["weight"] ?? null,
        consistencyScore: data.ratings["consistency"] ?? null,
        durabilityScore: data.ratings["durability"] ?? null,
        overallScore: data.ratings["overall"] ?? null,
        mfgDescription: data.mfgDescription,
        mfgSpeed: data.mfgRatings["speed"] ?? null,
        mfgControl: data.mfgRatings["control"] ?? null,
        mfgScale: Object.keys(data.mfgRatings).length > 0 ? mfgScale : null,
      };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      try { await page.close(); } catch { /* */ }
      if (attempt < retries && (msg.includes("ERR_NETWORK") || msg.includes("Timeout"))) {
        await sleep(5000 * attempt); continue;
      }
      console.error(`  ✗ ${slug}: ${msg.substring(0, 60)}`);
      return null;
    }
  }
  return null;
}

async function main() {
  console.log("=== Revspin Vollständiger Blade-Scraper ===");
  console.log(`Minimum Reviews: ${MIN_REVIEWS}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1920, height: 1080 },
  });

  try {
    const allSlugs = await fetchAllSlugs(context);
    const existing = await loadJson<{ slug: string }>(EXISTING_FILE);
    const alreadyDone = await loadJson<{ slug: string }>(OUTPUT_FILE);
    const doneSet = new Set([...existing.map(b => b.slug), ...alreadyDone.map(b => b.slug)]);
    const todo = allSlugs.filter(s => !doneSet.has(s));

    console.log(`\n${allSlugs.length} Slugs total | ${doneSet.size} bereits bekannt | ${todo.length} neu zu prüfen\n`);

    const results: RevspinBladeFull[] = [...alreadyDone as RevspinBladeFull[]];
    let skipped = 0, errors = 0;

    for (let i = 0; i < todo.length; i++) {
      const slug = todo[i]!;
      process.stdout.write(`[${i + 1}/${todo.length}] ${slug} ... `);
      const result = await scaleBlade(context, slug);
      if (result === "skip") { process.stdout.write(`skip\n`); skipped++; }
      else if (!result) { process.stdout.write(`fehler\n`); errors++; }
      else {
        process.stdout.write(`✓ ${result.name} — Speed:${result.communitySpeed} Control:${result.communityControl} (${result.reviewCount} Reviews)\n`);
        results.push(result);
        await saveJson(OUTPUT_FILE, results);
      }
      await sleep(500);
    }

    console.log("\n══════════════════════════════");
    console.log(`  Gesamt geprüft:  ${todo.length}`);
    console.log(`  Neu importiert:  ${results.length - alreadyDone.length}`);
    console.log(`  Übersprungen:    ${skipped}`);
    console.log(`  Fehler:          ${errors}`);
    console.log(`  Gesamt in Datei: ${results.length}`);
    console.log(`\n→ Gespeichert: db/data/${OUTPUT_FILE}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
