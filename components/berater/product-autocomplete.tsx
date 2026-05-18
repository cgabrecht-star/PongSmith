"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ProductOption {
  id: number;
  label: string;
  name: string;
  manufacturer: string;
  reviews: number;
}

/** Mini-Formular zum Melden eines fehlenden Modells. */
function MissingProductForm({
  type,
  initialQuery,
  onClose,
  onSubmitted,
}: {
  type: "blade" | "rubber";
  initialQuery: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [manufacturer, setManufacturer] = useState("");
  const [productName, setProductName] = useState(initialQuery);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (productName.trim().length < 2 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/missing-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reportedQuery: initialQuery,
          manufacturer: manufacturer.trim(),
          productName: productName.trim(),
          comment: comment.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Konnte nicht senden");
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  const typeLabel = type === "blade" ? "Holz" : "Belag";

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-md border border-primary/30 bg-neutral-900 p-4">
      <div>
        <p className="text-sm font-semibold text-neutral-50">
          {typeLabel} fehlt? Sag uns Bescheid.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Wir tragen's manuell nach. Keine Email nötig.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="Hersteller (z.B. Sanwei)"
          maxLength={100}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary"
        />
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Modellname (z.B. Surge Prism)"
          maxLength={200}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary"
        />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional: Specs falls du sie kennst (Inner-Carbon, ~88g, OFF, etc.)"
        rows={2}
        maxLength={1000}
        className="resize-none rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-200"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={productName.trim().length < 2 || loading}
          className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sende…" : "Melden"}
        </button>
      </div>
    </div>
  );
}

/**
 * Autocomplete-Input mit Live-Suche gegen /api/products/search.
 * Wiederverwendet im Setup-Step des Berater-Flows und im Contribute-Form.
 */
export function ProductAutocomplete({
  type,
  value,
  onChange,
  placeholder,
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (value && query !== value.label) setQuery(value.label);
  }, [value, query]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&type=${type}`);
      const data = (await res.json()) as { results?: ProductOption[] };
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
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-md border px-4 py-3 text-base text-neutral-50 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
          value
            ? "border-green-500/40 bg-green-500/5"
            : "border-neutral-700 bg-neutral-800"
        }`}
      />
      {value && (
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-400"
          aria-hidden
        >
          ✓
        </span>
      )}
      {open && (loading || options.length > 0 || query.trim().length >= 2) && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[28rem] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/50">
          {loading && (
            <div className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-neutral-400">
              Suche…
            </div>
          )}
          {!loading && options.length === 0 && query.trim().length >= 2 && (
            <div className="flex flex-col gap-2 px-4 py-3">
              <p className="text-sm text-neutral-400">
                Keine Treffer für „{query.trim()}".
              </p>
              {!reportSent ? (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setReportOpen(true);
                  }}
                  className="self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Dein {type === "blade" ? "Holz" : "Belag"} fehlt? Melden →
                </button>
              ) : (
                <p className="text-xs text-green-400">
                  ✓ Danke! Wir tragen's nach.
                </p>
              )}
            </div>
          )}
          {!loading && options.length > 5 && (
            <div className="sticky top-0 border-b border-neutral-800 bg-neutral-900 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              {options.length} Treffer · Tippe weiter zum Eingrenzen
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(opt);
              }}
              className="block w-full border-b border-neutral-800 px-4 py-3 text-left text-sm text-neutral-200 transition-colors hover:bg-surface-hover last:border-b-0"
            >
              <span className="font-medium text-neutral-50">{opt.name}</span>
              {opt.reviews > 0 && (
                <span className="ml-2 text-xs text-neutral-400">★ {opt.reviews}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {reportOpen && (
        <MissingProductForm
          type={type}
          initialQuery={query.trim()}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => {
            setReportSent(true);
            setReportOpen(false);
          }}
        />
      )}
    </div>
  );
}
