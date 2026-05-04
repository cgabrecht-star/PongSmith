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
}

type ProductItem = RubberItem | BladeItem;

interface Manufacturer { name: string; slug: string; }

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function statBar(value: string | null, color: string) {
  const v = value ? Math.round(parseFloat(value) * 10) : 0;
  return (
    <div className="stat-track" style={{ flex: 1 }}>
      <div className="stat-fill" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

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

// ─── Karten ───────────────────────────────────────────────────────────────────

function RubberCard({ item }: { item: RubberItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="card-forged"
      style={{ padding: "16px 18px", cursor: "pointer", transition: "border-color 180ms, transform 180ms" }}
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,107,53,0.35)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ps-line)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 4 }}>
            {item.manufacturer}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-ink-0)", lineHeight: 1.25 }}>
            {item.name}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span className="tag-line" style={{ fontSize: 9 }}>
            {rubberTypeLabel(item.rubberType)}
          </span>
          <span
            className="tag-line"
            style={{ fontSize: 9, borderColor: `${playStyleColor(item.playStyle)}44`, color: playStyleColor(item.playStyle) }}
          >
            {playStyleLabel(item.playStyle)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        <StatRow label="Speed" value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
        <StatRow label="Spin" value={item.spinNorm} color="linear-gradient(90deg,var(--ps-ember-deep),var(--ps-ember))" />
        <StatRow label="Control" value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
      </div>

      {/* Meta */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {item.ttrOptimal && (
          <span className="tag-line" style={{ fontSize: 9 }}>TTR {item.ttrOptimal}</span>
        )}
        {item.hardnessMin && (
          <span className="tag-line" style={{ fontSize: 9 }}>{item.hardnessMin}°</span>
        )}
        {item.reviewCount != null && item.reviewCount > 0 && (
          <span className="tag-line" style={{ fontSize: 9 }}>★ {item.reviewCount} Reviews</span>
        )}
      </div>

      {/* Description */}
      {expanded && item.description && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--ps-ink-2)", lineHeight: 1.65, borderTop: "1px solid var(--ps-line-2)", paddingTop: 12 }}>
          {item.description}
        </p>
      )}
    </div>
  );
}

function BladeCard({ item }: { item: BladeItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="card-forged"
      style={{ padding: "16px 18px", cursor: "pointer", transition: "border-color 180ms, transform 180ms" }}
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,107,53,0.35)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ps-line)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 4 }}>
            {item.manufacturer}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-ink-0)", lineHeight: 1.25 }}>
            {item.name}
          </div>
        </div>
        <span
          className="tag-line"
          style={{ fontSize: 9, borderColor: `${playStyleColor(item.playStyle)}44`, color: playStyleColor(item.playStyle), flexShrink: 0 }}
        >
          {playStyleLabel(item.playStyle)}
        </span>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        <StatRow label="Speed" value={item.speedNorm} color="linear-gradient(90deg,#2563eb,#60a5fa)" />
        <StatRow label="Control" value={item.controlNorm} color="linear-gradient(90deg,#059669,#34d399)" />
      </div>

      {/* Meta */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {item.composition && <span className="tag-line" style={{ fontSize: 9 }}>{item.composition}</span>}
        {item.ttrOptimal && <span className="tag-line" style={{ fontSize: 9 }}>TTR {item.ttrOptimal}</span>}
        {item.weightMin && item.weightMax && (
          <span className="tag-line" style={{ fontSize: 9 }}>{item.weightMin}–{item.weightMax} g</span>
        )}
      </div>

      {/* Description */}
      {expanded && item.description && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--ps-ink-2)", lineHeight: 1.65, borderTop: "1px solid var(--ps-line-2)", paddingTop: 12 }}>
          {item.description}
        </p>
      )}
    </div>
  );
}

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
            Alle Beläge und Hölzer in unserem Index — mit normierten Specs aus Hersteller-Daten und Community-Reviews.
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

          {/* Suche */}
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

          {/* Belag-Typ (nur Beläge) */}
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

          {/* Spielstil */}
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

          {/* Hersteller */}
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

          {/* Reset */}
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

        {/* Ergebnis-Counter */}
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
            {items.map((item) =>
              item.kind === "rubber"
                ? <RubberCard key={`r-${item.id}`} item={item} />
                : <BladeCard key={`b-${item.id}`} item={item} />
            )}
          </div>
        )}

        {/* Source note */}
        <p className="ff-mono" style={{ marginTop: 40, textAlign: "center", fontSize: 9.5, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
          DATEN: REVSPIN.NET COMMUNITY-RATINGS + HERSTELLER-DATENBLÄTTER · NORMIERT AUF 1.0–10.0 SKALA
        </p>
      </div>
    </div>
  );
}
