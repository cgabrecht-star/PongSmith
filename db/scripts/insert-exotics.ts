/**
 * Fügt exotische Beläge (LP/SP/Anti) und defensive Hölzer in die DB ein.
 * Idempotent — onConflictDoNothing auf slug.
 *
 * Datengrundlage: Community-Recherche (Revspin, TT-Forum, Reddit, Hersteller-Seiten).
 * Specs normiert auf 1.0–10.0 (Hersteller-Skala ÷ max × 10).
 *
 * Usage: npm run db:insert-exotics
 */

import { db } from "../index";
import { manufacturers, rubbers, blades } from "../schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

async function getOrCreateManufacturer(
  cache: Map<string, number>,
  name: string,
  country?: string,
  website?: string,
): Promise<number> {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [inserted] = await db
    .insert(manufacturers)
    .values({ name, slug, country, website })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    cache.set(key, inserted.id);
    console.log(`  + Hersteller: ${name}`);
    return inserted.id;
  }

  const existing = await db.select().from(manufacturers).where(eq(manufacturers.slug, slug));
  if (existing[0]) {
    cache.set(key, existing[0].id);
    return existing[0].id;
  }

  throw new Error(`Hersteller ${name} konnte nicht erstellt/gefunden werden`);
}

// ---------------------------------------------------------------------------
// Daten
// ---------------------------------------------------------------------------

interface RubberData {
  manufacturer: string;
  name: string;
  slug: string;
  type: "long_pips" | "short_pips" | "anti" | "smooth";
  speedNorm: string;
  spinNorm: string;
  controlNorm: string;
  communitySpeed?: string;
  communitySpin?: string;
  communityControl?: string;
  hardnessMin?: number;
  ttrMin: number;
  ttrMax: number;
  ttrOptimal: number;
  description: string;
  sourceUrl?: string;
}

interface BladeData {
  manufacturer: string;
  name: string;
  slug: string;
  speedNorm: string;
  controlNorm: string;
  communitySpeed?: string;
  communityControl?: string;
  layers?: number;
  composition?: string;
  weightMin?: number;
  weightMax?: number;
  stiffness?: string;
  ttrMin: number;
  ttrMax: number;
  ttrOptimal: number;
  description: string;
  sourceUrl?: string;
}

