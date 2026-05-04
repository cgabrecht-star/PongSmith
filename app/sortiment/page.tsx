"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Typen ────────────────────────────────────────────────────────────────────

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
  description: string | null;
  communityDescription: string | null;
  imageUrl: string | null;
}

type ProductItem = RubberItem | BladeItem;

interface Manufacturer { name: string; slug: string; }

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function rubberTypeLabel(t: string) {
  return t === "smooth" ? "Invertiert"
    : t === "long_pips" ? "Lange Noppen"
    : t === "short_pips" ? "Kurze Noppen"
    : t === "anti" ? "Anti"
    : t;
}

function playStyleLabel(s: string | null) {
  return s === "offensive_topspin" ? "Offensiv"
    : s === "allround" ? "Allround"
    : s === "defensive" ? "Defensiv"
    : s === "material" ? "Material"
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

function ProductImage({
  url, name, size = 72, hovered = false,
}: { url: string | null; name: string; size?: number; hovered?: boolean }) {
  const [error, setError] = useState(false);
  const scale = hovered ? 1.06 : 1;
  const baseStyle: React.CSSProperties = {
    width: size, height: size, flexShrink: 0, borderRadius: 4,
    background: "var(--ps-bg-3)", border: "1px solid var(--ps-line-2)",
    transition: "transform 220ms ease, border-color 220ms",
    transform: `scale(${scale})`,
    transformOrigin: "left center",
  };
  if (!url || error) {
    return (
      <div style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size / 3 }}>
        🏓
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

function ProductCard({ item, onClick }: { item: ProductItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isRubber = item.kind === "rubber";

  return (
    <div
      className="card-forged"
      style={{
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 220ms, transform 220ms, box-shadow 220ms",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        borderColor: hovered ? "rgba(255,107,53,0.45)" : "var(--ps-line)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.35)" : "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header mit Bild */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <ProductImage url={item.imageUrl} name={item.name} hovered={hovered} />
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
                {rubberTypeLabel((item as RubberItem).rubberType)}
              </span>
            )}
            <span
              className="tag-line"
              style={{ fontSize: 9, borderColor: `${playStyleColor(item.playStyle)}44`, color: playStyleColor(item.playStyle) }}
            >
              {playStyleLabel(item.playStyle)}
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
        <StatRow label="Speed" value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
        {isRubber && (
          <StatRow label="Spin" value={(item as RubberItem).spinNorm} color="linear-gradient(90deg,var(--ps-ember-deep),var(--ps-ember))" />
        )}
        <StatRow label="Control" value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
      </div>

      {/* Hint */}
      <div className="ff-mono" style={{ marginTop: 10, fontSize: 9, color: hovered ? "var(--ps-ember-2)" : "var(--ps-ink-4)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 220ms" }}>
        {hovered ? "→ Details öffnen" : `${item.reviewCount && item.reviewCount > 0 ? `★ ${item.reviewCount} Reviews` : "Klick für Details"}`}
      </div>
    </div>
  );
}

// ─── Detail-Modal ─────────────────────────────────────────────────────────────

function DetailModal({ item, onClose }: { item: ProductItem; onClose: () => void }) {
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
          <ProductImage url={item.imageUrl} name={item.name} size={140} />
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
                  {rubberTypeLabel((item as RubberItem).rubberType)}
                </span>
              )}
              <span className="tag-line" style={{ fontSize: 10, borderColor: `${playStyleColor(item.playStyle)}55`, color: playStyleColor(item.playStyle) }}>
                {playStyleLabel(item.playStyle)}
              </span>
              {item.ttrOptimal && <span className="tag-line" style={{ fontSize: 10 }}>TTR {item.ttrOptimal}</span>}
              {isRubber && (item as RubberItem).hardnessMin && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as RubberItem).hardnessMin}° Schwamm</span>
              )}
              {!isRubber && (item as BladeItem).composition && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as BladeItem).composition}</span>
              )}
              {!isRubber && (item as BladeItem).weightMin && (item as BladeItem).weightMax && (
                <span className="tag-line" style={{ fontSize: 10 }}>{(item as BladeItem).weightMin}–{(item as BladeItem).weightMax} g</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid var(--ps-line-2)",
              color: "var(--ps-ink-3)", borderRadius: 4, padding: "6px 10px",
              cursor: "pointer", fontFamily: "inherit", fontSize: 14,
            }}
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Specs */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--ps-line-2)" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 10 }}>
            Spezifikationen
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500 }}>
            <StatRow label="Speed" value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
            {isRubber && (
              <StatRow label="Spin" value={(item as RubberItem).spinNorm} color="linear-gradient(90deg,var(--ps-ember-deep),var(--ps-ember))" />
            )}
            <StatRow label="Control" value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
          </div>
          {item.reviewCount != null && item.reviewCount > 0 && (
            <div className="ff-mono" style={{ marginTop: 12, fontSize: 10, color: "var(--ps-ink-4)" }}>
              ★ {item.reviewCount} Community-Reviews
            </div>
          )}
        </div>

        {/* Hersteller-Beschreibung */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--ps-line-2)" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 10 }}>
            Hersteller-Beschreibung
          </div>
          {item.description ? (
            <p style={{ fontSize: 13.5, color: "var(--ps-ink-1)", lineHeight: 1.7 }}>
              {item.description}
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--ps-ink-4)", fontStyle: "italic" }}>
              Noch keine Beschreibung hinterlegt.
            </p>
          )}
        </div>

        {/* Community-Beschreibung */}
        <div style={{ padding: "20px 28px" }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "#34d399", textTransform: "uppercase", marginBottom: 10 }}>
            Was Spieler sagen
          </div>
          {item.communityDescription ? (
            <p style={{ fontSize: 13.5, color: "var(--ps-ink-1)", lineHeight: 1.7 }}>
              {item.communityDescription}
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--ps-ink-4)", fontStyle: "italic" }}>
              Noch keine Community-Stimmen aggregiert.
            </p>
          )}
        </div>

        {/* Footer / Future-CTA */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--ps-line-2)", background: "var(--ps-bg-1)" }}>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", textAlign: "center", textTransform: "uppercase" }}>
            Bald: in den Schläger-Schmied einbauen · Preis vergleichen · zum Shop
          </div>
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

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (rubberType && tab === "rubber") params.set("rubber_type", rubberType);
    if (playStyle) params.set("play_style", playStyle);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (search) params.set("q", search);

    const res = await fetch(`/api/sortiment?${params}`);
    const data = await res.json() as { rubbers: RubberItem[]; blades: BladeItem[]; manufacturers: Manufacturer[] };
    setRubberItems(data.rubbers ?? []);
    setBladeItems(data.blades ?? []);
    if (data.manufacturers) setManufacturers(data.manufacturers);
    setLoading(false);
  }, [rubberType, playStyle, manufacturer, search, tab]);

  useEffect(() => { void load(); }, [load]);

  const items: ProductItem[] = tab === "rubber" ? rubberItems : bladeItems;
  const rubberCount = rubberItems.length;
  const bladeCount = bladeItems.length;

  return (
    <div className="forge-bg" style={{ minHeight: "100vh" }}>

      {/* Top Bar */}
      <div className="glass-bar" style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 24px", borderBottom: "1px solid var(--ps-line-2)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 56 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="ff-display" style={{ fontSize: 22, color: "var(--ps-ember-2)" }}>PS</span>
          </Link>
          <span style={{ color: "var(--ps-line)", fontSize: 18 }}>·</span>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>
            Sortiment
          </span>
          <div style={{ flex: 1 }} />
          <Link
            href="/#berater"
            className="ember-btn"
            style={{ padding: "7px 14px", fontSize: 11, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            🔨 Beraten lassen
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Titel */}
        <div style={{ marginBottom: 36 }}>
          <h1 className="ff-display" style={{ fontSize: 52, color: "var(--ps-ink-0)", lineHeight: 1, marginBottom: 8 }}>
            Sortiment
          </h1>
          <p style={{ fontSize: 15, color: "var(--ps-ink-3)" }}>
            Alle Beläge und Hölzer in unserem Index — mit Hersteller-Specs, Übersetzung und aggregierten Spielerstimmen. Karte anklicken für Details.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 28, background: "var(--ps-bg-2)", padding: 4, borderRadius: 6, border: "1px solid var(--ps-line)", width: "fit-content" }}>
          {(["rubber", "blade"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setRubberType(""); }}
              style={{
                padding: "8px 20px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", border: "none",
                background: tab === t ? "var(--ps-bg-4)" : "transparent",
                color: tab === t ? "var(--ps-ink-0)" : "var(--ps-ink-3)",
                transition: "all 140ms",
              }}
            >
              {t === "rubber" ? `Beläge (${rubberCount})` : `Hölzer (${bladeCount})`}
            </button>
          ))}
        </div>

        {/* Filter-Zeile */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Name suchen…"
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
                { v: "", l: "Alle Typen" },
                { v: "smooth", l: "Invertiert" },
                { v: "long_pips", l: "Lange Noppen" },
                { v: "short_pips", l: "Kurze Noppen" },
                { v: "anti", l: "Anti" },
              ].map(({ v, l }) => (
                <Chip key={v} active={rubberType === v} onClick={() => setRubberType(v)}>{l}</Chip>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[
              { v: "", l: "Alle Stile" },
              { v: "offensive_topspin", l: "Offensiv" },
              { v: "allround", l: "Allround" },
              { v: "defensive", l: "Defensiv" },
              { v: "material", l: "Material" },
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
            <option value="">Alle Hersteller</option>
            {manufacturers.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>

          {(rubberType || playStyle || manufacturer || search) && (
            <button
              onClick={() => { setRubberType(""); setPlayStyle(""); setManufacturer(""); setSearch(""); }}
              style={{
                background: "transparent", border: "1px solid var(--ps-line-2)",
                color: "var(--ps-ink-4)", padding: "5px 10px", borderRadius: 4,
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginBottom: 20, textTransform: "uppercase" }}>
          {loading ? "Lade…" : `${items.length} ${tab === "rubber" ? "Beläge" : "Hölzer"} gefunden`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div className="ff-mono" style={{ fontSize: 11, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
              LADE SORTIMENT…
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="ff-display" style={{ fontSize: 36, color: "var(--ps-ink-3)", marginBottom: 8 }}>Keine Treffer</div>
            <p className="ff-mono" style={{ fontSize: 11, color: "var(--ps-ink-4)", letterSpacing: "0.08em" }}>
              Filter anpassen oder Reset drücken.
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
          DATEN: HERSTELLER-DATENBLÄTTER + AGGREGIERTE COMMUNITY-STIMMEN · NORMIERT AUF 1.0–10.0
        </p>
      </div>

      {/* Modal */}
      {activeItem && (
        <DetailModal item={activeItem} onClose={() => setActiveItem(null)} />
      )}
    </div>
  );
}
