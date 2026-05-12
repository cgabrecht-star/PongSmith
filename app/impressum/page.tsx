import Link from "next/link";
import { SubPageLayout } from "@/components/landing/sub-page-layout";

export const metadata = {
  title: "Impressum, PongSmith",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <SubPageLayout>
      <span className="eyebrow-pill">Angaben gemäß § 5 TMG</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
        Impressum
      </h1>

      <div className="mt-12 flex flex-col gap-10">
        <Section title="Betreiber">
          <Field label="Name">Christoph Gabrecht</Field>
          <Field label="Anschrift">
            Institutsgasse 6<br />
            01067 Dresden<br />
            Deutschland
          </Field>
          <Field label="E-Mail">
            <a
              href="mailto:hallo@pongsmith.de"
              className="text-primary transition-colors hover:underline"
            >
              hallo@pongsmith.de
            </a>
            <br />
            <a
              href="mailto:c.gabrecht@icloud.com"
              className="text-primary transition-colors hover:underline"
            >
              c.gabrecht@icloud.com
            </a>
          </Field>
        </Section>

        <Section title="Verantwortlich für den Inhalt">
          <p className="text-sm text-neutral-300">
            Gemäß § 18 Abs. 2 MStV: Christoph Gabrecht (identisch mit Betreiber).
          </p>
        </Section>

        <Section title="Haftungsausschluss">
          <p className="text-sm text-neutral-300">
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
            PongSmith übernimmt keine Gewähr für die Aktualität, Vollständigkeit und
            Richtigkeit der bereitgestellten Empfehlungen. Die Kaufentscheidung
            liegt allein beim Nutzer.
          </p>
          <p className="mt-3 text-sm text-neutral-300">
            Als Betreiber sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte nach den
            allgemeinen Gesetzen verantwortlich. Links zu externen Websites Dritter
            wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Eine permanente inhaltliche Kontrolle der verlinkten Seiten
            ist ohne konkreten Anhaltspunkt nicht zumutbar.
          </p>
        </Section>

        <Section title="Affiliate-Hinweis">
          <p className="text-sm text-neutral-300">
            Diese Website enthält Affiliate-Links. Wenn du über einen solchen Link
            einkaufst, erhalten wir eine Provision vom jeweiligen Shop, für dich
            entstehen dabei keine Mehrkosten. Unsere Empfehlungen basieren
            ausschließlich auf unserem Synergie-Algorithmus und den Spielerprofilen,
            nicht auf Provisionsraten. Details siehe{" "}
            <Link
              href="/datenschutz#affiliates"
              className="text-primary transition-colors hover:underline"
            >
              Datenschutz §7
            </Link>{" "}
            und{" "}
            <Link
              href="/agb"
              className="text-primary transition-colors hover:underline"
            >
              AGB §5
            </Link>
            .
          </p>
        </Section>

        <Section title="Streitbeilegung">
          <p className="text-sm text-neutral-300">
            Die Europäische Kommission stellt unter{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>{" "}
            eine Plattform zur Online-Streitbeilegung (OS) bereit. Wir sind nicht
            bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren vor
            einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <Section title="Rechtliche Dokumente">
          <p className="text-sm text-neutral-300">
            <Link
              href="/datenschutz"
              className="text-primary transition-colors hover:underline"
            >
              Datenschutzerklärung
            </Link>{" "}
            ·{" "}
            <Link
              href="/agb"
              className="text-primary transition-colors hover:underline"
            >
              Nutzungsbedingungen (AGB)
            </Link>
          </p>
        </Section>
      </div>
    </SubPageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span className="text-base leading-relaxed text-neutral-200">{children}</span>
    </div>
  );
}
