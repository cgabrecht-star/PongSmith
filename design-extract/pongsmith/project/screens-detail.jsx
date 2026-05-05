// screens-detail.jsx
const { useState: useStateD, useMemo: useMemoD } = React;

function ShopPriceTable({ componentName, lang }) {
  const t = T[lang];
  const prices = PRICING[componentName] || { a: 0, b: 0, c: 0 };
  const cheapest = Object.entries(prices).reduce((m, [k, v]) => v < m.v ? { k, v } : m, { k: '', v: Infinity });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--line-2)' }}>
      {SHOPS.map((shop, i) => {
        const price = prices[shop.id];
        const isCheapest = shop.id === cheapest.k;
        return (
          <div key={shop.id} style={{
            display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr) auto auto', gap: 10, alignItems: 'center',
            padding: '10px 12px',
            borderBottom: i < SHOPS.length - 1 ? '1px solid var(--line-2)' : 0,
            background: isCheapest ? 'rgba(255,107,53,0.05)' : 'transparent',
          }}>
            <div className="ff-mono" style={{
              fontSize: 9, letterSpacing: '0.1em', color: isCheapest ? 'var(--ember-2)' : 'var(--ink-3)',
              border: '1px solid ' + (isCheapest ? 'var(--ember-2)' : 'var(--line)'),
              borderRadius: 2, padding: '3px 0', textAlign: 'center', fontWeight: 600,
            }}>{shop.code}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>{shop.name}</div>
            {isCheapest ? (
              <span className="ff-mono tag-line tag-ember" style={{ fontSize: 9 }}>{t.detail.cheapest}</span>
            ) : <span/>}
            <div className="ff-mono" style={{ fontSize: 13.5, color: 'var(--ink-0)', fontWeight: 600, minWidth: 56, textAlign: 'right' }}>
              {fmtPrice(price, lang)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComponentDetailCard({ label, kind, item, lang }) {
  const t = T[lang];
  return (
    <div className="card-forged" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className="ff-mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>{label}</div>
          <div className="ff-display" style={{ fontSize: 22, color: 'var(--ink-0)', marginTop: 4, lineHeight: 1.1 }}>{item.name}</div>
        </div>
        <span className="tag-line">{kind === 'blade' ? (item.plies || '—') : (item.sponge || '—')}</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <StatBar label="Speed" value={item.speed} accent={kind !== 'blade'}/>
        <StatBar label="Spin" value={item.spin} accent={kind !== 'blade'}/>
        <StatBar label="Ctrl" value={item.control} accent={kind !== 'blade'}/>
      </div>
      <ShopPriceTable componentName={item.name} lang={lang}/>
      <button className="ember-btn" style={{ padding: '10px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {t.cta.shop} <Icons.External size={13}/>
      </button>
    </div>
  );
}

function FeedbackBlock({ lang }) {
  const t = T[lang];
  const [pick, setPick] = useStateD(null);
  return (
    <div className="card-forged" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', marginTop: 32 }}>
      <Icons.Hammer size={22} style={{ color: 'var(--ember-2)' }}/>
      <div className="ff-display" style={{ fontSize: 24, color: 'var(--ink-0)' }}>{t.detail.feedback}</div>
      {pick === null ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { v: 'good', l: t.detail.good, Ic: Icons.ThumbsUp, c: 'var(--good)' },
            { v: 'okay', l: t.detail.okay, Ic: Icons.Meh, c: 'var(--warn)' },
            { v: 'bad', l: t.detail.bad, Ic: Icons.ThumbsDown, c: 'var(--bad)' },
          ].map(b => (
            <button key={b.v} onClick={() => setPick(b.v)} style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-1)',
              padding: '12px 18px', borderRadius: 4, fontSize: 13, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 160ms',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = b.c; e.currentTarget.style.color = b.c; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-1)'; }}>
              <b.Ic size={15}/> {b.l}
            </button>
          ))}
        </div>
      ) : (
        <div className="ff-mono" style={{ fontSize: 12, color: 'var(--ember-2)', letterSpacing: '0.1em' }}>
          ✓ {lang === 'de' ? 'Danke. Das hilft dem Schmied.' : 'Thank you. The Smith takes notes.'}
        </div>
      )}
    </div>
  );
}

