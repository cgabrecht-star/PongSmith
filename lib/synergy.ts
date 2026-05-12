/**
 * Synergie-Engine v2, Bewertet Holz × Belag Kombinationen
 *
 * Verbesserungen gegenüber v1:
 *   - Spielstil-spezifische Gewichtungen (statt fixer 30/25/25/10/10)
 *   - Kalibrierter Gauss-Peak je Spielstil (v1 punished schnelle Setups für Offensiv-Spieler)
 *   - Härte-Sweet-Spot als eigener Sub-Score (nutzt spongeHardness-Daten aus DB)
 *   - Topsheet-Match (sticky braucht steifes Holz, griffig ist universell)
 *   - 4 stil-spezifische Scores pro Synergie (für präzise Berater-Queries)
 *
 * Alle Scores 0-100, rein deterministisch, keine KI, pure Mathematik.
 * Primärquelle: Community-Ratings (revspin.net, 1-10, echte Spieler-Erfahrung).
 * Fallback:    speedNorm/spinNorm/controlNorm (Hersteller, auf 1-10 normiert).
 * Letzter Fallback: 7.0 (Median für gut bewertete Club-Beläge).
 *
 * Zielgruppe: TTR 1000-1700 (Vereinsspieler, keine Profis)
 */

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";

export interface BladeInput {
  id: number;
  speedNorm: number | null;
  controlNorm: number | null;
  communitySpeed: number | null;
  communityControl: number | null;
  // Neu in v2: physikalische Eigenschaften
  stiffness?: "soft" | "medium" | "stiff" | "very_stiff" | null;
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
  // Neu in v2: physikalische Eigenschaften
  hardnessMin?: number | null;      // Schwammhärte min in Grad
  topsheetCharacter?: "sticky" | "grippy" | "neutral" | null;
}

export interface SynergyResult {
  bladeId: number;
  rubberId: number;

  // Haupt-Score (playStyleTarget-unabhängig, für Rückwärtskompatibilität)
  synergyScore: number;

  // Stil-spezifische Scores (v2-Neu)
  scoreOffensive: number;
  scoreAllround: number;
  scoreDefensive: number;
  scoreMaterial: number;

  // Sub-Scores (aus allround-Gewichtung)
  tempoMatch: number;
  controlReserve: number;
  spinPotential: number;
  weightBalance: number;
  styleFit: number;

  // Ziel-Spieler-Typ
  playStyleTarget: PlayStyle;
  ttrTarget: number;
}

// ---------------------------------------------------------------------------
// Gewichtungs-Profile je Spielstil
// ---------------------------------------------------------------------------

interface Weights {
  tempo: number;
  control: number;
  spin: number;
  styleFit: number;
  hardnessMatch: number;
}

const STYLE_WEIGHTS: Record<PlayStyle, Weights> = {
  offensive_topspin: {
    tempo:        0.35,
    spin:         0.30,
    control:      0.15,
    styleFit:     0.12,
    hardnessMatch: 0.08,
  },
  allround: {
    tempo:        0.25,
    spin:         0.25,
    control:      0.30,
    styleFit:     0.12,
    hardnessMatch: 0.08,
  },
  defensive: {
    tempo:        0.10,
    spin:         0.15,
    control:      0.40,
    styleFit:     0.25,
    hardnessMatch: 0.10,
  },
  material: {
    tempo:        0.10,
    spin:         0.15,
    control:      0.35,
    styleFit:     0.30,
    hardnessMatch: 0.10,
  },
};

// ---------------------------------------------------------------------------
// Gauss-Peaks je Spielstil (combined speed = bladeSpeed + rubberSpeed, Bereich 2-20)
// ---------------------------------------------------------------------------

const TEMPO_TARGETS: Record<PlayStyle, { peak: number; sigma: number }> = {
  offensive_topspin: { peak: 17.0, sigma: 2.5 }, // avg 8.5 pro Teil
  allround:          { peak: 14.0, sigma: 3.0 }, // avg 7.0 pro Teil
  defensive:         { peak: 10.5, sigma: 3.0 }, // avg 5.25 pro Teil
  material:          { peak: 10.0, sigma: 3.5 }, // Material-Setups variieren stark
};

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

