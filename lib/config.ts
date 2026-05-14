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
  // Berater: Sonnet 4.6 (Mai 2026 von Opus umgestellt, ~5x günstiger,
  // bei unserem Tool-Use-Flow keine Qualitätseinbuße).
  // Falls die Qualität nachgibt: zurück auf "claude-opus-4-7".
  modelBerater: "claude-sonnet-4-6",
  modelHintergrund: "claude-haiku-4-5-20251001",

  // Analytics (Plausible, cookie-frei, DSGVO-konform)
  plausibleDomain: "pongsmith.de",
  plausibleScript: "https://plausible.io/js/script.js",
} as const;
