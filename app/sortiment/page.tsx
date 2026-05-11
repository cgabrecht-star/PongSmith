"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

// ─── Typen ────────────────────────────────────────────────────────────────────

type DataQuality = "complete" | "partial";

interface RubberItem {
  id: number;
  kind: "rubber";
  name: string;
  slug: string;
  manufacturer: string;
  manufacturerSlug: string;
  rubberType: string;
  playStyle: string | null;
  speedNorm: string | null;
  spinNorm: string | null;
  controlNorm: string | null;
  hardnessMin: number | null;
  ttrMin: number | null;
  ttrMax: number | null;
  ttrOptimal: number | null;
  reviewCount: number | null;
  dataQuality: DataQuality;
  description: string | null;
  communityDescription: string | null;
  imageUrl: string | null;
}

interface BladeItem {
  id: number;
  kind: "blade";
  name: string;
  slug: string;
  manufacturer: string;
  manufacturerSlug: string;
  playStyle: string | null;
  speedNorm: string | null;
  controlNorm: string | null;
  layers: number | null;
  composition: string | null;
  weightMin: number | null;
  weightMax: number | null;
  stiffness: string | null;
  ttrMin: number | null;
  ttrMax: number | null;
  ttrOptimal: number | null;
  reviewCount: number | null;
  dataQuality: DataQuality;
  description: string | null;
  communityDescription: string | null;
  imageUrl: string | null;
}

type ProductItem = RubberItem | BladeItem;

interface Manufacturer { name: string; slug: string; }

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

// Diese Funktionen erhalten die Übersetzungen als Argument — werden in jeder
// Komponente die sie nutzt mit dem aktuellen `t` aufgerufen.
function rubberTypeLabel(type: string, t: ReturnType<typeof useLanguage>["t"]) {
  return type === "smooth" ? t.sortiment.typeSmooth
    : type === "long_pips" ? t.sortiment.typeLongPips
    : type === "short_pips" ? t.sortiment.typeShortPips
    : type === "anti" ? t.sortiment.typeAnti
    : type;
}

function playStyleLabel(s: string | null, t: ReturnType<typeof useLanguage>["t"]) {
  return s === "offensive_topspin" ? t.sortiment.styleOffensive
    : s === "allround" ? t.sortiment.styleAllround
    : s === "defensive" ? t.sortiment.styleDefensive
    : s === "material" ? t.sortiment.styleMaterial
    : "–";
}

function playStyleColor(s: string | null) {
  return s === "offensive_topspin" ? "var(--ps-ember)"
    : s === "defensive" ? "#2563eb"
    : s === "material" ? "#059669"
    : "var(--ps-ink-3)";
}

// ─── Bild-Komponente ─────────────────────────────────────────────────────────
// `size` und `hovered` steuerbar von außen — Hover-Effekt kommt vom Parent.

// Hersteller-Farben für Fallback-Karten
const MANUFACTURER_COLORS: Record<string, [string, string]> = {
  butterfly:    ["#ff7a35", "#c8331a"],
  stiga:        ["#1a4f8b", "#0d2c4f"],
  donic:        ["#c8331a", "#7a1d0c"],
  tibhar:       ["#3d5a40", "#1c2a1e"],
  joola:        ["#1f3a78", "#0f1f44"],
  xiom:         ["#2a2a2a", "#0e0e0e"],
  yasaka:       ["#1c5a96", "#0e2c4a"],
  andro:        ["#c41e3a", "#6e0d20"],
  dhs:          ["#c4191e", "#6e0c10"],
  nittaku:      ["#1a3b6e", "#0d1f3a"],
  victas:       ["#c4191e", "#6e0c10"],
  sanwei:       ["#3a3a3a", "#1a1a1a"],
  yinhe:        ["#5c2a8e", "#2c0e4a"],
  juic:         ["#7a1d0c", "#3d0e06"],
  friendship:   ["#c41e3a", "#6e0d20"],
  dawei:        ["#3d3d3d", "#1c1c1c"],
  spinlord:     ["#5a2c1e", "#2c1408"],
  "dr-neubauer": ["#1c2c1c", "#0a140a"],
};

