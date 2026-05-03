import { AdvisorForm } from "@/components/advisor-form";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-zinc-900">Pong</span>
            <span className="text-xl font-black tracking-tight text-orange-500">Smith</span>
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            Beta
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            Das richtige Setup für
            <br />
            <span className="text-orange-500">deinen Spielstil.</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            Unabhängige Beratung auf Basis echter Spieler-Ratings —
            kein Marketing, nur Daten.
          </p>
        </div>
      </section>

      {/* Advisor */}
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <AdvisorForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        PongSmith · Unabhängige Tischtennis-Beratung · Daten: revspin.net
      </footer>
    </div>
  );
}