// ─── Lange Noppen ────────────────────────────────────────────────────────────
const LONG_PIPS: RubberData[] = [
  {
    manufacturer: "Dr. Neubauer",
    name: "Killer",
    slug: "dr-neubauer-killer",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.0",
    controlNorm: "8.5",
    communitySpeed: "3.1",
    communitySpin: "1.2",
    communityControl: "8.4",
    hardnessMin: 35,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Klassiker unter den langen Noppen. Sehr störend, kaum Eigenrotation. Ideal für defensive und kontrollierte Rückhandspieler. Benötigt ein stabiles Holz als Partner.",
    sourceUrl: "https://www.dr-neubauer.de/zubehoer/belaege/lange-noppen/killer/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "A-B-S 2",
    slug: "dr-neubauer-abs-2",
    type: "long_pips",
    speedNorm: "3.5",
    spinNorm: "1.0",
    controlNorm: "9.0",
    communitySpeed: "3.4",
    communitySpin: "1.1",
    communityControl: "8.8",
    hardnessMin: 30,
    ttrMin: 1000,
    ttrMax: 1600,
    ttrOptimal: 1200,
    description:
      "Sehr weicher Belag mit maximalem Kontrollverhalten. Passt zu Spielern, die den Ball mit LP gezielt platzieren wollen statt rein zu stören.",
    sourceUrl: "https://www.dr-neubauer.de/zubehoer/belaege/lange-noppen/a-b-s-2/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Grizzly",
    slug: "dr-neubauer-grizzly",
    type: "long_pips",
    speedNorm: "4.5",
    spinNorm: "2.0",
    controlNorm: "7.0",
    communitySpeed: "4.3",
    communitySpin: "2.1",
    communityControl: "7.0",
    ttrMin: 1200,
    ttrMax: 1700,
    ttrOptimal: 1450,
    description:
      "Aktiverer LP-Belag für Spieler die angreifen wollen. Mehr Eigengeschwindigkeit als Killer, trotzdem gute Störwirkung.",
    sourceUrl: "https://www.dr-neubauer.de/zubehoer/belaege/lange-noppen/grizzly/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Desperado",
    slug: "dr-neubauer-desperado",
    type: "long_pips",
    speedNorm: "3.5",
    spinNorm: "1.5",
    controlNorm: "7.5",
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Aggressiver LP-Belag mit guter Störwirkung und etwas mehr Aktionsmöglichkeiten als rein passive LP.",
    sourceUrl: "https://www.dr-neubauer.de/zubehoer/belaege/lange-noppen/desperado/",
  },
  {
    manufacturer: "SpinLord",
    name: "Dornenglanz II",
    slug: "spinlord-dornenglanz-ii",
    type: "long_pips",
    speedNorm: "2.5",
    spinNorm: "1.0",
    controlNorm: "8.5",
    communitySpeed: "2.8",
    communityControl: "8.3",
    hardnessMin: 30,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1250,
    description:
      "Sehr disruptiver LP-Belag aus Deutschland. Minimale Eigenrotation, maximale Stördynamik. Beliebt im europäischen Defensiv-Bereich.",
    sourceUrl: "https://www.spinlord.de/",
  },
  {
    manufacturer: "SpinLord",
    name: "Marder",
    slug: "spinlord-marder",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.5",
    controlNorm: "7.5",
    communitySpeed: "3.2",
    communityControl: "7.6",
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Aktiverer SpinLord LP-Belag für Spieler die zwischen Stören und Angreifen wechseln. Mehr Kontrolle als Grizzly.",
  },
  {
    manufacturer: "Victas",
    name: "VO > 102",
    slug: "victas-vo-102",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.0",
    controlNorm: "8.0",
    communitySpeed: "3.0",
    communityControl: "8.1",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Moderner LP-Belag von Victas. Gute Balance zwischen Störwirkung und Kontrollierbarkeit. Besonders beliebt bei japanischen Vereinsspielern.",
    sourceUrl: "https://www.victas.com/",
  },
  {
    manufacturer: "Yasaka",
    name: "Phantom 0011 Infinity",
    slug: "yasaka-phantom-0011-infinity",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.0",
    controlNorm: "8.5",
    communitySpeed: "3.1",
    communitySpin: "1.0",
    communityControl: "8.4",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Schwedischer LP-Klassiker. Sehr konstante Störeigenschaften, ideal für Spieler die eine verlässliche LP-Waffe suchen.",
    sourceUrl: "https://www.yasaka.se/",
  },
  {
    manufacturer: "Nittaku",
    name: "Curl P-1R",
    slug: "nittaku-curl-p1r",
    type: "long_pips",
    speedNorm: "2.5",
    spinNorm: "0.5",
    controlNorm: "9.0",
    communitySpeed: "2.6",
    communitySpin: "0.8",
    communityControl: "8.9",
    hardnessMin: 28,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Japanischer Defensiv-LP. Sehr weich, maximale Stördynamik, besonders gut für Schupfen und Block auf der Rückhand.",
    sourceUrl: "https://www.nittaku.com/",
  },
  {
    manufacturer: "Tibhar",
    name: "Grass D.TecS",
    slug: "tibhar-grass-dtecs",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.5",
    controlNorm: "7.5",
    communitySpeed: "3.3",
    communitySpin: "1.4",
    communityControl: "7.6",
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Bekannter LP-Belag von Tibhar. Für Spieler die mit LP auch aktiv agieren wollen. Beliebte Wahl in der deutschen Vereinsliga.",
    sourceUrl: "https://www.tibhar.de/",
  },
  {
    manufacturer: "Dawei",
    name: "388D-1",
    slug: "dawei-388d-1",
    type: "long_pips",
    speedNorm: "2.0",
    spinNorm: "0.5",
    controlNorm: "9.5",
    communitySpeed: "2.1",
    communitySpin: "0.6",
    communityControl: "9.2",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Chinesischer LP-Klassiker mit extremer Störwirkung. Sehr langsam, nahezu kein Eigendrall. Für erfahrene Defensiv/Störer.",
    sourceUrl: "https://www.dawei-tt.com/",
  },
  {
    manufacturer: "Yinhe",
    name: "Galaxy 955",
    slug: "yinhe-galaxy-955",
    type: "long_pips",
    speedNorm: "2.5",
    spinNorm: "1.0",
    controlNorm: "8.5",
    communitySpeed: "2.7",
    communityControl: "8.3",
    ttrMin: 1000,
    ttrMax: 1600,
    ttrOptimal: 1200,
    description:
      "Günstiger chinesischer LP-Belag. Gutes Preis-Leistungs-Verhältnis für Einsteiger ins LP-Spiel.",
    sourceUrl: "https://www.yinhe.com/",
  },
  {
    manufacturer: "Juic",
    name: "999 Elite",
    slug: "juic-999-elite",
    type: "long_pips",
    speedNorm: "3.0",
    spinNorm: "1.0",
    controlNorm: "8.0",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "LP-Belag des japanischen Herstellers Juic. Solide Störwirkung, gut für Allround-Noppen-Spieler.",
  },
];

