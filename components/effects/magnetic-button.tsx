"use client";

/**
 * MagneticButton — CTA, der den Cursor leicht anzieht.
 *
 * Funktioniert sowohl als <a href> als auch als <button>.
 */

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CommonProps = {
  children: React.ReactNode;
  strength?: number;
  className?: string;
};

type AsLink = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type AsButton = CommonProps & {
  href?: never;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type Props = AsLink | AsButton;

export function MagneticButton(props: Props) {
  const { children, strength = 0.3, className = "" } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 200, damping: 18 });
  const ys = useSpring(y, { stiffness: 200, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  const inner = (
    <motion.span
      style={{ x: xs, y: ys, display: "inline-flex" }}
      className={className}
    >
      {children}
    </motion.span>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ display: "inline-block" }}
      >
        <Link href={props.href}>{inner}</Link>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: "inline-block" }}
    >
      <button
        type={(props as AsButton).type ?? "button"}
        onClick={(props as AsButton).onClick}
        disabled={(props as AsButton).disabled}
        style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
      >
        {inner}
      </button>
    </div>
  );
}
