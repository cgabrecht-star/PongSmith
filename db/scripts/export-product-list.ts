/**
 * Exportiert alle aktiven Beläge und Hölzer als Produktliste für Web-Recherche.
 * Format: slug | Name | Hersteller | Typ
 *
 * Output: db/data/product-list.txt
 *
 * Usage: npm run db:export-product-list
 */

import { db } from "../index";
import { rubbers, blades, manufacturers } from "../schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("=== Export Produktliste ===\n");

  const allManufacturers = await db.select().from(manufacturers);
  const mfgMap = new Map(allManufacturers.map((m) => [m.id, m.name]));

  // ── Beläge ──────────────────────────────────────────────────────────
  const allRubbers = await db
    .select({
      slug: rubbers.slug,
      name: rubbers.name,
      manufacturerId: rubbers.manufacturerId,
      type: rubbers.type,
      isActive: rubbers.isActive,
    })
    .from(rubbers)
    .orderBy(rubbers.name);

  // ── Hölzer ──────────────────────────────────────────────────────────
  const allBlades = await db
    .select({
      slug: blades.slug,
      name: blades.name,
      manufacturerId: blades.manufacturerId,
      isActive: blades.isActive,
    })
    .from(blades)
    .orderBy(blades.name);

  const lines: string[] = [];
  lines.push("# PongSmith Produktliste — für Recherche-Agenten");
  lines.push("# Format: slug | Name | Hersteller | Typ");
  lines.push("");
  lines.push("## Beläge (rubbers)");
  lines.push("");

  for (const r of allRubbers.filter((x) => x.isActive)) {
    const mfg = mfgMap.get(r.manufacturerId) ?? "Unknown";
    const typeLabel =
      r.type === "smooth"
        ? "Belag-invertiert"
        : r.type === "long_pips"
        ? "Belag-lange-Noppen"
        : r.type === "short_pips"
        ? "Belag-kurze-Noppen"
        : r.type === "anti"
        ? "Belag-anti"
        : "Belag";
    lines.push(`${r.slug} | ${r.name} | ${mfg} | ${typeLabel}`);
  }

  lines.push("");
  lines.push("## Hölzer (blades)");
  lines.push("");

  for (const b of allBlades.filter((x) => x.isActive)) {
    const mfg = mfgMap.get(b.manufacturerId) ?? "Unknown";
    lines.push(`${b.slug} | ${b.name} | ${mfg} | Holz`);
  }

  const outPath = path.join(process.cwd(), "db", "data", "product-list.txt");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n"), "utf-8");

  console.log(`✓ ${allRubbers.filter((x) => x.isActive).length} Beläge`);
  console.log(`✓ ${allBlades.filter((x) => x.isActive).length} Hölzer`);
  console.log(`\nGespeichert in: ${outPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
