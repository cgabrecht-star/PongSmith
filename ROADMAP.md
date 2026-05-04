# PongSmith — Roadmap

**Stand:** 04.05.2026 (nach Sync zwischen Strategie-Chat und Claude Code)
**Aktuelle Phase:** A — Vereinsdaten + Deploy
**Geplanter Launch:** Mitte/Ende August 2026
**Pensum:** ~9 h/Woche (1,5 h × 6 Tage)

---

## Was bereits erledigt ist (Phase 0 + 1 + 2 + Teile von 4)

### Phase 0: Fundament ✅
- ✅ Persona definiert (Marco, Tobias, Werner)
- ✅ Positionierung & USP scharf
- ✅ Konkurrenz-Analyse (7 Wettbewerber)
- ✅ Name: PongSmith
- ✅ Tech-Stack final (Next.js 16, Tailwind v4, Supabase, Drizzle, Opus 4.7 + Haiku 4.5)
- ✅ FOUNDATION.md, CLAUDE.md, PRODUCT_SPEC.md, ROADMAP.md, SETUP_INVENTUR.md, START_HIER.md

### Phase 1: Datenarchitektur ✅
- ✅ Next.js 16 Projekt initialisiert mit TypeScript strict
- ✅ Tailwind v4 + eigene Forge-CSS-Utilities
- ✅ Drizzle ORM mit Supabase Frankfurt verbunden, Migrations live
- ✅ Komplettes DB-Schema: manufacturers, blades, rubbers, rubber_variants, synergies, shops, shop_products, prices, players, player_setups, observations, recommendations, recommendation_feedback
- ✅ Enums: rubber_type, play_style, affiliate_program
- ✅ 18 Hersteller in DB (Butterfly, Stiga, Donic, Tibhar, Joola, Xiom, DHS, Nittaku, Andro, Yasaka, Victas, Dr. Neubauer, SpinLord, Dawei, Yinhe, Juic, Friendship, TSP)
- ✅ 85+ Beläge in DB (revspin.net + 30 Exoten: 13 LP, 10 KN, 7 Anti)
- ✅ 31+ Hölzer in DB (revspin.net + 7 Defensivhölzer)
- ✅ 2.635 Synergien berechnet (Score 43-87, Mittel 72.9)
- ✅ Synergie-Engine in `lib/synergy.ts`
- ✅ Scripts: db:seed, scrape:rubbers, scrape:blades, scrape:import, db:insert-exotics, compute:synergies

### Phase 2: KI-Berater ✅
- ✅ `/api/berater` mit Agentic-Tool-Use-Loop (max. 5 Runden)
- ✅ Tool `query_setups` (TTR, play_style, rubber_type)
- ✅ Status-Codes für Edge Cases: DB_ANFAENGER (TTR<900), DB_KEIN_ERGEBNIS
- ✅ LP/KN/Anti-Spieler bekommen echte DB-Ergebnisse
- ✅ Hallucination-Guard im System-Prompt
- ✅ Frontend Chat-Widget mit Streaming + Markdown-Rendering
- ✅ Modell-Upgrade auf Opus 4.7 für Berater-Dialog (`claude-opus-4-7`)

### Phase 4 (vorgezogen): Frontend & UX ✅ (zu großen Teilen)
- ✅ Forge/Schmiede-Design komplett (Anthrazit + Ember Orange)
- ✅ CSS-Utility-Klassen (.forge-bg, .card-forged, .ember-btn, .glass-bar)
- ✅ Fonts Bebas Neue + Inter + JetBrains Mono
- ✅ One-Page-Layout: Hero, How It Works, Trust-Section, KI-Berater, Schnell-Check, FAQ, Footer
- ✅ AdvisorForm (Schnell-Check) mit TTR-Slider 800-1900, Spielstil-Toggle, animierte Synergie-Ringe, Score-Bars
- ✅ `/api/recommend` als Direktabfrage ohne KI
- ⚠️ Hammer-Animation: dreht noch nicht 100% korrekt, zurückgestellt

---

## Phase A: Vereinsdaten + Deploy (3-4 Wochen, AKTUELL)

**Ziel:** Echte Vereinsspieler-Daten in der DB, Site öffentlich erreichbar (passwortgeschützt für Pre-Launch).

