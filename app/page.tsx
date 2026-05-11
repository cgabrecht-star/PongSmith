"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BeraterFlow } from "@/components/berater-flow";
import { ProblemExpress } from "@/components/problem-express";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/i18n";

// Alte lokale `T`-Konstante entfernt — wird jetzt aus lib/i18n.ts via useLanguage gezogen.
// Section-Komponenten unten erhalten die `t` als Prop, sind weiterhin selbst-enthaltend.
type LegacyLang = Lang;

// ─────────────────────────────────────────────
// Sparks
// ─────────────────────────────────────────────
function SparksLayer({ count = 14 }: { count?: number }) {
  const sparks = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      left: 5 + Math.random() * 55,
      bottom: Math.random() * 40,
      dur: 2.5 + Math.random() * 2.5,
      del: Math.random() * 4,
      sx: (Math.random() - 0.5) * 30,
      size: 2 + Math.random() * 2,
    })), [count]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {sparks.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{
            left: `${s.left}%`,
            bottom: `${s.bottom}px`,
            "--dur": `${s.dur}s`,
            "--del": `${s.del}s`,
            "--sx": `${s.sx}px`,
            width: `${s.size}px`,
            height: `${s.size}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Synergy Ring
// ─────────────────────────────────────────────
function SynergyRing({ value, size = 96, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const dur = 800;
    const step = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg className="ring-svg" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ps-bg-4)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#emberRingGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        />
        <defs>
          <linearGradient id="emberRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8c5a" />
            <stop offset="100%" stopColor="#c84a1e" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div className="ff-display" style={{ fontSize: size * 0.34, lineHeight: 1, color: "var(--ps-ink-0)" }}>{shown}</div>
        <div className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ink-3)", marginTop: 2 }}>/100</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ForgeMark Logo
// ─────────────────────────────────────────────
function ForgeMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 14h16a4 4 0 0 1 4 4H8" stroke="var(--ps-ink-0)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 18v3M7 22h17l-2 4H9z" stroke="var(--ps-ink-0)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="1.4" fill="var(--ps-ember)" />
      <path d="M24 4v2M24 10v2M20 8h2M26 8h2" stroke="var(--ps-ember)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Section label
// ─────────────────────────────────────────────
function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ps-ember-2)" }}>§ {n}</span>
      <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ps-ink-2)" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--ps-line-2)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────
function TopBar() {
  const { t, lang } = useLanguage();
  const navItems = [
    { id: "hero-section", label: t.nav.start },
    { id: "berater-section", label: t.nav.berater },
    { id: "check-section", label: t.nav.check },
  ];

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <header className="glass-bar" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px" }}>
        {/* Logo */}
        <button
          onClick={() => scrollTo("hero-section")}
          style={{ background: "transparent", border: 0, padding: 0, display: "flex", alignItems: "center", gap: 10, color: "var(--ps-ink-0)", cursor: "pointer" }}
        >
          <ForgeMark size={26} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <span className="ff-display" style={{ fontSize: 22, letterSpacing: "0.04em" }}>PONGSMITH</span>
            <span className="ff-mono" style={{ fontSize: 8.5, letterSpacing: "0.22em", color: "var(--ps-ember-2)", marginTop: 2 }}>DIE TT-SCHMIEDE</span>
          </div>
        </button>

        <div style={{ flex: 1 }} />

        {/* Desktop Nav */}
        <nav className="hide-mobile" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navItems.map((it) => (
            <button
              key={it.id}
              onClick={() => scrollTo(it.id)}
              style={{
                background: "transparent",
                border: "1px solid transparent",
                color: "var(--ps-ink-2)",
                padding: "8px 12px",
                borderRadius: 3,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 160ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ps-ink-0)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ps-ink-2)")}
            >
              {it.label}
            </button>
          ))}
          <a
            href="/sortiment"
            style={{
              background: "transparent", border: "1px solid transparent",
              color: "var(--ps-ink-2)", padding: "8px 12px", borderRadius: 3,
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              transition: "color 160ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ps-ink-0)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ps-ink-2)")}
          >
            {t.nav.sortiment}
          </a>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// Mobile Bottom Bar
// ─────────────────────────────────────────────
function MobileBottomBar() {
  const { t } = useLanguage();
  const items = [
    { label: t.nav.start, id: "hero-section", icon: "⊙" },
    { label: t.nav.berater, id: "berater-section", icon: "◈" },
    { label: t.nav.check, id: "check-section", icon: "◐" },
  ];
  const scroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div
      className="show-mobile"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
        background: "rgba(14,14,14,0.92)", backdropFilter: "blur(14px)",
        borderTop: "1px solid var(--ps-line-2)", display: "flex",
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => scroll(it.id)}
          style={{
            flex: 1, background: "transparent", border: 0,
            color: "var(--ps-ink-3)",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 4px", fontSize: 10, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 18 }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────
function Hero() {
  const t = useLanguage().t.hero;
  const scrollToBerater = () => {
    const el = document.getElementById("berater-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToHow = () => {
    const el = document.getElementById("how-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="hero-section" className="forge-bg" style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--ps-line-2)" }}>
      {/* Forge glow floor */}
      <div style={{
        position: "absolute", left: "50%", bottom: "-40%", transform: "translateX(-50%)",
        width: "120%", height: "70%",
        background: "radial-gradient(ellipse at center, rgba(255,107,53,0.18), rgba(255,107,53,0.05) 40%, transparent 65%)",
        filter: "blur(30px)", pointerEvents: "none",
      }} />

      {/* Hero-Visual entfernt — Design-Refresh kommt später */}

      <SparksLayer count={16} />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", padding: "80px 20px 100px" }}>
        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span className="tag-line tag-ember" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            🔥 {t.kicker}
          </span>
          <span className="tag-line">✓ Q-TTR 1.000–1.700</span>
        </div>

        {/* Headline */}
        <h1
          className="ff-display"
          style={{ fontSize: "clamp(56px, 9vw, 132px)", lineHeight: 0.92, letterSpacing: "0.005em", margin: 0, fontWeight: 400 }}
        >
          <span style={{ display: "block" }}>{t.line1}</span>
          <span style={{ display: "block", color: "var(--ps-ember-2)" }}>{t.line2}</span>
          <span style={{ display: "block" }}>{t.line3}</span>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 18, lineHeight: 1.55, color: "var(--ps-ink-2)", maxWidth: 560, margin: "24px 0 0" }}>
          {t.sub}
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginTop: 32 }}>
          <button
            className="ember-btn ember-btn-glow"
            onClick={scrollToBerater}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 15, padding: "14px 24px" }}
          >
            {t.cta} →
          </button>
          <button
            onClick={scrollToHow}
            style={{
              background: "transparent", border: "1px solid var(--ps-line)", color: "var(--ps-ink-1)",
              padding: "14px 18px", borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}
          >
            {t.ctaSecondary} →
          </button>
        </div>

        {/* Stats */}
        <div className="anvil-divider-strong" style={{ margin: "48px 0 32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          {[
            { v: t.stat1v, l: t.stat1l },
            { v: t.stat2v, l: t.stat2l },
            { v: t.stat3v, l: t.stat3l },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="ff-display" style={{ fontSize: 36, color: "var(--ps-ink-0)", lineHeight: 1 }}>{s.v}</div>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ps-ink-3)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Affiliate-Transparenz (direkt unter Hero, beantwortet "verdient ihr was?")
// ─────────────────────────────────────────────
function AffiliateBlock() {
  const t = useLanguage().t.affiliate;
  return (
    <section style={{ padding: "60px 20px", background: "var(--ps-bg-1)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ps-ember-2)", textTransform: "uppercase" }}>
          {t.kicker}
        </span>
        <h2 className="ff-display" style={{ fontSize: "clamp(28px, 4vw, 42px)", margin: "12px 0 18px", lineHeight: 1.15, fontWeight: 400, color: "var(--ps-ink-0)" }}>
          {t.title}
        </h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 16, lineHeight: 1.65, maxWidth: 720, margin: "0 auto 18px" }}>
          {t.body}
        </p>
        <a
          href="/datenschutz#affiliates"
          style={{
            color: "var(--ps-ember-2)",
            fontSize: 13,
            textDecoration: "none",
            borderBottom: "1px solid rgba(255,107,53,0.4)",
            paddingBottom: 1,
          }}
        >
          {t.moreLink} →
        </a>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Demo / Beispielberatung — vor dem echten Berater
// ─────────────────────────────────────────────
function DemoSection() {
  const t = useLanguage().t.demo;
  const scrollToBerater = () => {
    const el = document.getElementById("berater-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Inline-Renderer für **fett** und Zeilenumbrüche
  const renderInline = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, li) => {
      if (line.trim() === "") return <br key={li} />;
      const parts: React.ReactNode[] = [];
      const re = /\*\*(.+?)\*\*/g;
      let last = 0;
      let m: RegExpExecArray | null;
      let ki = 0;
      while ((m = re.exec(line)) !== null) {
        if (m.index > last) parts.push(line.slice(last, m.index));
        parts.push(<strong key={ki++} style={{ color: "var(--ps-ink-0)" }}>{m[1]}</strong>);
        last = m.index + m[0].length;
      }
      if (last < line.length) parts.push(line.slice(last));
      const isBullet = line.trim().startsWith("·");
      return (
        <span
          key={li}
          style={{
            display: "block",
            marginTop: li === 0 ? 0 : 4,
            paddingLeft: isBullet ? "1em" : 0,
          }}
        >
          {parts}
        </span>
      );
    });
  };

  return (
    <section style={{ padding: "70px 20px 50px", background: "var(--ps-bg-0)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ps-ember-2)", textTransform: "uppercase" }}>
            {t.kicker}
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--ps-line-2)" }} />
        </div>
        <h2 className="ff-display" style={{ fontSize: "clamp(28px, 4vw, 42px)", margin: "0 0 10px", lineHeight: 1.1, fontWeight: 400 }}>{t.title}</h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 15.5, margin: "0 0 28px", maxWidth: 560 }}>{t.sub}</p>

        {/* Mock-Chat */}
        <div className="card-forged" style={{ position: "relative", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Demo-Badge oben rechts */}
          <span
            className="ff-mono"
            style={{
              position: "absolute", top: 14, right: 14,
              fontSize: 9, letterSpacing: "0.2em",
              padding: "3px 8px", borderRadius: 3,
              background: "rgba(255,107,53,0.10)",
              border: "1px solid rgba(255,107,53,0.35)",
              color: "var(--ps-ember-2)",
            }}
          >
            {t.badge}
          </span>

          {t.messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && (
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 4,
                    background: "linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))",
                    border: "1px solid rgba(255,107,53,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--ps-ember-2)", fontSize: 14,
                  }}>🔨</div>
                )}
                <div style={{
                  maxWidth: "82%",
                  padding: "12px 14px",
                  background: isUser ? "linear-gradient(180deg, #ff7a45, var(--ps-ember-deep))" : "var(--ps-bg-2)",
                  color: isUser ? "#1a0d05" : "var(--ps-ink-0)",
                  border: isUser ? "1px solid #ff8b56" : "1px solid var(--ps-line)",
                  borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                  fontSize: 14.5, lineHeight: 1.55,
                }}>
                  {renderInline(msg.text)}
                </div>
                {isUser && (
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 4,
                    background: "var(--ps-bg-3)", border: "1px solid var(--ps-line)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--ps-ink-2)", fontSize: 10, fontWeight: 600,
                    fontFamily: "var(--font-jetbrains), monospace",
                  }}>M</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button
            onClick={scrollToBerater}
            className="ember-btn ember-btn-glow"
            style={{ padding: "12px 22px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            {t.tryNowLabel} →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Founder-Sektion — wer steht dahinter
// ─────────────────────────────────────────────
function FounderSection() {
  const t = useLanguage().t.founder;
  const [imgError, setImgError] = useState(false);

  // Initialen aus Namen ableiten
  const initials = t.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <section className="forge-bg" style={{ padding: "70px 20px 60px", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ps-ember-2)", textTransform: "uppercase" }}>
            {t.kicker}
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--ps-line-2)" }} />
        </div>
        <h2 className="ff-display" style={{ fontSize: "clamp(28px, 4vw, 42px)", margin: "0 0 28px", lineHeight: 1.1, fontWeight: 400 }}>{t.title}</h2>

        <div className="card-forged" style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
          padding: 28,
          alignItems: "flex-start",
        }}>
          {/* Avatar */}
          <div style={{
            width: 160, height: 160,
            borderRadius: 4,
            background: imgError
              ? "linear-gradient(135deg, var(--ps-ember-deep), var(--ps-ember))"
              : "var(--ps-bg-2)",
            border: "1px solid var(--ps-line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {imgError ? (
              <span className="ff-display" style={{ fontSize: 72, color: "#1a0d05", lineHeight: 1, letterSpacing: "0.04em" }}>
                {initials}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/founder-chris.jpg"
                alt={t.name}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          {/* Inhalt */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0, flex: "1 1 320px" }}>
            <div>
              <div className="ff-display" style={{ fontSize: 28, color: "var(--ps-ink-0)", lineHeight: 1.15 }}>
                {t.name}
              </div>
              <div style={{ color: "var(--ps-ember-2)", fontSize: 13.5, marginTop: 4 }}>
                {t.role}
              </div>
              <div className="ff-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginTop: 6 }}>
                {t.ageLine}
              </div>
            </div>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>
              {t.story}
            </p>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {t.contactLabel}
              </span>
              <a href={`mailto:${t.contactValue}`} style={{ color: "var(--ps-ember-2)", fontSize: 13.5, textDecoration: "none", borderBottom: "1px solid rgba(255,107,53,0.4)", paddingBottom: 1 }}>
                {t.contactValue}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Mithelfen-CTA — sympathischer Aufruf zum Daten-Beitragen
// ─────────────────────────────────────────────
function ContributeCta() {
  const tc = useLanguage().t.contribute;
  return (
    <section style={{ padding: "70px 20px", background: "var(--ps-bg-1)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="card-forged" style={{
          padding: "32px 28px",
          background: "linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,107,53,0.03))",
          border: "1px solid rgba(255,107,53,0.35)",
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🤝</span>
            <div className="ff-display" style={{ fontSize: 26, color: "var(--ps-ink-0)", lineHeight: 1.15 }}>
              {tc.ctaSection}
            </div>
          </div>
          <p style={{ margin: 0, color: "var(--ps-ink-2)", fontSize: 15, lineHeight: 1.6 }}>
            {tc.sub}
          </p>
          <a
            href="/mithelfen"
            className="ember-btn ember-btn-glow"
            style={{
              alignSelf: "flex-start",
              padding: "12px 22px",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            {tc.ctaButton} →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// "Was wir nicht tun" — Selbstverpflichtung
// ─────────────────────────────────────────────
function PromisesBlock() {
  const t = useLanguage().t.promises;
  return (
    <section style={{ padding: "90px 20px", background: "var(--ps-bg-0)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <SectionLabel n="05">{t.kicker}</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>{t.title}</h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px" }}>{t.sub}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {t.items.map((p, i) => (
            <div
              key={i}
              className="card-forged"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderLeft: "3px solid rgba(217,106,90,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                  {String(i + 1).padStart(2, "0")} / {String(t.items.length).padStart(2, "0")}
                </span>
              </div>
              <div className="ff-display" style={{ fontSize: 20, color: "var(--ps-ink-0)", lineHeight: 1.2 }}>{p.t}</div>
              <p style={{ color: "var(--ps-ink-2)", margin: 0, fontSize: 14, lineHeight: 1.55 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────
function HowItWorks() {
  const t = useLanguage().t.how;
  const icons = ["💬", "🪞", "🔨"];
  return (
    <section id="how-section" style={{ padding: "90px 20px", background: "var(--ps-bg-0)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <SectionLabel n="01">How it works</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>{t.title}</h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 48px" }}>{t.sub}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, background: "var(--ps-line-2)", border: "1px solid var(--ps-line-2)" }}>
          {t.steps.map((s, i) => (
            <div
              key={i}
              style={{ background: "var(--ps-bg-1)", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="ff-display" style={{ fontSize: 56, color: "var(--ps-ember)", lineHeight: 1 }}>{s.n}</span>
                <span style={{ fontSize: 22, opacity: 0.6 }}>{icons[i]}</span>
              </div>
              <div className="ff-display" style={{ fontSize: 28, lineHeight: 1, color: "var(--ps-ink-0)" }}>{s.t}</div>
              <p style={{ color: "var(--ps-ink-2)", margin: 0, fontSize: 15, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Trust Pillars
// ─────────────────────────────────────────────
function Trust() {
  const { t: tAll, lang } = useLanguage();
  const t = tAll.trust;
  const pillarIcons = ["📊", "👥", "🏓"];
  const pillarNums = lang === "de" ? ["SÄULE 01", "SÄULE 02", "SÄULE 03"] : ["PILLAR 01", "PILLAR 02", "PILLAR 03"];
  return (
    <section className="forge-bg" style={{ padding: "90px 20px", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <SectionLabel n="02">Why independent</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>{t.title}</h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px" }}>{t.sub}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {t.pillars.map((p, i) => (
            <div key={i} className="card-forged" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 2,
                  fontSize: 18,
                }}>
                  {pillarIcons[i]}
                </div>
                <span className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>{pillarNums[i]}</span>
              </div>
              <div className="ff-display" style={{ fontSize: 26, color: "var(--ps-ink-0)", lineHeight: 1.05 }}>{p.t}</div>
              <p style={{ color: "var(--ps-ink-2)", margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Berater Section
// ─────────────────────────────────────────────
function BeraterSection() {
  const t = useLanguage().t.berater;
  return (
    <section id="berater-section" style={{ padding: "90px 20px", background: "var(--ps-bg-0)", borderBottom: "1px solid var(--ps-line-2)", scrollMarginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SectionLabel n="03">{t.kicker}</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>
          {t.title}
        </h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px", maxWidth: 560 }}>{t.sub}</p>
        <div style={{ height: 560 }}>
          <BeraterFlow />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Schnell-Check Section
// ─────────────────────────────────────────────
function SchnellCheckSection() {
  const t = useLanguage().t.check;
  return (
    <section id="check-section" className="forge-bg" style={{ padding: "90px 20px", borderBottom: "1px solid var(--ps-line-2)", scrollMarginTop: 64 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <SectionLabel n="04">{t.kicker}</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>
          {t.title}
        </h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px", maxWidth: 560 }}>{t.sub}</p>
        <ProblemExpress />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
function FAQ() {
  const t = useLanguage().t.faq;
  const [open, setOpen] = useState(-1);

  // Schema.org FAQPage JSON-LD — für Rich-Snippets in Google-Suche
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section style={{ padding: "90px 20px", background: "var(--ps-bg-1)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)", gap: 60 }}>
        <div>
          <SectionLabel n="06">FAQ</SectionLabel>
          <h2 className="ff-display" style={{ fontSize: "clamp(36px, 4vw, 56px)", margin: 0, lineHeight: 1, fontWeight: 400 }}>{t.title}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--ps-line-2)" }}>
          {t.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{
                  background: "transparent", border: 0, borderBottom: "1px solid var(--ps-line-2)",
                  padding: "22px 4px", textAlign: "left", color: "var(--ps-ink-0)",
                  display: "flex", flexDirection: "column", gap: 12, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <span style={{ fontSize: 17, fontWeight: 500 }}>{it.q}</span>
                  <span style={{
                    color: "var(--ps-ember-2)", flexShrink: 0,
                    fontSize: 20, transition: "transform 200ms",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                    display: "inline-block",
                  }}>+</span>
                </div>
                {isOpen && (
                  <p style={{ color: "var(--ps-ink-2)", margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 640 }}>{it.a}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
function Footer() {
  const { t: tAll } = useLanguage();
  const t = tAll.footer;
  // Sprach-unabhängige IDs pro Link → Routing-Logik unten via Switch
  const cols: { t: string; items: { id: string; label: string }[] }[] = [
    {
      t: t.colAdvisory,
      items: [
        { id: "advisor", label: t.itemAdvisor },
        { id: "quickpick", label: t.itemQuickPick },
        { id: "sortiment", label: t.itemSortiment },
      ],
    },
    {
      t: t.colWorkshop,
      items: [
        { id: "contribute", label: t.itemContribute },
        { id: "guide", label: t.itemGuide },
      ],
    },
    {
      t: t.colLegal,
      items: [
        { id: "imprint", label: t.itemImprint },
        { id: "privacy", label: t.itemPrivacy },
        { id: "agb", label: t.itemAgb },
        { id: "affiliate", label: t.itemAffiliate },
      ],
    },
  ];

  return (
    <footer style={{ padding: "60px 20px 80px", background: "var(--ps-bg-0)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) repeat(3, minmax(0, 1fr))", gap: 40, marginBottom: 50 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <ForgeMark size={28} />
              <span className="ff-display" style={{ fontSize: 24, letterSpacing: "0.04em" }}>PONGSMITH</span>
            </div>
            <p style={{ color: "var(--ps-ink-3)", fontSize: 13, lineHeight: 1.55, maxWidth: 280, margin: 0 }}>{t.tag}</p>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 14 }}>{col.t}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {col.items.map((it, j) => {
                  const href =
                    it.id === "imprint" ? "/impressum"
                    : it.id === "privacy" ? "/datenschutz"
                    : it.id === "agb" ? "/agb"
                    : it.id === "affiliate" ? "/datenschutz#affiliates"
                    : it.id === "sortiment" ? "/sortiment"
                    : it.id === "advisor" ? "/#berater-section"
                    : it.id === "quickpick" ? "/#check-section"
                    : it.id === "contribute" ? "/mithelfen"
                    : "#";
                  return (
                    <li key={j}>
                      <a
                        href={href}
                        onClick={href === "#" ? (e) => e.preventDefault() : undefined}
                        style={{ color: "var(--ps-ink-2)", fontSize: 13.5, textDecoration: "none" }}
                      >
                        {it.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="anvil-divider-strong" style={{ marginBottom: 22 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="ff-mono" style={{ fontSize: 11, color: "var(--ps-ink-3)" }}>{t.copy}</span>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--ps-ink-4)", textTransform: "uppercase" }}>v0.4 · forge build</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function Home() {
  return (
    <div className="pb-mobile" style={{ backgroundColor: "var(--ps-bg-0)", color: "var(--ps-ink-0)", minHeight: "100vh" }}>
      <TopBar />
      <Hero />
      <AffiliateBlock />
      <HowItWorks />
      <Trust />
      <DemoSection />
      <BeraterSection />
      <SchnellCheckSection />
      <ContributeCta />
      <PromisesBlock />
      <FounderSection />
      <FAQ />
      <Footer />
      <MobileBottomBar />
    </div>
  );
}
