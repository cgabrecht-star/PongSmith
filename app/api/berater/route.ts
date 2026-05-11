/**
 * POST /api/berater — v2
 *
 * KI-Ausrüstungsberater mit erweiterter Tool-Architektur:
 *   - query_setups:           Holz × Belag Empfehlungen (stil-spezifische Scores v2,
 *                             Belag- + Hersteller-Diversität, enriched Output)
 *   - get_product_details:    Vollständige Beschreibung eines einzelnen Produkts
 *   - query_rubber_for_side:  Separate VH/RH-Empfehlung (Materialspieler + ambitioniert)
 *   - query_by_problem:       Symptom-basierte Suche (zu langsam, kein Spin, etc.)
 *
 * Body: { messages: { role: "user" | "assistant", content: string }[], lang?: "de" | "en" }
 * Returns: { text: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { blades, rubbers, synergies, manufacturers } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte, sql as drizzleSql } from "drizzle-orm";
import { detectProducts } from "@/lib/product-detector";
import { getShopLinks, buildTrackingUrl } from "@/lib/affiliate";
import { groupProductsBySetup } from "@/lib/setup-grouper";

export const runtime   = "nodejs";
export const dynamic   = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Bekannte westliche Marken — bei Allround-Queries bevorzugt
// ---------------------------------------------------------------------------

const WESTERN_BRANDS = new Set([
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA",
  "Xiom", "Nittaku", "Andro", "Yasaka", "Gewo", "Victas",
  "TSP", "SpinLord", "Sauer & Troger", "Dr. Neubauer",
]);

// ---------------------------------------------------------------------------
// System-Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_DE = `Du bist PongSmith, der unabhängige Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler.

## Charakter & Ton

Du bist wie der erfahrene Vereinskollege, der nach dem Training kurz Klartext redet. Ohne etwas verkaufen zu wollen. Du kennst den Frust, wenn ein Setup nicht passt.

KRITISCH wichtige Stil-Regeln:
- Sprache: immer Deutsch, vertrautes "du", kein Kumpel-Slang
- KEIN MARKDOWN: keine Sternchen für Fett (**), keine Backticks, kein # für Überschriften. Schreibe in normalem Fließtext.
- KEINE GEDANKENSTRICHE (— oder –). Statt "kontrollierter — schneller" schreib "kontrollierter, schneller" oder mit normalem Bindestrich (-).
- KEIN VERKAUFS-SPRECH: keine Superlative wie "perfekt", "ideal", "genau richtig", "Game-Changer", "Top-Pick". Stattdessen: sachlich-beschreibend ("vergibt mehr im Block", "spielt sich weicher").
- Länge: lieber 3 präzise Sätze als ein langer Absatz
- Spiegel-Moment: 1 Satz zeigt dass du verstanden hast, dann sachlich empfehlen.

## Gesprächsablauf

**Schritt 1 — Profil verstehen:**
Finde heraus: TTR (oder Erfahrung), Spielstil, aktuelles Setup (wenn vorhanden), konkretes Problem/Ziel.
Frage nie alles auf einmal. TTR + Spielstil reichen für den ersten Tool-Call.

**Schritt 2 — Tool aufrufen:**
Sobald TTR + Spielstil klar → query_setups aufrufen. Nicht länger warten.
Bei konkretem Problem (z.B. "Block instabil") → zuerst query_by_problem.
Bei Detailfrage zu einem Produkt → get_product_details.
Bei Materialspielern oder TTR > 1400 + Wunsch nach VH/RH-Trennung → query_rubber_for_side.

**Schritt 3 — Ergebnisse erklären:**
Für jede Empfehlung 1–2 Sätze WARUM sie zu diesem Spieler passt.
Nutze die mitgelieferten Produkt-Infos (Härte, Charakteristik, Beschreibung) für konkrete Begründungen.

## Spieler-Typen

**Marco-Typ (TTR 1000–1400, Allround/Offensiv):** Unsicher, glaubt Material sei schuld. Braucht vergebendes Setup. Sprache: warm, bestätigend. Bei Markenpräferenz: prefer_known_brands=true setzen.

**Tobias-Typ (TTR 1400–1700, Offensiv-Topspin):** Weiß was er will. Kann technische Erklärungen. Sprache: direkt, ambitioniert. Kein prefer_known_brands nötig — Performance zählt.

**Werner-Typ (Material-Spieler):** Spielt bewusst anders. Kein Belächeln. Nach Noppen-Typ fragen (KN/LP/Anti). Dann query_rubber_for_side für VH und RH separat.

## Symptom-Erkennung → Tool-Wahl

| Spieler sagt | → Tool | Problem-Parameter |
|---|---|---|
| "Block ist instabil / fliegt weg" | query_by_problem | block_unstable |
| "Topspin fällt zu kurz / ins Netz" | query_by_problem | topspin_falls |
| "Kein Spin drauf" | query_by_problem | no_spin |
| "Zu langsam, kein Tempo" | query_by_problem | too_slow |
| "Zu schnell, keine Kontrolle" | query_by_problem | too_fast |
| "Arm wird schnell müde" | query_by_problem | tired_arm |
| "Was ist [Produkt] genau?" | get_product_details | — |

## Datenbankresultate, strikte Regeln

Nur Produkte aus den Ergebnissen empfehlen. IMMER zwei bis drei verschiedene Setups vorschlagen, mit unterschiedlichen Hersteller-Marken wenn möglich. Nicht weniger als 2 Setups, ausser bei Anfängern (siehe unten).
Keine Produkte aus dem Gedächtnis, auch keine "generell guten" Beläge.

Bei DB_KEIN_ERGEBNIS: Ehrlich sagen, kurz warum (TTR-Randbereich, seltener Stil). Anderen Tool-Call mit leicht anderen Parametern vorschlagen.

Bei DB_ANFAENGER (TTR < 900): Direkt: unsere DB startet bei TTR 1000. Genau EINEN Einsteiger-Tipp: vorkonfektionierter Schläger 30 bis 60 Euro (Stiga, Donic, Butterfly Einstieg). Keine Belag-Namen aus dem Gedächtnis. Einladung in 3 bis 6 Monaten.

Bei Material-Spielern: Noppen-Typ klären (KN/LP/Anti). Dann query_rubber_for_side für VH und RH separat nutzen. Holz und VH-Belag im selben Response empfehlen wenn möglich.

## Wichtig zur Formulierung

Falsch: "Der **Donic Vario** ist genau der richtige Ansatz — deutlich kontrollierter als der Hexer Powergrip."
Richtig: "Der Donic Vario ist kontrollierter als der Hexer Powergrip und vergibt im Block mehr."

Falsch: "Setup-Empfehlung: **Allround-Kombi** mit maximalem Spin-Potenzial!"
Richtig: "Setup: Stiga Allround Classic mit Donic Acuda S2. Gibt dir Kontrolle ohne Tempo-Verlust."

Falsch: "Drei Wege — perfekt abgestimmt auf dein Profil."
Richtig: "Drei Setups, die zu deinem Profil passen:"`;

const SYSTEM_PROMPT_EN = `You are PongSmith, the independent table-tennis equipment advisor for club players.

## Character & Tone

You are like the experienced club teammate who gives honest advice after practice. No sales talk.

CRITICAL style rules:
- Language: always English, friendly but not chummy
- NO MARKDOWN: no asterisks for bold (**), no backticks, no # headings. Plain prose.
- NO EM-DASHES or EN-DASHES (— or –). Use commas or plain hyphens (-) instead.
- NO SALES TALK: avoid superlatives like "perfect", "ideal", "game-changer", "top pick". Stay descriptive ("gives more block forgiveness", "plays softer").
- Length: three precise sentences over one long paragraph.
- Mirror moment: one sentence showing you understood, then recommend factually.

## Conversation flow

**Step 1 — Understand the profile:**
Find: TTR (or experience), play style, current setup, specific problem/goal. Don't ask everything at once.

**Step 2 — Call the right tool:**
TTR + style clear → query_setups. Specific problem → query_by_problem first.
Detail question → get_product_details. Material player or TTR > 1400 wanting VH/RH split → query_rubber_for_side.

**Step 3 — Explain results:**
1–2 sentences per recommendation on WHY it fits this player. Use the product info provided (hardness, character, description).

## Player types

**Mid-level (TTR 1000–1400, allround/offensive):** Unsure, feels gear is to blame. Needs forgiving setup. Tone: warm, affirming. Set prefer_known_brands=true.
**Ambitious (TTR 1400–1700, offensive):** Knows what they want. Technical explanations OK. Direct, ambitious tone.
**Material player:** Respect their style. Ask pip type first (LP/SP/Anti). Use query_rubber_for_side for VH and RH.

## Symptom → Tool mapping

| Player says | → Tool | problem param |
|---|---|---|
| "Block flies off" | query_by_problem | block_unstable |
| "Topspin falls short" | query_by_problem | topspin_falls |
| "No spin" | query_by_problem | no_spin |
| "Too slow" | query_by_problem | too_slow |
| "No control" | query_by_problem | too_fast |
| "Arm tires quickly" | query_by_problem | tired_arm |
| "Tell me about [product]" | get_product_details | — |

## Database result rules

→ Only products from results. Max 3, by priority. Nothing from memory.
→ DB_KEIN_ERGEBNIS: honest, brief reason, suggest retry with adjusted params.
→ DB_ANFAENGER (TTR < 900): starts at TTR 1000, one entry-level tip (pre-made racket €30–60).`;

function getSystemPrompt(lang: "de" | "en"): string {
  return lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE;
}

// ---------------------------------------------------------------------------
// Tool-Definitionen
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_setups",
    description: "Fragt die PongSmith-DB nach passenden Holz+Belag-Kombinationen ab. Liefert bis zu 5 diverse Empfehlungen mit Produktdetails.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers (600–2000). Schätz 700 für absolute Anfänger." },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive", "material"],
          description: "Spielstil: offensive_topspin | allround | defensive | material",
        },
        rubber_type: {
          type: "string",
          enum: ["inverted", "long_pips", "short_pips", "anti"],
          description: "Optional: Belag-Typ. Weglassen für Standard (invertiert).",
        },
        prefer_known_brands: {
          type: "boolean",
          description: "true = westliche Marken bevorzugen (Butterfly, Stiga, Donic etc.). Default: true für TTR <1400, false für ambitionierte Spieler.",
        },
        max_results: {
          type: "number",
          description: "Maximale Treffer (1–5). Default: 3.",
        },
      },
      required: ["ttr", "play_style"],
    },
  },
  {
    name: "get_product_details",
    description: "Gibt vollständige Infos zu einem einzelnen Holz oder Belag zurück — Beschreibung, Community-Meinung, alle technischen Werte.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_type: { type: "string", enum: ["blade", "rubber"], description: "Produkttyp" },
        product_name: { type: "string", description: "Name des Produkts (aus query_setups Ergebnis)" },
      },
      required: ["product_type", "product_name"],
    },
  },
  {
    name: "query_rubber_for_side",
    description: "Sucht Beläge für eine spezifische Schlägerseite (VH oder RH). Für Materialspieler und ambitionierte Spieler mit unterschiedlichen VH/RH-Anforderungen.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers" },
        side: { type: "string", enum: ["vh", "rh"], description: "Schlägerseite: vh (Vorhand) oder rh (Rückhand)" },
        desired_character: {
          type: "string",
          enum: ["spin_offensive", "control_allround", "control_defensive", "long_pips", "short_pips", "anti"],
          description: "Gewünschter Charakter: spin_offensive | control_allround | control_defensive | long_pips | short_pips | anti",
        },
      },
      required: ["ttr", "side", "desired_character"],
    },
  },
  {
    name: "query_by_problem",
    description: "Symptom-basierte Suche: Spieler beschreibt ein konkretes Problem → passende Lösungen.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers" },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive", "material"],
        },
        problem: {
          type: "string",
          enum: ["block_unstable", "topspin_falls", "no_spin", "too_slow", "too_fast", "tired_arm"],
          description: "Problem: block_unstable | topspin_falls | no_spin | too_slow | too_fast | tired_arm",
        },
      },
      required: ["ttr", "play_style", "problem"],
    },
  },
];

// ---------------------------------------------------------------------------
// DB-Hilfstyp
// ---------------------------------------------------------------------------

interface SetupRow {
  synergyScore: number;
  scoreOffensive: number | null;
  scoreAllround: number | null;
  scoreDefensive: number | null;
  scoreMaterial: number | null;
  tempoMatch: number | null;
  controlReserve: number | null;
  spinPotential: number | null;
  bladeName: string;
  bladeManufacturerId: number;
  bladeComposition: string | null;
  bladeStiffness: string | null;
  rubberName: string;
  rubberHardnessMin: number | null;
  rubberHardnessMax: number | null;
  rubberTopsheet: string | null;
  ttrTarget: number;
}

// ---------------------------------------------------------------------------
// Diversitäts-Filter: max 1 pro Hersteller + max 1 pro Belag → Top N
// ---------------------------------------------------------------------------

function diversify(
  rows: SetupRow[],
  maxResults: number,
  preferWestern: boolean,
): SetupRow[] {
  const seenManufacturer = new Set<number>();
  const seenRubber = new Set<string>();
  const result: SetupRow[] = [];

  // Wenn Westmarken bevorzugt: zuerst Westmarken, dann Rest
  // (Rows sind bereits nach Score sortiert — Westmarke-Bonus durch Voranstellen)
  // Wir gehen einfach durch und sortieren Westmarken-Treffer nach vorne
  // ohne den Score zu ändern.

  const processRow = (row: SetupRow): boolean => {
    if (seenManufacturer.has(row.bladeManufacturerId)) return false;
    if (seenRubber.has(row.rubberName)) return false;
    seenManufacturer.add(row.bladeManufacturerId);
    seenRubber.add(row.rubberName);
    result.push(row);
    return true;
  };

  if (preferWestern) {
    // Zuerst Westmarken
    for (const row of rows) {
      if (result.length >= maxResults) break;
      if (WESTERN_BRANDS.has(row.bladeName.split(" ")[0] ?? "")) {
        processRow(row);
      }
    }
    // Dann Rest auffüllen
    for (const row of rows) {
      if (result.length >= maxResults) break;
      if (!result.includes(row)) processRow(row);
    }
  } else {
    for (const row of rows) {
      if (result.length >= maxResults) break;
      processRow(row);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Ergebnis-Formatter
// ---------------------------------------------------------------------------

function formatHardness(min: number | null, max: number | null): string {
  if (min === null) return "k.A.";
  if (max === null) return `${min}°`;
  return `${min}–${max}°`;
}

function formatTopsheet(ts: string | null): string {
  if (!ts) return "";
  if (ts === "sticky") return "klebrig (chinesisch)";
  if (ts === "grippy") return "griffig (europäisch)";
  return "neutral";
}

function rowsToText(rows: SetupRow[], ttr: number, styleName: string, lang: "de" | "en"): string {
  const isEn = lang === "en";
  const header = isEn
    ? `Database results for TTR ${ttr} (${styleName}):`
    : `Datenbankresultate für TTR ${ttr} (${styleName}):`;

  const lines = rows.map((r, i) => {
    const hardness = formatHardness(r.rubberHardnessMin, r.rubberHardnessMax);
    const topsheet = r.rubberTopsheet ? `Topsheet: ${formatTopsheet(r.rubberTopsheet)}` : "";
    const composition = r.bladeComposition ? `Aufbau: ${r.bladeComposition}` : "";
    const stiffness = r.bladeStiffness ? `Steifigkeit: ${r.bladeStiffness}` : "";

    const bladeInfo = [composition, stiffness].filter(Boolean).join(", ");
    const rubberInfo = [hardness !== "k.A." ? `Härte: ${hardness}` : "", topsheet].filter(Boolean).join(", ");

    return [
      `${i + 1}. Holz: ${r.bladeName}${bladeInfo ? ` (${bladeInfo})` : ""}`,
      `   Belag: ${r.rubberName}${rubberInfo ? ` (${rubberInfo})` : ""}`,
      `   Synergie: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch ?? "–"} | Kontrolle: ${r.controlReserve ?? "–"} | Spin: ${r.spinPotential ?? "–"}`,
    ].join("\n");
  });

  return `${header}\n\n${lines.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Tool: query_setups
// ---------------------------------------------------------------------------

async function runQuerySetups(
  ttr: number,
  playStyle: string,
  rubberType: string | undefined,
  preferKnownBrands: boolean,
  maxResults: number,
  lang: "de" | "en",
): Promise<string> {
  if (ttr < 900) return "DB_ANFAENGER";

  const clamped = Math.max(1000, Math.min(1700, ttr));

  // Material-Spieler
  const isMaterial = playStyle === "material" || (rubberType && rubberType !== "inverted");
  if (isMaterial) {
    const dbRubberType =
      rubberType === "long_pips" ? "long_pips"
      : rubberType === "short_pips" ? "short_pips"
      : rubberType === "anti" ? "anti"
      : null;
    return runMaterialQuery(clamped, dbRubberType, preferKnownBrands, Math.min(maxResults, 5), lang);
  }

  const validStyle = ["offensive_topspin", "allround", "defensive"].includes(playStyle)
    ? playStyle as "offensive_topspin" | "allround" | "defensive"
    : "allround";

  // Stil-spezifische Score-Spalte wählen
  const scoreColumn =
    validStyle === "offensive_topspin" ? synergies.scoreOffensive
    : validStyle === "defensive"       ? synergies.scoreDefensive
    : synergies.scoreAllround;

  const rows = await db
    .select({
      synergyScore: synergies.synergyScore,
      scoreOffensive: synergies.scoreOffensive,
      scoreAllround: synergies.scoreAllround,
      scoreDefensive: synergies.scoreDefensive,
      scoreMaterial: synergies.scoreMaterial,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      bladeName: blades.name,
      bladeManufacturerId: blades.manufacturerId,
      bladeComposition: blades.composition,
      bladeStiffness: blades.stiffness,
      rubberName: rubbers.name,
      rubberHardnessMin: rubbers.hardnessMin,
      rubberHardnessMax: rubbers.hardnessMax,
      rubberTopsheet: rubbers.topsheetCharacter,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, validStyle),
        eq(rubbers.type, "smooth"),
      ),
    )
    .orderBy(desc(scoreColumn))
    .limit(80); // großes Pool für Diversitäts-Filter

  const diverse = diversify(rows as SetupRow[], Math.min(maxResults, 5), preferKnownBrands);

  if (diverse.length === 0) {
    // Fallback: Spielstil auf allround lockern
    const fallback = await db
      .select({
        synergyScore: synergies.synergyScore,
        scoreOffensive: synergies.scoreOffensive,
        scoreAllround: synergies.scoreAllround,
        scoreDefensive: synergies.scoreDefensive,
        scoreMaterial: synergies.scoreMaterial,
        tempoMatch: synergies.tempoMatch,
        controlReserve: synergies.controlReserve,
        spinPotential: synergies.spinPotential,
        bladeName: blades.name,
        bladeManufacturerId: blades.manufacturerId,
        bladeComposition: blades.composition,
        bladeStiffness: blades.stiffness,
        rubberName: rubbers.name,
        rubberHardnessMin: rubbers.hardnessMin,
        rubberHardnessMax: rubbers.hardnessMax,
        rubberTopsheet: rubbers.topsheetCharacter,
        ttrTarget: synergies.ttrTarget,
      })
      .from(synergies)
      .innerJoin(blades, eq(synergies.bladeId, blades.id))
      .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
      .where(
        and(
          gte(synergies.ttrTarget, clamped - 300),
          lte(synergies.ttrTarget, clamped + 300),
          eq(rubbers.type, "smooth"),
        ),
      )
      .orderBy(desc(synergies.scoreAllround))
      .limit(80);

    const diverseFallback = diversify(fallback as SetupRow[], 5, preferKnownBrands);
    if (diverseFallback.length === 0) {
      return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Stil: ${validStyle})`;
    }

    const styleName = lang === "en" ? "Allround (Fallback)" : "Allround (Fallback, keine genauen Treffer für gewünschten Stil)";
    return rowsToText(diverseFallback, ttr, styleName, lang);
  }

  const styleNames: Record<string, string> = {
    offensive_topspin: lang === "en" ? "Offensive/Topspin" : "Offensiv/Topspin",
    allround: "Allround",
    defensive: lang === "en" ? "Defensive" : "Defensiv",
  };

  return rowsToText(diverse, ttr, styleNames[validStyle] ?? validStyle, lang);
}

async function runMaterialQuery(
  clamped: number,
  rubberType: "long_pips" | "short_pips" | "anti" | null,
  preferKnownBrands: boolean,
  maxResults: number,
  lang: "de" | "en",
): Promise<string> {
  const rubberTypeFilter = rubberType
    ? eq(rubbers.type, rubberType)
    : inArray(rubbers.type, ["long_pips", "short_pips", "anti"]);

  const rows = await db
    .select({
      synergyScore: synergies.synergyScore,
      scoreOffensive: synergies.scoreOffensive,
      scoreAllround: synergies.scoreAllround,
      scoreDefensive: synergies.scoreDefensive,
      scoreMaterial: synergies.scoreMaterial,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      bladeName: blades.name,
      bladeManufacturerId: blades.manufacturerId,
      bladeComposition: blades.composition,
      bladeStiffness: blades.stiffness,
      rubberName: rubbers.name,
      rubberHardnessMin: rubbers.hardnessMin,
      rubberHardnessMax: rubbers.hardnessMax,
      rubberTopsheet: rubbers.topsheetCharacter,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, "material"),
        rubberTypeFilter,
      ),
    )
    .orderBy(desc(synergies.scoreMaterial))
    .limit(80);

  const diverse = diversify(rows as SetupRow[], maxResults, preferKnownBrands);

  if (diverse.length === 0) {
    return `DB_KEIN_ERGEBNIS (TTR: ${clamped}, Material-Stil: ${rubberType ?? "alle Typen"})`;
  }

  const typeName = lang === "en"
    ? (rubberType === "long_pips" ? "Long Pips" : rubberType === "short_pips" ? "Short Pips" : rubberType === "anti" ? "Anti" : "Material")
    : (rubberType === "long_pips" ? "Lange Noppen" : rubberType === "short_pips" ? "Kurze Noppen" : rubberType === "anti" ? "Anti-Belag" : "Material");

  return rowsToText(diverse, clamped, typeName, lang);
}

// ---------------------------------------------------------------------------
// Tool: get_product_details
// ---------------------------------------------------------------------------

async function runGetProductDetails(
  productType: "blade" | "rubber",
  productName: string,
  lang: "de" | "en",
): Promise<string> {
  const isEn = lang === "en";

  if (productType === "blade") {
    const rows = await db
      .select({
        name: blades.name,
        composition: blades.composition,
        stiffness: blades.stiffness,
        layers: blades.layers,
        weightMin: blades.weightMin,
        weightMax: blades.weightMax,
        communitySpeed: blades.communitySpeed,
        communityControl: blades.communityControl,
        communityReviewCount: blades.communityReviewCount,
        speedNorm: blades.speedNorm,
        controlNorm: blades.controlNorm,
        ttrMin: blades.ttrMin,
        ttrMax: blades.ttrMax,
        description: blades.description,
        communityDescription: blades.communityDescription,
      })
      .from(blades)
      .where(drizzleSql`LOWER(${blades.name}) LIKE LOWER(${"%" + productName + "%"})`)
      .limit(1);

    if (rows.length === 0) {
      return isEn
        ? `No blade found matching "${productName}".`
        : `Kein Holz gefunden mit Name "${productName}".`;
    }

    const b = rows[0]!;
    const speed = b.communitySpeed ?? b.speedNorm ?? "k.A.";
    const control = b.communityControl ?? b.controlNorm ?? "k.A.";
    const weight = b.weightMin && b.weightMax ? `${b.weightMin}–${b.weightMax}g` : "k.A.";

    return [
      `Holz: ${b.name}`,
      `Aufbau: ${b.composition ?? "k.A."} | Steifigkeit: ${b.stiffness ?? "k.A."} | Furniere: ${b.layers ?? "k.A."} | Gewicht: ${weight}`,
      `Speed: ${speed} | Kontrolle: ${control} (Community, ${b.communityReviewCount ?? 0} Reviews)`,
      b.description ? `\nHersteller-Info: ${b.description.substring(0, 400)}` : "",
      b.communityDescription ? `\nSpieler-Fazit: ${b.communityDescription.substring(0, 300)}` : "",
    ].filter(Boolean).join("\n");
  }

  // rubber
  const rows = await db
    .select({
      name: rubbers.name,
      type: rubbers.type,
      hardnessMin: rubbers.hardnessMin,
      hardnessMax: rubbers.hardnessMax,
      topsheetCharacter: rubbers.topsheetCharacter,
      communitySpeed: rubbers.communitySpeed,
      communitySpin: rubbers.communitySpin,
      communityControl: rubbers.communityControl,
      communityReviewCount: rubbers.communityReviewCount,
      ttrMin: rubbers.ttrMin,
      ttrMax: rubbers.ttrMax,
      description: rubbers.description,
      communityDescription: rubbers.communityDescription,
    })
    .from(rubbers)
    .where(drizzleSql`LOWER(${rubbers.name}) LIKE LOWER(${"%" + productName + "%"})`)
    .limit(1);

  if (rows.length === 0) {
    return isEn
      ? `No rubber found matching "${productName}".`
      : `Kein Belag gefunden mit Name "${productName}".`;
  }

  const r = rows[0]!;
  const hardness = formatHardnessDetail(r.hardnessMin, r.hardnessMax);
  const topsheet = r.topsheetCharacter ? formatTopsheet(r.topsheetCharacter) : "k.A.";
  const typeLabel = r.type === "smooth" ? "Noppen innen" : r.type === "long_pips" ? "Lange Noppen" : r.type === "short_pips" ? "Kurze Noppen" : "Anti";

  return [
    `Belag: ${r.name} (${typeLabel})`,
    `Härte: ${hardness} | Topsheet: ${topsheet}`,
    `Speed: ${r.communitySpeed ?? "k.A."} | Spin: ${r.communitySpin ?? "k.A."} | Kontrolle: ${r.communityControl ?? "k.A."} (${r.communityReviewCount ?? 0} Reviews)`,
    r.description ? `\nHersteller-Info: ${r.description.substring(0, 400)}` : "",
    r.communityDescription ? `\nSpieler-Fazit: ${r.communityDescription.substring(0, 300)}` : "",
  ].filter(Boolean).join("\n");
}

function formatHardnessDetail(min: number | null, max: number | null): string {
  if (!min) return "k.A.";
  return max ? `${min}–${max}°` : `${min}°`;
}

// ---------------------------------------------------------------------------
// Tool: query_rubber_for_side
// ---------------------------------------------------------------------------

async function runQueryRubberForSide(
  ttr: number,
  side: "vh" | "rh",
  desiredCharacter: string,
  lang: "de" | "en",
): Promise<string> {
  const clamped = Math.max(1000, Math.min(1700, ttr));
  const isEn = lang === "en";

  // Character → Filter-Logik
  let rubberTypeFilter;
  let scoreColumn;
  let minSpeed: number | null = null;
  let maxSpeed: number | null = null;

  switch (desiredCharacter) {
    case "spin_offensive":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreOffensive;
      minSpeed = 7;
      break;
    case "control_allround":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreAllround;
      break;
    case "control_defensive":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreDefensive;
      maxSpeed = 7;
      break;
    case "long_pips":
      rubberTypeFilter = eq(rubbers.type, "long_pips");
      scoreColumn = synergies.scoreMaterial;
      break;
    case "short_pips":
      rubberTypeFilter = eq(rubbers.type, "short_pips");
      scoreColumn = synergies.scoreMaterial;
      break;
    case "anti":
      rubberTypeFilter = eq(rubbers.type, "anti");
      scoreColumn = synergies.scoreMaterial;
      break;
    default:
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreAllround;
  }

  const conditions = [
    gte(synergies.ttrTarget, clamped - 250),
    lte(synergies.ttrTarget, clamped + 250),
    rubberTypeFilter,
  ];

  const rows = await db
    .select({
      rubberName: rubbers.name,
      rubberHardnessMin: rubbers.hardnessMin,
      rubberHardnessMax: rubbers.hardnessMax,
      rubberTopsheet: rubbers.topsheetCharacter,
      communitySpeed: rubbers.communitySpeed,
      communitySpin: rubbers.communitySpin,
      communityControl: rubbers.communityControl,
      score: scoreColumn,
    })
    .from(synergies)
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(and(...conditions))
    .orderBy(desc(scoreColumn))
    .limit(100);

  // Deduplizieren nach Belag-Name, Speed-Filter anwenden
  const seen = new Set<string>();
  const filtered = rows
    .filter((r) => {
      const s = parseFloat(String(r.communitySpeed ?? 7));
      if (minSpeed !== null && s < minSpeed) return false;
      if (maxSpeed !== null && s > maxSpeed) return false;
      return true;
    })
    .filter((r) => {
      if (seen.has(r.rubberName)) return false;
      seen.add(r.rubberName);
      return true;
    })
    .slice(0, 3);

  if (filtered.length === 0) {
    return isEn
      ? `DB_KEIN_ERGEBNIS (TTR: ${ttr}, side: ${side}, character: ${desiredCharacter})`
      : `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Seite: ${side}, Charakter: ${desiredCharacter})`;
  }

  const sideLabel = isEn ? (side === "vh" ? "Forehand" : "Backhand") : (side === "vh" ? "Vorhand" : "Rückhand");
  const charLabel = isEn ? desiredCharacter : {
    spin_offensive: "Spin/Offensiv", control_allround: "Control/Allround",
    control_defensive: "Control/Defensiv", long_pips: "Lange Noppen",
    short_pips: "Kurze Noppen", anti: "Anti",
  }[desiredCharacter] ?? desiredCharacter;

  const header = isEn
    ? `Rubber recommendations for ${sideLabel} (TTR ${ttr}, ${charLabel}):`
    : `Belag-Empfehlungen für ${sideLabel} (TTR ${ttr}, ${charLabel}):`;

  const lines = filtered.map((r, i) => {
    const hardness = formatHardnessDetail(r.rubberHardnessMin, r.rubberHardnessMax);
    const topsheet = r.rubberTopsheet ? formatTopsheet(r.rubberTopsheet) : "";
    const speed = r.communitySpeed ?? "–";
    const spin = r.communitySpin ?? "–";
    const control = r.communityControl ?? "–";
    return `${i + 1}. ${r.rubberName} | Härte: ${hardness} | ${topsheet ? `Topsheet: ${topsheet} | ` : ""}Speed: ${speed}, Spin: ${spin}, Kontrolle: ${control}`;
  });

  return `${header}\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Tool: query_by_problem
// ---------------------------------------------------------------------------

async function runQueryByProblem(
  ttr: number,
  playStyle: string,
  problem: string,
  lang: "de" | "en",
): Promise<string> {
  const clamped = Math.max(1000, Math.min(1700, ttr));

  // Problem → Score-Priorität und Mindest-Werte
  const problemConfig: Record<string, {
    orderByCol: keyof typeof synergies;
    descriptionDE: string;
    descriptionEN: string;
    minControl?: number;
    minSpin?: number;
    minTempo?: number;
    maxTempo?: number;
  }> = {
    block_unstable: {
      orderByCol: "controlReserve",
      descriptionDE: "Block instabil — Setup mit hoher Kontrollreserve gesucht",
      descriptionEN: "Unstable block — looking for high control reserve",
      minControl: 70,
    },
    topspin_falls: {
      orderByCol: "spinPotential",
      descriptionDE: "Topspin fällt zu kurz — Setup mit höherem Spin-Potenzial gesucht",
      descriptionEN: "Topspin falls short — higher spin potential needed",
      minSpin: 75,
    },
    no_spin: {
      orderByCol: "spinPotential",
      descriptionDE: "Kein Spin — spinstarkes Setup gesucht",
      descriptionEN: "No spin — high-spin setup needed",
      minSpin: 80,
    },
    too_slow: {
      orderByCol: "tempoMatch",
      descriptionDE: "Zu langsam — schnelleres Setup gesucht",
      descriptionEN: "Too slow — faster setup needed",
      minTempo: 60,
    },
    too_fast: {
      orderByCol: "controlReserve",
      descriptionDE: "Zu schnell — kontrollierbareres Setup gesucht",
      descriptionEN: "Too fast — more controllable setup needed",
      minControl: 75,
      maxTempo: 70,
    },
    tired_arm: {
      orderByCol: "controlReserve",
      descriptionDE: "Müder Arm — leichteres, weiches Setup gesucht",
      descriptionEN: "Tired arm — lighter, softer setup needed",
      minControl: 70,
      maxTempo: 65,
    },
  };

  const config = problemConfig[problem];
  if (!config) {
    return `DB_KEIN_ERGEBNIS (unbekanntes Problem: ${problem})`;
  }

  const validStyle = ["offensive_topspin", "allround", "defensive", "material"].includes(playStyle)
    ? playStyle as "offensive_topspin" | "allround" | "defensive" | "material"
    : "allround";

  const scoreColumn =
    validStyle === "offensive_topspin" ? synergies.scoreOffensive
    : validStyle === "defensive"       ? synergies.scoreDefensive
    : validStyle === "material"        ? synergies.scoreMaterial
    : synergies.scoreAllround;

  // Primäre Sortierung nach problem-spezifischer Spalte
  const orderCol =
    config.orderByCol === "controlReserve" ? synergies.controlReserve
    : config.orderByCol === "spinPotential" ? synergies.spinPotential
    : synergies.tempoMatch;

  const conditions = [
    gte(synergies.ttrTarget, clamped - 300),
    lte(synergies.ttrTarget, clamped + 300),
    eq(synergies.playStyleTarget, validStyle),
    eq(rubbers.type, "smooth"),
  ];

  const rows = await db
    .select({
      synergyScore: synergies.synergyScore,
      scoreOffensive: synergies.scoreOffensive,
      scoreAllround: synergies.scoreAllround,
      scoreDefensive: synergies.scoreDefensive,
      scoreMaterial: synergies.scoreMaterial,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      bladeName: blades.name,
      bladeManufacturerId: blades.manufacturerId,
      bladeComposition: blades.composition,
      bladeStiffness: blades.stiffness,
      rubberName: rubbers.name,
      rubberHardnessMin: rubbers.hardnessMin,
      rubberHardnessMax: rubbers.hardnessMax,
      rubberTopsheet: rubbers.topsheetCharacter,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(and(...conditions))
    .orderBy(desc(orderCol))
    .limit(100);

  // Zusätzliche Filter nach Problem-Schwellwerten
  const filtered = (rows as SetupRow[]).filter((r) => {
    if (config.minControl !== undefined && (r.controlReserve ?? 0) < config.minControl) return false;
    if (config.minSpin !== undefined && (r.spinPotential ?? 0) < config.minSpin) return false;
    if (config.minTempo !== undefined && (r.tempoMatch ?? 0) < config.minTempo) return false;
    if (config.maxTempo !== undefined && (r.tempoMatch ?? 100) > config.maxTempo) return false;
    return true;
  });

  const diverse = diversify(filtered, 3, true);

  if (diverse.length === 0) {
    return lang === "de"
      ? `DB_KEIN_ERGEBNIS — Kein Setup mit passendem Profil für "${problem}" gefunden. Versuche query_setups mit dem Spielstil.`
      : `DB_KEIN_ERGEBNIS — No setup found for problem "${problem}". Try query_setups with the play style.`;
  }

  const styleLabel = lang === "en" ? config.descriptionEN : config.descriptionDE;
  return rowsToText(diverse, ttr, styleLabel, lang);
}

// ---------------------------------------------------------------------------
// Agentic Loop
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY nicht konfiguriert." },
      { status: 503 },
    );
  }

  try {
    const { messages, lang: rawLang } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      lang?: string;
    };

    const lang: "de" | "en" = rawLang === "en" ? "en" : "de";
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let current: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Agentic Loop (max. 6 Runden — mehr Tools = mehr mögliche Calls)
    for (let i = 0; i < 6; i++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1200,
        system: getSystemPrompt(lang),
        tools: TOOLS,
        messages: current,
      });

      if (response.stop_reason === "end_turn") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        // Produkte erkennen
        const detected = await detectProducts(text);

        // Bild-URLs + Review-Counts + Slugs pro Produkt nachladen
        const bladeIds = detected.filter((p) => p.type === "blade").map((p) => p.id);
        const rubberIds = detected.filter((p) => p.type === "rubber").map((p) => p.id);

        const [bladeMeta, rubberMeta] = await Promise.all([
          bladeIds.length > 0
            ? db.select({
                id: blades.id,
                slug: blades.slug,
                imageUrl: blades.imageUrl,
                reviewCount: blades.communityReviewCount,
              }).from(blades).where(inArray(blades.id, bladeIds))
            : Promise.resolve([]),
          rubberIds.length > 0
            ? db.select({
                id: rubbers.id,
                slug: rubbers.slug,
                imageUrl: rubbers.imageUrl,
                reviewCount: rubbers.communityReviewCount,
              }).from(rubbers).where(inArray(rubbers.id, rubberIds))
            : Promise.resolve([]),
        ]);

        const bladeMetaById = new Map(bladeMeta.map((b) => [b.id, b]));
        const rubberMetaById = new Map(rubberMeta.map((r) => [r.id, r]));

        const enrichProduct = (p: typeof detected[0]) => {
          const meta = p.type === "blade" ? bladeMetaById.get(p.id) : rubberMetaById.get(p.id);
          const ref = { type: p.type, id: p.id, name: p.name, manufacturer: p.manufacturer };
          const shops = getShopLinks(ref).map((l) => ({
            id: l.shop.id,
            name: l.shop.name,
            url: buildTrackingUrl({ shopId: l.shop.id, productType: p.type, productId: p.id }),
            affiliateActive: l.affiliateActive,
          }));
          return {
            type: p.type,
            id: p.id,
            name: p.name,
            manufacturer: p.manufacturer,
            slug: meta?.slug ?? null,
            imageUrl: meta?.imageUrl ?? null,
            reviewCount: meta?.reviewCount ?? 0,
            shops,
          };
        };

        const products = detected.map(enrichProduct);

        // Setup-Gruppen erkennen + Synergie-Scores pro Setup nachladen
        const setupGroups = groupProductsBySetup(text, detected);

        const setups = await Promise.all(setupGroups.map(async (g) => {
          const blade = g.products.find((p) => p.type === "blade");
          const setupRubbers = g.products.filter((p) => p.type === "rubber");

          // Synergie-Score: Durchschnitt der Holz×Belag-Synergien dieses Setups
          let synergyScore: number | null = null;
          if (blade && setupRubbers.length > 0) {
            const synRows = await db.select({
              score: synergies.synergyScore,
            }).from(synergies).where(
              and(
                eq(synergies.bladeId, blade.id),
                inArray(synergies.rubberId, setupRubbers.map((r) => r.id)),
              ),
            );
            if (synRows.length > 0) {
              const avg = synRows.reduce((s, r) => s + r.score, 0) / synRows.length;
              synergyScore = Math.round(avg);
            }
          }

          return {
            index: g.index,
            title: g.title,
            description: g.description,
            synergyScore,
            products: g.products.map(enrichProduct),
          };
        }));

        return NextResponse.json({ text, products, setups });
      }

      if (response.stop_reason === "tool_use") {
        const toolBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolBlock of toolBlocks) {
          let toolResult = "";

          if (toolBlock.name === "query_setups") {
            const inp = toolBlock.input as {
              ttr: number;
              play_style: string;
              rubber_type?: string;
              prefer_known_brands?: boolean;
              max_results?: number;
            };
            toolResult = await runQuerySetups(
              inp.ttr,
              inp.play_style,
              inp.rubber_type,
              inp.prefer_known_brands ?? true,
              inp.max_results ?? 3,
              lang,
            );
          } else if (toolBlock.name === "get_product_details") {
            const inp = toolBlock.input as { product_type: "blade" | "rubber"; product_name: string };
            toolResult = await runGetProductDetails(inp.product_type, inp.product_name, lang);
          } else if (toolBlock.name === "query_rubber_for_side") {
            const inp = toolBlock.input as { ttr: number; side: "vh" | "rh"; desired_character: string };
            toolResult = await runQueryRubberForSide(inp.ttr, inp.side, inp.desired_character, lang);
          } else if (toolBlock.name === "query_by_problem") {
            const inp = toolBlock.input as { ttr: number; play_style: string; problem: string };
            toolResult = await runQueryByProblem(inp.ttr, inp.play_style, inp.problem, lang);
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: toolResult,
          });
        }

        current = [
          ...current,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ];
      }
    }

    const fallback = lang === "en"
      ? "Sorry, I couldn't generate a response."
      : "Entschuldigung, konnte keine Antwort generieren.";
    return NextResponse.json({ text: fallback });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[berater]", msg);
    const detail = process.env.NODE_ENV !== "production" ? msg : msg.substring(0, 120);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
