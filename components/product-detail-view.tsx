/**
 * Server-rendered Detail-View für ein einzelnes Produkt (Belag oder Holz).
 * Wird von /belag/[slug] und /holz/[slug] genutzt.
 *
 * SEO-Optimierungen:
 * - H1, H2-Hierarchie sauber
 * - Schema.org Product + BreadcrumbList JSON-LD
 * - Internal Links zu Synergie-Partnern und ähnlichen Produkten
 * - Klare CTA zum Berater
 */

import Link from "next/link";
import type { ProductDetail, SynergyPartner, SimilarProduct } from "@/lib/product-detail";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRubberType(t: string | undefined) {
  switch (t) {
    case "smooth": return "Noppen innen (invertiert)";
    case "long_pips": return "Lange Noppen";
    case "short_pips": return "Kurze Noppen";
    case "anti": return "Anti-Topspin";
    default: return "—";
  }
}

function formatTopsheet(t: string | null | undefined) {
  if (t === "sticky") return "klebrig (chinesisch)";
  if (t === "grippy") return "griffig (europäisch)";
  if (t === "neutral") return "neutral";
  return null;
}

function formatPlayStyle(s: string | null) {
  switch (s) {
    case "offensive_topspin": return "Offensiv-Topspin";
    case "allround": return "Allround";
    case "defensive": return "Defensiv";
    case "material": return "Material (Noppen/Anti)";
    default: return null;
  }
}

// ─── Stat-Bar ─────────────────────────────────────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (value === null) return null;
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>
          {label}
        </span>
        <span className="ff-mono" style={{ fontSize: 12, color: "var(--ps-ink-1)" }}>{value.toFixed(1)} / 10</span>
      </div>
      <div style={{ height: 8, background: "var(--ps-bg-3)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 600ms" }} />
      </div>
    </div>
  );
}

// ─── Mini-Karte für Synergie/Ähnliche Produkte ─────────────────────────────

function PartnerCard({ p, kindLabel }: { p: SynergyPartner; kindLabel: string }) {
  const href = p.type === "blade" ? `/holz/${p.slug}` : `/belag/${p.slug}`;
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: "var(--ps-bg-2)",
        border: "1px solid var(--ps-line)",
        borderRadius: 4,
        textDecoration: "none",
        color: "var(--ps-ink-0)",
        transition: "all 160ms",
      }}
    >
      <ImgOrInitial url={p.imageUrl} manufacturer={p.manufacturer} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 3 }}>
          {kindLabel} · {p.manufacturer}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div className="ff-mono" style={{ fontSize: 9, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>SYN</div>
        <div className="ff-display" style={{ fontSize: 22, color: "var(--ps-ember-2)", lineHeight: 1 }}>{p.synergyScore}</div>
      </div>
    </Link>
  );
}

function SimilarCard({ p }: { p: SimilarProduct & { type: "blade" | "rubber" } }) {
  const href = p.type === "blade" ? `/holz/${p.slug}` : `/belag/${p.slug}`;
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--ps-bg-2)",
        border: "1px solid var(--ps-line)",
        borderRadius: 4,
        textDecoration: "none",
        color: "var(--ps-ink-0)",
        transition: "all 160ms",
      }}
    >
      <ImgOrInitial url={p.imageUrl} manufacturer={p.manufacturer} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--ps-ink-4)", textTransform: "uppercase" }}>
          {p.manufacturer}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, marginTop: 2 }}>{p.name}</div>
      </div>
    </Link>
  );
}

function ImgOrInitial({ url, manufacturer, size }: { url: string | null; manufacturer: string; size: number }) {
  const initial = manufacturer.charAt(0).toUpperCase();
  if (!url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 3,
        background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05))",
        border: "1px solid var(--ps-line)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ps-ember-2)", fontSize: size * 0.45, fontWeight: 600,
        flexShrink: 0,
        fontFamily: "var(--font-bebas), sans-serif",
      }}>{initial}</div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={manufacturer} style={{ width: size, height: size, borderRadius: 3, objectFit: "cover", border: "1px solid var(--ps-line)", flexShrink: 0 }} />;
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────

