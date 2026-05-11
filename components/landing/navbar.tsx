"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Sticky-Navbar mit Scroll-State.
 * - Ab scrollY > 8: dunkler Backdrop-Blur + Border
 * - Mobile: Hamburger morpht zu X, Menü slidet ein
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how-it-works", label: "So funktioniert's" },
    { href: "#faq", label: "FAQ" },
  ];

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
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-neutral-300 transition-colors hover:text-neutral-50"
            >
              {l.label}
            </a>
          ))}
          <LanguageSwitcher />
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
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          className="relative h-10 w-10 md:hidden"
        >
          <span className="sr-only">Menü</span>
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 block h-0.5 w-6 -translate-x-1/2 bg-neutral-50"
            animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>

      {/* Mobile Menü */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-neutral-700 bg-neutral-900/95 backdrop-blur-md md:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base text-neutral-300 transition-colors hover:bg-surface-hover hover:text-neutral-50"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex items-center gap-3 px-3 py-2">
                <LanguageSwitcher />
              </div>
              <Link
                href="/berater"
                onClick={() => setOpen(false)}
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
