"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

/**
 * Rendert Berater-Text mit minimalem Markdown-Support.
 * - **fett** → <strong>
 * - Em-Dashes/En-Dashes werden entfernt (zu "Sales-Sprech")
 * - Bullet-Marker (·, -, *) am Zeilenanfang werden zu echten Listen
 */
function renderBeraterText(raw: string): React.ReactNode {
  // Zeile-für-Zeile, Em/En-Dashes raus
  const cleaned = raw
    .replace(/[--]/g, "")          // Em-/En-Dash entfernen
    .replace(/\s{2,}/g, " ")        // Mehrfach-Leerzeichen normalisieren
    .replace(/\*\*\*/g, "**");      // Tripple-Sterne defensiv

  const lines = cleaned.split("\n");

  return lines.map((rawLine, lineIdx) => {
    const line = rawLine.trim();
    if (!line) return <div key={lineIdx} className="h-3" />;

    // **bold** Inline-Parser
    const parts: React.ReactNode[] = [];
    const re = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push(
        <strong key={k++} className="font-semibold text-neutral-50">
          {m[1]}
        </strong>,
      );
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    if (parts.length === 0) parts.push(line);

    return (
      <p key={lineIdx} className="mb-2 last:mb-0">
        {parts}
      </p>
    );
  });
}

interface ShopLink {
  id: string;
  name: string;
  url: string;
  /** Hat dieser Shop einen aktiven Affiliate-Vertrag mit uns? */
  affiliateActive: boolean;
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

function ShopPill({ shop }: { shop: ShopLink }) {
  return (
    <a
      href={shop.url}
      target="_blank"
      rel={shop.affiliateActive ? "sponsored noopener" : "noopener"}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        shop.affiliateActive
          ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/15"
          : "border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-surface-hover"
      }`}
      title={shop.affiliateActive ? "Affiliate-Partner (Werbung)" : "Externer Shop-Link"}
    >
      {shop.name} <span aria-hidden>→</span>
    </a>
  );
}

function ComponentRow({ product, label }: { product: DetectedProduct; label: string }) {
  const detailHref = product.slug
    ? product.type === "blade"
      ? `/holz/${product.slug}`
      : `/belag/${product.slug}`
    : null;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-700/50 bg-neutral-900/40 p-3">
      <div className="flex items-center gap-3">
        <MiniImg url={product.imageUrl} manufacturer={product.manufacturer} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            {label}
          </div>
          <div className="text-sm font-semibold text-neutral-50">{product.name}</div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px]">
            <span className="text-neutral-500">{product.manufacturer}</span>
            {(product.reviewCount ?? 0) > 0 && (
              <span className="text-neutral-400">★ {product.reviewCount}</span>
            )}
            {detailHref && (
              <Link
                href={detailHref}
                target="_blank"
                className="text-neutral-400 underline-offset-2 transition-colors hover:text-primary hover:underline"
              >
                Specs ↗
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Shop-Liste */}
      {product.shops.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-12">
          {product.shops.map((s) => (
            <ShopPill key={s.id} shop={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SetupCard({ setup, rank }: { setup: SetupGroupResult; rank: number }) {
  const blade = setup.products.find((p) => p.type === "blade");
  const rubbers = setup.products.filter((p) => p.type === "rubber");
  const totalShops = new Set(
    setup.products.flatMap((p) => p.shops.map((s) => s.id)),
  ).size;
  const hasAffiliate = setup.products.some((p) =>
    p.shops.some((s) => s.affiliateActive),
  );

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

      {/* Hinweis: pro Produkt selber Shop wählen */}
      <div className="border-b border-neutral-700 bg-neutral-900/30 px-6 py-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          🛒 Pro Komponente, wähl deinen Shop ({totalShops} verfügbar)
        </p>
      </div>

      {/* Komponenten mit Shop-Pills */}
      <div className="flex flex-col gap-3 p-4">
        {blade && <ComponentRow product={blade} label="Holz" />}
        {rubbers.map((r, i) => (
          <ComponentRow
            key={`${r.id}-${i}`}
            product={r}
            label={rubbers.length === 1 ? "Belag" : i === 0 ? "VH" : "RH"}
          />
        ))}
      </div>

      {/* Trust-Mikrotext */}
      <div className="border-t border-neutral-700 p-4">
        <p className="text-center font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          {hasAffiliate
            ? "Orange Buttons = Affiliate-Partner (Werbung · du zahlst nichts mehr)"
            : "Externe Shop-Links · noch keine Affiliate-Provision · Preise direkt im Shop"}
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
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
          KI-Berater
        </div>
        <div className="text-sm leading-relaxed text-neutral-200">
          {renderBeraterText(result.text)}
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
          ↺ Nochmal von vorne, anderes Profil testen
        </button>
      </div>
    </motion.div>
  );
}