function getManufacturerStyle(manufacturerSlug: string): { gradient: string; initial: string } {
  const colors = MANUFACTURER_COLORS[manufacturerSlug.toLowerCase()] ?? ["#3a3835", "#1c1b18"];
  return {
    gradient: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
    initial: manufacturerSlug.charAt(0).toUpperCase(),
  };
}

function ProductImage({
  url, name, manufacturerSlug = "", size = 72, hovered = false,
}: { url: string | null; name: string; manufacturerSlug?: string; size?: number; hovered?: boolean }) {
  const [error, setError] = useState(false);
  const scale = hovered ? 1.06 : 1;
  const baseStyle: React.CSSProperties = {
    width: size, height: size, flexShrink: 0, borderRadius: 6,
    background: "var(--ps-bg-3)", border: "1px solid var(--ps-line-2)",
    transition: "transform 220ms ease, border-color 220ms, box-shadow 220ms",
    transform: `scale(${scale})`,
    transformOrigin: "left center",
    overflow: "hidden",
  };

  if (!url || error) {
    // Stilisierter Fallback: Manufacturer-Initial in Hersteller-Farb-Gradient
    const { gradient, initial } = getManufacturerStyle(manufacturerSlug);
    // Kurzname (1-3 Großbuchstaben aus dem Produktnamen)
    const shortCode = name
      .replace(/^(Butterfly|Stiga|Donic|Tibhar|Joola|Xiom|Yasaka|Andro|DHS|Nittaku|Victas|Sanwei|Yinhe|Juic|Friendship|Dawei|SpinLord|Dr\.\s*Neubauer)\s*/i, "")
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || initial;

    return (
      <div style={{
        ...baseStyle,
        background: gradient,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 60%)",
          pointerEvents: "none",
        }} />
        <span
          className="ff-display"
          style={{
            fontSize: size / 2.4,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.02em",
            lineHeight: 1,
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            position: "relative",
          }}
        >
          {shortCode}
        </span>
        {size >= 100 && (
          <span
            className="ff-mono"
            style={{
              fontSize: 8, letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              marginTop: 4,
              position: "relative",
            }}
          >
            {manufacturerSlug}
          </span>
        )}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      style={{ ...baseStyle, objectFit: "contain", padding: 4 }}
    />
  );
}

// ─── Stat-Reihe ───────────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string | null; color: string }) {
  const v = value ? Math.round(parseFloat(value) * 10) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="ff-mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--ps-ink-4)", textTransform: "uppercase", width: 42, flexShrink: 0 }}>
        {label}
      </span>
      <div className="stat-track" style={{ flex: 1 }}>
        <div className="stat-fill" style={{ width: `${v}%`, background: color }} />
      </div>
      <span className="ff-mono" style={{ fontSize: 9, color: "var(--ps-ink-3)", width: 24, textAlign: "right" }}>
        {value ? parseFloat(value).toFixed(1) : "–"}
      </span>
    </div>
  );
}

// ─── Karten ───────────────────────────────────────────────────────────────────

function QualityBadge({ q, t }: { q: DataQuality; t: ReturnType<typeof useLanguage>["t"] }) {
  const isComplete = q === "complete";
  return (
    <span
      title={isComplete ? t.sortiment.qualityCompleteHint : t.sortiment.qualityPartialHint}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 999,
        fontSize: 9,
        fontFamily: "var(--font-jetbrains), monospace",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        background: isComplete ? "rgba(34,197,94,0.10)" : "rgba(234,179,8,0.10)",
        border: isComplete ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(234,179,8,0.35)",
        color: isComplete ? "#4ade80" : "#facc15",
      }}
    >
      <span style={{ fontSize: 8 }}>{isComplete ? "●" : "◐"}</span>
      {isComplete ? t.sortiment.qualityComplete : t.sortiment.qualityPartial}
    </span>
  );
}

