"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MagneticButton } from "@/components/effects/magnetic-button";
import { DotGrid } from "@/components/effects/dot-grid";
import { MouseGlow } from "@/components/effects/mouse-glow";
import { HeroChatMockup } from "@/components/landing/hero-chat-mockup";

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll();
  const headlineY = useTransform(scrollY, [0, 600], [0, -40]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-neutral-900"
    >
      {/* Background Layers */}
      <DotGrid />
      <MouseGlow size={520} intensity={0.16} />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[60%] w-[60%]"
        style={{
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 60%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Linke Spalte */}
        <motion.div
          style={{ y: headlineY }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="eyebrow-pill">Setup-Berater</span>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
            <span className="block">Das richtige Setup.</span>
            <span className="block text-primary">Ohne Raten.</span>
            <span className="block">Ohne Verkaufsdruck.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base text-neutral-300 md:text-lg">
            Beschreib im Chat, wie Du spielst. Bekomm 2 bis 3 begründete Empfehlungen für
            Holz und Beläge, basierend auf hunderten Belag-Daten und Holz-Belag-Synergien.
            Kostenlos.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton
              href="/berater"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors duration-150 hover:bg-primary-hover"
            >
              Berater starten <span aria-hidden>→</span>
            </MagneticButton>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-300 transition-colors hover:text-neutral-50"
            >
              So funktioniert's{" "}
              <span aria-hidden className="inline-block transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
            </a>
          </div>

          <p className="mt-6 text-xs text-neutral-400">
            Kostenlos · Keine Anmeldung · Ehrlich beraten
          </p>
        </motion.div>

        {/* Rechte Spalte: Live-Chat-Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroChatMockup />
        </motion.div>
      </div>
    </section>
  );
}
