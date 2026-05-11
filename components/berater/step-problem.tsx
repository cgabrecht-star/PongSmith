"use client";

import { motion } from "framer-motion";

const QUICK_PROBLEMS = [
  { icon: "🛡️", label: "Block ist instabil", message: "Mein Block ist instabil — der Ball springt mir zu oft weg oder fliegt zu lang." },
  { icon: "🎯", label: "Topspin fällt zu kurz", message: "Mein Topspin fällt zu oft ins Netz oder zu kurz auf den Tisch." },
  { icon: "🐌", label: "Zu langsam", message: "Mein Setup fühlt sich zu langsam an, ich will aber keine Rakete." },
  { icon: "💪", label: "Arm wird müde", message: "Mein Schlagarm wird beim Spielen schnell müde. Setup zu schwer oder zu hart?" },
  { icon: "🔄", label: "Von Noppen wechseln", message: "Ich spiele mit Noppen und überlege auf glatte Beläge zu wechseln." },
  { icon: "🆕", label: "Erstes Vereins-Setup", message: "Ich bin neu im Verein und brauche mein erstes vernünftiges Setup." },
];

export interface ProblemData {
  freitext: string;
  /** Wenn Quick-Pick gewählt: dessen Message ist in freitext gelandet */
  quickPicked: number | null;
}

export function StepProblem({
  data,
  onChange,
  onBack,
  onSubmit,
}: {
  data: ProblemData;
  onChange: (d: ProblemData) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  function pick(i: number) {
    onChange({ freitext: QUICK_PROBLEMS[i]!.message, quickPicked: i });
  }
  function handleType(v: string) {
    onChange({ freitext: v, quickPicked: null });
  }

  const canSubmit = data.freitext.trim().length >= 8;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-8"
    >
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-50">
          Was ist dein Problem?
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-300">
          Beschreib's mit eigenen Worten — oder wähl eine der häufigen Situationen unten.
          Je konkreter, desto besser die Empfehlung.
        </p>
      </div>

      {/* Freitext */}
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Mit eigenen Worten
        </label>
        <textarea
          value={data.freitext}
          onChange={(e) => handleType(e.target.value)}
          placeholder="z.B. Mein Block ist instabil und Topspins fallen zu oft ins Netz…"
          rows={4}
          maxLength={500}
          className="mt-3 w-full resize-none rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-base text-neutral-50 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
        />
      </div>

      {/* Trenner */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          oder eines davon
        </span>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>

      {/* Quick-Picks */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {QUICK_PROBLEMS.map((p, i) => {
          const active = data.quickPicked === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-left transition-colors duration-150 ${
                active
                  ? "border border-primary/50 bg-primary/10"
                  : "border border-neutral-700 bg-neutral-800 hover:bg-surface-hover"
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-primary" : "text-neutral-200"
                }`}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-surface-hover"
        >
          ← Zurück
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Beraten lassen <span aria-hidden>→</span>
        </button>
      </div>
    </motion.div>
  );
}
