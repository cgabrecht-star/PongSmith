"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Erster Satz von PongSmith — kein API-Call
// ---------------------------------------------------------------------------

const GREETING =
  "Hallo! Ich bin PongSmith, dein unabhängiger Ausrüstungsberater. 🏓\n\nErzähl mir kurz von dir: Welchen Q-TTR hast du ungefähr, wie spielst du (offensiv, allround oder defensiv) — und was nervt dich an deinem aktuellen Setup?";

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function formatText(text: string) {
  // Nummerierte Listen und Zeilenumbrüche formatieren
  return text.split("\n").map((line, i) => {
    const isNumbered = /^\d+\./.test(line.trim());
    return (
      <span key={i} className={`block ${isNumbered ? "mt-2 first:mt-0" : ""}`}>
        {line || <br />}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Typing-Indikator
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nachrichtenblase
// ---------------------------------------------------------------------------

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
          PS
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-orange-500 text-white"
            : "rounded-tl-sm bg-zinc-100 text-zinc-800"
        }`}
      >
        {formatText(msg.content)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

export function BeraterChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setApiError(null);

    try {
      // Alle Nachrichten inkl. Begrüßung an API schicken
      const res = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };

      if (data.error) {
        setApiError(data.error);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text ?? "" }]);
      }
    } catch {
      setApiError("Verbindungsfehler — bitte erneut versuchen.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Chat-Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
          PS
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900">PongSmith Berater</div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Bereit
          </div>
        </div>
      </div>

      {/* Nachrichten */}
      <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              PS
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}
      </div>

      {/* Eingabe */}
      <div className="border-t border-zinc-100 p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schreib PongSmith…"
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-0 disabled:opacity-50"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40"
            aria-label="Senden"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.254 3.9a.75.75 0 0 0 .54.499l7.303 1.479a.75.75 0 0 1 0 1.468l-7.303 1.479a.75.75 0 0 0-.54.499l-1.254 3.9a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Enter zum Senden · Shift+Enter für Zeilenumbruch
        </p>
      </div>
    </div>
  );
}
