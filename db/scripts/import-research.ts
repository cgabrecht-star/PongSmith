/**
 * Importiert die geparsten Recherche-JSONs aus db/data/research/ in die DB.
 *
 * Pro Produkt:
 *  - Match per Slug
 *  - Update imageUrl (wenn neu, vorher null oder revspin-URL)
 *  - Update description (= manufacturerDescription, wenn vorhanden)
 *  - Update communityDescription (= communityConsensus.summary, wenn vorhanden)
 *  - sourceUrl bleibt unverändert (da war revspin drin, das ist nicht öffentlich sichtbar)
 *
 * Usage: npm run db:import-research
 */

import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

const RESEARCH_DIR = path.join(process.cwd(), "db", "data", "research");

interface ResearchProduct {
  slug: string;
  name?: string;
  manufacturer?: string;
  imageUrl?: string | null;
  imageSource?: string | null;
  manufacturerUrl?: string | null;
  manufacturerDescription?: string | null;
  manufacturerSpecs?: Record<string, unknown> | null;
  communityConsensus?: {
    summary?: string | null;
    sources?: string[];
    playerLevelRange?: string | null;
    primaryUseCase?: string | null;
  } | null;
}

async function loadAllProducts(): Promise<ResearchProduct[]> {
  const files = (await fs.readdir(RESEARCH_DIR))
    .filter((f) => f.endsWith(".json"))
    .sort();

  const all: ResearchProduct[] = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(RESEARCH_DIR, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        all.push(...parsed.filter((p) => p && typeof p === "object" && "slug" in p));
      }
    } catch (err) {
      console.error(`✗ ${file} konnte nicht geladen werden: ${(err as Error).message}`);
    }
  }
  return all;
}

async function main() {
  console.log("=== Import Recherche → DB ===\n");

  const products = await loadAllProducts();
  console.log(`${products.length} Produkte aus JSONs geladen.\n`);

  // DB-Snapshots für Match-Lookup
  const dbRubbers = await db.select({ id: rubbers.id, slug: rubbers.slug, imageUrl: rubbers.imageUrl }).from(rubbers);
  const dbBlades = await db.select({ id: blades.id, slug: blades.slug, imageUrl: blades.imageUrl }).from(blades);

  const rubberBySlug = new Map(dbRubbers.map((r) => [r.slug, r]));
  const bladeBySlug = new Map(dbBlades.map((b) => [b.slug, b]));

  let matched = 0;
  let imageUpdated = 0;
  let descUpdated = 0;
  let commUpdated = 0;
  const unmatched: string[] = [];

  for (const p of products) {
    if (!p.slug) continue;

    const isRubber = rubberBySlug.has(p.slug);
    const isBlade = bladeBySlug.has(p.slug);

    if (!isRubber && !isBlade) {
      unmatched.push(p.slug);
      continue;
    }
    matched++;

    const updates: Record<string, string> = {};

    // imageUrl: nur überschreiben wenn neue Quelle eine echte URL ist
    if (p.imageUrl && p.imageUrl.startsWith("http")) {
      updates.imageUrl = p.imageUrl;
      imageUpdated++;
    }

    // description: Hersteller-Text (original, bleibt sprachlich wie geliefert)
    if (p.manufacturerDescription && p.manufacturerDescription.trim().length > 30) {
      updates.description = p.manufacturerDescription.trim();
      descUpdated++;
    }

    // communityDescription: Spielerstimmen-Synthese (bereits deutsch)
    const commSummary = p.communityConsensus?.summary;
    if (commSummary && commSummary.trim().length > 30) {
      updates.communityDescription = commSummary.trim();
      commUpdated++;
    }

    if (Object.keys(updates).length === 0) {
      console.log(`  ○ ${p.slug} — nichts zu aktualisieren`);
      continue;
    }

    if (isRubber) {
      await db.update(rubbers).set(updates).where(eq(rubbers.slug, p.slug));
    } else {
      await db.update(blades).set(updates).where(eq(blades.slug, p.slug));
    }

    const flags = [
      updates.imageUrl ? "🖼" : " ",
      updates.description ? "📄" : " ",
      updates.communityDescription ? "💬" : " ",
    ].join("");
    console.log(`  ✓ ${p.slug} ${flags}`);
  }

  console.log("\n══════════════════════════════");
  console.log(`  Geladen:           ${products.length}`);
  console.log(`  Gematched:         ${matched}`);
  console.log(`  Mit Bild:          ${imageUpdated}`);
  console.log(`  Mit Hersteller-Text: ${descUpdated}`);
  console.log(`  Mit Community-Text:  ${commUpdated}`);
  console.log(`  Kein Slug-Match:   ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("\nOhne Match:");
    unmatched.forEach((s) => console.log(`  - ${s}`));
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
