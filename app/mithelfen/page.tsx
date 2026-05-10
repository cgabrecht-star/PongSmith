"use client";

import Link from "next/link";
import { LegalPageHeader } from "@/components/legal-page-header";
import { ContributeForm } from "@/components/contribute-form";
import { useLanguage } from "@/lib/language-context";

export default function MithelfenPage() {
  const { t } = useLanguage();
  const tc = t.contribute;

  return (
    <div className="forge-bg" style={{ minHeight: "100vh", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <LegalPageHeader />

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ps-ember-2)", textTransform: "uppercase" }}>
            🤝 {tc.kicker}
          </span>
          <h1
            className="ff-display"
            style={{
              fontSize: "clamp(36px, 6vw, 60px)",
              lineHeight: 1.05,
              margin: "12px 0 18px",
              color: "var(--ps-ink-0)",
              fontWeight: 400,
            }}
          >
            {tc.title}
          </h1>
          <p style={{ color: "var(--ps-ink-2)", fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: 580 }}>
            {tc.sub}
          </p>
        </div>

        {/* Form */}
        <ContributeForm />

        {/* Bottom note */}
        <p className="ff-mono" style={{
          marginTop: 28, textAlign: "center",
          fontSize: 10, letterSpacing: "0.12em",
          color: "var(--ps-ink-4)", textTransform: "uppercase",
        }}>
          🛡️ Anonym · Kein Login · Kein Tracking ·{" "}
          <Link href="/datenschutz" style={{ color: "var(--ps-ink-3)", textDecoration: "underline" }}>
            Datenschutz
          </Link>
        </p>
      </div>
    </div>
  );
}
