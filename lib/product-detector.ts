/**
 * Product-Detector
 *
 * Scannt einen Berater-Response-Text nach Produktnamen aus der DB und
 * liefert eine Liste der erwähnten Produkte zurück. Damit kann die UI
 * Shop-Buttons unter jeder Empfehlung anzeigen, ohne dass der Prompt
 * geändert werden muss.
 *
 * Ansatz: Wortgrenzen-aware Match, längste Treffer zuerst (verhindert
 * Doppel-Treffer wie "Bluestorm" + "Bluestorm Z1").
 */

import { db } from "@/db";
import { blades, rubbers, manufacturers } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface DetectedProduct {
  type: "blade" | "rubber";
  id: number;
  name: string;
  manufacturer: string;
  /** Position im Text (für stabile Sortierung der Buttons) */
  position: number;
}

// In-Memory-Cache, Produktdaten ändern sich selten, kein Bedarf für TTL
let cache: {
  blades: { id: number; name: string; manufacturer: string }[];
  rubbers: { id: number; name: string; manufacturer: string }[];
} | null = null;

async function loadProductCache() {
  if (cache) return cache;

  const [blRows, ruRows] = await Promise.all([
    db
      .select({
        id: blades.id,
        name: blades.name,
        mfgName: manufacturers.name,
      })
      .from(blades)
      .innerJoin(manufacturers, eq(blades.manufacturerId, manufacturers.id))
      .where(eq(blades.isActive, true)),
    db
      .select({
        id: rubbers.id,
        name: rubbers.name,
        mfgName: manufacturers.name,
      })
      .from(rubbers)
      .innerJoin(manufacturers, eq(rubbers.manufacturerId, manufacturers.id))
      .where(eq(rubbers.isActive, true)),
  ]);

  cache = {
    blades: blRows.map((r) => ({ id: r.id, name: r.name, manufacturer: r.mfgName })),
    rubbers: ruRows.map((r) => ({ id: r.id, name: r.name, manufacturer: r.mfgName })),
  };
  return cache;
}

/** Cache zurücksetzen, z.B. nach DB-Updates in Tests. */
export function clearProductCache() {
  cache = null;
}

/** Escape für RegExp-Special-Chars im Produktnamen. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Findet alle Produktnamen im Text. Längste Treffer zuerst,
 * Duplikate werden entfernt (jedes Produkt max. 1× im Output).
 */
export async function detectProducts(text: string): Promise<DetectedProduct[]> {
  if (!text || text.length < 5) return [];

  const c = await loadProductCache();

  // Alle Kandidaten kombinieren, sortiert nach Länge absteigend
  type Candidate = {
    type: "blade" | "rubber";
    id: number;
    name: string;
    manufacturer: string;
  };
  const all: Candidate[] = [
    ...c.blades.map((b) => ({ type: "blade" as const, ...b })),
    ...c.rubbers.map((r) => ({ type: "rubber" as const, ...r })),
  ].sort((a, b) => b.name.length - a.name.length);

  const detected = new Map<string, DetectedProduct>();
  // Tracking: welche Textbereiche schon vergeben sind (für längste-Match-Logik)
  const taken: Array<[number, number]> = [];

  function isOverlapping(start: number, end: number): boolean {
    return taken.some(([ts, te]) => start < te && end > ts);
  }

  for (const p of all) {
    if (p.name.length < 4) continue; // zu kurz → false positives
    const escaped = escapeRegex(p.name);
    // Lookbehind/Lookahead statt Char-Konsumtion: m.index + m[0].length sind
    // EXAKT die Grenzen des Produktnamens. Damit ist die Overlap-Mathematik
    // sauber und Substring-Treffer wie "Marder" innerhalb "Marder II" werden
    // verlässlich gefiltert (Bug D).
    const re = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      if (isOverlapping(start, end)) continue;
      taken.push([start, end]);

      const key = `${p.type}:${p.id}`;
      if (!detected.has(key)) {
        detected.set(key, {
          type: p.type,
          id: p.id,
          name: p.name,
          manufacturer: p.manufacturer,
          position: start,
        });
      }
    }
  }

  return [...detected.values()].sort((a, b) => a.position - b.position);
}
