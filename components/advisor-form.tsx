"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";

type PlayStyle = "offensive_topspin" | "allround" | "defensive";

interface Setup {
  synergyScore: number;
  tempoMatch: number;
  controlReserve: number;
  spinPotential: number;
  ttrTarget: number;
  playStyleTarget: string;
  bladeId: number;
  bladeName: string;
  rubberId: number;
  rubberName: string;
}

// ─── Synergy Ring (mini) ───────────────────────────────────────────────────
function MiniRing({ value }: { value: number }) {
  const size = 76;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const dur = 700;
    const step = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const off = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg className="ring-svg" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ps-bg-4)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ringGrad2)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ringGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8c5a" />
            <stop offset="100%" stopColor="#c84a1e" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div className="ff-display" style={{ fontSize: 22, lineHeight: 1, color: "var(--ps-ink-0)" }}>{shown}</div>
        <div className="ff-mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--ps-ink-3)" }}>/100</div>
      </div>
    </div>
  );
}

// ─── Sub-score bar ─────────────────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>{label}</span>
        <span className="ff-mono" style={{ fontSize: 10, color: "var(--ps-ink-1)" }}>{value}</span>
      </div>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

const STYLE_ICONS: Record<PlayStyle, string> = {
  offensive_topspin: "⚡",
  allround: "⚖",
  defensive: "🛡",
};

