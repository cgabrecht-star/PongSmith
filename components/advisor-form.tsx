"use client";

import { useEffect, useState } from "react";

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

const STYLES: { id: PlayStyle; label: string; sub: string }[] = [
  { id: "offensive_topspin", label: "Offensiv", sub: "Topspin & Tempo" },
  { id: "allround", label: "Allround", sub: "Ausgewogen" },
  { id: "defensive", label: "Defensiv", sub: "Sicher & kontrolliert" },
];

const STYLE_ICONS: Record<PlayStyle, string> = {
  offensive_topspin: "⚡",
  allround: "⚖",
  defensive: "🛡",
};

const PLAY_STYLE_LABELS: Record<string, string> = {
  offensive_topspin: "Offensiv",
  allround: "Allround",
  defensive: "Defensiv",
};

// ─── Setup Card ─────────────────────────────────────────────────────────────
function SetupCard({ setup, rank }: { setup: Setup; rank: number }) {
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
          {PLAY_STYLE_LABELS[setup.playStyleTarget] ?? setup.playStyleTarget}
        </span>
        <span className="tag-line">TTR {setup.ttrTarget}</span>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ScoreBar label="Tempo-Abstimmung" value={setup.tempoMatch} color="linear-gradient(90deg, #2563eb, #60a5fa)" />
        <ScoreBar label="Kontrollreserve" value={setup.controlReserve} color="linear-gradient(90deg, #059669, #34d399)" />
        <ScoreBar label="Spin-Potenzial" value={setup.spinPotential} color="linear-gradient(90deg, var(--ps-ember-deep), var(--ps-ember))" />
      </div>
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────
export function AdvisorForm() {
  const [ttr, setTtr] = useState(1300);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("allround");
  const [loading, setLoading] = useState(false);
  const [setups, setSetups] = useState<Setup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSetups(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttr, playStyle }),
      });
      const data = (await res.json()) as { setups?: Setup[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Unbekannter Fehler");
      } else {
        setSetups(data.setups ?? []);
      }
    } catch {
      setError("Verbindungsfehler — bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* TTR Slider */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <label className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>
              Q-TTR Spielstärke
            </label>
            <span className="ff-display" style={{ fontSize: 44, color: "var(--ps-ink-0)", lineHeight: 1 }}>{ttr}</span>
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
            <span>Nicht sicher? 1.300 ist ein guter Startpunkt.</span>
            <span>1900</span>
          </div>
        </div>

        {/* Play style */}
        <div>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)", marginBottom: 12 }}>
            Spielstil
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {STYLES.map((s) => {
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
          {loading ? "⚙ Suche läuft…" : "🔨 Setups schmieden →"}
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
          Keine Ergebnisse — versuch einen anderen Spielstil.
        </p>
      )}

      {/* Results */}
      {setups && setups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", lineHeight: 1 }}>
              Top {setups.length} für TTR {ttr}
            </div>
            <span className="tag-line">{STYLES.find((s) => s.id === playStyle)?.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {setups.map((s, i) => (
              <SetupCard key={`${s.bladeId}-${s.rubberId}`} setup={s} rank={i + 1} />
            ))}
          </div>
          <p className="ff-mono" style={{ textAlign: "center", fontSize: 9.5, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
            QUELLE: REVSPIN.NET COMMUNITY-RATINGS
          </p>
        </div>
      )}
    </div>
  );
}
