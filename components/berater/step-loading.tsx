"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Profil analysiert…",
  "Synergie-Datenbank durchsucht…",
  "TTR-Korridor abgeglichen…",
  "Hersteller-Diversität geprüft…",
  "Empfehlungen werden begründet…",
];

export function StepLoading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-[400px] flex-col items-center justify-center gap-8"
    >
      {/* Pulsing Orb */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, var(--color-primary), transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative h-16 w-16 rounded-full bg-primary"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Rotating Status */}
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Berater arbeitet
        </p>
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-lg text-neutral-200"
        >
          {MESSAGES[idx]}
        </motion.p>
      </div>

      {/* Three Dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
