"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ProductOption {
  id: number;
  label: string;
  name: string;
  manufacturer: string;
  reviews: number;
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
            <div className="px-4 py-3 text-sm text-neutral-400">
              Keine Treffer. Anderen Begriff probieren.
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
    </div>
  );
}
