"use client";

/**
 * /mithelfen Form — anonyme Spieler-Submission.
 *
 * 4 Steps. Komplett anonym. Vollautomatischer AI-Check + Auto-Insert
 * via /api/submit-interview.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/language-context";

type PlayStyle = "offensive_topspin" | "allround" | "defensive" | "material";
type Hand = "right" | "left";

interface ProductOption {
  id: number;
  label: string;
  name: string;
  manufacturer: string;
  reviews: number;
}

interface FormState {
  step: number;
  ttr: number;
  spielstil: PlayStyle | null;
  hand: Hand;
  blade: ProductOption | null;
  rubberVh: ProductOption | null;
  rubberRh: ProductOption | null;
  rhSameAsVh: boolean;
  satisfaction: number;
  goodText: string;
  badText: string;
  previousText: string;
  // Honeypot — bleibt leer
  website: string;
}

const TOTAL_STEPS = 4;

// ─── Autocomplete-Field ────────────────────────────────────────────────────

function ProductAutocomplete({
  type, value, onChange, placeholder, lang,
}: {
  type: "blade" | "rubber";
  value: ProductOption | null;
  onChange: (v: ProductOption | null) => void;
  placeholder: string;
  lang: "de" | "en";
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (value && query !== value.label) {
      // Wenn extern geleert
      setQuery(value.label);
    }
  }, [value, query]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&type=${type}`);
      const data = await res.json() as { results?: ProductOption[] };
      setOptions(data.results ?? []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  function handleInput(v: string) {
    setQuery(v);
    setOpen(true);
    if (value && v !== value.label) onChange(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void search(v), 200);
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
          border: value
            ? "1px solid rgba(34,197,94,0.4)"
            : "1px solid var(--ps-line)",
          color: "var(--ps-ink-0)",
          padding: "12px 14px",
          borderRadius: 4,
          fontSize: 14,
          outline: "none",
          fontFamily: "inherit",
        }}
      />
      {value && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#4ade80",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          ✓
        </span>
      )}
      {open && (loading || options.length > 0) && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--ps-bg-1)",
            border: "1px solid var(--ps-line)",
            borderRadius: 4,
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {loading && (
            <div className="ff-mono" style={{ padding: "10px 14px", fontSize: 11, color: "var(--ps-ink-4)", letterSpacing: "0.08em" }}>
              {lang === "de" ? "SUCHE…" : "SEARCHING…"}
            </div>
          )}
          {!loading && options.length === 0 && query.trim().length >= 2 && (
            <div style={{ padding: "10px 14px", fontSize: 13, color: "var(--ps-ink-3)" }}>
              {lang === "de" ? "Keine Treffer. Anderen Begriff probieren." : "No matches. Try a different term."}
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: "transparent",
                border: 0,
                borderBottom: "1px solid var(--ps-line-2)",
                color: "var(--ps-ink-1)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: "var(--ps-ink-0)", fontWeight: 500 }}>{opt.name}</span>
              <span style={{ marginLeft: 8, color: "var(--ps-ink-4)", fontSize: 11 }}>
                {opt.reviews > 0 ? `★ ${opt.reviews}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────

export function ContributeForm() {
  const { t, lang } = useLanguage();
  const tc = t.contribute;
  const [state, setState] = useState<FormState>({
    step: 1,
    ttr: 1300,
    spielstil: null,
    hand: "right",
    blade: null, rubberVh: null, rubberRh: null,
    rhSameAsVh: false,
    satisfaction: 7,
    goodText: "", badText: "", previousText: "",
    website: "", // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  // Validierung pro Step
  const canAdvance = (() => {
    if (state.step === 1) return state.ttr >= 800 && state.ttr <= 2200 && state.spielstil !== null;
    if (state.step === 2) {
      if (!state.blade || !state.rubberVh) return false;
      if (state.rhSameAsVh) return true;
      return state.rubberRh !== null;
    }
    if (state.step === 3) return state.satisfaction >= 1 && state.satisfaction <= 10;
    return true;
  })();

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setResult(null);

    const payload = {
      ttr: state.ttr,
      spielstil: state.spielstil,
      hand: state.hand,
      bladeId: state.blade!.id,
      rubberVhId: state.rubberVh!.id,
      rubberRhId: state.rhSameAsVh ? state.rubberVh!.id : state.rubberRh!.id,
      satisfaction: state.satisfaction,
      goodText: state.goodText.trim() || undefined,
      badText: state.badText.trim() || undefined,
      previousText: state.previousText.trim() || undefined,
      website: state.website, // honeypot
    };

    try {
      const res = await fetch("/api/submit-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success: boolean; message: string };
      setResult(data);
    } catch {
      setResult({ success: false, message: lang === "de" ? "Verbindungsfehler. Versuch's nochmal." : "Connection error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Erfolgs-Ansicht ───────────────────────────────────────────────────
  if (result?.success) {
    return (
      <div className="card-forged" style={{ padding: 36, textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>🙏</div>
        <div className="ff-display" style={{ fontSize: 32, color: "var(--ps-ink-0)", lineHeight: 1.15 }}>
          {tc.successTitle}
        </div>
        <p style={{ color: "var(--ps-ink-2)", margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>
          {result.message}
        </p>
        <a
          href="/"
          className="ember-btn ember-btn-glow"
          style={{ alignSelf: "center", padding: "12px 22px", fontSize: 14, textDecoration: "none", display: "inline-flex", gap: 8 }}
        >
          {tc.successBack} →
        </a>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="card-forged" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Progress */}
      <div>
        <div className="ff-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.16em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
          <span>{tc.stepLabel} {state.step} / {TOTAL_STEPS}</span>
          <span style={{ color: "var(--ps-ink-4)" }}>{tc.timeEstimate}</span>
        </div>
        <div style={{ height: 2, background: "var(--ps-bg-3)", borderRadius: 999 }}>
          <div style={{
            height: "100%",
            width: `${(state.step / TOTAL_STEPS) * 100}%`,
            background: "linear-gradient(90deg, var(--ps-ember-deep), var(--ps-ember))",
            borderRadius: 999,
            transition: "width 240ms",
          }} />
        </div>
      </div>

      {/* Honeypot — versteckt für User, sichtbar für Bots */}
      <input
        type="text"
        name="website"
        value={state.website}
        onChange={(e) => update("website", e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        style={{ position: "absolute", left: "-9999px", opacity: 0, width: 0, height: 0 }}
      />

      {/* ─── STEP 1 — Du ─── */}
      {state.step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <h3 className="ff-display" style={{ fontSize: 26, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>
            {tc.step1Title}
          </h3>

          {/* TTR */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <label className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {tc.ttrLabel}
              </label>
              <span className="ff-display" style={{ fontSize: 36, color: "var(--ps-ember-2)", lineHeight: 1 }}>
                {lang === "de" ? state.ttr.toLocaleString("de-DE") : state.ttr.toLocaleString("en-US")}
              </span>
            </div>
            <input
              type="range"
              min={800}
              max={2200}
              step={10}
              value={state.ttr}
              onChange={(e) => update("ttr", Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--ps-ember)", cursor: "pointer" }}
            />
            <div className="ff-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ps-ink-4)", marginTop: 4 }}>
              <span>800</span><span>2200</span>
            </div>
          </div>

          {/* Spielstil */}
          <div>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 10 }}>
              {tc.styleLabel}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {tc.styles.map((s) => {
                const active = state.spielstil === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update("spielstil", s.id as PlayStyle)}
                    style={{
                      padding: "12px 10px",
                      background: active ? "rgba(255,107,53,0.12)" : "var(--ps-bg-2)",
                      border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
                      borderRadius: 4,
                      color: active ? "var(--ps-ember-2)" : "var(--ps-ink-1)",
                      fontSize: 13, fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 140ms",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hand */}
          <div>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 10 }}>
              {tc.handLabel}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["right", "left"] as Hand[]).map((h) => {
                const active = state.hand === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => update("hand", h)}
                    style={{
                      padding: "10px 22px",
                      background: active ? "rgba(255,107,53,0.12)" : "var(--ps-bg-2)",
                      border: active ? "1px solid rgba(255,107,53,0.5)" : "1px solid var(--ps-line)",
                      borderRadius: 4,
                      color: active ? "var(--ps-ember-2)" : "var(--ps-ink-1)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {h === "right" ? tc.handRight : tc.handLeft}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2 — Setup ─── */}
      {state.step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h3 className="ff-display" style={{ fontSize: 26, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>
            {tc.step2Title}
          </h3>
          <p style={{ margin: 0, color: "var(--ps-ink-3)", fontSize: 13.5, lineHeight: 1.5 }}>
            {tc.step2Hint}
          </p>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {tc.bladeLabel}
            </label>
            <ProductAutocomplete
              type="blade"
              value={state.blade}
              onChange={(v) => update("blade", v)}
              placeholder={tc.bladePlaceholder}
              lang={lang}
            />
          </div>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {tc.rubberVhLabel}
            </label>
            <ProductAutocomplete
              type="rubber"
              value={state.rubberVh}
              onChange={(v) => update("rubberVh", v)}
              placeholder={tc.rubberPlaceholder}
              lang={lang}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {tc.rubberRhLabel}
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ps-ink-2)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={state.rhSameAsVh}
                  onChange={(e) => update("rhSameAsVh", e.target.checked)}
                />
                {tc.rhSameAsVh}
              </label>
            </div>
            {!state.rhSameAsVh && (
              <ProductAutocomplete
                type="rubber"
                value={state.rubberRh}
                onChange={(v) => update("rubberRh", v)}
                placeholder={tc.rubberPlaceholder}
                lang={lang}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── STEP 3 — Bewertung ─── */}
      {state.step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h3 className="ff-display" style={{ fontSize: 26, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>
            {tc.step3Title}
          </h3>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase" }}>
                {tc.satisfactionLabel}
              </label>
              <span className="ff-display" style={{ fontSize: 28, color: "var(--ps-ember-2)" }}>
                {state.satisfaction}<span style={{ fontSize: 14, color: "var(--ps-ink-3)" }}> / 10</span>
              </span>
            </div>
            <input
              type="range"
              min={1} max={10} step={1}
              value={state.satisfaction}
              onChange={(e) => update("satisfaction", Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--ps-ember)", cursor: "pointer" }}
            />
          </div>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {tc.goodLabel} <span style={{ color: "var(--ps-ink-4)", textTransform: "none", letterSpacing: 0 }}>({tc.optional})</span>
            </label>
            <input
              type="text"
              value={state.goodText}
              onChange={(e) => update("goodText", e.target.value)}
              placeholder={tc.goodPlaceholder}
              maxLength={200}
              style={{
                width: "100%", background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
                color: "var(--ps-ink-0)", padding: "10px 12px", borderRadius: 4, fontSize: 14,
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label className="ff-mono" style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "var(--ps-ink-3)", textTransform: "uppercase", marginBottom: 8 }}>
              {tc.badLabel} <span style={{ color: "var(--ps-ink-4)", textTransform: "none", letterSpacing: 0 }}>({tc.optional})</span>
            </label>
            <input
              type="text"
              value={state.badText}
              onChange={(e) => update("badText", e.target.value)}
              placeholder={tc.badPlaceholder}
              maxLength={200}
              style={{
                width: "100%", background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
                color: "var(--ps-ink-0)", padding: "10px 12px", borderRadius: 4, fontSize: 14,
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}

      {/* ─── STEP 4 — Wechsel ─── */}
      {state.step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h3 className="ff-display" style={{ fontSize: 26, lineHeight: 1.15, margin: 0, color: "var(--ps-ink-0)" }}>
            {tc.step4Title}
          </h3>
          <p style={{ margin: 0, color: "var(--ps-ink-3)", fontSize: 13.5, lineHeight: 1.5 }}>
            {tc.step4Hint}
          </p>
          <textarea
            value={state.previousText}
            onChange={(e) => update("previousText", e.target.value)}
            placeholder={tc.previousPlaceholder}
            maxLength={400}
            rows={4}
            style={{
              width: "100%", background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              color: "var(--ps-ink-0)", padding: "12px 14px", borderRadius: 4, fontSize: 14,
              outline: "none", fontFamily: "inherit", resize: "vertical",
            }}
          />

          <div className="ff-mono" style={{
            padding: "12px 14px",
            background: "var(--ps-bg-2)",
            border: "1px solid var(--ps-line)",
            borderRadius: 4,
            fontSize: 11,
            color: "var(--ps-ink-3)",
            lineHeight: 1.6,
            letterSpacing: "0.04em",
          }}>
            {tc.privacyNote}
          </div>
        </div>
      )}

      {/* Result/Error */}
      {result && !result.success && (
        <div style={{
          background: "rgba(217,106,90,0.08)", border: "1px solid rgba(217,106,90,0.4)",
          borderRadius: 4, padding: "12px 14px", color: "var(--ps-bad)", fontSize: 13,
        }}>
          {result.message}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        {state.step > 1 ? (
          <button
            type="button"
            onClick={() => update("step", state.step - 1)}
            style={{
              background: "transparent", border: "1px solid var(--ps-line)",
              color: "var(--ps-ink-2)", padding: "10px 16px", borderRadius: 4,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ← {tc.back}
          </button>
        ) : <span />}

        {state.step < TOTAL_STEPS ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => update("step", state.step + 1)}
            className="ember-btn ember-btn-glow"
            style={{ padding: "10px 18px", fontSize: 13, opacity: canAdvance ? 1 : 0.4 }}
          >
            {tc.next} →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !state.blade || !state.rubberVh}
            className="ember-btn ember-btn-glow"
            style={{ padding: "10px 22px", fontSize: 13, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? `${tc.submitting}…` : `${tc.submit} →`}
          </button>
        )}
      </div>
    </div>
  );
}
