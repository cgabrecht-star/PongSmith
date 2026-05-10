/**
 * GET /api/products/search?q=suchbegriff&type=blade|rubber
 *
 * Schlanker Endpoint für Autocomplete im /mithelfen-Form.
 * Liefert max. 12 Treffer mit ID + Name + Hersteller — keine Specs/Stats.
 *
 * Filtert nur Produkte mit Mindest-Datenqualität (= mind. Specs vorhanden),
 * damit User keine Stubs auswählen.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blades, rubbers, manufacturers } from "@/db/schema";
import { and, eq, ilike, sql, isNotNull, or } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 12;

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

  // Suche: name LIKE %q% ODER manufacturer-Name + name kombiniert
  const pattern = `%${q}%`;

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
            // Mindest-Datenqualität: Specs vorhanden
            or(isNotNull(blades.communitySpeed), isNotNull(blades.speedNorm)),
            // Suche
            or(
              ilike(blades.name, pattern),
              sql`LOWER(${manufacturers.name} || ' ' || ${blades.name}) LIKE LOWER(${pattern})`,
            ),
          ),
        )
        // Hochwertige (mit Reviews) zuerst
        .orderBy(sql`${blades.communityReviewCount} DESC NULLS LAST`)
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
          or(isNotNull(rubbers.communitySpeed), isNotNull(rubbers.speedNorm)),
          or(
            ilike(rubbers.name, pattern),
            sql`LOWER(${manufacturers.name} || ' ' || ${rubbers.name}) LIKE LOWER(${pattern})`,
          ),
        ),
      )
      .orderBy(sql`${rubbers.communityReviewCount} DESC NULLS LAST`)
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
