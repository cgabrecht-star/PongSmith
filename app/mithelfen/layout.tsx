import type { Metadata } from "next";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Mithelfen, PongSmith besser machen",
  description:
    "Anonyme 3-Minuten-Umfrage. Hilf der Tischtennis-Schmiede mit echten Spieler-Daten, der Berater wird mit jedem Datensatz präziser.",
  alternates: {
    canonical: `${config.siteUrl}/mithelfen`,
  },
  openGraph: {
    title: "Mithelfen, PongSmith besser machen",
    description: "Anonyme 3-Minuten-Umfrage. Hilf der Tischtennis-Schmiede mit echten Spieler-Daten.",
    url: `${config.siteUrl}/mithelfen`,
  },
};

export default function MithelfenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
