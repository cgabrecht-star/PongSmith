// screens-ratgeber.jsx
const { useState: useStateG } = React;

function ArticleCard({ a, lang }) {
  const [hover, setHover] = useStateG(false);
  return (
    <a href="#" onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="card-forged"
      style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        borderColor: hover ? 'rgba(255,107,53,0.4)' : 'var(--line)',
        transition: 'border-color 200ms, transform 200ms',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}>
      {/* Image placeholder — striped */}
      <div style={{
        position: 'relative', aspectRatio: '16/10', overflow: 'hidden',
        background: 'var(--bg-3)',
        backgroundImage: 'repeating-linear-gradient(135deg, var(--bg-2) 0 8px, var(--bg-3) 8px 16px)',
        borderBottom: '1px solid var(--line-2)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          {lang === 'de' ? '[Werkstatt-Foto]' : '[Workshop photo]'}
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className="tag-line tag-ember">{lang === 'de' ? a.cat : a.catEN}</span>
        </div>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div className="ff-display" style={{ fontSize: 20, color: 'var(--ink-0)', lineHeight: 1.15 }}>
          {lang === 'de' ? a.titleDE : a.titleEN}
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          {lang === 'de' ? a.leadDE : a.leadEN}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)', marginTop: 'auto', paddingTop: 8 }}>
          <Icons.Clock size={13}/>
          <span className="ff-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em' }}>
            {a.read} {T[lang].guide.readtime}
          </span>
        </div>
      </div>
    </a>
  );
}

function GuideScreen({ lang }) {
  const t = T[lang];
  const [q, setQ] = useStateG('');
  const [cat, setCat] = useStateG('Alle');
  const cats = lang === 'de'
    ? ['Alle', 'Belag kleben', 'Belag pflegen', 'Schläger lagern', 'Tuning', 'Belag wechseln']
    : ['All', 'Glueing', 'Care', 'Storage', 'Tuning', 'Replacing'];

  const filtered = GUIDE_ARTICLES.filter(a => {
    const matchCat = cat === cats[0] || (lang === 'de' ? a.cat === cat : a.catEN === cat);
    const title = lang === 'de' ? a.titleDE : a.titleEN;
    const matchQ = !q || title.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="screen-anim">
      <div className="forge-bg" style={{ borderBottom: '1px solid var(--line-2)' }}>
        <div className="max-shell" style={{ padding: '60px 20px 40px' }}>
          <SectionLabel n="00">{lang === 'de' ? 'Werkstatt' : 'Workshop'}</SectionLabel>
          <h1 className="ff-display" style={{ fontSize: 'clamp(40px, 6vw, 80px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>{t.guide.title}</h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 12, maxWidth: 640 }}>{t.guide.sub}</p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
              background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 3, flex: '1 1 280px', minWidth: 240,
            }}>
              <Icons.Search size={16} style={{ color: 'var(--ink-3)' }}/>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.guide.search}
                style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--ink-0)', fontSize: 14, padding: '12px 0' }}/>
              {q && <button onClick={() => setQ('')} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', padding: 4 }}><Icons.X size={14}/></button>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                background: cat === c ? 'rgba(255,107,53,0.12)' : 'var(--bg-2)',
                border: '1px solid ' + (cat === c ? 'rgba(255,107,53,0.4)' : 'var(--line)'),
                color: cat === c ? 'var(--ember-2)' : 'var(--ink-2)',
                padding: '6px 12px', borderRadius: 999,
                fontSize: 12, fontWeight: 500,
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-shell" style={{ padding: '40px 20px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--ink-3)' }}>
            <div className="ff-display" style={{ fontSize: 28, marginBottom: 8 }}>{lang === 'de' ? 'Nichts gefunden.' : 'Nothing found.'}</div>
            <div style={{ fontSize: 14 }}>{lang === 'de' ? 'Versuch es mit einem anderen Suchbegriff.' : 'Try a different search term.'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {filtered.map(a => <ArticleCard key={a.id} a={a} lang={lang}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { GuideScreen });
