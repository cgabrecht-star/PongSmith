"use client";

/**
 * BeraterFlow — Wrapper um BeraterChat mit optionalem Vorab-Setup-Erfassung.
 *
 * Drei States:
 *   1. "intro": User wählt zwischen "Setup angeben" oder "direkt chatten"
 *   2. "form": Mini-2-Step-Form (TTR/Stil + Setup) — schickt Daten anonym an
 *      /api/submit-interview UND startet Chat mit vorbefüllter Erst-Nachricht
 *   3. "chat": bisheriger BeraterChat, ggf. mit initialer Nachricht
 *
 * Wenn vom Problem-Express ein send-direct-Event kommt, springen wir
 * automatisch in "chat" und leiten weiter.
 */

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { BeraterChat } from "@/components/berater-chat";

type FlowState = "intro" | "form" | "chat";

type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";
type Hand = "right" | "left";

interface ProductOption {
  id: number;
  label: string;
  name: string;
  manufacturer: string;
  reviews: number;
}

// ─── Autocomplete (kompakt, eigenständig) ─────────────────────────────────

function ProductAutocomplete({
  type, value, onChange, placeholder,
}: {
  type: "blade" | "rubber";
  value: ProductOption | null;
  onChange: (v: ProductOption | null) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (value && query !== value.label) setQuery(value.label);
  }, [value, query]);

  function handleInput(v: string) {
    setQuery(v);
    setOpen(true);
    if (value && v !== value.label) onChange(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (v.trim().length < 2) { setOptions([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(v)}&type=${type}`);
        const data = await res.json() as { results?: ProductOption[] };
        setOptions(data.results ?? []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function pick(opt: ProductOption) {
    onChange(opt);
    setQuery(opt.label);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          background: "var(--ps-bg-2)",
          border: value ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--ps-line)",
          color: "var(--ps-ink-0)",
          padding: "10px 12px",
          borderRadius: 4,
          fontSize: 13.5,
          outline: "none",
          fontFamily: "inherit",
        }}
      />
      {open && (loading || options.length > 0) && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--ps-bg-1)", border: "1px solid var(--ps-line)",
          borderRadius: 4, maxHeight: 240, overflowY: "auto", zIndex: 50,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {loading && (
            <div className="ff-mono" style={{ padding: "8px 12px", fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.08em" }}>
              SUCHE…
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 12px", background: "transparent", border: 0,
                borderBottom: "1px solid var(--ps-line-2)",
                color: "var(--ps-ink-1)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: "var(--ps-ink-0)", fontWeight: 500 }}>{opt.name}</span>
              {opt.reviews > 0 && (
                <span style={{ marginLeft: 8, color: "var(--ps-ink-4)", fontSize: 10 }}>★ {opt.reviews}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Setup-Form (2 Steps, kompakt) ────────────────────────────────────────

function SetupForm({ onComplete, onCancel }: {
  onComplete: (data: SetupFormData) => void;
  onCancel: () => void;
}) {
  const { t, lang } = useLanguage();
  const ti = t.beraterIntro;
  const [step, setStep] = useState<1 | 2>(1);
  const [ttr, setTtr] = useState(1300);
  const [spielstil, setSpielstil] = useState<PlayStyle | null>(null);
  const [hand, setHand] = useState<Hand>("right");
  const [blade, setBlade] = useState<ProductOption | null>(null);
  const [rubberVh, setRubberVh] = useState<ProductOption | null>(null);
  const [rubberRh, setRubberRh] = useState<ProductOption | null>(null);
  const [rhSameAsVh, setRhSameAsVh] = useState(false);
  const [pain, setPain] = useState("");

  const styles: { id: PlayStyle; label: string }[] = [
    { id: "offensive_topspin", label: lang === "de" ? "Offensiv" : "Offensive" },
    { id: "allround", label: "Allround" },
    { id: "defensive", label: lang === "de" ? "Defensiv" : "Defensive" },
    { id: "material", label: lang === "de" ? "Material" : "Material" },
  ];

  const canStep1 = ttr >= 800 && ttr <= 2200 && spielstil !== null;
  const canSubmit = blade !== null && rubberVh !== null && (rhSameAsVh || rubberRh !== null);

  function submit() {
    onComplete({
      ttr, spielstil: spielstil!, hand,
      blade: blade!, rubberVh: rubberVh!,
      rubberRh: rhSameAsVh ? rubberVh! : rubberRh!,
      pain: pain.trim() || undefined,
    });
  }

  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Progress */}
      <div className="ff-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
        <span>Step {step} / 2</span>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "transparent", border: 0, color: "var(--ps-ink-4)", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
        >
          ← {lang === "de" ? "Doch direkt chatten" : "Just chat"}
        </button>
      </div>

      {step === 1 && (
        <>
          <h3 className="ff-display" style={{ fontSize: 22, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>{ti.formStep1Title}</h3>

          {/* TTR-Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {ti.formTtrLabel}
              </label>
              <span className="ff-display" style={{ fontSize: 28, color: "var(--ps-ember-2)", lineHeight: 1 }}>
                {lang === "de" ? ttr.toLocaleString("de-DE") : ttr.toLocaleString("en-US")}
              </span>
            </div>
            <input type="range" min={800} max={2200} step={10} value={ttr}
              onChange={(e) => setTtr(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--ps-ember)", cursor: "pointer" }}
            />
          </div>

          {/* Spielstil */}
          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {ti.formStyleLabel}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {styles.map((s) => {
                const active = spielstil === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setSpielstil(s.id)}
                    style={{
                      padding: "8px 10px",
                      background: active ? "rgba(255,107,53,0.12)" : "var(--ps-bg-2)",
                      border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
                      borderRadius: 4,
                      color: active ? "var(--ps-ember-2)" : "var(--ps-ink-1)",
                      fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {/* Hand */}
          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {ti.formHandLabel}
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["right", "left"] as Hand[]).map((h) => {
                const active = hand === h;
                return (
                  <button key={h} type="button" onClick={() => setHand(h)}
                    style={{
                      padding: "8px 18px",
                      background: active ? "rgba(255,107,53,0.12)" : "var(--ps-bg-2)",
                      border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
                      borderRadius: 4,
                      color: active ? "var(--ps-ember-2)" : "var(--ps-ink-1)",
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{h === "right" ? ti.formHandRight : ti.formHandLeft}</button>
                );
              })}
            </div>
          </div>

          <button type="button" disabled={!canStep1} onClick={() => setStep(2)}
            className="ember-btn ember-btn-glow"
            style={{ padding: "10px 16px", fontSize: 13, opacity: canStep1 ? 1 : 0.4, marginTop: 4 }}
          >{ti.formNext} →</button>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="ff-display" style={{ fontSize: 22, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>{ti.formStep2Title}</h3>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
              {ti.formBladeLabel}
            </label>
            <ProductAutocomplete type="blade" value={blade} onChange={setBlade} placeholder={ti.formBladePlaceholder} />
          </div>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
              {ti.formRubberVhLabel}
            </label>
            <ProductAutocomplete type="rubber" value={rubberVh} onChange={setRubberVh} placeholder={ti.formRubberPlaceholder} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label className="ff-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {ti.formRubberRhLabel}
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ps-ink-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={rhSameAsVh} onChange={(e) => setRhSameAsVh(e.target.checked)} />
                {ti.formSameAsVh}
              </label>
            </div>
            {!rhSameAsVh && (
              <ProductAutocomplete type="rubber" value={rubberRh} onChange={setRubberRh} placeholder={ti.formRubberPlaceholder} />
            )}
          </div>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
              {ti.formPainLabel}
            </label>
            <input type="text" value={pain} onChange={(e) => setPain(e.target.value)}
              placeholder={ti.formPainPlaceholder} maxLength={200}
              style={{
                width: "100%", background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
                color: "var(--ps-ink-0)", padding: "10px 12px", borderRadius: 4, fontSize: 13.5,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <p style={{ margin: "4px 2px 0", fontSize: 10.5, color: "var(--ps-ink-4)", lineHeight: 1.4 }}>
              {ti.formPainSub}
            </p>
          </div>

          <p className="ff-mono" style={{
            margin: 0, padding: "8px 10px",
            background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
            borderRadius: 3, fontSize: 9.5, color: "var(--ps-ink-3)",
            letterSpacing: "0.04em", lineHeight: 1.5,
          }}>
            🛡️ {ti.privacyNote}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <button type="button" onClick={() => setStep(1)}
              style={{
                background: "transparent", border: "1px solid var(--ps-line)",
                color: "var(--ps-ink-2)", padding: "10px 14px", borderRadius: 4,
                fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
              }}
            >← {ti.formBack}</button>
            <button type="button" disabled={!canSubmit} onClick={submit}
              className="ember-btn ember-btn-glow"
              style={{ padding: "10px 18px", fontSize: 12.5, opacity: canSubmit ? 1 : 0.4 }}
            >{ti.formStart} →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Setup-Form-Daten ─────────────────────────────────────────────────────

interface SetupFormData {
  ttr: number;
  spielstil: PlayStyle;
  hand: Hand;
  blade: ProductOption;
  rubberVh: ProductOption;
  rubberRh: ProductOption;
  pain?: string;
}

// ─── Intro-Choice ─────────────────────────────────────────────────────────

function IntroChoice({ onPickForm, onPickChat }: { onPickForm: () => void; onPickChat: () => void }) {
  const ti = useLanguage().t.beraterIntro;
  return (
    <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h3 className="ff-display" style={{ fontSize: 24, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>
          ⚡ {ti.title}
        </h3>
        <p style={{ margin: "8px 0 0", color: "var(--ps-ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>
          {ti.sub}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onPickForm}
          className="ember-btn ember-btn-glow"
          style={{
            padding: "16px 18px", fontSize: 14, textAlign: "left",
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
            width: "100%",
          }}
        >
          <span style={{ fontWeight: 600 }}>{ti.ctaForm} →</span>
          <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 400 }}>{ti.ctaFormSub}</span>
        </button>

        <button onClick={onPickChat}
          style={{
            padding: "14px 18px", fontSize: 13.5, textAlign: "left",
            background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
            borderRadius: 4, color: "var(--ps-ink-1)", cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
          }}
        >
          <span style={{ fontWeight: 500 }}>{ti.ctaChat} →</span>
          <span style={{ fontSize: 11, color: "var(--ps-ink-4)" }}>{ti.ctaChatSub}</span>
        </button>
      </div>

      <p className="ff-mono" style={{
        margin: 0, fontSize: 9.5, color: "var(--ps-ink-4)",
        textAlign: "center", letterSpacing: "0.06em", lineHeight: 1.5,
      }}>
        🛡️ {ti.privacyNote}
      </p>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────

export function BeraterFlow() {
  const { lang } = useLanguage();
  const [state, setState] = useState<FlowState>("intro");
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  // Wenn vom Problem-Express ein send-direct-Event kommt, in Chat springen
  // (das Event wird von BeraterChat selbst gehandled, aber wir müssen erst
  // dorthin wechseln)
  useEffect(() => {
    function onSendDirect() {
      if (state !== "chat") setState("chat");
    }
    window.addEventListener("pongsmith:send-direct", onSendDirect);
    return () => window.removeEventListener("pongsmith:send-direct", onSendDirect);
  }, [state]);

  // Wenn Form abgeschlossen: Daten an Backend (anonym) + Erste Nachricht aufbauen
  function handleFormComplete(data: SetupFormData) {
    // 1. Daten anonym an /api/submit-interview
    void fetch("/api/submit-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ttr: data.ttr,
        spielstil: data.spielstil,
        hand: data.hand,
        bladeId: data.blade.id,
        rubberVhId: data.rubberVh.id,
        rubberRhId: data.rubberRh.id,
        satisfaction: 5, // neutral, weil im Berater-Kontext keine direkte Bewertung
        badText: data.pain,
        previousText: undefined,
      }),
    }).catch((err) => console.error("[BeraterFlow] background submit failed:", err));

    // 2. Erste Berater-Nachricht zusammenbauen
    const styleLabel = {
      offensive_topspin: lang === "de" ? "offensiv-Topspin" : "offensive-topspin",
      allround: "Allround",
      defensive: lang === "de" ? "defensiv" : "defensive",
      material: lang === "de" ? "Material (Noppen/Anti)" : "material (pips/anti)",
    }[data.spielstil];

    const handLabel = data.hand === "right"
      ? (lang === "de" ? "RH" : "RH")
      : (lang === "de" ? "LH" : "LH");

    const sameRubber = data.rubberVh.id === data.rubberRh.id;
    const rubberPart = sameRubber
      ? (lang === "de"
        ? `${data.rubberVh.name} auf beiden Seiten`
        : `${data.rubberVh.name} on both sides`)
      : (lang === "de"
        ? `${data.rubberVh.name} (VH) und ${data.rubberRh.name} (RH)`
        : `${data.rubberVh.name} (FH) and ${data.rubberRh.name} (BH)`);

    const msg = lang === "de"
      ? `Mein TTR ist ${data.ttr}, ich spiele ${styleLabel}, ${handLabel}.\n\nAktuelles Setup: ${data.blade.name} mit ${rubberPart}.${data.pain ? `\n\nWas mich daran nervt: ${data.pain}` : ""}`
      : `My TTR is ${data.ttr}, I play ${styleLabel}, ${handLabel}.\n\nCurrent setup: ${data.blade.name} with ${rubberPart}.${data.pain ? `\n\nWhat annoys me: ${data.pain}` : ""}`;

    setInitialMessage(msg);
    setState("chat");
  }

  // Render je nach State
  if (state === "intro") {
    return (
      <div className="card-forged" style={{ display: "flex", height: "100%", flexDirection: "column", overflow: "hidden", justifyContent: "center" }}>
        <IntroChoice
          onPickForm={() => setState("form")}
          onPickChat={() => setState("chat")}
        />
      </div>
    );
  }

  if (state === "form") {
    return (
      <div className="card-forged" style={{ display: "flex", height: "100%", flexDirection: "column", overflow: "auto" }}>
        <SetupForm
          onComplete={handleFormComplete}
          onCancel={() => setState("chat")}
        />
      </div>
    );
  }

  return <BeraterChat initialMessage={initialMessage} />;
}
