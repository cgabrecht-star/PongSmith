"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/effects/section-header";

const steps = [
  {
    n: "01",
    title: "Spiel beschreiben",
    text: "Spielstärke, Stil, was Dich nervt. Im Chat, mit eigenen Worten — kein Formular.",
  },
  {
    n: "02",
    title: "Empfehlungen bekommen",
    text: "2 bis 3 Setups, jeweils mit klarer Begründung. Warum dieses Holz, warum dieser Belag.",
  },
  {
    n: "03",
    title: "Beim günstigsten Shop kaufen",
    text: "Wir vergleichen die Preise und schicken Dich zum günstigsten Anbieter. Kein Aufpreis für Dich.",
  },
];

function CheckBadge() {
  return (
    <motion.span
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-6 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 8.5L6.5 12L13 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}

function Connector() {
  return (
    <div className="hidden md:flex md:items-center md:justify-center md:px-2">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-1"
        aria-hidden
      >
        <span className="block h-1 w-1 rounded-full bg-neutral-700 opacity-30" />
        <span className="block h-1 w-1 rounded-full bg-neutral-700 opacity-50" />
        <span className="block h-1 w-1 rounded-full bg-neutral-700 opacity-70" />
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path
            d="M1 6h17m0 0l-5-5m5 5l-5 5"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-neutral-800 bg-neutral-900 py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionHeader
          eyebrow="So funktioniert's"
          headline="Vom Chat zur Bestellung in drei Schritten."
        />

        {/* Grid mit Connectors auf md+ */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((s, i) => (
            <div key={s.n} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-lg border border-neutral-700 bg-neutral-800 p-8"
              >
                <CheckBadge />
                <div
                  className="text-5xl font-bold leading-none text-primary"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {s.n}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-neutral-50">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{s.text}</p>
              </motion.div>
              {i < steps.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
