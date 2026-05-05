import { LegalPageHeader } from "@/components/legal-page-header";

export const metadata = {
  title: "Impressum — PongSmith",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <div className="forge-bg" style={{ minHeight: "100vh", padding: "80px 24px 60px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <LegalPageHeader />

        <h1
          className="ff-display"
          style={{ fontSize: 48, color: "var(--ps-ink-0)", lineHeight: 1, marginBottom: 8 }}
        >
          Impressum
        </h1>
        <p className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-4)", marginBottom: 48, textTransform: "uppercase" }}>
          Angaben gemäß § 5 TMG
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          <Section title="Betreiber">
            <Field label="Name">
                Christoph Gabrecht
            </Field>
            <Field label="Anschrift">
                Institutsgasse 6<br />
              01067 Dresden<br />
              Deutschland
            </Field>
            <Field label="E-Mail">
              <a
                href="mailto:hallo@pongsmith.de"
                style={{ color: "var(--ps-ember-2)", textDecoration: "none" }}
              >
                hallo@pongsmith.de
              </a>
            </Field>
          </Section>

          <Divider />

          <Section title="Verantwortlich für den Inhalt">
            <p style={{ color: "var(--ps-ink-1)", fontSize: 15, lineHeight: 1.6 }}>
              Gemäß § 18 Abs. 2 MStV: Identisch mit dem Betreiber (s.o.).
            </p>
          </Section>

          <Divider />

          <Section title="Haftungsausschluss">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. PongSmith übernimmt
              keine Gewähr für die Aktualität, Vollständigkeit und Richtigkeit der bereitgestellten
              Empfehlungen. Die Kaufentscheidung liegt allein beim Nutzer.
            </p>
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
              Als Betreiber sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte nach den allgemeinen
              Gesetzen verantwortlich. Links zu externen Websites Dritter wurden zum Zeitpunkt der
              Verlinkung auf mögliche Rechtsverstöße überprüft. Eine permanente inhaltliche
              Kontrolle der verlinkten Seiten ist ohne konkreten Anhaltspunkt nicht zumutbar.
            </p>
          </Section>

          <Divider />

          <Section title="Affiliate-Hinweis">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Diese Website enthält Affiliate-Links. Wenn du über einen solchen Link einkaufst,
              erhalten wir eine Provision vom jeweiligen Shop — für dich entstehen dabei keine
              Mehrkosten. Unsere Empfehlungen basieren ausschließlich auf unserem Synergie-Algorithmus
              und den Spielerprofilen, nicht auf Provisionsraten.
            </p>
          </Section>

          <Divider />

          <Section title="Streitbeilegung">
            <p style={{ color: "var(--ps-ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              Die Europäische Kommission stellt unter{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ps-ember-2)" }}
              >
                ec.europa.eu/consumers/odr
              </a>{" "}
              eine Plattform zur Online-Streitbeilegung (OS) bereit. Wir sind nicht bereit
              und nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <span
        className="ff-mono"
        style={{ fontSize: 11, color: "var(--ps-ink-4)", minWidth: 80, paddingTop: 2 }}
      >
        {label}
      </span>
      <span style={{ fontSize: 15, color: "var(--ps-ink-1)", lineHeight: 1.6 }}>
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--ps-line-2)" }} />;
}