function ProductCard({ item, onClick }: { item: ProductItem; onClick: () => void }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const isRubber = item.kind === "rubber";
  const detailHref = isRubber ? `/belag/${item.slug}` : `/holz/${item.slug}`;

  // Click → Modal. Ctrl/Cmd+Click oder Mittelklick → echte Navigation zur
  // Detail-Seite. Sauber für SEO-Crawler (echter <a>-Tag im DOM) + behält
  // die Modal-UX bei normalem Click.
  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // normale Navigation lassen
    e.preventDefault();
    onClick();
  }

  return (
    <a
      href={detailHref}
      className="card-forged"
      style={{
        padding: "16px 18px",
        cursor: "pointer",
        position: "relative",
        display: "block",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 220ms, transform 220ms, box-shadow 220ms",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        borderColor: hovered ? "rgba(255,107,53,0.45)" : "var(--ps-line)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.35)" : "none",
      }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Quality-Badge oben rechts */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <QualityBadge q={item.dataQuality} t={t} />
      </div>

      {/* Header mit Bild */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingRight: 90 }}>
        <ProductImage url={item.imageUrl} name={item.name} manufacturerSlug={item.manufacturerSlug} hovered={hovered} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 4 }}>
            {item.manufacturer}
          </div>
          <div
            style={{
              fontSize: hovered ? 15.5 : 14,
              fontWeight: 600,
              color: hovered ? "var(--ps-ember-2)" : "var(--ps-ink-0)",
              lineHeight: 1.25,
              marginBottom: 6,
              transition: "font-size 220ms, color 220ms",
            }}
          >
            {item.name}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {isRubber && (
              <span className="tag-line" style={{ fontSize: 9 }}>
                {rubberTypeLabel((item as RubberItem).rubberType, t)}
              </span>
            )}
            <span
              className="tag-line"
              style={{ fontSize: 9, borderColor: `${playStyleColor(item.playStyle)}44`, color: playStyleColor(item.playStyle) }}
            >
              {playStyleLabel(item.playStyle, t)}
            </span>
            {item.ttrOptimal && <span className="tag-line" style={{ fontSize: 9 }}>TTR {item.ttrOptimal}</span>}
            {!isRubber && (item as BladeItem).composition && (
              <span className="tag-line" style={{ fontSize: 9 }}>{(item as BladeItem).composition}</span>
            )}
            {isRubber && (item as RubberItem).hardnessMin && (
              <span className="tag-line" style={{ fontSize: 9 }}>{(item as RubberItem).hardnessMin}°</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        <StatRow label={t.sortiment.labelSpeed} value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
        {isRubber && (
          <StatRow label={t.sortiment.labelSpin} value={(item as RubberItem).spinNorm} color="linear-gradient(90deg,var(--ps-ember-deep),var(--ps-ember))" />
        )}
        <StatRow label={t.sortiment.labelControl} value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
      </div>

      {/* Hint */}
      <div className="ff-mono" style={{ marginTop: 10, fontSize: 9, color: hovered ? "var(--ps-ember-2)" : "var(--ps-ink-4)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 220ms" }}>
        {hovered
          ? t.sortiment.hoverHint
          : (item.reviewCount && item.reviewCount > 0
              ? `★ ${item.reviewCount} ${t.sortiment.reviewCount}`
              : t.sortiment.defaultHint)}
      </div>
    </a>
  );
}

// ─── Detail-Modal ─────────────────────────────────────────────────────────────

