"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Sticky-Navbar mit Scroll-State und Dropdown-Menü.
 * - Ab scrollY > 8: dunkler Backdrop-Blur + Border
 * - Desktop: Dropdown "Bereiche" mit allen wichtigen Pages
 * - Mobile: Hamburger morpht zu X, Menü slidet ein
 */

const dropdownItems = [
  { href: "/berater", label: "KI-Berater", desc: "In 4 Schritten zur Empfehlung" },
  { href: "/sortiment", label: "Sortiment", desc: "Alle Beläge & Hölzer im Index" },
  { href: "/mithelfen", label: "Mithelfen", desc: "Anonym Setup-Daten beisteuern" },
  { href: "/#how-it-works", label: "So funktioniert's", desc: "In drei Schritten zur Bestellung" },
  { href: "/#faq", label: "FAQ", desc: "Häufige Fragen" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Scroll-State
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-Outside fürs Dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    if (dropOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [dropOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled
          ? "border-b border-neutral-700 bg-neutral-900/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-primary" aria-hidden />
          <span className="text-base font-semibold tracking-tight text-neutral-50">
            PongSmith
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Dropdown "Bereiche" */}
          <div ref={dropRef} className="relative">
            <button
              type="button"
              onClick={() => setDropOpen((v) => !v)}
              aria-expanded={dropOpen}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-300 transition-colors hover:text-neutral-50"
            >
              Bereiche
              <motion.span
                animate={{ rotate: dropOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/95 shadow-2xl shadow-black/50 backdrop-blur-md"
                >
                  <div className="flex flex-col p-1">
                    {dropdownItems.map((it) => (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setDropOpen(false)}
                        className="group flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover"
                      >
                        <span className="text-sm font-medium text-neutral-100 group-hover:text-neutral-50">
                          {it.label}
                        </span>
                        <span className="text-xs text-neutral-400">{it.desc}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/berater"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-lg shadow-primary/20 transition-colors duration-150 hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            Berater starten <span aria-hidden>→</span>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          className="relative h-10 w-10 md:hidden"
        >
          <span className="sr-only">Menü</span>
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>

      {/* Mobile Menü */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-neutral-700 bg-neutral-900/95 backdrop-blur-md md:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {dropdownItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col gap-0.5 rounded-md px-3 py-3 transition-colors hover:bg-surface-hover"
                >
                  <span className="text-base font-medium text-neutral-100">{it.label}</span>
                  <span className="text-xs text-neutral-400">{it.desc}</span>
                </Link>
              ))}
              <Link
                href="/berater"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-medium text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-hover"
              >
                Berater starten <span aria-hidden>→</span>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
