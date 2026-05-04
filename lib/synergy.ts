/**
 * Synergie-Engine: Bewertet Holz × Belag Kombinationen
 *
 * Alle Scores 0–100, rein deterministisch — keine KI, pure Mathematik.
 * Primärquelle: Community-Ratings (revspin, 1–10, echte Spieler-Erfahrung).
 * Fallback:    speedNorm/spinNorm/controlNorm (Hersteller, auf 1–10 normiert).
 * Letzter Fallback: 7.0 (Median für gut bewertete Club-Beläge).
 *
 * Zielgruppe: TTR 1000–1700 (Vereinsspieler, keine Profis)
 */

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface BladeInput {
  id: number;
  speedNorm: number | null;
  controlNorm: number | null;
  communitySpeed: number | null;
  communityControl: number | null;
}

export interface RubberInput {
  id: number;
  type?: "smooth" | "short_pips" | "long_pips" | "anti" | null;
  speedNorm: number | null;
  spinNorm: number | null;
  controlNorm: number | null;
  communitySpeed: number | null;
  communitySpin: number | null;
  communityControl: number | null;
}

export interface SynergyResult {
  bladeId: number;
  rubberId: number;
  synergyScore: number;        // Gesamtscore 0–100
  tempoMatch: number;          // Tempo-Abstimmung
  controlReserve: number;      // Kontroll-Puffer
  spinPotential: number;       // Spin-Potenzial
  weightBalance: number;       // Gewichtsbalance (neutral ohne Rohdaten)
  styleFit: number;            // Spielstil-Kohärenz
  playStyleTarget: "offensive_topspin" | "allround" | "defensive" | "material";
  ttrTarget: number;           // Optimaler TTR-Zielwert 1000–1700
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

const FALLBACK = 7.0; // Median für solide Club-Ausrüstung

/** Wert auflösen: Community → Norm → Fallback */
function resolve(community: number | null, norm: number | null): number {
  return community ?? norm ?? FALLBACK;
}

/** Gausssche Glockenkurve: Peak 100 bei target, fällt mit sigma ab */
function gaussian(value: number, target: number, sigma: number): number {
  return 100 * Math.exp(-Math.pow(value - target, 2) / (2 * sigma * sigma));
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ---------------------------------------------------------------------------
// Sub-Scores
// ---------------------------------------------------------------------------

/**
 * tempoMatch: Ist die Gesamtgeschwindigkeit für TTR 1000–1700 passend?
 *
 * combined = bladeSpeed + rubberSpeed (Bereich 2–20)
 * Peak bei 13.5 (avg 6.75 — offensiv-kontrolliert, ideal für Vereinsspieler)
 * Sigma 3.5 — breite Kurve, da Spieler verschiedene Präferenzen haben
 */
function calcTempoMatch(bladeSpeed: number, rubberSpeed: number): number {
  const combined = bladeSpeed + rubberSpeed;
  return clamp(gaussian(combined, 13.5, 3.5));
}

/**
 * controlReserve: Wie viel Kontrollreserve hat die Kombination?
 *
 * Basis: Durchschnitt beider Control-Werte (0–100 skaliert)
 * Penalty: Wenn avg Speed > 8.5 — zu schnell für kontrollierten Aufbau
 */
function calcControlReserve(
  bladeSpeed: number,
  bladeControl: number,
  rubberSpeed: number,
  rubberControl: number,
): number {
  const avgControl = (bladeControl + rubberControl) / 2;
  const avgSpeed = (bladeSpeed + rubberSpeed) / 2;
  const base = (avgControl / 10) * 100;
  const penalty = avgSpeed > 8.5 ? (avgSpeed - 8.5) * 12 : 0;
  return clamp(base - penalty);
}

/**
 * spinPotential: Spin-Erzeugungspotenzial der Kombination
 *
 * Belag dominiert (70%) — Gummi bestimmt den Spin, nicht das Holz.
 * Holz-Speed trägt bei (30%) — schnelleres Holz = mehr Energie = mehr Spin.
 */
function calcSpinPotential(bladeSpeed: number, rubberSpin: number): number {
  const raw = rubberSpin * 0.7 + bladeSpeed * 0.3;
  return clamp((raw / 10) * 100);
}

/**
 * weightBalance: Keine Gewichts-Rohdaten für die meisten Produkte → neutral 65.
 * Wird dynamisch sobald weightMin/weightMax aus anderen Quellen befüllt werden.
 */
function calcWeightBalance(): number {
  return 65;
}

/**
 * styleFit: Sind Holz und Belag eine kohärente Kombination?
 *
 * Bewertet ob beide Teile in dieselbe Richtung spielen.
 * Extreme (sehr schnelles Holz + sehr schneller Belag) → Penalty für TTR <1500.
 */
function calcStyleFit(
  bladeSpeed: number,
  rubberSpeed: number,
  rubberSpin: number,
  rubberControl: number,
): number {
  const avgSpeed = (bladeSpeed + rubberSpeed) / 2;

  // Zu aggressiv für Vereinsspieler: beide Teile über 9
  if (bladeSpeed >= 9.0 && rubberSpeed >= 9.0) return 45;

  // Offensiv-Topspin ideal: schnelles Holz + spinstarker Belag
  if (bladeSpeed >= 8.0 && rubberSpin >= 8.5) return 90;

  // Offensiv-kontrolliert: mittleres Holz + hoher Belag-Control
  if (avgSpeed >= 7.5 && avgSpeed < 9.0 && rubberControl >= 8.5) return 85;

  // Allround: langsames bis mittleres Holz + kontrollierter Belag
  if (bladeSpeed < 8.0 && rubberControl >= 8.0) return 80;

  // Defensiv-allround
  if (bladeSpeed < 7.0 && rubberControl >= 8.5) return 75;

  return 68; // Grundwert — keine ideale Synergierichtung erkennbar
}

// ---------------------------------------------------------------------------
// playStyleTarget + ttrTarget
// ---------------------------------------------------------------------------

function calcPlayStyle(
  avgSpeed: number,
  rubberType?: "smooth" | "short_pips" | "long_pips" | "anti" | null,
): "offensive_topspin" | "allround" | "defensive" | "material" {
  // Noppen und Anti immer als Material-Spieler kennzeichnen
  if (rubberType && rubberType !== "smooth") return "material";
  if (avgSpeed >= 8.5) return "offensive_topspin";
  if (avgSpeed >= 7.0) return "allround";
  return "defensive";
}

/**
 * ttrTarget: Linearer Mapping von avgSpeed → TTR
 *
 * avgSpeed 5.0 → TTR 1000  (langsam, Einsteiger)
 * avgSpeed 7.5 → TTR 1350  (Mitte: Vereins-Allrounder)
 * avgSpeed 10.0 → TTR 1700 (schnell, Fortgeschrittene)
 */
function calcTtrTarget(avgSpeed: number): number {
  const ttr = 1000 + (avgSpeed - 5.0) * 140;
  return Math.max(1000, Math.min(1700, Math.round(ttr)));
}

// ---------------------------------------------------------------------------
// Haupt-Export
// ---------------------------------------------------------------------------

export function computeSynergy(blade: BladeInput, rubber: RubberInput): SynergyResult {
  // Effektive Werte auflösen
  const bladeSpeed = resolve(blade.communitySpeed, blade.speedNorm);
  const bladeControl = resolve(blade.communityControl, blade.controlNorm);
  const rubberSpeed = resolve(rubber.communitySpeed, rubber.speedNorm);
  const rubberSpin = resolve(rubber.communitySpin, rubber.spinNorm);
  const rubberControl = resolve(rubber.communityControl, rubber.controlNorm);

  const avgSpeed = (bladeSpeed + rubberSpeed) / 2;

  // Sub-Scores
  const tempoMatch = calcTempoMatch(bladeSpeed, rubberSpeed);
  const controlReserve = calcControlReserve(bladeSpeed, bladeControl, rubberSpeed, rubberControl);
  const spinPotential = calcSpinPotential(bladeSpeed, rubberSpin);
  const weightBalance = calcWeightBalance();
  const styleFit = calcStyleFit(bladeSpeed, rubberSpeed, rubberSpin, rubberControl);

  // Gesamtscore (gewichteter Durchschnitt)
  const synergyScore = clamp(
    tempoMatch * 0.30 +
    controlReserve * 0.25 +
    spinPotential * 0.25 +
    weightBalance * 0.10 +
    styleFit * 0.10,
  );

  return {
    bladeId: blade.id,
    rubberId: rubber.id,
    synergyScore,
    tempoMatch,
    controlReserve,
    spinPotential,
    weightBalance,
    styleFit,
    playStyleTarget: calcPlayStyle(avgSpeed, rubber.type),
    ttrTarget: calcTtrTarget(avgSpeed),
  };
}
