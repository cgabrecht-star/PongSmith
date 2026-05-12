import Link from "next/link";
import { SubPageLayout } from "@/components/landing/sub-page-layout";

export const metadata = {
  title: "Datenschutz, PongSmith",
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <SubPageLayout>
      <span className="eyebrow-pill">DSGVO / GDPR</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
        Datenschutzerklärung
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-neutral-400">
        Stand: Mai 2026
      </p>

      <div className="mt-12 flex flex-col gap-10">
        <Section title="1. Verantwortlicher" anchor="verantwortlicher">
          <p>Verantwortlicher im Sinne der DSGVO ist:</p>
          <p className="mt-3 text-neutral-200">
            Christoph Gabrecht<br />
            Institutsgasse 6<br />
            01067 Dresden<br />
            Deutschland
          </p>
          <p className="mt-3">
            Kontakt:{" "}
            <a
              href="mailto:hallo@pongsmith.de"
              className="text-primary transition-colors hover:underline"
            >
              hallo@pongsmith.de
            </a>{" "}
            · weitere Angaben siehe{" "}
            <Link href="/impressum" className="text-primary transition-colors hover:underline">
              Impressum
            </Link>
            .
          </p>
        </Section>

        <Section title="2. Grundsatz" anchor="grundsatz">
          <p>
            PongSmith erhebt keine personenbezogenen Daten ohne aktive Eingabe durch
            den Nutzer. Es werden keine Cookies gesetzt. Das Tracking erfolgt
            cookie-frei über Plausible Analytics (datenschutzfreundlich, kein
            Fingerprinting, keine Weitergabe an Dritte).
          </p>
        </Section>

        <Section title="3. Hosting" anchor="hosting">
          <p>
            Diese Website wird gehostet bei{" "}
            <strong className="text-neutral-200">Vercel Inc.</strong>, 340 Pine
            Street, Suite 701, San Francisco, CA 94104, USA. Beim Aufruf der Website
            verarbeitet Vercel Server-Logs mit IP-Adresse, Browser-Typ und
            Zugriffszeit. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an sicherem Betrieb). Vercel ist unter dem EU-US Data Privacy
            Framework zertifiziert.
          </p>
        </Section>

        <Section title="4. Datenbank" anchor="datenbank">
          <p>
            Die Produkt- und Synergie-Datenbank wird betrieben über{" "}
            <strong className="text-neutral-200">Supabase</strong> auf Servern in
            Frankfurt am Main, Deutschland (AWS eu-central-1). Es werden
            ausschließlich Produkt- und Algorithmusdaten gespeichert, keine
            Nutzerdaten.
          </p>
        </Section>

        <Section title="5. KI-Berater (Anthropic)" anchor="ki-berater">
          <p>
            Der KI-Berater nutzt die API von{" "}
            <strong className="text-neutral-200">Anthropic, PBC</strong>, 548 Market
            St, San Francisco, CA 94104, USA. Wenn du den Chat nutzt, werden deine
            Eingaben (Spielstil, TTR, Setup-Beschreibung) zur Verarbeitung an
            Anthropic übermittelt. Es werden keine dauerhaften Nutzerprofile
            angelegt.
          </p>
          <p className="mt-3">
            <strong className="text-neutral-200">Wichtig:</strong> Gib im Chat keine
            sensiblen personenbezogenen Daten ein (z. B. Namen, Adressen).
            Spielstärke und Spielstil reichen für eine gute Empfehlung.
          </p>
          <p className="mt-3">
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung /
            vorvertragliche Maßnahmen). Anthropic ist unter dem EU-US Data Privacy
            Framework zertifiziert.
          </p>
        </Section>

        <Section title="6. Analytics (Plausible)" anchor="analytics">
          <p>
            Wir nutzen{" "}
            <strong className="text-neutral-200">Plausible Analytics</strong>,
            Plausible Insights OÜ, Västriku tn 2, 50403 Tartu, Estonia. Plausible
            ist cookie-frei, DSGVO-konform und erhebt keine personenbezogenen Daten.
            Es wird ausschließlich aggregierter Website-Traffic gemessen
            (Seitenaufrufe, Herkunftsland, Browser-Typ). Eine Identifizierung
            einzelner Nutzer ist technisch ausgeschlossen. Keine Opt-in-Pflicht
            erforderlich.
          </p>
        </Section>

        <Section title="7. Affiliate-Links" anchor="affiliates">
          <p>
            Klickst du auf einen Affiliate-Link und kaufst etwas im verlinkten Shop,
            werden deine Daten für die Provisionsabrechnung an das jeweilige
            Affiliate-Netzwerk (Adcell / Awin) übermittelt. Die
            Datenschutzerklärungen dieser Netzwerke gelten zusätzlich.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </Section>

        <Section title="8. Mithelfen-Formular (anonyme Spieler-Daten)" anchor="mithelfen">
          <p>
            Über das Formular unter{" "}
            <Link href="/mithelfen" className="text-primary transition-colors hover:underline">
              /mithelfen
            </Link>{" "}
            können Spieler freiwillig Daten zu ihrem Setup beisteuern. Erfasst
            werden: TTR/LPZ, Spielstil, Schlaghand, Holz und Beläge,
            Selbst-Bewertung sowie optionale Freitext-Antworten.{" "}
            <strong className="text-neutral-200">
              Wir speichern weder Namen, E-Mail-Adressen noch IP-Adressen
            </strong>{" "}
           , die IP wird ausschließlich als kryptographischer SHA256-Hash für
            temporäres Rate-Limiting gegen Spam genutzt und nicht zurückführbar
            gespeichert. Die Daten werden für die Verbesserung der
            Empfehlungs-Engine ausgewertet. Eingaben durchlaufen vor dem Import
            einen automatischen Spam-Filter via Anthropic-API. Rechtsgrundlage: Art.
            6 Abs. 1 lit. a DSGVO (Einwilligung durch Absenden).
          </p>
        </Section>

        <Section title="9. Deine Rechte" anchor="rechte">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen Verarbeitung (Art. 21 DSGVO)</li>
            <li>Beschwerde bei der zuständigen Aufsichtsbehörde</li>
          </ul>
          <p className="mt-3">
            Anfragen per E-Mail an:{" "}
            <a
              href="mailto:hallo@pongsmith.de"
              className="text-primary transition-colors hover:underline"
            >
              hallo@pongsmith.de
            </a>
          </p>
          <p className="mt-3">
            Zuständige Aufsichtsbehörde:{" "}
            <strong className="text-neutral-200">
              Sächsischer Datenschutzbeauftragter
            </strong>
            , Devrientstraße 5, 01067 Dresden ·{" "}
            <a
              href="https://www.saechsdsb.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:underline"
            >
              saechsdsb.de
            </a>
          </p>
        </Section>

        <Section title="10. SSL-Verschlüsselung" anchor="ssl">
          <p>
            Diese Website nutzt durchgehend eine SSL-/TLS-Verschlüsselung (HTTPS).
            Damit sind alle Datenübertragungen zwischen deinem Browser und unserem
            Server gegen Mitlesen durch Dritte geschützt, sichtbar am
            Schloss-Symbol und am „https://" in der Adressleiste.
          </p>
        </Section>

        <Section title="11. Aktualität" anchor="aktualitaet">
          <p>
            Diese Datenschutzerklärung hat den Stand Mai 2026. Wir behalten uns vor,
            sie bei technischen oder rechtlichen Änderungen zu aktualisieren.
          </p>
        </Section>
      </div>
    </SubPageLayout>
  );
}

function Section({
  title,
  children,
  anchor,
}: {
  title: string;
  children: React.ReactNode;
  anchor: string;
}) {
  return (
    <section id={anchor} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-neutral-300">{children}</div>
    </section>
  );
}
