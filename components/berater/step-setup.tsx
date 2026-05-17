"use client";

import { motion } from "framer-motion";
import {
  ProductAutocomplete,
  type ProductOption,
} from "@/components/berater/product-autocomplete";

export type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";
export type Hand = "right" | "left";

export interface SetupData {
  ttr: number;
  spielstil: PlayStyle;
  hand: Hand;
  blade: ProductOption | null;
  rubberVh: ProductOption | null;
  rubberRh: ProductOption | null;
  rhSameAsVh: boolean;
}

const styles: { id: PlayStyle; label: string }[] = [
  { id: "offensive_topspin", label: "Offensiv" },
  { id: "allround", label: "Allround" },
  { id: "defensive", label: "Defensiv" },
  { id: "material", label: "Material" },
];

export function StepSetup({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: SetupData;
  onChange: (d: SetupData) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const u = <K extends keyof SetupData>(k: K, v: SetupData[K]) =>
    onChange({ ...data, [k]: v });

  const canNext =
    data.spielstil != null &&
    data.blade != null &&
    data.rubberVh != null &&
    (data.rhSameAsVh || data.rubberRh != null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-50">
          Dein aktuelles Setup
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-300">
          Diese Daten machen die Beratung präzise. Werden anonym gespeichert, kein Name,
          keine IP. Du hilfst damit, die Empfehlungen für andere Spieler genauer zu machen.
        </p>
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-neutral-300">
          <span className="font-semibold text-primary">So funktioniert's:</span>{" "}
          Du beschreibst Setup und Problem, der Berater empfiehlt. Wenn ihm Info
          fehlt, fragt er nach — du kannst direkt antworten. Je ehrlicher und
          konkreter du bist, desto besser trifft die Empfehlung.
        </div>
      </div>

      {/* TTR-Slider */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
        <div className="flex items-baseline justify-between">
          <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Q-TTR / LPZ
          </label>
          <span className="text-3xl font-semibold text-primary" style={{ letterSpacing: "-0.02em" }}>
            {data.ttr.toLocaleString("de-DE")}
          </span>
        </div>
        <input
          type="range"
          min={800}
          max={2200}
          step={10}
          value={data.ttr}
          onChange={(e) => u("ttr", Number(e.target.value))}
          className="mt-4 w-full cursor-pointer"
          style={{ accentColor: "var(--color-primary)" }}
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-neutral-500">
          <span>800</span>
          <span>2200</span>
        </div>
      </div>

      {/* Spielstil */}
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Spielstil
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {styles.map((s) => {
            const active = data.spielstil === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => u("spielstil", s.id)}
                className={`rounded-md px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "border border-primary/50 bg-primary/10 text-primary"
                    : "border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-surface-hover"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hand */}
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Schlaghand
        </label>
        <div className="mt-3 flex gap-2">
          {(["right", "left"] as Hand[]).map((h) => {
            const active = data.hand === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => u("hand", h)}
                className={`rounded-md px-6 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "border border-primary/50 bg-primary/10 text-primary"
                    : "border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-surface-hover"
                }`}
              >
                {h === "right" ? "Rechtshand" : "Linkshand"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Holz */}
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Holz
        </label>
        <div className="mt-3">
          <ProductAutocomplete
            type="blade"
            value={data.blade}
            onChange={(v) => u("blade", v)}
            placeholder="z.B. Stiga Allround…"
          />
        </div>
      </div>

      {/* Belag VH */}
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Belag Vorhand
        </label>
        <div className="mt-3">
          <ProductAutocomplete
            type="rubber"
            value={data.rubberVh}
            onChange={(v) => u("rubberVh", v)}
            placeholder="z.B. Donic Bluefire…"
          />
        </div>
      </div>

      {/* Belag RH */}
      <div>
        <div className="flex items-baseline justify-between">
          <label className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Belag Rückhand
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={data.rhSameAsVh}
              onChange={(e) => u("rhSameAsVh", e.target.checked)}
              style={{ accentColor: "var(--color-primary)" }}
            />
            gleicher Belag wie VH
          </label>
        </div>
        {!data.rhSameAsVh && (
          <div className="mt-3">
            <ProductAutocomplete
              type="rubber"
              value={data.rubberRh}
              onChange={(v) => u("rubberRh", v)}
              placeholder="z.B. Donic Bluefire…"
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-300 hover:underline"
        >
          Überspringen, direkt zum Problem
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Weiter <span aria-hidden>→</span>
        </button>
      </div>
    </motion.div>
  );
}
