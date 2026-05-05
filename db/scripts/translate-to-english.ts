/**
 * Übersetzt deutsche Hersteller- und Community-Beschreibungen ins Englische.
 *
 * Strategie:
 *  - Alle Produkte mit `description` (DE) UND ohne `descriptionEn` (EN) → übersetzen
 *  - Gleiches für `communityDescription` → `communityDescriptionEn`
 *  - Claude Haiku 4.5 erzeugt eine eigenständige englische Formulierung,
 *    keine wörtliche Übersetzung — gleicher Inhalt, neutraler Ton.
 *  - Tischtennis-Fachbegriffe bleiben englisch (Topspin, Sponge, ALC etc.)
 *
 * Usage: npm run db:translate-to-english
 */
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq, isNotNull, isNull, and } from "drizzle-orm";
import { config } from "../../lib/config";

const SYSTEM = `You are a German→English translator for table-tennis equipment descriptions.

Task:
1. Read the German manufacturer or community description of a table-tennis product
2. Write a NEW English text — NOT a literal translation
3. Same factual content — specs, properties, target audience, playing characteristics
4. Original phrasing in your own English words
5. Neutral tone, no marketing fluff ("revolutionary", "perfect" → avoid)
6. Length: similar to the original (short → short, detailed → detailed)
7. Keep table-tennis terminology in English (topspin, spin rate, sweet spot, sponge hardness, ply, ALC, tensor, etc.)
8. Keep product names as-is (e.g., "Tenergy 05", "Hurricane 3")
9. Use British or American English consistently — pick one and stick with it. Prefer British English (rubber, racket, sponge) for table-tennis context.

Reply ONLY with the English text — no quotation marks, no introduction, no commentary. Plain flowing text only.`;

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  descriptionEn: string | null;
  communityDescription: string | null;
  communityDescriptionEn: string | null;
}

async function translate(client: Anthropic, sourceText: string, productName: string, kind: string): Promise<string | null> {
  try {
    const response = await client.messages.create({
      model: config.modelHintergrund,  // Haiku 4.5
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Product: ${productName} (${kind})\n\nGerman text:\n\n${sourceText}`,
      }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text.length > 20 ? text : null;
  } catch (err) {
    console.error(`  ✗ API: ${(err as Error).message.substring(0, 80)}`);
    return null;
  }
}

async function processTable(
  client: Anthropic,
  kind: "rubber" | "blade",
) {
  const table = kind === "rubber" ? rubbers : blades;

  // Alle mit DE-Text aber ohne EN-Text holen — separat für description und communityDescription
  const candidates = await db
    .select({
      id: table.id,
      slug: table.slug,
      name: table.name,
      description: table.description,
      descriptionEn: table.descriptionEn,
      communityDescription: table.communityDescription,
      communityDescriptionEn: table.communityDescriptionEn,
    })
    .from(table) as ProductRow[];

  console.log(`\n=== ${kind === "rubber" ? "Beläge" : "Hölzer"} ===`);

  let descTranslated = 0;
  let commTranslated = 0;
  let skipped = 0;

  for (const r of candidates) {
    const needsDesc = r.description && r.description.length > 30 && !r.descriptionEn;
    const needsComm = r.communityDescription && r.communityDescription.length > 30 && !r.communityDescriptionEn;

    if (!needsDesc && !needsComm) { skipped++; continue; }

    const updates: Partial<{ descriptionEn: string; communityDescriptionEn: string }> = {};

    if (needsDesc) {
      process.stdout.write(`  → ${r.slug} [desc]... `);
      const en = await translate(client, r.description!, r.name, kind);
      if (en) {
        updates.descriptionEn = en;
        descTranslated++;
        console.log(`✓ ${en.length}c`);
      } else {
        console.log("⚠ skip");
      }
    }

    if (needsComm) {
      process.stdout.write(`  → ${r.slug} [community]... `);
      const en = await translate(client, r.communityDescription!, r.name, kind);
      if (en) {
        updates.communityDescriptionEn = en;
        commTranslated++;
        console.log(`✓ ${en.length}c`);
      } else {
        console.log("⚠ skip");
      }
    }

    if (Object.keys(updates).length > 0) {
      if (kind === "rubber") {
        await db.update(rubbers).set(updates).where(eq(rubbers.id, r.id));
      } else {
        await db.update(blades).set(updates).where(eq(blades.id, r.id));
      }
    }
  }

  console.log(`\n  Hersteller-Texte übersetzt: ${descTranslated}`);
  console.log(`  Community-Texte übersetzt:  ${commTranslated}`);
  console.log(`  Bereits EN vorhanden:       ${skipped}`);
}

async function main() {
  console.log("=== DE → EN Übersetzung ===\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("✗ ANTHROPIC_API_KEY fehlt");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  await processTable(client, "rubber");
  await processTable(client, "blade");

  console.log("\n══════════════════════════════ Fertig.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
