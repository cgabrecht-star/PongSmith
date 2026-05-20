"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "@/components/effects/section-header";

/**
 * Accordion mit gemischten Items: klassische FAQ + Founder-Info +
 * Selbstverpflichtung. Chris's Wunsch: alles unter "Häufige Fragen"
 * aufklappbar, damit die Seite nicht zu lang scrollt.
 */

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const items: FaqItem[] = [
  {
    q: "Was kostet PongSmith?",
    a: (
      <p>
        Nichts. Die Beratung ist und bleibt kostenlos, egal wie viele Empfehlungen Du Dir
        holst.
      </p>
    ),
  },
  {
    q: "Wie verdient ihr Geld, wenn die Beratung kostenlos ist?",
    a: (
      <p>
        Affiliate-Provision der Shops, bei denen Du am Ende kaufst. Du zahlst keinen Aufpreis
       , der Preis ist derselbe, als würdest Du direkt zum Shop gehen. Wenn Du nicht kaufst,
        verdienen wir auch nichts. Genau deshalb empfehlen wir nur, was wirklich passt.
      </p>
    ),
  },
  {
    q: "Für welche Spielstärke ist das gedacht?",
    a: (
      <p>
        Q-TTR 1000 bis 1700+, also Vereinsspieler vom Anfänger bis Bezirks-Niveau. In dem
        Bereich entscheidet das passende Material spürbar mit. Darüber hinaus geht's auch -
        die Empfehlungen werden nur weniger kritisch, weil die Spieler dann oft schon sehr
        genau wissen, was sie brauchen.
      </p>
    ),
  },
  {
    q: "Werden alle Marken berücksichtigt oder nur die großen?",
    a: (
      <p>
        Hunderte Beläge in der Datenbank, Butterfly, Tibhar, Donic, Yasaka, Joola, Andro,
        Stiga, Xiom, Nittaku und kleinere Hersteller wie Sauer&Tröger oder air. Empfohlen
        wird, was zu Dir passt, nicht was die höchste Provision bringt.
      </p>
    ),
  },
  {
    q: "Was, wenn ich Materialspieler bin (Noppen, Anti)?",
    a: (
      <p>
        Materialspieler ist einer der vier hinterlegten Spielstile. Der Berater
        berücksichtigt die Charakteristik Deines Belags (lange/kurze Noppen, frictionless,
        Anti) und schlägt Hölzer vor, die zur Spielweise passen, nicht das
        Standard-Allround, das man Dir im Shop andrehen würde.
      </p>
    ),
  },
  {
    q: "Kann ich auch nur einen Belag oder nur ein Holz tauschen?",
    a: (
      <p>
        Klar. Sag im Chat, was Du behalten willst, der Berater optimiert dann nur die
        fehlenden Komponenten und prüft die Synergie zum Bestand. Oft reicht ein neuer
        VH-Belag, um aus einem mittelmäßigen Setup ein gutes zu machen.
      </p>
    ),
  },
  {
    q: "Was tut PongSmith bewusst NICHT?",
    a: (
      <div className="flex flex-col gap-3">
        <p>Vier Selbstverpflichtungen, an die wir uns halten:</p>
        <ul className="flex flex-col gap-2">
          {[
            ["Keine Bundesliga-Beläge an Hobbyspieler pushen", "Tenergy 05 unter 1.700 TTR macht Frust statt Spin."],
            ["Keine Hersteller-Werbedeals", "Kein Hersteller bezahlt uns für bessere Platzierung."],
            ["Keine Provisions-Optimierung der Empfehlungen", "Empfehlung folgt deinem Profil, nicht der Marge."],
            ["Kein Newsletter-Spam", "Es gibt schlicht keinen Newsletter."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-2">
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-400">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                  <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span>
                <strong className="text-neutral-50">{title}.</strong>{" "}
                <span className="text-neutral-300">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    q: "Wer steht hinter PongSmith?",
    a: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/founder-chris.jpg"
            alt="Christoph Gabrecht"
            className="h-16 w-16 rounded-md border border-neutral-700 object-cover"
          />
          <div>
            <div className="text-base font-semibold text-neutral-50">Christoph Gabrecht</div>
            <div className="text-xs text-primary">
              Vereinsspieler · Mitgründer Shakehands e.V. Dresden
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              38 Jahre · Q-TTR 1.280
            </div>
          </div>
        </div>
        <p>
          PongSmith soll genau die Frustration verhindern, die ich selbst und viele
          Vereinskollegen durchgemacht haben: 200 € in ein Setup stecken, das nicht passt -
          und dadurch die Freude am Sport verlieren. Die Seite wird laufend mit neuen Daten
          gefüttert. Wenn dir was auffällt, schreib mich an:{" "}
          <a href="mailto:hallo@pongsmith.de" className="text-primary hover:underline">
            hallo@pongsmith.de
          </a>
        </p>
      </div>
    ),
  },
];

function PlusIcon({ open }: { open: boolean }) {
  return (
    <motion.span
      animate={{ rotate: open ? 45 : 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="shrink-0 text-primary"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.span>
  );
}

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-neutral-800 bg-neutral-900 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionHeader eyebrow="Häufige Fragen" headline="Häufige Fragen." />

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface-hover"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-neutral-50">{item.q}</span>
                  <PlusIcon open={isOpen} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-neutral-700"
                    >
                      <div className="px-6 py-4 text-sm leading-relaxed text-neutral-300">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
