/**
 * Server-side Daten-Loader für Produkt-Detail-Seiten.
 *
 * Lädt alles was eine /belag/[slug] oder /holz/[slug] Page braucht:
 *  - Vollständige Produkt-Daten (Specs, Beschreibung, Reviews)
 *  - Top-Synergien (für "Empfohlene Setups"-Sektion)
 *  - Ähnliche Produkte (gleicher Spielstil/Härte, andere Hersteller)
 */

import { db } from "@/db";
import { blades, rubbers, manufacturers, synergies } from "@/db/schema";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";

export interface ProductDetail {
  id: number;
  type: "blade" | "rubber";
  name: string;
  slug: string;
  manufacturer: { id: number; name: string; slug: string };
  // Specs
  speed: number | null;
  spin: number | null;
  control: number | null;
  // Belag-spezifisch
  rubberType?: "smooth" | "long_pips" | "short_pips" | "anti";
  hardnessMin?: number | null;
  hardnessMax?: number | null;
  topsheet?: "sticky" | "grippy" | "neutral" | null;
  // Holz-spezifisch
  composition?: string | null;
  layers?: number | null;
  stiffness?: string | null;
  weightMin?: number | null;
  weightMax?: number | null;
  // Allgemein
  playStyle: string | null;
  ttrMin: number | null;
  ttrMax: number | null;
  ttrOptimal: number | null;
  description: string | null;
  communityDescription: string | null;
  reviewCount: number;
  imageUrl: string | null;
  sourceUrl: string | null;
}

export interface SynergyPartner {
  id: number;
  type: "blade" | "rubber";
  name: string;
  slug: string;
  manufacturer: string;
  imageUrl: string | null;
  synergyScore: number;
  ttrTarget: number;
}

export interface SimilarProduct {
  id: number;
  name: string;
  slug: string;
  manufacturer: string;
  imageUrl: string | null;
  speed: number | null;
  spin: number | null;
  control: number | null;
}

// ─── Belag laden ──────────────────────────────────────────────────────────

export async function loadRubberBySlug(slug: string): Promise<ProductDetail | null> {
  const rows = await db
    .select({
      id: rubbers.id,
      name: rubbers.name,
      slug: rubbers.slug,
      type: rubbers.type,
      speedNorm: rubbers.speedNorm,
      spinNorm: rubbers.spinNorm,
      controlNorm: rubbers.controlNorm,
      communitySpeed: rubbers.communitySpeed,
      communitySpin: rubbers.communitySpin,
      communityControl: rubbers.communityControl,
      reviewCount: rubbers.communityReviewCount,
      hardnessMin: rubbers.hardnessMin,
      hardnessMax: rubbers.hardnessMax,
      topsheet: rubbers.topsheetCharacter,
      playStyle: rubbers.playStyle,
      ttrMin: rubbers.ttrMin,
      ttrMax: rubbers.ttrMax,
      ttrOptimal: rubbers.ttrOptimal,
      description: rubbers.description,
      communityDescription: rubbers.communityDescription,
      imageUrl: rubbers.imageUrl,
      sourceUrl: rubbers.sourceUrl,
      mfgId: manufacturers.id,
      mfgName: manufacturers.name,
      mfgSlug: manufacturers.slug,
    })
    .from(rubbers)
    .innerJoin(manufacturers, eq(rubbers.manufacturerId, manufacturers.id))
    .where(and(eq(rubbers.slug, slug), eq(rubbers.isActive, true)))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0]!;

  return {
    id: r.id,
    type: "rubber",
    name: r.name,
    slug: r.slug,
    manufacturer: { id: r.mfgId, name: r.mfgName, slug: r.mfgSlug },
    speed: toNum(r.communitySpeed) ?? toNum(r.speedNorm),
    spin: toNum(r.communitySpin) ?? toNum(r.spinNorm),
    control: toNum(r.communityControl) ?? toNum(r.controlNorm),
    rubberType: r.type,
    hardnessMin: r.hardnessMin,
    hardnessMax: r.hardnessMax,
    topsheet: r.topsheet,
    playStyle: r.playStyle,
    ttrMin: r.ttrMin,
    ttrMax: r.ttrMax,
    ttrOptimal: r.ttrOptimal,
    description: r.description,
    communityDescription: r.communityDescription,
    reviewCount: r.reviewCount ?? 0,
    imageUrl: r.imageUrl,
    sourceUrl: r.sourceUrl,
  };
}

