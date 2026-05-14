/**
 * Setup-Grouper
 *
 * Nimmt den Berater-Text + erkannte Produkte und gruppiert sie zu
 * "Setups" (1 Holz + 1-2 Beläge), basierend auf den "1.", "2.", "3."
 * Markierungen die der Berater im Text setzt.
 *
 * Wenn keine Setup-Struktur erkennbar ist, kommt eine leere Liste zurück
 *, die UI fällt dann auf die flache Produktliste zurück.
 */

import type { DetectedProduct } from "./product-detector";

export interface SetupGroup {
  index: number;
  /** Originale Überschrift, z.B. "Stiga Allround Classic + Donic Acuda S2" */
  title: string;
  /** Produkte die zu diesem Setup gehören (Holz + Beläge) */
  products: DetectedProduct[];
  /** Begründungstext: alles was zwischen dem Setup-Titel und dem nächsten
   *  Setup-Marker steht (oder bis zum Ende). Wird auf der Karte als Mini-
   *  Quote angezeigt. */
  description: string;
}

/**
 * Sucht nach Setup-Markierungen in mehreren Formaten:
 *  - "1. ..." / "1) ..." am Zeilenanfang (auch hinter ##/###)
 *  - "Setup 1: ..." / "Setup 1, ..." / "Setup 1 - ..." (auch inline)
 *  - "Erstens: ..." / "Zweitens: ..." / "Drittens: ..." (deutsche Ordinalia)
 *
 * Filtert out: Aufzählungen mit Zahlen >5 (sind sicher keine Setups).
 */
const ORDINAL_WORDS: Record<string, number> = {
  erstens: 1, zweitens: 2, drittens: 3, viertens: 4, fünftens: 5, fuenftens: 5,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
};

export function groupProductsBySetup(
  text: string,
  products: DetectedProduct[],
): SetupGroup[] {
  if (!text || products.length === 0) return [];

  const markers: { index: number; pos: number; title: string }[] = [];
  let m: RegExpExecArray | null;

  // (a) Klassisch: "1. ..." / "1) ..." am Zeilenanfang
  const classicRe = /(?:^|\n)\s*(?:#{1,3}\s+)?([1-5])[\.\)]\s+(.+?)(?=\n|$)/g;
  while ((m = classicRe.exec(text)) !== null) {
    const idx = parseInt(m[1]!, 10);
    const startPos = m[0].startsWith("\n") ? m.index + 1 : m.index;
    const title = (m[2] ?? "").replace(/\*+/g, "").trim();
    markers.push({ index: idx, pos: startPos, title });
  }

  // (b) Inline: "Setup N:" / "Setup N," / "Setup N -"
  const setupInlineRe = /\bSetup\s+([1-5])\s*[:.,\-]\s*(.{0,150})/gi;
  while ((m = setupInlineRe.exec(text)) !== null) {
    const idx = parseInt(m[1]!, 10);
    const title = (m[2] ?? "").split(/[\.\n]/)[0]!.replace(/\*+/g, "").trim();
    markers.push({ index: idx, pos: m.index, title });
  }

  // (c) Deutsche/englische Ordinalia
  const ordinalRe = /\b(erstens|zweitens|drittens|viertens|fünftens|fuenftens|first|second|third|fourth|fifth)\b\s*[:.,]?\s*(.{0,150})/gi;
  while ((m = ordinalRe.exec(text)) !== null) {
    const idx = ORDINAL_WORDS[m[1]!.toLowerCase()];
    if (!idx) continue;
    const title = (m[2] ?? "").split(/[\.\n]/)[0]!.replace(/\*+/g, "").trim();
    markers.push({ index: idx, pos: m.index, title });
  }

  if (markers.length < 2) return [];

  // Sortieren nach Position, dedupen (Marker dicht beieinander = derselbe Treffer)
  markers.sort((a, b) => a.pos - b.pos);
  const dedup: typeof markers = [];
  for (const mk of markers) {
    if (dedup.length === 0 || mk.pos - dedup[dedup.length - 1]!.pos > 20) {
      dedup.push(mk);
    }
  }
  markers.length = 0;
  markers.push(...dedup);

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
      // Begründung extrahieren: Text zwischen Setup-Titel-Ende und nächstem Setup
      const sectionText = text.substring(start, end).trim();
      // Erste Zeile (= title) entfernen, Rest ist Begründung
      const lines = sectionText.split("\n").map((l) => l.trim()).filter(Boolean);
      // Markdown-Decorations + Bullet-Marker ("·", "-") entfernen
      const description = lines
        .slice(1)
        .map((l) => l.replace(/^[·\-•*]\s*/, "").replace(/\*\*/g, "").trim())
        .filter(Boolean)
        .join(" ")
        .substring(0, 280);

      groups.push({
        index: valid[i]!.index,
        title: valid[i]!.title.substring(0, 100),
        products: productsInRange,
        description,
      });
    }
  }

  return groups;
}