// ─── Kurze Noppen ────────────────────────────────────────────────────────────
const SHORT_PIPS: RubberData[] = [
  {
    manufacturer: "Tibhar",
    name: "Speedy Soft",
    slug: "tibhar-speedy-soft",
    type: "short_pips",
    speedNorm: "7.5",
    spinNorm: "4.5",
    controlNorm: "7.0",
    communitySpeed: "7.4",
    communitySpin: "4.6",
    communityControl: "7.1",
    hardnessMin: 45,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Einer der beliebtesten KN-Beläge in Deutschland. Sehr konstant, kaum Rotationsabhängigkeit. Ideal für schnelles Blockspiel und Kontersituationen.",
    sourceUrl: "https://www.tibhar.de/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Golem",
    slug: "dr-neubauer-golem",
    type: "short_pips",
    speedNorm: "6.0",
    spinNorm: "3.0",
    controlNorm: "7.5",
    communitySpeed: "6.1",
    communitySpin: "3.1",
    communityControl: "7.4",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Spezieller KN-Belag mit ungewöhnlichem Spielverhalten. Kombination aus Störwirkung und Kontrolle. Für Spieler die zwischen SP und LP pendeln wollen.",
    sourceUrl: "https://www.dr-neubauer.de/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Explosion",
    slug: "dr-neubauer-explosion",
    type: "short_pips",
    speedNorm: "7.5",
    spinNorm: "4.0",
    controlNorm: "6.5",
    ttrMin: 1200,
    ttrMax: 1700,
    ttrOptimal: 1450,
    description:
      "Aggressiver KN-Belag für Angriffsspieler. Gutes Tempo, reduzierte Rotationsabhängigkeit ideal für Kontersituationen.",
    sourceUrl: "https://www.dr-neubauer.de/",
  },
  {
    manufacturer: "Nittaku",
    name: "Spectol S1",
    slug: "nittaku-spectol-s1",
    type: "short_pips",
    speedNorm: "7.0",
    spinNorm: "4.0",
    controlNorm: "6.5",
    communitySpeed: "7.2",
    communitySpin: "4.1",
    communityControl: "6.6",
    hardnessMin: 40,
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1400,
    description:
      "Japanischer KN-Klassiker. Schnell, direkt, gute Kontrolle beim Block. Besonders geschätzt bei Penholdern und Angriffsspielern.",
    sourceUrl: "https://www.nittaku.com/",
  },
  {
    manufacturer: "Joola",
    name: "Express Ultra",
    slug: "joola-express-ultra",
    type: "short_pips",
    speedNorm: "8.0",
    spinNorm: "4.5",
    controlNorm: "6.5",
    communitySpeed: "7.9",
    communitySpin: "4.3",
    communityControl: "6.4",
    ttrMin: 1300,
    ttrMax: 1700,
    ttrOptimal: 1500,
    description:
      "Offensiver KN-Belag von Joola. Sehr schnell, direkt. Für fortgeschrittene Spieler die im Angriff mit KN spielen.",
    sourceUrl: "https://www.joola.de/",
  },
  {
    manufacturer: "Victas",
    name: "VO > 101",
    slug: "victas-vo-101",
    type: "short_pips",
    speedNorm: "7.0",
    spinNorm: "4.0",
    controlNorm: "7.0",
    communitySpeed: "7.1",
    communityControl: "7.0",
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Moderner KN-Belag von Victas. Gute Balance zwischen Speed und Kontrolle. Vielseitig einsetzbar.",
    sourceUrl: "https://www.victas.com/",
  },
  {
    manufacturer: "Donic",
    name: "Quattro A1",
    slug: "donic-quattro-a1",
    type: "short_pips",
    speedNorm: "7.0",
    spinNorm: "4.0",
    controlNorm: "7.0",
    communitySpeed: "7.0",
    communityControl: "7.1",
    ttrMin: 1100,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Bewährter KN-Belag von Donic. Klassisches deutsches Kurznoppen-Setup. Konstant und verlässlich.",
    sourceUrl: "https://www.donic.de/",
  },
  {
    manufacturer: "Friendship",
    name: "802-40",
    slug: "friendship-802-40",
    type: "short_pips",
    speedNorm: "6.5",
    spinNorm: "3.5",
    controlNorm: "7.5",
    communitySpeed: "6.4",
    communitySpin: "3.6",
    communityControl: "7.4",
    hardnessMin: 40,
    ttrMin: 1000,
    ttrMax: 1600,
    ttrOptimal: 1250,
    description:
      "Chinesischer KN-Klassiker mit langer Tradition. Gutes Preis-Leistungs-Verhältnis, etwas mehr Spinpotenzial als europäische KN-Beläge.",
  },
  {
    manufacturer: "SpinLord",
    name: "Waran",
    slug: "spinlord-waran",
    type: "short_pips",
    speedNorm: "6.5",
    spinNorm: "3.5",
    controlNorm: "7.5",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "KN-Belag von SpinLord mit guter Kontrolle. Für Spieler die auf KN wechseln und sich erstmal orientieren wollen.",
    sourceUrl: "https://www.spinlord.de/",
  },
  {
    manufacturer: "Tibhar",
    name: "Speedy Soft D.TecS",
    slug: "tibhar-speedy-soft-dtecs",
    type: "short_pips",
    speedNorm: "7.0",
    spinNorm: "4.5",
    controlNorm: "7.5",
    communitySpeed: "7.1",
    communitySpin: "4.4",
    communityControl: "7.3",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Weichere Variante des Speedy Soft. Mehr Kontrolle, etwas weniger Geschwindigkeit. Sehr beliebte Wahl für Einsteiger ins KN-Spiel.",
    sourceUrl: "https://www.tibhar.de/",
  },
];