function DetailModal({ item, onClose }: { item: ProductItem; onClose: () => void }) {
  const { t, lang } = useLanguage();
  // Esc zum Schließen + Body-Scroll-Lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isRubber = item.kind === "rubber";
  const spongeLabel = lang === "de" ? "° Schwamm" : "° sponge";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(8,8,10,0.78)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fadein 180ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-forged"
        style={{
          width: "100%", maxWidth: 920, maxHeight: "90vh", overflowY: "auto",
          background: "var(--ps-bg-2)", padding: 0,
          borderColor: "rgba(255,107,53,0.35)",
          animation: "slideup 240ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--ps-line-2)", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <ProductImage url={item.imageUrl} name={item.name} manufacturerSlug={item.manufacturerSlug} size={140} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 6 }}>
              {item.manufacturer}
            </div>
            <h2 className="ff-display" style={{ fontSize: 34, color: "var(--ps-ink-0)", lineHeight: 1.05, marginBottom: 10 }}>
              {item.name}
            </h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {isRubber && (
                <span className="tag-line" style={{ fontSize: 10 }}>
                  {rubberTypeLabel((item as RubberItem).rubberType, t)}
                </span>
              )}
              <span className="tag-line" style={{ fontSize: 10, borderColor: `${playStyleColor(item.playStyle)}55`, color: playStyleColor(item.playStyle) }}>
                {playStyleLabel(item.playStyle, t)}
              </span>
              {item.ttrOptimal && <span className="tag-line" style={{ fontSize: 10 }}>TTR {item.ttrOptimal}</span>}
              {isRubber && (item as RubberItem).hardnessMin && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as RubberItem).hardnessMin}{spongeLabel}</span>
              )}
              {!isRubber && (item as BladeItem).composition && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as BladeItem).composition}</span>
              )}
              {!isRubber && (item as BladeItem).weightMin && (item as BladeItem).weightMax && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as BladeItem).weightMin}–{(item as BladeItem).weightMax} g</span>
              )}
              <QualityBadge q={item.dataQuality} t={t} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid var(--ps-line-2)",
              color: "var(--ps-ink-3)", borderRadius: 4, padding: "6px 10px",
              cursor: "pointer", fontFamily: "inherit", fontSize: 14,
            }}
            aria-label={t.sortiment.closeAriaLabel}
          >
            ✕
          </button>
        </div>

        {/* Specs */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--ps-line-2)" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 10 }}>
            {t.sortiment.specs}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500 }}>
            <StatRow label={t.sortiment.labelSpeed} value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
            {isRubber && (
              <StatRow label={t.sortiment.labelSpin} value={(item as RubberItem).spinNorm} color="linear-gradient(90deg,var(--ps-ember-deep),var(--ps-ember))" />
            )}
            <StatRow label={t.sortiment.labelControl} value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
          </div>
          {item.reviewCount != null && item.reviewCount > 0 && (
            <div className="ff-mono" style={{ marginTop: 12, fontSize: 10, color: "var(--ps-ink-4)" }}>
              ★ {item.reviewCount} {t.sortiment.reviews}
            </div>
          )}
        </div>

        {/* Hersteller-Beschreibung */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--ps-line-2)" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 10 }}>
            {t.sortiment.manufacturerDesc}
          </div>
          {item.description ? (
            <p style={{ fontSize: 13.5, color: "var(--ps-ink-1)", lineHeight: 1.7 }}>
              {item.description}
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--ps-ink-4)", fontStyle: "italic" }}>
              {t.sortiment.noDescription}
            </p>
          )}
        </div>

        {/* Community-Beschreibung */}
        <div style={{ padding: "20px 28px" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "#34d399", textTransform: "uppercase", marginBottom: 10 }}>
            {t.sortiment.communityDesc}
          </div>
          {item.communityDescription ? (
            <p style={{ fontSize: 13.5, color: "var(--ps-ink-1)", lineHeight: 1.7 }}>
              {item.communityDescription}
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--ps-ink-4)", fontStyle: "italic" }}>
              {t.sortiment.noCommunity}
            </p>
          )}
        </div>

        {/* Footer mit Detail-Seite-Link */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--ps-line-2)", background: "var(--ps-bg-1)", display: "flex", justifyContent: "center" }}>
          <Link
            href={item.kind === "rubber" ? `/belag/${item.slug}` : `/holz/${item.slug}`}
            className="ember-btn"
            style={{
              padding: "10px 20px",
              fontSize: 12.5,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {lang === "de" ? "Volle Detail-Seite öffnen" : "Open full detail page"} →
          </Link>
        </div>
      </div>

      {/* Inline-Keyframes */}
      <style jsx>{`
        @keyframes fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideup {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Filter-Chip ──────────────────────────────────────────────────────────────

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 999, fontSize: 11.5, cursor: "pointer",
        fontFamily: "inherit", whiteSpace: "nowrap",
        background: active ? "rgba(255,107,53,0.12)" : "var(--ps-bg-2)",
        border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
        color: active ? "var(--ps-ember-2)" : "var(--ps-ink-2)",
        transition: "all 160ms",
      }}
    >
      {children}
    </button>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function SortimentPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"rubber" | "blade">("rubber");
  const [rubberType, setRubberType] = useState<string>("");
  const [playStyle, setPlayStyle] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rubberItems, setRubberItems] = useState<RubberItem[]>([]);
  const [bladeItems, setBladeItems] = useState<BladeItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [manufacturer, setManufacturer] = useState<string>("");
  const [activeItem, setActiveItem] = useState<ProductItem | null>(null);
  // Datenqualität-Filter — Default: alle anzeigen (Light-Variante)
  const [qualityOnlyComplete, setQualityOnlyComplete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (rubberType && tab === "rubber") params.set("rubber_type", rubberType);
    if (playStyle) params.set("play_style", playStyle);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (search) params.set("q", search);
    if (qualityOnlyComplete) params.set("quality", "complete");
    params.set("lang", lang);

    const res = await fetch(`/api/sortiment?${params}`);
    const data = await res.json() as { rubbers: RubberItem[]; blades: BladeItem[]; manufacturers: Manufacturer[] };
    setRubberItems(data.rubbers ?? []);
    setBladeItems(data.blades ?? []);
    if (data.manufacturers) setManufacturers(data.manufacturers);
    setLoading(false);
  }, [rubberType, playStyle, manufacturer, search, tab, lang, qualityOnlyComplete]);

  useEffect(() => { void load(); }, [load]);

  const items: ProductItem[] = tab === "rubber" ? rubberItems : bladeItems;
  const rubberCount = rubberItems.length;
  const bladeCount = bladeItems.length;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">

      {/* Sticky Top Bar — neuer Look */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-neutral-50">
              PongSmith
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/berater"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
            >
              {t.sortiment.consultBtn}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">

        {/* Titel */}
        <div style={{ marginBottom: 36 }}>
          <span className="eyebrow-pill">Sortiment</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl" style={{ marginBottom: 8 }}>
            {t.sortiment.title}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ps-ink-3)" }}>
            {t.sortiment.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 28, background: "var(--ps-bg-2)", padding: 4, borderRadius: 6, border: "1px solid var(--ps-line)", width: "fit-content" }}>
          {(["rubber", "blade"] as const).map((tabId) => (
            <button
              key={tabId}
              onClick={() => { setTab(tabId); setRubberType(""); }}
              style={{
                padding: "8px 20px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", border: "none",
                background: tab === tabId ? "var(--ps-bg-4)" : "transparent",
                color: tab === tabId ? "var(--ps-ink-0)" : "var(--ps-ink-3)",
                transition: "all 140ms",
              }}
            >
              {tabId === "rubber" ? `${t.sortiment.tabRubbers} (${rubberCount})` : `${t.sortiment.tabBlades} (${bladeCount})`}
            </button>
          ))}
        </div>

        {/* Filter-Zeile */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, alignItems: "center" }}>
          <input
            type="text"
            placeholder={t.sortiment.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              color: "var(--ps-ink-0)", padding: "6px 12px", borderRadius: 4,
              fontSize: 12.5, outline: "none", width: 160, fontFamily: "inherit",
            }}
          />

          {tab === "rubber" && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                { v: "", l: t.sortiment.allTypes },
                { v: "smooth", l: t.sortiment.typeSmooth },
                { v: "long_pips", l: t.sortiment.typeLongPips },
                { v: "short_pips", l: t.sortiment.typeShortPips },
                { v: "anti", l: t.sortiment.typeAnti },
              ].map(({ v, l }) => (
                <Chip key={v} active={rubberType === v} onClick={() => setRubberType(v)}>{l}</Chip>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[
              { v: "", l: t.sortiment.allStyles },
              { v: "offensive_topspin", l: t.sortiment.styleOffensive },
              { v: "allround", l: t.sortiment.styleAllround },
              { v: "defensive", l: t.sortiment.styleDefensive },
              { v: "material", l: t.sortiment.styleMaterial },
            ].map(({ v, l }) => (
              <Chip key={v} active={playStyle === v} onClick={() => setPlayStyle(v)}>{l}</Chip>
            ))}
          </div>

          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            style={{
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              color: manufacturer ? "var(--ps-ink-1)" : "var(--ps-ink-4)",
              padding: "6px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">{t.sortiment.allManufacturers}</option>
            {manufacturers.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>

          {/* Datenqualitäts-Toggle */}
          <button
            onClick={() => setQualityOnlyComplete((v) => !v)}
            title={t.sortiment.qualityCompleteHint}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 11.5,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: qualityOnlyComplete ? "rgba(34,197,94,0.10)" : "var(--ps-bg-2)",
              border: qualityOnlyComplete ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--ps-line)",
              color: qualityOnlyComplete ? "#4ade80" : "var(--ps-ink-2)",
              transition: "all 160ms",
            }}
          >
            <span style={{ fontSize: 9 }}>{qualityOnlyComplete ? "●" : "○"}</span>
            {t.sortiment.qualityToggleLabel}
          </button>

          {(rubberType || playStyle || manufacturer || search || qualityOnlyComplete) && (
            <button
              onClick={() => { setRubberType(""); setPlayStyle(""); setManufacturer(""); setSearch(""); setQualityOnlyComplete(false); }}
              style={{
                background: "transparent", border: "1px solid var(--ps-line-2)",
                color: "var(--ps-ink-4)", padding: "5px 10px", borderRadius: 4,
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✕ {t.sortiment.reset}
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginBottom: 20, textTransform: "uppercase" }}>
          {loading
            ? (lang === "de" ? "Lade…" : "Loading…")
            : `${items.length} ${tab === "rubber" ? t.sortiment.foundRubbers : t.sortiment.foundBlades}`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div className="ff-mono" style={{ fontSize: 11, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
              {t.sortiment.loading}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="ff-display" style={{ fontSize: 36, color: "var(--ps-ink-3)", marginBottom: 8 }}>{t.sortiment.noResults}</div>
            <p className="ff-mono" style={{ fontSize: 11, color: "var(--ps-ink-4)", letterSpacing: "0.08em" }}>
              {t.sortiment.noResultsHint}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}>
            {items.map((item) => (
              <ProductCard
                key={`${item.kind}-${item.id}`}
                item={item}
                onClick={() => setActiveItem(item)}
              />
            ))}
          </div>
        )}

        {/* Source-Note */}
        <p className="ff-mono" style={{ marginTop: 40, textAlign: "center", fontSize: 9.5, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
          {t.sortiment.sourceNote}
        </p>
      </div>

      {/* Modal */}
      {activeItem && (
        <DetailModal item={activeItem} onClose={() => setActiveItem(null)} />
      )}
    </div>
  );
}
