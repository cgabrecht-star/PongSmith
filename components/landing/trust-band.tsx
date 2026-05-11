"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/effects/section-header";
import { Counter } from "@/components/effects/counter";
import { Marquee } from "@/components/effects/marquee";

/**
 * Pillars-Reihenfolge: Chris's Wunsch — Hersteller-Daten auf Position 3
 * (niedrigste Gewichtung in der Engine).
 */
const pillars = [
  {
    headline: "Vereinsspieler-Erfahrungen",
    body: "Echte Spieler-Setups aus dem TTR-Korridor 1.000–1.700, anonym beigesteuert. Genau die Daten, die kein Shop hat.",
    weight: "Höchste Gewichtung",
  },
  {
    headline: "Community-Reviews",
    body: "Aggregiert aus revspin.net, Foren und Bewertungsportalen. Einzelmeinungen werden mit Vorsicht gewichtet.",
    weight: "Mittlere Gewichtung",
  },
  {
    headline: "Hersteller-Daten",
    body: "Speed-, Spin- und Control-Werte direkt aus Datenblättern — normalisiert auf einheitliche Skalen. Skelett-Ebene.",
    weight: "Niedrigste Gewichtung",
  },
];

const stats = [
  { label: "Beläge in der Datenbank", value: 600, suffix: "+" },
  { label: "Spielstile berücksichtigt", value: 4, suffix: "" },
  { label: "Marken in der Auswahl", value: 25, suffix: "+" },
];

const brands = [
  "Butterfly", "Tibhar", "Donic", "Yasaka", "Joola",
  "Andro", "Stiga", "Xiom", "Nittaku", "TSP",
  "Sauer & Tröger", "Air", "DHS", "Cornilleau", "Victas",
];

export function TrustBand() {
  return (
    <section className="border-t border-neutral-800 bg-neutral-900 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionHeader
          eyebrow="Worauf das basiert"
          headline="Empfehlungen aus echten Daten — nicht aus Marketing-Sheets."
        />

        {/* Drei Säulen mit Gewichtung */}
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.headline}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 p-8"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-primary">
                  Säule {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  {p.weight}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-neutral-50">{p.headline}</h3>
              <p className="mt-2 text-sm text-neutral-300">{p.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center rounded-lg border border-neutral-700 bg-neutral-800 p-8 text-center"
            >
              <div className="text-5xl font-bold text-primary" style={{ letterSpacing: "-0.04em" }}>
                <Counter to={s.value} duration={1.6} />
                {s.suffix}
              </div>
              <div className="mt-2 text-sm text-neutral-300">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Marken-Marquee */}
        <div className="mt-16">
          <p className="mb-4 text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
            TTR-Korridor 1000–1700+ · Marken in der Auswahl
          </p>
          <Marquee duration={45} className="py-2">
            <div className="flex items-center gap-8 px-4">
              {brands.map((b) => (
                <div key={b} className="flex items-center gap-8 whitespace-nowrap">
                  <span className="text-base text-neutral-300">{b}</span>
                  <span aria-hidden className="block h-1 w-1 rounded-full bg-neutral-700" />
                </div>
              ))}
            </div>
          </Marquee>
        </div>
      </div>
    </section>
  );
}
