"use client";

/**
 * Counter — Number-Counter (0 → Target) mit ease-out cubic.
 * Startet beim ersten Sichtbarwerden im Viewport (oder sofort wenn trigger="mount").
 */

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function Counter({
  to,
  duration = 1.6,
  trigger = "in-view",
  format,
}: {
  to: number;
  duration?: number;
  trigger?: "in-view" | "mount";
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const shouldStart = trigger === "mount" || inView;
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    const durMs = duration * 1000;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durMs);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, inView, trigger]);

  return <span ref={ref}>{format ? format(value) : Math.round(value)}</span>;
}
