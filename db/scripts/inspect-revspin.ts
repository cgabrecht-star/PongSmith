/**
 * Inspiziert eine Revspin-Seite um Bild- und Beschreibungs-Selektoren zu finden.
 * Usage: dotenv -e .env.local -- tsx db/scripts/inspect-revspin.ts
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

  await page.goto("https://revspin.net/rubber/butterfly-tenergy-05.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const info = await page.evaluate(() => {
    // Alle img-Tags mit src
    const imgs = Array.from(document.querySelectorAll("img"))
      .map(img => ({ src: img.src, alt: img.alt, className: img.className, id: img.id }))
      .filter(i => i.src && !i.src.includes("data:") && !i.src.includes("pixel") && !i.src.includes("banner"));

    // Alle p-Tags mit Text (potenzielle Beschreibungen)
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map(p => ({ text: p.textContent?.trim().substring(0, 100), className: p.className }))
      .filter(p => p.text && p.text.length > 40);

    // Body-Klassen und IDs für Kontext
    const mainContent = document.querySelector("main, #main, .main, #content, .content");

    return { imgs: imgs.slice(0, 10), paragraphs: paragraphs.slice(0, 5), mainClass: mainContent?.className };
  });

  console.log("\n=== BILDER ===");
  info.imgs.forEach(i => console.log(`  [${i.className || i.id || "no-class"}] ${i.src}`));

  console.log("\n=== ABSÄTZE (potenzielle Beschreibungen) ===");
  info.paragraphs.forEach(p => console.log(`  [${p.className}] ${p.text}`));

  await browser.close();
  process.exit(0);
}

main().catch(console.error);
