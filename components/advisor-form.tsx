"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-400";
  return "bg-zinc-400";
}

function playStyleLabel(style: string) {
  const map: Record<string, string> = {
    offensive_topspin: "Offensiv-Topspin",
    allround: "Allround",
    defensive: "Defensiv",
  };
  return map[style] ?? style;
}

// ---------------------------------------------------------------------------
// Sub-Komponenten
// ---------------------------------------------------------------------------

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span className="font-medium text-zinc-700">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div
          className={`h-1.5 rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SetupCard({ setup, rank }: { setup: Setup; rank: number }) {
  const rankColors = ["bg-amber-400 text-amber-900", "bg-zinc-200 text-zinc-700", "bg-orange-100 text-orange-800"];
  const rankColor = rankColors[rank - 1] ?? "bg-zinc-100 text-zinc-600";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankColor}`}>
            {rank}
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Holz</div>
            <div className="font-semibold text-zinc-900">{setup.bladeName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-900">{setup.synergyScore}</div>
          <div className="text-xs text-zinc-400">/ 100</div>
        </div>
      </div>

      {/* Belag */}
      <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Belag (VH & RH)</div>
        <div className="mt-0.5 font-medium text-zinc-800">{setup.rubberName}</div>
      </div>

      {/* Sub-Scores */}
      <div className="space-y-2">
        <ScoreBar label="Tempo-Abstimmung" value={setup.tempoMatch} />
        <ScoreBar label="Kontrollreserve" value={setup.controlReserve} />
        <ScoreBar label="Spin-Potenzial" value={setup.spinPotential} />
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {playStyleLabel(setup.playStyleTarget)}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          TTR {setup.ttrTarget}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spielstil-Auswahl
// ---------------------------------------------------------------------------

const STYLES: { id: PlayStyle; label: string; sub: string; icon: string }[] = [
  {
    id: "offensive_topspin",
    label: "Offensiv",
    sub: "Topspin, viel Tempo",
    icon: "⚡",
  },
  {
    id: "allround",
    label: "Allround",
    sub: "Ausgewogen, sicher",
    icon: "⚖️",
  },
  {
    id: "defensive",
    label: "Defensiv",
    sub: "Kontrolle, Sicherheit",
    icon: "🛡️",
  },
];

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

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
      const data = await res.json() as { setups?: Setup[]; error?: string };
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
    <div className="w-full max-w-2xl space-y-8">
      {/* Formular */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TTR */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label className="font-semibold text-zinc-900">Dein Q-TTR</label>
            <span className="text-2xl font-bold text-zinc-900">{ttr}</span>
          </div>
          <input
            type="range"
            min={800}
            max={1900}
            step={10}
            value={ttr}
            onChange={(e) => setTtr(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>800</span>
            <span className="text-zinc-500">Nicht sicher? Lass es bei 1300.</span>
            <span>1900</span>
          </div>
        </div>

        {/* Spielstil */}
        <div className="space-y-3">
          <label className="font-semibold text-zinc-900">Dein Spielstil</label>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPlayStyle(s.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                  playStyle === s.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className={`font-semibold ${playStyle === s.id ? "text-orange-700" : "text-zinc-800"}`}>
                  {s.label}
                </span>
                <span className="text-xs text-zinc-500">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Berechne…" : "Setup finden"}
        </button>
      </form>

      {/* Fehler */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ergebnisse */}
      {setups && setups.length === 0 && (
        <p className="text-center text-zinc-500">
          Keine Treffer für diese Kombination — versuch einen anderen Spielstil.
        </p>
      )}

      {setups && setups.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-zinc-900">
            Top {setups.length} Empfehlungen für TTR {ttr} · {STYLES.find((s) => s.id === playStyle)?.label}
          </h2>
          {setups.map((setup, i) => (
            <SetupCard key={`${setup.bladeId}-${setup.rubberId}`} setup={setup} rank={i + 1} />
          ))}
          <p className="text-center text-xs text-zinc-400">
            Daten: revspin.net Community-Ratings · Scores berechnet von PongSmith
          </p>
        </div>
      )}
    </div>
  );
}
