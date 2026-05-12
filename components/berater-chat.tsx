"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";

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

interface SetupGroup {
  index: number;
  title: string;
  description?: string;
  synergyScore?: number | null;
  products: DetectedProduct[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Nur bei assistant-Nachrichten: erkannte Produkte mit Shop-Links (Fallback) */
  products?: DetectedProduct[];
  /** Setup-Gruppen wenn der Berater 1./2./3. Setups vorgeschlagen hat */
  setups?: SetupGroup[];
}

// Rendert **fett**, *kursiv* und einfache Listen aus Markdown-Text
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      parts.push(<strong key={key++} style={{ color: "var(--ps-ink-0)", fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function formatText(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    const isEmpty = trimmed === "";
    const isBullet = /^[--•]/.test(trimmed);
    const isNumbered = /^\d+\./.test(trimmed);
    const isArrow = trimmed.startsWith("→");

    if (isEmpty) return <br key={i} />;

    const content = isBullet
      ? trimmed.replace(/^[--•]\s*/, "")
      : isArrow
        ? trimmed
        : line;

    return (
      <span
        key={i}
        style={{
          display: "block",
          marginTop: (isBullet || isNumbered || isArrow) ? "4px" : i === 0 ? 0 : "2px",
          paddingLeft: isBullet ? "1em" : isArrow ? "0.5em" : 0,
          textIndent: isBullet ? "-1em" : 0,
          color: isArrow ? "var(--ps-ember-2)" : undefined,
        }}
      >
        {isBullet && <span style={{ color: "var(--ps-ember)", marginRight: 6 }}>·</span>}
        {renderInline(content)}
      </span>
    );
  });
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            display: "block",
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--ps-ember-2)",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mini-Komponenten für SetupCard v2
// ─────────────────────────────────────────────────────────────────────────

/** Mini-Synergie-Ring für die Karte. Visualisiert 0-100. */
function MiniSynergyRing({ value }: { value: number }) {
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ps-bg-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#miniRingGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        />
        <defs>
          <linearGradient id="miniRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8c5a" />
            <stop offset="100%" stopColor="#c84a1e" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-ink-0)", lineHeight: 1, fontFamily: "var(--font-bebas), sans-serif" }}>{value}</div>
        <div className="ff-mono" style={{ fontSize: 7, color: "var(--ps-ink-3)", letterSpacing: "0.08em", marginTop: 1 }}>/100</div>
      </div>
    </div>
  );
}

