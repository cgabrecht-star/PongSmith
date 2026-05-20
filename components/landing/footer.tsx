"use client";

import Link from "next/link";

const cols = [
  {
    title: "Über PongSmith",
    items: [
      { href: "#how-it-works", label: "So funktioniert's" },
      { href: "#faq", label: "Häufige Fragen" },
      { href: "/sortiment", label: "Sortiment" },
    ],
  },
  {
    title: "Rechtliches",
    items: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/agb", label: "AGB" },
      { href: "/datenschutz#affiliates", label: "Affiliate-Hinweis" },
    ],
  },
  {
    title: "Kontakt",
    items: [
      { href: "mailto:hallo@pongsmith.de", label: "hallo@pongsmith.de" },
      { href: "/mithelfen", label: "Mithelfen" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand-Spalte */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full bg-primary" aria-hidden />
              <span className="text-base font-semibold tracking-tight text-neutral-50">
                PongSmith
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-neutral-300">
              Unabhängige Beratung für Tischtennis-Setups. Aus Dresden, für Vereinsspieler.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-50">
                {col.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.items.map((it) => (
                  <li key={it.href}>
                    {it.href.startsWith("mailto:") ? (
                      <a
                        href={it.href}
                        className="text-sm text-neutral-300 transition-colors hover:text-neutral-50"
                      >
                        {it.label}
                      </a>
                    ) : (
                      <Link
                        href={it.href}
                        className="text-sm text-neutral-300 transition-colors hover:text-neutral-50"
                      >
                        {it.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 pt-8 text-xs text-neutral-400">
          <span>© 2026 PongSmith · pongsmith.de</span>
          <span>Made in Dresden</span>
        </div>
      </div>
    </footer>
  );
}
