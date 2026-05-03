// Zentrale Konfiguration — keine Magic Numbers im Code

export const config = {
  // Q-TTR-Bereich für Empfehlungen
  ttrMin: 800,
  ttrMax: 2800,
  ttrTargetMin: 1000,
  ttrTargetMax: 1700,

  // Empfehlungs-Engine
  maxEmpfehlungen: 3,
  synergyScoreMin: 0,
  synergyScoreMax: 100,

  // KI-Modelle
  modelBerater: "claude-opus-4-7",
  modelHintergrund: "claude-haiku-4-5-20251001",
} as const;
