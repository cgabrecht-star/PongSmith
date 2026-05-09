/**
 * Backfills Hersteller-Beschreibungen für Beläge + Hölzer.
 *
 * Strategie: body.innerText mit zwei Ankern:
 *   1. "Manufacturer Details" → Text bis zum nächsten Abschnitt
 *   2. "There are X users using" → Text bis zum ersten Rating-Label (Fallback)
 *
 * Läuft idempotent: nur Produkte mit description IS NULL werden bearbeitet.
 * Fortschritt wird direkt in die DB geschrieben (kein Absturz-Verlust).
 *
 * Usage: npm run db:backfill-descriptions
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "../index";
import { sql } from "drizzle-orm";

chromium.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const DELAY_MS = 1800;           // ms zwischen Seiten-Requests
const MIN_DESC_LENGTH = 40;      // kürzere Texte = wahrscheinlich kein echter Inhalt
const MAX_DESC_LINES = 12;       // maximal so viele Zeilen sammeln
const MIN_DESC_LINE_LENGTH = 18; // Zeilen kürzer als das = Navigationsmüll

// Muster die das Ende einer Beschreibung markieren
const STOP_PATTERN = /^(expand|speed\s|\bspin\s|\bcontrol\s|tackiness|sponge hardness|sponge\s|gears|throw angle|consistency|durability|overall\s|reviews?\s*\(|user ratings|manufacturer details|buy at|where to buy|price|shop|add to)/i;

// Cookie- und Datenschutz-Text erkennen
const COOKIE_PATTERN = /cookie|privacy|consent|gdpr|personal data|vendors want|opt.out|data collection|your permission/i;

// ---------------------------------------------------------------------------
// Beschreibungs-Extraktion aus body.innerText
// ---------------------------------------------------------------------------

function extractDescription(bodyText: string): string | null {
  const lines = bodyText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Strategie 1: Text nach "Manufacturer Details" Header
  const mfrIdx = lines.findIndex((l) =>
    /^manufacturer details?$/i.test(l) || /^manufacturer description$/i.test(l)
  );

  if (mfrIdx >= 0 && mfrIdx + 1 < lines.length) {
    const descLines: string[] = [];
    for (let i = mfrIdx + 1; i < lines.length; i++) {
      const line = lines[i]!;
      if (STOP_PATTERN.test(line)) break;
      if (COOKIE_PATTERN.test(line)) continue;
      if (line.length < MIN_DESC_LINE_LENGTH) continue;
      descLines.push(line);
      if (descLines.length >= MAX_DESC_LINES) break;
    }
    const result = descLines.join(" ").trim();
    if (result.length >= MIN_DESC_LENGTH) return result;
  }

  // Strategie 2: Text nach "There are X users using [Name]."
  const anchorIdx = lines.findIndex((l) =>
    /there are \d+ users? using/i.test(l)
  );

  if (anchorIdx >= 0) {
    const descLines: string[] = [];
    for (let i = anchorIdx + 1; i < lines.length; i++) {
      const line = lines[i]!;
      if (STOP_PATTERN.test(line)) break;
      if (/^manufacturer details?$/i.test(line)) break; // Abschnitt beginnt separat
      if (COOKIE_PATTERN.test(line)) continue;
      if (line.length < MIN_DESC_LINE_LENGTH) continue;
      descLines.push(line);
      if (descLines.length >= MAX_DESC_LINES) break;
    }
    const result = descLines.join(" ").trim();
    if (result.length >= MIN_DESC_LENGTH) return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Einzelne Seite scrapen
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapePage(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>>["newPage"] extends () => Promise<infer P> ? P : never,
  url: string
): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(DELAY_MS);
    const bodyText: string = await page.evaluate(() => document.body.innerText);
    return extractDescription(bodyText);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    // Bei Netzwerkfehler: kurz warten und null zurückgeben
    if (msg.includes("ERR_") || msg.includes("Timeout")) {
      await sleep(4000);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Haupt-Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Backfill: Hersteller-Beschreibungen ===\n");

  // Alle Produkte ohne Beschreibung laden (mit sourceUrl)
  const rubberRows = (await db.execute(sql`
    SELECT id, name, source_url
    FROM rubbers
    WHERE description IS NULL
      AND source_url IS NOT NULL
    ORDER BY community_review_count DESC NULLS LAST
  `)) as { id: number; name: string; source_url: string }[];

  const bladeRows = (await db.execute(sql`
    SELECT id, name, source_url
    FROM blades
    WHERE description IS NULL
      AND source_url IS NOT NULL
    ORDER BY community_review_count DESC NULLS LAST
  `)) as { id: number; name: string; source_url: string }[];

  console.log(`Beläge ohne Beschreibung:  ${rubberRows.length}`);
  console.log(`Hölzer ohne Beschreibung:  ${bladeRows.length}`);
  console.log(`Gesamt zu bearbeiten:      ${rubberRows.length + bladeRows.length}`);
  const estimatedMinutes = Math.ceil((rubberRows.length + bladeRows.length) * (DELAY_MS + 500) / 60000);
  console.log(`Geschätzte Dauer:          ~${estimatedMinutes} Minuten\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1920, height: 1080 },
  });

  // Eine Seite wiederverwenden spart Speicher
  const page = await context.newPage();

  let rubberFilled = 0;
  let rubberEmpty = 0;
  let bladeFilled = 0;
  let bladeEmpty = 0;

  // ── Beläge ────────────────────────────────────────────────────────────────
  if (rubberRows.length > 0) {
    console.log("━━━ Beläge ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (let i = 0; i < rubberRows.length; i++) {
      const r = rubberRows[i]!;
      const label = r.name.substring(0, 38).padEnd(40);
      process.stdout.write(`[${String(i + 1).padStart(4)}/${rubberRows.length}] ${label} → `);

      const desc = await scrapePage(page as any, r.source_url);

      if (desc) {
        await db.execute(
          sql`UPDATE rubbers SET description = ${desc}, updated_at = NOW() WHERE id = ${r.id}`
        );
        process.stdout.write(`✓ ${desc.length} Zeichen\n`);
        rubberFilled++;
      } else {
        process.stdout.write(`(keine Beschreibung)\n`);
        rubberEmpty++;
      }

      await sleep(400); // kleine Zusatzpause nach DB-Write
    }
  }

  // ── Hölzer ────────────────────────────────────────────────────────────────
  if (bladeRows.length > 0) {
    console.log("\n━━━ Hölzer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (let i = 0; i < bladeRows.length; i++) {
      const b = bladeRows[i]!;
      const label = b.name.substring(0, 38).padEnd(40);
      process.stdout.write(`[${String(i + 1).padStart(4)}/${bladeRows.length}] ${label} → `);

      const desc = await scrapePage(page as any, b.source_url);

      if (desc) {
        await db.execute(
          sql`UPDATE blades SET description = ${desc}, updated_at = NOW() WHERE id = ${b.id}`
        );
        process.stdout.write(`✓ ${desc.length} Zeichen\n`);
        bladeFilled++;
      } else {
        process.stdout.write(`(keine Beschreibung)\n`);
        bladeEmpty++;
      }

      await sleep(400);
    }
  }

  await browser.close();

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`  Beläge befüllt:   ${rubberFilled} / ${rubberRows.length}`);
  console.log(`  Beläge leer:      ${rubberEmpty}`);
  console.log(`  Hölzer befüllt:   ${bladeFilled} / ${bladeRows.length}`);
  console.log(`  Hölzer leer:      ${bladeEmpty}`);
  const total = rubberFilled + bladeFilled;
  const totalEmpty = rubberEmpty + bladeEmpty;
  console.log(`  ───────────────────────────────────────────────────`);
  console.log(`  Gesamt befüllt:   ${total}`);
  console.log(`  Gesamt leer:      ${totalEmpty} (kein Beschreibungstext auf Seite)`);
  console.log("\n✓ Fertig.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
