/**
 * GET /api/sortiment
 * Gibt alle Beläge und Hölzer aus der DB zurück (mit Hersteller-Info).
 * Query-Parameter:
 *   type=rubber|blade        — Produktkategorie (default: beide)
 *   rubber_type=smooth|long_pips|short_pips|anti   — nur für Beläge
 *   play_style=offensive_topspin|allround|defensive|material
 *   manufacturer=slug
 *   q=suchbegriff            — Namenssuche
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rubbers, blades, manufacturers } from "@/db/schema";
import { and, eq, ilike, inArray } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "rubber" | "blade" | null (= beide)
  const rubberType = searchParams.get("rubber_type");
  const playStyle = searchParams.get("play_style");
  const manufacturerSlug = searchParams.get("manufacturer");
  const q = searchParams.get("q");
  const lang = searchParams.get("lang") === "en" ? "en" : "de";

  try {
    // ── Hersteller-Cache ──────────────────────────────────────────────────
    const allManufacturers = await db.select().from(manufacturers);
    const mfgById = new Map(allManufacturers.map((m) => [m.id, m]));

    let mfgId: number | undefined;
    if (manufacturerSlug) {
      const found = allManufacturers.find((m) => m.slug === manufacturerSlug);
      mfgId = found?.id;
    }

    // ── Beläge ────────────────────────────────────────────────────────────
    let rubberRows: typeof rubbers.$inferSelect[] = [];
    if (!type || type === "rubber") {
      const conditions = [];
      if (rubberType && ["smooth", "long_pips", "short_pips", "anti"].includes(rubberType)) {
        conditions.push(eq(rubbers.type, rubberType as "smooth" | "long_pips" | "short_pips" | "anti"));
      }
      if (playStyle && ["offensive_topspin", "allround", "defensive", "material"].includes(playStyle)) {
        conditions.push(eq(rubbers.playStyle, playStyle as "offensive_topspin" | "allround" | "defensive" | "material"));
      }
      if (mfgId) {
        conditions.push(eq(rubbers.manufacturerId, mfgId));
      }
      if (q) {
        conditions.push(ilike(rubbers.name, `%${q}%`));
      }
      conditions.push(eq(rubbers.isActive, true));

      rubberRows = await db
        .select()
        .from(rubbers)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(rubbers.name);
    }

    // ── Hölzer ────────────────────────────────────────────────────────────
    let bladeRows: typeof blades.$inferSelect[] = [];
    if (!type || type === "blade") {
      const conditions = [];
      if (playStyle && ["offensive_topspin", "allround", "defensive", "material"].includes(playStyle)) {
        conditions.push(eq(blades.playStyle, playStyle as "offensive_topspin" | "allround" | "defensive" | "material"));
      }
      if (mfgId) {
        conditions.push(eq(blades.manufacturerId, mfgId));
      }
      if (q) {
        conditions.push(ilike(blades.name, `%${q}%`));
      }
      conditions.push(eq(blades.isActive, true));

      bladeRows = await db
        .select()
        .from(blades)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(blades.name);
    }

    // ── Antwort zusammenbauen ─────────────────────────────────────────────
    const mappedRubbers = rubberRows.map((r) => ({
      id: r.id,
      kind: "rubber" as const,
      name: r.name,
      slug: r.slug,
      manufacturer: mfgById.get(r.manufacturerId)?.name ?? "Unbekannt",
      manufacturerSlug: mfgById.get(r.manufacturerId)?.slug ?? "",
      rubberType: r.type,
      playStyle: r.playStyle,
      speedNorm: r.communitySpeed ?? r.speedNorm,
      spinNorm: r.communitySpin ?? r.spinNorm,
      controlNorm: r.communityControl ?? r.controlNorm,
      hardnessMin: r.hardnessMin,
      ttrMin: r.ttrMin,
      ttrMax: r.ttrMax,
      ttrOptimal: r.ttrOptimal,
      reviewCount: r.communityReviewCount,
      description: lang === "en" ? (r.descriptionEn ?? r.description) : r.description,
      communityDescription: lang === "en" ? (r.communityDescriptionEn ?? r.communityDescription) : r.communityDescription,
      imageUrl: r.imageUrl,
    }));

    const mappedBlades = bladeRows.map((b) => ({
      id: b.id,
      kind: "blade" as const,
      name: b.name,
      slug: b.slug,
      manufacturer: mfgById.get(b.manufacturerId)?.name ?? "Unbekannt",
      manufacturerSlug: mfgById.get(b.manufacturerId)?.slug ?? "",
      playStyle: b.playStyle,
      speedNorm: b.communitySpeed ?? b.speedNorm,
      controlNorm: b.communityControl ?? b.controlNorm,
      layers: b.layers,
      composition: b.composition,
      weightMin: b.weightMin,
      weightMax: b.weightMax,
      stiffness: b.stiffness,
      ttrMin: b.ttrMin,
      ttrMax: b.ttrMax,
      ttrOptimal: b.ttrOptimal,
      reviewCount: b.communityReviewCount,
      description: lang === "en" ? (b.descriptionEn ?? b.description) : b.description,
      communityDescription: lang === "en" ? (b.communityDescriptionEn ?? b.communityDescription) : b.communityDescription,
      imageUrl: b.imageUrl,
    }));

    return NextResponse.json({
      rubbers: mappedRubbers,
      blades: mappedBlades,
      total: mappedRubbers.length + mappedBlades.length,
      manufacturers: allManufacturers.map((m) => ({ name: m.name, slug: m.slug })),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sortiment]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
