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

function scoreBar(value: number, color: string) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

const STYLES: { id: PlayStyle; icon: string; label: string; sub: string }[] = [
  { id: "offensive_topspin", icon: "⚡", label: "Offensiv", sub: "Topspin & Tempo" },
  { id: "allround", icon: "⚖️", label: "Allround", sub: "Ausgewogen" },
  { id: "defensive", icon: "🛡️", label: "Defensiv", sub: "Sicher & kontrolliert" },
];

const PLAY_STYLE_LABELS: Record<string, string> = {
  offensive_topspin: "Offensiv",
  allround: "Allround",
  defensive: "Defensiv",
};

// ---------------------------------------------------------------------------
// Setup-Karte
// ---------------------------------------------------------------------------

function SetupCard({ setup, rank }: { setup: Setup; rank: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Rank-Streifen */}
      <div
        className={`h-1 w-full ${rank === 1 ? "bg-amber-400" : rank === 2 ? "bg-zinc-300" : "bg-orange-200"}`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                rank === 1
                  ? "bg-amber-100 text-amber-700"
                  : rank === 2
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-orange-50 text-orange-600"
              }`}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Holz</div>
              <div className="truncate font-semibold text-zinc-900">{setup.bladeName}</div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-black text-zinc-900">{setup.synergyScore}</div>
            <div className="text-[10px] font-medium text-zinc-400">/ 100</div>
          </div>
        </div>

        {/* Belag */}
        <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Belag (VH &amp; RH)
          </div>
          <div className="mt-0.5 font-medium text-zinc-800">{setup.rubberName}</div>
        </div>

        {/* Sub-Scores */}
        <div className="space-y-2.5">
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Tempo-Abstimmung</span>
              <span className="font-semibold text-zinc-700">{setup.tempoMatch}</span>
            </div>
            {scoreBar(setup.tempoMatch, "bg-blue-400")}
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Kontrollreserve</span>
              <span className="font-semibold text-zinc-700">{setup.controlReserve}</span>
            </div>
            {scoreBar(setup.controlReserve, "bg-emerald-400")}
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Spin-Potenzial</span>
              <span className="font-semibold text-zinc-700">{setup.spinPotential}</span>
            </div>
            {scoreBar(setup.spinPotential, "bg-orange-400")}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {PLAY_STYLE_LABELS[setup.playStyleTarget] ?? setup.playStyleTarget}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            TTR {setup.ttrTarget}
          </span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TTR */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label className="font-semibold text-zinc-900">Q-TTR</label>
            <span className="text-3xl font-black tabular-nums text-zinc-900">{ttr}</span>
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
            <span>Nicht sicher? 1300 ist ein guter Startpunkt.</span>
            <span>1900</span>
          </div>
        </div>

        {/* Spielstil */}
        <div className="space-y-2">
          <label className="font-semibold text-zinc-900">Spielstil</label>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPlayStyle(s.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                  playStyle === s.id
                    ? "border-orange-500 bg-orange-50 shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className="text-xl">{s.icon}</span>
                <span
                  className={`text-sm font-semibold ${playStyle === s.id ? "text-orange-700" : "text-zinc-700"}`}
                >
                  {s.label}
                </span>
                <span className="text-xs text-zinc-400">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white shadow transition hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Suche läuft…" : "Setups finden →"}
        </button>
      </form>

      {/* Fehler */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Keine Ergebnisse */}
      {setups?.length === 0 && (
        <p className="text-center text-sm text-zinc-500">
          Keine Ergebnisse — versuch einen anderen Spielstil.
        </p>
      )}

      {/* Ergebnisse */}
      {setups && setups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-zinc-900">
              Top {setups.length} für TTR {ttr}
            </h3>
            <span className="text-xs text-zinc-400">
              {STYLES.find((s) => s.id === playStyle)?.label}
            </span>
          </div>
          {setups.map((s, i) => (
            <SetupCard key={`${s.bladeId}-${s.rubberId}`} setup={s} rank={i + 1} />
          ))}
          <p className="text-center text-xs text-zinc-400">
            Quelle: revspin.net Community-Ratings
          </p>
        </div>
      )}
    </div>
  );
}