const FALLBACK = 7.0;

function resolve(community: number | null, norm: number | null): number {
  return community ?? norm ?? FALLBACK;
}

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
 * tempoMatch: Stil-spezifisch kalibriert.
 * Gauss-Peak je Spielstil, offensive Spieler brauchen hohe combined speed.
 */
function calcTempoMatch(bladeSpeed: number, rubberSpeed: number, style: PlayStyle): number {
  const combined = bladeSpeed + rubberSpeed;
  const { peak, sigma } = TEMPO_TARGETS[style];
  return clamp(gaussian(combined, peak, sigma));
}

/**
 * controlReserve: Kontrollreserve der Kombination.
 * Penalty erst ab Speed > 9.5 für Offensiv-Spieler (war v1: 8.5, zu aggressiv).
 */
function calcControlReserve(
  bladeSpeed: number, bladeControl: number,
  rubberSpeed: number, rubberControl: number,
  style: PlayStyle,
): number {
  const avgControl = (bladeControl + rubberControl) / 2;
  const avgSpeed = (bladeSpeed + rubberSpeed) / 2;
  const base = (avgControl / 10) * 100;

  // Penalty-Schwelle je Stil: Offensiv-Spieler brauchen mehr Speed
  const penaltyThreshold = style === "offensive_topspin" ? 9.5
    : style === "allround" ? 8.5
    : 7.5;
  const penalty = avgSpeed > penaltyThreshold ? (avgSpeed - penaltyThreshold) * 15 : 0;

  return clamp(base - penalty);
}

/**
 * spinPotential: Unverändert zu v1, Belag dominiert 70%, Holz 30%.
 */
function calcSpinPotential(bladeSpeed: number, rubberSpin: number): number {
  const raw = rubberSpin * 0.7 + bladeSpeed * 0.3;
  return clamp((raw / 10) * 100);
}

/**
 * weightBalance: Keine Roh-Gewichtsdaten → neutral 65.
 * Bleibt bis Gewichtsdaten aus externer Quelle vorliegen.
 */
function calcWeightBalance(): number {
  return 65;
}

/**
 * hardnessMatch: Schwammhärte zum TTR-Bereich passend?
 *
 * Niedrigere TTR = weichere Schwämme (mehr Kontrolle, verzeiht Timing).
 * Höhere TTR = härtere Schwämme (mehr direktes Feedback, mehr Speed).
 *
 * Ohne Härtedaten: neutraler Wert 70 (kein Bonus, kein Malus).
 */
function calcHardnessMatch(hardnessMin: number | null, ttrTarget: number): number {
  if (hardnessMin === null) return 70; // neutral ohne Daten

  // Optimale Härte je TTR-Bereich
  const optimalHardness =
    ttrTarget >= 1600 ? 50 :
    ttrTarget >= 1400 ? 46 :
    ttrTarget >= 1200 ? 42 :
    38; // TTR < 1200: weich

  const diff = Math.abs(hardnessMin - optimalHardness);
  if (diff <= 3)  return 100; // perfekter Match
  if (diff <= 6)  return 85;
  if (diff <= 10) return 70;
  if (diff <= 15) return 55;
  return 40;
}

/**
 * styleFit: Kohärenz der Kombination, spielen Holz und Belag in dieselbe Richtung?
 * Sticky-Beläge brauchen steifes Holz (sonst kein Spin-Übertrag).
 * v2: getrennte Logik für Material-Spieler.
 */
