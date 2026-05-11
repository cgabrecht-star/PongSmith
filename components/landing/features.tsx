"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/effects/section-header";

/** Bento-Card mit Hover-Glow */
function BentoCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800 p-8 transition-colors duration-200 hover:border-neutral-600 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/** Mini-Chat-Preview für Card 1 */
function MiniChatPreview() {
  const messages = [
    { role: "ai" as const, text: "Wie würdest Du Dein Spiel beschreiben?" },
    { role: "user" as const, text: "Allround, eher kontrolliert" },
    { role: "ai" as const, text: "Was nervt Dich an Deinem aktuellen Setup?" },
    { role: "user" as const, text: "Vorhand fühlt sich tot an" },
  ];
  return (
    <div className="mt-6 flex flex-col gap-2">
      {messages.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "rounded-tr-sm bg-primary text-on-primary"
                : "rounded-tl-sm border border-neutral-700 bg-neutral-900/60 text-neutral-50"
            }`}
          >
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Animierter Stat-Balken */
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-mono uppercase tracking-widest text-neutral-400">{label}</span>
        <span className="font-mono text-neutral-200">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-900">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/** Shop-Preisvergleich für Card 3 */
function ShopCompare() {
  const offers = [
    { shop: "Tabletennis-Shop", price: "73,90 €", best: false },
    { shop: "Kontra-TT", price: "69,50 €", best: true },
    { shop: "Schöler+Micke", price: "75,00 €", best: false },
  ];
  return (
    <div className="mt-6 flex flex-col gap-2">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
        Tibhar Evolution MX-P · 2.1 mm · rot
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {offers.map((o) => (
          <div
            key={o.shop}
            className={`rounded-md border px-4 py-3 ${
              o.best
                ? "border-primary/40 bg-primary/5"
                : "border-neutral-700 bg-neutral-900/40"
            }`}
          >
            <div className="text-sm text-neutral-300">{o.shop}</div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold text-neutral-50">{o.price}</span>
              {o.best && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-on-primary">
                  günstigster
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="border-t border-neutral-800 bg-neutral-900 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionHeader
          eyebrow="Was Du bekommst"
          headline="Drei Sachen, auf die wir uns festlegen."
        />

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BentoCard className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-neutral-50">
              Echter Dialog statt Filtermaske
            </h3>
            <p className="mt-2 text-sm text-neutral-300">
              Wir fragen mit Worten — Du antwortest mit Worten. Die KI versteht, weil sie auf
              Tausenden von Spielerprofilen kalibriert ist.
            </p>
            <MiniChatPreview />
          </BentoCard>

          <BentoCard className="lg:col-span-1">
            <h3 className="text-xl font-semibold text-neutral-50">
              Datenbasiert, nicht aus dem Bauch
            </h3>
            <p className="mt-2 text-sm text-neutral-300">
              Jede Empfehlung kommt mit konkreten Specs — Speed, Spin, Kontrolle. Auf einer
              normalisierten 1–100-Skala vergleichbar.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <StatBar label="Speed" value={84} color="linear-gradient(90deg, #3b82f6, #60a5fa)" />
              <StatBar
                label="Spin"
                value={91}
                color="linear-gradient(90deg, var(--color-primary-hover), var(--color-primary))"
              />
              <StatBar label="Control" value={72} color="linear-gradient(90deg, #059669, #34d399)" />
            </div>
          </BentoCard>

          <BentoCard className="lg:col-span-3">
            <h3 className="text-xl font-semibold text-neutral-50">Unabhängig vom Shop</h3>
            <p className="mt-2 text-sm text-neutral-300">
              Wir vergleichen die Preise und schicken Dich zum günstigsten Anbieter. Kein
              Aufpreis für Dich — wir verdienen über die Affiliate-Provision der Shops.
            </p>
            <ShopCompare />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
