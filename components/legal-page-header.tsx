"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Header für rechtliche Seiten (Impressum, Datenschutz) — die Inhalte bleiben
 * aus rechtlichen Gründen auf Deutsch, aber der Header zeigt die
 * Back-Navigation in der gewählten Sprache + Sprach-Switcher.
 */
export function LegalPageHeader() {
  const { t, lang } = useLanguage();
  const note = lang === "en"
    ? "Note: This document is in German for legal compliance with German telemedia and data protection law."
    : null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <Link
          href="/"
          className="ff-mono"
          style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--ps-ember-2)", textDecoration: "none", display: "inline-flex",
            alignItems: "center", gap: 6,
          }}
        >
          {t.common.backHome}
        </Link>
        <LanguageSwitcher />
      </div>
      {note && (
        <p
          className="ff-mono"
          style={{
            fontSize: 10, letterSpacing: "0.06em", color: "var(--ps-ink-4)",
            background: "var(--ps-bg-2)", border: "1px solid var(--ps-line-2)",
            padding: "10px 14px", borderRadius: 4, marginBottom: 32, lineHeight: 1.5,
          }}
        >
          {note}
        </p>
      )}
    </>
  );
}
