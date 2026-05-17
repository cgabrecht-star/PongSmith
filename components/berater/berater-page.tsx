"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { ProgressBar } from "@/components/berater/progress-bar";
import { StepSetup, type SetupData } from "@/components/berater/step-setup";
import { StepProblem, type ProblemData } from "@/components/berater/step-problem";
import { StepLoading } from "@/components/berater/step-loading";
import { StepResults, type BeraterResult } from "@/components/berater/step-results";

type FlowStep = 1 | 2 | 3 | 4;

const INITIAL_SETUP: SetupData = {
  ttr: 1300,
  spielstil: "allround",
  hand: "right",
  blade: null,
  rubberVh: null,
  rubberRh: null,
  rhSameAsVh: false,
};

const INITIAL_PROBLEM: ProblemData = {
  freitext: "",
  quickPicked: null,
};

/**
 * Hauptkomponente für den Berater-Flow.
 *
 * 4 Steps linear:
 *  1. Setup eingeben (mit Skip)
 *  2. Problem beschreiben (Freitext + Quick-Picks)
 *  3. Loading-Animation während API-Call
 *  4. Setup-Karten als Endergebnis
 */
type ChatMsg = { role: "user" | "assistant"; content: string };

export function BeraterPage() {
  const [step, setStep] = useState<FlowStep>(1);
  const [setup, setSetup] = useState<SetupData>(INITIAL_SETUP);
  const [problem, setProblem] = useState<ProblemData>(INITIAL_PROBLEM);
  const [setupSkipped, setSetupSkipped] = useState(false);
  const [result, setResult] = useState<BeraterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Step-1 → Step-2: Setup eingeben fertig
  function handleSetupNext() {
    setSetupSkipped(false);
    setStep(2);
  }

  // Step-1 → Step-2: Setup übersprungen
  function handleSetupSkip() {
    setSetupSkipped(true);
    setStep(2);
  }

  // Step-2 → Step-3: Beraten lassen
  async function handleSubmit() {
    setStep(3);
    setError(null);

    // Vercel Analytics: Berater-Submission (Conversion-Funnel Stufe 1)
    track("berater_submitted", {
      ttr: setup.ttr,
      spielstil: setup.spielstil,
      setupSkipped,
      hasFreitext: problem.freitext.length > 0,
      quickPick: problem.quickPicked ?? "none",
    });

    // Anonymes Submit der Setup-Daten (nur wenn nicht geskippt + Pflichtfelder vollständig)
    if (!setupSkipped && setup.blade && setup.rubberVh) {
      void fetch("/api/submit-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ttr: setup.ttr,
          spielstil: setup.spielstil,
          hand: setup.hand,
          bladeId: setup.blade.id,
          rubberVhId: setup.rubberVh.id,
          rubberRhId: setup.rhSameAsVh ? setup.rubberVh.id : setup.rubberRh?.id ?? setup.rubberVh.id,
          satisfaction: 5,
          badText: problem.freitext,
        }),
      }).catch((err) => console.error("[BeraterPage] submit-interview failed:", err));
    }

    // Erste User-Nachricht für den Berater zusammenbauen
    const message = buildMessage(setup, problem, setupSkipped);
    const initialHistory: ChatMsg[] = [{ role: "user", content: message }];

    try {
      const res = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: initialHistory,
          lang: "de",
        }),
      });
      const data = await res.json();
      if (data.error) {
        track("berater_failed", { reason: String(data.error).slice(0, 80) });
        setError(data.error);
        setStep(2);
        return;
      }
      const setups = data.setups ?? [];
      const text = data.text ?? "";
      setResult({ text, setups });
      setHistory([...initialHistory, { role: "assistant", content: text }]);
      setStep(4);

      // Vercel Analytics: Berater-Success (Conversion-Funnel Stufe 2)
      track("berater_success", {
        setupsCount: setups.length,
        productsCount: setups.reduce(
          (sum: number, s: { products?: unknown[] }) => sum + (s.products?.length ?? 0),
          0,
        ),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      track("berater_failed", { reason: msg.slice(0, 80) });
      setError(msg);
      setStep(2);
    }
  }

  // Komplett zurücksetzen
  function handleRestart() {
    setSetup(INITIAL_SETUP);
    setProblem(INITIAL_PROBLEM);
    setSetupSkipped(false);
    setResult(null);
    setError(null);
    setHistory([]);
    setStep(1);
  }

  // Follow-up: User antwortet auf Rückfrage des Beraters
  async function handleFollowUp(reply: string) {
    const trimmed = reply.trim();
    if (!trimmed || followUpLoading) return;
    setFollowUpLoading(true);
    setError(null);
    const nextHistory: ChatMsg[] = [...history, { role: "user", content: trimmed }];
    setHistory(nextHistory);
    try {
      const res = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory, lang: "de" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const setups = data.setups ?? [];
      const text = data.text ?? "";
      setResult({ text, setups });
      setHistory([...nextHistory, { role: "assistant", content: text }]);
      track("berater_followup", { setupsCount: setups.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFollowUpLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <ProgressBar current={step} />

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <div key="step-1">
            <StepSetup
              data={setup}
              onChange={setSetup}
              onNext={handleSetupNext}
              onSkip={handleSetupSkip}
            />
          </div>
        )}
        {step === 2 && (
          <div key="step-2">
            <StepProblem
              data={problem}
              onChange={setProblem}
              onBack={() => setStep(1)}
              onSubmit={() => void handleSubmit()}
            />
          </div>
        )}
        {step === 3 && (
          <div key="step-3">
            <StepLoading />
          </div>
        )}
        {step === 4 && result && (
          <div key="step-4">
            <StepResults
              result={result}
              onRestart={handleRestart}
              onFollowUp={handleFollowUp}
              followUpLoading={followUpLoading}
              history={history}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildMessage(setup: SetupData, problem: ProblemData, setupSkipped: boolean): string {
  const styleLabel = {
    offensive_topspin: "offensiv (Topspin-Spieler)",
    allround: "Allround",
    defensive: "defensiv",
    material: "Material (Noppen/Anti)",
  }[setup.spielstil];

  const handLabel = setup.hand === "right" ? "RH" : "LH";

  let intro = "";
  if (setupSkipped) {
    // Nur Profil-Info, kein konkretes Setup
    intro = `Mein TTR ist ${setup.ttr}, ich spiele ${styleLabel}, ${handLabel}.`;
  } else {
    const sameRubber = setup.rubberVh?.id === setup.rubberRh?.id || setup.rhSameAsVh;
    const rubberPart = sameRubber
      ? `${setup.rubberVh?.name ?? "?"} auf beiden Seiten`
      : `${setup.rubberVh?.name ?? "?"} (VH) und ${setup.rubberRh?.name ?? "?"} (RH)`;
    intro = `Mein TTR ist ${setup.ttr}, ich spiele ${styleLabel}, ${handLabel}.\n\nAktuelles Setup: ${
      setup.blade?.name ?? "?"
    } mit ${rubberPart}.`;
  }

  return `${intro}\n\nMein Problem: ${problem.freitext.trim()}`;
}
