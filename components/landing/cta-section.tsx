"use client";

import { motion } from "framer-motion";
import { MagneticButton } from "@/components/effects/magnetic-button";
import { DotGrid } from "@/components/effects/dot-grid";

export function CtaSection() {
  return (
    <section id="cta" className="border-t border-neutral-800 bg-neutral-900 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800 px-8 py-16 text-center md:px-16 md:py-24"
        >
          {/* Background-Layer */}
          <DotGrid />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-[80%] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse at center top, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[60%] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent 60%)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative">
            <span className="eyebrow-pill">Kostenlos & unabhängig</span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              Kostet nichts. Für immer.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-neutral-300">
              PongSmith finanziert sich über Affiliate-Provisionen der Shops, bei denen Du am
              Ende kaufst. Für Dich entsteht{" "}
              <strong className="text-neutral-50">kein Aufpreis</strong>. Kein Abo, keine
              Werbung, kein Verkauf eigener Produkte. Genau deshalb können wir ehrlich beraten.
            </p>
            <div className="mt-10 flex justify-center">
              <MagneticButton
                href="/berater"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-base font-medium text-on-primary shadow-xl shadow-primary/30 transition-colors duration-150 hover:bg-primary-hover"
              >
                Berater starten <span aria-hidden>→</span>
              </MagneticButton>
            </div>
            <p className="mt-6 text-xs text-neutral-400">
              Keine Anmeldung · Keine Datenweitergabe · Du behältst die Kontrolle
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
