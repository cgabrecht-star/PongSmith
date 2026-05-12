// Zentrale Konfiguration, keine Magic Numbers im Code

export const config = {
  // Site
  siteUrl: "https://pongsmith.de",
  siteName: "PongSmith",
  siteTagline: "Die Tischtennis-Schmiede",
  siteDescription:
    "Unabhängige KI-gestützte Tischtennis-Ausrüstungsberatung für deutsche Vereinsspieler. Finde das Schläger-Setup, das zu deinem TTR und Spielstil passt.",

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

  // Analytics (Plausible, cookie-frei, DSGVO-konform)
  plausibleDomain: "pongsmith.de",
  plausibleScript: "https://plausible.io/js/script.js",
} as const;
