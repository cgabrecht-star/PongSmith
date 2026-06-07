/**
 * POST /api/berater, v2
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
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { blades, rubbers, synergies, manufacturers, shopProducts, shops } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { getShopLinks, buildTrackingUrl } from "@/lib/affiliate";
import { config } from "@/lib/config";

export const runtime   = "nodejs";
export const dynamic   = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Bekannte westliche Marken, bei Allround-Queries bevorzugt
// ---------------------------------------------------------------------------

const WESTERN_BRANDS = new Set([
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA",
  "Xiom", "Nittaku", "Andro", "Yasaka", "Gewo", "Victas",
  "TSP", "SpinLord", "Sauer & Troger", "Dr. Neubauer",
]);

// ---------------------------------------------------------------------------
// System-Prompts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Profil (Output der Triangulation, Input für Retrieval + Erklärung)
// ---------------------------------------------------------------------------

interface BeraterProfile {
  ttr: number | null;
  play_style: "offensive_topspin" | "allround" | "defensive" | "material" | null;
  budget_max_eur: number | null;
  technique_solid: boolean | null;
  training_systematic: boolean | null;
  aspiration: "faster" | "more_control" | "same_level" | null;
  problem: string | null;
  rubber_type: "inverted" | "long_pips" | "short_pips" | "anti" | null;
  change_scope: "full" | "blade_only" | "rubber_only" | "rubber_vh_rh" | null;
  current_blade: string | null;
  current_rubber_vh: string | null;
  current_rubber_rh: string | null;
}

// ---------------------------------------------------------------------------
// Stufe 1: Triangulation (billiges Modell, strukturierter Output)
// ---------------------------------------------------------------------------

/**
 * Schema das das Triangulations-Modell ausfüllen MUSS (forced tool call).
 * Entweder done=false + eine Rückfrage, oder done=true + befülltes Profil.
 */
const TRIANGULATION_TOOL: Anthropic.Tool = {
  name: "submit_triage",
  description:
    "Entscheide ob du genug Information hast, um ein Setup zu empfehlen. Wenn ja: done=true und fülle profile so vollständig wie möglich. Wenn nein: done=false und stell EINE gezielte Rückfrage.",
  input_schema: {
    type: "object" as const,
    properties: {
      done: {
        type: "boolean",
        description:
          "true = genug Info, jetzt empfehlen. false = eine wichtige Info fehlt noch, Rückfrage nötig.",
      },
      question: {
        type: ["string", "null"],
        description:
          "Wenn done=false: die EINE Rückfrage an den Spieler, warm und konkret, maximal 2 Aspekte. Wenn done=true: null.",
      },
      profile: {
        type: "object",
        properties: {
          ttr: { type: ["number", "null"], description: "TTR/LPZ des Spielers (600-2400). null wenn unbekannt." },
          play_style: {
            type: ["string", "null"],
            enum: ["offensive_topspin", "allround", "defensive", "material", null],
          },
          budget_max_eur: {
            type: ["number", "null"],
            description: "Maximales Gesamtbudget in EUR. null = egal oder unbekannt.",
          },
          technique_solid: {
            type: ["boolean", "null"],
            description: "Sitzt die betroffene Technik grundsätzlich? null wenn unklar.",
          },
          training_systematic: {
            type: ["boolean", "null"],
            description: "Trainiert systematisch (Trainer/feste Übungen)? false = nur Punktspiele. null wenn unklar.",
          },
          aspiration: {
            type: ["string", "null"],
            enum: ["faster", "more_control", "same_level", null],
            description: "Will der Spieler schneller (faster), mehr Kontrolle (more_control), oder gleiches Niveau halten (same_level)?",
          },
          problem: {
            type: ["string", "null"],
            description: "Das konkrete Problem in einem Satz, z.B. 'Topspin gegen Unterschnitt fällt ins Netz'.",
          },
          rubber_type: {
            type: ["string", "null"],
            enum: ["inverted", "long_pips", "short_pips", "anti", null],
            description: "Belag-Typ. Default inverted (glatt). Nur bei Materialspielern abweichend.",
          },
          change_scope: {
            type: ["string", "null"],
            enum: ["full", "blade_only", "rubber_only", "rubber_vh_rh", null],
            description: "Was soll getauscht werden: alles (full), nur Holz (blade_only), nur Beläge (rubber_only), VH+RH getrennt (rubber_vh_rh).",
          },
          current_blade: { type: ["string", "null"], description: "Aktuelles Holz, falls genannt." },
          current_rubber_vh: { type: ["string", "null"], description: "Aktueller VH-Belag, falls genannt." },
          current_rubber_rh: { type: ["string", "null"], description: "Aktueller RH-Belag, falls genannt." },
        },
        required: [
          "ttr", "play_style", "budget_max_eur", "technique_solid",
          "training_systematic", "aspiration", "problem", "rubber_type",
          "change_scope", "current_blade", "current_rubber_vh", "current_rubber_rh",
        ],
      },
    },
    required: ["done", "question", "profile"],
  },
};

