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

const SYSTEM_PROMPT = `Du bist PongSmith — ein unabhängiger Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler.

## Dein Charakter
- Direkt, ehrlich, kein Marketing-Sprech
- Wie ein erfahrener Vereinskollege der offen seine Meinung sagt
- Immer auf Deutsch
- Kurz und präzise — lieber Stichpunkte als Fließtext

## Ablauf
1. Verstehe den Spieler: TTR, Spielstil, aktuelles Setup, Probleme
2. Sobald TTR + Spielstil klar → rufe query_setups auf
3. Erkläre kurz WARUM jede Empfehlung zum Spieler passt

## WICHTIG: Umgang mit Datenbankresultaten

**Wenn query_setups Ergebnisse zurückgibt:**
→ Empfehle nur Produkte die in den Ergebnissen stehen. Erfinde keine weiteren.

**Wenn query_setups "DB_KEIN_ERGEBNIS" zurückgibt:**
→ Sage klar und ehrlich: "Für dein Profil haben wir aktuell noch keine passenden Setups in unserer Datenbank."
→ Erkläre KURZ warum (z.B. TTR-Bereich nicht abgedeckt, exotischer Spielstil)
→ Verweise auf den Schnell-Check auf der Seite mit angepassten Parametern
→ ERFINDE KEINE Produkte. Keine Empfehlungen aus dem Gedächtnis.

**Wenn query_setups "DB_ANFAENGER" zurückgibt:**
→ Erkläre: unsere Datenbank ist für TTR 1000+ optimiert
→ Für Einsteiger gib EINEN konkreten allgemeinen Rat: vorkonfektionierter Schläger (Stiga, Donic, Butterfly Starter-Linien) für 30–60 €, kein teures Setup bevor man 3 Monate gespielt hat
→ Empfehle dann in 3–6 Monaten nochmal vorbeizukommen wenn etwas TTR vorhanden ist
→ KEINE spezifischen Belag-Namen aus dem Gedächtnis

**Wenn play_style "material" übergeben wird (Noppen/Anti-Spieler):**
→ Frage zuerst ob LP, KN oder Anti gemeint ist (rubber_type)
→ Dann mit play_style="material" + rubber_type abfragen
→ Erkläre kurz die Besonderheiten der Belag-Kategorie

Maximal 3 Empfehlungen, geordnet nach Priorität.`;

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
): Promise<string> {
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
      : null; // alle Exoten-Typen

    const rows = await queryMaterialDB(clamped, dbRubberType);

    if (rows.length === 0) {
      return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Material-Stil: ${rubberType ?? "alle Typen"})`;
    }

    const typeName =
      rubberType === "long_pips" ? "Lange Noppen"
      : rubberType === "short_pips" ? "Kurze Noppen"
      : rubberType === "anti" ? "Anti-Belag"
      : "Material-Spieler";

    return (
      `Datenbankresultate für TTR ${ttr} (${typeName}):\n` +
      rows
        .map(
          (r, i) =>
            `${i + 1}. Holz: ${r.bladeName} | Belag: ${r.rubberName} | Synergie: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch} | Kontrolle: ${r.controlReserve} | Spin: ${r.spinPotential}`,
        )
        .join("\n")
    );
  }

  // ── Standard: Invertbeläge nach Spielstil ───────────────────────
  const validStyle = ["offensive_topspin", "allround", "defensive"].includes(playStyle)
    ? (playStyle as "offensive_topspin" | "allround" | "defensive")
    : "allround";

  // Erster Versuch: exakter Spielstil
  const rows = await queryDB(clamped, validStyle);

  // Fallback: wenn nichts gefunden → mit "allround" nochmal versuchen
  const finalRows =
    rows.length > 0 || validStyle === "allround"
      ? rows
      : await queryDB(clamped, "allround");

  if (finalRows.length === 0) {
    return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Stil: ${validStyle})`;
  }

  const styleName =
    validStyle === "offensive_topspin"
      ? "Offensiv/Topspin"
      : validStyle === "allround"
        ? "Allround"
        : "Defensiv";
  const fallbackNote =
    rows.length === 0 && finalRows.length > 0
      ? ` (Hinweis: keine genauen Treffer für "${validStyle}", zeige Allround-Alternativen)\n`
      : "";

  return (
    `Datenbankresultate für TTR ${ttr} (${styleName}):\n${fallbackNote}` +
    finalRows
      .map(
        (r, i) =>
          `${i + 1}. Holz: ${r.bladeName} | Belag: ${r.rubberName} | Synergie: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch} | Kontrolle: ${r.controlReserve} | Spin: ${r.spinPotential}`,
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
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

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
        system: SYSTEM_PROMPT,
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
          toolResult = await runQuerySetups(inp.ttr, inp.play_style, inp.rubber_type);
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

    return NextResponse.json({ text: "Entschuldigung, konnte keine Antwort generieren." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[berater]", msg);
    const detail = process.env.NODE_ENV !== "production" ? msg : msg.substring(0, 120);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
