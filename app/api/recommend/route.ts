/**
 * POST /api/recommend
 * Body: { ttr: number, playStyle: "offensive_topspin" | "allround" | "defensive" }
 * Returns: top 3 Holz+Belag-Empfehlungen aus der Synergies-Tabelle
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { synergies, blades, rubbers } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STYLES = ["offensive_topspin", "allround", "defensive"] as const;
type PlayStyle = (typeof VALID_STYLES)[number];

async function querySetups(ttr: number, playStyle: PlayStyle, ttrWindow: number) {
  return db
    .select({
      synergyScore: synergies.synergyScore,
      tempoMatch: synergies.tempoMatch,
      controlReserve: synergies.controlReserve,
      spinPotential: synergies.spinPotential,
      ttrTarget: synergies.ttrTarget,
      playStyleTarget: synergies.playStyleTarget,
      bladeId: blades.id,
      bladeName: blades.name,
      rubberId: rubbers.id,
      rubberName: rubbers.name,
    })
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, ttr - ttrWindow),
        lte(synergies.ttrTarget, ttr + ttrWindow),
        eq(synergies.playStyleTarget, playStyle),
      ),
    )
    .orderBy(desc(synergies.synergyScore))
    .limit(120);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { ttr?: unknown; playStyle?: unknown };
    const ttr = Number(body.ttr);
    const playStyle = body.playStyle as PlayStyle;

    if (!ttr || ttr < 600 || ttr > 2500) {
      return NextResponse.json({ error: "Ungültiger TTR-Wert (600–2500)" }, { status: 400 });
    }
    if (!VALID_STYLES.includes(playStyle)) {
      return NextResponse.json({ error: "Ungültiger Spielstil" }, { status: 400 });
    }

    // TTR auf Daten-Range klemmen (unsere Synergien liegen bei 1000–1700)
    const clampedTtr = Math.max(1000, Math.min(1700, ttr));

    // Erst enges Fenster, bei wenig Treffern aufweiten
    let candidates = await querySetups(clampedTtr, playStyle, 250);
    if (candidates.length < 6) {
      candidates = await querySetups(clampedTtr, playStyle, 450);
    }

    // Bestes Belag-Match pro Holz
    const seenBlades = new Set<number>();
    const setups: typeof candidates = [];
    for (const row of candidates) {
      if (!seenBlades.has(row.bladeId)) {
        seenBlades.add(row.bladeId);
        setups.push(row);
      }
      if (setups.length >= 3) break;
    }

    return NextResponse.json({ setups });
  } catch (err) {
    console.error("[recommend]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