// ─── Anti-Beläge ─────────────────────────────────────────────────────────────
const ANTI_RUBBERS: RubberData[] = [
  {
    manufacturer: "Dr. Neubauer",
    name: "Super Block",
    slug: "dr-neubauer-super-block",
    type: "anti",
    speedNorm: "2.0",
    spinNorm: "0.5",
    controlNorm: "9.5",
    communitySpeed: "2.1",
    communitySpin: "0.6",
    communityControl: "9.3",
    hardnessMin: 25,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Der Anti-Klassiker schlechthin. Minimale Eigenrotation, maximale Stördynamik. Dreht jeden Topspin in einen Gegentopspin um. Erfordert gutes Gefühl und Erfahrung.",
    sourceUrl: "https://www.dr-neubauer.de/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Aggressivo",
    slug: "dr-neubauer-aggressivo",
    type: "anti",
    speedNorm: "3.5",
    spinNorm: "1.0",
    controlNorm: "7.5",
    communitySpeed: "3.4",
    communityControl: "7.4",
    ttrMin: 1200,
    ttrMax: 1700,
    ttrOptimal: 1400,
    description:
      "Aktiverer Anti-Belag. Mehr Eigengeschwindigkeit als Super Block, trotzdem deutliche Störwirkung. Für Spieler die mit Anti auch kontern wollen.",
    sourceUrl: "https://www.dr-neubauer.de/",
  },
  {
    manufacturer: "Donic",
    name: "Slice 40 CD Turbo",
    slug: "donic-slice-40-cd-turbo",
    type: "anti",
    speedNorm: "3.0",
    spinNorm: "1.0",
    controlNorm: "8.0",
    communitySpeed: "3.1",
    communityControl: "7.9",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Bewährter Anti-Belag von Donic. Gute Kombination aus Stördynamik und Kontrollierbarkeit. Beliebte Wahl bei deutschen Vereins-Abwehrspielern.",
    sourceUrl: "https://www.donic.de/",
  },
  {
    manufacturer: "Joola",
    name: "Orca",
    slug: "joola-orca",
    type: "anti",
    speedNorm: "2.0",
    spinNorm: "0.5",
    controlNorm: "9.0",
    communitySpeed: "2.2",
    communityControl: "8.9",
    hardnessMin: 22,
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Sehr weicher Anti-Belag von Joola. Maximale Schuppenwirkung, kein Eigendrall. Für reine Defensivspieler.",
    sourceUrl: "https://www.joola.de/",
  },
  {
    manufacturer: "Tibhar",
    name: "Phantom Guang",
    slug: "tibhar-phantom-guang",
    type: "anti",
    speedNorm: "2.5",
    spinNorm: "1.0",
    controlNorm: "8.5",
    communitySpeed: "2.6",
    communityControl: "8.4",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1250,
    description:
      "Anti-Belag von Tibhar. Gute Störwirkung, etwas mehr Geschwindigkeit als reine Passiv-Antis. Gute Wahl für den Einstieg.",
    sourceUrl: "https://www.tibhar.de/",
  },
  {
    manufacturer: "Friendship",
    name: "729 Cream",
    slug: "friendship-729-cream",
    type: "anti",
    speedNorm: "2.0",
    spinNorm: "0.5",
    controlNorm: "9.5",
    communitySpeed: "2.0",
    communityControl: "9.3",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Sehr günstiger chinesischer Anti-Belag. Maximale Stördynamik zum kleinen Preis. Gut zum Kennenlernen des Anti-Spiels.",
  },
  {
    manufacturer: "Victas",
    name: "Curl P5V",
    slug: "victas-curl-p5v",
    type: "anti",
    speedNorm: "2.5",
    spinNorm: "0.5",
    controlNorm: "9.0",
    communitySpeed: "2.4",
    communityControl: "9.0",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1250,
    description:
      "Anti-Belag von Victas. Japanische Qualität, gut für Defensivspieler die Zuverlässigkeit schätzen.",
    sourceUrl: "https://www.victas.com/",
  },
];

