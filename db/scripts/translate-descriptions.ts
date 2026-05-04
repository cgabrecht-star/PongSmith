/**
 * Übersetzt englische Hersteller-Beschreibungen ins Deutsche
 * und formuliert sie um (kein 1:1-Copy, aber sachlich identisch).
 *
 * Verwendet Claude Haiku 4.5 — schnell und günstig (~0.001 USD pro Produkt).
 *
 * Strategie:
 *  1. Lade alle Beläge + Hölzer mit description IS NOT NULL
 *  2. Erkenne automatisch ob Text Englisch ist (einfache Heuristik)
 *  3. Sende englische Texte an Haiku → Deutsche Umformulierung
 *  4. Update DB
 *
 * Usage: npm run db:translate-descriptions
 */
// Erst .env.local explizit laden, BEVOR andere Imports laufen die env-Vars brauchen
import { config as loadDotenv } from "dotenv";
import path from "path";
loadDotenv({ path: path.join(process.cwd(), ".env.local") });

import Anthropic from "@anthropic-ai/sdk";
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";
import { config } from "../../lib/config";

const SYSTEM = `Du bist ein deutscher Tischtennis-Übersetzer. Deine Aufgabe:

1. Lies den englischen Hersteller-Text eines Tischtennis-Produkts
2. Schreibe einen NEUEN deutschen Text — NICHT eine wörtliche Übersetzung
3. Inhaltlich exakt das gleiche — Specs, Eigenschaften, Zielgruppe, Spielcharakter
4. Eigene Formulierung in deutschen Worten
5. Sachlich-neutraler Ton, kein Marketing-Sprech ("revolutionär", "perfekt", "weltbester" → vermeiden)
6. Länge: ähnlich wie das Original (kurzer Original → kurzer deutscher Text, ausführlicher Original → ausführlicher deutscher Text)
7. Tischtennis-Fachbegriffe behalten (Topspin, Spinrate, Sweetspot, Schwammhärte, Furnier, ALC, Tensor, etc.)
8. Produktname auf Englisch belassen (z.B. "Tenergy 05", nicht "Energie 05")

Antworte NUR mit dem deutschen Text — ohne Anführungszeichen drumherum, ohne Einleitung, ohne Kommentare. Reine Fließtext-Antwort.`;

// Heuristik: ist der Text englisch?
function isEnglish(text: string): boolean {
  const englishMarkers = /\b(the|and|for|with|this|that|player|rubber|blade|sponge|spin|speed|control|attack|defensive|offensive|topspin)\b/gi;
  const germanMarkers = /\b(der|die|das|und|für|mit|ein|eine|Belag|Holz|Schwamm|Spieler|Spiel|wird|sich|nicht)\b/gi;

  const en = (text.match(englishMarkers) ?? []).length;
  const de = (text.match(germanMarkers) ?? []).length;

  return en > de;
}

async function translate(client: Anthropic, originalText: string, productName: string): Promise<string | null> {
  try {
    const response = await client.messages.create({
      model: config.modelHintergrund,  // Haiku 4.5
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Produkt: ${productName}\n\nEnglischer Hersteller-Text:\n\n${originalText}`,
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return text.length > 20 ? text : null;
  } catch (err) {
    console.error(`  ✗ API-Fehler: ${(err as Error).message.substring(0, 80)}`);
    return null;
  }
}

async function main() {
  console.log("=== Englische Hersteller-Texte → Deutsch ===\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("✗ ANTHROPIC_API_KEY fehlt in .env.local");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Beläge ───────────────────────────────────────────────────────────
  const dbRubbers = await db.select({
    id: rubbers.id,
    slug: rubbers.slug,
    name: rubbers.name,
    description: rubbers.description,
  }).from(rubbers);

  const englishRubbers = dbRubbers.filter((r) => r.description && isEnglish(r.description));
  console.log(`${englishRubbers.length} Beläge mit englischem Text gefunden\n`);

  let translated = 0;
  for (const r of englishRubbers) {
    process.stdout.write(`  → ${r.slug}... `);
    const german = await translate(client, r.description!, r.name);
    if (german) {
      await db.update(rubbers).set({ description: german }).where(eq(rubbers.id, r.id));
      translated++;
      console.log(`✓ (${german.length}c)`);
    } else {
      console.log("⚠ übersprungen");
    }
  }

  // ── Hölzer ───────────────────────────────────────────────────────────
  const dbBlades = await db.select({
    id: blades.id,
    slug: blades.slug,
    name: blades.name,
    description: blades.description,
  }).from(blades);

  const englishBlades = dbBlades.filter((b) => b.description && isEnglish(b.description));
  console.log(`\n${englishBlades.length} Hölzer mit englischem Text gefunden\n`);

  let bladeTranslated = 0;
  for (const b of englishBlades) {
    process.stdout.write(`  → ${b.slug}... `);
    const german = await translate(client, b.description!, b.name);
    if (german) {
      await db.update(blades).set({ description: german }).where(eq(blades.id, b.id));
      bladeTranslated++;
      console.log(`✓ (${german.length}c)`);
    } else {
      console.log("⚠ übersprungen");
    }
  }

  console.log("\n══════════════════════════════");
  console.log(`  Beläge übersetzt: ${translated} / ${englishRubbers.length}`);
  console.log(`  Hölzer übersetzt: ${bladeTranslated} / ${englishBlades.length}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
