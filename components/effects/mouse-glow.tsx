"use client";

/**
 * MouseGlow — Cursor-folgender Radial-Glow.
 *
 * Wird typischerweise im Hero als Background-Layer eingesetzt. Nutzt
 * useMotionValue + useSpring für weiches, leicht verzögertes Folgen.
 */

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MouseGlow({
  size = 480,
  intensity = 0.18,
  className = "",
}: {
  size?: number;
  intensity?: number;
  className?: string;
}) {
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const xs = useSpring(x, { stiffness: 60, damping: 20 });
  const ys = useSpring(y, { stiffness: 60, damping: 20 });
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    function onMove(e: MouseEvent) {
      const rect = (parent as HTMLElement).getBoundingClientRect();
      x.set(e.clientX - rect.left - size / 2);
      y.set(e.clientY - rect.top - size / 2);
    }
    function onLeave() {
      x.set(-9999);
      y.set(-9999);
    }

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [x, y, size]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{
        x: xs,
        y: ys,
        width: size,
        height: size,
        background: `radial-gradient(circle at center, color-mix(in srgb, var(--color-primary) ${
          intensity * 100
        }%, transparent), transparent 70%)`,
        filter: "blur(20px)",
      }}
    />
  );
}
