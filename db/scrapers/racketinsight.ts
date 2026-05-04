/**
 * Racketinsight.com Scraper
 * Scraped ausführliche Englische Reviews für Beläge.
 * Ausgabe: db/data/racketinsight-rubbers.json
 *
 * Quell-URL-Muster: https://www.racketinsight.com/table-tennis/{slug}-review/
 *
 * Was wir holen:
 *  - description  (erste 3 Absätze des Reviews, deutsch kommt später per Übersetzung)
 *  - speedText / spinText / controlText  ("High", "Very High", …)
 *  - rating   (0-5 Score wie "4.0 out of 5")
 *  - imageUrl (falls vorhanden)
 *
 * Usage:
 *   npm run scrape:racketinsight
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

chromium.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface RacketinsightRubber {
  slug: string;          // Racketinsight-Slug (ohne "-review")
  riUrl: string;         // vollständige Quell-URL
  name: string;          // bereinigter Produktname
  description: string;  // erste 3 Review-Absätze (Englisch)
  speedText: string | null;
  spinText: string | null;
  controlText: string | null;
  hardnessText: string | null;
  tackinessText: string | null;
  ratingScore: number | null;  // 0–5
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Alle Review-URLs von racketinsight (Stand Mai 2026)
// ---------------------------------------------------------------------------

const BASE = "https://www.racketinsight.com";

const RUBBER_SLUGS = [
  "butterfly-tenergy-05",
  "butterfly-tenergy-19",
  "butterfly-tenergy-64",
  "butterfly-tenergy-80",
  "butterfly-dignics-05",
  "butterfly-dignics-09c",
  "butterfly-glayzer",
  "butterfly-glayzer-09c",
  "butterfly-rozena",
  "butterfly-sriver",
  "butterfly-zyre-03",
  "andro-rasanter-c53",
  "andro-rasanter-r42",
  "andro-rasanter-r47",
  "dhs-hurricane-3-neo",
  "dhs-hurricane-3-national",
  "dhs-gold-arc-8",
  "donic-baracuda",
  "xiom-vega-europe",
  "xiom-vega-intro",
  "xiom-vega-pro",
  "xiom-vega-x",
  "yasaka-mark-v",
  "yasaka-rakza-7",
  "yasaka-rakza-xx",
  "yasaka-rakza-z",
  "nittaku-fastarc-g1",
  "nittaku-genextion",
  "nittaku-hammond-z2",
  "tibhar-evolution-mx-p",
  "tibhar-hybrid-k3",
  "sanwei-gear-hyper-rubber",
  "sanwei-target-national",
  "sanwei-target-europe-soft",
  "victas-v22-double-extra",
  "yinhe-big-dipper",
  "yinhe-mercury-2",
  "friendship-729-super-fx",
  "dawei-388d-1",
];

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const DELAY = 2000;
const DATA_DIR = path.join(process.cwd(), "db", "data");

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

/**
 * Bereinigt den H1-Titel zu einem sauberen Produktnamen.
 * "Our Playtesting and Review of Butterfly's Dignics 05 Rubber (2026)" → "Butterfly Dignics 05"
 * "DHS Hurricane 3 NEO Rubber Review" → "DHS Hurricane 3 NEO"
 */
