// screens-recommend.jsx
const { useState: useStateR } = React;

function MirrorBlock({ lang }) {
  const t = T[lang];
  const profileDE = {
    ttr: 'Q-TTR ~1.280',
    style: 'VH-dominant, beidhändig im Aufbau',
    pain: 'VH-Topspin landet zu oft im Netz, Block hält nicht stabil',
    goal: 'Kontrolle vor Tempo, mehr Wiederholbarkeit',
    budget: '120–220 €',
  };
  const profileEN = {
    ttr: 'Q-TTR ~1,280',
    style: 'FH-dominant, two-handed in build-up',
    pain: 'FH topspin into the net, unstable block',
    goal: 'Control over speed, more repeatability',
    budget: '€120–220',
  };
  const p = lang === 'de' ? profileDE : profileEN;
  const labels = lang === 'de'
    ? { ttr: 'Spielstärke', style: 'Stil', pain: 'Frustpunkt', goal: 'Ziel', budget: 'Budget' }
    : { ttr: 'Level', style: 'Style', pain: 'Pain point', goal: 'Goal', budget: 'Budget' };
  return (
    <div className="card-forged" style={{ padding: 28, marginBottom: 36, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--ember), transparent)' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Icons.Eye size={16} style={{ color: 'var(--ember-2)' }}/>
        <span className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>
          {t.rec.mirror}
        </span>
      </div>
      <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-0)', margin: '0 0 22px', maxWidth: 760 }}>
        {lang === 'de'
          ? 'Du bist Vereinsspieler im mittleren TTR-Korridor mit Topspin-Aufbau, klarer VH-Präferenz und einem Schläger, der dir aktuell zu wenig Kontrolle gibt. Dein Budget ist realistisch — du willst spürbare Verbesserung, kein Profi-Material.'
          : "You're a club player in the middle TTR corridor with a topspin build-up, clear FH preference and a bat that currently lacks control. Your budget is realistic — you want a real improvement, not pro gear."}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 0, border: '1px solid var(--line-2)', borderRight: 0, borderBottom: 0 }}>
        {Object.keys(p).map(k => (
          <div key={k} style={{ padding: 14, borderRight: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}>
            <div className="ff-mono" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>{labels[k]}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-0)', lineHeight: 1.4 }}>{p[k]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupCard({ setup, lang, idx, go, onPick }) {
  const t = T[lang];
  const [hover, setHover] = useStateR(false);
  return (
    <div className="card-forged" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
      transition: 'border-color 200ms, transform 200ms',
      borderColor: hover ? 'rgba(255,107,53,0.4)' : 'var(--line)',
      transform: hover ? 'translateY(-2px)' : 'translateY(0)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>SETUP · 0{idx+1}</div>
          <div className="ff-display" style={{ fontSize: 30, lineHeight: 1.05, marginTop: 6, color: 'var(--ink-0)' }}>
            {lang === 'de' ? setup.nameDE : setup.nameEN}
          </div>
          <div className="ff-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.06em' }}>
            {lang === 'de' ? setup.bestFitDE : setup.bestFitEN}
          </div>
        </div>
        <SynergyRing value={setup.synergy} size={84} stroke={5} label={null}/>
      </div>

      <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, margin: 0, fontStyle: 'italic', borderLeft: '2px solid var(--ember)', paddingLeft: 12 }}>
        „{lang === 'de' ? setup.taglineDE : setup.taglineEN}"
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 0', borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}>
        <ComponentRow label={t.rec.blade} name={setup.blade.name} stats={setup.blade}/>
        <ComponentRow label={t.rec.fh} name={setup.fh.name} stats={setup.fh} accent/>
        <ComponentRow label={t.rec.bh} name={setup.bh.name} stats={setup.bh} accent/>
      </div>

      <div>
        <div className="ff-mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
          {t.rec.why}
        </div>
        <p style={{ color: 'var(--ink-1)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          {lang === 'de' ? setup.reasonDE : setup.reasonEN}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <div className="ff-mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{t.rec.from.toUpperCase()}</div>
          <div className="ff-display" style={{ fontSize: 32, color: 'var(--ink-0)', lineHeight: 1 }}>
            {setup.priceFrom} €
          </div>
        </div>
        <button className="ember-btn" onClick={() => { onPick && onPick(setup); go('detail'); }}
          style={{ padding: '12px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {t.rec.details} <Icons.ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

function RecommendScreen({ lang, go, setSelectedSetup }) {
  return (
    <div className="screen-anim">
      <ProgressTrail lang={lang} step={2}/>
      <div className="max-shell" style={{ padding: '40px 20px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <SectionLabel n="03">{lang === 'de' ? 'Deine Empfehlung' : 'Your recommendation'}</SectionLabel>
          <h1 className="ff-display" style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>
            {lang === 'de' ? <>Drei Wege, <span style={{ color: 'var(--ember-2)' }}>einer für dich.</span></> : <>Three paths, <span style={{ color: 'var(--ember-2)' }}>one for you.</span></>}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 12, maxWidth: 640 }}>
            {lang === 'de'
              ? 'Basierend auf deinem Profil. Synergie-Score = wie gut Holz und Beläge zusammenarbeiten — höher ist besser, aber 79 mit perfektem Stil schlägt 92 mit falschem Stil.'
              : 'Based on your profile. The synergy score reflects how well blade and rubbers work together — higher is better, but 79 with the right style beats 92 with the wrong one.'}
          </p>
        </div>
        <MirrorBlock lang={lang}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {SAMPLE_SETUPS.map((s, i) => (
            <SetupCard key={s.id} setup={s} lang={lang} idx={i} go={go} onPick={setSelectedSetup}/>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RecommendScreen, SetupCard, MirrorBlock });
