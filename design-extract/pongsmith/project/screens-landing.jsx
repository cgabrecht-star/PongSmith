// screens-landing.jsx
const { useState: useStateL, useEffect: useEffectL, useRef: useRefL } = React;

function ForgeMark({ size = 28 }) {
  // Custom mark: anvil silhouette + spark
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 14h16a4 4 0 0 1 4 4H8" stroke="var(--ink-0)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 18v3M7 22h17l-2 4H9z" stroke="var(--ink-0)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="8" r="1.4" fill="var(--ember)"/>
      <path d="M24 4v2M24 10v2M20 8h2M26 8h2" stroke="var(--ember)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function TopBar({ lang, setLang, current, go }) {
  const t = T[lang];
  const items = [
    { id: 'landing', label: t.nav.landing, icon: 'Home' },
    { id: 'chat', label: t.nav.chat, icon: 'Chat' },
    { id: 'recommend', label: t.nav.recommend, icon: 'Layers' },
    { id: 'detail', label: t.nav.detail, icon: 'Bag' },
    { id: 'guide', label: t.nav.guide, icon: 'Book' },
  ];
  return (
    <div className="glass-bar" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="max-shell" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px' }}>
        <button onClick={() => go('landing')} style={{ background: 'transparent', border: 0, padding: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-0)' }}>
          <ForgeMark size={26} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
            <span className="ff-display" style={{ fontSize: 22, letterSpacing: '0.04em' }}>PONGSMITH</span>
            <span className="ff-mono" style={{ fontSize: 8.5, letterSpacing: '0.22em', color: 'var(--ember-2)', marginTop: 2 }}>DIE TT-SCHMIEDE</span>
          </div>
        </button>

        <div style={{ flex: 1 }} />

        <nav className="hide-mobile" style={{ display: 'flex', gap: 4 }}>
          {items.map(it => {
            const Ic = Icons[it.icon];
            const active = current === it.id;
            return (
              <button key={it.id} onClick={() => go(it.id)} style={{
                background: active ? 'var(--bg-3)' : 'transparent',
                border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
                color: active ? 'var(--ink-0)' : 'var(--ink-2)',
                padding: '8px 12px', borderRadius: 3,
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 500,
                transition: 'all 160ms',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--ink-0)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--ink-2)'; }}>
                <Ic size={15} /> {it.label}
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 3, padding: 2 }}>
          {['de','en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              background: lang === l ? 'var(--ember)' : 'transparent',
              color: lang === l ? '#1a0d05' : 'var(--ink-2)',
              border: 0, borderRadius: 2, padding: '4px 8px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* mobile bottom tab bar */}
      <div className="show-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: 'rgba(14,14,14,0.92)', backdropFilter: 'blur(14px)',
        borderTop: '1px solid var(--line-2)', display: 'flex',
      }}>
        {items.map(it => {
          const Ic = Icons[it.icon];
          const active = current === it.id;
          return (
            <button key={it.id} onClick={() => go(it.id)} style={{
              flex: 1, background: 'transparent', border: 0,
              color: active ? 'var(--ember)' : 'var(--ink-3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '8px 4px', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <Ic size={18} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Hero scene — anvil silhouette in CSS + sparks
function HeroScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* glowing forge floor */}
      <div style={{
        position: 'absolute', left: '50%', bottom: '-40%', transform: 'translateX(-50%)',
        width: '120%', height: '70%',
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.22), rgba(255,107,53,0.06) 35%, transparent 65%)',
        filter: 'blur(20px)',
      }} />
      {/* anvil silhouette right */}
      <div style={{ position: 'absolute', right: '-3%', bottom: '8%', width: 460, height: 320, opacity: 0.55 }}>
        <svg viewBox="0 0 460 320" width="100%" height="100%">
          <defs>
            <linearGradient id="anvilGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1a"/>
              <stop offset="100%" stopColor="#0a0a0a"/>
            </linearGradient>
            <radialGradient id="emberCore" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffd093"/>
              <stop offset="40%" stopColor="#ff7a45"/>
              <stop offset="100%" stopColor="rgba(255,107,53,0)"/>
            </radialGradient>
          </defs>
          {/* Ember plate on anvil */}
          <ellipse cx="160" cy="142" rx="120" ry="22" fill="url(#emberCore)" opacity="0.9"/>
          {/* Anvil top */}
          <path d="M40 150 L300 150 L320 168 L60 168 Z" fill="url(#anvilGrad)" stroke="#2a2826" strokeWidth="1"/>
          {/* Horn */}
          <path d="M40 150 C20 152 10 158 8 168 L60 168 Z" fill="url(#anvilGrad)" stroke="#2a2826" strokeWidth="1"/>
          {/* Waist */}
          <path d="M100 168 L100 220 L80 240 L80 250 L260 250 L260 240 L240 220 L240 168 Z" fill="url(#anvilGrad)" stroke="#2a2826" strokeWidth="1"/>
          {/* Base */}
          <rect x="60" y="250" width="220" height="40" fill="url(#anvilGrad)" stroke="#2a2826" strokeWidth="1"/>
          {/* Hammer */}
          <g style={{ transformOrigin: '350px 70px', animation: 'hammerStrike 2.4s ease-in-out infinite' }}>
            <rect x="345" y="40" width="10" height="120" fill="#3a3530" rx="2"/>
            <rect x="320" y="20" width="60" height="34" fill="#1f1d1b" stroke="#3a3530" strokeWidth="1" rx="3"/>
            <circle cx="378" cy="37" r="2" fill="var(--ember)"/>
          </g>
        </svg>
      </div>

      <SparksLayer count={18} />
    </div>
  );
}

function Hero({ lang, go }) {
  const t = T[lang];
  return (
    <section className="forge-bg" style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line-2)' }}>
      <HeroScene />
      <div className="max-shell" style={{ position: 'relative', padding: '80px 20px 100px', display: 'grid', gap: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tag-line tag-ember"><Icons.Flame size={11}/> {t.hero.kicker}</span>
            <span className="tag-line"><Icons.ShieldCheck size={11}/> Q-TTR 1.000–1.700</span>
          </div>
          <h1 className="ff-display" style={{ fontSize: 'clamp(56px, 9vw, 132px)', lineHeight: 0.92, letterSpacing: '0.005em', margin: 0, fontWeight: 400 }}>
            {t.hero.title.map((line, i) => (
              <span key={i} style={{ display: 'block' }}>
                {i === 1 ? <span style={{ color: 'var(--ember-2)' }}>{line}</span> : line}
              </span>
            ))}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 560, margin: 0 }}>
            {t.hero.sub}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 8 }}>
            <button className="ember-btn ember-btn-glow" onClick={() => go('chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
              <Icons.Hammer size={17}/>
              {t.cta.primary}
              <Icons.ArrowRight size={17}/>
            </button>
            <button onClick={() => {
              const el = document.getElementById('how-it-works');
              if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
            }} style={{
              background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-1)',
              padding: '14px 18px', borderRadius: 4, fontSize: 14, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {t.cta.how} <Icons.ArrowRight size={15}/>
            </button>
          </div>
        </div>

        <div className="anvil-divider-strong" style={{ marginTop: 16 }}/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {[t.hero.stat1, t.hero.stat2, t.hero.stat3].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="ff-display" style={{ fontSize: 36, color: 'var(--ink-0)', lineHeight: 1 }}>{s.v}</div>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ lang }) {
  const t = T[lang];
  return (
    <section id="how-it-works" style={{ padding: '90px 20px', background: 'var(--bg-0)', borderBottom: '1px solid var(--line-2)' }}>
      <div className="max-shell">
        <SectionLabel n="01">How it works</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 50 }}>
          <h2 className="ff-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>{t.how.title}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 17, margin: 0 }}>{t.how.sub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, background: 'var(--line-2)', border: '1px solid var(--line-2)' }}>
          {t.how.steps.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-1)', padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: 16, position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="ff-display" style={{ fontSize: 56, color: 'var(--ember)', lineHeight: 1 }}>{s.n}</span>
                {i === 0 && <Icons.Chat size={22} style={{ color: 'var(--ink-3)' }}/>}
                {i === 1 && <Icons.Eye size={22} style={{ color: 'var(--ink-3)' }}/>}
                {i === 2 && <Icons.Hammer size={22} style={{ color: 'var(--ink-3)' }}/>}
              </div>
              <div className="ff-display" style={{ fontSize: 28, lineHeight: 1, color: 'var(--ink-0)' }}>{s.t}</div>
              <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 15, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust({ lang }) {
  const t = T[lang];
  return (
    <section className="forge-bg" style={{ padding: '90px 20px', borderBottom: '1px solid var(--line-2)' }}>
      <div className="max-shell">
        <SectionLabel n="02">Why independent</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
          <h2 className="ff-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>{t.trust.title}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 17, margin: 0 }}>{t.trust.sub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {t.trust.pillars.map((p, i) => {
            const Ic = Icons[p.icon];
            return (
              <div key={i} className="card-forged" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: 2,
                    color: 'var(--ember-2)',
                  }}>
                    <Ic size={18}/>
                  </div>
                  <span className="ff-mono" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>SÄULE 0{i+1}</span>
                </div>
                <div className="ff-display" style={{ fontSize: 26, color: 'var(--ink-0)', lineHeight: 1.05 }}>{p.t}</div>
                <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{p.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SamplePreview({ lang, go }) {
  const t = T[lang];
  const setup = SAMPLE_SETUPS[0];
  return (
    <section style={{ padding: '90px 20px', background: 'var(--bg-0)', borderBottom: '1px solid var(--line-2)' }}>
      <div className="max-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 40, alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <SectionLabel n="03">{t.sample.kicker}</SectionLabel>
          <h2 className="ff-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>{t.sample.title}</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 12 }}>{t.sample.sub}</p>
          <button onClick={() => go('recommend')} style={{
            background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-0)',
            padding: '12px 16px', borderRadius: 3, fontSize: 13, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          }}>
            <Icons.Layers size={15}/> {lang === 'de' ? 'Alle 3 Setups ansehen' : 'See all 3 setups'} <Icons.ArrowRight size={14}/>
          </button>
        </div>

        <div className="card-forged" style={{ padding: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <span className="tag-line tag-ember">{lang === 'de' ? 'Beispiel' : 'Example'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <SynergyRing value={setup.synergy} size={108} stroke={6} label={t.rec.synergy}/>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>SETUP · 01</div>
              <div className="ff-display" style={{ fontSize: 32, lineHeight: 1, marginTop: 6, color: 'var(--ink-0)' }}>{lang === 'de' ? setup.nameDE : setup.nameEN}</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, margin: '12px 0 0' }}>{lang === 'de' ? setup.taglineDE : setup.taglineEN}</p>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--line-2)', margin: '22px 0' }}/>
          <div style={{ display: 'grid', gap: 14 }}>
            <ComponentRow label={t.rec.blade} name={setup.blade.name} stats={setup.blade}/>
            <ComponentRow label={t.rec.fh} name={setup.fh.name} stats={setup.fh} accent/>
            <ComponentRow label={t.rec.bh} name={setup.bh.name} stats={setup.bh} accent/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
            <div className="ff-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.rec.from} <span className="ff-display" style={{ fontSize: 26, color: 'var(--ink-0)', marginLeft: 4 }}>{setup.priceFrom} €</span></div>
            <button onClick={() => go('detail')} className="ember-btn" style={{ padding: '10px 14px', fontSize: 12 }}>{t.cta.details} →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentRow({ label, name, stats, accent }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 90px) minmax(0, 1fr)', gap: 14, alignItems: 'center' }}>
      <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <span className="ff-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{stats.weight || stats.sponge}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatBar label="Speed" value={stats.speed} accent={accent}/>
          <StatBar label="Spin" value={stats.spin} accent={accent}/>
          <StatBar label="Ctrl" value={stats.control} accent={accent}/>
        </div>
      </div>
    </div>
  );
}

function FAQ({ lang }) {
  const t = T[lang];
  const [open, setOpen] = useStateL(0);
  return (
    <section style={{ padding: '90px 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-2)' }}>
      <div className="max-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr)', gap: 60 }}>
        <div>
          <SectionLabel n="04">FAQ</SectionLabel>
          <h2 className="ff-display" style={{ fontSize: 'clamp(36px, 4vw, 56px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>{t.faq.title}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line-2)' }}>
          {t.faq.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <button key={i} onClick={() => setOpen(isOpen ? -1 : i)} style={{
                background: 'transparent', border: 0, borderBottom: '1px solid var(--line-2)',
                padding: '22px 4px', textAlign: 'left', color: 'var(--ink-0)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <span style={{ fontSize: 17, fontWeight: 500 }}>{it.q}</span>
                  <span style={{ color: 'var(--ember-2)', flexShrink: 0, transition: 'transform 200ms', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>
                    <Icons.Plus size={20}/>
                  </span>
                </div>
                {isOpen && (
                  <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 640 }}>{it.a}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ lang }) {
  const t = T[lang];
  return (
    <footer style={{ padding: '60px 20px 90px', background: 'var(--bg-0)' }}>
      <div className="max-shell">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) repeat(3, minmax(0, 1fr))', gap: 40, marginBottom: 50 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ForgeMark size={28}/>
              <span className="ff-display" style={{ fontSize: 24, letterSpacing: '0.04em' }}>PONGSMITH</span>
            </div>
            <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.55, maxWidth: 280, margin: 0 }}>
              {t.footer.tag}
            </p>
          </div>
          {t.footer.cols.map((col, i) => (
            <div key={i}>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>{col.t}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.items.map((it, j) => (
                  <li key={j}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--ink-2)', fontSize: 13.5 }}>{it}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="anvil-divider-strong" style={{ marginBottom: 22 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="ff-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.footer.copy}</span>
          <span className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>v0.4 · forge build</span>
        </div>
      </div>
    </footer>
  );
}

function LandingScreen({ lang, go }) {
  return (
    <div className="screen-anim">
      <Hero lang={lang} go={go}/>
      <HowItWorks lang={lang}/>
      <Trust lang={lang}/>
      <SamplePreview lang={lang} go={go}/>
      <FAQ lang={lang}/>
      <Footer lang={lang}/>
    </div>
  );
}

Object.assign(window, { LandingScreen, TopBar, Footer, ForgeMark, ComponentRow });