// ─── Holz laden ───────────────────────────────────────────────────────────

export async function loadBladeBySlug(slug: string): Promise<ProductDetail | null> {
  const rows = await db
    .select({
      id: blades.id,
      name: blades.name,
      slug: blades.slug,
      speedNorm: blades.speedNorm,
      controlNorm: blades.controlNorm,
      communitySpeed: blades.communitySpeed,
      communityControl: blades.communityControl,
      reviewCount: blades.communityReviewCount,
      composition: blades.composition,
      layers: blades.layers,
      stiffness: blades.stiffness,
      weightMin: blades.weightMin,
      weightMax: blades.weightMax,
      playStyle: blades.playStyle,
      ttrMin: blades.ttrMin,
      ttrMax: blades.ttrMax,
      ttrOptimal: blades.ttrOptimal,
      description: blades.description,
      communityDescription: blades.communityDescription,
      imageUrl: blades.imageUrl,
      sourceUrl: blades.sourceUrl,
      mfgId: manufacturers.id,
      mfgName: manufacturers.name,
      mfgSlug: manufacturers.slug,
    })
    .from(blades)
    .innerJoin(manufacturers, eq(blades.manufacturerId, manufacturers.id))
    .where(and(eq(blades.slug, slug), eq(blades.isActive, true)))
    .limit(1);

  if (rows.length === 0) return null;
  const b = rows[0]!;

  return {
    id: b.id,
    type: "blade",
    name: b.name,
    slug: b.slug,
    manufacturer: { id: b.mfgId, name: b.mfgName, slug: b.mfgSlug },
    speed: toNum(b.communitySpeed) ?? toNum(b.speedNorm),
    spin: null,
    control: toNum(b.communityControl) ?? toNum(b.controlNorm),
    composition: b.composition,
    layers: b.layers,
    stiffness: b.stiffness,
    weightMin: b.weightMin,
    weightMax: b.weightMax,
    playStyle: b.playStyle,
    ttrMin: b.ttrMin,
    ttrMax: b.ttrMax,
    ttrOptimal: b.ttrOptimal,
    description: b.description,
    communityDescription: b.communityDescription,
    reviewCount: b.reviewCount ?? 0,
    imageUrl: b.imageUrl,
    sourceUrl: b.sourceUrl,
  };
}

// ─── Top-Synergien für ein Produkt ─────────────────────────────────────────

export async function loadTopSynergiesForProduct(
  productType: "blade" | "rubber",
  productId: number,
  limit = 5,
): Promise<SynergyPartner[]> {
  // Wenn Belag: zeige Top-Hölzer. Wenn Holz: zeige Top-Beläge.
  const partnerType: "blade" | "rubber" = productType === "blade" ? "rubber" : "blade";
  const partnerTable = partnerType === "blade" ? blades : rubbers;
  const partnerIdCol = partnerType === "blade" ? synergies.bladeId : synergies.rubberId;
  const filterCol = productType === "blade" ? synergies.bladeId : synergies.rubberId;

  const rows = await db
    .select({
      partnerId: partnerIdCol,
      partnerName: partnerTable.name,
      partnerSlug: partnerTable.slug,
      partnerImage: partnerTable.imageUrl,
      manufacturerName: manufacturers.name,
      score: synergies.synergyScore,
      ttrTarget: synergies.ttrTarget,
    })
    .from(synergies)
    .innerJoin(partnerTable, eq(partnerIdCol, partnerTable.id))
    .innerJoin(manufacturers, eq(partnerTable.manufacturerId, manufacturers.id))
    .where(and(eq(filterCol, productId), eq(partnerTable.isActive, true)))
    .orderBy(desc(synergies.synergyScore))
    .limit(limit * 2); // Buffer für Hersteller-Diversifizierung

  // Hersteller-Diversität
  const seen = new Set<string>();
  const out: SynergyPartner[] = [];
  for (const r of rows) {
    if (seen.has(r.manufacturerName)) continue;
    seen.add(r.manufacturerName);
    out.push({
      id: r.partnerId,
      type: partnerType,
      name: r.partnerName,
      slug: r.partnerSlug,
      manufacturer: r.manufacturerName,
      imageUrl: r.partnerImage,
      synergyScore: r.score,
      ttrTarget: r.ttrTarget ?? 1300,
    });
    if (out.length >= limit) break;
  }
  return out;
}

