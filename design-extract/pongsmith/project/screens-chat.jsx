// screens-chat.jsx
const { useState: useStateC, useEffect: useEffectC, useRef: useRefC } = React;

function ProgressTrail({ lang, step }) {
  const t = T[lang];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px', borderBottom: '1px solid var(--line-2)', background: 'var(--bg-1)', overflowX: 'auto' }}>
      {t.chat.progress.map((p, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: '1px solid ' + (done || active ? 'var(--ember)' : 'var(--line)'),
                background: done ? 'var(--ember)' : (active ? 'rgba(255,107,53,0.12)' : 'transparent'),
                color: done ? '#1a0d05' : (active ? 'var(--ember)' : 'var(--ink-3)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                boxShadow: active ? '0 0 12px rgba(255,107,53,0.4)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span className="ff-mono" style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: done || active ? 'var(--ink-0)' : 'var(--ink-3)',
              }}>{p}</span>
            </div>
            {i < t.chat.progress.length - 1 && (
              <div style={{ flex: 1, minWidth: 24, height: 1, margin: '0 12px', background: i < step ? 'var(--ember)' : 'var(--line-2)' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const SCRIPT_DE = [
  { who: 'ai', text: 'Servus. Ich bin dein Schmied. Wir machen das ohne Verkaufsmasche — ich frage, du antwortest knapp, am Ende kriegst du drei Setups mit Begründung.' },
  { who: 'ai', text: 'Erste Frage: Wie ist deine ungefähre Q-TTR? Falls du sie nicht weißt — sag einfach, in welcher Liga du spielst.' },
  { who: 'me', text: '1.280 TTR. 2. Kreisliga, dritte Mannschaft.' },
  { who: 'ai', text: 'Sauber. Dann sind wir im Korridor 1.000–1.500 — da geht es um Kontrolle und Wiederholbarkeit, nicht um maximale Speed-Werte. Was nervt dich aktuell am meisten an deinem Schläger?' },
  { who: 'me', text: 'Vorhand-Topspin geht zu oft ins Netz. Block hält nicht stabil.' },
  { who: 'ai', text: 'Verstanden. Klingt nach zu hartem Belag oder zu schnellem Holz. Letzte zwei Fragen: spielst du eher VH-dominant oder beidhändig — und was ist dein Budget-Rahmen?' },
];
const SCRIPT_EN = [
  { who: 'ai', text: "Hi there. I'm your Smith. No sales pitch — I ask, you keep it short, at the end you get three reasoned setups." },
  { who: 'ai', text: 'First question: roughly what is your Q-TTR rating? If you do not know — just tell me your league.' },
  { who: 'me', text: '1,280 TTR. 2nd district league, third team.' },
  { who: 'ai', text: "Solid. We are in the 1,000–1,500 corridor — this is about control and repeatability, not maximum speed numbers. What annoys you most about your current bat?" },
  { who: 'me', text: 'Forehand topspin goes into the net too often. My block is unstable.' },
  { who: 'ai', text: 'Got it. Sounds like the rubber is too hard or the blade too fast. Two more: are you FH-dominant or two-handed — and what is your budget?' },
];

function Bubble({ msg, lang }) {
  const isAi = msg.who === 'ai';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isAi ? 'flex-start' : 'flex-end', animation: 'screenIn 320ms cubic-bezier(.2,.8,.2,1) both' }}>
      {isAi && (
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: 'linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))',
          border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ember-2)' }}>
          <Icons.Hammer size={15}/>
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '12px 14px',
        background: isAi ? 'var(--bg-2)' : 'linear-gradient(180deg, #ff7a45, var(--ember-deep))',
        color: isAi ? 'var(--ink-0)' : '#1a0d05',
        border: isAi ? '1px solid var(--line)' : '1px solid #ff8b56',
        borderRadius: isAi ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        fontSize: 14.5, lineHeight: 1.55,
        boxShadow: isAi ? 'none' : '0 4px 16px rgba(255,107,53,0.25)',
      }}>
        {msg.text}
      </div>
      {!isAi && (
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4,
          background: 'var(--bg-3)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600 }}>
          DU
        </div>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 4,
        background: 'rgba(255,107,53,0.12)',
        border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ember-2)' }}>
        <Icons.Hammer size={15}/>
      </div>
      <div style={{ padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: '4px 12px 12px 12px', display: 'flex', gap: 4 }}>
        {[0,1,2].map(i => (
          <span key={i} className="typing-dot" style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--ember-2)',
            animationDelay: (i * 0.18) + 's',
          }}/>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ lang, go }) {
  const t = T[lang];
  const script = lang === 'de' ? SCRIPT_DE : SCRIPT_EN;
  const [msgs, setMsgs] = useStateC(script.slice(0, 4));
  const [typing, setTyping] = useStateC(false);
  const [input, setInput] = useStateC('');
  const [step] = useStateC(0);
  const scroller = useRefC(null);

  useEffectC(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, typing]);

  // Auto-add the next 2 messages with typing
  useEffectC(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise(r => setTimeout(r, 1200));
      if (cancelled) return;
      setTyping(true);
      await new Promise(r => setTimeout(r, 1400));
      if (cancelled) return;
      setTyping(false);
      setMsgs(m => [...m, script[4]]);
      await new Promise(r => setTimeout(r, 1600));
      if (cancelled) return;
      setTyping(true);
      await new Promise(r => setTimeout(r, 1500));
      if (cancelled) return;
      setTyping(false);
      setMsgs(m => [...m, script[5]]);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const send = () => {
    if (!input.trim()) return;
    const me = { who: 'me', text: input.trim() };
    setMsgs(m => [...m, me]);
    setInput('');
    setTimeout(() => setTyping(true), 400);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { who: 'ai', text: lang === 'de'
        ? 'Notiert. Ich bündel das gleich zu einem Profil — gleich kommt der Spiegel.'
        : "Noted. I'll roll that into a profile — the mirror is coming up." }]);
    }, 1800);
  };

  const suggestions = lang === 'de'
    ? ['VH-dominant, 100–200 €', 'Beidhändig, bis 250 €', 'Egal, Hauptsache Kontrolle']
    : ['FH-dominant, €100–200', 'Two-handed, up to €250', "Whatever, just stable"];

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-1)' }}>
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--line-2)' }}>
        <div className="max-shell" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 4,
            background: 'linear-gradient(180deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06))',
            border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ember-2)' }}>
            <Icons.Hammer size={20}/>
          </div>
          <div>
            <div className="ff-display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--ink-0)' }}>{t.chat.title}</div>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>
              <span style={{ color: 'var(--good)' }}>●</span> {t.chat.subtitle}
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <button onClick={() => go('recommend')} style={{
            background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-1)',
            padding: '8px 12px', borderRadius: 3, fontSize: 12, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {lang === 'de' ? 'Empfehlung anzeigen' : 'Skip to picks'} <Icons.ArrowRight size={13}/>
          </button>
        </div>
      </div>

      <ProgressTrail lang={lang} step={step}/>

      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        <div className="max-shell" style={{ maxWidth: 720, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {msgs.map((m, i) => <Bubble key={i} msg={m} lang={lang}/>)}
          {typing && <Typing/>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line-2)', background: 'var(--bg-1)', padding: '12px 0 18px' }}>
        <div className="max-shell" style={{ maxWidth: 720, padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-1)',
                padding: '6px 10px', borderRadius: 999, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0,
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, padding: 6 }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t.chat.placeholder}
              style={{
                flex: 1, background: 'transparent', border: 0, color: 'var(--ink-0)',
                fontSize: 14.5, resize: 'none', outline: 'none', padding: '8px 6px', minHeight: 22, maxHeight: 100,
              }}/>
            <button onClick={send} className="ember-btn" style={{ padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Icons.Send size={14}/> {t.cta.send}
            </button>
          </div>
          <div className="ff-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.06em' }}>
            ⏎ {lang === 'de' ? 'senden' : 'send'} · ⇧⏎ {lang === 'de' ? 'neue Zeile' : 'new line'}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatScreen, ProgressTrail });
