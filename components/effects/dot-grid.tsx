/**
 * DotGrid, dezentes Punkt-Raster als Background-Layer.
 * Wird im Hero und auf CTA-Cards eingesetzt.
 */

export function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, var(--color-neutral-700) 1px, transparent 0)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
      }}
    />
  );
}
