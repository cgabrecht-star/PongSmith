"use client";

import { motion } from "framer-motion";

export function EyebrowPill({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow-pill">{children}</span>;
}

/**
 * Section-Header — Eyebrow + Headline mit Scroll-Reveal-Animation.
 */
export function SectionHeader({
  eyebrow,
  headline,
  subline,
  align = "center",
}: {
  eyebrow: string;
  headline: string;
  subline?: string;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`mx-auto max-w-2xl ${isCenter ? "text-center" : "text-left"}`}
    >
      <EyebrowPill>{eyebrow}</EyebrowPill>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50">
        {headline}
      </h2>
      {subline && (
        <p className="mt-3 text-base text-neutral-300">{subline}</p>
      )}
    </motion.div>
  );
}
