// app.jsx — root + tweaks
const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "de",
  "embers": "marked",
  "accent": "#ff6b35",
  "displayFont": "Bebas Neue"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useStateA('landing');
  const [selectedSetup, setSelectedSetup] = useStateA(SAMPLE_SETUPS[0]);
  const lang = t.lang || 'de';

  // Apply accent live
  useEffectA(() => {
    document.documentElement.style.setProperty('--ember', t.accent);
    // derive deeper / lighter
    document.documentElement.style.setProperty('--ember-glow', t.accent + '5A');
  }, [t.accent]);

  // Embers intensity
  useEffectA(() => {
    const root = document.documentElement;
    if (t.embers === 'subtle') root.style.setProperty('--ember-glow', 'rgba(255,107,53,0.15)');
    else if (t.embers === 'medium') root.style.setProperty('--ember-glow', 'rgba(255,107,53,0.28)');
    else root.style.setProperty('--ember-glow', 'rgba(255,107,53,0.45)');
  }, [t.embers]);

  // Display font swap
  useEffectA(() => {
    const map = {
      'Bebas Neue': "'Bebas Neue'",
      'Oswald': "'Oswald'",
      'Archivo Black': "'Archivo Black'",
      'Space Grotesk': "'Space Grotesk'",
    };
    document.querySelectorAll('.ff-display').forEach(el => {
      el.style.fontFamily = (map[t.displayFont] || "'Bebas Neue'") + ", 'Inter', sans-serif";
    });
  }, [t.displayFont, screen]);

  // Inject extra Google Fonts on demand
  useEffectA(() => {
    if (document.getElementById('extra-display-fonts')) return;
    const l = document.createElement('link');
    l.id = 'extra-display-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo+Black&family=Space+Grotesk:wght@500;600;700&display=swap';
    document.head.appendChild(l);
  }, []);

  const go = (s) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  let content;
  if (screen === 'landing') content = <LandingScreen lang={lang} go={go}/>;
  else if (screen === 'chat') content = <ChatScreen lang={lang} go={go}/>;
  else if (screen === 'recommend') content = <RecommendScreen lang={lang} go={go} setSelectedSetup={setSelectedSetup}/>;
  else if (screen === 'detail') content = <DetailScreen lang={lang} go={go} selectedSetup={selectedSetup}/>;
  else if (screen === 'guide') content = <GuideScreen lang={lang}/>;

  return (
    <div style={{ paddingBottom: 60 /* mobile tab bar */ }}>
      <TopBar lang={lang} setLang={(l) => setTweak('lang', l)} current={screen} go={go}/>
      {content}

      <TweaksPanel title="Tweaks">
        <TweakSection label={lang === 'de' ? 'Sprache' : 'Language'} />
        <TweakRadio label={lang === 'de' ? 'Sprache' : 'Language'} value={t.lang} options={['de', 'en']} onChange={(v) => setTweak('lang', v)} />

        <TweakSection label={lang === 'de' ? 'Schmiede-Akzente' : 'Forge accents'} />
        <TweakRadio label={lang === 'de' ? 'Intensität' : 'Intensity'} value={t.embers} options={['subtle', 'medium', 'marked']} onChange={(v) => setTweak('embers', v)} />
        <TweakColor label={lang === 'de' ? 'Glut-Farbe' : 'Ember color'} value={t.accent} onChange={(v) => setTweak('accent', v)} />

        <TweakSection label={lang === 'de' ? 'Typografie' : 'Type'} />
        <TweakSelect label={lang === 'de' ? 'Display-Font' : 'Display font'} value={t.displayFont}
          options={['Bebas Neue', 'Oswald', 'Archivo Black', 'Space Grotesk']}
          onChange={(v) => setTweak('displayFont', v)} />

        <TweakSection label={lang === 'de' ? 'Sprung' : 'Jump to'} />
        <TweakButton label={lang === 'de' ? 'Landing' : 'Landing'} onClick={() => go('landing')}/>
        <TweakButton label={lang === 'de' ? 'Chat' : 'Chat'} onClick={() => go('chat')}/>
        <TweakButton label={lang === 'de' ? 'Empfehlung' : 'Picks'} onClick={() => go('recommend')}/>
        <TweakButton label={lang === 'de' ? 'Setup-Detail' : 'Setup detail'} onClick={() => go('detail')}/>
        <TweakButton label={lang === 'de' ? 'Ratgeber' : 'Guide'} onClick={() => go('guide')}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
