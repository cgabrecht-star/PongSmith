/**
 * POST /api/berater
 * KI-Ausrüstungsberater — Claude mit Tool Use für DB-Abfragen.
 * Body: { messages: { role: "user" | "assistant", content: string }[] }
 * Returns: { text: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { synergies, blades, rubbers } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ────────────────────────────────────────────────────────────────────────────
// System-Prompts pro Sprache
// ────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_DE = `Du bist PongSmith — der unabhängige Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler.

## Charakter & Ton

Du bist wie der erfahrene Vereinskollege, der nach dem Training noch kurz am Tisch bleibt und offen redet — ohne etwas verkaufen zu wollen. Du kennst den Frust, wenn ein Setup einfach nicht passt. Du erkennst sofort ob jemand unsicher ist oder schon genau weiß was er will.

Konkret bedeutet das:
- **Sprache:** Immer Deutsch. Vertrauter, aber nicht kumpelhafter Ton ("du" ja, "Alter" nein).
- **Länge:** Lieber 3 präzise Sätze als ein langer Absatz. Stichpunkte wo es Übersicht bringt.
- **Kein Marketing:** Keine Superlative ohne Begründung. Kein "perfekt" oder "revolutionär".
- **Spiegel-Moment:** Bevor du empfiehlst, zeige kurz dass du die Situation des Spielers verstanden hast — ein Satz der sagt "ich höre dich". Das schafft Vertrauen.

## Gesprächsablauf

**Schritt 1 — Spielerprofil verstehen:**
Finde heraus: TTR (oder Spielerfahrung in Jahren/Monaten), Spielstil, aktuelles Setup wenn vorhanden, konkretes Problem oder Ziel.

Frage nie alles auf einmal ab. Wenn TTR und Spielstil schon klar sind → sofort zu Schritt 2.

**Schritt 2 — Datenbank abfragen:**
Rufe das Tool query_setups auf sobald du TTR + Spielstil kennst. Warte nicht auf mehr Infos wenn die wichtigsten da sind.

**Schritt 3 — Ergebnisse erklären:**
Erkläre für jede Empfehlung in 1–2 Sätzen WARUM sie zu diesem konkreten Spieler passt — nicht nur "gutes Holz", sondern "dieses Holz gibt dir die Kontrolle die du beim Block gerade verlierst".

## Spieler-Typen die du erkennst

**Marco-Typ (TTR 1000–1400, Allround/Offensiv):**
Oft unsicher, hat das Gefühl sein Material sei schuld. Braucht ein vergebendes Setup das Fehler verzeiht. Sprache: warm, bestätigend. "Das klingt nach einem klassischen Problem wenn..."

**Tobias-Typ (TTR 1400–1700, Offensiv-Topspin):**
Weiß was er will, optimiert gerne. Kann mit technischeren Erklärungen umgehen. Sprache: direkt, ambitioniert. "Wenn du deinen VH-Topspin noch aggressiver machen willst, dann..."

**Werner-Typ (Material-Spieler, beliebige TTR):**
Spielt bewusst anders. Schätze seinen Stil — kein Belächeln, kein "warum spielst du nicht normal". Sprache: respektvoll für die Taktik. "Lange Noppen als Blockwaffe funktioniert wenn das Holz..."

## Datenbankresultate — strikte Regeln

**Bei Ergebnissen:**
→ Empfehle ausschließlich Produkte aus den Resultaten. Maximal 3, geordnet nach Priorität.
→ Keine zusätzlichen Produkte aus dem Gedächtnis — auch wenn du welche kennst.

**Bei "DB_KEIN_ERGEBNIS":**
→ Sei ehrlich: "Für genau dein Profil haben wir gerade noch keine Empfehlung in der Datenbank."
→ Erkläre kurz warum (TTR-Randbereich, seltener Spielstil).
→ Schlage vor, den Schnell-Check mit leicht angepassten Parametern zu probieren.
→ Keine Produkt-Empfehlungen aus dem Gedächtnis — auch nicht "generell gute" Beläge.

**Bei "DB_ANFAENGER" (TTR < 900):**
→ Direkt und ohne Herablassung: unsere Datenbank startet ab TTR 1000.
→ Gib genau EINEN Einsteiger-Rat: vorkonfektionierter Schläger für 30–60 € (Stiga, Donic, Butterfly Einstiegslinien). Kein teures Setup bevor man 3 Monate gespielt hat.
→ Einladung in 3–6 Monaten wiederzukommen.
→ Keine Belag-Namen aus dem Gedächtnis.

**Bei Material-Spielern (play_style="material"):**
→ Kläre zuerst: Lange Noppen (KN), Kurze Noppen (LP) oder Anti?
→ Dann mit rubber_type abfragen. Die Belag-Kategorie kurz erklären wenn der Spieler offen dafür scheint.`;

const SYSTEM_PROMPT_EN = `You are PongSmith — the independent table-tennis equipment advisor for club players.

## Character & tone

You are like the experienced club teammate who hangs around after practice and gives an honest opinion — without trying to sell anything. You know the frustration of a setup that doesn't fit. You can tell instantly whether someone is unsure of themselves or already knows what they want.

Specifically:
- **Language:** Always English. Friendly but not chummy.
- **Length:** Three precise sentences beat one long paragraph. Bullet points where they aid clarity.
- **No marketing:** No superlatives without justification. Avoid "perfect" or "revolutionary".
- **Mirror moment:** Before recommending, briefly show you understood the player's situation — one sentence that says "I hear you". This builds trust.

## Conversation flow

**Step 1 — Understand the player profile:**
Find out: TTR rating (or playing experience in years/months), play style, current setup if any, specific problem or goal.

Never ask everything at once. As soon as TTR + play style are clear → straight to step 2.

**Step 2 — Query the database:**
Call the query_setups tool as soon as you know TTR + play style. Don't wait for more details when the essentials are there.

**Step 3 — Explain the results:**
For each recommendation, in 1–2 sentences explain WHY it fits this specific player — not just "good blade", but "this blade gives you the control you're losing on your blocks".

## Player types you'll recognise

**Mid-level type (TTR 1000–1400, allround/offensive):**
Often unsure, feels their gear is to blame. Needs a forgiving setup. Tone: warm, affirming. "That sounds like a classic problem when..."

**Ambitious type (TTR 1400–1700, offensive topspin):**
Knows what they want, likes optimising. Can handle more technical explanations. Tone: direct, ambitious. "If you want your forehand topspin even more aggressive..."

**Material player type (long pips / anti, any TTR):**
Plays deliberately differently. Respect their style — no condescension. Tone: respectful of the tactics. "Long pips as a blocking weapon work when the blade..."

## Database results — strict rules

**With results:**
→ Recommend only products from the results. Max 3, ordered by priority.
→ No additional products from memory — even ones you know.

**With "DB_KEIN_ERGEBNIS" (no result):**
→ Be honest: "We don't have a recommendation in the database for your exact profile yet."
→ Briefly explain why (edge of TTR range, rare style).
→ Suggest the Quick Pick with slightly adjusted parameters.
→ No product recommendations from memory.

**With "DB_ANFAENGER" (TTR < 900, beginner):**
→ Direct, not condescending: our database starts at TTR 1000.
→ Give exactly ONE entry-level tip: a pre-assembled racket for €30–60 (Stiga, Donic, Butterfly entry lines). Don't invest in an expensive setup before 3 months of play.
→ Invite them to come back in 3–6 months.
→ No specific rubber names from memory.

**With material players (play_style="material"):**
→ First clarify: long pips (LP), short pips (SP), or anti?
→ Then query with rubber_type. Briefly explain the rubber category if the player seems open to it.`;

function getSystemPrompt(lang: string): string {
  return lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_setups",
    description:
      "Fragt die PongSmith-Datenbank nach passenden Holz+Belag-Kombinationen ab. Gibt Treffer zurück oder einen Status-Code wenn nichts passt.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: {
          type: "number",
          description: "TTR-Wert des Spielers (600–2000). Schätz 700 für absolute Anfänger ohne Rating.",
        },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive", "material"],
          description:
            "Spielstil: offensive_topspin, allround, defensive oder material (für Noppen/Anti-Spieler)",
        },
        rubber_type: {
          type: "string",
          enum: ["inverted", "long_pips", "short_pips", "anti"],
          description:
            "Optional: Gewünschter Belag-Typ. Weglassen wenn unklar oder Standard (invertiert).",
        },
      },
      required: ["ttr", "play_style"],
    },
  },
];

async function runQuerySetups(
  ttr: number,
  playStyle: string,
  rubberType?: string,
  lang: "de" | "en" = "de",
): Promise<string> {
  const isEn = lang === "en";

  // ── Anfänger-Erkennung ──────────────────────────────────────────
  if (ttr < 900) {
    return "DB_ANFAENGER";
  }

  // ── TTR auf gültigen Bereich beschränken ─────────────────────────
  const clamped = Math.max(1000, Math.min(1700, ttr));

  // ── Material-Spieler (Noppen / Anti) ────────────────────────────
  if (playStyle === "material" || (rubberType && rubberType !== "inverted")) {
    const dbRubberType =
      rubberType === "long_pips" ? "long_pips"
      : rubberType === "short_pips" ? "short_pips"
      : rubberType === "anti" ? "anti"
      : null;

    const rows = await queryMaterialDB(clamped, dbRubberType);

    if (rows.length === 0) {
      return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, ${isEn ? "material style" : "Material-Stil"}: ${rubberType ?? (isEn ? "all types" : "alle Typen")})`;
    }

    const typeName = isEn
      ? (rubberType === "long_pips" ? "Long Pips"
        : rubberType === "short_pips" ? "Short Pips"
        : rubberType === "anti" ? "Anti rubber"
        : "Material player")
      : (rubberType === "long_pips" ? "Lange Noppen"
        : rubberType === "short_pips" ? "Kurze Noppen"
        : rubberType === "anti" ? "Anti-Belag"
        : "Material-Spieler");

    const labels = isEn
      ? { header: "Database results", blade: "Blade", rubber: "Rubber", synergy: "Synergy", tempo: "Speed", control: "Control", spin: "Spin" }
      : { header: "Datenbankresultate", blade: "Holz", rubber: "Belag", synergy: "Synergie", tempo: "Tempo", control: "Kontrolle", spin: "Spin" };

    return (
      `${labels.header} ${isEn ? "for TTR" : "für TTR"} ${ttr} (${typeName}):\n` +
      rows
        .map(
          (r, i) =>
            `${i + 1}. ${labels.blade}: ${r.bladeName} | ${labels.rubber}: ${r.rubberName} | ${labels.synergy}: ${r.synergyScore}/100 | ${labels.tempo}: ${r.tempoMatch} | ${labels.control}: ${r.controlReserve} | ${labels.spin}: ${r.spinPotential}`,
        )
        .join("\n")
    );
  }

  // ── Standard: Invertbeläge nach Spielstil ───────────────────────
  const validStyle = ["offensive_topspin", "allround", "defensive"].includes(playStyle)
    ? (playStyle as "offensive_topspin" | "allround" | "defensive")
    : "allround";

  const rows = await queryDB(clamped, validStyle);

  const finalRows =
    rows.length > 0 || validStyle === "allround"
      ? rows
      : await queryDB(clamped, "allround");

  if (finalRows.length === 0) {
    return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, ${isEn ? "style" : "Stil"}: ${validStyle})`;
  }

  const styleName = isEn
    ? (validStyle === "offensive_topspin" ? "Offensive/Topspin"
      : validStyle === "allround" ? "Allround"
      : "Defensive")
    : (validStyle === "offensive_topspin" ? "Offensiv/Topspin"
      : validStyle === "allround" ? "Allround"
      : "Defensiv");

  const fallbackNote =
    rows.length === 0 && finalRows.length > 0
      ? ` (${isEn
          ? `note: no exact match for "${validStyle}", showing Allround alternatives`
          : `Hinweis: keine genauen Treffer für "${validStyle}", zeige Allround-Alternativen`})\n`
      : "";

  const labels = isEn
    ? { header: "Database results", blade: "Blade", rubber: "Rubber", synergy: "Synergy", tempo: "Speed", control: "Control", spin: "Spin" }
    : { header: "Datenbankresultate", blade: "Holz", rubber: "Belag", synergy: "Synergie", tempo: "Tempo", control: "Kontrolle", spin: "Spin" };

  return (
    `${labels.header} ${isEn ? "for TTR" : "für TTR"} ${ttr} (${styleName}):\n${fallbackNote}` +
    finalRows
      .map(
        (r, i) =>
          `${i + 1}. ${labels.blade}: ${r.bladeName} | ${labels.rubber}: ${r.rubberName} | ${labels.synergy}: ${r.synergyScore}/100 | ${labels.tempo}: ${r.tempoMatch} | ${labels.control}: ${r.controlReserve} | ${labels.spin}: ${r.spinPotential}`,
      )
      .join("\n")
  );
}

async function queryMaterialDB(
  clamped: number,
  rubberType: "long_pips" | "short_pips" | "anti" | null,
) {
  const whereConditions = [
    gte(synergies.ttrTarget, clamped - 300),
    lte(synergies.ttrTarget, clamped + 300),
    eq(synergies.playStyleTarget, "material"),
  ];

  if (rubberType) {
    whereConditions.push(eq(rubbers.type, rubberType));
  } else {
    whereConditions.push(inArray(rubbers.type, ["long_pips", "short_pips", "anti"]));
  }

  const rows = await db
    .select({
      synergyScore: synergies.synergyScore,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      bladeName: blades.name,
      rubberName: rubbers.name,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(and(...whereConditions))
    .orderBy(desc(synergies.synergyScore))
    .limit(60);

  // Bester Belag pro Holz → Top 5
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      if (seen.has(r.bladeName)) return false;
      seen.add(r.bladeName);
      return true;
    })
    .slice(0, 5);
}

async function queryDB(
  clamped: number,
  style: "offensive_topspin" | "allround" | "defensive",
) {
  const rows = await db
    .select({
      synergyScore: synergies.synergyScore,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      bladeName: blades.name,
      rubberName: rubbers.name,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, style),
      ),
    )
    .orderBy(desc(synergies.synergyScore))
    .limit(60);

  // Bester Belag pro Holz → Top 5
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      if (seen.has(r.bladeName)) return false;
      seen.add(r.bladeName);
      return true;
    })
    .slice(0, 5);
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY nicht konfiguriert — bitte in den Umgebungsvariablen setzen." },
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

    // Agentic Loop (max. 5 Runden)
    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        system: getSystemPrompt(lang),
        tools: TOOLS,
        messages: current,
      });

      if (response.stop_reason === "end_turn") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        return NextResponse.json({ text });
      }

      if (response.stop_reason === "tool_use") {
        const toolBlock = response.content.find(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );
        if (!toolBlock) break;

        let toolResult = "";
        if (toolBlock.name === "query_setups") {
          const inp = toolBlock.input as {
            ttr: number;
            play_style: string;
            rubber_type?: string;
          };
          toolResult = await runQuerySetups(inp.ttr, inp.play_style, inp.rubber_type, lang);
        }

        current = [
          ...current,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: toolBlock.id, content: toolResult },
            ],
          },
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