function cleanProductName(h1: string): string {
  return h1
    .replace(/Our Playtesting and Review of\s+/i, "")
    .replace(/\s*\(\d{4}\)\s*/g, "")
    .replace(/\s+Rubber\s+Review\s*$/i, "")
    .replace(/\s+Review\s*$/i, "")
    .replace(/\s+Rubber\s*$/i, "")
    .replace(/'s\s+/g, " ")
    .trim();
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
// Detail-Seite scrapen
// ---------------------------------------------------------------------------

async function scrapeReviewPage(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  slug: string,
  retries = 3
): Promise<RacketinsightRubber | null> {
  const url = `${BASE}/table-tennis/${slug}-review/`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await scrapeOnce(context, url, slug);
    if (result !== "retry") return result;
    console.log(`  ↻ Retry ${attempt}/${retries}...`);
    await sleep(5000 * attempt);
  }
  return null;
}

async function scrapeOnce(
  context: Awaited<ReturnType<typeof createBrowser>>["context"],
  url: string,
  slug: string
): Promise<RacketinsightRubber | null | "retry"> {
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 404 abfangen
    if (!response || response.status() === 404) {
      console.log(`  ✗ 404 — ${url}`);
      return null;
    }

    await sleep(DELAY);

    const data = await page.evaluate(() => {
      // Produktname
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";

      // Hauptinhalt: Absätze in article oder main (erster Body-Abschnitt)
      const container =
        document.querySelector("article") ??
        document.querySelector("main") ??
        document.body;

      // Alle sinnvollen Absätze (min 80 Zeichen, kein UI-Text)
      const paragraphs = Array.from(container.querySelectorAll("p"))
        .map((p) => p.textContent?.trim() ?? "")
        .filter(
          (t) =>
            t.length > 80 &&
            !t.toLowerCase().includes("affiliate") &&
            !t.toLowerCase().includes("cookie") &&
            !t.toLowerCase().includes("privacy policy") &&
            !t.toLowerCase().includes("loading more")
        )
        .slice(0, 4); // maximal 4 Absätze

      const description = paragraphs.join("\n\n");

      // Spezifikationen — suche nach Textnodes mit "Speed:", "Spin:", etc.
      const specMap: Record<string, string> = {};
      const allText = document.querySelectorAll("*");
      for (const el of Array.from(allText)) {
        const txt = el.textContent?.trim() ?? "";
        for (const key of ["Speed", "Spin", "Control", "Hardness", "Tackiness"]) {
          const pattern = new RegExp(`^${key}:\\s*(.+)$`);
          const match = txt.match(pattern);
          if (match && el.children.length === 0) {
            specMap[key.toLowerCase()] = match[1]!.trim();
          }
        }
      }

      // Rating: "5.0 out of 5" oder "4.0 out of 5"
      let ratingScore: number | null = null;
      const bodyText = document.body.textContent ?? "";
      const ratingMatch = bodyText.match(/(\d+(?:\.\d+)?)\s+out\s+of\s+5/);
      if (ratingMatch) {
        ratingScore = parseFloat(ratingMatch[1]!);
      }

      // Bild
      const imgEl =
        document.querySelector("img.product_detail_image") ??
        document.querySelector("article img") ??
        document.querySelector("main img");
      const imageUrl = imgEl?.getAttribute("src") ?? null;

      return { h1, description, specMap, ratingScore, imageUrl };
    });

    // Bild-URL normalisieren
    let imageUrl: string | null = data.imageUrl;
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${BASE}${imageUrl}`;
    }
    // Astro-gehashte Bilder sind nicht stabil → nur externe/absolute URLs merken
    if (imageUrl && imageUrl.includes("/_astro/")) {
      imageUrl = null; // nicht nutzbar (Hash ändert sich bei jedem Build)
    }

    const result: RacketinsightRubber = {
      slug,
      riUrl: url,
      name: cleanProductName(data.h1),
      description: data.description,
      speedText: data.specMap["speed"] ?? null,
      spinText: data.specMap["spin"] ?? null,
      controlText: data.specMap["control"] ?? null,
      hardnessText: data.specMap["hardness"] ?? null,
      tackinessText: data.specMap["tackiness"] ?? null,
      ratingScore: data.ratingScore,
      imageUrl,
    };

    return result;
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (
      msg.includes("ERR_INTERNET_DISCONNECTED") ||
      msg.includes("ERR_NETWORK") ||
      msg.includes("ERR_CONNECTION")
    ) {
      await page.close();
      return "retry";
    }
    console.error(`  ✗ Fehler: ${msg.substring(0, 100)}`);
    return null;
  } finally {
    try {
      await page.close();
    } catch {
      /* bereits geschlossen */
    }
  }
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

async function runRubbers() {
  console.log("=== Racketinsight Beläge-Scraper ===\n");
  const { browser, context } = await createBrowser();

  try {
    const existing = await loadExisting<RacketinsightRubber>("racketinsight-rubbers.json");
    const done = new Set(existing.map((r) => r.slug));
    const results: RacketinsightRubber[] = [...existing];
    const todo = RUBBER_SLUGS.filter((s) => !done.has(s));

    console.log(
      `${RUBBER_SLUGS.length} Beläge gesamt, ${existing.length} bereits fertig, ${todo.length} offen.\n`
    );

    for (let i = 0; i < todo.length; i++) {
      const slug = todo[i]!;
      console.log(`[${existing.length + i + 1}/${RUBBER_SLUGS.length}] ${slug}`);

      const rubber = await scrapeReviewPage(context, slug);

      if (rubber) {
        results.push(rubber);
        console.log(
          `  ✓ ${rubber.name}` +
            (rubber.speedText ? ` — Speed:${rubber.speedText} Spin:${rubber.spinText} Control:${rubber.controlText}` : "") +
            (rubber.ratingScore !== null ? ` [${rubber.ratingScore}/5]` : "") +
            (rubber.description ? ` desc:${rubber.description.length}c` : " ⚠ kein Text")
        );
      } else {
        console.log(`  ✗ Übersprungen (kein Ergebnis)`);
      }

      await saveJson("racketinsight-rubbers.json", results);
    }

    console.log(`\n✓ Fertig: ${results.length} Einträge in db/data/racketinsight-rubbers.json`);
  } finally {
    await browser.close();
  }
}

runRubbers().catch(console.error);
