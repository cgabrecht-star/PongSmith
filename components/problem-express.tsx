"use client";

/**
 * Problem-Express
 *
 * Ersatz für den alten Schnell-Check (Filterformular).
 * 6 Buttons mit typischen Spieler-Problemen, Klick auf einen Button
 * scrollt zum Berater und schickt die Problem-Beschreibung direkt als
 * erste User-Nachricht. Berater fragt dann selbst nach TTR + Spielstil.
 *
 * Vorteile gegenüber Filterformular:
 * - Verstärkt den Berater statt mit ihm zu konkurrieren
 * - Bedient User die schnell wollen, ohne den USP "KI-Dialog" zu untergraben
 * - Jeder Klick = qualifizierter Berater-Lead
 */

import { useLanguage } from "@/lib/language-context";

export function ProblemExpress() {
  const { t } = useLanguage();
  const problems = t.check.problems;

  function handleClick(message: string) {
    if (typeof window === "undefined") return;
    // Pre-Fill + Auto-Send an Berater-Chat
    window.dispatchEvent(new CustomEvent("pongsmith:send-direct", {
      detail: { message },
    }));
    // Hochscrollen zum Berater
    const el = document.getElementById("berater-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {problems.map((p, i) => (
          <button
            key={i}
            onClick={() => handleClick(p.message)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 18px",
              background: "var(--ps-bg-2)",
              border: "1px solid var(--ps-line)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--ps-ink-0)",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "all 160ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,107,53,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--ps-bg-2)";
              e.currentTarget.style.borderColor = "var(--ps-line)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: 26, flexShrink: 0 }}>{p.icon}</span>
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>
              {p.label}
            </span>
            <span style={{ color: "var(--ps-ember-2)", fontSize: 16, flexShrink: 0 }}>→</span>
          </button>
        ))}
      </div>
      <p
        className="ff-mono"
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "var(--ps-ink-3)",
          letterSpacing: "0.06em",
          marginTop: 4,
        }}
      >
        {t.check.hint}
      </p>
    </div>
  );
}
