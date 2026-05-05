/**
 * Exportiert die Liste aller Produkte ohne Bild als Markdown-Tabelle
 * für die Recherche-Agenten.
 *
 * Output: db/data/missing-images.md
 *
 * Usage: npm run db:export-missing-images
 */
import { db } from "../index";
import { rubbers, blades, manufacturers } from "../schema";
import { isNull, eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("=== Produkte ohne Bild ===\n");

  const allManufacturers = await db.select().from(manufacturers);
  const mfgMap = new Map(allManufacturers.map((m) => [m.id, m.name]));

  // Beläge ohne Bild
  const missingRubbers = await db
    .select({
      slug: rubbers.slug,
      name: rubbers.name,
      manufacturerId: rubbers.manufacturerId,
      type: rubbers.type,
    })
    .from(rubbers)
    .where(isNull(rubbers.imageUrl));

  // Hölzer ohne Bild
  const missingBlades = await db
    .select({
      slug: blades.slug,
      name: blades.name,
      manufacturerId: blades.manufacturerId,
    })
    .from(blades)
    .where(isNull(blades.imageUrl));

  // Nach Hersteller gruppieren
  const grouped = new Map<string, { slug: string; name: string; type: string }[]>();

  for (const r of missingRubbers) {
    const mfg = mfgMap.get(r.manufacturerId) ?? "Unbekannt";
    const typeLabel =
      r.type === "smooth" ? "Belag-invertiert"
      : r.type === "long_pips" ? "Belag-LP"
      : r.type === "short_pips" ? "Belag-SP"
      : r.type === "anti" ? "Belag-Anti"
      : "Belag";
    if (!grouped.has(mfg)) grouped.set(mfg, []);
    grouped.get(mfg)!.push({ slug: r.slug, name: r.name, type: typeLabel });
  }

  for (const b of missingBlades) {
    const mfg = mfgMap.get(b.manufacturerId) ?? "Unbekannt";
    if (!grouped.has(mfg)) grouped.set(mfg, []);
    grouped.get(mfg)!.push({ slug: b.slug, name: b.name, type: "Holz" });
  }

  const lines: string[] = [];
  lines.push("# Produkte ohne Bild — Recherche-Liste");
  lines.push("");
  lines.push(`Stand: ${missingRubbers.length} Beläge + ${missingBlades.length} Hölzer = ${missingRubbers.length + missingBlades.length} Produkte\n`);

  // Sortiert nach Hersteller-Name
  const sorted = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [mfg, items] of sorted) {
    lines.push(`## ${mfg} (${items.length})`);
    lines.push("");
    for (const it of items) {
      lines.push(`- ${it.slug} | ${it.name} | ${it.type}`);
    }
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "db", "data", "missing-images.md");
  await fs.writeFile(outPath, lines.join("\n"), "utf-8");

  console.log(`Insgesamt: ${missingRubbers.length + missingBlades.length} Produkte ohne Bild`);
  console.log(`Verteilung nach Hersteller:`);
  for (const [mfg, items] of sorted) {
    console.log(`  ${mfg}: ${items.length}`);
  }
  console.log(`\nGespeichert: ${outPath}`);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
