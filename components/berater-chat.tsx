"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface ShopLink {
  id: string;
  name: string;
  url: string;
}

interface DetectedProduct {
  type: "blade" | "rubber";
  id: number;
  name: string;
  manufacturer: string;
  shops: ShopLink[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Nur bei assistant-Nachrichten: erkannte Produkte mit Shop-Links */
  products?: DetectedProduct[];
}

// Rendert **fett**, *kursiv* und einfache Listen aus Markdown-Text
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      parts.push(<strong key={key++} style={{ color: "var(--ps-ink-0)", fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function formatText(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    const isEmpty = trimmed === "";
    const isBullet = /^[-–•]/.test(trimmed);
    const isNumbered = /^\d+\./.test(trimmed);
    const isArrow = trimmed.startsWith("→");

    if (isEmpty) return <br key={i} />;

    const content = isBullet
      ? trimmed.replace(/^[-–•]\s*/, "")
      : isArrow
        ? trimmed
        : line;

    return (
      <span
        key={i}
        style={{
          display: "block",
          marginTop: (isBullet || isNumbered || isArrow) ? "4px" : i === 0 ? 0 : "2px",
          paddingLeft: isBullet ? "1em" : isArrow ? "0.5em" : 0,
          textIndent: isBullet ? "-1em" : 0,
          color: isArrow ? "var(--ps-ember-2)" : undefined,
        }}
      >
        {isBullet && <span style={{ color: "var(--ps-ember)", marginRight: 6 }}>·</span>}
        {renderInline(content)}
      </span>
    );
  });
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            display: "block",
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--ps-ember-2)",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

function ShopButtons({ products, lang }: { products: DetectedProduct[]; lang: "de" | "en" }) {
  if (!products || products.length === 0) return null;
  const heading = lang === "de" ? "Hier kaufen" : "Buy here";
  const adLabel = lang === "de" ? "Werbung · Affiliate-Links" : "Ad · affiliate links";

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px dashed var(--ps-line)",
    }}>
      <div className="ff-mono" style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "var(--ps-ink-3)", marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>🛒 {heading}</span>
        <span style={{ color: "var(--ps-ink-4)", fontSize: 9 }}>{adLabel}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {products.map((p) => (
          <div
            key={`${p.type}:${p.id}`}
            style={{
              display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              fontSize: 12.5,
            }}
          >
            <span style={{ color: "var(--ps-ink-1)", marginRight: 4, flexShrink: 0 }}>
              <strong style={{ color: "var(--ps-ink-0)", fontWeight: 600 }}>{p.name}</strong>
              <span style={{ color: "var(--ps-ink-3)", marginLeft: 6, fontSize: 11 }}>
                {p.manufacturer}
              </span>
            </span>
            {p.shops.length === 0 ? (
              <span style={{ color: "var(--ps-ink-4)", fontSize: 11 }}>
                {lang === "de" ? "Shop folgt" : "shop coming"}
              </span>
            ) : (
              p.shops.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="sponsored noopener"
                  style={{
                    background: "var(--ps-bg-3)",
                    border: "1px solid var(--ps-line)",
                    color: "var(--ps-ember-2)",
                    padding: "3px 9px",
                    borderRadius: 3,
                    fontSize: 11.5,
                    textDecoration: "none",
                    fontFamily: "var(--font-jetbrains), monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name} →
                </a>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg, userLabel, lang }: { msg: Message; userLabel: string; lang: "de" | "en" }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: "linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))",
          border: "1px solid rgba(255,107,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ps-ember-2)", fontSize: 14,
        }}>
          🔨
        </div>
      )}

      <div style={{
        maxWidth: "78%",
        padding: "12px 14px",
        background: isUser
          ? "linear-gradient(180deg, #ff7a45, var(--ps-ember-deep))"
          : "var(--ps-bg-2)",
        color: isUser ? "#1a0d05" : "var(--ps-ink-0)",
        border: isUser ? "1px solid #ff8b56" : "1px solid var(--ps-line)",
        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        fontSize: 14.5, lineHeight: 1.55,
        boxShadow: isUser ? "0 4px 16px rgba(255,107,53,0.25)" : "none",
      }}>
        {formatText(msg.content)}
        {!isUser && msg.products && msg.products.length > 0 && (
          <ShopButtons products={msg.products} lang={lang} />
        )}
      </div>

      {isUser && (
        <div style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: "var(--ps-bg-3)", border: "1px solid var(--ps-line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ps-ink-2)", fontSize: 10, fontWeight: 600,
          fontFamily: "var(--font-jetbrains), monospace",
        }}>
          {userLabel}
        </div>
      )}
    </div>
  );
}

