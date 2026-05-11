import type { Metadata } from "next";
import Link from "next/link";
import { BeraterFlow } from "@/components/berater-flow";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Berater starten — PongSmith",
  description:
    "Beschreib im Chat dein Setup und was dich stört — der KI-Berater empfiehlt 2 bis 3 begründete Setups, datenbasiert und kostenlos.",
  alternates: {
    canonical: `${config.siteUrl}/berater`,
  },
};

/**
 * Übergangs-Page für den Berater bis Phase 3 das richtige 4-Step-Flow-Design
 * implementiert. Aktuell wird der bestehende BeraterFlow gerendert, in eine
 * neutralere Hülle gepackt.
 */
export default function BeraterPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">
      {/* Slim Navbar mit Back-Link */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-neutral-50">
              PongSmith
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-300 transition-colors hover:text-neutral-50"
          >
            ← Zurück
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:px-8 md:py-16">
        <div className="mb-8">
          <span className="eyebrow-pill">KI-Berater</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
            Beschreib dich — ich empfehle konkret.
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-300">
            Sag mir deinen TTR, Spielstil und was dich stört. Ich durchsuche die Datenbank und
            erkläre dir warum ein Setup zu dir passt.
          </p>
        </div>
        <div className="h-[640px]">
          <BeraterFlow />
        </div>
      </main>
    </div>
  );
}
