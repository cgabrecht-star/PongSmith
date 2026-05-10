/**
 * Setup-Grouper
 *
 * Nimmt den Berater-Text + erkannte Produkte und gruppiert sie zu
 * "Setups" (1 Holz + 1-2 Beläge), basierend auf den "1.", "2.", "3."
 * Markierungen die der Berater im Text setzt.
 *
 * Wenn keine Setup-Struktur erkennbar ist, kommt eine leere Liste zurück
 * — die UI fällt dann auf die flache Produktliste zurück.
 */

import type { DetectedProduct } from "./product-detector";

export interface SetupGroup {
  index: number;
  /** Originale Überschrift, z.B. "Stiga Allround Classic + Donic Acuda S2" */
  title: string;
  /** Produkte die zu diesem Setup gehören (Holz + Beläge) */
  products: DetectedProduct[];
}

/**
 * Sucht nach Setup-Markierungen wie "1. ...", "2. ...", "3. ..."
 * (auch hinter "## " oder "### " erlaubt).
 *
 * Filtert out: Aufzählungen mit Zahlen >5 (sind sicher keine Setups).
 */
export function groupProductsBySetup(
  text: string,
  products: DetectedProduct[],
): SetupGroup[] {
  if (!text || products.length === 0) return [];

  // Marker: optional ##/### + Whitespace, dann "N. " (1-5) am Zeilenanfang
  // oder direkt nach einem Newline.
  const markerRe = /(?:^|\n)\s*(?:#{1,3}\s+)?([1-5])\.\s+(.+?)(?=\n|$)/g;

  const markers: { index: number; pos: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(text)) !== null) {
    const idx = parseInt(m[1]!, 10);
    // Position ist NACH dem führenden \n falls vorhanden
    const startPos = m[0].startsWith("\n") ? m.index + 1 : m.index;
    const title = (m[2] ?? "").replace(/\*+/g, "").trim();
    markers.push({ index: idx, pos: startPos, title });
  }

  // Mindestens 2 Marker nötig (sonst ist's wahrscheinlich keine echte Liste)
  if (markers.length < 2) return [];

  // Nur Marker behalten die aufsteigend sind (1, 2, 3, ...)
  const valid: typeof markers = [];
  let expected = markers[0]!.index;
  for (const mk of markers) {
    if (mk.index === expected) {
      valid.push(mk);
      expected++;
    }
  }
  if (valid.length < 2) return [];

  // Pro Marker: alle Produkte deren Position innerhalb dieses Setup-Bereichs liegt
  const groups: SetupGroup[] = [];
  for (let i = 0; i < valid.length; i++) {
    const start = valid[i]!.pos;
    const end = i + 1 < valid.length ? valid[i + 1]!.pos : text.length;
    const productsInRange = products.filter(
      (p) => p.position >= start && p.position < end,
    );
    if (productsInRange.length > 0) {
      groups.push({
        index: valid[i]!.index,
        title: valid[i]!.title.substring(0, 100),
        products: productsInRange,
      });
    }
  }

  return groups;
}