export function BeraterChat() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t.berater.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Greeting nachladen wenn Sprache wechselt UND noch keine User-Nachricht da ist
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMsg = prev.some((m) => m.role === "user");
      if (hasUserMsg) return prev; // laufendes Gespräch nicht zerstören
      return [{ role: "assistant", content: t.berater.greeting }];
    });
  }, [lang, t.berater.greeting]);

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
      const res = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          lang,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        products?: DetectedProduct[];
      };
      if (data.error) {
        setApiError(data.error);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.text ?? "",
          products: data.products,
        }]);
      }
    } catch {
      setApiError(t.berater.error);
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

  // Quick suggestions je Sprache
  const suggestions = lang === "de"
    ? [
      "1.280 TTR, VH-dominant, 100–200 €",
      "Allround, Block hält nicht stabil",
      "Defensiv, Kontrolle wichtiger als Tempo",
    ]
    : [
      "1,280 TTR, FH-dominant, €100–200 budget",
      "Allround, my block isn't stable",
      "Defensive, control over speed",
    ];

  const headerTitle = lang === "de" ? "Dein Schmied" : "Your Smith";
  const onlineLabel = lang === "de"
    ? "Online · antwortet in Sekunden"
    : "Online · replies in seconds";
  const userLabel = lang === "de" ? "DU" : "YOU";
  const sendHint = lang === "de" ? "⏎ senden · ⇧⏎ neue Zeile" : "⏎ send · ⇧⏎ new line";

  return (
    <div className="card-forged" style={{ display: "flex", height: "100%", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid var(--ps-line-2)", padding: "14px 20px",
        background: "var(--ps-bg-1)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 4,
          background: "linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))",
          border: "1px solid rgba(255,107,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🔨</div>
        <div>
          <div className="ff-display" style={{ fontSize: 20, lineHeight: 1, color: "var(--ps-ink-0)" }}>{headerTitle}</div>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ps-ink-3)", marginTop: 3 }}>
            <span style={{ color: "var(--ps-good)" }}>●</span> {onlineLabel}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} userLabel={userLabel} lang={lang} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4, flexShrink: 0,
              background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🔨</div>
            <div style={{
              padding: "12px 16px",
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              borderRadius: "4px 12px 12px 12px",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        {apiError && (
          <div style={{
            borderRadius: 4, border: "1px solid rgba(217,106,90,0.4)",
            background: "rgba(217,106,90,0.08)", padding: "12px 16px",
            fontSize: 13, color: "var(--ps-bad)",
          }}>
            {apiError}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ padding: "8px 20px 0", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setInput(s)}
            style={{
              background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
              color: "var(--ps-ink-1)", padding: "5px 10px",
              borderRadius: 999, fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--ps-line-2)", padding: "12px 16px 16px" }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "var(--ps-bg-2)", border: "1px solid var(--ps-line)",
          borderRadius: 4, padding: 6,
        }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.berater.placeholder}
            disabled={loading}
            style={{
              flex: 1, background: "transparent", border: 0,
              color: "var(--ps-ink-0)", fontSize: 14.5,
              resize: "none", outline: "none", padding: "8px 6px",
              minHeight: 22, maxHeight: 100,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="ember-btn"
            style={{ padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
            aria-label={t.berater.send}
          >
            ➤ {t.berater.send}
          </button>
        </div>
        <p className="ff-mono" style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "var(--ps-ink-4)", letterSpacing: "0.06em" }}>
          {sendHint}
        </p>
      </div>
    </div>
  );
}