// ─── Setup Card ─────────────────────────────────────────────────────────────
function SetupCard({ setup, rank }: { setup: Setup; rank: number }) {
  const { t } = useLanguage();
  const styleLabel: Record<string, string> = {
    offensive_topspin: t.check.styleOffensive,
    allround: t.check.styleAllround,
    defensive: t.check.styleDefensive,
    material: t.sortiment.styleMaterial,
  };
  return (
    <div
      className="card-forged"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 200ms, transform 200ms",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ps-line)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Rank accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: rank === 1
          ? "linear-gradient(90deg, transparent, var(--ps-ember), transparent)"
          : "linear-gradient(90deg, transparent, var(--ps-line), transparent)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginTop: 4 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase" }}>
            SETUP · 0{rank}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-ink-0)", marginTop: 4, lineHeight: 1.3 }}>
            {setup.bladeName}
          </div>
          <div style={{ fontSize: 11, color: "var(--ps-ink-3)", marginTop: 4 }}>
            {setup.rubberName}
          </div>
        </div>
        <MiniRing value={setup.synergyScore} />
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span className="tag-line tag-ember">
          {styleLabel[setup.playStyleTarget] ?? setup.playStyleTarget}
        </span>
        <span className="tag-line">TTR {setup.ttrTarget}</span>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ScoreBar label={t.check.tempoMatch} value={setup.tempoMatch} color="linear-gradient(90deg, #2563eb, #60a5fa)" />
        <ScoreBar label={t.check.controlReserve} value={setup.controlReserve} color="linear-gradient(90deg, #059669, #34d399)" />
        <ScoreBar label={t.check.spinPotential} value={setup.spinPotential} color="linear-gradient(90deg, var(--ps-ember-deep), var(--ps-ember))" />
      </div>
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────
export function AdvisorForm() {
  const { t, lang } = useLanguage();
  const [ttr, setTtr] = useState(1300);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("allround");
  const [loading, setLoading] = useState(false);
  const [setups, setSetups] = useState<Setup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Spielstil-Optionen aus Übersetzung
  const styles: { id: PlayStyle; label: string; sub: string }[] = [
    { id: "offensive_topspin", label: t.check.styleOffensive, sub: t.check.styleOffensiveSub },
    { id: "allround", label: t.check.styleAllround, sub: t.check.styleAllroundSub },
    { id: "defensive", label: t.check.styleDefensive, sub: t.check.styleDefensiveSub },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSetups(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttr, playStyle, lang }),
      });
      const data = (await res.json()) as { setups?: Setup[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? (lang === "de" ? "Unbekannter Fehler" : "Unknown error"));
      } else {
        setSetups(data.setups ?? []);
      }
    } catch {
      setError(lang === "de" ? "Verbindungsfehler, bitte erneut versuchen." : "Connection error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  // TTR-Hint mit Komma im DE und Punkt im EN bekommt der Wert
  const formatTtr = (v: number) => lang === "de" ? v.toLocaleString("de-DE") : v.toLocaleString("en-US");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* TTR Slider */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <label className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>
              {t.check.ttrLabel}
            </label>
            <span className="ff-display" style={{ fontSize: 44, color: "var(--ps-ink-0)", lineHeight: 1 }}>{formatTtr(ttr)}</span>
          </div>
          <input
            type="range"
            min={800}
            max={1900}
            step={10}
            value={ttr}
            onChange={(e) => setTtr(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--ps-ember)", cursor: "pointer" }}
          />
          <div className="ff-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ps-ink-4)", marginTop: 6, letterSpacing: "0.1em" }}>
            <span>800</span>
            <span>{t.check.ttrHint}</span>
            <span>1900</span>
          </div>
        </div>

        {/* Play style */}
        <div>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)", marginBottom: 12 }}>
            {t.check.styleLabel}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {styles.map((s) => {
              const active = playStyle === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPlayStyle(s.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "16px 12px", borderRadius: 4, cursor: "pointer",
                    background: active ? "rgba(255,107,53,0.08)" : "var(--ps-bg-2)",
                    border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
                    color: active ? "var(--ps-ember-2)" : "var(--ps-ink-2)",
                    transition: "all 160ms",
                    fontFamily: "inherit",
                    boxShadow: active ? "0 0 16px rgba(255,107,53,0.15)" : "none",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{STYLE_ICONS[s.id]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--ps-ember-2)" : "var(--ps-ink-0)" }}>
                    {s.label}
                  </span>
                  <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.08em", color: "var(--ps-ink-3)", textAlign: "center" }}>{s.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="ember-btn ember-btn-glow"
          style={{ width: "100%", padding: "16px", fontSize: 15, justifyContent: "center" }}
        >
          {loading
            ? (lang === "de" ? "⚙ Suche läuft…" : "⚙ Searching…")
            : (lang === "de" ? "🔨 Setups schmieden →" : "🔨 Forge setups →")}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{
          borderRadius: 4, border: "1px solid rgba(217,106,90,0.4)",
          background: "rgba(217,106,90,0.08)", padding: "12px 16px",
          fontSize: 13, color: "var(--ps-bad)",
        }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {setups?.length === 0 && (
        <p className="ff-mono" style={{ textAlign: "center", fontSize: 11, color: "var(--ps-ink-3)", letterSpacing: "0.08em" }}>
          {lang === "de"
            ? "Keine Ergebnisse, versuch einen anderen Spielstil."
            : "No results, try a different play style."}
        </p>
      )}

      {/* Results */}
      {setups && setups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", lineHeight: 1 }}>
              {lang === "de"
                ? `Top ${setups.length} für TTR ${formatTtr(ttr)}`
                : `Top ${setups.length} for TTR ${formatTtr(ttr)}`}
            </div>
            <span className="tag-line">{styles.find((s) => s.id === playStyle)?.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {setups.map((s, i) => (
              <SetupCard key={`${s.bladeId}-${s.rubberId}`} setup={s} rank={i + 1} />
            ))}
          </div>
          <p className="ff-mono" style={{ textAlign: "center", fontSize: 9.5, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
            {t.sortiment.sourceNote}
          </p>

          {/* Bridge zum Berater, Hauptzweck der Schnell-Check-Sektion */}
          <BridgeToAdvisor ttr={ttr} playStyle={playStyle} styleLabel={styles.find((s) => s.id === playStyle)?.label ?? playStyle} />
        </div>
      )}
    </div>
  );
}

// ─── Bridge: vom Schnell-Check zum Berater ────────────────────────────────
function BridgeToAdvisor({ ttr, playStyle, styleLabel }: { ttr: number; playStyle: PlayStyle; styleLabel: string }) {
  const { t, lang } = useLanguage();

  function handleClick() {
    // 1. Pre-Fill-Event an Berater-Chat
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pongsmith:prefill", {
        detail: { ttr, playStyle, styleLabel, lang },
      }));
      // 2. Scrollen
      const el = document.getElementById("berater-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "20px 22px",
        borderRadius: 4,
        background: "linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,107,53,0.03))",
        border: "1px solid rgba(255,107,53,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        textAlign: "center",
      }}
    >
      <div className="ff-display" style={{ fontSize: 22, color: "var(--ps-ink-0)", lineHeight: 1.2 }}>
        {t.check.bridgeTitle}
      </div>
      <p style={{ margin: 0, color: "var(--ps-ink-2)", fontSize: 14.5, lineHeight: 1.55, maxWidth: 560, alignSelf: "center" }}>
        {t.check.bridgeText}
      </p>
      <button
        onClick={handleClick}
        className="ember-btn ember-btn-glow"
        style={{
          alignSelf: "center",
          padding: "12px 22px",
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        🔨 {t.check.bridgeCta} →
      </button>
    </div>
  );
}