### A.1 Vercel-Deploy + Domain (Woche 1, ca. 2-3 h)
- [ ] Vercel-Projekt anlegen, mit GitHub verbinden
- [ ] Environment-Variablen übertragen (DATABASE_URL, ANTHROPIC_API_KEY etc.)
- [ ] Erstes Deployment auf Vercel
- [ ] Domain pongsmith.de registrieren (falls noch nicht)
- [ ] DNS auf Vercel zeigen
- [ ] SSL-Zertifikat aktiv prüfen
- [ ] Coming-Soon-Page oder Vercel-Password-Protection für Pre-Launch
- [ ] Smoke-Test: alle bestehenden Features (Chat, Schnell-Check) laufen produktiv

### A.2 Modell-Upgrade Berater ✅ (04.05.2026)
- ✅ `/api/berater` auf Opus 4.7 umgestellt (`claude-opus-4-7`)
- ✅ Material-Spieler (LP/KN/Anti) bekommen echte DB-Ergebnisse statt Pauschal-Absage
- [ ] System-Prompt auf Opus optimieren (mehr Spielraum für Empathie/Spiegel)
- [ ] Test-Dialoge: 5 Beispiel-Spieler durch den Flow schicken, Qualität bewerten
- [ ] Token-Verbrauch monitoren

### A.3 Vereins-Inventur — Akquise (parallel über 4 Wochen)
- [ ] Notion oder Airtable nach SETUP_INVENTUR.md aufsetzen
- [ ] Selbst-Interview durchführen (Test des Bogens)
- [ ] Bogen ggf. anpassen
- [ ] 10-15 Vereinsspieler-Interviews durchführen (Vereinsabende, Trainingsabende)
- [ ] Strukturiert erfassen: Profil, aktuelles Setup, vorheriges Setup, Bewertungs-Scores, Wechselgrund

### A.4 Vereinsdaten in DB importieren (Woche 3-4, 4-6 h)
- [ ] Import-Skript schreiben: Notion/Airtable Export → SQL → Drizzle Insert
- [ ] Anonymisierungs-Logik (Spieler-IDs statt Namen)
- [ ] In `players`, `player_setups`, `observations` einlesen
- [ ] Validation: keine Pflichtfelder leer, TTR plausibel
- [ ] Engine-Kalibrierung: Empfehlungs-Output mit echten Vereinsspieler-Bewertungen abgleichen

### A.5 Trust-Element auf Site (Woche 4, 2 h)
- [ ] Sektion auf Landing: "Unsere Empfehlungen werden mit Erfahrungen von echten Vereinsspielern in TTR-Range 1000-1700 abgeglichen."
- [ ] Counter "X Vereinsspieler-Profile in der DB"
- [ ] Erste anonymisierte Vereinsspieler-Erfahrung als Beispiel ("Spieler S1, TTR 1320, wechselte von X zu Y, Begründung Z")

**Phase-A-Abschluss:** Site ist live unter pongsmith.de (passwortgeschützt), 10+ Vereinsspieler in der DB, Berater läuft auf Opus 4.7, Trust-Element sichtbar.

---

## Phase B: Shop & Affiliate (3-4 Wochen)

**Ziel:** Echte Affiliate-Links auf der Site, Tracking funktioniert, erste Provisionen möglich.

