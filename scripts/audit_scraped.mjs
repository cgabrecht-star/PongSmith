/**
 * Schnell-Audit für gescrapte Marken-JSONs.
 * Liest alle data/scraped/*.json und gibt Statistiken aus
 * + Cross-Check gegen DB (was ist schon drin, was wäre neu).
 */
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const SCRAPED_DIR = "data/scraped";
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const files = (await fs.readdir(SCRAPED_DIR)).filter(f => f.endsWith(".json"));
console.log(`Gefundene Dateien: ${files.length}\n`);

for (const file of files) {
  const raw = await fs.readFile(path.join(SCRAPED_DIR, file), "utf8");
  const data = JSON.parse(raw);
  const meta = data[0]?._meta ?? {};
  const products = data.slice(1);

  console.log(`━━━ ${file} ━━━`);
  console.log(`Marke: ${meta.marke ?? "?"}, scraped_at: ${meta.scraped_at ?? "?"}`);
  console.log(`Produkte total: ${products.length}`);

  const blades = products.filter(p => p.type === "blade");
  const rubbers = products.filter(p => p.type === "rubber");
  console.log(`  Hölzer: ${blades.length}, Beläge: ${rubbers.length}`);

  const stats = (arr, key) => arr.filter(p => p[key] != null && p[key] !== "").length;
  const statsNested = (arr, key, nestedKey) => arr.filter(p => p[key] != null && p[key][nestedKey] != null).length;

  console.log(`  mit imageUrl: ${stats(products, "imageUrl")}/${products.length}`);
  console.log(`  mit uvpEur:   ${stats(products, "uvpEur")}/${products.length}`);
  console.log(`  mit description: ${stats(products, "descriptionDe")}/${products.length}`);

  if (blades.length > 0) {
    console.log(`  Hölzer mit composition: ${statsNested(blades, "blade", "composition")}/${blades.length}`);
    console.log(`  Hölzer mit stiffness:   ${statsNested(blades, "blade", "stiffness")}/${blades.length}`);
    console.log(`  Hölzer mit weightAvg:   ${statsNested(blades, "blade", "weightAvgGrams")}/${blades.length}`);
  }
  if (rubbers.length > 0) {
    console.log(`  Beläge mit hardnessMin: ${statsNested(rubbers, "rubber", "hardnessMin")}/${rubbers.length}`);
    console.log(`  Beläge mit topsheet:    ${statsNested(rubbers, "rubber", "topsheetCharacter")}/${rubbers.length}`);
  }

  // Cross-Check gegen DB
  const bladeNames = blades.map(p => p.name);
  const rubberNames = rubbers.map(p => p.name);
  const dbBlades = bladeNames.length > 0
    ? await sql`SELECT name FROM blades WHERE name = ANY(${bladeNames})`
    : [];
  const dbRubbers = rubberNames.length > 0
    ? await sql`SELECT name FROM rubbers WHERE name = ANY(${rubberNames})`
    : [];
  console.log(`  Hölzer schon in DB:  ${dbBlades.length}/${blades.length}  (neu: ${blades.length - dbBlades.length})`);
  console.log(`  Beläge schon in DB:  ${dbRubbers.length}/${rubbers.length}  (neu: ${rubbers.length - dbRubbers.length})`);

  // Confidence-Verteilung
  const conf = products.reduce((acc, p) => { acc[p.confidence ?? "unknown"] = (acc[p.confidence ?? "unknown"] ?? 0) + 1; return acc; }, {});
  console.log(`  Confidence: ${JSON.stringify(conf)}`);
  console.log();
}

await sql.end();
