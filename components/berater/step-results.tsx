"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

interface ShopLink {
  id: string;
  name: string;
  url: string;
}

interface DetectedProduct {
  type: "blade" | "rubber";
  id: number;
  name: string;
  manufacturer: string;
  slug?: string | null;
  imageUrl?: string | null;
  reviewCount?: number;
  shops: ShopLink[];
}

export interface SetupGroupResult {
  index: number;
  title: string;
  description?: string;
  synergyScore?: number | null;
  products: DetectedProduct[];
}

export interface BeraterResult {
  text: string;
  setups: SetupGroupResult[];
}

/** Synergie-Score-Ring */
function SynergyRing({ value }: { value: number }) {
  const size = 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-neutral-700)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-neutral-50" style={{ letterSpacing: "-0.02em" }}>
          {value}
        </span>
        <span className="font-mono text-[8px] text-neutral-400">/100</span>
      </div>
    </div>
  );
}

/** Mini-Bild oder Initial-Fallback */
function MiniImg({ url, manufacturer }: { url?: string | null; manufacturer: string }) {
  const [errored, setErrored] = useState(false);
  const initial = manufacturer.charAt(0).toUpperCase();
  if (!url || errored) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-primary/10 font-mono text-base font-semibold text-primary">
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={manufacturer}
      onError={() => setErrored(true)}
      className="h-9 w-9 shrink-0 rounded-md border border-neutral-700 object-cover"
    />
  );
}

function ComponentRow({ product, label }: { product: DetectedProduct; label: string }) {
  const detailHref = product.slug
    ? product.type === "blade"
      ? `/holz/${product.slug}`
      : `/belag/${product.slug}`
    : null;
  const inner = (
    <>
      <MiniImg url={product.imageUrl} manufacturer={product.manufacturer} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
          {label}
        </div>
        <div className="text-sm font-semibold text-neutral-50">{product.name}</div>
        {(product.reviewCount ?? 0) > 0 && (
          <div className="text-[10px] text-neutral-400">★ {product.reviewCount} Reviews</div>
        )}
      </div>
      {detailHref && <span className="shrink-0 text-primary">→</span>}
    </>
  );

  if (detailHref) {
    return (
      <Link
        href={detailHref}
        target="_blank"
        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-hover"
      >
        {inner}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 p-2">{inner}</div>;
}

function SetupCard({ setup, rank }: { setup: SetupGroupResult; rank: number }) {
  const blade = setup.products.find((p) => p.type === "blade");
  const rubbers = setup.products.filter((p) => p.type === "rubber");
  const primaryShop = setup.products.find((p) => p.shops.length > 0)?.shops[0];

  const openAllInTabs = () => {
    setup.products.forEach((p, i) => {
      if (p.shops.length === 0) return;
      setTimeout(() => {
        window.open(p.shops[0]!.url, "_blank", "noopener");
      }, i * 150);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800"
    >
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-neutral-700 p-6">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">
            Setup {String(setup.index).padStart(2, "0")}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-neutral-50">{setup.title}</h3>
          {setup.description && setup.description.length > 10 && (
            <p className="mt-2 text-sm italic text-neutral-300">{setup.description}</p>
          )}
        </div>
        {setup.synergyScore != null && <SynergyRing value={setup.synergyScore} />}
      </div>

      {/* Komponenten */}
      <div className="flex flex-col gap-1 p-4">
        {blade && <ComponentRow product={blade} label="Holz" />}
        {rubbers.map((r, i) => (
          <ComponentRow
            key={`${r.id}-${i}`}
            product={r}
            label={rubbers.length === 1 ? "Belag" : i === 0 ? "VH" : "RH"}
          />
        ))}
      </div>

      {/* Buy-Buttons */}
      <div className="border-t border-neutral-700 p-4">
        {primaryShop ? (
          <button
            type="button"
            onClick={openAllInTabs}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors duration-150 hover:bg-primary-hover"
          >
            Setup bei {primaryShop.name} holen <span aria-hidden>→</span>
          </button>
        ) : (
          <div className="rounded-md border border-dashed border-neutral-700 px-4 py-3 text-center text-sm text-neutral-400">
            Shop folgt
          </div>
        )}
        <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          Werbung · Du zahlst nichts mehr · 30 Tage Bedenkzeit
        </p>
      </div>
    </motion.div>
  );
}

export function StepResults({ result, onRestart }: { result: BeraterResult; onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8"
    >
      <div>
        <span className="eyebrow-pill">Deine Empfehlungen</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50">
          {result.setups.length > 0
            ? `${result.setups.length} Setup${result.setups.length === 1 ? "" : "s"} für dich`
            : "Berater-Antwort"}
        </h2>
      </div>

      {/* Begründungstext vom Berater */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
          KI-Berater
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
          {result.text}
        </div>
      </div>

      {/* Setup-Karten */}
      {result.setups.length > 0 && (
        <div className="flex flex-col gap-4">
          {result.setups.map((setup, i) => (
            <SetupCard key={setup.index} setup={setup} rank={i} />
          ))}
        </div>
      )}

      {/* Restart-Button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onRestart}
          className="text-sm text-neutral-400 underline-offset-2 transition-colors hover:text-neutral-200 hover:underline"
        >
          ↺ Nochmal von vorne — anderes Profil testen
        </button>
      </div>
    </motion.div>
  );
}
