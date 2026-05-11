/**
 * Zentrale Internationalisierung für PongSmith.
 *
 * Alle UI-Texte landen hier. Pro Sprache ein Block. Strukturierter Zugriff
 * über getT(lang) gibt die jeweilige Sub-Struktur zurück.
 *
 * Sprache wird über `LanguageContext` verwaltet (cookie + localStorage).
 */

export type Lang = "de" | "en";
export const DEFAULT_LANG: Lang = "de";

// ────────────────────────────────────────────────────────────────────────────
// Translations
// ────────────────────────────────────────────────────────────────────────────

const translations = {
  de: {
    // Navigation
    nav: {
      start: "Start",
      berater: "Berater",
      check: "Probleme",
      sortiment: "Sortiment",
      guide: "Ratgeber",
    },

    // Hero
    hero: {
      kicker: "Die Tischtennis-Schmiede",
      line1: "Finde heraus,",
      line2: "ob dein Setup",
      line3: "zu dir passt.",
      sub: "Damit du nie wieder 200 € in ein Setup steckst, das nicht zu dir passt. Unabhängig. Kostenlos. Ohne Marken-Bias.",
      cta: "Profil checken",
      ctaSecondary: "So funktioniert's",
      stat1v: "1.000–1.700",
      stat1l: "Q-TTR Spielstärke",
      stat2v: "0 €",
      stat2l: "Beratung",
      stat3v: "14",
      stat3l: "Hersteller im Index",
    },

    // Affiliate-Transparenz (zwischen Hero und HowItWorks)
    affiliate: {
      kicker: "Wie wir Geld verdienen",
      title: "Affiliate-Provision, kein Verkaufsdruck.",
      body: "Wenn du nach unserer Empfehlung über einen unserer Links kaufst, bekommen wir eine kleine Provision vom Shop. Du zahlst keinen Cent mehr. Was wir verdienen, hängt vom Shop ab — nicht vom konkreten Produkt. Unsere Empfehlung wird nicht angepasst um die Provision zu maximieren.",
      moreLink: "Details im Datenschutz",
    },

    // How it works
    how: {
      title: "Drei Schritte. Kein Verkaufsdruck.",
      sub: "Wir hören dir zu. Und manchmal lautet die Empfehlung: bleib bei dem, was du hast.",
      steps: [
        { n: "01", t: "Erzählen", d: "Du beschreibst deine Spielstärke, Frustpunkte und worauf du im Match warten musst." },
        { n: "02", t: "Spiegeln", d: "Wir fassen dein Profil zusammen, damit Missverständnisse weg sind, bevor du Geld ausgibst." },
        { n: "03", t: "Empfehlen", d: "Drei begründete Setups mit Synergie-Score, Preisvergleich und ehrlichem „warum nicht\"." },
      ],
    },

    // Trust
    trust: {
      title: "Woher kommt unser Wissen?",
      sub: "Drei Säulen. Volle Transparenz.",
      pillars: [
        { t: "Hersteller-Daten", d: "Speed-, Spin- und Control-Werte direkt aus Datenblättern. Wir kürzen nichts schön." },
        { t: "Community-Reviews", d: "Aggregiert aus Foren und Bewertungsportalen. Wir gewichten Einzelmeinungen mit Vorsicht." },
        { t: "Vereinsspieler", d: "Echte Erfahrungsberichte aus dem TTR-Korridor 1.000–1.700, nicht Bundesliga-Phantasie." },
      ],
    },

    // /mithelfen — Anonyme Spieler-Datenerfassung
    contribute: {
      // Page-Header
      kicker: "Mithelfen",
      title: "Mach die Beratung für alle besser.",
      sub: "Drei Minuten. Komplett anonym. Kein Login, kein Name. Nur deine TT-Daten — und der Berater wird mit jedem Datensatz präziser. Auch für deine nächste Anfrage.",
      ctaSection: "Hilf der Schmiede",
      ctaSectionSub: "3 Minuten anonym ausfüllen — danke!",
      ctaButton: "Daten beisteuern",

      // Progress
      stepLabel: "Schritt",
      timeEstimate: "ca. 3 Min",
      back: "Zurück",
      next: "Weiter",
      submit: "Anonym senden",
      submitting: "Wird gesendet",
      optional: "optional",

      // Step 1
      step1Title: "Wie spielst du?",
      ttrLabel: "Q-TTR / LPZ",
      styleLabel: "Spielstil",
      styles: [
        { id: "offensive_topspin", label: "Offensiv-Topspin" },
        { id: "allround", label: "Allround" },
        { id: "defensive", label: "Defensiv" },
        { id: "material", label: "Material (Noppen/Anti)" },
      ],
      handLabel: "Schlaghand",
      handRight: "Rechts",
      handLeft: "Links",

      // Step 2
      step2Title: "Was spielst du aktuell?",
      step2Hint: "Tipp den Anfang ein — wir schlagen passende Produkte vor.",
      bladeLabel: "Holz",
      bladePlaceholder: "z.B. Stiga Allround…",
      rubberVhLabel: "Belag Vorhand",
      rubberRhLabel: "Belag Rückhand",
      rubberPlaceholder: "z.B. Donic Bluefire…",
      rhSameAsVh: "gleicher Belag wie VH",

      // Step 3
      step3Title: "Wie passt es zu dir?",
      satisfactionLabel: "Gesamt-Zufriedenheit",
      goodLabel: "Was funktioniert gut?",
      goodPlaceholder: "z.B. Block ist stabil, Kontrolle in langen Ballwechseln",
      badLabel: "Was nervt?",
      badPlaceholder: "z.B. zu langsam für Topspin, Aufschlag-Spin schwach",

      // Step 4
      step4Title: "Hattest du was anderes davor?",
      step4Hint: "Komplett optional — aber genau diese Wechsel-Geschichten machen den Berater richtig gut.",
      previousPlaceholder: "z.B. Vorher Andro Gauzy mit 2× Tibhar MX-P — zu schwer und anspruchsvoll, Topspin fiel ständig zu kurz.",
      privacyNote: "Wir speichern: TTR, Spielstil, Hand, dein Setup, deine Bewertung, deine Texte. Wir speichern NICHT: Name, E-Mail, IP-Adresse, Cookies. Daten werden anonymisiert in unserer Datenbank gespeichert und für die Beratungs-Engine genutzt. Mehr im Datenschutz.",

      // Erfolg
      successTitle: "Danke. Im Ernst.",
      successBack: "Zurück zur Startseite",
    },

    // Founder-Sektion (zwischen Promises und FAQ)
    founder: {
      kicker: "Hinter PongSmith",
      title: "Eine Person. Kein Konzern.",
      name: "Christoph Gabrecht",
      role: "Vereinsspieler · Mitgründer Shakehands e.V. Dresden",
      ageLine: "38 Jahre · Q-TTR 1.280",
      story: "PongSmith soll genau die Frustration verhindern, die ich selbst und viele Vereinskollegen durchgemacht haben: 200 € in ein Setup stecken, das nicht passt — und dadurch die Freude am Sport verlieren. Die Seite wird laufend mit neuen Daten gefüttert: Beläge, Hölzer, Community-Stimmen, eigene Test-Erfahrungen. Wenn dir was auffällt oder fehlt, schreib mich an.",
      contactLabel: "E-Mail",
      contactValue: "hallo@pongsmith.de",
    },

    // Demo / Beispielberatung (vor BeraterSection)
    demo: {
      kicker: "So sieht eine Beratung aus",
      title: "Beispiel: Marco, Q-TTR 1.280, Allround.",
      sub: "Echte Berater-Logik, fixiertes Profil — damit du siehst was rauskommt bevor du selbst tippst.",
      badge: "BEISPIEL",
      tryNowLabel: "Jetzt eigenes Profil checken",
      messages: [
        { role: "user", text: "Ich habe TTR 1280, spiele Allround mit leichter VH-Tendenz. Mein Sriver fühlt sich zu langsam an, aber ich will keine Rakete. Budget ~80 € pro Belag." },
        { role: "assistant", text: "Verstehe — du willst mehr Tempo ohne Kontrollverlust, und der Sriver hat dir das nie ganz gegeben. Klassische Marco-Situation: Belag, der dich nicht ärgert, aber auch nicht trägt.\n\n**Drei Setups, die für dich passen würden:**\n\n1. **Stiga Allround Classic + Donic Acuda S2**\n   · Holz spielt sich wie der Sriver, aber kontrolliertes Tempo. Acuda S2 (40°) gibt dir Spin-Reserven die du noch nicht ausreizt.\n\n2. **Andro Treiber Q + Tibhar Aurus Soft**\n   · Etwas spritziger im Holz. Aurus Soft hat genau die Verzeih-Eigenschaft die du brauchst, ohne langsam zu wirken.\n\n3. **Yasaka Sweden Extra + Yasaka Rakza X Soft**\n   · Geheimtipp im Allround-Bereich. Komplettes Setup unter 130 €.\n\nZum Budget: 80 € pro Belag passt für alle drei. Wenn du wissen willst warum kein Tenergy 05 dabei ist — gerne, ich erklär's." },
      ],
    },

    // "Was wir nicht tun" (zwischen Problem-Express und FAQ)
    promises: {
      kicker: "Selbstverpflichtung",
      title: "Was wir bewusst nicht tun.",
      sub: "Negative Versprechen wirken stärker als positive. Hier sind unsere.",
      items: [
        { icon: "🚫", t: "Keine Bundesliga-Beläge pushen", d: "Tenergy 05 unter 1.700 TTR macht Frust statt Spin. Wir empfehlen das Setup, mit dem du nächsten Dienstag besser spielst." },
        { icon: "🚫", t: "Keine Hersteller-Werbedeals", d: "Kein Hersteller bezahlt uns für bessere Platzierung. Adcell, Awin und Amazon — Provision allein vom Shop, niemals vom Marken-Lobby." },
        { icon: "🚫", t: "Keine Provisions-Optimierung", d: "Die Empfehlung richtet sich nach deinem Profil, nicht nach der Provision. Wir sortieren nicht nach Shop-Marge." },
        { icon: "🚫", t: "Kein Newsletter-Spam", d: "Es gibt keinen Newsletter. Wenn du wiederkommst, dann weil's geholfen hat — nicht weil wir nerven." },
      ],
    },

    // Berater
    berater: {
      kicker: "KI-Berater",
      title: "Beschreib dich — ich empfehle konkret.",
      sub: "Sag mir deinen TTR, Spielstil und was dich stört. Ich durchsuche die Datenbank und erkläre dir warum ein Setup zu dir passt.",
      greeting: "Hallo! Ich bin PongSmith, dein unabhängiger Ausrüstungsberater. 🏓\n\nErzähl mir kurz von dir: Welchen Q-TTR hast du ungefähr, wie spielst du (offensiv, allround, defensiv oder mit Material wie langen Noppen / Anti) — und was nervt dich an deinem aktuellen Setup?",
      placeholder: "Schreib deine Antwort…",
      send: "Senden",
      thinking: "Denkt nach…",
      error: "Etwas ist schiefgegangen. Bitte erneut versuchen.",
    },

    // Berater-Intro (Wahl: Setup vorab oder direkt chatten)
    beraterIntro: {
      title: "Schneller zur Empfehlung?",
      sub: "Sag uns kurz dein aktuelles Setup — der Berater spart Rückfragen UND alle anderen kriegen bessere Empfehlungen.",
      ctaForm: "Setup angeben",
      ctaFormSub: "30 Sekunden · Beratung präziser",
      ctaChat: "Lieber direkt chatten",
      ctaChatSub: "Wie bisher — Berater fragt nach",
      privacyNote: "Setup-Daten werden anonym gespeichert. Kein Name, keine IP. Hilft die Beratung für alle zu verbessern.",
      // Form
      formStep1Title: "Wie spielst du?",
      formStep2Title: "Was spielst du aktuell?",
      formTtrLabel: "Q-TTR / LPZ",
      formStyleLabel: "Spielstil",
      formHandLabel: "Hand",
      formHandRight: "RH",
      formHandLeft: "LH",
      formBladeLabel: "Holz",
      formBladePlaceholder: "z.B. Stiga Allround…",
      formRubberVhLabel: "Belag VH",
      formRubberRhLabel: "Belag RH",
      formRubberPlaceholder: "z.B. Donic Bluefire…",
      formSameAsVh: "gleich wie VH",
      formPainLabel: "Was nervt dich daran?",
      formPainPlaceholder: "z.B. zu langsam, Block instabil… (optional)",
      formPainSub: "Optional — aber genau das macht die Empfehlung präzise.",
      formBack: "Zurück",
      formNext: "Weiter",
      formStart: "Beratung starten",
      formStarting: "Starte…",
    },

    // Problem-Express (ehemals Schnell-Check)
    check: {
      kicker: "Problem-Express",
      title: "Wo drückt der Schuh?",
      sub: "Klick dein Problem an — der Berater fragt direkt nach den fehlenden Details und gibt dir die passende Empfehlung.",
      // Problem-Buttons (Label + Text der an den Berater geschickt wird)
      problems: [
        {
          icon: "🛡️",
          label: "Block ist instabil",
          message: "Mein Block ist instabil — der Ball springt mir zu oft weg oder fliegt zu lang. Was kann ich am Setup ändern?",
        },
        {
          icon: "🎯",
          label: "Topspin fällt zu kurz",
          message: "Mein Topspin fällt zu oft ins Netz oder zu kurz auf den Tisch. Liegt das am Belag?",
        },
        {
          icon: "🐌",
          label: "Zu langsam",
          message: "Mein Setup fühlt sich zu langsam an, ich will aber keine Rakete. Was passt für mich?",
        },
        {
          icon: "💪",
          label: "Arm wird müde",
          message: "Mein Schlagarm wird beim Spielen schnell müde. Liegt das an einem zu schweren oder zu harten Setup?",
        },
        {
          icon: "🔄",
          label: "Von Noppen wechseln",
          message: "Ich spiele aktuell mit Noppen und überlege auf glatte Beläge zu wechseln. Wie gehe ich das an?",
        },
        {
          icon: "🆕",
          label: "Erstes Vereins-Setup",
          message: "Ich bin neu im Verein und brauche mein erstes vernünftiges Setup. Budget ist überschaubar.",
        },
      ],
      hint: "Oder schreib dein Anliegen direkt im Berater oben.",
      ttrLabel: "Q-TTR Spielstärke",
      ttrHint: "Nicht sicher? 1.300 ist ein guter Startpunkt.",
      styleLabel: "Spielstil",
      styleOffensive: "Offensiv",
      styleOffensiveSub: "Topspin & Tempo",
      styleAllround: "Allround",
      styleAllroundSub: "Ausgewogen",
      styleDefensive: "Defensiv",
      styleDefensiveSub: "Sicher & kontrolliert",
      submit: "Top 3 anzeigen",
      submitting: "Suche…",
      resultsTitle: "Deine Setups",
      tryAgain: "Andere Werte ausprobieren",
      synergy: "Synergie",
      tempoMatch: "Tempo-Abstimmung",
      controlReserve: "Kontrollreserve",
      spinPotential: "Spin-Potenzial",
      // Bridge zum Berater
      bridgeTitle: "Diese Setups passen für TTR und Stil.",
      bridgeText: "Aber passt eines wirklich zu DIR? Budget, Problem-Beläge, Markenwünsche — das beantwortet nur der Berater.",
      bridgeCta: "Frag den Berater",
    },

    // FAQ
    faq: {
      title: "Häufige Fragen",
      items: [
        { q: "Verdient ihr an meinem Kauf?", a: "Ja, über Affiliate-Provisionen vom Shop. Du zahlst keinen Cent mehr. Was wir verdienen hängt vom Shop ab, nicht vom konkreten Produkt — wir sortieren also nicht nach Marge. Wenn ein günstigerer Belag besser zu dir passt, kriegst du den empfohlen." },
        { q: "Warum keine Bundesliga-Beläge?", a: "Weil ein Tenergy 05 unter 1.700 TTR meist mehr Frust als Spin liefert. Wir empfehlen das Setup, mit dem du nächsten Dienstag besser spielst." },
        { q: "Reicht eine KI für sowas Persönliches?", a: "Die KI hört strukturiert zu, vergleicht dein Profil mit hunderten Beläg-Holz-Kombinationen und legt die Begründung offen. Du entscheidest." },
        { q: "Was ist mit Defensiv-Setups?", a: "Voll abgedeckt. Sag uns einfach, du spielst hinter dem Tisch — die Empfehlungen drehen sich entsprechend." },
      ],
    },

    // Footer
    footer: {
      tag: "Unabhängig · Markenneutral · Kostenlos",
      copy: "© 2026 PongSmith. Geschmiedet in Deutschland.",
      colAdvisory: "Beratung",
      colWorkshop: "Werkstatt",
      colLegal: "Rechtliches",
      itemAdvisor: "KI-Berater",
      itemQuickPick: "Schnell-Check",
      itemSortiment: "Sortiment",
      itemGuide: "Ratgeber",
      itemContribute: "Mithelfen",
      itemImprint: "Impressum",
      itemPrivacy: "Datenschutz",
      itemAffiliate: "Affiliate-Hinweis",
    },

    // Sortiment
    sortiment: {
      title: "Sortiment",
      subtitle: "Alle Beläge und Hölzer in unserem Index — mit Hersteller-Specs, Übersetzung und aggregierten Spielerstimmen. Karte anklicken für Details.",
      tabRubbers: "Beläge",
      tabBlades: "Hölzer",
      searchPlaceholder: "Name suchen…",
      allTypes: "Alle Typen",
      typeSmooth: "Invertiert",
      typeLongPips: "Lange Noppen",
      typeShortPips: "Kurze Noppen",
      typeAnti: "Anti",
      allStyles: "Alle Stile",
      styleOffensive: "Offensiv",
      styleAllround: "Allround",
      styleDefensive: "Defensiv",
      styleMaterial: "Material",
      allManufacturers: "Alle Hersteller",
      reset: "Reset",
      loading: "LADE SORTIMENT…",
      noResults: "Keine Treffer",
      noResultsHint: "Filter anpassen oder Reset drücken.",
      foundRubbers: "Beläge gefunden",
      foundBlades: "Hölzer gefunden",
      sourceNote: "DATEN: HERSTELLER-DATENBLÄTTER + AGGREGIERTE COMMUNITY-STIMMEN · NORMIERT AUF 1.0–10.0",
      // Datenqualitäts-Filter + Badges
      qualityToggleLabel: "Nur voll dokumentierte",
      qualityComplete: "Voll dokumentiert",
      qualityCompleteHint: "Specs + ≥3 Community-Reviews + Beschreibung",
      qualityPartial: "Wenig Community-Daten",
      qualityPartialHint: "Specs vorhanden, aber wenig Reviews oder ohne Beschreibung",
      consultBtn: "Profil checken",
      // Modal
      specs: "Spezifikationen",
      reviews: "Community-Reviews",
      manufacturerDesc: "Hersteller-Beschreibung",
      communityDesc: "Was Spieler sagen",
      noDescription: "Noch keine Beschreibung hinterlegt.",
      noCommunity: "Noch keine Community-Stimmen aggregiert.",
      futureCta: "Bald: in den Schläger-Schmied einbauen · Preis vergleichen · zum Shop",
      hoverHint: "→ Details öffnen",
      defaultHint: "Klick für Details",
      reviewCount: "Community-Reviews",
      // Tags
      labelSpongeHardness: "Schwamm",
      labelComposition: "Aufbau",
      labelWeight: "Gewicht",
      // Stats
      labelSpeed: "Speed",
      labelSpin: "Spin",
      labelControl: "Control",
      // Aria
      closeAriaLabel: "Schließen",
    },

    // Common
    common: {
      backHome: "← Zur Startseite",
    },
  },

  en: {
    nav: {
      start: "Home",
      berater: "Advisor",
      check: "Issues",
      sortiment: "Products",
      guide: "Guide",
    },

    hero: {
      kicker: "The Table-Tennis Forge",
      line1: "Find out",
      line2: "if your setup",
      line3: "actually fits you.",
      sub: "So you never burn another €200 on a setup that doesn't fit you. Independent. Free. Zero brand bias.",
      cta: "Check my profile",
      ctaSecondary: "How it works",
      stat1v: "1,000–1,700",
      stat1l: "Q-TTR rating range",
      stat2v: "€0",
      stat2l: "Cost to you",
      stat3v: "14",
      stat3l: "Brands indexed",
    },

    affiliate: {
      kicker: "How we make money",
      title: "Affiliate commission, no sales pressure.",
      body: "If you buy through one of our links after our recommendation, we get a small commission from the shop. You don't pay a cent more. What we earn depends on the shop, not the specific product — our recommendation isn't tweaked to maximise commission.",
      moreLink: "Details in privacy policy",
    },

    how: {
      title: "Three steps. No sales pressure.",
      sub: "We listen. And sometimes the answer is: stick with what you have.",
      steps: [
        { n: "01", t: "Tell us", d: "Describe your level, your frustrations, the shot you keep waiting for in matches." },
        { n: "02", t: "Mirror", d: "We summarise your profile back so misunderstandings are gone before you spend money." },
        { n: "03", t: "Recommend", d: "Three reasoned setups with a synergy score, price comparison, and honest 'why not'." },
      ],
    },

    trust: {
      title: "Where our knowledge comes from",
      sub: "Three pillars. Full transparency.",
      pillars: [
        { t: "Manufacturer data", d: "Speed, spin, control numbers straight from spec sheets. We do not round up." },
        { t: "Community reviews", d: "Aggregated from forums and rating sites. We weight individual opinions with care." },
        { t: "Club players", d: "Real reports from the 1,000–1,700 TTR corridor. Not pro-tour fantasy." },
      ],
    },

    contribute: {
      kicker: "Help out",
      title: "Make the advisor better for everyone.",
      sub: "Three minutes. Fully anonymous. No login, no name. Just your TT data — and the advisor gets sharper with every record. Including your next request.",
      ctaSection: "Help the forge",
      ctaSectionSub: "3 minutes anonymous — thanks!",
      ctaButton: "Contribute data",

      stepLabel: "Step",
      timeEstimate: "~3 min",
      back: "Back",
      next: "Next",
      submit: "Submit anonymously",
      submitting: "Sending",
      optional: "optional",

      step1Title: "How do you play?",
      ttrLabel: "Q-TTR / LPZ",
      styleLabel: "Play style",
      styles: [
        { id: "offensive_topspin", label: "Offensive topspin" },
        { id: "allround", label: "Allround" },
        { id: "defensive", label: "Defensive" },
        { id: "material", label: "Material (pips/anti)" },
      ],
      handLabel: "Playing hand",
      handRight: "Right",
      handLeft: "Left",

      step2Title: "What do you play right now?",
      step2Hint: "Type the start — we'll suggest matching products.",
      bladeLabel: "Blade",
      bladePlaceholder: "e.g. Stiga Allround…",
      rubberVhLabel: "Forehand rubber",
      rubberRhLabel: "Backhand rubber",
      rubberPlaceholder: "e.g. Donic Bluefire…",
      rhSameAsVh: "same as forehand",

      step3Title: "How does it fit?",
      satisfactionLabel: "Overall satisfaction",
      goodLabel: "What works well?",
      goodPlaceholder: "e.g. block is stable, control in long rallies",
      badLabel: "What annoys?",
      badPlaceholder: "e.g. too slow for topspin, weak serve spin",

      step4Title: "Anything different before?",
      step4Hint: "Fully optional — but these switch stories make the advisor really good.",
      previousPlaceholder: "e.g. Before: Andro Gauzy with 2× Tibhar MX-P — too heavy and demanding, topspin kept falling short.",
      privacyNote: "We store: TTR, play style, hand, your setup, your rating, your text. We DON'T store: name, email, IP address, cookies. Data is stored anonymously and used for the recommendation engine. More in the privacy policy.",

      successTitle: "Thank you. Truly.",
      successBack: "Back to homepage",
    },

    founder: {
      kicker: "Behind PongSmith",
      title: "One person. No corporation.",
      name: "Christoph Gabrecht",
      role: "Club player · co-founder Shakehands e.V. Dresden",
      ageLine: "38 years · Q-TTR 1,280",
      story: "PongSmith exists to prevent exactly the frustration I and many of my club mates have lived through: dropping €200 on a setup that doesn't fit — and losing the joy of playing because of it. The site is fed continuously with new data: rubbers, blades, community voices, my own test sessions. If you spot something missing or off, message me.",
      contactLabel: "Email",
      contactValue: "hello@pongsmith.de",
    },

    demo: {
      kicker: "What a consultation looks like",
      title: "Example: Marco, Q-TTR 1,280, allround.",
      sub: "Real advisor logic, fixed profile — so you see the output before typing yourself.",
      badge: "EXAMPLE",
      tryNowLabel: "Now check your own profile",
      messages: [
        { role: "user", text: "I'm TTR 1280, allround with a slight FH lean. My Sriver feels too slow, but I don't want a rocket. Budget ~€80 per rubber." },
        { role: "assistant", text: "Got it — you want more speed without losing control, and the Sriver never quite gave you that. Classic Marco situation: a rubber that doesn't annoy you, but doesn't carry you either.\n\n**Three setups that would fit:**\n\n1. **Stiga Allround Classic + Donic Acuda S2**\n   · Blade plays like the Sriver but with controlled speed. Acuda S2 (40°) gives spin reserves you're not yet using.\n\n2. **Andro Treiber Q + Tibhar Aurus Soft**\n   · Slightly punchier blade. Aurus Soft has exactly the forgiving feel you need, without being slow.\n\n3. **Yasaka Sweden Extra + Yasaka Rakza X Soft**\n   · Hidden gem in the allround range. Complete setup under €130.\n\nOn budget: €80 per rubber works for all three. If you want to know why no Tenergy 05 is in here — happy to explain." },
      ],
    },

    promises: {
      kicker: "Self-commitment",
      title: "What we deliberately don't do.",
      sub: "Negative promises are stronger than positive ones. Here are ours.",
      items: [
        { icon: "🚫", t: "No pro-tour rubbers pushed", d: "Tenergy 05 under 1,700 TTR creates frustration, not spin. We recommend the setup that helps you play better next Tuesday." },
        { icon: "🚫", t: "No manufacturer ad deals", d: "No brand pays us for better placement. Adcell, Awin, Amazon — commission only from the shop, never from brand lobbying." },
        { icon: "🚫", t: "No commission optimisation", d: "Recommendations follow your profile, not the commission. We don't sort by shop margin." },
        { icon: "🚫", t: "No newsletter spam", d: "There is no newsletter. If you come back it's because we helped — not because we nagged." },
      ],
    },

    berater: {
      kicker: "AI Advisor",
      title: "Describe yourself — I'll recommend specifically.",
      sub: "Tell me your TTR, play style and what bothers you. I search the database and explain why a setup fits you.",
      greeting: "Hello! I'm PongSmith, your independent table-tennis equipment advisor. 🏓\n\nTell me a bit about yourself: What's your approximate Q-TTR or playing level, how do you play (offensive, allround, defensive, or with material like long pips / anti) — and what bothers you about your current setup?",
      placeholder: "Type your reply…",
      send: "Send",
      thinking: "Thinking…",
      error: "Something went wrong. Please try again.",
    },

    beraterIntro: {
      title: "Faster to your recommendation?",
      sub: "Tell us your current setup briefly — the advisor saves callbacks AND everyone else gets better recommendations.",
      ctaForm: "Enter setup",
      ctaFormSub: "30 seconds · sharper advice",
      ctaChat: "Just chat",
      ctaChatSub: "Like before — advisor will ask",
      privacyNote: "Setup data stored anonymously. No name, no IP. Helps improve recommendations for everyone.",
      formStep1Title: "How do you play?",
      formStep2Title: "What do you play right now?",
      formTtrLabel: "Q-TTR / Rating",
      formStyleLabel: "Play style",
      formHandLabel: "Hand",
      formHandRight: "RH",
      formHandLeft: "LH",
      formBladeLabel: "Blade",
      formBladePlaceholder: "e.g. Stiga Allround…",
      formRubberVhLabel: "FH rubber",
      formRubberRhLabel: "BH rubber",
      formRubberPlaceholder: "e.g. Donic Bluefire…",
      formSameAsVh: "same as FH",
      formPainLabel: "What annoys you about it?",
      formPainPlaceholder: "e.g. too slow, block unstable… (optional)",
      formPainSub: "Optional — but this is what makes the recommendation precise.",
      formBack: "Back",
      formNext: "Next",
      formStart: "Start consultation",
      formStarting: "Starting…",
    },

    check: {
      kicker: "Problem Express",
      title: "Where's the issue?",
      sub: "Tap your problem — the advisor asks for the missing details and gives you the matching recommendation.",
      problems: [
        {
          icon: "🛡️",
          label: "Block is unstable",
          message: "My block is unstable — the ball flies too long or jumps off. What can I change about my setup?",
        },
        {
          icon: "🎯",
          label: "Topspin falls short",
          message: "My topspin falls too often into the net or short on the table. Is the rubber to blame?",
        },
        {
          icon: "🐌",
          label: "Too slow",
          message: "My setup feels too slow, but I don't want a rocket. What fits for me?",
        },
        {
          icon: "💪",
          label: "Arm gets tired",
          message: "My playing arm gets tired quickly. Is that from a too-heavy or too-hard setup?",
        },
        {
          icon: "🔄",
          label: "Switch from pips",
          message: "I currently play with pips and consider switching to inverted rubbers. How do I approach this?",
        },
        {
          icon: "🆕",
          label: "First club setup",
          message: "I'm new to the club and need my first proper setup. Budget is limited.",
        },
      ],
      hint: "Or just type your concern directly in the advisor above.",
      ttrLabel: "Q-TTR rating",
      ttrHint: "Not sure? 1,300 is a good starting point.",
      styleLabel: "Play style",
      styleOffensive: "Offensive",
      styleOffensiveSub: "Topspin & speed",
      styleAllround: "Allround",
      styleAllroundSub: "Balanced",
      styleDefensive: "Defensive",
      styleDefensiveSub: "Safe & controlled",
      submit: "Show top 3",
      submitting: "Searching…",
      resultsTitle: "Your setups",
      tryAgain: "Try different values",
      synergy: "Synergy",
      tempoMatch: "Speed match",
      controlReserve: "Control reserve",
      spinPotential: "Spin potential",
      // Bridge to advisor
      bridgeTitle: "These setups match TTR and style.",
      bridgeText: "But does one really fit YOU? Budget, problem rubbers, brand preferences — only the advisor can answer that.",
      bridgeCta: "Ask the advisor",
    },

    faq: {
      title: "Common questions",
      items: [
        { q: "Do you make money on my purchase?", a: "Yes, via affiliate commissions from the shop. You don't pay a cent more. What we earn depends on the shop, not the specific product — so we don't sort by margin. If a cheaper rubber fits you better, that's the one you'll get recommended." },
        { q: "Why no pro-tour rubbers?", a: "Because a Tenergy 05 under 1,700 TTR usually delivers more frustration than spin. We recommend the setup that lets you play better next Tuesday." },
        { q: "Can an AI really do this?", a: "The AI listens with structure, compares your profile to hundreds of blade/rubber combinations, and shows the reasoning. You decide." },
        { q: "What about defensive setups?", a: "Fully covered. Just tell us you play behind the table and the picks rotate accordingly." },
      ],
    },

    footer: {
      tag: "Independent · Brand-neutral · Free",
      copy: "© 2026 PongSmith. Forged in Germany.",
      colAdvisory: "Advisory",
      colWorkshop: "Workshop",
      colLegal: "Legal",
      itemAdvisor: "AI Advisor",
      itemQuickPick: "Quick Pick",
      itemSortiment: "Products",
      itemGuide: "Guide",
      itemContribute: "Help out",
      itemImprint: "Imprint",
      itemPrivacy: "Privacy",
      itemAffiliate: "Affiliate disclosure",
    },

    sortiment: {
      title: "Products",
      subtitle: "Every rubber and blade in our index — with manufacturer specs, translated descriptions, and aggregated player feedback. Click a card for details.",
      tabRubbers: "Rubbers",
      tabBlades: "Blades",
      searchPlaceholder: "Search by name…",
      allTypes: "All types",
      typeSmooth: "Inverted",
      typeLongPips: "Long pips",
      typeShortPips: "Short pips",
      typeAnti: "Anti",
      allStyles: "All styles",
      styleOffensive: "Offensive",
      styleAllround: "Allround",
      styleDefensive: "Defensive",
      styleMaterial: "Material",
      allManufacturers: "All manufacturers",
      reset: "Reset",
      loading: "LOADING PRODUCTS…",
      noResults: "No matches",
      noResultsHint: "Adjust filters or hit Reset.",
      foundRubbers: "rubbers found",
      foundBlades: "blades found",
      sourceNote: "DATA: MANUFACTURER SPEC SHEETS + AGGREGATED COMMUNITY VOICES · NORMALISED 1.0–10.0",
      qualityToggleLabel: "Fully documented only",
      qualityComplete: "Fully documented",
      qualityCompleteHint: "Specs + ≥3 community reviews + description",
      qualityPartial: "Limited community data",
      qualityPartialHint: "Has specs, but few reviews or no description",
      consultBtn: "Check my profile",
      // Modal
      specs: "Specifications",
      reviews: "Community reviews",
      manufacturerDesc: "Manufacturer description",
      communityDesc: "What players say",
      noDescription: "No description on file yet.",
      noCommunity: "No community feedback aggregated yet.",
      futureCta: "Coming: build into the racket forge · compare prices · go to shop",
      hoverHint: "→ Open details",
      defaultHint: "Click for details",
      reviewCount: "community reviews",
      // Tags
      labelSpongeHardness: "Sponge",
      labelComposition: "Composition",
      labelWeight: "Weight",
      // Stats
      labelSpeed: "Speed",
      labelSpin: "Spin",
      labelControl: "Control",
      // Aria
      closeAriaLabel: "Close",
    },

    common: {
      backHome: "← Back to home",
    },
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Helper
// ────────────────────────────────────────────────────────────────────────────

export type Translations = typeof translations.de;

export function getT(lang: Lang): Translations {
  return translations[lang] as Translations;
}

export function isValidLang(s: string | null | undefined): s is Lang {
  return s === "de" || s === "en";
}
