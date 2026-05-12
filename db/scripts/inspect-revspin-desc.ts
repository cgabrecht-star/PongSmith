/**
 * Analysiert die Revspin-Seitenstruktur für Hersteller-Beschreibungen.
 * Usage: npx dotenv -e .env.local -- tsx db/scripts/inspect-revspin-desc.ts
 */
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
chromium.use(StealthPlugin());

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Verschiedene Produkte testen
  const urls = [
    "https://revspin.net/rubber/dhs-hurricane-8-80.html",
    "https://revspin.net/rubber/butterfly-tenergy-05.html",
    "https://revspin.net/rubber/xiom-vega-europe.html",
    "https://revspin.net/blade/butterfly-timo-boll-alc.html",
    "https://revspin.net/blade/stiga-allround-classic.html",
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      // Alle p-Tags
      const allP = Array.from(document.querySelectorAll("p")).map(p => ({
        class: p.className,
        id: p.parentElement?.id ?? "",
        parentClass: p.parentElement?.className ?? "",
        text: p.textContent?.trim().substring(0, 150),
      })).filter(p => p.text && p.text.length > 20);

      // Hersteller-Beschreibung: suche nach "expand" Button oder spezifischem Container
      const expandEl = document.querySelector(".expand, #product_description, .product-description, .mfr-description");

      // Suche nach dem Text der auf "Manufacturer Details" folgt
      const allText = document.body.innerText.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const mfrIdx = allText.findIndex((l: string) => l.toLowerCase().includes("manufacturer details") || l.toLowerCase().includes("manufacturer description"));
      const mfrContext = mfrIdx >= 0 ? allText.slice(mfrIdx, mfrIdx + 8) : [];

      // Suche Abschnitt vor "Reviews"
      const reviewIdx = allText.findIndex((l: string) => l.toLowerCase().startsWith("reviews ("));
      const beforeReviews = reviewIdx > 5 ? allText.slice(Math.max(0, reviewIdx - 10), reviewIdx) : [];

      return {
        pTags: allP.slice(0, 8),
        expandEl: expandEl?.textContent?.trim().substring(0, 200) ?? null,
        mfrContext,
        beforeReviews,
      };
    });

    console.log(`\n=== ${url} ===`);
    console.log("P-Tags:");
    result.pTags.forEach(p => console.log(`  [${p.class}|${p.parentClass}] ${p.text}`));
    console.log("Manufacturer-Kontext:", result.mfrContext);
    console.log("Vor Reviews:", result.beforeReviews);
  }

  await browser.close();
  process.exit(0);
}

main().catch(console.error);
