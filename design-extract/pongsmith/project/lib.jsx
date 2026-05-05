// lib.jsx — icons, i18n, data, shared components
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────
// Icon set — minimal, hand-drawn line icons
// ─────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none', children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Hammer: (p) => <Icon {...p}><path d="M14 5l5 5-2 2-5-5z"/><path d="M12 7L4 15a2 2 0 0 0 0 3l2 2a2 2 0 0 0 3 0l8-8"/></Icon>,
  Anvil: (p) => <Icon {...p}><path d="M3 8h13a4 4 0 0 1 4 4v0H7"/><path d="M9 12v3"/><path d="M5 18h14l-2 3H7z"/></Icon>,
  Spark: (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></Icon>,
  Flame: (p) => <Icon {...p}><path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s0 2 2 2c0-3-1-5 1-7z"/></Icon>,
  Chat: (p) => <Icon {...p}><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M4 12l5 5L20 6"/></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M3 11l18-8-7 18-3-7-8-3z"/></Icon>,
  ShieldCheck: (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></Icon>,
  Database: (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14c4 0 6 2 6 5"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Minus: (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  Tag: (p) => <Icon {...p}><path d="M3 12V3h9l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></Icon>,
  External: (p) => <Icon {...p}><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v6H5V5h6"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3l2.6 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.4-1z"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Book: (p) => <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M6 17h13"/></Icon>,
  ThumbsUp: (p) => <Icon {...p}><path d="M7 11v9H4v-9zM7 11l4-7c1 0 2 1 2 2v3h6a2 2 0 0 1 2 2l-2 7c0 1-1 2-2 2H7"/></Icon>,
  ThumbsDown: (p) => <Icon {...p}><path d="M17 13V4h3v9zM17 13l-4 7c-1 0-2-1-2-2v-3H5a2 2 0 0 1-2-2l2-7c0-1 1-2 2-2h10"/></Icon>,
  Meh: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14h8"/><circle cx="9" cy="10" r="0.5" fill="currentColor"/><circle cx="15" cy="10" r="0.5" fill="currentColor"/></Icon>,
  Menu: (p) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>,
  Home: (p) => <Icon {...p}><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/></Icon>,
  Compass: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 2 2-6z"/></Icon>,
  Layers: (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/></Icon>,
  Bag: (p) => <Icon {...p}><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 3L4 14h6l-1 7 9-11h-6z"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
};

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
const T = {
  de: {
    nav: { landing: 'Start', chat: 'Chat', recommend: 'Empfehlung', detail: 'Setup', guide: 'Ratgeber' },
    cta: { primary: 'Jetzt beraten lassen', how: "So funktioniert's", details: 'Details ansehen', shop: 'Zum Shop', send: 'Senden' },
    hero: {
      kicker: 'Die Tischtennis-Schmiede',
      title: ['Dein Schläger,', 'in 3 Minuten', 'ehrlich beraten.'],
      sub: 'Damit du nie wieder 200 € in ein Setup steckst, das nicht zu dir passt. Unabhängig. Kostenlos. Ohne Marken-Bias.',
      stat1: { v: '1.000–1.700', l: 'Q-TTR Spielstärke' },
      stat2: { v: '0 €', l: 'Beratung' },
      stat3: { v: '14', l: 'Hersteller im Index' },
    },
    how: {
      title: 'Drei Schritte. Kein Verkaufsdruck.',
      sub: 'Wir hören dir zu — und sagen dir, was wir wirklich denken.',
      steps: [
        { n: '01', t: 'Erzählen', d: 'Du beschreibst deine Spielstärke, Frustpunkte und worauf du im Match warten musst.' },
        { n: '02', t: 'Spiegeln', d: 'Wir fassen dein Profil zusammen, damit Missverständnisse vorm Geldausgeben sterben.' },
        { n: '03', t: 'Empfehlen', d: 'Drei begründete Setups mit Synergie-Score, Preisvergleich und ehrlichem „warum nicht“.' },
      ],
    },
    trust: {
      title: 'Woher kommt unser Wissen?',
      sub: 'Drei Säulen. Keine Schiebung.',
      pillars: [
        { t: 'Hersteller-Daten', d: 'Speed-, Spin- und Control-Werte direkt aus Datenblättern. Wir kürzen nichts schön.', icon: 'Database' },
        { t: 'Community-Reviews', d: 'Aggregiert aus Foren und Bewertungsportalen. Wir filtern Schreihälse heraus.', icon: 'Users' },
        { t: 'Vereinsspieler', d: 'Echte Erfahrungsberichte aus dem TTR-Korridor 1.000–1.700, nicht Bundesliga-Phantasie.', icon: 'ShieldCheck' },
      ],
    },
    sample: {
      kicker: 'Vorgeschmack',
      title: 'So sieht eine Empfehlung aus.',
      sub: 'Drei begründete Setups, kein Markenmüll.',
    },
    faq: {
      title: 'Häufige Fragen',
      items: [
        { q: 'Verdient ihr an meinem Kauf?', a: 'Ja, über Affiliate-Links — aber nur, wenn du aus eigener Überzeugung kaufst. Unsere Empfehlung ändert sich nicht durch Provisionen. Wir markieren das transparent.' },
        { q: 'Warum keine Bundesliga-Beläge?', a: 'Weil ein Tenergy 05 unter 1.700 TTR meist mehr Frust als Spin liefert. Wir empfehlen das Setup, mit dem du nächsten Dienstag besser spielst.' },
        { q: 'Reicht eine KI für sowas Persönliches?', a: 'Die KI hört strukturiert zu, vergleicht dein Profil mit hunderten Beläg-Holz-Kombinationen und legt die Begründung offen. Du entscheidest.' },
        { q: 'Was ist mit Defensiv-Setups?', a: 'Voll abgedeckt. Sag uns einfach, du spielst hinter dem Tisch — die Empfehlungen drehen sich entsprechend.' },
      ],
    },
    rec: {
      mirror: 'Das habe ich von dir verstanden',
      synergy: 'Synergie',
      from: 'ab',
      why: 'Warum dieses Setup',
      blade: 'Holz',
      fh: 'VH-Belag',
      bh: 'RH-Belag',
      details: 'Details ansehen',
    },
    detail: {
      components: 'Drei Komponenten',
      shopCompare: 'Preise pro Shop',
      bundle: 'Komplett bei einem Shop',
      mix: 'Günstigster Mix',
      save: 'Du sparst',
      cheapest: 'günstigster',
      affiliate: 'Werbekennzeichnung: Wir verdienen eine kleine Provision, wenn du über diese Links kaufst. Auf den Preis hat das keinen Einfluss.',
      feedback: 'War diese Empfehlung hilfreich?',
      good: 'Passt',
      okay: 'Geht so',
      bad: 'Daneben',
    },
    chat: {
      progress: ['Profil', 'Spiegel', 'Empfehlung', 'Vergleich'],
      placeholder: 'Antwort tippen…',
      title: 'Dein Schmied',
      subtitle: 'Online · antwortet in Sekunden',
      typing: 'Schmied tippt',
    },
    guide: {
      title: 'Werkstatt-Ratgeber',
      sub: 'Praxiswissen aus der Schmiede. Kurz, ehrlich, ohne Affiliate-Druck.',
      search: 'Im Ratgeber suchen…',
      categories: ['Alle', 'Belag kleben', 'Belag pflegen', 'Schläger lagern', 'Tuning', 'Belag wechseln'],
      readtime: 'Min. Lesezeit',
    },
    footer: {
      tag: 'Unabhängig · Markenneutral · Kostenlos',
      cols: [
        { t: 'Beratung', items: ['Chat starten', 'Beispiel-Empfehlung', 'Wie wir denken'] },
        { t: 'Werkstatt', items: ['Ratgeber', 'Glossar', 'TTR-Rechner'] },
        { t: 'Rechtliches', items: ['Impressum', 'Datenschutz', 'Affiliate-Hinweis'] },
      ],
      copy: '© 2026 PongSmith. Geschmiedet in Deutschland.',
    },
  },
  en: {
    nav: { landing: 'Home', chat: 'Chat', recommend: 'Pick', detail: 'Setup', guide: 'Guide' },
    cta: { primary: 'Get my setup', how: 'How it works', details: 'See details', shop: 'Buy', send: 'Send' },
    hero: {
      kicker: 'The Table-Tennis Forge',
      title: ['Your bat,', 'honestly built', 'in 3 minutes.'],
      sub: "So you never burn another €200 on a setup that doesn't fit you. Independent. Free. Zero brand bias.",
      stat1: { v: '1,000–1,700', l: 'Q-TTR rating range' },
      stat2: { v: '€0', l: 'Cost to you' },
      stat3: { v: '14', l: 'Brands indexed' },
    },
    how: {
      title: 'Three steps. No sales pressure.',
      sub: "We listen — then tell you what we actually think.",
      steps: [
        { n: '01', t: 'Tell us', d: "Describe your level, your frustrations, the shot you keep waiting for in matches." },
        { n: '02', t: 'Mirror', d: 'We summarise your profile back so misunderstandings die before you spend money.' },
        { n: '03', t: 'Recommend', d: "Three reasoned setups with a synergy score, price comparison, and honest 'why not'." },
      ],
    },
    trust: {
      title: 'Where our knowledge comes from',
      sub: 'Three pillars. No funny business.',
      pillars: [
        { t: 'Manufacturer data', d: 'Speed, spin, control numbers straight from spec sheets. We do not round up.', icon: 'Database' },
        { t: 'Community reviews', d: 'Aggregated from forums and rating sites. We filter out the loudest yellers.', icon: 'Users' },
        { t: 'Club players', d: 'Real reports from the 1,000–1,700 TTR corridor. Not pro-tour fantasy.', icon: 'ShieldCheck' },
      ],
    },
    sample: { kicker: 'Preview', title: 'This is what a recommendation looks like.', sub: 'Three reasoned setups. Zero brand pushing.' },
    faq: {
      title: 'Common questions',
      items: [
        { q: 'Do you make money on my purchase?', a: 'Yes, via affiliate links — but only when you buy out of conviction. Our pick does not change because of commissions. We label it openly.' },
        { q: 'Why no pro-tour rubbers?', a: 'Because a Tenergy 05 under 1,700 TTR usually delivers more frustration than spin. We recommend the setup that lets you play better next Tuesday.' },
        { q: 'Can an AI really do this?', a: 'The AI listens with structure, compares your profile to hundreds of blade/rubber combinations, and shows the reasoning. You decide.' },
        { q: 'What about defensive setups?', a: "Fully covered. Just tell us you play behind the table and the picks rotate accordingly." },
      ],
    },
    rec: { mirror: 'What I understood about you', synergy: 'Synergy', from: 'from', why: 'Why this setup', blade: 'Blade', fh: 'FH rubber', bh: 'BH rubber', details: 'See details' },
    detail: {
      components: 'Three components',
      shopCompare: 'Prices per shop',
      bundle: 'Buy as one bundle',
      mix: 'Cheapest mix',
      save: 'You save',
      cheapest: 'cheapest',
      affiliate: 'Affiliate notice: we earn a small commission when you buy through these links. The price stays the same for you.',
      feedback: 'Was this recommendation useful?',
      good: 'Spot on',
      okay: 'Mixed',
      bad: 'Off',
    },
    chat: {
      progress: ['Profile', 'Mirror', 'Pick', 'Compare'],
      placeholder: 'Type your answer…',
      title: 'Your Smith',
      subtitle: 'Online · answers in seconds',
      typing: 'Smith is typing',
    },
    guide: {
      title: 'Workshop Guide',
      sub: 'Hands-on knowledge from the forge. Short, honest, no affiliate push.',
      search: 'Search the guide…',
      categories: ['All', 'Glueing', 'Care', 'Storage', 'Tuning', 'Replacing'],
      readtime: 'min read',
    },
    footer: {
      tag: 'Independent · Brand-neutral · Free',
      cols: [
        { t: 'Advisory', items: ['Start chat', 'Sample pick', 'How we think'] },
        { t: 'Workshop', items: ['Guide', 'Glossary', 'TTR calculator'] },
        { t: 'Legal', items: ['Imprint', 'Privacy', 'Affiliate disclosure'] },
      ],
      copy: '© 2026 PongSmith. Forged in Germany.',
    },
  },
};

// ─────────────────────────────────────────────
// Sample data — generic shops, generic gear
// ─────────────────────────────────────────────
const SAMPLE_SETUPS = [
  {
    id: 'allrounder',
    nameDE: 'Der Aufbau-Allrounder',
    nameEN: 'The Foundation All-rounder',
    taglineDE: 'Kontrolle vor Tempo. Du gewinnst, indem der andere Fehler macht.',
    taglineEN: 'Control over speed. You win because the opponent errs first.',
    synergy: 87,
    priceFrom: 142,
    priceMid: 168,
    blade: { name: 'Stiga Allround Classic', speed: 5, spin: 6, control: 9, weight: '78g', plies: '5W' },
    fh: { name: 'Donic Bluefire M2', speed: 7, spin: 9, control: 7, sponge: '2.0 mm', hardness: '47.5°' },
    bh: { name: 'Yasaka Mark V', speed: 6, spin: 7, control: 9, sponge: '1.8 mm', hardness: '40°' },
    reasonDE: 'Du hast 1.250 TTR und beschwerst dich über fehlende Kontrolle beim Aufschlagrückschlag. Dieses Holz verzeiht — die Beläge geben dir trotzdem genug Spin, um Topspin von der Mitte aufzubauen. Mark V auf der Rückhand hält den Block zuverlässig.',
    reasonEN: "At 1,250 TTR with control issues on the receive, this blade forgives. The rubbers still give you enough spin to open up topspins from mid-table. Mark V on the backhand keeps blocks reliable.",
    bestFitDE: 'Allround mit Topspin-Anspruch',
    bestFitEN: 'All-round with topspin ambitions',
  },
  {
    id: 'offensive',
    nameDE: 'Der Vorhand-Treiber',
    nameEN: 'The Forehand Driver',
    taglineDE: 'Erste Karte: Vorhand-Topspin. Zweite Karte: noch ein Vorhand-Topspin.',
    taglineEN: "First card: forehand topspin. Second card: another forehand topspin.",
    synergy: 82,
    priceFrom: 178,
    priceMid: 204,
    blade: { name: 'Butterfly Korbel', speed: 7, spin: 7, control: 7, weight: '88g', plies: '5W' },
    fh: { name: 'Tibhar Evolution MX-P', speed: 9, spin: 9, control: 6, sponge: '2.1 mm', hardness: '50°' },
    bh: { name: 'Donic Bluefire M3', speed: 7, spin: 8, control: 7, sponge: '2.0 mm', hardness: '45°' },
    reasonDE: 'Du beschreibst dich als VH-dominant und willst direkter durchschlagen. Korbel ist hart genug, MX-P liefert das Tempo, ohne dass dir der erste Topspin nach hinten ins Netz geht. RH bewusst kontrollierter, damit Block & Schupfen sitzen.',
    reasonEN: "You describe yourself as FH-dominant and want more punch. Korbel is firm enough, MX-P delivers speed without the first topspin sailing into the net. BH intentionally calmer so block and push stay grounded.",
    bestFitDE: 'Offensiv, einseitig',
    bestFitEN: 'Offensive, one-sided',
  },
  {
    id: 'modern',
    nameDE: 'Der moderne Beidhänder',
    nameEN: 'The Modern Two-hander',
    taglineDE: 'Topspin von beiden Seiten. Schmackhaft, aber kein Bundesliga-Theater.',
    taglineEN: 'Topspin from both sides. Tasty, not pro-tour theatre.',
    synergy: 79,
    priceFrom: 195,
    priceMid: 224,
    blade: { name: 'Xiom Vega Euro Allround', speed: 6, spin: 7, control: 8, weight: '82g', plies: '5W' },
    fh: { name: 'Xiom Vega Pro', speed: 8, spin: 9, control: 7, sponge: '2.0 mm', hardness: '47.5°' },
    bh: { name: 'Andro Rasanter R42', speed: 7, spin: 9, control: 8, sponge: '2.0 mm', hardness: '42°' },
    reasonDE: 'Wenn du angekommen bist im modernen Spiel, aber 1.500 TTR realistisch eingestuft hast: weiches Allround-Holz mit zwei Topspin-tauglichen Belägen. R42 auf RH bringt die Banane, ohne dich zu überfordern.',
    reasonEN: "If you've embraced the modern game but realistically rate yourself at 1,500 TTR: a softer all-round blade plus two topspin-capable rubbers. R42 on the BH gives you the banana flick without burying you.",
    bestFitDE: 'Beidhändig, Topspin-Aufbau',
    bestFitEN: 'Two-handed, topspin oriented',
  },
];

const SHOPS = [
  { id: 'a', name: 'Schmiede-Shop', code: 'SMD' },
  { id: 'b', name: 'Holzwerk', code: 'HLZ' },
  { id: 'c', name: 'Kellerstudio', code: 'KLR' },
];

// Pricing matrix — for detail page
const PRICING = {
  'Stiga Allround Classic': { a: 38.90, b: 41.50, c: 39.95 },
  'Donic Bluefire M2': { a: 44.90, b: 42.95, c: 45.50 },
  'Yasaka Mark V': { a: 27.90, b: 28.50, c: 26.95 },
  'Butterfly Korbel': { a: 64.90, b: 62.50, c: 67.00 },
  'Tibhar Evolution MX-P': { a: 49.90, b: 51.50, c: 48.95 },
  'Donic Bluefire M3': { a: 44.90, b: 43.95, c: 45.50 },
  'Xiom Vega Euro Allround': { a: 58.90, b: 61.50, c: 59.95 },
  'Xiom Vega Pro': { a: 41.90, b: 42.50, c: 39.95 },
  'Andro Rasanter R42': { a: 52.90, b: 49.95, c: 53.50 },
};

const GUIDE_ARTICLES = [
  { id: 1, cat: 'Belag kleben', catEN: 'Glueing', titleDE: 'Belag richtig kleben — Schritt für Schritt', titleEN: 'How to glue a rubber properly — step by step', leadDE: 'Frischkleber, Pinsel, Geduld. Worauf du achten musst, damit der Belag plan sitzt und keine Falten wirft.', leadEN: 'Fresh glue, brush, patience. What it takes for the rubber to sit flat without bubbles.', read: 6 },
  { id: 2, cat: 'Belag pflegen', catEN: 'Care', titleDE: 'Belagreiniger — was wirklich hilft', titleEN: 'Rubber cleaner — what actually works', leadDE: 'Wir testen sechs Mittel gegen Schweiß, Staub und Hallendreck. Spoiler: Wasser reicht meist.', leadEN: 'We test six products against sweat, dust and gym grime. Spoiler: water usually wins.', read: 4 },
  { id: 3, cat: 'Schläger lagern', catEN: 'Storage', titleDE: 'Wie du deinen Schläger zwei Saisons jung hältst', titleEN: 'Keep your bat two seasons young', leadDE: 'Hülle, Folie, Temperatur. Drei Hebel, mit denen du dir 80 € pro Jahr sparst.', leadEN: 'Case, foil, temperature. Three levers that save you €80 a year.', read: 5 },
  { id: 4, cat: 'Tuning', catEN: 'Tuning', titleDE: 'Booster: Mythos und Realität', titleEN: 'Booster: myth versus reality', leadDE: 'Was Booster wirklich tun, wann sie verboten sind und warum die meisten Vereinsspieler sie nicht brauchen.', leadEN: 'What boosters really do, when they are illegal and why most club players do not need them.', read: 7 },
  { id: 5, cat: 'Belag wechseln', catEN: 'Replacing', titleDE: 'Wann ist ein Belag wirklich tot?', titleEN: 'When is a rubber actually dead?', leadDE: 'Drei Tests, die du in 30 Sekunden in der Halle machen kannst. Spar dir die teure Routine.', leadEN: 'Three checks you can do in 30 seconds at the hall. Skip the expensive routine.', read: 4 },
  { id: 6, cat: 'Belag kleben', catEN: 'Glueing', titleDE: 'Schwarz oder rot — gibt es einen Unterschied?', titleEN: 'Black or red — does it matter?', leadDE: 'ITTF-Regel, Materialmythen und was Profis wirklich machen. Eine Aufklärung.', leadEN: 'ITTF rule, material myths and what pros actually do. A clarification.', read: 5 },
];

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────
function StatBar({ label, value, max = 10, accent = false }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', width: 56, flexShrink: 0 }}>{label}</div>
      <div className="stat-track" style={{ flex: 1 }}>
        <div className="stat-fill" style={{
          width: pct + '%',
          background: accent ? 'linear-gradient(90deg, var(--ember-deep), var(--ember))' : 'linear-gradient(90deg, #4a4540, #847b6e)'
        }} />
      </div>
      <div className="ff-mono" style={{ fontSize: 11, color: 'var(--ink-1)', width: 22, textAlign: 'right' }}>{value}</div>
    </div>
  );
}

function SynergyRing({ value, size = 96, stroke = 6, label = 'Synergie' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf, start;
    const dur = 800;
    const step = (t) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg className="ring-svg" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} stroke="var(--bg-4)" strokeWidth={stroke} fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke="url(#emberGrad)" strokeWidth={stroke} fill="none"
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
          <defs>
            <linearGradient id="emberGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff8c5a" />
              <stop offset="100%" stopColor="#c84a1e" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ff-display" style={{ fontSize: size * 0.36, lineHeight: 1, color: 'var(--ink-0)' }}>{shown}</div>
          <div className="ff-mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 2 }}>/100</div>
        </div>
      </div>
      {label && <div className="ff-mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>}
    </div>
  );
}

function SparksLayer({ count = 12, area = { w: 600, h: 200 } }) {
  const sparks = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    left: Math.random() * 100,
    bottom: Math.random() * 30,
    dur: 2.5 + Math.random() * 2.5,
    del: Math.random() * 4,
    sx: (Math.random() - 0.5) * 30,
    size: 2 + Math.random() * 2,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {sparks.map((s, i) => (
        <span key={i} className="spark" style={{
          left: s.left + '%',
          bottom: s.bottom + 'px',
          '--dur': s.dur + 's',
          '--del': s.del + 's',
          '--sx': s.sx + 'px',
          width: s.size + 'px',
          height: s.size + 'px',
        }} />
      ))}
    </div>
  );
}

function SectionLabel({ n, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <span className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ember-2)' }}>§ {n}</span>
      <span className="ff-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
    </div>
  );
}

function fmtPrice(n, locale = 'de') {
  if (locale === 'de') return n.toFixed(2).replace('.', ',') + ' €';
  return '€' + n.toFixed(2);
}

// Export to global
Object.assign(window, {
  Icon, Icons, T, SAMPLE_SETUPS, SHOPS, PRICING, GUIDE_ARTICLES,
  StatBar, SynergyRing, SparksLayer, SectionLabel, fmtPrice,
});