function DetailScreen({ lang, go, selectedSetup }) {
  const t = T[lang];
  const setup = selectedSetup || SAMPLE_SETUPS[0];
  const totalPerShop = useMemoD(() => {
    return SHOPS.reduce((acc, sh) => {
      acc[sh.id] = (PRICING[setup.blade.name][sh.id] || 0) + (PRICING[setup.fh.name][sh.id] || 0) + (PRICING[setup.bh.name][sh.id] || 0);
      return acc;
    }, {});
  }, [setup]);
  const cheapestBundle = useMemoD(() => {
    let best = { k: '', v: Infinity };
    Object.entries(totalPerShop).forEach(([k, v]) => { if (v < best.v) best = { k, v }; });
    return best;
  }, [totalPerShop]);
  const cheapestMix = useMemoD(() => {
    return [setup.blade.name, setup.fh.name, setup.bh.name].reduce((sum, n) => {
      const p = PRICING[n];
      return sum + Math.min(...Object.values(p));
    }, 0);
  }, [setup]);
  const savings = cheapestBundle.v - cheapestMix;

  return (
    <div className="screen-anim">
      <ProgressTrail lang={lang} step={3}/>
      <div className="max-shell" style={{ padding: '32px 20px 80px' }}>

        <button onClick={() => go('recommend')} style={{
          background: 'transparent', border: 0, color: 'var(--ink-3)', fontSize: 12,
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18, padding: 0,
        }}>
          <Icons.ArrowLeft size={14}/> {lang === 'de' ? 'Zurück zu allen Empfehlungen' : 'Back to all picks'}
        </button>

        {/* Header */}
        <div className="card-forged" style={{ padding: 32, marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(255,107,53,0.1), transparent 50%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>SETUP-DETAIL</div>
              <h1 className="ff-display" style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', margin: '6px 0 8px', lineHeight: 0.95, fontWeight: 400 }}>
                {lang === 'de' ? setup.nameDE : setup.nameEN}
              </h1>
              <p style={{ color: 'var(--ink-2)', fontSize: 16, margin: 0, fontStyle: 'italic' }}>
                „{lang === 'de' ? setup.taglineDE : setup.taglineEN}"
              </p>
            </div>
            <SynergyRing value={setup.synergy} size={120} stroke={7} label={t.rec.synergy}/>
          </div>
        </div>

        <SectionLabel n="01">{t.detail.components}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 36 }}>
          <ComponentDetailCard label={t.rec.blade} kind="blade" item={setup.blade} lang={lang}/>
          <ComponentDetailCard label={t.rec.fh} kind="rubber" item={setup.fh} lang={lang}/>
          <ComponentDetailCard label={t.rec.bh} kind="rubber" item={setup.bh} lang={lang}/>
        </div>

        {/* Bundle compare */}
        <SectionLabel n="02">{lang === 'de' ? 'Komplett vs. Mix' : 'Bundle vs. mix'}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <div className="card-forged" style={{ padding: 24 }}>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{t.detail.bundle}</div>
            <div className="ff-display" style={{ fontSize: 40, color: 'var(--ink-0)', marginTop: 8, lineHeight: 1 }}>
              {fmtPrice(cheapestBundle.v, lang)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
              {lang === 'de' ? 'bei' : 'at'} <strong style={{ color: 'var(--ink-0)' }}>{SHOPS.find(s => s.id === cheapestBundle.k)?.name}</strong>
            </div>
          </div>
          <div className="card-forged" style={{ padding: 24, borderColor: 'rgba(255,107,53,0.4)', position: 'relative' }}>
            <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ember-2)', textTransform: 'uppercase' }}>{t.detail.mix}</div>
            <div className="ff-display" style={{ fontSize: 40, color: 'var(--ember-2)', marginTop: 8, lineHeight: 1 }}>
              {fmtPrice(cheapestMix, lang)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
              {t.detail.save} <strong style={{ color: 'var(--ember-2)' }}>{fmtPrice(savings, lang)}</strong> {lang === 'de' ? '— drei Bestellungen statt einer.' : '— three orders instead of one.'}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 28, padding: '12px 16px',
          background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 3,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icons.Tag size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }}/>
          <span className="ff-mono" style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>{t.detail.affiliate}</span>
        </div>

        <FeedbackBlock lang={lang}/>
      </div>
    </div>
  );
}

Object.assign(window, { DetailScreen });
