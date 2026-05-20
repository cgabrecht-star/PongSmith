import Link from "next/link";
import { SubPageLayout } from "@/components/landing/sub-page-layout";

export const metadata = {
  title: "AGB, PongSmith",
  robots: { index: false },
};

export default function AgbPage() {
  return (
    <SubPageLayout>
      <span className="eyebrow-pill">Nutzungsbedingungen</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-neutral-400">
        Stand: Mai 2026
      </p>

      <div className="mt-12 flex flex-col gap-10">
        <Section title="1. Geltungsbereich">
          <p>
            Diese Nutzungsbedingungen regeln die Nutzung der Website PongSmith.de
            und der darauf angebotenen Dienste (im Folgenden „PongSmith") durch
            Endnutzer („Nutzer"). Betreiber ist Christoph Gabrecht (siehe{" "}
            <InternalLink href="/impressum">Impressum</InternalLink>). Durch die
            Nutzung der Website akzeptiert der Nutzer diese Bedingungen.
          </p>
        </Section>

        <Section title="2. Leistungsbeschreibung">
          <p>
            PongSmith stellt eine unabhängige, automatisierte Material-Beratung für
            Tischtennis-Equipment bereit:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Dialog-basierte Empfehlungen über den Berater</li>
            <li>Strukturiertes Produkt-Sortiment mit aggregierten Spielerstimmen</li>
            <li>Synergie-Bewertungen zwischen Hölzern und Belägen</li>
            <li>Affiliate-Verlinkungen zu Partner-Shops (siehe §5)</li>
          </ul>
          <p className="mt-3">
            Die Nutzung sämtlicher Dienste ist für den Endnutzer kostenlos. Ein
            Vertragsverhältnis kommt zwischen Nutzer und PongSmith nicht zustande;
            PongSmith ist keine Kaufvertragspartei.
          </p>
        </Section>

        <Section title="3. Beratungs-Charakter und Haftungsausschluss">
          <p>Die Empfehlungen von PongSmith basieren auf:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Hersteller-Datenblättern (normalisiert auf einheitliche Skalen)</li>
            <li>Aggregierten Community-Bewertungen aus öffentlichen Quellen</li>
            <li>Einer regelbasierten Empfehlungs-Engine (Synergie-Score 0-100)</li>
            <li>Optionalen anonymen Spieler-Daten aus dem Mithelfen-Formular</li>
          </ul>
          <p className="mt-3">
            Die Empfehlungen stellen{" "}
            <strong className="text-neutral-50">
              keine individuelle, verbindliche Kaufberatung
            </strong>{" "}
            dar, sondern sind datenbasierte Vorschläge. Spielgefühl ist subjektiv -
            was für andere Spieler im gleichen TTR-Bereich funktioniert, kann für
            den einzelnen Nutzer dennoch nicht optimal sein.
          </p>
          <p className="mt-3">
            PongSmith übernimmt keine Gewähr für die Eignung der empfohlenen
            Produkte für den konkreten Anwendungsfall, für die Verfügbarkeit in
            verlinkten Shops oder für die jeweils dort angegebenen Preise. Die
            Haftung für Schäden aus Materialfehlentscheidungen ist ausgeschlossen,
            soweit gesetzlich zulässig.
          </p>
        </Section>

        <Section title="4. Inhalte und Aktualität">
          <p>
            PongSmith bemüht sich um aktuelle, korrekte Daten. Produktangaben
            (Spezifikationen, Beschreibungen, Bewertungen) können sich ändern;
            Hersteller-Sortimente werden überarbeitet, Produkte werden eingestellt.
            PongSmith übernimmt keine Gewähr für die laufende Aktualität aller im
            Sortiment hinterlegten Daten.
          </p>
          <p className="mt-3">
            Falls Nutzer Fehler in den Daten feststellen, freuen wir uns über eine
            kurze Nachricht an{" "}
            <a
              href="mailto:hallo@pongsmith.de"
              className="text-primary transition-colors hover:underline"
            >
              hallo@pongsmith.de
            </a>
            .
          </p>
        </Section>

        <Section title="5. Affiliate-Provisionen">
          <p>
            PongSmith finanziert sich ausschließlich über Affiliate-Provisionen. Beim
            Klick auf einen Shop-Link wird der Nutzer zum jeweiligen Partner-Shop
            (Tischtennis.biz über Adcell, Amazon, JOOLA-Shop über Awin, künftig weitere)
            weitergeleitet.
            Erfolgt dort ein Kauf, erhält PongSmith eine prozentuale Provision vom
            Shop.{" "}
            <strong className="text-neutral-50">
              Der Nutzer zahlt keinen Cent mehr
            </strong>{" "}
            als ohne Affiliate-Link.
          </p>
          <p className="mt-3">
            Die Höhe der Provision unterscheidet sich pro Shop, ist jedoch nicht
            produktspezifisch.{" "}
            <strong className="text-neutral-50">
              Die Empfehlungslogik wird nicht angepasst um die Provision zu maximieren.
            </strong>{" "}
            Bei jeder verlinkten Empfehlung erscheint eine eindeutige
            Werbekennzeichnung („Werbung" oder „Affiliate"). Details siehe{" "}
            <InternalLink href="/datenschutz#affiliates">Datenschutz §7</InternalLink>.
          </p>
        </Section>

        <Section title="6. Mithelfen-Formular">
          <p>
            Über das Formular unter{" "}
            <InternalLink href="/mithelfen">/mithelfen</InternalLink> können Spieler
            freiwillig anonyme Setup-Daten beisteuern, die der Verbesserung der
            Empfehlungs-Engine dienen. Submissions durchlaufen einen automatischen
            Spam-Filter; Inhalte ohne erkennbaren Bezug zur Tischtennis-Spielpraxis
            können automatisch oder manuell verworfen werden. Mit dem Absenden
            willigt der Nutzer in die anonyme Speicherung und Auswertung der Daten
            ein.
          </p>
        </Section>

        <Section title="7. Pflichten des Nutzers">
          <p>Der Nutzer verpflichtet sich, die Website nicht in einer Weise zu nutzen, die:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>gegen geltendes Recht verstößt</li>
            <li>die technische Infrastruktur stört (z.B. durch automatisierte Massen-Abfragen)</li>
            <li>Inhalte automatisiert ohne Einwilligung extrahiert (Scraping)</li>
            <li>andere Nutzer belästigt oder schädigt</li>
          </ul>
        </Section>

        <Section title="8. Geistiges Eigentum">
          <p>
            Texte, Grafiken, Logos, die Empfehlungs-Engine und die
            Synergie-Berechnungslogik sind geistiges Eigentum des Betreibers und
            dürfen nicht ohne schriftliche Einwilligung kopiert, verändert oder
            kommerziell verwertet werden. Produktbilder und
            Hersteller-Beschreibungen gehören den jeweiligen Markeninhabern;
            PongSmith nutzt diese im Rahmen der Markenneutralität für die
            redaktionelle Information.
          </p>
        </Section>

        <Section title="9. Änderungen der Nutzungsbedingungen">
          <p>
            PongSmith behält sich vor, diese Nutzungsbedingungen bei wesentlichen
            Änderungen am Angebot oder an gesetzlichen Anforderungen zu
            aktualisieren. Die jeweils aktuelle Fassung gilt mit Veröffentlichung
            auf dieser Seite.
          </p>
        </Section>

        <Section title="10. Anwendbares Recht und Gerichtsstand">
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
            UN-Kaufrechts. Gerichtsstand ist Dresden, soweit gesetzlich zulässig.
          </p>
          <p className="mt-3">
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            . PongSmith ist nicht verpflichtet und nicht bereit, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </Section>

        <Section title="11. Salvatorische Klausel">
          <p>
            Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam oder
            undurchführbar sein, bleibt die Wirksamkeit der übrigen Bestimmungen
            unberührt. An die Stelle der unwirksamen Bestimmung tritt die
            gesetzliche Regelung.
          </p>
        </Section>
      </div>
    </SubPageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-neutral-300">{children}</div>
    </section>
  );
}

function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-primary transition-colors hover:underline">
      {children}
    </Link>
  );
}
