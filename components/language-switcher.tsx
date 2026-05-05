"use client";

/**
 * Sprach-Umschalter — DE / EN Toggle.
 * Konsistentes Design für TopBar auf allen Seiten.
 */

import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        border: "1px solid var(--ps-line)",
        borderRadius: 3,
        padding: 2,
      }}
    >
      {(["de", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-label={l === "de" ? "Deutsch" : "English"}
          aria-pressed={lang === l}
          style={{
            background: lang === l ? "var(--ps-ember)" : "transparent",
            color: lang === l ? "#1a0d05" : "var(--ps-ink-2)",
            border: 0,
            borderRadius: 2,
            padding: compact ? "3px 7px" : "4px 8px",
            fontSize: compact ? 9 : 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 140ms, color 140ms",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
