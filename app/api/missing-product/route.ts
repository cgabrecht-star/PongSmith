/**
 * POST /api/missing-product
 *
 * User meldet ein Produkt das im Autocomplete nicht gefunden wurde.
 * Wir loggen die Anfrage in missing_products, ohne Aufwand für den User
 * (kein Login, keine E-Mail Pflicht). Wird manuell durchgeguckt und ggf.
 * mit canonical Daten in blades/rubbers angelegt.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { missingProducts } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Payload {
  type: "blade" | "rubber";
  reportedQuery: string;
  manufacturer?: string;
  productName: string;
  comment?: string;
}

export async function POST(req: NextRequest) {
  let body: Partial<Payload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validierung
  if (body.type !== "blade" && body.type !== "rubber") {
    return NextResponse.json({ error: "type must be blade|rubber" }, { status: 400 });
  }
  const productName = (body.productName ?? "").trim();
  if (!productName || productName.length < 2 || productName.length > 200) {
    return NextResponse.json({ error: "productName 2-200 chars" }, { status: 400 });
  }
  const reportedQuery = (body.reportedQuery ?? "").trim().slice(0, 200) || productName;
  const manufacturer = (body.manufacturer ?? "").trim().slice(0, 100) || null;
  const comment = (body.comment ?? "").trim().slice(0, 1000) || null;

  try {
    await db.insert(missingProducts).values({
      productType: body.type,
      reportedQuery,
      manufacturer,
      productName,
      comment,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[missing-product]", msg);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
