import Link from "next/link";

export const metadata = {
  title: "Datenschutz — PongSmith",
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <div className="forge-bg" style={{ minHeight: "100vh", padding: "80px 24px 60px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Back */}
        <Link
          href="/"
          className="ff-mono"
          style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--ps-ember-2)", textDecoration: "none", display: "inline-flex",
            alignItems: "center", gap: 6, marginBottom: 40,
          }}
        >
          ← Zurück zur Startseite
        </Link>

        <h1
          className="ff-display"
          style={{ fontSize: 48, color: "var(--ps-ink-0)", lineHeight: 1, marginBottom: 8 }}
        >
          Datenschutz
        </h1>
        <p className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-4)", marginBottom: 48, textTransform: "uppercase" }}>
          Datenschutzerklärung gemäß DSGVO / GDPR
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          <Section title="1. Verantwortlicher">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Verantwortlicher im Sinne der DSGVO ist Christoph Gabrecht,
              Institutsgasse 6, 01067 Dresden (siehe{" "}
              <Link href="/impressum" style={{ color: "var(--ps-ember-2)" }}>Impressum</Link>).
            </p>
          </Section>

          <Divider />

          <Section title="2. Grundsatz">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              PongSmith erhebt keine personenbezogenen Daten ohne aktive Eingabe durch den Nutzer.
              Es werden keine Cookies gesetzt. Das Tracking erfolgt cookie-frei über Plausible
              Analytics (datenschutzfreundlich, kein Fingerprinting, keine Weitergabe an Dritte).
            </p>
          </Section>

          <Divider />

          <Section title="3. Hosting">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Diese Website wird gehostet bei <strong style={{ color: "var(--ps-ink-1)" }}>Vercel Inc.</strong>,
              340 Pine Street, Suite 701, San Francisco, CA 94104, USA. Beim Aufruf der Website
              verarbeitet Vercel Server-Logs mit IP-Adresse, Browser-Typ und Zugriffszeit.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb).
              Vercel ist unter dem EU-US Data Privacy Framework zertifiziert.
            </p>
          </Section>

          <Divider />

          <Section title="4. Datenbank">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Die Produkt- und Synergie-Datenbank wird betrieben über{" "}
              <strong style={{ color: "var(--ps-ink-1)" }}>Supabase</strong> auf Servern in
              Frankfurt am Main, Deutschland (AWS eu-central-1). Es werden ausschließlich
              Produkt- und Algorithmusdaten gespeichert, keine Nutzerdaten.
            </p>
          </Section>

          <Divider />

          <Section title="5. KI-Berater (Anthropic)">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Der KI-Berater nutzt die API von <strong style={{ color: "var(--ps-ink-1)" }}>Anthropic, PBC</strong>,
              548 Market St, San Francisco, CA 94104, USA. Wenn du den Chat nutzt, werden
              deine Eingaben (Spielstil, TTR, Setup-Beschreibung) zur Verarbeitung an Anthropic
              übermittelt. Es werden keine dauerhaften Nutzerprofile angelegt.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
              <strong style={{ color: "var(--ps-ink-1)" }}>Wichtig:</strong> Gib im Chat keine
              sensiblen personenbezogenen Daten ein (z. B. Namen, Adressen). Spielstärke und
              Spielstil reichen für eine gute Empfehlung.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / vorvertragliche
              Maßnahmen). Anthropic ist unter dem EU-US Data Privacy Framework zertifiziert.
            </p>
          </Section>

          <Divider />

          <Section title="6. Analytics (Plausible)">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Wir nutzen <strong style={{ color: "var(--ps-ink-1)" }}>Plausible Analytics</strong>,
              Plausible Insights OÜ, Västriku tn 2, 50403 Tartu, Estonia. Plausible ist
              cookie-frei, DSGVO-konform und erhebt keine personenbezogenen Daten. Es wird
              ausschließlich aggregierter Website-Traffic gemessen (Seitenaufrufe, Herkunftsland,
              Browser-Typ). Eine Identifizierung einzelner Nutzer ist technisch ausgeschlossen.
              Keine Opt-in-Pflicht erforderlich.
            </p>
          </Section>

          <Divider />

          <Section title="7. Affiliate-Links">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Klickst du auf einen Affiliate-Link und kaufst etwas im verlinkten Shop, werden
              deine Daten für die Provisionsabrechnung an das jeweilige Affiliate-Netzwerk
              (Adcell / Awin) übermittelt. Die Datenschutzerklärungen dieser Netzwerke gelten
              zusätzlich. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </Section>

          <Divider />

          <Section title="8. Deine Rechte">
            <ul style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei der zuständigen Aufsichtsbehörde</li>
            </ul>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Anfragen per E-Mail an:{" "}
              <a href="mailto:datenschutz@pongsmith.de" style={{ color: "var(--ps-ember-2)" }}>
                datenschutz@pongsmith.de
              </a>
            </p>
          </Section>

          <Divider />

          <Section title="9. Aktualität">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Diese Datenschutzerklärung hat den Stand Mai 2026. Wir behalten uns vor, sie bei
              technischen oder rechtlichen Änderungen zu aktualisieren.
            </p>
          </Section>

        </div>

        <div
          className="ff-mono"
          style={{
            marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--ps-line-2)",
            fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.1em",
          }}
        >
          © 2026 PONGSMITH · GESCHMIEDET IN DEUTSCHLAND
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="ff-mono"
        style={{
          fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--ps-ember-2)", marginBottom: 16,
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--ps-line-2)" }} />;
}
