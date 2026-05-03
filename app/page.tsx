import { AdvisorForm } from "@/components/advisor-form";
import { BeraterChat } from "@/components/berater-chat";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <a href="#" className="flex items-baseline gap-0.5">
            <span className="text-lg font-black tracking-tight text-zinc-900">Pong</span>
            <span className="text-lg font-black tracking-tight text-orange-500">Smith</span>
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#berater" className="text-zinc-500 transition hover:text-zinc-900">
              Berater
            </a>
            <a href="#schnell-check" className="text-zinc-500 transition hover:text-zinc-900">
              Schnell-Check
            </a>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
              Beta
            </span>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Daten von revspin.net · Kein Marketing
          </div>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            Das Setup, das
            <br />
            <span className="text-orange-400">wirklich zu dir passt.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Kein Verkäufer. Kein Katalog. Nur ein ehrlicher Berater — basierend auf echten
            Community-Ratings von hunderten Spielern.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#berater"
              className="rounded-xl bg-orange-500 px-8 py-3.5 font-semibold text-white shadow transition hover:bg-orange-600"
            >
              Berater starten
            </a>
            <a
              href="#schnell-check"
              className="rounded-xl border border-zinc-700 px-8 py-3.5 font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Schnell-Check
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-100 bg-zinc-50 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: "📊",
              title: "Echte Daten",
              text: "Community-Ratings von revspin.net — aggregiert aus hunderten Bewertungen echter Spieler.",
            },
            {
              icon: "🤖",
              title: "KI-Berater",
              text: "Beschreib deine Situation, der Berater fragt nach und empfiehlt konkret — nicht generisch.",
            },
            {
              icon: "🎯",
              title: "Für Vereinsspieler",
              text: "Optimiert für TTR 1000–1700. Kein Profi-Kram, der für deinen Spielstil keinen Sinn macht.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-2 text-2xl">{f.icon}</div>
              <div className="mb-1 font-semibold text-zinc-900">{f.title}</div>
              <div className="text-sm leading-relaxed text-zinc-500">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KI-Berater ─────────────────────────────────────────────────────── */}
      <section id="berater" className="scroll-mt-16 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-500">
            KI-Berater
          </div>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-zinc-900">
            Beschreib dich — ich empfehle konkret.
          </h2>
          <p className="mb-8 text-zinc-500">
            Sag mir deinen TTR, Spielstil und was dich stört. Ich durchsuche die Datenbank und
            erkläre dir warum ein Setup zu dir passt.
          </p>
          <div className="h-[520px]">
            <BeraterChat />
          </div>
        </div>
      </section>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-zinc-100" />
      </div>

      {/* ── Schnell-Check ──────────────────────────────────────────────────── */}
      <section id="schnell-check" className="scroll-mt-16 bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-500">
            Schnell-Check
          </div>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-zinc-900">
            TTR + Spielstil → Top 3 Setups.
          </h2>
          <p className="mb-8 text-zinc-500">
            Kein Chat, kein Warten. Schieb den Regler auf deinen TTR, wähl deinen Stil — fertig.
          </p>
          <AdvisorForm />
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 bg-white px-6 py-8 text-center text-sm text-zinc-400">
        <div className="mb-1 flex items-baseline justify-center gap-0.5">
          <span className="font-bold text-zinc-700">Pong</span>
          <span className="font-bold text-orange-500">Smith</span>
        </div>
        Unabhängige Tischtennis-Ausrüstungsberatung · Daten: revspin.net · Keine Werbung
      </footer>
    </div>
  );
}