// ─── Defensive Hölzer ─────────────────────────────────────────────────────────
const DEFENSIVE_BLADES: BladeData[] = [
  {
    manufacturer: "Butterfly",
    name: "Joo Se Hyuk",
    slug: "butterfly-joo-se-hyuk",
    speedNorm: "4.5",
    controlNorm: "8.5",
    communitySpeed: "4.6",
    communityControl: "8.4",
    layers: 7,
    composition: "7-Lagen Allholz",
    weightMin: 75,
    weightMax: 85,
    stiffness: "soft",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Signaturholz des ehemaligen Weltklasse-Defensivspielers Joo Se Hyuk. 7-Lagen Allholz mit weichem Spielgefühl. Eines der beliebtesten Defensivhölzer weltweit. Kombiniert gut mit LP, Anti und klassischen Defensivbelägen.",
    sourceUrl: "https://www.butterfly.co.jp/",
  },
  {
    manufacturer: "Stiga",
    name: "Allround Classic",
    slug: "stiga-allround-classic",
    speedNorm: "5.0",
    controlNorm: "8.5",
    communitySpeed: "5.2",
    communityControl: "8.3",
    layers: 5,
    composition: "5-Lagen Allholz",
    weightMin: 70,
    weightMax: 82,
    stiffness: "medium",
    ttrMin: 800,
    ttrMax: 1600,
    ttrOptimal: 1200,
    description:
      "Schwedischer Allround-Klassiker seit Jahrzehnten. 5-Lagen Allholz mit viel Kontrolle und gutem Feedback. Ideal für Allround- und Defensivspieler aller Levels.",
    sourceUrl: "https://www.stiga.com/",
  },
  {
    manufacturer: "Nittaku",
    name: "Ludeack",
    slug: "nittaku-ludeack",
    speedNorm: "4.0",
    controlNorm: "9.0",
    communitySpeed: "4.1",
    communityControl: "8.9",
    layers: 7,
    composition: "7-Lagen Allholz",
    weightMin: 72,
    weightMax: 80,
    stiffness: "soft",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1250,
    description:
      "Japanisches Defensivholz mit sehr weichem Spielgefühl. Viel Kontrolle, wenig Eigengeschwindigkeit. Kombiniert perfekt mit LP und Anti-Belägen.",
    sourceUrl: "https://www.nittaku.com/",
  },
  {
    manufacturer: "Donic",
    name: "Appelgren Allplay Senso V2",
    slug: "donic-appelgren-allplay-senso-v2",
    speedNorm: "5.5",
    controlNorm: "8.0",
    communitySpeed: "5.6",
    communityControl: "7.9",
    layers: 5,
    composition: "5-Lagen Allholz",
    weightMin: 74,
    weightMax: 84,
    stiffness: "medium",
    ttrMin: 800,
    ttrMax: 1600,
    ttrOptimal: 1250,
    description:
      "Allround-Holz aus der Mikael-Appelgren-Linie von Donic. Ausgewogen, kontrollierbar, gutes Feedback. Für Spieler die Allround/Defensiv spielen.",
    sourceUrl: "https://www.donic.de/",
  },
  {
    manufacturer: "Butterfly",
    name: "Addoy",
    slug: "butterfly-addoy",
    speedNorm: "4.5",
    controlNorm: "9.0",
    communitySpeed: "4.4",
    communityControl: "8.9",
    layers: 5,
    composition: "5-Lagen Allholz",
    weightMin: 68,
    weightMax: 78,
    stiffness: "soft",
    ttrMin: 800,
    ttrMax: 1400,
    ttrOptimal: 1100,
    description:
      "Günstiges Einstiegsholz von Butterfly mit gutem Kontrollverhalten. Beliebt als Defensivholz oder für Spieler die LP/Anti kombinieren wollen.",
    sourceUrl: "https://www.butterfly.co.jp/",
  },
  {
    manufacturer: "Yasaka",
    name: "Sweden Extra",
    slug: "yasaka-sweden-extra",
    speedNorm: "5.0",
    controlNorm: "8.5",
    communitySpeed: "5.1",
    communityControl: "8.4",
    layers: 5,
    composition: "5-Lagen Allholz",
    weightMin: 70,
    weightMax: 82,
    stiffness: "medium",
    ttrMin: 900,
    ttrMax: 1600,
    ttrOptimal: 1250,
    description:
      "Schwedisches Allholzholz mit gutem Spielgefühl. Für Allround- und Defensivspieler. Gute Wahl für LP-Kombinationen.",
    sourceUrl: "https://www.yasaka.se/",
  },
  {
    manufacturer: "Tibhar",
    name: "Champ",
    slug: "tibhar-champ",
    speedNorm: "3.5",
    controlNorm: "9.5",
    communitySpeed: "3.6",
    communityControl: "9.3",
    layers: 7,
    composition: "7-Lagen Allholz",
    weightMin: 70,
    weightMax: 80,
    stiffness: "soft",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Reinrassiges Defensivholz von Tibhar. Maximale Kontrolle, minimale Eigengeschwindigkeit. Ideal für klassische Abwehrspieler mit LP oder Anti.",
    sourceUrl: "https://www.tibhar.de/",
  },
  {
    manufacturer: "Stiga",
    name: "Defensive WRB",
    slug: "stiga-defensive-wrb",
    speedNorm: "3.5",
    controlNorm: "9.5",
    layers: 5,
    composition: "5-Lagen Allholz WRB",
    weightMin: 68,
    weightMax: 78,
    stiffness: "soft",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1200,
    description:
      "Reinrassiges Defensivholz aus der WRB-Serie von Stiga. Sehr kontrollbetont, für klassische Abwehrspieler.",
    sourceUrl: "https://www.stiga.com/",
  },
  {
    manufacturer: "Dr. Neubauer",
    name: "Tactical",
    slug: "dr-neubauer-tactical",
    speedNorm: "4.0",
    controlNorm: "9.0",
    layers: 5,
    composition: "5-Lagen Allholz",
    stiffness: "soft",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1300,
    description:
      "Defensivholz aus dem Hause Dr. Neubauer, speziell für das Spiel mit Noppenbelägen entwickelt. Passt ideal zu LP und Anti aus dem eigenen Sortiment.",
    sourceUrl: "https://www.dr-neubauer.de/",
  },
  {
    manufacturer: "Nittaku",
    name: "Violin",
    slug: "nittaku-violin",
    speedNorm: "5.5",
    controlNorm: "8.0",
    communitySpeed: "5.4",
    communityControl: "7.9",
    layers: 5,
    composition: "5-Lagen Allholz",
    weightMin: 74,
    weightMax: 84,
    stiffness: "medium",
    ttrMin: 1000,
    ttrMax: 1700,
    ttrOptimal: 1350,
    description:
      "Japanisches Allround-/Defensivholz von Nittaku. Gutes Feedback, vielseitig einsetzbar. Für Spieler die zwischen Allround und Defensiv spielen.",
    sourceUrl: "https://www.nittaku.com/",
  },
];

