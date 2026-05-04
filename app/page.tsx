"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BeraterChat } from "@/components/berater-chat";
import { AdvisorForm } from "@/components/advisor-form";

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
type Lang = "de" | "en";

const T = {
  de: {
    nav: { start: "Start", berater: "Berater", check: "Schnell-Check", guide: "Ratgeber" },
    hero: {
      kicker: "Die Tischtennis-Schmiede",
      line1: "Dein Schläger,",
      line2: "in 3 Minuten",
      line3: "ehrlich beraten.",
      sub: "Damit du nie wieder 200 € in ein Setup steckst, das nicht zu dir passt. Unabhängig. Kostenlos. Ohne Marken-Bias.",
      cta: "Jetzt beraten lassen",
      ctaSecondary: "So funktioniert's",
      stat1v: "1.000–1.700",
      stat1l: "Q-TTR Spielstärke",
      stat2v: "0 €",
      stat2l: "Beratung",
      stat3v: "14",
      stat3l: "Hersteller im Index",
    },
    how: {
      title: "Drei Schritte. Kein Verkaufsdruck.",
      sub: "Wir hören dir zu — und sagen dir, was wir wirklich denken.",
      steps: [
        { n: "01", t: "Erzählen", d: "Du beschreibst deine Spielstärke, Frustpunkte und worauf du im Match warten musst." },
        { n: "02", t: "Spiegeln", d: "Wir fassen dein Profil zusammen, damit Missverständnisse vorm Geldausgeben sterben." },
        { n: "03", t: "Empfehlen", d: "Drei begründete Setups mit Synergie-Score, Preisvergleich und ehrlichem „warum nicht“." },
      ],
    },
    trust: {
      title: "Woher kommt unser Wissen?",
      sub: "Drei Säulen. Keine Schiebung.",
      pillars: [
        { t: "Hersteller-Daten", d: "Speed-, Spin- und Control-Werte direkt aus Datenblättern. Wir kürzen nichts schön." },
        { t: "Community-Reviews", d: "Aggregiert aus Foren und Bewertungsportalen. Wir filtern Schreihälse heraus." },
        { t: "Vereinsspieler", d: "Echte Erfahrungsberichte aus dem TTR-Korridor 1.000–1.700, nicht Bundesliga-Phantasie." },
      ],
    },
    berater: {
      kicker: "KI-Berater",
      title: "Beschreib dich — ich empfehle konkret.",
      sub: "Sag mir deinen TTR, Spielstil und was dich stört. Ich durchsuche die Datenbank und erkläre dir warum ein Setup zu dir passt.",
    },
    check: {
      kicker: "Schnell-Check",
      title: "TTR + Spielstil → Top 3 Setups.",
      sub: "Kein Chat, kein Warten. Schieb den Regler auf deinen TTR, wähl deinen Stil — fertig.",
    },
    faq: {
      title: "Häufige Fragen",
      items: [
        { q: "Verdient ihr an meinem Kauf?", a: "Ja, über Affiliate-Links — aber nur, wenn du aus eigener Überzeugung kaufst. Unsere Empfehlung ändert sich nicht durch Provisionen. Wir markieren das transparent." },
        { q: "Warum keine Bundesliga-Beläge?", a: "Weil ein Tenergy 05 unter 1.700 TTR meist mehr Frust als Spin liefert. Wir empfehlen das Setup, mit dem du nächsten Dienstag besser spielst." },
        { q: "Reicht eine KI für sowas Persönliches?", a: "Die KI hört strukturiert zu, vergleicht dein Profil mit hunderten Beläg-Holz-Kombinationen und legt die Begründung offen. Du entscheidest." },
        { q: "Was ist mit Defensiv-Setups?", a: "Voll abgedeckt. Sag uns einfach, du spielst hinter dem Tisch — die Empfehlungen drehen sich entsprechend." },
      ],
    },
    footer: {
      tag: "Unabhängig · Markenneutral · Kostenlos",
      copy: "© 2026 PongSmith. Geschmiedet in Deutschland.",
    },
  },
  en: {
    nav: { start: "Home", berater: "Advisor", check: "Quick Pick", guide: "Guide" },
    hero: {
      kicker: "The Table-Tennis Forge",
      line1: "Your bat,",
      line2: "honestly built",
      line3: "in 3 minutes.",
      sub: "So you never burn another €200 on a setup that doesn't fit you. Independent. Free. Zero brand bias.",
      cta: "Get my setup",
      ctaSecondary: "How it works",
      stat1v: "1,000–1,700",
      stat1l: "Q-TTR rating range",
      stat2v: "€0",
      stat2l: "Cost to you",
      stat3v: "14",
      stat3l: "Brands indexed",
    },
    how: {
      title: "Three steps. No sales pressure.",
      sub: "We listen — then tell you what we actually think.",
      steps: [
        { n: "01", t: "Tell us", d: "Describe your level, your frustrations, the shot you keep waiting for in matches." },
        { n: "02", t: "Mirror", d: "We summarise your profile back so misunderstandings die before you spend money." },
        { n: "03", t: "Recommend", d: "Three reasoned setups with a synergy score, price comparison, and honest 'why not'." },
      ],
    },
    trust: {
      title: "Where our knowledge comes from",
      sub: "Three pillars. No funny business.",
      pillars: [
        { t: "Manufacturer data", d: "Speed, spin, control numbers straight from spec sheets. We do not round up." },
        { t: "Community reviews", d: "Aggregated from forums and rating sites. We filter out the loudest yellers." },
        { t: "Club players", d: "Real reports from the 1,000–1,700 TTR corridor. Not pro-tour fantasy." },
      ],
    },
    berater: {
      kicker: "AI Advisor",
      title: "Describe yourself — I'll recommend specifically.",
      sub: "Tell me your TTR, play style and what bothers you. I search the database and explain why a setup fits you.",
    },
    check: {
      kicker: "Quick Pick",
      title: "TTR + Play style → Top 3 setups.",
      sub: "No chat, no waiting. Slide to your TTR, pick your style — done.",
    },
    faq: {
      title: "Common questions",
      items: [
        { q: "Do you make money on my purchase?", a: "Yes, via affiliate links — but only when you buy out of conviction. Our pick does not change because of commissions. We label it openly." },
        { q: "Why no pro-tour rubbers?", a: "Because a Tenergy 05 under 1,700 TTR usually delivers more frustration than spin. We recommend the setup that lets you play better next Tuesday." },
        { q: "Can an AI really do this?", a: "The AI listens with structure, compares your profile to hundreds of blade/rubber combinations, and shows the reasoning. You decide." },
        { q: "What about defensive setups?", a: "Fully covered. Just tell us you play behind the table and the picks rotate accordingly." },
      ],
    },
    footer: {
      tag: "Independent · Brand-neutral · Free",
      copy: "© 2026 PongSmith. Forged in Germany.",
    },
  },
};

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
function TopBar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = T[lang];
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
            {lang === "de" ? "Sortiment" : "Products"}
          </a>
        </nav>

        {/* Language toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, border: "1px solid var(--ps-line)", borderRadius: 3, padding: 2 }}>
          {(["de", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? "var(--ps-ember)" : "transparent",
                color: lang === l ? "#1a0d05" : "var(--ps-ink-2)",
                border: 0,
                borderRadius: 2,
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 160ms",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// Mobile Bottom Bar
// ─────────────────────────────────────────────
function MobileBottomBar({ lang }: { lang: Lang }) {
  const t = T[lang];
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
function Hero({ lang }: { lang: Lang }) {
  const t = T[lang].hero;
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

      {/* Anvil + Hammer SVG
          ─────────────────────────────────────────────────────────────
          Hammer geometry (pivot = grip at top-right):
            Pivot      : (330, 15)
            Handle     : 116 px → bottom at y = 131
            Ferrule    : y = 128–136
            Head       : y = 131–153, 65 px wide, centered on x = 330
            D (pivot→head-bottom) = 138 px

            −45° raised : head-bottom → (427, 113)  upper-right, clear of anvil ✓
            +12° strike : head-bottom → (301, 150)  on anvil top surface ✓
          ─────────────────────────────────────────────────────────────
      */}
      <div style={{ position: "absolute", right: "0", bottom: "2%", width: 460, height: 320, opacity: 0.65, pointerEvents: "none" }}>
        <svg viewBox="0 0 460 320" width="100%" height="100%">
          <defs>
            <linearGradient id="anvilGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#232120" />
              <stop offset="100%" stopColor="#0e0d0b" />
            </linearGradient>
            <linearGradient id="anvilTop" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2e2c28" />
              <stop offset="100%" stopColor="#1c1b18" />
            </linearGradient>
            <radialGradient id="emberCore" cx="0.45" cy="0.5" r="0.55">
              <stop offset="0%" stopColor="#ffd080" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#ff7535" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ff4010" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="impactGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffe090" stopOpacity="1" />
              <stop offset="45%" stopColor="#ff6b35" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="handleWood" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"   stopColor="#6b4f2e" />
              <stop offset="35%"  stopColor="#8c6b42" />
              <stop offset="65%"  stopColor="#7a5c38" />
              <stop offset="100%" stopColor="#5c4028" />
            </linearGradient>
            <linearGradient id="headMetal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#323028" />
              <stop offset="50%"  stopColor="#232120" />
              <stop offset="100%" stopColor="#141412" />
            </linearGradient>
          </defs>

          {/* ── Ember heat glow on the anvil working face ── */}
          <ellipse cx="172" cy="149" rx="125" ry="18" fill="url(#emberCore)" opacity="0.9" />

          {/* ── Anvil ── */}
          {/* Top working face */}
          <path d="M44 150 L300 150 L316 165 L64 165 Z" fill="url(#anvilTop)" stroke="#302e2a" strokeWidth="1.2" />
          {/* Top face highlight edge */}
          <line x1="46" y1="151" x2="298" y2="151" stroke="#4a4640" strokeWidth="0.8" opacity="0.5" />
          {/* Horn */}
          <path d="M44 150 C26 151 13 157 9 165 L64 165 Z" fill="url(#anvilGrad)" stroke="#302e2a" strokeWidth="1" />
          {/* Waist */}
          <path d="M110 165 L110 215 L86 238 L86 250 L256 250 L256 238 L232 215 L232 165 Z"
                fill="url(#anvilGrad)" stroke="#302e2a" strokeWidth="1.2" />
          {/* Base */}
          <rect x="64" y="250" width="214" height="36" fill="url(#anvilGrad)" stroke="#302e2a" strokeWidth="1.2" rx="1" />
          <rect x="64" y="250" width="214" height="4" fill="#2a2826" />

          {/* ── Impact flash — opacity-animated ellipse at strike point (x=301, y=150) ── */}
          <ellipse cx="280" cy="150" rx="36" ry="12" fill="url(#impactGlow)"
            style={{ animation: "hammerImpact 2.6s linear infinite" }} />

          {/* ── Hammer ── */}
          <g style={{ transformOrigin: "330px 15px", animation: "hammerStrike 2.6s ease-in-out infinite" }}>

            {/* Pommel cap */}
            <rect x="323" y="12" width="14" height="7" fill="#252320" rx="3" />

            {/* Handle — wood */}
            <rect x="324" y="15" width="12" height="116" fill="url(#handleWood)" rx="3" />
            {/* Wood grain lines */}
            <line x1="327" y1="38"  x2="334" y2="47"  stroke="#4a3520" strokeWidth="0.7" opacity="0.5" />
            <line x1="327" y1="62"  x2="334" y2="70"  stroke="#4a3520" strokeWidth="0.7" opacity="0.5" />
            <line x1="327" y1="85"  x2="334" y2="93"  stroke="#4a3520" strokeWidth="0.7" opacity="0.5" />
            <line x1="327" y1="108" x2="334" y2="115" stroke="#4a3520" strokeWidth="0.7" opacity="0.5" />

            {/* Ferrule */}
            <rect x="322" y="127" width="16" height="9" fill="#222020" stroke="#3a3830" strokeWidth="0.8" rx="1" />
            <line x1="322" y1="130" x2="338" y2="130" stroke="#3a3a38" strokeWidth="0.5" />
            <line x1="322" y1="133" x2="338" y2="133" stroke="#3a3a38" strokeWidth="0.5" />

            {/* Head — metal block, 65 × 22 px, bottom at y=153 */}
            <rect x="297" y="131" width="65" height="22" fill="url(#headMetal)" stroke="#2e2c28" strokeWidth="1.5" rx="2" />
            {/* Top bevel */}
            <rect x="297" y="131" width="65" height="4"  fill="#363430" rx="2" />
            {/* Bottom shadow */}
            <rect x="297" y="149" width="65" height="4"  fill="#0e0e0c" rx="1" />

            {/* Striking face — left end of head */}
            <rect x="292" y="133" width="9" height="16" fill="#1c1a18" stroke="#383633" strokeWidth="1" rx="2" />
            {/* Heat mark / ember glow on striking face */}
            <rect x="293" y="135" width="6" height="12" fill="#ff6b35" opacity="0.22" rx="1" />

            {/* Peen — right end, slightly tapered */}
            <path d="M360 133 L368 138 L368 148 L360 151 Z" fill="#1a1917" stroke="#2e2c28" strokeWidth="0.8" />

            {/* Etch line across head face */}
            <line x1="303" y1="141" x2="357" y2="141" stroke="#3a3830" strokeWidth="0.6" opacity="0.45" />

          </g>
        </svg>
      </div>

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
            🔨 {t.cta} →
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
// How It Works
// ─────────────────────────────────────────────
function HowItWorks({ lang }: { lang: Lang }) {
  const t = T[lang].how;
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
function Trust({ lang }: { lang: Lang }) {
  const t = T[lang].trust;
  const pillarIcons = ["📊", "👥", "🏓"];
  const pillarNums = ["SÄULE 01", "SÄULE 02", "SÄULE 03"];
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
function BeraterSection({ lang }: { lang: Lang }) {
  const t = T[lang].berater;
  return (
    <section id="berater-section" style={{ padding: "90px 20px", background: "var(--ps-bg-0)", borderBottom: "1px solid var(--ps-line-2)", scrollMarginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SectionLabel n="03">{t.kicker}</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>
          {t.title}
        </h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px", maxWidth: 560 }}>{t.sub}</p>
        <div style={{ height: 560 }}>
          <BeraterChat />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Schnell-Check Section
// ─────────────────────────────────────────────
function SchnellCheckSection({ lang }: { lang: Lang }) {
  const t = T[lang].check;
  return (
    <section id="check-section" className="forge-bg" style={{ padding: "90px 20px", borderBottom: "1px solid var(--ps-line-2)", scrollMarginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SectionLabel n="04">{t.kicker}</SectionLabel>
        <h2 className="ff-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 0 10px", lineHeight: 1, fontWeight: 400 }}>
          {t.title}
        </h2>
        <p style={{ color: "var(--ps-ink-2)", fontSize: 17, margin: "0 0 40px", maxWidth: 560 }}>{t.sub}</p>
        <AdvisorForm />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
function FAQ({ lang }: { lang: Lang }) {
  const t = T[lang].faq;
  const [open, setOpen] = useState(-1);
  return (
    <section style={{ padding: "90px 20px", background: "var(--ps-bg-1)", borderBottom: "1px solid var(--ps-line-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)", gap: 60 }}>
        <div>
          <SectionLabel n="05">FAQ</SectionLabel>
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
function Footer({ lang }: { lang: Lang }) {
  const t = T[lang].footer;
  const footerLinks = {
    de: [
      { t: "Beratung", items: ["Chat starten", "So funktioniert's", "Dein Profil"] },
      { t: "Werkstatt", items: ["Ratgeber", "Glossar", "TTR-Rechner"] },
      { t: "Rechtliches", items: ["Impressum", "Datenschutz", "Affiliate-Hinweis"] },
    ],
    en: [
      { t: "Advisory", items: ["Start chat", "How it works", "Your profile"] },
      { t: "Workshop", items: ["Guide", "Glossary", "TTR calculator"] },
      { t: "Legal", items: ["Imprint", "Privacy", "Affiliate disclosure"] },
    ],
  };
  const cols = footerLinks[lang];

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
                    it === "Impressum" ? "/impressum"
                    : it === "Datenschutz" ? "/datenschutz"
                    : it === "Imprint" ? "/impressum"
                    : it === "Privacy" ? "/datenschutz"
                    : it === "Ratgeber" || it === "Guide" ? "#"
                    : it === "Sortiment" ? "/sortiment"
                    : "#";
                  return (
                    <li key={j}>
                      <a
                        href={href}
                        onClick={href === "#" ? (e) => e.preventDefault() : undefined}
                        style={{ color: "var(--ps-ink-2)", fontSize: 13.5, textDecoration: "none" }}
                      >
                        {it}
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
  const [lang, setLang] = useState<Lang>("de");

  return (
    <div className="pb-mobile" style={{ backgroundColor: "var(--ps-bg-0)", color: "var(--ps-ink-0)", minHeight: "100vh" }}>
      <TopBar lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <HowItWorks lang={lang} />
      <Trust lang={lang} />
      <BeraterSection lang={lang} />
      <SchnellCheckSection lang={lang} />
      <FAQ lang={lang} />
      <Footer lang={lang} />
      <MobileBottomBar lang={lang} />
    </div>
  );
}
