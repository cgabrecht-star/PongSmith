"use client";

/**
 * Marquee, Infinite horizontaler Scroll-Band.
 *
 * Content wird 2× nebeneinander gerendert, dann via Framer Motion
 * linear von 0% bis -50% animiert. Mask-Edges fadet die Ränder aus.
 */

import { motion } from "framer-motion";

export function Marquee({
  children,
  duration = 40,
  className = "",
}: {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
      }}
    >
      <motion.div
        className="flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
