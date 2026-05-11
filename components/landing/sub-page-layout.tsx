/**
 * Wiederverwendbares Layout für Unterseiten (Legal, Mithelfen, Sortiment-
 * Variante, etc.). Liefert konsistente Navbar + Footer + Container, damit
 * alle Unterseiten visuell zur Landing-Page passen.
 */

import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export function SubPageLayout({
  children,
  maxWidth = "max-w-3xl",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">
      <Navbar />
      <main className={`mx-auto ${maxWidth} px-6 py-12 md:px-8 md:py-16`}>{children}</main>
      <Footer />
    </div>
  );
}
