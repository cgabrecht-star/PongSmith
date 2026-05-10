/**
 * POST /api/submit-interview
 *
 * Empfängt anonyme Spieler-Submissions vom /mithelfen-Form.
 * Workflow:
 *   1. Schema-Validation (manuell, ohne Zod-Dependency um Bundle klein zu halten)
 *   2. Rate-Limit (in-memory, 3 Submissions / Stunde / IP-Hash)
 *   3. Anthropic Haiku Spam-Check
 *   4. Bei "valid": Auto-Insert in players + player_setups + ggf. observations
 *   5. Audit-Log in interview_submissions (IMMER, auch bei Spam)
 *
 * Antwort: { success: bool, verdict?: string, message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { db } from "@/db";
import {
  players,
  playerSetups,
  observations,
  interviewSubmissions,
  blades,
  rubbers,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Rate-Limit (in-memory, OK für Single-Region Vercel) ──────────────────

const RATE_LIMIT_PER_HOUR = 3;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ipHash);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ipHash, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) return false;
  entry.count++;
  return true;
}

// Periodisch alte Einträge aufräumen
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap.entries()) {
    if (now > v.resetAt) rateMap.delete(k);
  }
}, 600_000).unref?.();

// ─── Submission-Schema ────────────────────────────────────────────────────

interface Submission {
  ttr: number;
  spielstil: "offensive_topspin" | "allround" | "defensive" | "material";
  hand: "right" | "left";
  bladeId: number;
  rubberVhId: number;
  rubberRhId: number;
  satisfaction: number; // 1-10
  goodText?: string;
  badText?: string;
  previousText?: string;
  // Honeypot-Feld — muss leer bleiben
  website?: string;
}

function validate(body: unknown): { ok: true; data: Submission } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid body" };
  const b = body as Record<string, unknown>;

  if (b.website && typeof b.website === "string" && b.website.length > 0) {
    return { ok: false, error: "honeypot triggered" };
  }

  const ttr = Number(b.ttr);
  if (!Number.isFinite(ttr) || ttr < 800 || ttr > 2800) return { ok: false, error: "ttr out of range" };

  const validStyles = ["offensive_topspin", "allround", "defensive", "material"];
  const spielstil = String(b.spielstil ?? "");
  if (!validStyles.includes(spielstil)) return { ok: false, error: "invalid spielstil" };

  const hand = String(b.hand ?? "");
  if (hand !== "right" && hand !== "left") return { ok: false, error: "invalid hand" };

  const bladeId = Number(b.bladeId);
  const rubberVhId = Number(b.rubberVhId);
  const rubberRhId = Number(b.rubberRhId);
  if (!Number.isInteger(bladeId) || bladeId <= 0) return { ok: false, error: "invalid bladeId" };
  if (!Number.isInteger(rubberVhId) || rubberVhId <= 0) return { ok: false, error: "invalid rubberVhId" };
  if (!Number.isInteger(rubberRhId) || rubberRhId <= 0) return { ok: false, error: "invalid rubberRhId" };

  const satisfaction = Number(b.satisfaction);
  if (!Number.isFinite(satisfaction) || satisfaction < 1 || satisfaction > 10) {
    return { ok: false, error: "satisfaction out of range" };
  }

  const goodText = typeof b.goodText === "string" ? b.goodText.trim().substring(0, 500) : undefined;
  const badText = typeof b.badText === "string" ? b.badText.trim().substring(0, 500) : undefined;
  const previousText = typeof b.previousText === "string" ? b.previousText.trim().substring(0, 500) : undefined;

  return {
    ok: true,
    data: {
      ttr: Math.round(ttr),
      spielstil: spielstil as Submission["spielstil"],
      hand: hand as Submission["hand"],
      bladeId, rubberVhId, rubberRhId,
      satisfaction: Math.round(satisfaction),
      goodText, badText, previousText,
    },
  };
}

// ─── Anthropic-Spam-Check (Haiku, billig) ─────────────────────────────────

interface AiVerdict {
  verdict: "valid" | "suspect" | "spam";
  reason: string;
}

async function checkWithAi(s: Submission, productInfo: { blade: string; vh: string; rh: string }): Promise<AiVerdict> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Du bist ein Spam-Filter für Vereinsspieler-Umfragen einer Tischtennis-Beratungsseite.

Beurteile ob diese Submission von einem echten TT-Vereinsspieler stammt oder Spam/Test/Zufalls-Eingaben sind.

Sei eher tolerant — kurze knappe Antworten sind okay. Reject nur bei offensichtlichem Müll (Random-Tippen, Werbung, Beleidigungen, Lorem Ipsum, sinnlose Wortketten).

DATEN:
TTR: ${s.ttr}
Spielstil: ${s.spielstil}
Hand: ${s.hand}
Holz: ${productInfo.blade}
Belag VH: ${productInfo.vh}
Belag RH: ${productInfo.rh}
Zufriedenheit: ${s.satisfaction}/10
Was funktioniert gut: ${s.goodText || "(leer)"}
Was nervt: ${s.badText || "(leer)"}
Wechsel-Story: ${s.previousText || "(leer)"}

Plausibilitäts-Hinweise:
- TTR < 1000 mit Profi-Belägen (Tenergy 05, Dignics) ist suspekt aber nicht unmöglich
- Leere Textfelder sind normal — nicht abwerten

Antworte AUSSCHLIESSLICH mit valid JSON in diesem Format:
{"verdict": "valid" | "suspect" | "spam", "reason": "kurze Begründung max 80 Zeichen"}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // JSON aus Antwort extrahieren (manchmal kommt's mit Begleittext)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { verdict: "suspect", reason: "AI returned no JSON" };
    }

    const parsed = JSON.parse(match[0]) as { verdict?: string; reason?: string };
    const verdict = parsed.verdict === "valid" || parsed.verdict === "spam"
      ? parsed.verdict
      : "suspect";
    return {
      verdict: verdict as AiVerdict["verdict"],
      reason: (parsed.reason ?? "no reason").substring(0, 200),
    };
  } catch (err) {
    console.error("[submit-interview] AI check failed:", err);
    // Bei AI-Ausfall: nicht blockieren, aber als suspect markieren
    return { verdict: "suspect", reason: "AI check failed — fallback" };
  }
}

// ─── Hilfs-Lookup für Produktnamen ─────────────────────────────────────────

async function getProductLabel(type: "blade" | "rubber", id: number): Promise<string> {
  if (type === "blade") {
    const row = await db.query.blades.findFirst({
      where: eq(blades.id, id),
      with: undefined,
    });
    return row?.name ?? `Blade #${id}`;
  }
  const row = await db.query.rubbers.findFirst({
    where: eq(rubbers.id, id),
  });
  return row?.name ?? `Rubber #${id}`;
}

// ─── Haupt-Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Rate-Limit
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");

    if (!checkRateLimit(ipHash)) {
      return NextResponse.json(
        { success: false, message: "Zu viele Submissions. Versuch's in einer Stunde nochmal." },
        { status: 429 },
      );
    }

    // Validation
    const body = await req.json().catch(() => ({}));
    const v = validate(body);
    if (!v.ok) {
      return NextResponse.json({ success: false, message: "Ungültige Daten." }, { status: 400 });
    }
    const data = v.data;

    // Produktnamen für Audit + AI laden
    const [bladeName, vhName, rhName] = await Promise.all([
      getProductLabel("blade", data.bladeId),
      getProductLabel("rubber", data.rubberVhId),
      getProductLabel("rubber", data.rubberRhId),
    ]);

    // AI-Check
    const ai = await checkWithAi(data, { blade: bladeName, vh: vhName, rh: rhName });

    let insertedPlayerId: number | null = null;

    // Bei "valid" → echte Daten anlegen
    if (ai.verdict === "valid") {
      const ttrRangeStart = Math.floor(data.ttr / 100) * 100;
      const ttrRange = `${ttrRangeStart}-${ttrRangeStart + 99}`;

      const [player] = await db
        .insert(players)
        .values({
          ttrActual: data.ttr,
          ttrRange,
          spielstil: data.spielstil,
          hand: data.hand,
          notizen: "Über /mithelfen-Form eingereicht (anonym).",
        })
        .returning({ id: players.id });
      insertedPlayerId = player!.id;

      // Setup
      const setupKommentar = [
        data.goodText ? `Was funktioniert gut: ${data.goodText}` : null,
        data.badText ? `Was nervt: ${data.badText}` : null,
      ].filter(Boolean).join(" | ") || null;

      await db.insert(playerSetups).values({
        playerId: insertedPlayerId,
        status: "current",
        bladeId: data.bladeId,
        rubberVhId: data.rubberVhId,
        rubberRhId: data.rubberRhId,
        scoreGesamtzufriedenheit: data.satisfaction,
        kommentar: setupKommentar,
      });

      // Wechsel-Story als observation
      if (data.previousText) {
        await db.insert(observations).values({
          playerId: insertedPlayerId,
          eigeneEmpfehlung: `Wechsel-Story: ${data.previousText}`,
        });
      }
    }

    // Audit-Log (IMMER)
    await db.insert(interviewSubmissions).values({
      rawData: { ...data, blade: bladeName, vh: vhName, rh: rhName },
      aiVerdict: ai.verdict,
      aiReason: ai.reason,
      insertedPlayerId,
      ipHash,
    });

    if (ai.verdict === "valid") {
      return NextResponse.json({
        success: true,
        verdict: ai.verdict,
        message: "Danke! Deine Daten helfen jetzt allen die nach dir kommen.",
      });
    }

    // Bei suspect/spam: User trotzdem nett antworten — nicht verärgern falls False-Positive
    return NextResponse.json({
      success: true,
      verdict: ai.verdict,
      message: "Danke für die Mithilfe! Wir prüfen deinen Eintrag manuell.",
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[submit-interview]", msg);
    return NextResponse.json(
      { success: false, message: "Etwas ist schiefgegangen. Bitte später nochmal versuchen." },
      { status: 500 },
    );
  }
}
