/**
 * Revspin.net Scraper
 * Scrapet Community-Ratings für Beläge und Hölzer.
 * Ausgabe: db/data/revspin-rubbers.json + db/data/revspin-blades.json
 *
 * Usage:
 *   npm run scrape:rubbers   — Beläge scrapen
 *   npm run scrape:blades    — Hölzer scrapen
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

chromium.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface RevspinRubber {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number | null;
  communitySpeed: number | null;
  communitySpin: number | null;
  communityControl: number | null;
  tackinessScore: number | null;
  weightScore: number | null;
  spongeHardnessScore: number | null;
  gearsScore: number | null;
}

export interface RevspinBlade {
  slug: string;
  name: string;
  manufacturer: string;
  sourceUrl: string;
  reviewCount: number | null;
  communitySpeed: number | null;
  communityControl: number | null;
  vibrationsScore: number | null;
  weightScore: number | null;
}

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const BASE = "https://revspin.net";
const DELAY = 2500;
const MAX_RUBBERS = 80;
const MAX_BLADES = 35;
const DATA_DIR = path.join(process.cwd(), "db", "data");

// ---------------------------------------------------------------------------
// Kuratierte Slug-Listen — revspin-URLs für relevante Produkte (TTR 1000–1700)
// Daten kommen immer live von revspin, nur die URL-Auswahl ist hier definiert.
// ---------------------------------------------------------------------------

const RUBBER_SLUGS = [
  // Butterfly
  "butterfly-tenergy-05",
  "butterfly-tenergy-80",
  "butterfly-tenergy-64",
  "butterfly-tenergy-05-fx",
  "butterfly-tenergy-80-fx",
  "butterfly-tenergy-19",
  "butterfly-dignics-05",
  "butterfly-dignics-64",
  "butterfly-dignics-80",
  "butterfly-dignics-09c",
  "butterfly-rozena",
  "butterfly-sriver-el",
  "butterfly-tackifire-drive",
  // Stiga
  "stiga-mantra-m",
  "stiga-mantra-h",
  "stiga-mantra-s",
  "stiga-calibra-lt",
  "stiga-calibra-lt-sound",
  "stiga-mendo-mx",
  // Donic
  "donic-bluefire-m1",
  "donic-bluefire-m2",
  "donic-bluefire-m3",
  "donic-bluefire-jp01",
  "donic-bluefire-jp03",
  "donic-baracuda",
  "donic-coppa-jo-silver",
  // Tibhar
  "tibhar-evolution-mx-p",
  "tibhar-evolution-mx-s",
  "tibhar-evolution-fx-s",
  "tibhar-evolution-el-s",
  "tibhar-aurus",
  "tibhar-aurus-sound",
  "tibhar-speedy-soft",
  // Joola
  "joola-rhyzm",
  "joola-rhyzm-tech",
  "joola-rhyzm-p",
  "joola-dynaryz-agr",
  "joola-dynaryz-agt",
  "joola-zack",
  // Xiom
  "xiom-vega-pro",
  "xiom-vega-europe",
  "xiom-vega-elite",
  "xiom-vega-asia",
  "xiom-omega-vii-pro",
  "xiom-omega-vii-tour",
  // Yasaka
  "yasaka-rakza-7",
  "yasaka-rakza-x",
  "yasaka-rakza-7-soft",
  "yasaka-mark-v",
  // Andro
  "andro-hexer",
  "andro-hexer-powergrip",
  "andro-rasant",
  "andro-rasant-powergrip",
  // DHS
  "dhs-hurricane-3",
  "dhs-hurricane-3-neo",
  "dhs-hurricane-8",
  // Nittaku
  "nittaku-fastarc-g-1",
  "nittaku-fastarc-c-1",
  "nittaku-fastarc-s-1",
  "nittaku-hammond-fa",
  // Gewo
  "gewo-nexxus-xt-pro-50",
  "gewo-hype-el-pro-47",
  // Victas
  "victas-vo-102",
  "victas-triple-extra",
  "victas-ventus-extra",
  // TSP
  "tsp-curl-p1r",
  "tsp-regalis",
];

const BLADE_SLUGS = [
  // Butterfly
  "butterfly-timo-boll-alc",
  "butterfly-timo-boll-zlf",
  "butterfly-zhang-jike-alc",
  "butterfly-viscaria",
  "butterfly-primorac",
  "butterfly-primorac-carbon",
  "butterfly-korbel",
  "butterfly-innerforce-layer-alc",
  // Stiga
  "stiga-allround-classic",
  "stiga-allround-evolution",
  "stiga-offensive-classic",
  "stiga-infinity-vps-v",
  "stiga-clipper-cr",
  "stiga-celero-wood",
  // Donic
  "donic-waldner-allplay",
  "donic-persson-powerplay",
  "donic-ovtcharov-carbospeed",
  "donic-waldner-senso-carbon",
  // Tibhar
  "tibhar-samsonov-force-pro",
  "tibhar-stratus-power-wood",
  "tibhar-stratus-power-carbon",
  // Joola
  "joola-falcon",
  "joola-k5",
  "joola-infinity-overdrive",
  // Xiom
  "xiom-stradivarius",
  "xiom-hayabusa-z",
  // Andro
  "andro-super-core-cell-off",
  // Nittaku
  "nittaku-acoustic",
  "nittaku-violin",
  // Yasaka
  "yasaka-ma-lin-extra-offensive",
  "yasaka-sweden-extra",
];

const KNOWN_MANUFACTURERS = [
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "Xiom",
  "DHS", "Nittaku", "Andro", "Yasaka", "Sanwei", "729", "Yinhe",
  "Gewo", "Palio", "Globe", "Victas", "TSP", "Spinlord", "Donic",
  "Reactor", "Galaxy", "Double Fish", "Friendship",
];

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractManufacturer(name: string): string {
  for (const m of KNOWN_MANUFACTURERS) {
    if (name.toLowerCase().startsWith(m.toLowerCase())) return m;
  }
  // Ersten Token als Hersteller nehmen
  return name.split(" ")[0] ?? "Unknown";
}

function slugFromUrl(url: string, category: "rubber" | "blade"): string {
  return url.split(`/${category}/`)[1]?.replace(".html", "") ?? "";
}

async function saveJson(filename: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

async function loadExisting<T extends { slug: string }>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Browser-Setup
// ---------------------------------------------------------------------------

async function createBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });
  return { browser, context };
}

// ---------------------------------------------------------------------------
// URLs aus Slug-Listen aufbauen
// ---------------------------------------------------------------------------

function buildUrls(category: "rubber" | "blade"): string[] {
  const slugs = category === "rubber" ? RUBBER_SLUGS : BLADE_SLUGS;
  return slugs.map((slug) => `${BASE}/${category}/${slug}.html`);
}

// ---------------------------------------------------------------------------
// Detail-Seite: Rubber
// ---------------------------------------------------------------------------

async function scrapeRubberDetail(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  url: string,
  retries = 3
): Promise<RevspinRubber | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await scrapeRubberDetailOnce(context, url);
    if (result !== "retry") return result;
    console.log(`  ↻ Retry ${attempt}/${retries} nach Netzwerkfehler...`);
    await sleep(5000 * attempt);
  }
  return null;
}

async function scrapeRubberDetailOnce(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  url: string
): Promise<RevspinRubber | null | "retry"> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(DELAY);

    const data = await page.evaluate(() => {
      const name =
        document.querySelector("h1")?.textContent?.trim() ??
        document.title.replace(" Reviews", "").trim();

      const reviewCount =
        parseInt(
          document.querySelector(".count[itemprop='reviewCount'], .count")
            ?.textContent?.trim() ?? "0"
        ) || null;

      // Ratings aus UserRatingsTable extrahieren
      const ratings: Record<string, number | null> = {};
      const table = document.querySelector("#UserRatingsTable");
      if (table) {
        const rows = table.querySelectorAll("tr");
        rows.forEach((row) => {
          const label =
            row.querySelector(".cell_label")?.textContent?.trim().toLowerCase() ?? "";
          const valueRaw =
            row.querySelector(".cell_rating")?.textContent?.trim() ?? "";
          // Erstes Token ist die Zahl (z.B. "8.7  Very fast")
          const value = parseFloat(valueRaw.split(/\s+/)[0] ?? "");
          if (label && !isNaN(value)) ratings[label] = value;
        });
      }

      return { name, reviewCount, ratings };
    });

    return {
      slug: slugFromUrl(url, "rubber"),
      name: data.name,
      manufacturer: extractManufacturer(data.name),
      sourceUrl: url,
      reviewCount: data.reviewCount,
      communitySpeed: data.ratings["speed"] ?? null,
      communitySpin: data.ratings["spin"] ?? null,
      communityControl: data.ratings["control"] ?? null,
      tackinessScore: data.ratings["tackiness"] ?? null,
      weightScore: data.ratings["weight"] ?? null,
      spongeHardnessScore: data.ratings["sponge hardness"] ?? null,
      gearsScore: data.ratings["gears"] ?? null,
    };
  } catch (err) {
    const msg = (err as Error).message ?? "";
    await page.close();
    if (msg.includes("ERR_INTERNET_DISCONNECTED") || msg.includes("ERR_NETWORK") || msg.includes("ERR_CONNECTION")) {
      return "retry"; // Signal für Retry
    }
    console.error(`  ✗ Fehler: ${msg.substring(0, 80)}`);
    return null;
  } finally {
    try { await page.close(); } catch { /* bereits geschlossen */ }
  }
}