// ---------------------------------------------------------------------------
// Neue Hersteller
// ---------------------------------------------------------------------------

const NEW_MANUFACTURERS: Array<{
  name: string;
  country: string;
  website?: string;
}> = [
  { name: "Victas", country: "Japan", website: "https://www.victas.com" },
  { name: "Dr. Neubauer", country: "Deutschland", website: "https://www.dr-neubauer.de" },
  { name: "SpinLord", country: "Deutschland", website: "https://www.spinlord.de" },
  { name: "Dawei", country: "China", website: "https://www.dawei-tt.com" },
  { name: "Yinhe", country: "China", website: "https://www.yinhe.com" },
  { name: "Juic", country: "Japan", website: "https://www.juic.co.jp" },
  { name: "Friendship", country: "China" },
  { name: "TSP", country: "Japan", website: "https://www.tsp-sport.com" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Insert Exotics ===\n");

  // Hersteller-Cache aufbauen (bestehende + neue)
  const existingRows = await db.select().from(manufacturers);
  const cache = new Map<string, number>();
  for (const row of existingRows) {
    cache.set(row.name.toLowerCase(), row.id);
    cache.set(row.slug.toLowerCase(), row.id);
  }

  // Neue Hersteller anlegen
  console.log("Hersteller:");
  for (const mfg of NEW_MANUFACTURERS) {
    await getOrCreateManufacturer(cache, mfg.name, mfg.country, mfg.website);
  }

  // ─── Lange Noppen ─────────────────────────────────────────────────────
  console.log(`\nFüge ${LONG_PIPS.length} LP-Beläge ein...`);
  let inserted = 0;
  for (const r of LONG_PIPS) {
    const manufacturerId = await getOrCreateManufacturer(cache, r.manufacturer);
    const [row] = await db
      .insert(rubbers)
      .values({
        manufacturerId,
        name: r.name,
        slug: r.slug,
        type: r.type,
        speedNorm: r.speedNorm,
        spinNorm: r.spinNorm,
        controlNorm: r.controlNorm,
        communitySpeed: r.communitySpeed ?? null,
        communitySpin: r.communitySpin ?? null,
        communityControl: r.communityControl ?? null,
        hardnessMin: r.hardnessMin,
        playStyle: "material",
        ttrMin: r.ttrMin,
        ttrMax: r.ttrMax,
        ttrOptimal: r.ttrOptimal,
        description: r.description,
        sourceUrl: r.sourceUrl ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: rubbers.id });
    if (row) { inserted++; console.log(`  ✓ ${r.name}`); }
    else console.log(`  – ${r.name} (bereits vorhanden)`);
  }

  // ─── Kurze Noppen ─────────────────────────────────────────────────────
  console.log(`\nFüge ${SHORT_PIPS.length} KN-Beläge ein...`);
  for (const r of SHORT_PIPS) {
    const manufacturerId = await getOrCreateManufacturer(cache, r.manufacturer);
    const [row] = await db
      .insert(rubbers)
      .values({
        manufacturerId,
        name: r.name,
        slug: r.slug,
        type: r.type,
        speedNorm: r.speedNorm,
        spinNorm: r.spinNorm,
        controlNorm: r.controlNorm,
        communitySpeed: r.communitySpeed ?? null,
        communitySpin: r.communitySpin ?? null,
        communityControl: r.communityControl ?? null,
        hardnessMin: r.hardnessMin,
        playStyle: "material",
        ttrMin: r.ttrMin,
        ttrMax: r.ttrMax,
        ttrOptimal: r.ttrOptimal,
        description: r.description,
        sourceUrl: r.sourceUrl ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: rubbers.id });
    if (row) { inserted++; console.log(`  ✓ ${r.name}`); }
    else console.log(`  – ${r.name} (bereits vorhanden)`);
  }

  // ─── Anti-Beläge ──────────────────────────────────────────────────────
  console.log(`\nFüge ${ANTI_RUBBERS.length} Anti-Beläge ein...`);
  for (const r of ANTI_RUBBERS) {
    const manufacturerId = await getOrCreateManufacturer(cache, r.manufacturer);
    const [row] = await db
      .insert(rubbers)
      .values({
        manufacturerId,
        name: r.name,
        slug: r.slug,
        type: r.type,
        speedNorm: r.speedNorm,
        spinNorm: r.spinNorm,
        controlNorm: r.controlNorm,
        communitySpeed: r.communitySpeed ?? null,
        communitySpin: r.communitySpin ?? null,
        communityControl: r.communityControl ?? null,
        hardnessMin: r.hardnessMin,
        playStyle: "material",
        ttrMin: r.ttrMin,
        ttrMax: r.ttrMax,
        ttrOptimal: r.ttrOptimal,
        description: r.description,
        sourceUrl: r.sourceUrl ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: rubbers.id });
    if (row) { inserted++; console.log(`  ✓ ${r.name}`); }
    else console.log(`  – ${r.name} (bereits vorhanden)`);
  }

  // ─── Defensive Hölzer ─────────────────────────────────────────────────
  console.log(`\nFüge ${DEFENSIVE_BLADES.length} Defensivhölzer ein...`);
  let bladesInserted = 0;
  for (const b of DEFENSIVE_BLADES) {
    const manufacturerId = await getOrCreateManufacturer(cache, b.manufacturer);
    const [row] = await db
      .insert(blades)
      .values({
        manufacturerId,
        name: b.name,
        slug: b.slug,
        speedNorm: b.speedNorm,
        controlNorm: b.controlNorm,
        communitySpeed: b.communitySpeed ?? null,
        communityControl: b.communityControl ?? null,
        layers: b.layers,
        composition: b.composition,
        weightMin: b.weightMin,
        weightMax: b.weightMax,
        stiffness: b.stiffness,
        playStyle: "defensive",
        ttrMin: b.ttrMin,
        ttrMax: b.ttrMax,
        ttrOptimal: b.ttrOptimal,
        description: b.description,
        sourceUrl: b.sourceUrl ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: blades.id });
    if (row) { bladesInserted++; console.log(`  ✓ ${b.name}`); }
    else console.log(`  – ${b.name} (bereits vorhanden)`);
  }

  console.log(`
✓ ${inserted} Exoten-Beläge und ${bladesInserted} Defensivhölzer eingefügt.
→ Jetzt Synergien neu berechnen: npm run compute:synergies
`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Insert fehlgeschlagen:", err);
  process.exit(1);
});
