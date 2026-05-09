/**
 * Revspin.net Vollständiger Rubber-Scraper
 *
 * Statt einer manuellen Slug-Liste wird der komplette Revspin-Katalog gescrapt.
 * Nur Beläge mit MIN_REVIEWS oder mehr Community-Bewertungen werden gespeichert.
 *
 * Ausgabe: db/data/revspin-rubbers-full.json
 *
 * Usage:
 *   npm run scrape:rubbers-full
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

chromium.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const BASE = "https://revspin.net";
const CATALOG_URL = `${BASE}/rubber/`;
const DELAY_BETWEEN_PAGES = 2000;   // ms zwischen Requests (höflich bleiben)
const MIN_REVIEWS = 5;              // Mindest-Review-Anzahl für Import
const DATA_DIR = path.join(process.cwd(), "db", "data");
const OUTPUT_FILE = "revspin-rubbers-full.json";
const EXISTING_FILE = "revspin-rubbers.json";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface RevspinRubberFull {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number;
  communitySpeed: number | null;
  communitySpin: number | null;
  communityControl: number | null;
  tackinessScore: number | null;
  weightScore: number | null;
  spongeHardnessScore: number | null;
  gearsScore: number | null;
  throwAngleScore: number | null;
  consistencyScore: number | null;
  durabilityScore: number | null;
  overallScore: number | null;
  isTensor: boolean | null;
  isAnti: boolean | null;
  mfgDescription: string | null;
  mfgSpeed: number | null;
  mfgSpin: number | null;
  mfgControl: number | null;
  mfgScale: number | null;
}

// ---------------------------------------------------------------------------
// Hersteller-Skalen (für Normierung)
// ---------------------------------------------------------------------------

const MFG_SCALE: Record<string, number> = {
  butterfly: 13,
  stiga: 10, donic: 10, tibhar: 10, joola: 10, xiom: 10,
  yasaka: 10, andro: 10, dhs: 10, nittaku: 10, victas: 10,
  gewo: 10, tsp: 10, sanwei: 10, "729": 10, yinhe: 10,
  palio: 10, galaxy: 10, sauer: 10, dr: 10, spinlord: 10,
  reactor: 10, friendship: 10, dawei: 10, juic: 10,
};

const KNOWN_MANUFACTURERS = [
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA", "Xiom",
  "DHS", "Nittaku", "Andro", "Yasaka", "Sanwei", "729", "Yinhe", "Galaxy",
  "Gewo", "Palio", "Globe", "Victas", "TSP", "SpinLord", "Spinlord",
  "Reactor", "Double Fish", "Friendship", "Dawei", "Juic",
  "Sauer & Troger", "Dr. Neubauer", "Neubauer",
  "Tibhar", "Kokutaku", "Avalox", "Donic", "Nittaku",
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadJson<T>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function saveJson(filename: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

// ---------------------------------------------------------------------------
// Schritt 1: Alle Slugs vom Katalog holen
// ---------------------------------------------------------------------------

async function fetchAllSlugs(
  context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>>
): Promise<string[]> {
  console.log("→ Lade Revspin Rubber-Katalog...");
  const page = await context.newPage();
  try {
    await page.goto(CATALOG_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2000);

    const slugs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h.includes("revspin.net/rubber/") && h.endsWith(".html"));
      const unique = [...new Set(links)];
      return unique.map((h) => h.split("/rubber/")[1]?.replace(".html", "") ?? "").filter(Boolean);
    });

    console.log(`✓ ${slugs.length} Belag-Slugs gefunden.`);
    return slugs;
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Schritt 2: Einzelne Belag-Seite scrapen
// ---------------------------------------------------------------------------

async function scrapeRubber(
  context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>>,
  slug: string,
  retries = 2
): Promise<RevspinRubberFull | null | "skip"> {
  const url = `${BASE}/rubber/${slug}.html`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(DELAY_BETWEEN_PAGES);

      const data = await page.evaluate(() => {
        const name =
          document.querySelector("h1")?.textContent?.trim() ??
          document.title.replace(" Reviews", "").trim();

        // Review-Count: suche "User Ratings (N)"
        const ratingHeadingText = Array.from(document.querySelectorAll("h2, h3, h4"))
          .find((h) => h.textContent?.includes("User Ratings"))
          ?.textContent?.trim() ?? "";
        const reviewCountMatch = ratingHeadingText.match(/\((\d+)\)/);
        const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1]!) : 0;

        // Backup: .count Element
        const countEl = document.querySelector(".count[itemprop='reviewCount'], .count");
        const reviewCountAlt = parseInt(countEl?.textContent?.trim() ?? "0") || 0;

        const finalReviewCount = Math.max(reviewCount, reviewCountAlt);

        // Community-Ratings
        const ratings: Record<string, number | null> = {};
        const bodyText = document.body.innerText;
        const lines = bodyText.split("\n").map((l: string) => l.trim()).filter(Boolean);

        // Parse aus Klartext: "Speed \t8.1" etc.
        for (const line of lines) {
          const match = line.match(/^(Speed|Spin|Control|Tackiness|Weight|Sponge Hardness|Gears|Throw Angle|Consistency|Durability|Overall)\s+(\d+\.?\d*)/i);
          if (match) {
            ratings[match[1]!.toLowerCase()] = parseFloat(match[2]!);
          }
        }

        // Hersteller-Beschreibung
        const descEl = Array.from(document.querySelectorAll("p"))
          .find((p) => p.textContent && p.textContent.trim().length > 50 && !p.textContent.includes("cookie"));
        const mfgDescription = descEl?.textContent?.trim() ?? null;

        // Tensor / Anti Flags
        const isTensor = bodyText.toLowerCase().includes("tensor\tyes") || bodyText.includes("Tensor \tYes");
        const isAnti = bodyText.toLowerCase().includes("anti\tyes") || bodyText.includes("Anti \tYes");

        // Hersteller-Rohdaten (zweite Tabelle)
        const mfgRatings: Record<string, number | null> = {};
        const allTables = document.querySelectorAll(".ProductRatingTable");
        if (allTables.length >= 2) {
          allTables[1]!.querySelectorAll("tr").forEach((row) => {
            const label = row.querySelector(".cell_label")?.textContent?.trim().toLowerCase() ?? "";
            const valueRaw = row.querySelector(".cell_rating")?.textContent?.trim() ?? "";
            const value = parseFloat(valueRaw.split(/\s+/)[0] ?? "");
            if (label && !isNaN(value)) mfgRatings[label] = value;
          });
        }

        return {
          name,
          reviewCount: finalReviewCount,
          ratings,
          mfgRatings,
          mfgDescription,
          isTensor,
          isAnti,
        };
      });

      // Zu wenig Reviews → überspringen
      if (data.reviewCount < MIN_REVIEWS) {
        await page.close();
        return "skip";
      }

      const manufacturer = extractManufacturer(data.name);
      const mfgScale = getMfgScale(manufacturer);

      await page.close();
      return {
        slug,
        name: data.name,
        manufacturer,
        sourceUrl: url,
        reviewCount: data.reviewCount,
        communitySpeed: data.ratings["speed"] ?? null,
        communitySpin: data.ratings["spin"] ?? null,
        communityControl: data.ratings["control"] ?? null,
        tackinessScore: data.ratings["tackiness"] ?? null,
        weightScore: data.ratings["weight"] ?? null,
        spongeHardnessScore: data.ratings["sponge hardness"] ?? null,
        gearsScore: data.ratings["gears"] ?? null,
        throwAngleScore: data.ratings["throw angle"] ?? null,
        consistencyScore: data.ratings["consistency"] ?? null,
        durabilityScore: data.ratings["durability"] ?? null,
        overallScore: data.ratings["overall"] ?? null,
        isTensor: data.isTensor,
        isAnti: data.isAnti,
        mfgDescription: data.mfgDescription,
        mfgSpeed: data.mfgRatings["speed"] ?? null,
        mfgSpin: data.mfgRatings["spin"] ?? null,
        mfgControl: data.mfgRatings["control"] ?? null,
        mfgScale: Object.keys(data.mfgRatings).length > 0 ? mfgScale : null,
      };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      try { await page.close(); } catch { /* bereits zu */ }
      if (attempt < retries && (msg.includes("ERR_NETWORK") || msg.includes("ERR_CONNECTION") || msg.includes("Timeout"))) {
        console.log(`  ↻ Retry ${attempt}/${retries}...`);
        await sleep(5000 * attempt);
        continue;
      }
      console.error(`  ✗ ${slug}: ${msg.substring(0, 60)}`);
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Revspin Vollständiger Rubber-Scraper ===");
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
    // Alle Katalog-Slugs holen
    const allSlugs = await fetchAllSlugs(context);

    // Bereits bekannte Slugs laden (aus alter + neuer Datei)
    const existing = await loadJson<{ slug: string }>(EXISTING_FILE);
    const alreadyDone = await loadJson<{ slug: string }>(OUTPUT_FILE);
    const doneSet = new Set([
      ...existing.map((r) => r.slug),
      ...alreadyDone.map((r) => r.slug),
    ]);

    const todo = allSlugs.filter((s) => !doneSet.has(s));
    console.log(`\n${allSlugs.length} Slugs total | ${doneSet.size} bereits bekannt | ${todo.length} neu zu prüfen\n`);

    const results: RevspinRubberFull[] = [...alreadyDone as RevspinRubberFull[]];
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < todo.length; i++) {
      const slug = todo[i]!;
      process.stdout.write(`[${i + 1}/${todo.length}] ${slug} ... `);

      const result = await scrapeRubber(context, slug);

      if (result === "skip") {
        process.stdout.write(`skip (<${MIN_REVIEWS} Reviews)\n`);
        skipped++;
      } else if (result === null) {
        process.stdout.write(`fehler\n`);
        errors++;
      } else {
        process.stdout.write(
          `✓ ${result.name} — Speed:${result.communitySpeed} Spin:${result.communitySpin} Control:${result.communityControl} (${result.reviewCount} Reviews)\n`
        );
        results.push(result);
        // Progressiv speichern
        await saveJson(OUTPUT_FILE, results);
      }

      // Kleine Pause zwischen Requests
      await sleep(500);
    }

    console.log("\n══════════════════════════════");
    console.log(`  Gesamt geprüft:  ${todo.length}`);
    console.log(`  Neu importiert:  ${results.length - alreadyDone.length}`);
    console.log(`  Übersprungen:    ${skipped} (<${MIN_REVIEWS} Reviews)`);
    console.log(`  Fehler:          ${errors}`);
    console.log(`  Gesamt in Datei: ${results.length}`);
    console.log(`\n→ Gespeichert: db/data/${OUTPUT_FILE}`);

  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