/** Mini-Produktbild mit Fallback auf Manufacturer-Initiale. */
function MiniProductImage({ url, manufacturer, size = 36 }: { url?: string | null; manufacturer: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const initial = manufacturer.charAt(0).toUpperCase();

  if (!url || errored) {
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={manufacturer}
      onError={() => setErrored(true)}
      style={{
        width: size, height: size,
        borderRadius: 3,
        objectFit: "cover",
        border: "1px solid var(--ps-line)",
        background: "var(--ps-bg-2)",
        flexShrink: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SetupCards v2, Conversion-optimiert
// - Synergie-Score-Ring (Authority)
// - Mini-Bilder + Reviews-Counts (Visualisierung + Social Proof)
// - Begründungstext (Personalisierung)
// - Direct-Click zum besten Shop (weniger Reibung)
// - Sub-Link "Andere Shops" → Modal (Wahlfreiheit)
// - Trust-Mikrotext direkt am Button (Transparenz)
// ─────────────────────────────────────────────────────────────────────────

function SetupCards({
  setups, fallbackProducts, lang,
}: {
  setups?: SetupGroup[];
  fallbackProducts?: DetectedProduct[];
  lang: "de" | "en";
}) {
  const [openSetup, setOpenSetup] = useState<SetupGroup | null>(null);

  const adLabel = lang === "de" ? "Werbung · Affiliate" : "Ad · affiliate";

  // Wenn der Berater Setups strukturiert ausgibt → v2 Karten zeigen
  if (setups && setups.length > 0) {
    return (
      <>
        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px dashed var(--ps-line)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div className="ff-mono" style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--ps-ink-3)", display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--ps-ember-2)" }}>
              {lang === "de" ? `${setups.length} Setup${setups.length > 1 ? "s" : ""} zur Auswahl` : `${setups.length} setup${setups.length > 1 ? "s" : ""} to choose from`}
            </span>
            <span style={{ color: "var(--ps-ink-4)", fontSize: 9 }}>{adLabel}</span>
          </div>

          {setups.map((setup) => {
            const blade = setup.products.find((p) => p.type === "blade");
            const setupRubbers = setup.products.filter((p) => p.type === "rubber");
            const primaryShop = setup.products.find((p) => p.shops.length > 0)?.shops[0];

            // Aller Produkte in einem Direkt-Click öffnen (mit Verzögerung um Popup-Blocker zu umgehen)
            const openAllInTabs = () => {
              setup.products.forEach((p, i) => {
                if (p.shops.length === 0) return;
                setTimeout(() => {
                  window.open(p.shops[0]!.url, "_blank", "noopener");
                }, i * 150);
              });
            };

            return (
              <div
                key={setup.index}
                style={{
                  background: "var(--ps-bg-2)",
                  border: "1px solid var(--ps-line)",
                  borderRadius: 4,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Header: Setup-Nummer + Title + Synergie-Ring */}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 4 }}>
                      Setup 0{setup.index}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-ink-0)", lineHeight: 1.3 }}>
                      {setup.title}
                    </div>
                    {setup.description && setup.description.length > 10 && (
                      <p style={{
                        margin: "8px 0 0", fontSize: 12.5,
                        color: "var(--ps-ink-2)", lineHeight: 1.5,
                        fontStyle: "italic",
                      }}>
                        {setup.description}
                      </p>
                    )}
                  </div>
                  {setup.synergyScore != null && (
                    <div style={{ flexShrink: 0 }}>
                      <MiniSynergyRing value={setup.synergyScore} />
                    </div>
                  )}
                </div>

                {/* Komponentenliste mit Bildern + Reviews */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {blade && <SetupComponentRow product={blade} label={lang === "de" ? "Holz" : "Blade"} />}
                  {setupRubbers.map((r, i) => (
                    <SetupComponentRow
                      key={`${r.id}-${i}`}
                      product={r}
                      label={setupRubbers.length === 1 ? (lang === "de" ? "Belag" : "Rubber") : i === 0 ? "VH" : "RH"}
                    />
                  ))}
                </div>

                {/* Direct-Click-Hauptbutton + Sub-Link */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {primaryShop ? (
                    <button
                      onClick={openAllInTabs}
                      className="ember-btn ember-btn-glow"
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                      }}
                    >
                      {lang === "de"
                        ? `Setup bei ${primaryShop.name} holen`
                        : `Get this setup at ${primaryShop.name}`} →
                    </button>
                  ) : (
                    <div style={{
                      padding: "10px 14px", textAlign: "center",
                      background: "var(--ps-bg-3)", border: "1px dashed var(--ps-line)",
                      color: "var(--ps-ink-3)", fontSize: 12, borderRadius: 3,
                    }}>
                      {lang === "de" ? "Shop folgt" : "Shop coming soon"}
                    </div>
                  )}

                  <button
                    onClick={() => setOpenSetup(setup)}
                    style={{
                      background: "transparent", border: 0,
                      color: "var(--ps-ink-3)", fontSize: 11.5, padding: "4px",
                      cursor: "pointer", textDecoration: "underline",
                      fontFamily: "inherit",
                    }}
                  >
                    {lang === "de" ? "Andere Shops vergleichen" : "Compare other shops"} →
                  </button>
                </div>

                {/* Trust-Mikrotext */}
                <div className="ff-mono" style={{
                  fontSize: 9, letterSpacing: "0.1em",
                  color: "var(--ps-ink-4)", textAlign: "center",
                  textTransform: "uppercase",
                }}>
                  {lang === "de"
                    ? "Werbung · Du zahlst nichts mehr · 30 Tage Bedenkzeit"
                    : "Ad · You pay nothing extra · 30 days to decide"}
                </div>
              </div>
            );
          })}
        </div>

        {openSetup && <SetupModal setup={openSetup} lang={lang} onClose={() => setOpenSetup(null)} />}
      </>
    );
  }

  // Fallback: keine Setups erkennbar → flache Produktliste (alt)
  if (!fallbackProducts || fallbackProducts.length === 0) return null;

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px dashed var(--ps-line)",
    }}>
      <div className="ff-mono" style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "var(--ps-ink-3)", marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>🛒 {lang === "de" ? "Erwähnte Produkte" : "Mentioned products"}</span>
        <span style={{ color: "var(--ps-ink-4)", fontSize: 9 }}>{adLabel}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fallbackProducts.map((p) => (
          <div key={`${p.type}:${p.id}`} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12.5 }}>
            <span style={{ color: "var(--ps-ink-1)", marginRight: 4 }}>
              <strong style={{ color: "var(--ps-ink-0)", fontWeight: 600 }}>{p.name}</strong>
              <span style={{ color: "var(--ps-ink-3)", marginLeft: 6, fontSize: 11 }}>{p.manufacturer}</span>
            </span>
            {p.shops.length === 0 ? (
              <span style={{ color: "var(--ps-ink-4)", fontSize: 11 }}>{lang === "de" ? "Shop folgt" : "shop coming"}</span>
            ) : (
              p.shops.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="sponsored noopener"
                  style={{
                    background: "var(--ps-bg-3)", border: "1px solid var(--ps-line)",
                    color: "var(--ps-ember-2)", padding: "3px 9px", borderRadius: 3,
                    fontSize: 11.5, textDecoration: "none",
                    fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap",
                  }}>
                  {s.name} →
                </a>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Eine Komponenten-Zeile (Holz oder Belag) mit Bild, Name, Reviews
function SetupComponentRow({ product, label }: { product: DetectedProduct; label: string }) {
  const detailHref = product.slug
    ? (product.type === "blade" ? `/holz/${product.slug}` : `/belag/${product.slug}`)
    : null;

  const inner = (
    <>
      <MiniProductImage url={product.imageUrl} manufacturer={product.manufacturer} size={36} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="ff-mono" style={{
          fontSize: 9, letterSpacing: "0.12em",
          color: "var(--ps-ink-4)", textTransform: "uppercase", marginBottom: 2,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ps-ink-1)", lineHeight: 1.25 }}>
          <strong style={{ color: "var(--ps-ink-0)", fontWeight: 600 }}>{product.name}</strong>
          {(product.reviewCount ?? 0) > 0 && (
            <span style={{ color: "var(--ps-ink-4)", marginLeft: 8, fontSize: 10.5 }}>
              ★ {product.reviewCount}
            </span>
          )}
        </div>
      </div>
      {detailHref && (
        <span style={{ color: "var(--ps-ember-2)", fontSize: 13, flexShrink: 0 }}>→</span>
      )}
    </>
  );

  if (detailHref) {
    return (
      <a
        href={detailHref}
        target="_blank"
        rel="noopener"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "inherit",
          padding: "4px 6px",
          margin: "-4px -6px",
          borderRadius: 3,
          transition: "background 140ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {inner}
      </a>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{inner}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SetupModal, Kauf-Funnel-Step nach Setup-Auswahl
// ─────────────────────────────────────────────────────────────────────────

function SetupModal({ setup, lang, onClose }: { setup: SetupGroup; lang: "de" | "en"; onClose: () => void }) {
  // ESC schließt
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const headline = lang === "de" ? "Hier gibts dein Setup" : "Here's your setup";
  const subline = lang === "de"
    ? "Drei Teile, drei Klicks. Wir kassieren eine Provision vom Shop, du zahlst nichts extra."
    : "Three parts, three clicks. We get a commission from the shop, you pay nothing extra.";
  const productLabel = (p: DetectedProduct, idx: number, total: number) => {
    if (p.type === "blade") return lang === "de" ? "Holz" : "Blade";
    if (total === 1) return lang === "de" ? "Belag" : "Rubber";
    return idx === 0 ? "VH" : "RH";
  };
  const rubbers = setup.products.filter((p) => p.type === "rubber");
  const blade = setup.products.find((p) => p.type === "blade");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(8,8,10,0.78)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-forged"
        style={{
          background: "var(--ps-bg-1)",
          maxWidth: 540, width: "100%",
          padding: 0,
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--ps-line-2)", position: "relative" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "transparent", border: "1px solid var(--ps-line-2)",
              color: "var(--ps-ink-3)", borderRadius: 4, padding: "4px 9px",
              cursor: "pointer", fontSize: 14,
            }}
            aria-label="close"
          >✕</button>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 8 }}>
            Setup 0{setup.index}
          </div>
          <h3 className="ff-display" style={{ fontSize: 26, lineHeight: 1.1, margin: "0 0 8px", color: "var(--ps-ink-0)" }}>
            {headline}
          </h3>
          <p style={{ margin: 0, color: "var(--ps-ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>
            {subline}
          </p>
        </div>

        {/* Produktliste */}
        <div style={{ padding: "18px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {[blade, ...rubbers].filter(Boolean).map((p, i, arr) => {
            if (!p) return null;
            const rubberIdx = p.type === "rubber" ? rubbers.indexOf(p) : 0;
            const label = productLabel(p, rubberIdx, rubbers.length);
            return (
              <div key={`${p.type}-${p.id}-${i}`} style={{
                background: "var(--ps-bg-2)",
                border: "1px solid var(--ps-line)",
                borderRadius: 4,
                padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ember-2)", textTransform: "uppercase", marginBottom: 3 }}>
                      {String(i + 1).padStart(2, "0")} · {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-ink-0)" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ps-ink-3)", marginTop: 2 }}>
                      {p.manufacturer}
                    </div>
                  </div>
                </div>
                {p.shops.length === 0 ? (
                  <div className="ff-mono" style={{ fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.1em" }}>
                    {lang === "de" ? "Shop folgt" : "shop coming"}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {p.shops.map((s, si) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="sponsored noopener"
                        className={si === 0 ? "ember-btn" : undefined}
                        style={si === 0
                          ? { padding: "8px 14px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }
                          : {
                              background: "var(--ps-bg-3)", border: "1px solid var(--ps-line)",
                              color: "var(--ps-ink-1)", padding: "8px 12px", borderRadius: 3,
                              fontSize: 12, textDecoration: "none",
                              display: "inline-flex", alignItems: "center", gap: 6,
                            }}
                      >
                        {s.name} →
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="ff-mono" style={{
          padding: "12px 28px 18px",
          borderTop: "1px solid var(--ps-line-2)",
          fontSize: 9.5, letterSpacing: "0.14em",
          color: "var(--ps-ink-4)", textTransform: "uppercase",
          textAlign: "center",
        }}>
          {lang === "de"
            ? "Werbung · Affiliate-Links · Du zahlst keinen Cent extra"
            : "Ad · affiliate links · You pay nothing extra"}
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, userLabel, lang }: { msg: Message; userLabel: string; lang: "de" | "en" }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: "linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))",
          border: "1px solid rgba(255,107,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ps-ember-2)", fontSize: 14,
        }}>
          🔨
        </div>
      )}

      <div style={{
        maxWidth: "78%",
        padding: "12px 14px",
        background: isUser
          ? "linear-gradient(180deg, #ff7a45, var(--ps-ember-deep))"
          : "var(--ps-bg-2)",
        color: isUser ? "#1a0d05" : "var(--ps-ink-0)",
        border: isUser ? "1px solid #ff8b56" : "1px solid var(--ps-line)",
        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        fontSize: 14.5, lineHeight: 1.55,
        boxShadow: isUser ? "0 4px 16px rgba(255,107,53,0.25)" : "none",
      }}>
        {formatText(msg.content)}
        {!isUser && (
          (msg.setups && msg.setups.length > 0) ||
          (msg.products && msg.products.length > 0)
        ) && (
          <SetupCards setups={msg.setups} fallbackProducts={msg.products} lang={lang} />
        )}
      </div>

      {isUser && (
        <div style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: "var(--ps-bg-3)", border: "1px solid var(--ps-line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ps-ink-2)", fontSize: 10, fontWeight: 600,
          fontFamily: "var(--font-jetbrains), monospace",
        }}>
          {userLabel}
        </div>
      )}
    </div>
  );
}

export function BeraterChat({ initialMessage }: { initialMessage?: string | null } = {}) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t.berater.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialSentRef = useRef(false);

  // Greeting nachladen wenn Sprache wechselt UND noch keine User-Nachricht da ist
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMsg = prev.some((m) => m.role === "user");
      if (hasUserMsg) return prev; // laufendes Gespräch nicht zerstören
      return [{ role: "assistant", content: t.berater.greeting }];
    });
  }, [lang, t.berater.greeting]);

  // Pre-Fill-Listener: alter Schnell-Check (TTR + Stil), nur Text vorbefüllen
  useEffect(() => {
    function onPrefill(e: Event) {
      const detail = (e as CustomEvent<{
        ttr: number;
        playStyle: string;
        styleLabel: string;
        lang: "de" | "en";
      }>).detail;
      if (!detail) return;
      const text = detail.lang === "en"
        ? `My TTR is ${detail.ttr}, I play ${detail.styleLabel.toLowerCase()}. `
        : `Mein TTR ist ${detail.ttr}, ich spiele ${detail.styleLabel.toLowerCase()}. `;
      setInput(text);
      setTimeout(() => {
        inputRef.current?.focus();
        const len = text.length;
        inputRef.current?.setSelectionRange(len, len);
      }, 700);
    }
    window.addEventListener("pongsmith:prefill", onPrefill);
    return () => window.removeEventListener("pongsmith:prefill", onPrefill);
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Ref auf die aktuelle send-Funktion (für Event-Listener mit stabiler Identität)
  const sendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  // Auto-Send-Listener: Problem-Express schickt direkt eine Start-Nachricht
  useEffect(() => {
    function onSendDirect(e: Event) {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      if (!detail?.message) return;
      // Kurz warten bis Scroll fertig
      setTimeout(() => {
        void sendRef.current(detail.message);
      }, 500);
    }
    window.addEventListener("pongsmith:send-direct", onSendDirect);
    return () => window.removeEventListener("pongsmith:send-direct", onSendDirect);
  }, []);

  // Initial-Message: wenn der BeraterFlow eine vorbefüllte Nachricht übergibt
  // (z.B. aus dem Vorab-Setup-Form), einmalig automatisch senden.
  useEffect(() => {
    if (initialMessage && !initialSentRef.current) {
      initialSentRef.current = true;
      setTimeout(() => {
        void sendRef.current(initialMessage);
      }, 350);
    }
  }, [initialMessage]);

  async function send(directText?: string) {
    const text = (directText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          lang,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        products?: DetectedProduct[];
        setups?: SetupGroup[];
      };
      if (data.error) {
        setApiError(data.error);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.text ?? "",
          products: data.products,
          setups: data.setups,
        }]);
      }
    } catch {
      setApiError(t.berater.error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  // sendRef nach jedem Render aktualisieren, die Event-Listener nutzen dann
  // immer die aktuelle Closure (mit aktuellem messages/loading-State)
  sendRef.current = send;

  // Quick suggestions je Sprache
  const suggestions = lang === "de"
    ? [
      "1.280 TTR, VH-dominant, 100-200 €",
      "Allround, Block hält nicht stabil",
      "Defensiv, Kontrolle wichtiger als Tempo",
    ]
    : [
      "1,280 TTR, FH-dominant, €100-200 budget",
      "Allround, my block isn't stable",
      "Defensive, control over speed",
    ];

  const headerTitle = lang === "de" ? "Dein Schmied" : "Your Smith";
  const onlineLabel = lang === "de"
    ? "Online · antwortet in Sekunden"
    : "Online · replies in seconds";
  const userLabel = lang === "de" ? "DU" : "YOU";
  const sendHint = lang === "de" ? "⏎ senden · ⇧⏎ neue Zeile" : "⏎ send · ⇧⏎ new line";

  return (
    <div className="card-forged" style={{ display: "flex", height: "100%", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid var(--ps-line-2)", padding: "14px 20px",
        background: "var(--ps-bg-1)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 4,
          background: "linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))",
          border: "1px solid rgba(255,107,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🔨</div>
        <div>
          <div className="ff-display" style={{ fontSize: 20, lineHeight: 1, color: "var(--ps-ink-0)" }}>{headerTitle}</div>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ps-ink-3)", marginTop: 3 }}>
            <span style={{ color: "var(--ps-good)" }}>●</span> {onlineLabel}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} userLabel={userLabel} lang={lang} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4, flexShrink: 0,
              background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🔨</div>
            <div style={{
              padding: "12px 16px",
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              borderRadius: "4px 12px 12px 12px",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        {apiError && (
          <div style={{
            borderRadius: 4, border: "1px solid rgba(217,106,90,0.4)",
            background: "rgba(217,106,90,0.08)", padding: "12px 16px",
            fontSize: 13, color: "var(--ps-bad)",
          }}>
            {apiError}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ padding: "8px 20px 0", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setInput(s)}
            style={{
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              color: "var(--ps-ink-1)", padding: "5px 10px",
              borderRadius: 999, fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--ps-line-2)", padding: "12px 16px 16px" }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
          borderRadius: 4, padding: 6,
        }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.berater.placeholder}
            disabled={loading}
            style={{
              flex: 1, background: "transparent", border: 0,
              color: "var(--ps-ink-0)", fontSize: 14.5,
              resize: "none", outline: "none", padding: "8px 6px",
              minHeight: 22, maxHeight: 100,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="ember-btn"
            style={{ padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
            aria-label={t.berater.send}
          >
            ➤ {t.berater.send}
          </button>
        </div>
        <p className="ff-mono" style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.06em" }}>
          {sendHint}
        </p>
      </div>
    </div>
  );
}
