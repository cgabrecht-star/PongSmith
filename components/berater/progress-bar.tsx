"use client";

import { motion } from "framer-motion";

const steps = [
  { id: 1, label: "Setup" },
  { id: 2, label: "Problem" },
  { id: 3, label: "Beraten" },
  { id: 4, label: "Setups" },
];

export function ProgressBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const pct = ((current - 1) / (steps.length - 1)) * 100;
  return (
    <div className="w-full">
      {/* Step-Labels */}
      <div className="mb-3 flex justify-between text-xs">
        {steps.map((s) => {
          const active = s.id === current;
          const done = s.id < current;
          return (
            <div
              key={s.id}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors duration-300 ${
                  done
                    ? "bg-primary/30 text-primary"
                    : active
                      ? "bg-primary text-on-primary"
                      : "border border-neutral-700 bg-neutral-800 text-neutral-500"
                }`}
              >
                {done ? "✓" : s.id}
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  active
                    ? "text-primary"
                    : done
                      ? "text-neutral-300"
                      : "text-neutral-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Verbindungslinie */}
      <div className="relative h-1 overflow-hidden rounded-full bg-neutral-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
