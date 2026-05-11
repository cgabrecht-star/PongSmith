import type { Metadata } from "next";
import Link from "next/link";
import { BeraterPage } from "@/components/berater/berater-page";
import { LanguageSwitcher } from "@/components/language-switcher";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Berater starten — PongSmith",
  description:
    "In vier Schritten zur richtigen Setup-Empfehlung. Aktuelles Setup eingeben, Problem beschreiben, datenbasierte Empfehlung erhalten — kostenlos und anonym.",
  alternates: {
    canonical: `${config.siteUrl}/berater`,
  },
};

export default function BeraterRoutePage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">
      {/* Slim Navbar */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-neutral-50">
              PongSmith
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-sm text-neutral-300 transition-colors hover:text-neutral-50"
            >
              ← Zurück
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 md:px-8 md:py-16">
        <BeraterPage />
      </main>
    </div>
  );
}
