import Link from "next/link";
import { LegalPageHeader } from "@/components/legal-page-header";

export const metadata = {
  title: "AGB — PongSmith",
  robots: { index: false },
};

export default function AgbPage() {
  return (
    <div className="forge-bg" style={{ minHeight: "100vh", padding: "80px 24px 60px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <LegalPageHeader />

        <h1
          className="ff-display"
          style={{ fontSize: 48, color: "var(--ps-ink-0)", lineHeight: 1, marginBottom: 8 }}
        >
          Nutzungsbedingungen
        </h1>
        <p className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-4)", marginBottom: 48, textTransform: "uppercase" }}>
          Allgemeine Geschäftsbedingungen für PongSmith.de
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          <Section title="1. Geltungsbereich">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Diese Nutzungsbedingungen regeln die Nutzung der Website PongSmith.de
              und der darauf angebotenen Dienste (im Folgenden „PongSmith") durch
              Endnutzer („Nutzer"). Betreiber ist Christoph Gabrecht (siehe{" "}
              <Link href="/impressum" style={{ color: "var(--ps-ember-2)" }}>Impressum</Link>).
              Durch die Nutzung der Website akzeptiert der Nutzer diese Bedingungen.
            </p>
          </Section>

          <Divider />

          <Section title="2. Leistungsbeschreibung">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              PongSmith stellt eine unabhängige, KI-gestützte Material-Beratung
              für Tischtennis-Equipment bereit. Konkret:
            </p>
            <ul style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: "12px 0 0" }}>
              <li>Dialog-basierte Empfehlungen über den KI-Berater</li>
              <li>Strukturiertes Produkt-Sortiment mit aggregierten Spielerstimmen</li>
              <li>Synergie-Bewertungen zwischen Hölzern und Belägen</li>
              <li>Affiliate-Verlinkungen zu Partner-Shops (siehe §5)</li>
            </ul>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Die Nutzung sämtlicher Dienste ist für den Endnutzer kostenlos.
              Ein Vertragsverhältnis kommt zwischen Nutzer und PongSmith nicht
              zustande; PongSmith ist keine Kaufvertragspartei.
            </p>
          </Section>

          <Divider />

          <Section title="3. Beratungs-Charakter und Haftungsausschluss">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Die Empfehlungen von PongSmith basieren auf:
            </p>
            <ul style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: "12px 0 0" }}>
              <li>Hersteller-Datenblättern (normalisiert auf einheitliche Skalen)</li>
              <li>Aggregierten Community-Bewertungen aus öffentlichen Quellen</li>
              <li>Einer regelbasierten Empfehlungs-Engine (Synergie-Score 0–100)</li>
              <li>Optionalen anonymen Spieler-Daten aus dem Mithelfen-Formular</li>
            </ul>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Die Empfehlungen stellen <strong style={{ color: "var(--ps-ink-1)" }}>keine
              individuelle, verbindliche Kaufberatung</strong> dar, sondern sind
              datenbasierte Vorschläge. Spielgefühl ist subjektiv — was für andere
              Spieler im gleichen TTR-Bereich funktioniert, kann für den einzelnen
              Nutzer dennoch nicht optimal sein.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              PongSmith übernimmt keine Gewähr für die Eignung der empfohlenen
              Produkte für den konkreten Anwendungsfall, für die Verfügbarkeit
              in verlinkten Shops oder für die jeweils dort angegebenen Preise.
              Die Haftung für Schäden aus Materialfehlentscheidungen ist
              ausgeschlossen, soweit gesetzlich zulässig.
            </p>
          </Section>

          <Divider />

          <Section title="4. Inhalte und Aktualität">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              PongSmith bemüht sich um aktuelle, korrekte Daten. Produktangaben
              (Spezifikationen, Beschreibungen, Bewertungen) können sich ändern;
              Hersteller-Sortimente werden überarbeitet, Produkte werden eingestellt.
              PongSmith übernimmt keine Gewähr für die laufende Aktualität aller
              im Sortiment hinterlegten Daten.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Falls Nutzer Fehler in den Daten feststellen, freuen wir uns über
              eine kurze Nachricht an{" "}
              <a href="mailto:hallo@pongsmith.de" style={{ color: "var(--ps-ember-2)" }}>
                hallo@pongsmith.de
              </a>.
            </p>
          </Section>

          <Divider />

          <Section title="5. Affiliate-Provisionen">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              PongSmith finanziert sich ausschließlich über Affiliate-Provisionen.
              Beim Klick auf einen Shop-Link wird der Nutzer zum jeweiligen
              Partner-Shop (Amazon, Awin-Advertiser wie JOOLA, künftig weitere)
              weitergeleitet. Erfolgt dort ein Kauf, erhält PongSmith eine
              prozentuale Provision vom Shop. <strong style={{ color: "var(--ps-ink-1)" }}>
              Der Nutzer zahlt keinen Cent mehr</strong> als ohne Affiliate-Link.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Die Höhe der Provision unterscheidet sich pro Shop, ist jedoch nicht
              produktspezifisch. <strong style={{ color: "var(--ps-ink-1)" }}>Die
              Empfehlungslogik wird nicht angepasst um die Provision zu maximieren.</strong>
              {" "}Bei jeder verlinkten Empfehlung erscheint eine eindeutige
              Werbekennzeichnung („Werbung" oder „Affiliate"). Details siehe{" "}
              <Link href="/datenschutz#affiliates" style={{ color: "var(--ps-ember-2)" }}>
                Datenschutz §7
              </Link>.
            </p>
          </Section>

          <Divider />

          <Section title="6. Mithelfen-Formular">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Über das Formular unter{" "}
              <Link href="/mithelfen" style={{ color: "var(--ps-ember-2)" }}>/mithelfen</Link>{" "}
              können Nutzer freiwillig anonyme Setup-Daten beisteuern, die der
              Verbesserung der Empfehlungs-Engine dienen. Submissions durchlaufen
              einen automatischen Spam-Filter; Inhalte ohne erkennbaren Bezug zur
              Tischtennis-Spielpraxis können automatisch oder manuell verworfen
              werden. Mit dem Absenden willigt der Nutzer in die anonyme
              Speicherung und Auswertung der Daten ein.
            </p>
          </Section>

          <Divider />

          <Section title="7. Pflichten des Nutzers">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Der Nutzer verpflichtet sich, die Website nicht in einer Weise zu
              nutzen, die:
            </p>
            <ul style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: "12px 0 0" }}>
              <li>gegen geltendes Recht verstößt</li>
              <li>die technische Infrastruktur stört (z.B. durch automatisierte Massen-Abfragen)</li>
              <li>Inhalte automatisiert ohne Einwilligung extrahiert (Scraping)</li>
              <li>andere Nutzer belästigt oder schädigt</li>
            </ul>
          </Section>

          <Divider />

          <Section title="8. Geistiges Eigentum">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Texte, Grafiken, Logos, die Empfehlungs-Engine und die Synergie-
              Berechnungslogik sind geistiges Eigentum des Betreibers und dürfen
              nicht ohne schriftliche Einwilligung kopiert, verändert oder
              kommerziell verwertet werden. Produktbilder und Hersteller-Beschreibungen
              gehören den jeweiligen Markeninhabern; PongSmith nutzt diese im Rahmen
              der Markenneutralität für die redaktionelle Information.
            </p>
          </Section>

          <Divider />

          <Section title="9. Änderungen der Nutzungsbedingungen">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              PongSmith behält sich vor, diese Nutzungsbedingungen bei
              wesentlichen Änderungen am Angebot oder an gesetzlichen Anforderungen
              zu aktualisieren. Die jeweils aktuelle Fassung gilt mit Veröffentlichung
              auf dieser Seite.
            </p>
          </Section>

          <Divider />

          <Section title="10. Anwendbares Recht und Gerichtsstand">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
              des UN-Kaufrechts. Gerichtsstand ist Dresden, soweit gesetzlich
              zulässig.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ps-ember-2)" }}
              >
                ec.europa.eu/consumers/odr
              </a>. PongSmith ist nicht verpflichtet und nicht bereit, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </Section>

          <Divider />

          <Section title="11. Salvatorische Klausel">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam
              oder undurchführbar sein, bleibt die Wirksamkeit der übrigen
              Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung
              tritt die gesetzliche Regelung.
            </p>
          </Section>

          <Divider />

          <Section title="12. Stand">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Diese Nutzungsbedingungen haben den Stand Mai 2026.
            </p>
          </Section>

        </div>

        <p
          className="ff-mono"
          style={{
            marginTop: 60,
            textAlign: "center",
            fontSize: 10,
            color: "var(--ps-ink-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          PongSmith · Die TT-Schmiede · Dresden
        </p>
      </div>
    </div>
  );
}

// ─── Hilfs-Komponenten ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="ff-display"
        style={{
          fontSize: 22,
          color: "var(--ps-ember-2)",
          marginBottom: 14,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function Divider() {
  return <div className="anvil-divider-strong" style={{ margin: 0 }} />;
}