export interface DetailViewProps {
  product: ProductDetail;
  synergies: SynergyPartner[];
  similar: SimilarProduct[];
}

export function ProductDetailView({ product, synergies, similar }: DetailViewProps) {
  const isRubber = product.type === "rubber";
  const breadcrumbCategory = isRubber ? "Beläge" : "Hölzer";
  const breadcrumbCategorySlug = isRubber ? "belag" : "holz";

  return (
    <article className="forge-bg" style={{ minHeight: "100vh", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: 20, fontSize: 12 }} aria-label="Breadcrumb">
          <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6, padding: 0, margin: 0, color: "var(--ps-ink-3)" }}>
            <li><Link href="/" style={{ color: "var(--ps-ink-3)", textDecoration: "none" }}>Start</Link></li>
            <li>›</li>
            <li><Link href="/sortiment" style={{ color: "var(--ps-ink-3)", textDecoration: "none" }}>Sortiment</Link></li>
            <li>›</li>
            <li>
              <Link href={`/sortiment?type=${breadcrumbCategorySlug}`} style={{ color: "var(--ps-ink-3)", textDecoration: "none" }}>
                {breadcrumbCategory}
              </Link>
            </li>
            <li>›</li>
            <li style={{ color: "var(--ps-ink-1)" }}>{product.name}</li>
          </ol>
        </nav>

        {/* Hero — Bild + Title + Specs */}
        <header style={{ marginBottom: 40, display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr", gap: 28, alignItems: "flex-start" }}>
          <div>
            <ImgOrInitial url={product.imageUrl} manufacturer={product.manufacturer.name} size={200} />
          </div>
          <div>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 8 }}>
              {product.manufacturer.name}
            </div>
            <h1 className="ff-display" style={{ fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 1.05, margin: "0 0 14px", color: "var(--ps-ink-0)" }}>
              {product.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {isRubber && product.rubberType && (
                <span className="tag-line">{formatRubberType(product.rubberType)}</span>
              )}
              {product.playStyle && formatPlayStyle(product.playStyle) && (
                <span className="tag-line tag-ember">{formatPlayStyle(product.playStyle)}</span>
              )}
              {product.ttrOptimal && <span className="tag-line">TTR {product.ttrOptimal}</span>}
              {product.reviewCount > 0 && (
                <span className="tag-line">★ {product.reviewCount} Reviews</span>
              )}
            </div>
          </div>
        </header>

        {/* Specs */}
        <section style={{ marginBottom: 40 }}>
          <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 18, lineHeight: 1.1 }}>
            Spezifikationen
          </h2>
          <div className="card-forged" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <StatBar label="Speed" value={product.speed} color="linear-gradient(90deg, #2563eb, #60a5fa)" />
            {isRubber && <StatBar label="Spin" value={product.spin} color="linear-gradient(90deg, var(--ps-ember-deep), var(--ps-ember))" />}
            <StatBar label="Kontrolle" value={product.control} color="linear-gradient(90deg, #059669, #34d399)" />

            {/* Zusatz-Infos je nach Typ */}
            {isRubber && (product.hardnessMin || product.topsheet) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 6, fontSize: 13, color: "var(--ps-ink-2)" }}>
                {product.hardnessMin && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Schwammhärte</span>
                    {product.hardnessMin}{product.hardnessMax && product.hardnessMax !== product.hardnessMin ? `–${product.hardnessMax}` : ""}°
                  </div>
                )}
                {formatTopsheet(product.topsheet) && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Topsheet</span>
                    {formatTopsheet(product.topsheet)}
                  </div>
                )}
              </div>
            )}
            {!isRubber && (product.composition || product.weightMin) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 6, fontSize: 13, color: "var(--ps-ink-2)" }}>
                {product.composition && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Aufbau</span>
                    {product.composition}
                  </div>
                )}
                {product.layers && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Furniere</span>
                    {product.layers}
                  </div>
                )}
                {product.weightMin && product.weightMax && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Gewicht</span>
                    {product.weightMin}–{product.weightMax} g
                  </div>
                )}
                {product.stiffness && (
                  <div>
                    <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--ps-ink-4)", marginRight: 6, textTransform: "uppercase" }}>Steifigkeit</span>
                    {product.stiffness}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Hersteller-Beschreibung */}
        {product.description && (
          <section style={{ marginBottom: 40 }}>
            <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 14, lineHeight: 1.1 }}>
              Hersteller-Beschreibung
            </h2>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              {product.description}
            </p>
          </section>
        )}

        {/* Was Spieler sagen */}
        {product.communityDescription && (
          <section style={{ marginBottom: 40 }}>
            <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 14, lineHeight: 1.1 }}>
              Was Spieler sagen
            </h2>
            <div className="card-forged" style={{ padding: 22 }}>
              <p style={{ color: "var(--ps-ink-1)", fontSize: 15, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                „{product.communityDescription}"
              </p>
              <p className="ff-mono" style={{ marginTop: 12, fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Aggregiert aus {product.reviewCount} Community-Reviews
              </p>
            </div>
          </section>
        )}

        {/* TTR-Range */}
        {product.ttrMin && product.ttrMax && (
          <section style={{ marginBottom: 40 }}>
            <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 14, lineHeight: 1.1 }}>
              Für welche Spielstärke?
            </h2>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Empfohlener TTR-Bereich: <strong style={{ color: "var(--ps-ember-2)" }}>{product.ttrMin}–{product.ttrMax}</strong>
              {product.ttrOptimal && <> · Optimum bei <strong style={{ color: "var(--ps-ember-2)" }}>{product.ttrOptimal}</strong></>}.
              {product.playStyle && formatPlayStyle(product.playStyle) && (
                <> Spielstil: <strong style={{ color: "var(--ps-ink-1)" }}>{formatPlayStyle(product.playStyle)}</strong>.</>
              )}
            </p>
          </section>
        )}

        {/* Top-Synergien */}
        {synergies.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 6, lineHeight: 1.1 }}>
              {isRubber ? "Top-Hölzer für diesen Belag" : "Top-Beläge für dieses Holz"}
            </h2>
            <p style={{ margin: "0 0 18px", color: "var(--ps-ink-3)", fontSize: 13.5 }}>
              Die Synergie-Engine bewertet jede Holz-Belag-Kombination 0–100. Hier die besten Treffer aus über 470.000 Kombinationen.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              {synergies.map((s) => (
                <PartnerCard
                  key={`${s.type}-${s.id}`}
                  p={s}
                  kindLabel={s.type === "blade" ? "Holz" : "Belag"}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ähnliche Produkte */}
        {similar.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", marginBottom: 18, lineHeight: 1.1 }}>
              {isRubber ? "Ähnliche Beläge" : "Ähnliche Hölzer"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              {similar.map((p) => (
                <SimilarCard key={p.id} p={{ ...p, type: product.type }} />
              ))}
            </div>
          </section>
        )}

        {/* Berater-CTA */}
        <section
          className="card-forged"
          style={{
            padding: "26px 24px",
            background: "linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,107,53,0.03))",
            border: "1px solid rgba(255,107,53,0.35)",
            display: "flex", flexDirection: "column", gap: 14,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          <h2 className="ff-display" style={{ fontSize: 24, color: "var(--ps-ink-0)", margin: 0, lineHeight: 1.2 }}>
            Passt {product.name} zu dir?
          </h2>
          <p style={{ margin: 0, color: "var(--ps-ink-2)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 540, alignSelf: "center" }}>
            Frag den Berater — er kennt deinen TTR-Bereich, deinen Spielstil und gleicht das mit den Stärken und Schwächen dieses Produkts ab.
          </p>
          <Link
            href="/#berater-section"
            className="ember-btn ember-btn-glow"
            style={{ alignSelf: "center", padding: "12px 22px", fontSize: 14, textDecoration: "none", display: "inline-flex", gap: 8 }}
          >
            Berater fragen →
          </Link>
        </section>

        {/* Datenquelle */}
        {product.sourceUrl && (
          <p className="ff-mono" style={{ marginTop: 32, textAlign: "center", fontSize: 9.5, color: "var(--ps-ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Daten teils aus revspin.net + Hersteller-Datenblättern · Normiert 1.0–10.0
          </p>
        )}
      </div>
    </article>
  );
}
