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

  // Phase 1: Welche Produkte tauchen überhaupt im Text auf?
  // Wir bauen eine Set der "etablierten" längeren Namen, damit wir
  // kürzere Substring-Produkte (z.B. "Marder" bei vorhandenem
  // "SpinLord Marder II") generell unterdrücken können.
  const establishedNames = new Set<string>();
  for (const p of all) {
    if (p.name.length < 10) continue; // nur lange Namen als Anker
    const re = new RegExp(`(?<![\\w])${escapeRegex(p.name)}(?![\\w])`, "i");
    if (re.test(text)) establishedNames.add(p.name.toLowerCase());
  }

  // Phase 2: Klassische Detection mit Overlap-Filter.
  for (const p of all) {
    if (p.name.length < 4) continue; // zu kurz → false positives
    // Bug D: Suppress short product if its name is a substring of an already
    // established longer product name. Verhindert "Marder" bei vorhandenem
    // "SpinLord Marder II" auch wenn "Marder" in der Position eigenständig
    // matched (z.B. "Der Marder II hat...").
    if (p.name.length < 12) {
      const lower = p.name.toLowerCase();
      let isShadowed = false;
      for (const established of establishedNames) {
        if (established === lower) continue;
        if (established.includes(lower)) {
          isShadowed = true;
          break;
        }
      }
      if (isShadowed) continue;
    }
    const escaped = escapeRegex(p.name);
    // Lookbehind/Lookahead statt Char-Konsumtion: m.index + m[0].length sind
    // EXAKT die Grenzen des Produktnamens.
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
