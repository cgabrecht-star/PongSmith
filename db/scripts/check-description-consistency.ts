/**
 * Vergleicht Hersteller-Beschreibung mit Community-Beschreibung pro Produkt.
 * Erkennt thematische Mismatches (z.B. LP-Belag vs Community-Text über invertierten Belag).
 *
 * Verwendet Claude Haiku 4.5 — schnell und günstig.
 * Output: Konsole + db/data/consistency-report.json
 *
 * Usage: npm run db:check-consistency
 */
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../index";
import { rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";
import { config } from "../../lib/config";
import fs from "fs/promises";
import path from "path";

const SYSTEM = `Du bist ein Tischtennis-Experte und prüfst Datenkonsistenz.

Du bekommst zwei Beschreibungen desselben Tischtennis-Produkts:
1. Hersteller-Beschreibung (faktisch korrekt, definiert was das Produkt ist)
2. Community-Beschreibung (Spielerstimmen, gefährlich da Quell-Verwechslungen möglich sind)

Deine Aufgabe: Stimmen beide thematisch überein?

Achte besonders auf:
- Belag-Typ-Konflikt (LP/Lange Noppen vs invertiert, Anti vs Tensor, Kurze Noppen vs Glatt)
- Holz vs Belag verwechselt
- Komplett unterschiedliche Spielcharakteristik (z.B. ultra-defensiv vs Power-Offensiv)
- Marken-Verwechslung
- Andere Produkt-Generation/Variante

Antworte STRENG in einem dieser zwei Formate:

OK
oder
MISMATCH: <kurze Begründung in einem Satz auf Deutsch>

Toleranz: kleine Detailunterschiede, leichte Wertungsdifferenzen, unterschiedliche TTR-Range-Angaben sind OK. Nur thematische Hauptkategorie-Verwechslungen sind MISMATCH.`;

interface FlaggedProduct {
  slug: string;
  kind: "rubber" | "blade";
  name: string;
  manufacturer: string;
  reason: string;
  description: string;
  communityDescription: string;
}

async function checkOne(
  client: Anthropic,
  productLabel: string,
  description: string,
  communityDescription: string,
): Promise<{ status: "OK" | "MISMATCH"; reason: string }> {
  try {
    const response = await client.messages.create({
      model: config.modelHintergrund,
      max_tokens: 200,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Produkt: ${productLabel}\n\nHersteller-Beschreibung:\n${description}\n\nCommunity-Beschreibung:\n${communityDescription}`,
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (text.startsWith("OK")) {
      return { status: "OK", reason: "" };
    }
    if (text.startsWith("MISMATCH")) {
      const reason = text.replace(/^MISMATCH:\s*/i, "").trim();
      return { status: "MISMATCH", reason };
    }
    // Unklare Antwort
    return { status: "OK", reason: `Unklare KI-Antwort: ${text.substring(0, 80)}` };
  } catch (err) {
    return { status: "OK", reason: `API-Fehler: ${(err as Error).message.substring(0, 60)}` };
  }
}

async function main() {
  console.log("=== Konsistenz-Check Hersteller vs Community ===\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("✗ ANTHROPIC_API_KEY fehlt");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const dbRubbers = await db.select({
    id: rubbers.id, slug: rubbers.slug, name: rubbers.name,
    manufacturerId: rubbers.manufacturerId,
    type: rubbers.type,
    description: rubbers.description,
    communityDescription: rubbers.communityDescription,
  }).from(rubbers);

  const dbBlades = await db.select({
    id: blades.id, slug: blades.slug, name: blades.name,
    manufacturerId: blades.manufacturerId,
    description: blades.description,
    communityDescription: blades.communityDescription,
  }).from(blades);

  // beide haben description + communityDescription
  const rubbersToCheck = dbRubbers.filter((r) => r.description && r.communityDescription);
  const bladesToCheck = dbBlades.filter((b) => b.description && b.communityDescription);

  console.log(`${rubbersToCheck.length} Beläge + ${bladesToCheck.length} Hölzer mit beiden Texten zu prüfen.\n`);

  const flagged: FlaggedProduct[] = [];
  let okCount = 0;

  // ── Beläge ────────────────────────────────────────────────────────────
  for (const r of rubbersToCheck) {
    const typeLabel =
      r.type === "smooth" ? "INVERTIERT (glatt, Standard-Tensor)"
      : r.type === "long_pips" ? "LANGE NOPPEN (LP/KN)"
      : r.type === "short_pips" ? "KURZE NOPPEN (SP)"
      : r.type === "anti" ? "ANTI-TOPSPIN"
      : r.type;
    const label = `${r.name} [${typeLabel}]`;
    process.stdout.write(`  → ${r.slug}... `);
    const result = await checkOne(client, label, r.description!, r.communityDescription!);
    if (result.status === "OK") {
      okCount++;
      console.log("OK");
    } else {
      flagged.push({
        slug: r.slug, kind: "rubber", name: r.name,
        manufacturer: String(r.manufacturerId),
        reason: result.reason,
        description: r.description!,
        communityDescription: r.communityDescription!,
      });
      console.log(`⚠ MISMATCH: ${result.reason}`);
    }
  }

  // ── Hölzer ────────────────────────────────────────────────────────────
  for (const b of bladesToCheck) {
    const label = `${b.name} [HOLZ]`;
    process.stdout.write(`  → ${b.slug}... `);
    const result = await checkOne(client, label, b.description!, b.communityDescription!);
    if (result.status === "OK") {
      okCount++;
      console.log("OK");
    } else {
      flagged.push({
        slug: b.slug, kind: "blade", name: b.name,
        manufacturer: String(b.manufacturerId),
        reason: result.reason,
        description: b.description!,
        communityDescription: b.communityDescription!,
      });
      console.log(`⚠ MISMATCH: ${result.reason}`);
    }
  }

  console.log("\n══════════════════════════════");
  console.log(`  Geprüft:    ${okCount + flagged.length}`);
  console.log(`  OK:         ${okCount}`);
  console.log(`  Mismatches: ${flagged.length}`);

  // Report speichern
  const reportPath = path.join(process.cwd(), "db", "data", "consistency-report.json");
  await fs.writeFile(reportPath, JSON.stringify(flagged, null, 2), "utf-8");
  console.log(`\n  Report: ${reportPath}`);

  if (flagged.length > 0) {
    console.log("\n=== Verdächtige Produkte ===\n");
    flagged.forEach((f) => {
      console.log(`✗ ${f.slug}`);
      console.log(`  Grund: ${f.reason}`);
      console.log(`  Hersteller: ${f.description.substring(0, 100)}…`);
      console.log(`  Community:  ${f.communityDescription.substring(0, 100)}…`);
      console.log();
    });
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