// ---------------------------------------------------------------------------
// Detail-Seite: Blade
// ---------------------------------------------------------------------------

async function scrapeBladeDetail(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  url: string,
  retries = 3
): Promise<RevspinBlade | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await scrapeBladeDetailOnce(context, url);
    if (result !== "retry") return result;
    console.log(`  ↻ Retry ${attempt}/${retries} nach Netzwerkfehler...`);
    await sleep(5000 * attempt);
  }
  return null;
}

async function scrapeBladeDetailOnce(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  url: string
): Promise<RevspinBlade | null | "retry"> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(DELAY);

    const data = await page.evaluate(() => {
      const name =
        document.querySelector("h1")?.textContent?.trim() ??
        document.title.replace(" Reviews", "").trim();

      const reviewCount =
        parseInt(
          document.querySelector(".count[itemprop='reviewCount'], .count")
            ?.textContent?.trim() ?? "0"
        ) || null;

      const ratings: Record<string, number | null> = {};
      const table = document.querySelector("#UserRatingsTable");
      if (table) {
        const rows = table.querySelectorAll("tr");
        rows.forEach((row) => {
          const label =
            row.querySelector(".cell_label")?.textContent?.trim().toLowerCase() ?? "";
          const valueRaw =
            row.querySelector(".cell_rating")?.textContent?.trim() ?? "";
          const value = parseFloat(valueRaw.split(/\s+/)[0] ?? "");
          if (label && !isNaN(value)) ratings[label] = value;
        });
      }

      return { name, reviewCount, ratings };
    });

    return {
      slug: slugFromUrl(url, "blade"),
      name: data.name,
      manufacturer: extractManufacturer(data.name),
      sourceUrl: url,
      reviewCount: data.reviewCount,
      communitySpeed: data.ratings["speed"] ?? null,
      communityControl: data.ratings["control"] ?? null,
      vibrationsScore: data.ratings["vibrations"] ?? null,
      weightScore: data.ratings["weight"] ?? null,
    };
  } catch (err) {
    const msg = (err as Error).message ?? "";
    try { await page.close(); } catch { /* bereits geschlossen */ }
    if (msg.includes("ERR_INTERNET_DISCONNECTED") || msg.includes("ERR_NETWORK") || msg.includes("ERR_CONNECTION")) {
      return "retry";
    }
    console.error(`  ✗ Fehler: ${msg.substring(0, 80)}`);
    return null;
  } finally {
    try { await page.close(); } catch { /* bereits geschlossen */ }
  }
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