const TRIAGE_SYSTEM_DE = `Du bist der Aufnahme-Schritt eines Tischtennis-Beraters. Deine EINZIGE Aufgabe: aus dem Gespräch herauslesen, ob genug Info für eine seriöse Setup-Empfehlung da ist, und das Profil strukturiert füllen. Du empfiehlst NICHT selbst, du formulierst keine Produkte, du rufst nur submit_triage auf.

Damit done=true gesetzt werden darf, MÜSSEN diese drei Dinge klar sein:
1. TTR (oder grobe Selbst-Einordnung, dann schätz die TTR)
2. Spielstil (offensiv_topspin, allround, defensiv, material)
3. Ein konkretes Problem ODER ein konkretes Ziel (nicht "spiele schlecht", sondern eine erkennbare Situation oder ein klarer Wunsch)

Stark erwünscht, aber nicht zwingend für done=true:
- Budget (oder ein explizites "egal")
- technique_solid: sitzt die Technik (ehrliche Selbsteinschätzung)
- training_systematic: Trainer/Struktur vs. nur Punktspiele

Regeln für die Rückfrage (done=false):
- Stell GENAU EINE Rückfrage, warm und konkret, maximal 2 Aspekte zusammen.
- Frag nach dem wichtigsten was noch fehlt. Reihenfolge der Wichtigkeit: erst Problem/Ziel, dann Trainingskontext+Technik (zusammen in einer Frage), dann Budget.
- Stell NIE eine Frage die im Gespräch schon beantwortet wurde.
- Beim allerersten Turn mit dünner Eingabe ("spiele schlecht", "will besser werden"): immer zuerst zurückfragen.

Triangulation gegen Selbstüberschätzung (fürs Befüllen von technique_solid):
- Wer nur Punktspiele macht, kein systematisches Training: technique_solid eher false.
- Wer mit Trainer oder deutlich stärkerem Sparring übt: technique_solid eher true.
- Niedrige TTR + "Technik sitzt": vorsichtig, technique_solid eher false.

Befüll profile immer so vollständig wie möglich aus dem was gesagt wurde. Unbekanntes = null. Wenn der Spieler "egal" zum Budget sagt: budget_max_eur = null.`;

const TRIAGE_SYSTEM_EN = `You are the intake step of a table-tennis advisor. Your ONLY job: read the conversation and decide whether there is enough info for a serious setup recommendation, then fill the profile. You do NOT recommend, you do NOT name products, you only call submit_triage.

For done=true, these three must be clear:
1. TTR (or rough self-assessment, then estimate)
2. Play style (offensive_topspin, allround, defensive, material)
3. A concrete problem OR goal

Strongly wanted but not required: budget, technique_solid, training_systematic.

If asking back (done=false): exactly ONE warm, concrete question, max 2 aspects, never re-ask something already answered. Fill profile as completely as possible, unknown = null.`;

function triageSystem(lang: "de" | "en"): string {
  return lang === "en" ? TRIAGE_SYSTEM_EN : TRIAGE_SYSTEM_DE;
}

// ---------------------------------------------------------------------------
// Stufe 3: Erklärung (Sonnet, schreibt die menschliche Prosa um die
// bereits per Code gewählten Setups herum)
// ---------------------------------------------------------------------------

const EXPLAIN_SYSTEM_DE = `Du bist PongSmith, der unabhängige Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler. Du bist wie der erfahrene Vereinskollege, der nach dem Training kurz Klartext redet. Ohne etwas verkaufen zu wollen.

Die passenden Setups sind bereits von der Datenbank ausgewählt, im Budget gefiltert und nach Eignung sortiert. Deine Aufgabe ist NUR das Erklären, nicht das Auswählen. Du rechnest nichts, du filterst nichts, du erfindest nichts.

## Stil-Regeln (strikt)
- Sprache: Deutsch, vertrautes "du", kein Kumpel-Slang.
- KEIN MARKDOWN: keine Sternchen, keine Backticks, keine Überschriften. Fließtext.
- KEINE GEDANKENSTRICHE: weder Em-Dash noch En-Dash, keine doppelten Bindestriche. Nutz Kommas. Normale Bindestriche in Komposita (5-Lagen-Holz) sind ok.
- KEIN VERKAUFS-SPRECH: keine Superlative wie "perfekt", "ideal", "genau richtig", "Game-Changer". Sachlich-beschreibend ("vergibt mehr im Block", "spielt sich weicher").
- Kurz und präzise. Lieber drei klare Sätze als ein Absatz Geschwafel.

## Aufbau deiner Antwort
1. Ein Spiegel-Satz: zeig dass du Problem und Profil verstanden hast (die ehrliche Diagnose). Wenn die Technik laut Profil wackelig ist und das Problem eher technischer Natur, sag das ehrlich, aber respektvoll: Material verschiebt das Problem, löst es nicht komplett.
2. Dann die Setups in der vorgegebenen Reihenfolge. Setup 1 ist die Top-Empfehlung. Sprich sie in dieser Reihenfolge an. Pro Setup 1-2 Sätze WARUM es zum Profil passt, mit Bezug auf Synergie/Tempo/Kontrolle/Spin und Preis.
3. Wenn der Spieler nur Holz oder nur Beläge tauschen wollte (change_scope): sag das aktiv ("dein Holz behältst du, ich empfehle nur die Beläge die dazu passen").
4. Ein kurzer ehrlicher Abschluss-Tipp WELCHES Setup du an seiner Stelle nehmen würdest. Das muss Setup 1 sein, sonst widersprichst du der Reihenfolge.

## WICHTIG, keine Erfindungen
- Nenne AUSSCHLIESSLICH die Produkte aus den vorgegebenen Setups. Niemals ein Produkt aus dem Gedächtnis dazuerfinden, auch wenn dir eins einfällt.
- Wenn keine Setups übergeben wurden (leere Liste), erfinde keine. Erklär ehrlich warum (steht im Kontext) und nutz den Dialog für eine Rückfrage.

## Keine Rückgabe-/Test-Floskeln
Erwähne NIE "Rückgaberecht", "zurückgeben falls es nicht passt", "im Fachhandel testen", "Vereinskollegen fragen ob du den Belag mal aufkleben darfst". Ein gekaufter Belag ist endgültig. Tu nicht so als gäbe es einen risikofreien Test.

## Fachwissen (nutz es beim Erklären, nie als Marketing)
Belag-Topsheets: grippy = europäisch tensioniert (Tenergy, Rakza, Hexer, Evolution, Bluefire), moderner Standard ab TTR ~1300. sticky = klebrig chinesisch (Hurricane Neo, Skyline), höchstes Spinpotenzial aber anspruchsvoll, braucht steifes Holz, ab TTR ~1500. hybrid = chinesisches Topsheet + Tensor-Schwamm (Tibhar K3, Dynaryz CMD, Rakza Z), Trend, tolerant ab ~1400. neutral = gutmütig (Donic Slice, Acuda S3, Rakza 7), anfängerfreundlich.
Holz: Allround 5-furnig Vollholz = verzeihend. Carbon innen (Innerforce) = behält Holzgefühl, dämpft, ab ~1500. Carbon außen (ALC, Viscaria, Timo Boll ALC) = direkter, härter, ab ~1400. Balsa = leicht, gut bei Arm-Problemen.
Synergie-Score: 90+ exzellent, 80-89 gut, 70-79 ok aber kommentieren, unter 70 vorsichtig.
Tempo/Kontrolle/Spin sind absolute Werte 0-100: unter 50 niedrig, 50-70 mittel, 70-85 hoch, 85+ sehr hoch. Anfänger TTR unter 1300 brauchen Kontrolle über 85. Ambitioniert ab 1500 verträgt Tempo 80+.
Preis "k.A." bedeutet kein UVP gepflegt. Nicht raten, ehrlich sagen.`;