### B.1 Affiliate-Anmeldungen (Woche 1, ca. 2 h aktive Arbeit)
- [ ] Adcell-Account anlegen (auf pongsmith.de hinweisen, jetzt geht's, weil Site live)
- [ ] Awin-Account anlegen (5 € Anmeldegebühr)
- [ ] Bei Adcell beantragen: TT-Shop.de, Tischtennis.biz
- [ ] Bei Awin beantragen: Decathlon DE
- [ ] Warten auf Freischaltungen (1-3 Wochen)

### B.2 Direkt-Anfragen (Woche 1-2, 1 h)
- [ ] E-Mail an Spinfactory (Köln)
- [ ] E-Mail an Futurespin (Nürnberg)
- [ ] E-Mail-Template aus FOUNDATION.md Punkt 6 nutzen
- [ ] Antworten dokumentieren, ggf. nachhaken

### B.3 Shop-Datenmodell mit Daten füllen (Woche 1-2, 4-6 h)
- [ ] Shops in DB anlegen: TT-Shop.de, Tischtennis.biz, Decathlon, ggf. weitere
- [ ] Affiliate-IDs und Cookie-Laufzeiten pflegen
- [ ] shop_products: erste 50 Beläge und 25 Hölzer mit Shop-URLs verknüpfen

### B.4 Click-Out-Tracking (Woche 2, 4-6 h)
- [ ] API-Route `/api/click` für Click-Out-Logging
- [ ] DB-Tabelle `clicks` (timestamp, recommendation_id, shop_id, product_id, session_id)
- [ ] Affiliate-Link über interne API leiten (Tracking) und dann Redirect zum Shop
- [ ] Plausible-Goals (kommt in Phase D, Schema schon vorbereiten)

### B.5 Preis-Scraping (Woche 2-3, 6-8 h)
- [ ] Scraping-Strategie pro Shop (CSV-Feed wenn vorhanden, sonst HTML)
- [ ] Vercel Cron Job: Tägliches Preis-Update
- [ ] Fehlerbehandlung: Tote Links, geänderte Selektoren, Out-of-Stock
- [ ] Logging und Monitoring

### B.6 UI für Multi-Shop-Vergleich (Woche 3-4, 6-8 h)
- [ ] Empfehlungs-Karten zeigen Preise aus 2-3 Shops
- [ ] "Bester Preis"-Badge
- [ ] "Zum Shop"-Button mit Click-Out-Tracking
- [ ] Werbekennzeichnung sichtbar (Affiliate-Disclaimer)

**Phase-B-Abschluss:** User kann auf Empfehlung klicken, kriegt Preise aus 2+ Shops, klickt sich zum Shop mit Affiliate-Tracking. Erste Provisionen rollen rein (theoretisch).

---

## Phase C: Detail-Seiten + SEO + Content (4-5 Wochen)

**Ziel:** Site ist SEO-stark, hat Detail-Tiefe, organischer Traffic startet.

### C.1 Detail-Seiten Hölzer und Beläge (Woche 1-2, 8-10 h)
- [ ] `/holz/[slug]` und `/belag/[slug]` dynamisch
- [ ] ISR mit Revalidate
- [ ] Anzeige: Hersteller-Daten + Community-Werte nebeneinander
- [ ] TTR-Korridor und Spielstil-Empfehlung
- [ ] Top-Synergien (welches Holz passt zu welchem Belag)
- [ ] Preise aus allen Shops
- [ ] Anonymisierte Vereinsspieler-Erfahrungen wenn vorhanden

### C.2 Sortiment-Browser (04.05.2026 vorgezogen) ✅
- ✅ `/sortiment` Übersichtsseite mit `/api/sortiment`
- ✅ Filter: Belag-Typ (Invertiert/LP/KN/Anti), Spielstil, Hersteller, Namenssuche
- ✅ Material-Spieler-Filter sichtbar (LP/KN/Anti)
- ✅ Nav-Link "Sortiment" in TopBar
- [ ] Detail-Seiten `/holz/[slug]` und `/belag/[slug]` (noch Phase C.1)

### C.3 Klebe-/Pflege-/Tuning-Guides (Woche 3-4, 9-12 h)
- [ ] Top 12 Themen definieren (z. B. Belag selbst aufkleben, Pflege, Tuning, Belag-Wechsel-Zeitpunkt)
- [ ] Vorlage / Layout für Guide-Seiten
- [ ] Erste 8-10 Guides schreiben (Claude hilft beim Erstentwurf, Chris redigiert)
- [ ] Bilder/Schritt-für-Schritt-Visualisierung (KI-generiert oder selbst fotografiert)

### C.4 SEO-Foundation (Woche 4-5, 4-6 h)
- [ ] Schema.org strukturierte Daten für Produkte und FAQs
- [ ] Sitemap.xml auto-generiert
- [ ] robots.txt
- [ ] OpenGraph + Twitter Cards
- [ ] Search-Console-Verbindung
- [ ] Lighthouse-Audit, Core Web Vitals optimieren

**Phase-C-Abschluss:** Site hat 100+ einzelne Produktseiten, 8-12 Content-Guides, ist SEO-ready. Erste organische Treffer in Google möglich.

---

## Phase D: Launch-Polish (2-3 Wochen)

**Ziel:** Pre-Launch wird Public-Launch.

### D.1 Hero-Animation final (Woche 1, 6-8 h)
- [ ] Entscheidung: Hammer-Animation reparieren oder durch Frame-Sequence-Workflow ersetzen
- [ ] Falls Frame-Sequence: Midjourney/Flux generiert 2 Bilder (geschlossener Schläger + explodiert), Veo 3.1 macht Übergang, EZGif → Frames, GSAP ScrollTrigger
- [ ] Mobile-Performance prüfen
- [ ] Fallback für alte Browser

### D.2 Rechtliches (04.05.2026 vorgezogen)
- ✅ Impressum (`/impressum`) — Christoph Gabrecht, Institutsgasse 6, 01067 Dresden
- ✅ Datenschutzerklärung (`/datenschutz`) — Vercel, Supabase, Anthropic, Plausible, Adcell/Awin alle korrekt
- ✅ Links im Footer aktiv
- [ ] Cookie-Banner (mit Plausible nicht nötig — erledigt)
- [ ] Werbekennzeichnung Affiliate (kommt mit Phase B)
- [ ] AGB falls nötig
- [ ] Markenanmeldung DPMA prüfen (optional, ~290 €)

### D.3 Plausible Analytics (Woche 2, 1-2 h)
- [ ] Plausible-Account anlegen
- [ ] Tracking-Code einbauen
- [ ] Goals einrichten: Berater-Start, Empfehlungs-Generation, Click-Out, Feedback
- [ ] Dashboard für Chris einrichten

### D.4 Testing + Polish (Woche 2-3, 6-8 h)
- [ ] Mobile auf 3 Geräten testen
- [ ] Verschiedene Browser
- [ ] Edge Cases: Berater bricht ab, kein Internet, langsame Verbindung
- [ ] Lighthouse-Score finalisieren
- [ ] Performance-Tuning

### D.5 Soft-Launch im Verein (Woche 3, 2-3 h)
- [ ] Passwort-Schutz von pongsmith.de entfernen
- [ ] Erste Test-Nutzer aus Verein einladen
- [ ] Feedback sammeln (Formular oder direkter Draht)
- [ ] Iteration

### D.6 Marketing-Vorbereitung (Woche 3, 2-3 h)
- [ ] Vereins-Newsletter / Aushang
- [ ] Beitrag im mytischtennis-Forum (zurückhaltend, nicht Spam)
- [ ] LinkedIn-Post über Vereinskanal
- [ ] Google Business Profile (optional)

**Phase-D-Abschluss:** PongSmith ist live und öffentlich unter pongsmith.de. Erste echte Spieler nutzen das Tool. Erste echte Affiliate-Klicks.

---

## Nach dem Launch (Phase E+)

Nicht jetzt im Detail planen, aber mental im Hinterkopf:
- Material-Beirat formalisieren
- Englische Version
- Test-Sessions im Verein → strukturierte Reviews → Content
- Newsletter aufbauen
- Weitere Affiliate-Partner (Schöler & Micke, Hersteller-Programme)
- Hersteller-Direktkooperationen (Butterfly, Andro, Tibhar, Joola)
- Eventuell: Penholder-Modul, eigene Test-Berichte

---

## Sync-Updates (Changelog)

### 04.05.2026 — Session 2: Exoten-DB + Legal + Sortiment
- 30 Exoten-Beläge in DB (13 LP, 10 KN, 7 Anti) + 7 Defensivhölzer + 8 neue Hersteller
- 2.635 Synergien neu berechnet, Material-Tag korrekt gesetzt
- Berater-API: Material-Spieler bekommen echte DB-Ergebnisse
- Berater-Modell: Opus 4.7 (`claude-opus-4-7`)
- `/impressum` + `/datenschutz` vollständig ausgefüllt (Christoph Gabrecht, Dresden)
- `/sortiment` + `/api/sortiment` gebaut (85 Beläge, 31 Hölzer, alle Filter)
- CLAUDE.md + ROADMAP.md + FOUNDATION.md aus Strategie-Chat synchronisiert

### 04.05.2026 — Großer Sync zwischen Strategie-Chat und Claude Code
- Materialspieler werden gleichberechtigt beraten (Persona C ergänzt)
- Modellwahl: Opus 4.7 für Berater, Haiku für Schnell-Check
- Vereinsspieler-Datenakquise als Pflicht bestätigt
- Roadmap von 25-Wochen-Plan auf 4 Phasen (A-D) gestrafft
- Tech-Stack auf Next.js 16 + Tailwind v4 aktualisiert
- Launch-Ziel von November 2026 auf Mitte/Ende August 2026 vorgezogen

---

*Letzte Aktualisierung: 04.05.2026*