async function runRubbers() {
  console.log("=== Revspin Beläge-Scraper ===");
  const { browser, context } = await createBrowser();

  try {
    const urls = buildUrls("rubber");

    // Resume: bereits gescrapte Slugs überspringen
    const existing = await loadExisting<RevspinRubber>("revspin-rubbers.json");
    const done = new Set(existing.map((r) => r.slug));
    const results: RevspinRubber[] = [...existing];
    const todo = urls.filter((u) => !done.has(slugFromUrl(u, "rubber")));

    console.log(`${urls.length} Beläge gesamt, ${existing.length} bereits fertig, ${todo.length} offen.`);

    for (let i = 0; i < todo.length; i++) {
      console.log(`[${existing.length + i + 1}/${urls.length}] ${todo[i]}`);
      const rubber = await scrapeRubberDetail(context, todo[i]);
      if (rubber && rubber.communitySpeed !== null) {
        results.push(rubber);
        console.log(
          `  ✓ ${rubber.name} — Speed:${rubber.communitySpeed} Spin:${rubber.communitySpin} Control:${rubber.communityControl} (${rubber.reviewCount} Reviews)`
        );
      } else if (rubber) {
        console.log(`  ⚠ ${rubber.name} — keine Ratings`);
      }
      await saveJson("revspin-rubbers.json", results);
    }

    console.log(`\n✓ Fertig: ${results.length} Beläge in db/data/revspin-rubbers.json`);
  } finally {
    await browser.close();
  }
}

async function runBlades() {
  console.log("=== Revspin Hölzer-Scraper ===");
  const { browser, context } = await createBrowser();

  try {
    const urls = buildUrls("blade");

    const existing = await loadExisting<RevspinBlade>("revspin-blades.json");
    const done = new Set(existing.map((b) => b.slug));
    const results: RevspinBlade[] = [...existing];
    const todo = urls.filter((u) => !done.has(slugFromUrl(u, "blade")));

    console.log(`${urls.length} Hölzer gesamt, ${existing.length} bereits fertig, ${todo.length} offen.`);

    for (let i = 0; i < todo.length; i++) {
      console.log(`[${existing.length + i + 1}/${urls.length}] ${todo[i]}`);
      const blade = await scrapeBladeDetail(context, todo[i]);
      if (blade && blade.communitySpeed !== null) {
        results.push(blade);
        console.log(
          `  ✓ ${blade.name} — Speed:${blade.communitySpeed} Control:${blade.communityControl} (${blade.reviewCount} Reviews)`
        );
      } else if (blade) {
        console.log(`  ⚠ ${blade.name} — keine Ratings`);
      }
      await saveJson("revspin-blades.json", results);
    }

    console.log(`\n✓ Fertig: ${results.length} Hölzer in db/data/revspin-blades.json`);
  } finally {
    await browser.close();
  }
}

// CLI-Einstieg
const mode = process.argv[2];
if (mode === "blades") {
  runBlades().catch(console.error);
} else {
  runRubbers().catch(console.error);
}
