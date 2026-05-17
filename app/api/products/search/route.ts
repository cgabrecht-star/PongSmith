/**
 * GET /api/products/search?q=suchbegriff&type=blade|rubber
 *
 * Schlanker Endpoint für Autocomplete im /mithelfen-Form.
 * Liefert max. 12 Treffer mit ID + Name + Hersteller, keine Specs/Stats.
 *
 * Filtert nur Produkte mit Mindest-Datenqualität (= mind. Specs vorhanden),
 * damit User keine Stubs auswählen.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blades, rubbers, manufacturers } from "@/db/schema";
import { and, eq, ilike, sql, or, type SQL } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Großzügig, damit "Andro" alle ~75 Andro-Produkte zeigt.
const MAX_RESULTS = 100;

/**
 * Erkennt Kategorie-Tokens in der Suche und mappt sie auf play_style.
 * Beispiel: "Andro ALL" → { text: "Andro", playStyle: "allround" }
 */
function parseCategoryToken(q: string): {
  text: string;
  playStyle: "offensive_topspin" | "allround" | "defensive" | "material" | null;
} {
  const tokens = q.split(/\s+/).filter(Boolean);
  const remaining: string[] = [];
  let playStyle: ReturnType<typeof parseCategoryToken>["playStyle"] = null;
  for (const t of tokens) {
    const u = t.toUpperCase().replace(/[+\-]$/, ""); // ALL+ → ALL
    if (u === "ALL") playStyle = "allround";
    else if (u === "OFF") playStyle = "offensive_topspin";
    else if (u === "DEF") playStyle = "defensive";
    else if (u === "MAT" || u === "MATERIAL" || u === "NOPPEN" || u === "ANTI")
      playStyle = "material";
    else remaining.push(t);
  }
  return { text: remaining.join(" "), playStyle };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type");

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  if (type !== "blade" && type !== "rubber") {
    return NextResponse.json({ error: "type must be blade|rubber" }, { status: 400 });
  }

  // Erkenne Kategorie-Tokens (ALL, OFF, DEF, MAT) und filtere danach
  const { text, playStyle } = parseCategoryToken(q);
  // Falls nach Token-Abzug noch Text übrig: damit suchen. Sonst (z.B. nur "ALL"
  // ohne Marke): leere Pattern → matched alles, dann nur play_style-Filter.
  const pattern = `%${text}%`;
  const textCondition: SQL | undefined =
    text.length > 0
      ? or(
          ilike(blades.name, pattern),
          sql`LOWER(${manufacturers.name} || ' ' || ${blades.name}) LIKE LOWER(${pattern})`,
        )
      : undefined;
  const rubberTextCondition: SQL | undefined =
    text.length > 0
      ? or(
          ilike(rubbers.name, pattern),
          sql`LOWER(${manufacturers.name} || ' ' || ${rubbers.name}) LIKE LOWER(${pattern})`,
        )
      : undefined;

  try {
    if (type === "blade") {
      const rows = await db
        .select({
          id: blades.id,
          name: blades.name,
          manufacturer: manufacturers.name,
          reviewCount: blades.communityReviewCount,
        })
        .from(blades)
        .innerJoin(manufacturers, eq(blades.manufacturerId, manufacturers.id))
        .where(
          and(
            eq(blades.isActive, true),
            textCondition,
            playStyle ? eq(blades.playStyle, playStyle) : undefined,
          ),
        )
        // Alphabetisch nach Name (Hersteller-Präfix ist im Namen meist enthalten)
        .orderBy(sql`LOWER(${blades.name}) ASC`)
        .limit(MAX_RESULTS);

      return NextResponse.json({
        results: rows.map((r) => ({
          id: r.id,
          label: `${r.manufacturer} ${r.name.replace(new RegExp(`^${r.manufacturer}\\s+`, "i"), "")}`,
          name: r.name,
          manufacturer: r.manufacturer,
          reviews: r.reviewCount ?? 0,
        })),
      });
    }

    // rubber
    const rows = await db
      .select({
        id: rubbers.id,
        name: rubbers.name,
        manufacturer: manufacturers.name,
        reviewCount: rubbers.communityReviewCount,
      })
      .from(rubbers)
      .innerJoin(manufacturers, eq(rubbers.manufacturerId, manufacturers.id))
      .where(
        and(
          eq(rubbers.isActive, true),
          rubberTextCondition,
          playStyle ? eq(rubbers.playStyle, playStyle) : undefined,
        ),
      )
      .orderBy(sql`LOWER(${rubbers.name}) ASC`)
      .limit(MAX_RESULTS);

    return NextResponse.json({
      results: rows.map((r) => ({
        id: r.id,
        label: `${r.manufacturer} ${r.name.replace(new RegExp(`^${r.manufacturer}\\s+`, "i"), "")}`,
        name: r.name,
        manufacturer: r.manufacturer,
        reviews: r.reviewCount ?? 0,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[products/search]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