function calcStyleFit(
  bladeSpeed: number, rubberSpeed: number,
  rubberSpin: number, rubberControl: number,
  rubberType: string | null | undefined,
  topsheetCharacter: string | null | undefined,
  bladeStiffness: string | null | undefined,
  style: PlayStyle,
): number {
  const avgSpeed = (bladeSpeed + rubberSpeed) / 2;

  // Material-Spieler: Kontrolle + niedrige combined speed = gut
  if (style === "material") {
    if (rubberType && rubberType !== "smooth") {
      // Langsames Holz + Material-Belag = ideal
      if (bladeSpeed < 7.5 && rubberControl >= 8.0) return 92;
      if (bladeSpeed < 8.5) return 78;
      return 55; // zu schnelles Holz für Material
    }
  }

  // Defensiv: Kontrolle ist alles
  if (style === "defensive") {
    if (rubberControl >= 8.5 && bladeSpeed < 7.5) return 90;
    if (rubberControl >= 8.0) return 78;
    if (bladeSpeed >= 9.0) return 45; // Offensiv-Holz passt nicht
    return 68;
  }

  // Sticky-Topsheet braucht steifes Holz
  if (topsheetCharacter === "sticky") {
    const stiffnessBonus =
      bladeStiffness === "very_stiff" ? 15 :
      bladeStiffness === "stiff" ? 8 :
      bladeStiffness === "medium" ? 0 :
      -10; // soft blade + sticky rubber = schlechter Spin-Übertrag

    if (bladeSpeed >= 8.0 && rubberSpin >= 8.5) return clamp(90 + stiffnessBonus);
    if (bladeSpeed >= 7.0) return clamp(75 + stiffnessBonus);
    return clamp(60 + stiffnessBonus);
  }

  // Offensiv: zu aggressiv für Vereinsspieler
  if (style === "offensive_topspin") {
    if (bladeSpeed >= 9.0 && rubberSpeed >= 9.0) return 55; // beide extreme = zu wild
    if (bladeSpeed >= 8.0 && rubberSpin >= 8.5) return 90;
    if (avgSpeed >= 7.5 && rubberControl >= 8.0) return 82;
    return 68;
  }

  // Allround: mittleres Holz + Control-starker Belag
  if (bladeSpeed >= 9.0 && rubberSpeed >= 9.0) return 50;
  if (avgSpeed >= 7.5 && avgSpeed < 9.0 && rubberControl >= 8.5) return 85;
  if (bladeSpeed < 8.0 && rubberControl >= 8.0) return 80;
  return 68;
}

// ---------------------------------------------------------------------------
// playStyleTarget + ttrTarget
// ---------------------------------------------------------------------------

function calcPlayStyle(
  avgSpeed: number,
  rubberType?: "smooth" | "short_pips" | "long_pips" | "anti" | null,
): PlayStyle {
  if (rubberType && rubberType !== "smooth") return "material";
  if (avgSpeed >= 8.5) return "offensive_topspin";
  if (avgSpeed >= 7.0) return "allround";
  return "defensive";
}

/**
 * ttrTarget: Linear avgSpeed → TTR (unverändert zu v1).
 * avgSpeed 5.0 → TTR 1000 | 7.5 → 1350 | 10.0 → 1700
 */
function calcTtrTarget(avgSpeed: number): number {
  const ttr = 1000 + (avgSpeed - 5.0) * 140;
  return Math.max(1000, Math.min(1700, Math.round(ttr)));
}

// ---------------------------------------------------------------------------
// Kern-Berechnung für einen Stil
// ---------------------------------------------------------------------------

function computeStyleScore(
  bladeSpeed: number, bladeControl: number,
  rubberSpeed: number, rubberSpin: number, rubberControl: number,
  hardnessMin: number | null, ttrTarget: number,
  rubberType: string | null | undefined,
  topsheetCharacter: string | null | undefined,
  bladeStiffness: string | null | undefined,
  style: PlayStyle,
): number {
  const w = STYLE_WEIGHTS[style];
  const tempo        = calcTempoMatch(bladeSpeed, rubberSpeed, style);
  const control      = calcControlReserve(bladeSpeed, bladeControl, rubberSpeed, rubberControl, style);
  const spin         = calcSpinPotential(bladeSpeed, rubberSpin);
  const styleFitVal  = calcStyleFit(bladeSpeed, rubberSpeed, rubberSpin, rubberControl, rubberType, topsheetCharacter, bladeStiffness, style);
  const hardnessVal  = calcHardnessMatch(hardnessMin, ttrTarget);

  return clamp(
    tempo        * w.tempo +
    control      * w.control +
    spin         * w.spin +
    styleFitVal  * w.styleFit +
    hardnessVal  * w.hardnessMatch,
  );
}

