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
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Du bist PongSmith — ein unabhängiger Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler (TTR 1000–1700).

Deine Eigenschaften:
- Direkt und konkret, kein Marketing-Sprech
- Du kennst die Unterschiede zwischen Holz und Belag-Charakteren sehr gut
- Du bist wie ein erfahrener Vereinskollege, der offen seine Meinung sagt
- Du schreibst immer auf Deutsch

Ablauf:
1. Verstehe den Spieler: TTR, Spielstil (offensiv/allround/defensiv), aktuelles Setup und Probleme
2. Sobald du TTR und Spielstil kennst → rufe query_setups auf
3. Erkläre kurz WARUM jede Empfehlung zum Spieler passt — bezogen auf sein konkretes Problem
4. Maximal 3 Empfehlungen, geordnet nach Priorität

Wenn der Spielstil nicht klar ist: kurz nachfragen. Wenn der TTR fehlt: nachfragen oder schätzen lassen.
Schreib kurz. Kein Fließtext, lieber Stichpunkte.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_setups",
    description:
      "Fragt die PongSmith-Datenbank nach passenden Holz+Belag-Kombinationen ab. Gibt die besten Matches zurück.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: {
          type: "number",
          description: "TTR-Wert des Spielers (600–2000)",
        },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive"],
          description: "Spielstil des Spielers",
        },
      },
      required: ["ttr", "play_style"],
    },
  },
];

async function runQuerySetups(ttr: number, playStyle: string): Promise<string> {
  const clamped = Math.max(1000, Math.min(1700, ttr));
  const validStyle = ["offensive_topspin", "allround", "defensive"].includes(playStyle)
    ? (playStyle as "offensive_topspin" | "allround" | "defensive")
    : "allround";

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
        eq(synergies.playStyleTarget, validStyle),
      ),
    )
    .orderBy(desc(synergies.synergyScore))
    .limit(60);

  // Bester Belag pro Holz
  const seen = new Set<string>();
  const top = rows
    .filter((r) => {
      if (seen.has(r.bladeName)) return false;
      seen.add(r.bladeName);
      return true;
    })
    .slice(0, 5);

  if (top.length === 0) {
    return "Keine passenden Setups in der Datenbank gefunden. Bitte TTR oder Spielstil anpassen.";
  }

  return (
    `Top-Setups für TTR ${ttr} (${validStyle}):\n` +
    top
      .map(
        (r, i) =>
          `${i + 1}. Holz: ${r.bladeName} | Belag: ${r.rubberName} | Gesamt: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch} | Kontrolle: ${r.controlReserve} | Spin: ${r.spinPotential}`,
      )
      .join("\n")
  );
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

    // Konversation als Anthropic-Format
    let current: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Agentic Loop (max. 5 Runden für Tool Use)
    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
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
          const inp = toolBlock.input as { ttr: number; play_style: string };
          toolResult = await runQuerySetups(inp.ttr, inp.play_style);
        }

        current = [
          ...current,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [{ type: "tool_result", tool_use_id: toolBlock.id, content: toolResult }],
          },
        ];
      }
    }

    return NextResponse.json({ text: "Entschuldigung, konnte keine Antwort generieren." });
  } catch (err) {
    console.error("[berater]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