// ─── Ähnliche Produkte ────────────────────────────────────────────────────

export async function loadSimilarProducts(
  productType: "blade" | "rubber",
  product: ProductDetail,
  limit = 4,
): Promise<SimilarProduct[]> {
  if (productType === "rubber") {
    const rows = await db
      .select({
        id: rubbers.id,
        name: rubbers.name,
        slug: rubbers.slug,
        manufacturer: manufacturers.name,
        imageUrl: rubbers.imageUrl,
        speed: sql<string | null>`COALESCE(${rubbers.communitySpeed}, ${rubbers.speedNorm})`,
        spin: sql<string | null>`COALESCE(${rubbers.communitySpin}, ${rubbers.spinNorm})`,
        control: sql<string | null>`COALESCE(${rubbers.communityControl}, ${rubbers.controlNorm})`,
      })
      .from(rubbers)
      .innerJoin(manufacturers, eq(rubbers.manufacturerId, manufacturers.id))
      .where(
        and(
          ne(rubbers.id, product.id),
          eq(rubbers.isActive, true),
          eq(rubbers.type, product.rubberType ?? "smooth"),
          // Ähnlicher Spielstil
          product.playStyle ? eq(rubbers.playStyle, product.playStyle as never) : undefined,
        ),
      )
      .orderBy(desc(rubbers.communityReviewCount))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      manufacturer: r.manufacturer,
      imageUrl: r.imageUrl,
      speed: toNum(r.speed),
      spin: toNum(r.spin),
      control: toNum(r.control),
    }));
  }

  // Holz
  const rows = await db
    .select({
      id: blades.id,
      name: blades.name,
      slug: blades.slug,
      manufacturer: manufacturers.name,
      imageUrl: blades.imageUrl,
      speed: sql<string | null>`COALESCE(${blades.communitySpeed}, ${blades.speedNorm})`,
      control: sql<string | null>`COALESCE(${blades.communityControl}, ${blades.controlNorm})`,
    })
    .from(blades)
    .innerJoin(manufacturers, eq(blades.manufacturerId, manufacturers.id))
    .where(
      and(
        ne(blades.id, product.id),
        eq(blades.isActive, true),
        product.playStyle ? eq(blades.playStyle, product.playStyle as never) : undefined,
      ),
    )
    .orderBy(desc(blades.communityReviewCount))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    manufacturer: r.manufacturer,
    imageUrl: r.imageUrl,
    speed: toNum(r.speed),
    spin: null,
    control: toNum(r.control),
  }));
}

// ─── Slug-Generator (für sitemap) ─────────────────────────────────────────

export async function loadAllProductSlugs(): Promise<{ rubbers: string[]; blades: string[] }> {
  const [rubberRows, bladeRows] = await Promise.all([
    db.select({ slug: rubbers.slug, reviews: rubbers.communityReviewCount, hasSpecs: rubbers.communitySpeed })
      .from(rubbers)
      .where(eq(rubbers.isActive, true)),
    db.select({ slug: blades.slug, reviews: blades.communityReviewCount, hasSpecs: blades.communitySpeed })
      .from(blades)
      .where(eq(blades.isActive, true)),
  ]);

  return {
    rubbers: rubberRows.map((r) => r.slug),
    blades: bladeRows.map((b) => b.slug),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function toNum(v: string | number | null): number | null {
  if (v === null) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