const EXPLAIN_SYSTEM_EN = `You are PongSmith, an independent table-tennis equipment advisor. The matching setups are already selected by the database, budget-filtered and sorted. Your job is ONLY to explain, not to select. You do not compute, filter, or invent anything.

Style: English, friendly "you", no markdown, no em/en-dashes (use commas), no sales superlatives, concise.
Structure: one mirror sentence showing you understood the profile and problem (honest diagnosis), then the setups in the given order (Setup 1 is the top pick), 1-2 sentences each on WHY it fits referencing synergy/speed/control/spin and price, then a short honest closing tip naming Setup 1.
Never invent products, only mention the given setups. If the setup list is empty, do not invent any, explain honestly and use the dialog to ask back. Never mention returns, refunds, or risk-free testing.`;

function explainSystem(lang: "de" | "en"): string {
  return lang === "en" ? EXPLAIN_SYSTEM_EN : EXPLAIN_SYSTEM_DE;
}


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
  bladeId: number;
  bladeName: string;
  bladeManufacturerId: number;
  bladeComposition: string | null;
  bladeStiffness: string | null;
  bladePriceEur: string | null;
  bladeReviewCount: number | null;
  bladeIsCurated: boolean | null;
  rubberId: number;
  rubberName: string;
  rubberHardnessMin: number | null;
  rubberHardnessMax: number | null;
  rubberTopsheet: string | null;
  rubberPriceEur: string | null;
  rubberReviewCount: number | null;
  rubberIsCurated: boolean | null;
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

  const processRow = (row: SetupRow): boolean => {
    if (seenManufacturer.has(row.bladeManufacturerId)) return false;
    if (seenRubber.has(row.rubberName)) return false;
    seenManufacturer.add(row.bladeManufacturerId);
    seenRubber.add(row.rubberName);
    result.push(row);
    return true;
  };

  const isWestern = (row: SetupRow): boolean => {
    const firstWord = row.bladeName.split(" ")[0] ?? "";
    if (!WESTERN_BRANDS.has(firstWord)) return false;
    // Auch der Belag-Hersteller sollte westlich sein.
    // Wir greifen den ersten Token vom Belag-Namen ab.
    const rubberFirstWord = row.rubberName.split(" ")[0] ?? "";
    return WESTERN_BRANDS.has(rubberFirstWord);
  };

  if (preferWestern) {
    // STRIKT: Nur Westmarken. Keine Auffüll-Logik mit chinesischen Beläge mehr,
    // weil die für die Kern-Zielgruppe (Vereinsspieler ohne Spezial-Vorliebe)
    // nicht zur Spielerfahrung passen und beim Kauf bei DE-Shops oft nicht
    // verfügbar sind.
    for (const row of rows) {
      if (result.length >= maxResults) break;
      if (isWestern(row)) processRow(row);
    }
    // Notfall-Fallback nur wenn 0 Western-Treffer existieren: dann zumindest
    // irgendwas zurückgeben, damit der Berater nicht "DB leer" sagt.
    if (result.length === 0) {
      for (const row of rows) {
        if (result.length >= maxResults) break;
        processRow(row);
      }
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
  return `${min}-${max}°`;
}

function formatTopsheet(ts: string | null): string {
  if (!ts) return "";
  if (ts === "sticky") return "klebrig klassisch (chinesisch, ungespannt)";
  if (ts === "grippy") return "griffig (europäisch tensioniert)";
  if (ts === "hybrid") return "HYBRID (chin. Topsheet + europ. Tensor-Schwamm)";
  return "neutral";
}

function formatPrice(eur: string | null): string {
  if (!eur) return "Preis k.A.";
  const n = parseFloat(eur);
  return `${Math.round(n)} EUR`;
}

function formatPopularity(reviewCount: number | null, isCurated?: boolean | null): string {
  if (isCurated) return "DE-Klassiker, redaktionell ergänzt";
  const n = reviewCount ?? 0;
  if (n >= 100) return "Klassiker";
  if (n >= 30) return "etabliert";
  if (n >= 10) return "bekannt";
  return "Nische";
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

    const bladePrice = formatPrice(r.bladePriceEur);
    const rubberPrice = formatPrice(r.rubberPriceEur);
    const totalPrice = setupPrice(r);
    const totalLine = totalPrice
      ? `   GESAMT-PREIS: ~${totalPrice} EUR (Holz ${bladePrice} + Belag ${rubberPrice}, ein Belag pro Seite gerechnet)`
      : `   PREIS: ${bladePrice} (Holz) + ${rubberPrice} (Belag), Gesamt unbekannt`;

    return [
      `${i + 1}. Holz: ${r.bladeName} [${formatPopularity(r.bladeReviewCount, r.bladeIsCurated)}]${bladeInfo ? ` (${bladeInfo})` : ""}`,
      `   Belag: ${r.rubberName} [${formatPopularity(r.rubberReviewCount, r.rubberIsCurated)}]${rubberInfo ? ` (${rubberInfo})` : ""}`,
      totalLine,
      `   Synergie: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch ?? "-"} | Kontrolle: ${r.controlReserve ?? "-"} | Spin: ${r.spinPotential ?? "-"}`,
    ].join("\n");
  });

  return `${header}\n\n${lines.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Wiederverwendbare Select-Felder + Filter
// ---------------------------------------------------------------------------

const SETUP_ROW_SELECT = {
  synergyScore: synergies.synergyScore,
  scoreOffensive: synergies.scoreOffensive,
  scoreAllround: synergies.scoreAllround,
  scoreDefensive: synergies.scoreDefensive,
  scoreMaterial: synergies.scoreMaterial,
  tempoMatch: synergies.tempoMatch,
  controlReserve: synergies.controlReserve,
  spinPotential: synergies.spinPotential,
  bladeId: blades.id,
  bladeName: blades.name,
  bladeManufacturerId: blades.manufacturerId,
  bladeComposition: blades.composition,
  bladeStiffness: blades.stiffness,
  bladePriceEur: blades.priceEur,
  bladeReviewCount: blades.communityReviewCount,
  bladeIsCurated: blades.isManuallyCurated,
  rubberId: rubbers.id,
  rubberName: rubbers.name,
  rubberHardnessMin: rubbers.hardnessMin,
  rubberHardnessMax: rubbers.hardnessMax,
  rubberTopsheet: rubbers.topsheetCharacter,
  rubberPriceEur: rubbers.priceEur,
  rubberReviewCount: rubbers.communityReviewCount,
  rubberIsCurated: rubbers.isManuallyCurated,
  ttrTarget: synergies.ttrTarget,
} as const;

/** Filter: nur Produkte mit minimalem Review-Count (Verfügbarkeits-Proxy
 *  gegen discontinued/Nische-Hölzer die niemand mehr kaufen kann). */
const MIN_REVIEW_COUNT = 10;

/** Holz-Filter: bekanntes Produkt ODER redaktionell ergänzter DE-Klassiker. */
const bladeAvailabilityFilter = or(
  gte(blades.communityReviewCount, MIN_REVIEW_COUNT),
  eq(blades.isManuallyCurated, true),
);

/** Belag-Filter: identisches Konzept. */
const rubberAvailabilityFilter = or(
  gte(rubbers.communityReviewCount, MIN_REVIEW_COUNT),
  eq(rubbers.isManuallyCurated, true),
);

/** Setup-Preis (Holz + Belag). null wenn ein Preis fehlt. */
function setupPrice(row: SetupRow): number | null {
  const b = row.bladePriceEur ? parseFloat(row.bladePriceEur) : null;
  const r = row.rubberPriceEur ? parseFloat(row.rubberPriceEur) : null;
  if (b === null || r === null) return null;
  return Math.round(b + r);
}

/** Filter Setups auf Budget-Cap. Setups ohne Preisdaten bleiben drin
 *  (KI bekommt dann den Hinweis "Preis unbekannt"). */
function applyBudget(rows: SetupRow[], budgetMaxEur?: number): SetupRow[] {
  if (!budgetMaxEur) return rows;
  return rows.filter((r) => {
    const p = setupPrice(r);
    return p === null || p <= budgetMaxEur * 1.05; // 5% Toleranz
  });
}

/** Confidence-Discount: Setups mit niedrigen Review-Counts werden in der
 *  Sortierung leicht abgewertet, damit [Klassiker] systematisch vor
 *  [bekannt] angezeigt werden. Der angezeigte synergyScore bleibt unverändert
 *  - wir verändern nur die Sortier-Reihenfolge.
 */
function confidenceFactor(reviewCount: number | null): number {
  const n = reviewCount ?? 0;
  if (n >= 100) return 1.0;   // Klassiker: voller Score
  if (n >= 30) return 0.97;   // etabliert: minimaler Abschlag
  if (n >= 10) return 0.90;   // bekannt: 10% Abschlag
  return 0.75;                // Nische: 25% Abschlag (kommt durch Filter eh selten)
}

function sortByConfidenceAdjustedScore(
  rows: SetupRow[],
  coverage?: { blades: Set<number>; rubbers: Set<number> },
): SetupRow[] {
  return [...rows].sort((a, b) => {
    const aFactor = Math.min(
      confidenceFactor(a.bladeReviewCount),
      confidenceFactor(a.rubberReviewCount),
    );
    const bFactor = Math.min(
      confidenceFactor(b.bladeReviewCount),
      confidenceFactor(b.rubberReviewCount),
    );
    // Affiliate-Coverage als sanfter Tiebreaker (max +2 Punkte).
    // synergyScore selbst wird NICHT modifiziert — nur die Sort-Reihenfolge.
    const aBonus = coverage ? affiliateBonus(a, coverage) : 0;
    const bBonus = coverage ? affiliateBonus(b, coverage) : 0;
    return (b.synergyScore + bBonus) * bFactor - (a.synergyScore + aBonus) * aFactor;
  });
}

function affiliateBonus(
  row: SetupRow,
  coverage: { blades: Set<number>; rubbers: Set<number> },
): number {
  const bladeCovered = coverage.blades.has(row.bladeId);
  const rubberCovered = coverage.rubbers.has(row.rubberId);
  return (bladeCovered ? 1 : 0) + (rubberCovered ? 1 : 0);
}

/**
 * Ermittelt für jede Produkt-ID ob ein aktiver Affiliate-Direkt-Link in
 * shop_products existiert. Liefert zwei Sets: covered blade IDs + rubber IDs.
 * Wird einmal pro Tool-Call gemacht (Bulk-Query), dann pro Row gelookup'd.
 */
async function loadAffiliateCoverage(
  bladeIds: number[],
  rubberIds: number[],
): Promise<{ blades: Set<number>; rubbers: Set<number> }> {
  if (bladeIds.length === 0 && rubberIds.length === 0) {
    return { blades: new Set(), rubbers: new Set() };
  }
  const rows = await db
    .select({
      productType: shopProducts.productType,
      productId: shopProducts.productId,
      affiliateProgram: shops.affiliateProgram,
    })
    .from(shopProducts)
    .innerJoin(shops, eq(shopProducts.shopId, shops.id))
    .where(
      and(
        eq(shopProducts.isActive, true),
        or(
          bladeIds.length > 0
            ? and(eq(shopProducts.productType, "blade"), inArray(shopProducts.productId, bladeIds))
            : undefined,
          rubberIds.length > 0
            ? and(eq(shopProducts.productType, "rubber"), inArray(shopProducts.productId, rubberIds))
            : undefined,
        ),
      ),
    );
  const blades = new Set<number>();
  const rubbers = new Set<number>();
  for (const r of rows) {
    // Nur als "covered" zählen wenn Shop einen aktiven Affiliate hat.
    if (!r.affiliateProgram || r.affiliateProgram === "none") continue;
    if (r.productType === "blade") blades.add(r.productId);
    else if (r.productType === "rubber") rubbers.add(r.productId);
  }
  return { blades, rubbers };
}


// ---------------------------------------------------------------------------
// Tool: query_setups
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Stufe 2: Retrieval (reiner Code, KEIN LLM)
// Liefert die fertig sortierten, budget-gefilterten Setup-Rows zurück.
// ---------------------------------------------------------------------------

interface RetrievalResult {
  rows: SetupRow[];
  styleName: string;
  status: "ok" | "fallback" | "empty";
}

const PREFER_KNOWN_TTR_CUTOFF = 1400;

/** Aspirations-Boost: wer explizit schneller will, kriegt ein höheres
 *  TTR-Suchfenster, damit ALC/Carbon-Hölzer in die Resultate rutschen. */
function effectiveTtr(profile: BeraterProfile): number {
  const base = profile.ttr ?? 1300;
  if (profile.aspiration === "faster") return base + 200;
  return base;
}

async function retrieveStandard(
  ttr: number,
  validStyle: "offensive_topspin" | "allround" | "defensive",
  preferKnownBrands: boolean,
  budgetMaxEur: number | undefined,
  lang: "de" | "en",
): Promise<RetrievalResult> {
  const clamped = Math.max(1000, Math.min(1700, ttr));
  const scoreColumn =
    validStyle === "offensive_topspin" ? synergies.scoreOffensive
    : validStyle === "defensive" ? synergies.scoreDefensive
    : synergies.scoreAllround;

  const rows = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, validStyle),
        eq(rubbers.type, "smooth"),
        bladeAvailabilityFilter,
        rubberAvailabilityFilter,
      ),
    )
    .orderBy(desc(scoreColumn))
    .limit(120);

  const budgetFiltered = applyBudget(rows as SetupRow[], budgetMaxEur);
  const coverage = await loadAffiliateCoverage(
    [...new Set(budgetFiltered.map((r) => r.bladeId))],
    [...new Set(budgetFiltered.map((r) => r.rubberId))],
  );
  const confidenceSorted = sortByConfidenceAdjustedScore(budgetFiltered, coverage);
  const diverse = diversify(confidenceSorted, 3, preferKnownBrands);

  const styleNames: Record<string, string> = {
    offensive_topspin: lang === "en" ? "Offensive/Topspin" : "Offensiv/Topspin",
    allround: "Allround",
    defensive: lang === "en" ? "Defensive" : "Defensiv",
  };

  if (diverse.length > 0) {
    return { rows: diverse, styleName: styleNames[validStyle] ?? validStyle, status: "ok" };
  }

  // Fallback: Stil auf allround lockern
  const fallback = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(rubbers.type, "smooth"),
        bladeAvailabilityFilter,
        rubberAvailabilityFilter,
      ),
    )
    .orderBy(desc(synergies.scoreAllround))
    .limit(120);

  const fbBudget = applyBudget(fallback as SetupRow[], budgetMaxEur);
  const fbCoverage = await loadAffiliateCoverage(
    [...new Set(fbBudget.map((r) => r.bladeId))],
    [...new Set(fbBudget.map((r) => r.rubberId))],
  );
  const fbSorted = sortByConfidenceAdjustedScore(fbBudget, fbCoverage);
  const fbDiverse = diversify(fbSorted, 3, preferKnownBrands);

  if (fbDiverse.length === 0) {
    return { rows: [], styleName: styleNames[validStyle] ?? validStyle, status: "empty" };
  }
  const fbName = lang === "en" ? "Allround (fallback)" : "Allround (Näherung)";
  return { rows: fbDiverse, styleName: fbName, status: "fallback" };
}

async function retrieveMaterial(
  ttr: number,
  rubberType: "long_pips" | "short_pips" | "anti" | null,
  preferKnownBrands: boolean,
  budgetMaxEur: number | undefined,
  lang: "de" | "en",
): Promise<RetrievalResult> {
  const clamped = Math.max(1000, Math.min(1700, ttr));
  const rubberTypeFilter = rubberType
    ? eq(rubbers.type, rubberType)
    : inArray(rubbers.type, ["long_pips", "short_pips", "anti"]);

  const rows = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, "material"),
        rubberTypeFilter,
        bladeAvailabilityFilter,
        rubberAvailabilityFilter,
      ),
    )
    .orderBy(desc(synergies.scoreMaterial))
    .limit(120);

  const budgetFiltered = applyBudget(rows as SetupRow[], budgetMaxEur);
  const coverage = await loadAffiliateCoverage(
    [...new Set(budgetFiltered.map((r) => r.bladeId))],
    [...new Set(budgetFiltered.map((r) => r.rubberId))],
  );
  const confidenceSorted = sortByConfidenceAdjustedScore(budgetFiltered, coverage);
  const diverse = diversify(confidenceSorted, 3, preferKnownBrands);

  const typeName = lang === "en"
    ? (rubberType === "long_pips" ? "Long Pips" : rubberType === "short_pips" ? "Short Pips" : rubberType === "anti" ? "Anti" : "Material")
    : (rubberType === "long_pips" ? "Lange Noppen" : rubberType === "short_pips" ? "Kurze Noppen" : rubberType === "anti" ? "Anti-Belag" : "Material");

  return {
    rows: diverse,
    styleName: typeName,
    status: diverse.length > 0 ? "ok" : "empty",
  };
}

/** Haupteinstieg Stufe 2: wählt anhand des Profils den Retrieval-Pfad. */
async function retrieveSetups(profile: BeraterProfile, lang: "de" | "en"): Promise<RetrievalResult> {
  const ttr = effectiveTtr(profile);
  const preferKnown = ttr < PREFER_KNOWN_TTR_CUTOFF;
  const budget = profile.budget_max_eur ?? undefined;

  const isMaterial =
    profile.play_style === "material" ||
    (profile.rubber_type != null && profile.rubber_type !== "inverted");

  if (isMaterial) {
    const dbType =
      profile.rubber_type === "long_pips" ? "long_pips"
      : profile.rubber_type === "short_pips" ? "short_pips"
      : profile.rubber_type === "anti" ? "anti"
      : null;
    return retrieveMaterial(ttr, dbType, preferKnown, budget, lang);
  }

  const validStyle: "offensive_topspin" | "allround" | "defensive" =
    profile.play_style === "offensive_topspin" || profile.play_style === "defensive"
      ? profile.play_style
      : "allround";

  return retrieveStandard(ttr, validStyle, preferKnown, budget, lang);
}

// ---------------------------------------------------------------------------
// Setup-Anreicherung: SetupRow[] -> Frontend-Karten (Shops, Preise, Bilder)
// ---------------------------------------------------------------------------

async function enrichSetups(rows: SetupRow[]) {
  if (rows.length === 0) return [];

  const bladeIds = [...new Set(rows.map((r) => r.bladeId))];
  const rubberIds = [...new Set(rows.map((r) => r.rubberId))];

  // Meta (Slug, Bild, Reviews, Hersteller-Name) für Hölzer + Beläge
  const [bladeMeta, rubberMeta] = await Promise.all([
    db
      .select({
        id: blades.id,
        name: blades.name,
        slug: blades.slug,
        imageUrl: blades.imageUrl,
        reviewCount: blades.communityReviewCount,
        manufacturer: manufacturers.name,
      })
      .from(blades)
      .innerJoin(manufacturers, eq(blades.manufacturerId, manufacturers.id))
      .where(inArray(blades.id, bladeIds)),
    db
      .select({
        id: rubbers.id,
        name: rubbers.name,
        slug: rubbers.slug,
        imageUrl: rubbers.imageUrl,
        reviewCount: rubbers.communityReviewCount,
        manufacturer: manufacturers.name,
      })
      .from(rubbers)
      .innerJoin(manufacturers, eq(rubbers.manufacturerId, manufacturers.id))
      .where(inArray(rubbers.id, rubberIds)),
  ]);

  const bladeById = new Map(bladeMeta.map((b) => [b.id, b]));
  const rubberById = new Map(rubberMeta.map((r) => [r.id, r]));

  // Live-Preise + Direkt-Affiliate-Links aus shop_products
  type ShopProductInfo = {
    shopDomain: string;
    affiliateUrl: string | null;
    priceEur: number | null;
    inStock: boolean | null;
  };
  const shopProductMap = new Map<string, ShopProductInfo[]>();
  const spRows = await db
    .select({
      productType: shopProducts.productType,
      productId: shopProducts.productId,
      affiliateUrl: shopProducts.affiliateUrl,
      shopProductUrl: shopProducts.shopProductUrl,
      latestPrice: shopProducts.latestPrice,
      latestInStock: shopProducts.latestInStock,
      shopDomain: shops.domain,
    })
    .from(shopProducts)
    .innerJoin(shops, eq(shopProducts.shopId, shops.id))
    .where(
      and(
        eq(shopProducts.isActive, true),
        or(
          and(eq(shopProducts.productType, "blade"), inArray(shopProducts.productId, bladeIds)),
          and(eq(shopProducts.productType, "rubber"), inArray(shopProducts.productId, rubberIds)),
        ),
      ),
    );
  for (const r of spRows) {
    const key = `${r.productType}:${r.productId}`;
    if (!shopProductMap.has(key)) shopProductMap.set(key, []);
    shopProductMap.get(key)!.push({
      shopDomain: r.shopDomain,
      affiliateUrl: r.affiliateUrl ?? r.shopProductUrl,
      priceEur: r.latestPrice != null ? Number(r.latestPrice) : null,
      inStock: r.latestInStock ?? null,
    });
  }

  function buildProduct(type: "blade" | "rubber", id: number, name: string, manufacturer: string, slug: string | null, imageUrl: string | null, reviewCount: number | null) {
    const ref = { type, id, name, manufacturer };
    const liveByDomain = new Map(
      (shopProductMap.get(`${type}:${id}`) ?? []).map((s) => [s.shopDomain, s]),
    );
    const shopLinks = getShopLinks(ref).map((l) => {
      const live = liveByDomain.get(l.shop.domain);
      return {
        id: l.shop.id,
        name: l.shop.name,
        url: buildTrackingUrl({ shopId: l.shop.id, productType: type, productId: id }),
        affiliateActive: l.affiliateActive,
        priceEur: live?.priceEur ?? null,
        inStock: live?.inStock ?? null,
        hasDirectLink: !!live?.affiliateUrl,
      };
    });
    return { type, id, name, manufacturer, slug, imageUrl, reviewCount: reviewCount ?? 0, shops: shopLinks };
  }

  return rows.map((row, i) => {
    const bm = bladeById.get(row.bladeId);
    const rm = rubberById.get(row.rubberId);
    const products = [];
    if (bm) products.push(buildProduct("blade", bm.id, bm.name, bm.manufacturer, bm.slug, bm.imageUrl, bm.reviewCount));
    if (rm) products.push(buildProduct("rubber", rm.id, rm.name, rm.manufacturer, rm.slug, rm.imageUrl, rm.reviewCount));
    return {
      index: i + 1,
      title: `${bm?.name ?? row.bladeName} mit ${rm?.name ?? row.rubberName}`,
      description: "",
      synergyScore: row.synergyScore,
      products,
    };
  });
}

// ---------------------------------------------------------------------------
// Stufe 1: Triangulation (Haiku, forced structured output)
// ---------------------------------------------------------------------------

interface TriageResult {
  done: boolean;
  question: string | null;
  profile: BeraterProfile;
}

async function triangulate(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  lang: "de" | "en",
): Promise<TriageResult> {
  const res = await client.messages.create({
    model: config.modelHintergrund,
    max_tokens: 700,
    system: [{ type: "text", text: triageSystem(lang), cache_control: { type: "ephemeral" } }],
    tools: [TRIANGULATION_TOOL],
    tool_choice: { type: "tool", name: "submit_triage" },
    messages,
  });
  const block = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!block) {
    // Sollte durch tool_choice nie passieren, defensiver Fallback
    return {
      done: false,
      question: lang === "en"
        ? "Could you tell me your TTR, play style and what is bugging you?"
        : "Sag mir kurz deinen TTR, deinen Spielstil und was dich gerade stört?",
      profile: emptyProfile(),
    };
  }
  const input = block.input as TriageResult;
  return {
    done: !!input.done,
    question: input.question ?? null,
    profile: { ...emptyProfile(), ...(input.profile ?? {}) },
  };
}

function emptyProfile(): BeraterProfile {
  return {
    ttr: null, play_style: null, budget_max_eur: null, technique_solid: null,
    training_systematic: null, aspiration: null, problem: null, rubber_type: null,
    change_scope: null, current_blade: null, current_rubber_vh: null, current_rubber_rh: null,
  };
}

// ---------------------------------------------------------------------------
// Stufe 3: Erklärung (Sonnet, Prosa um die gewählten Setups)
// ---------------------------------------------------------------------------

function profileSummary(profile: BeraterProfile): string {
  const styleLabel: Record<string, string> = {
    offensive_topspin: "offensiv/Topspin",
    allround: "Allround",
    defensive: "defensiv",
    material: "Material",
  };
  const parts: string[] = [];
  parts.push(`TTR ${profile.ttr ?? "unbekannt"}`);
  parts.push(`Stil ${profile.play_style ? styleLabel[profile.play_style] : "unbekannt"}`);
  if (profile.problem) parts.push(`Problem: ${profile.problem}`);
  if (profile.technique_solid != null)
    parts.push(`Technik sitzt: ${profile.technique_solid ? "ja" : "eher wackelig"}`);
  if (profile.training_systematic != null)
    parts.push(`Training: ${profile.training_systematic ? "systematisch/Trainer" : "eher nur Punktspiele"}`);
  if (profile.aspiration)
    parts.push(`Wunsch: ${profile.aspiration === "faster" ? "mehr Tempo" : profile.aspiration === "more_control" ? "mehr Kontrolle" : "Niveau halten"}`);
  if (profile.budget_max_eur != null) parts.push(`Budget: max ${profile.budget_max_eur} EUR`);
  else parts.push("Budget: egal/offen");
  if (profile.change_scope) {
    const scope: Record<string, string> = {
      full: "komplettes neues Setup",
      blade_only: "nur Holz tauschen",
      rubber_only: "nur Beläge tauschen",
      rubber_vh_rh: "Beläge VH/RH getrennt",
    };
    parts.push(`Wunsch-Umfang: ${scope[profile.change_scope]}`);
  }
  const cur: string[] = [];
  if (profile.current_blade) cur.push(`Holz ${profile.current_blade}`);
  if (profile.current_rubber_vh) cur.push(`VH ${profile.current_rubber_vh}`);
  if (profile.current_rubber_rh) cur.push(`RH ${profile.current_rubber_rh}`);
  if (cur.length) parts.push(`Aktuelles Setup: ${cur.join(", ")}`);
  return parts.join(" | ");
}

async function explainRecommendation(
  client: Anthropic,
  profile: BeraterProfile,
  retrieval: RetrievalResult,
  forced: boolean,
  lang: "de" | "en",
): Promise<string> {
  const setupsText = rowsToText(retrieval.rows, profile.ttr ?? 1300, retrieval.styleName, lang);
  const forcedNote = forced
    ? "\n\nHINWEIS: Die Info vom Spieler ist unvollständig (max. Fragen ausgereizt). Formulier mit ehrlichem Vorbehalt, z.B. 'mit dem was ich von dir habe würde ich X nehmen, sicherer wäre es mit mehr Detail'."
    : "";
  const aspNote = profile.aspiration === "faster"
    ? "\n\nHINWEIS: Der Spieler will bewusst ein ambitionierteres, schnelleres Setup. Ich habe absichtlich etwas oberhalb seines aktuellen Niveaus gesucht. Sag das aktiv."
    : "";
  const fallbackNote = retrieval.status === "fallback"
    ? "\n\nHINWEIS: Für den exakten Stil gab es keine perfekten Treffer, das sind die nächstbesten Allround-Annäherungen. Erwähne das kurz und ehrlich."
    : "";

  const context = lang === "en"
    ? `Player profile: ${profileSummary(profile)}\n\nThe database picked these setups (already in this order, Setup 1 is the best, all within budget):\n\n${setupsText}\n\nWrite the consultation now: one honest diagnosis sentence, then the setups in order with a short why each, then a closing tip naming Setup 1.${forcedNote}${aspNote}${fallbackNote}`
    : `Spieler-Profil: ${profileSummary(profile)}\n\nDie Datenbank hat diese Setups ausgewählt (bereits in dieser Reihenfolge, Setup 1 ist das beste, alle im Budget):\n\n${setupsText}\n\nSchreib jetzt die Beratung: ein ehrlicher Diagnose-Satz, dann die Setups in Reihenfolge mit je kurzer Begründung, dann ein Abschluss-Tipp der Setup 1 nennt.${forcedNote}${aspNote}${fallbackNote}`;

  const res = await client.messages.create({
    model: config.modelBerater,
    max_tokens: 1000,
    system: [{ type: "text", text: explainSystem(lang), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: context }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Erklärung wenn KEINE Setups (Anfänger unter TTR 900, oder DB leer). */
async function explainNoSetups(
  client: Anthropic,
  profile: BeraterProfile,
  reason: "beginner" | "empty",
  lang: "de" | "en",
): Promise<string> {
  const context = reason === "beginner"
    ? (lang === "en"
        ? `Player profile: ${profileSummary(profile)}\n\nThis player is below TTR 900, our database starts at 1000. Do NOT name database products. Give exactly one beginner tip: a pre-assembled bat in the 30-60 EUR range (Stiga, Donic, Butterfly entry line), and invite them back in 3-6 months once they have a club rating. Short and warm.`
        : `Spieler-Profil: ${profileSummary(profile)}\n\nDieser Spieler liegt unter TTR 900, unsere Datenbank startet bei 1000. Nenne KEINE Datenbank-Produkte. Gib genau einen Einsteiger-Tipp: ein vorkonfektionierter Schläger in der 30-60-Euro-Klasse (Stiga, Donic, Butterfly Einstieg), und lad ihn in 3-6 Monaten wieder ein, wenn er einen Vereins-TTR hat. Kurz und warm.`)
    : (lang === "en"
        ? `Player profile: ${profileSummary(profile)}\n\nThe database returned NO matching setups for this profile and budget. Be honest about it, do not invent products, and use the dialog box to ask one clarifying question that could open up results (e.g. budget, style).`
        : `Spieler-Profil: ${profileSummary(profile)}\n\nDie Datenbank hat für dieses Profil und Budget KEINE passenden Setups gefunden. Sag das ehrlich, erfinde keine Produkte, und nutz das Antwort-Feld für eine gezielte Rückfrage die Ergebnisse öffnen könnte (z.B. Budget, Stil).`);

  const res = await client.messages.create({
    model: config.modelBerater,
    max_tokens: 600,
    system: [{ type: "text", text: explainSystem(lang), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: context }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}



// ─── Rate-Limiting gegen Cost-DoS auf der Anthropic-API ──────────────────
//
// Jeder /api/berater-Call kostet uns echtes Geld. Ohne Limit könnte jemand
// uns durch Brute-Force in die Insolvenz schicken.
// In-Memory-Map, OK für Single-Region Vercel.

const RATE_LIMIT_PER_HOUR = 20;
const RATE_LIMIT_PER_DAY = 100;
const rateMapHour = new Map<string, { count: number; resetAt: number }>();
const rateMapDay = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Stündlich
  const hourEntry = rateMapHour.get(ipHash);
  if (!hourEntry || now > hourEntry.resetAt) {
    rateMapHour.set(ipHash, { count: 1, resetAt: now + 3_600_000 });
  } else {
    if (hourEntry.count >= RATE_LIMIT_PER_HOUR) {
      return { allowed: false, reason: "stündlich" };
    }
    hourEntry.count++;
  }

  // Täglich
  const dayEntry = rateMapDay.get(ipHash);
  if (!dayEntry || now > dayEntry.resetAt) {
    rateMapDay.set(ipHash, { count: 1, resetAt: now + 86_400_000 });
  } else {
    if (dayEntry.count >= RATE_LIMIT_PER_DAY) {
      return { allowed: false, reason: "täglich" };
    }
    dayEntry.count++;
  }

  return { allowed: true };
}

// Periodisch alte Einträge aufräumen
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMapHour.entries()) {
    if (now > v.resetAt) rateMapHour.delete(k);
  }
  for (const [k, v] of rateMapDay.entries()) {
    if (now > v.resetAt) rateMapDay.delete(k);
  }
}, 600_000).unref?.();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY nicht konfiguriert." },
      { status: 503 },
    );
  }

  // Rate-Limit-Check (IP-Hash, keine Klartext-IP gespeichert)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const limit = checkRateLimit(ipHash);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Du hast das ${limit.reason}e Limit erreicht. Versuch's später nochmal.`,
      },
      { status: 429 },
    );
  }

  try {
    const { messages, lang: rawLang } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      lang?: string;
    };

    const lang: "de" | "en" = rawLang === "en" ? "en" : "de";
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const history: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // ─── Stufe 1: Triangulation (billiges Modell) ────────────────────────
    // Turn-Cap im Code: nach 2 Berater-Rückfragen wird zwingend empfohlen.
    const assistantTurns = messages.filter((m) => m.role === "assistant").length;
    const forceRecommend = assistantTurns >= 2;

    const triage = await triangulate(client, history, lang);
    const done = triage.done || forceRecommend;

    if (!done) {
      // Berater fragt nach. Das ist die ganze Antwort, keine Setups.
      const question = triage.question ??
        (lang === "en"
          ? "Could you tell me a bit more so I can recommend something solid?"
          : "Sag mir noch kurz etwas mehr, damit ich dir was Solides empfehlen kann?");
      return NextResponse.json({ text: question, setups: [] });
    }

    const profile = triage.profile;

    // ─── Anfänger-Sonderfall (TTR < 900) ─────────────────────────────────
    if ((profile.ttr ?? 1300) < 900) {
      const text = await explainNoSetups(client, profile, "beginner", lang);
      return NextResponse.json({ text, setups: [] });
    }

    // ─── Stufe 2: Retrieval (reiner Code) ────────────────────────────────
    const retrieval = await retrieveSetups(profile, lang);

    if (retrieval.rows.length === 0) {
      const text = await explainNoSetups(client, profile, "empty", lang);
      return NextResponse.json({ text, setups: [] });
    }

    // ─── Stufe 3: Anreicherung + Erklärung (parallel) ────────────────────
    const [setups, text] = await Promise.all([
      enrichSetups(retrieval.rows),
      explainRecommendation(client, profile, retrieval, forceRecommend && !triage.done, lang),
    ]);

    return NextResponse.json({ text, setups });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[berater]", msg);
    const detail = process.env.NODE_ENV !== "production" ? msg : msg.substring(0, 120);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

