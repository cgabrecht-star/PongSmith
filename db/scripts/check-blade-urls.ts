import fs from "fs/promises";
import path from "path";

const RESEARCH_DIR = path.join(process.cwd(), "db", "data", "research");

async function main() {
  const files = (await fs.readdir(RESEARCH_DIR)).filter((f) => f.endsWith(".json"));
  let bladesTotal = 0;
  let bladesWithUrl = 0;
  for (const file of files) {
    const arr = JSON.parse(await fs.readFile(path.join(RESEARCH_DIR, file), "utf-8"));
    for (const e of arr) {
      // Holz-Slugs erkennen — keine "rubber"-Begriffe, eher Holz-Marken-Patterns
      // Einfacher: prüfe alle Einträge auf manufacturerUrl
      if (e.manufacturerUrl) {
        // Heuristik: ist es vermutlich ein Holz?
        const looksLikeBlade = /-(blade|holz|all|carbon|alc|zlf|allplay|powerplay|primorac|viscaria|clipper|ovtcharov|persson|waldner)\b/i.test(e.slug)
          || /(timo-boll|zhang-jike|joo-se-hyuk|ma-lin|samsonov|stratus-power|stradivarius|hayabusa|innerforce|sweden-extra|allround|offensive|defensive)/i.test(e.slug);
        if (looksLikeBlade) {
          bladesTotal++;
          bladesWithUrl++;
          console.log(`${e.slug}: ${e.manufacturerUrl.substring(0, 80)}`);
        }
      }
    }
  }
  console.log(`\nGefunden: ${bladesWithUrl}`);
  process.exit(0);
}
main().catch(console.error);
