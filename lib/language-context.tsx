"use client";

/**
 * LanguageProvider, verwaltet die aktuelle Sprache (de | en) für die ganze App.
 *
 * Persistiert in:
 *  - localStorage (sofort verfügbar nach Reload)
 *  - cookie (für SSR/Middleware-Zugriff verfügbar)
 *
 * Nutzung in Komponenten:
 *   const { lang, setLang, t } = useLanguage();
 *   t.hero.cta  →  "Jetzt beraten lassen" oder "Get my setup"
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Lang, Translations } from "./i18n";
import { DEFAULT_LANG, getT, isValidLang } from "./i18n";

const COOKIE_NAME = "ps_lang";
const STORAGE_KEY = "ps_lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 Jahr

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [hydrated, setHydrated] = useState(false);

  // Initial: aus Cookie / localStorage laden
  useEffect(() => {
    const fromCookie = readCookie(COOKIE_NAME);
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const stored = fromCookie ?? fromStorage;
    if (isValidLang(stored)) {
      setLangState(stored);
    } else if (typeof navigator !== "undefined") {
      // Browser-Sprache als Fallback
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("en")) setLangState("en");
    }
    setHydrated(true);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      writeCookie(COOKIE_NAME, l, COOKIE_MAX_AGE);
      // <html lang="..."> auch updaten
      document.documentElement.lang = l;
    }
  }, []);

  // Beim Hydratisieren: html lang Attribut setzen
  useEffect(() => {
    if (hydrated && typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [hydrated, lang]);

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: getT(lang),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage muss innerhalb von <LanguageProvider> aufgerufen werden");
  }
  return ctx;
}

// ────────────────────────────────────────────────────────────────────────────
// Cookie helpers (kein externes Paket nötig)
// ────────────────────────────────────────────────────────────────────────────

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const isSecure = typeof location !== "undefined" && location.protocol === "https:";
  document.cookie =
    `${name}=${encodeURIComponent(value)}; ` +
    `Max-Age=${maxAge}; Path=/; SameSite=Lax` +
    (isSecure ? "; Secure" : "");
}