// ---------------------------------------------------------------------------
// Haupt-Export
// ---------------------------------------------------------------------------

export function computeSynergy(blade: BladeInput, rubber: RubberInput): SynergyResult {
  // Effektive Werte auflösen
  const bladeSpeed   = resolve(blade.communitySpeed, blade.speedNorm);
  const bladeControl = resolve(blade.communityControl, blade.controlNorm);
  const rubberSpeed  = resolve(rubber.communitySpeed, rubber.speedNorm);
  const rubberSpin   = resolve(rubber.communitySpin, rubber.spinNorm);
  const rubberControl = resolve(rubber.communityControl, rubber.controlNorm);
  const avgSpeed     = (bladeSpeed + rubberSpeed) / 2;

  const playStyleTarget = calcPlayStyle(avgSpeed, rubber.type);
  const ttrTarget       = calcTtrTarget(avgSpeed);

  // Stil-spezifische Scores (v2)
  const scoreOffensive = computeStyleScore(
    bladeSpeed, bladeControl, rubberSpeed, rubberSpin, rubberControl,
    rubber.hardnessMin ?? null, ttrTarget,
    rubber.type, rubber.topsheetCharacter, blade.stiffness,
    "offensive_topspin"
  );
  const scoreAllround = computeStyleScore(
    bladeSpeed, bladeControl, rubberSpeed, rubberSpin, rubberControl,
    rubber.hardnessMin ?? null, ttrTarget,
    rubber.type, rubber.topsheetCharacter, blade.stiffness,
    "allround"
  );
  const scoreDefensive = computeStyleScore(
    bladeSpeed, bladeControl, rubberSpeed, rubberSpin, rubberControl,
    rubber.hardnessMin ?? null, ttrTarget,
    rubber.type, rubber.topsheetCharacter, blade.stiffness,
    "defensive"
  );
  const scoreMaterial = computeStyleScore(
    bladeSpeed, bladeControl, rubberSpeed, rubberSpin, rubberControl,
    rubber.hardnessMin ?? null, ttrTarget,
    rubber.type, rubber.topsheetCharacter, blade.stiffness,
    "material"
  );

  // Haupt-Score = Score des natürlichen Spielstils der Kombination
  const synergyScore =
    playStyleTarget === "offensive_topspin" ? scoreOffensive :
    playStyleTarget === "allround"          ? scoreAllround :
    playStyleTarget === "defensive"         ? scoreDefensive :
    scoreMaterial;

  // Sub-Scores mit allround-Gewichtung für Rückwärtskompatibilität
  const tempoMatch     = calcTempoMatch(bladeSpeed, rubberSpeed, "allround");
  const controlReserve = calcControlReserve(bladeSpeed, bladeControl, rubberSpeed, rubberControl, "allround");
  const spinPotential  = calcSpinPotential(bladeSpeed, rubberSpin);
  const weightBalance  = calcWeightBalance();
  const styleFit       = calcStyleFit(bladeSpeed, rubberSpeed, rubberSpin, rubberControl, rubber.type, rubber.topsheetCharacter, blade.stiffness, playStyleTarget);

  return {
    bladeId: blade.id,
    rubberId: rubber.id,
    synergyScore,
    scoreOffensive,
    scoreAllround,
    scoreDefensive,
    scoreMaterial,
    tempoMatch,
    controlReserve,
    spinPotential,
    weightBalance,
    styleFit,
    playStyleTarget,
    ttrTarget,
  };
}
