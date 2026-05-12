import type { Metadata } from "next";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sortiment, Beläge & Hölzer",
  description:
    "Stöbere durch unsere kuratierte Datenbank an Tischtennis-Belägen und Hölzern. Filter nach Spielstil, Hersteller und Belag-Typ. Mit Specs, Bildern und Spielermeinungen.",
  alternates: {
    canonical: `${config.siteUrl}/sortiment`,
  },
  openGraph: {
    title: "Sortiment, Beläge & Hölzer | PongSmith",
    description:
      "Kuratierte Datenbank an Tischtennis-Belägen und Hölzern mit Spezifikationen und Spielermeinungen.",
    url: `${config.siteUrl}/sortiment`,
  },
};

export default function SortimentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
