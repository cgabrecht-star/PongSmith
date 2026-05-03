# PongSmith — Technische Roadmap

**Aktueller Status:** Start Phase 1 (Datenarchitektur)
**Geplanter Launch:** ca. November 2026
**Pensum:** ~9 h/Woche (1,5 h × 6 Tage)

---

## Phase 0: Fundament ✅ ABGESCHLOSSEN

- ✅ Persona definiert (Marco P1, Tobias P2)
- ✅ Positionierung & USP scharf
- ✅ Konkurrenz-Analyse
- ✅ Name: PongSmith
- ✅ Domain: pongsmith.de + .com
- ✅ Tech-Stack final
- ✅ FOUNDATION.md, CLAUDE.md, SETUP_INVENTUR.md

---

## Phase 1: Datenarchitektur + Erfahrungs-DB (Woche 3-7)

**Ziel:** DB-Schema steht, erste 50 Beläge / 25 Hölzer drin, 10 Vereinsspieler-Interviews erfasst, Synergie-Logik v1 implementiert.

### 1.1 Projekt-Setup (Woche 3, ca. 6 h)

- ✅ Next.js 15 Projekt initialisieren mit TypeScript, Tailwind, App Router
- ✅ shadcn/ui einrichten (Setup, noch keine Komponenten)
- ✅ Drizzle ORM installieren und konfigurieren
- ✅ ESLint + Prettier konfigurieren
- ✅ Ordnerstruktur anlegen: `app/`, `components/`, `lib/`, `db/`, `types/`, `docs/`
- ✅ `.env.example` mit allen benötigten Env-Vars
- ✅ `.gitignore` korrekt
- ✅ `README.md` mit Projekt-Beschreibung
- [ ] Erstes Commit + Push zu GitHub
- [ ] Vercel-Projekt anlegen und mit GitHub verbinden
- [ ] Erstes Deployment auf Vercel funktioniert (auch noch ohne Inhalt)

### 1.2 Supabase + Datenbank-Setup (Woche 3-4, ca. 4 h)

- ✅ Supabase-Projekt anlegen
- ✅ Connection-String in `.env.local` speichern
- ✅ Drizzle mit Supabase verbinden
- ✅ `npm run db:push` und `npm run db:studio` Skripte einrichten
- ✅ Erste Test-Migration erfolgreich

### 1.3 Datenbank-Schema entwerfen (Woche 4, ca. 9 h)

Tabellen, die wir brauchen:

**Stammdaten (Material)**
- [ ] `manufacturers` (Hersteller: Butterfly, Stiga, Donic, etc.)
- [ ] `blades` (Hölzer): Hersteller, Modell, Speed, Control, Steifheit, Furnier-Aufbau, Gewicht-Range, Spielsystem-Empfehlung, TTR-Korridor, Slug, Beschreibung
- [ ] `rubbers` (Beläge): Hersteller, Modell, Typ (glatt/Noppen/Anti), Speed, Spin, Control, Schwammhärte, Topsheet-Charakter (klebrig/griffig), TTR-Korridor, Slug, Beschreibung
- [ ] `rubber_variants` (Beläge haben Härte- und Dicke-Varianten)

**Synergien**
- [ ] `synergies`: blade_id, rubber_id, synergy_score, tempo_match, control_reserve, spin_potential, weight_balance, style_fit, begründung_text

**Shop-Daten**
- [ ] `shops`: Name, Domain, Affiliate-Programm, Provision-%, Cookie-Tage
- [ ] `shop_products`: shop_id, product_type (blade/rubber), product_id, shop_product_url, affiliate_url
- [ ] `prices`: shop_product_id, price, in_stock, scraped_at

**Erfahrungs-DB (eigene Vereinsdaten)**
- [ ] `players` (anonymisiert): id, ttr_range, jahre_aktiv, spielstil, hand
- [ ] `player_setups`: player_id, status (aktuell/vorher), blade_id, rubber_vh_id, rubber_rh_id, schlägergewicht, scores (tempo, spin, control, etc.), wechselgrund, kommentar
- [ ] `observations`: player_id, beobachtete_stärken, defizite, eigene_empfehlung

**Empfehlungs-Tracking (für Feedback-Schleife)**
- [ ] `recommendations`: session_id, eingaben_jsonb, empfohlenes_setup_jsonb, generated_at
- [ ] `recommendation_feedback`: recommendation_id, rating (gut/mittel/schlecht), kommentar, created_at

**Aufgaben:**
- [ ] Schema in `db/schema.ts` mit Drizzle definieren
- [ ] ER-Diagramm als ASCII oder Mermaid-Diagramm in `docs/SCHEMA.md`
- [ ] Migration laufen lassen, in Supabase Studio prüfen
- [ ] Seed-Skript für Test-Daten anlegen (`db/seed.ts`)

### 1.4 Hersteller-Daten erfassen (Woche 5, ca. 9 h)

- [ ] Liste der Top 50 Beläge zusammenstellen (Quellen: revspin.net Top-Listen, mytischtennis-Forum, racketinsight)
- [ ] Liste der Top 25 Hölzer zusammenstellen
- [ ] Manuelle Erfassung in Spreadsheet (CSV) als Zwischenformat
- [ ] Import-Skript schreiben: CSV → DB
- [ ] Daten-Validierungs-Skript: Prüft auf fehlende Pflicht-Felder

### 1.5 Review-Aggregate integrieren (Woche 6, ca. 9 h)

- [ ] Konzept finalisieren: Wie aggregieren wir revspin / mytischtennis-Daten? (Manuell? Halbautomatisch?)
- [ ] Felder ergänzen: `community_score_speed`, `community_score_spin`, `community_score_control` (1-10, normalisiert)
- [ ] Erste Daten für Top 20 Beläge als Stichprobe erfassen
- [ ] Rechtliche Prüfung: Aggregat-Daten vs. Inhaltsübernahme

### 1.6 Erfahrungs-DB starten (Woche 5-7, parallel)

- [ ] Notion-DB nach SETUP_INVENTUR.md anlegen
- [ ] Selbst-Interview als Test
- [ ] 10 Vereinsspieler-Interviews durchführen
- [ ] Erfahrungsdaten in PongSmith-DB überführen (manueller Import oder Export-Skript)

### 1.7 Synergie-Logik v1 (Woche 7, ca. 9 h)

- [ ] Synergie-Berechnungs-Funktion in `lib/synergy.ts`
  - Tempo-Match-Algorithmus
  - Kontroll-Reserve-Berechnung
  - Spin-Potential
  - Gewichts-Balance
  - Spielstil-Fit-Check
- [ ] Seed-Lauf: Berechne Synergien für alle Holz×Belag×Belag-Kombis (Top 50 × Top 25 × Top 25 = 31.250 Kombis)
- [ ] Cache-Strategie für Synergie-Werte
- [ ] Test-Suite: 10 manuell bewertete Setups als Test-Set, Synergie-Score muss matchen

**Phase-1-Abschluss:** Datenbank steht, ist mit echten Daten gefüllt, Synergie-Engine produziert sinnvolle Scores. Du kannst bereits jetzt manuell SQL-Queries fahren wie "Zeig mir alle Setups mit Score >80 für TTR 1300, Allround".

---

## Phase 2: KI-Berater (Woche 8-11)

**Ziel:** Funktionsfähiger Dialog mit Empfehlungslogik, Feedback-Schleife.

### 2.1 KI-Architektur entwerfen (Woche 8, ca. 6 h)

- [ ] Konzept Tool-Use mit Claude API:
  - Tool 1: `searchBlades` (Filter nach Eigenschaften)
  - Tool 2: `searchRubbers` (Filter nach Eigenschaften)
  - Tool 3: `getSynergies` (Holz+Belag-Kombi-Scores)
  - Tool 4: `getPlayerExperiences` (ähnliche Vereinsspieler-Erfahrungen)
- [ ] System-Prompt für PongSmith-Berater entwerfen
- [ ] Dialog-Flow definieren: Begrüßung → Profil-Erfassung → Spiegel → Empfehlung → Vergleich

### 2.2 Backend-Implementation (Woche 9, ca. 9 h)

- [ ] API-Route `app/api/chat/route.ts` mit Streaming
- [ ] Claude SDK integrieren
- [ ] Tool-Use-Schleife (mehrere Iterationen pro User-Message möglich)
- [ ] Conversation-State-Management (Server-Side Session, nicht Cookie-basiert)
- [ ] Token-Limit-Management

### 2.3 Frontend-Berater (Woche 10, ca. 9 h)

- [ ] Chat-UI mit shadcn/ui Komponenten
- [ ] Streaming-Antworten anzeigen
- [ ] Setup-Empfehlungs-Karten als Output-Format
- [ ] Mobile-First Layout
- [ ] Eingabe-Validation

### 2.4 Empfehlungs-Output verbessern (Woche 11, ca. 6 h)

- [ ] Strukturiertes Output-Format: Setup-Empfehlung als JSON mit Holz, VH-Belag, RH-Belag, Begründungs-Texten
- [ ] Output in DB speichern (`recommendations`-Tabelle)
- [ ] Feedback-Buttons (gut/mittel/schlecht) + Kommentar
- [ ] Test-Sessions mit eigenem Profil und 3-5 Vereinskollegen

**Phase-2-Abschluss:** Du kannst auf localhost mit dem KI-Berater chatten und kriegst sinnvolle Setup-Empfehlungen.

---

## Phase 3: Multi-Shop-Integration (Woche 12-15)

**Ziel:** Preisvergleich über mehrere Shops, Affiliate-Click-Outs, Tracking.

### 3.1 Affiliate-Programme aktivieren (Woche 12, ca. 4 h)

- [ ] Adcell-Account: TT-Shop.de, Tischtennis.biz beantragen
- [ ] Awin: weitere Programme prüfen
- [ ] Direkter Kontakt zu Shops ohne Adcell (Contra, Sportschreiner)
- [ ] Affiliate-Tracking-IDs in DB pflegen

### 3.2 Shop-Anbindung (Woche 12-13, ca. 9 h)

- [ ] Erste Shop-Anbindung: TT-Shop.de
  - Produkt-URL-Mapping: PongSmith-Produkt-ID → Shop-URL
  - Affiliate-Link-Generator
- [ ] Zweite Shop-Anbindung: Tischtennis.biz
- [ ] Generische Architektur, dass weitere Shops einfach addiert werden

### 3.3 Preis-Scraping (Woche 13-14, ca. 9 h)

- [ ] Scraping-Strategie pro Shop (CSV-Feed wenn vorhanden, sonst HTML-Scraping)
- [ ] Vercel Cron Job: Tägliches Preis-Update
- [ ] Fehlerbehandlung: Tote Links, geänderte Selektoren, Out-of-Stock
- [ ] Logging und Monitoring

### 3.4 Click-Out-Tracking (Woche 14, ca. 6 h)

- [ ] API-Route `app/api/click/route.ts` für Click-Out-Logging
- [ ] DB-Tabelle `clicks`: timestamp, recommendation_id, shop_id, product_id, user_session
- [ ] Affiliate-Link wird über interne API geleitet (für Tracking) und dann redirect
- [ ] Plausible-Goals einrichten für Click-Outs

### 3.5 UI für Preis-Vergleich (Woche 15, ca. 6 h)

- [ ] Empfehlungs-Karten zeigen Preise aus mehreren Shops
- [ ] "Bester Preis"-Badge
- [ ] "Zum Shop"-Button mit Click-Out
- [ ] Hinweis auf Affiliate (Werbekennzeichnung)

**Phase-3-Abschluss:** User kann auf einer Empfehlung klicken und kriegt Preise aus 2-3 Shops, klickt sich zum Shop mit Affiliate-Tracking.

---

## Phase 4: Frontend & UX (Woche 16-19)

**Ziel:** Mobile-First-UI, Konfigurator-Flow, Vergleichsansicht.

### 4.1 Design-System & Theme (Woche 16, ca. 6 h)

- [ ] Farbsystem in Tailwind-Config: Anthrazit + Orange (Schmiede)
- [ ] Typografie definieren
- [ ] shadcn/ui Komponenten an Theme anpassen
- [ ] Logo platzhalter (echtes Logo später)

### 4.2 Landing Page (Woche 16-17, ca. 9 h)

- [ ] Hero: USP, klarer CTA "Jetzt beraten lassen"
- [ ] Wie-funktioniert's-Sektion
- [ ] Vertrauen: warum unabhängig, woher kommen Daten
- [ ] FAQ
- [ ] Footer mit Impressum, DSGVO, Kontakt

### 4.3 Berater-Flow Polish (Woche 17, ca. 6 h)

- [ ] Onboarding: erste Frage, klar formuliert
- [ ] Loading-States während Streaming
- [ ] Verlauf der Konversation gut lesbar
- [ ] Empfehlungs-Karten visuell stark

### 4.4 Vergleichs-Seite (Woche 18, ca. 6 h)

- [ ] User kann 2-3 Empfehlungen nebeneinander sehen
- [ ] Eigenschaften-Tabelle
- [ ] Synergie-Score visualisiert
- [ ] Direkte Kauf-Buttons

### 4.5 Detail-Seiten Hölzer/Beläge (Woche 18-19, ca. 9 h)

- [ ] `/holz/[slug]` und `/belag/[slug]` Seiten
- [ ] Dynamisch generiert mit ISR
- [ ] SEO-optimiert
- [ ] Verlinkungen zu passenden Synergien

**Phase-4-Abschluss:** Site sieht professionell aus, Mobile-Erlebnis stark.

---

## Phase 5: Content & SEO (Woche 20-23)

**Ziel:** Klebe-/Pflege-Guides, Schema.org, Sitemap.

### 5.1 Content-Plan (Woche 20, ca. 3 h)

- [ ] Top 15 Themen für Klebe-/Pflege-Guides definieren
- [ ] SEO-Keyword-Recherche pro Thema
- [ ] Redaktions-Plan

### 5.2 Klebe-Guides (Woche 20-21, ca. 9 h)

- [ ] Vorlage / Layout für Guide-Seiten
- [ ] 5-7 Guides schreiben (Belag selbst aufkleben, Schwamm tunen, etc.)
- [ ] Bilder/Schritt-für-Schritt-Visualisierung

### 5.3 Pflege-Guides (Woche 21-22, ca. 9 h)

- [ ] 5-7 Guides (Belag reinigen, Schläger lagern, Lebensdauer-Tipps)

### 5.4 SEO-Foundation (Woche 22-23, ca. 6 h)

- [ ] Schema.org strukturierte Daten für Produkte und FAQs
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] OpenGraph + Twitter Cards
- [ ] Search-Console-Verbindung

### 5.5 Performance (Woche 23, ca. 3 h)

- [ ] Lighthouse-Audit
- [ ] Core Web Vitals optimieren
- [ ] Image Optimization

**Phase-5-Abschluss:** Site ist SEO-ready, Content-Fundament steht.

---

## Phase 6: Launch (Woche 24-25)

**Ziel:** Live-Gang.

### 6.1 Rechtliches (Woche 24, ca. 6 h)

- [ ] Impressum (mit Vereins-/Privatperson-Daten)
- [ ] Datenschutzerklärung
- [ ] Cookie-Banner (nur falls nötig — mit Plausible nicht zwingend)
- [ ] Werbekennzeichnung Affiliate
- [ ] AGB falls nötig
- [ ] Markenanmeldung DPMA prüfen (optional, ~290 €)

### 6.2 Testing (Woche 24, ca. 6 h)

- [ ] Manuelles Test-Skript
- [ ] Mobile auf 3 Geräten testen
- [ ] Verschiedene Browser
- [ ] Edge Cases: Berater bricht ab, kein Internet, langsame Verbindung
- [ ] Lighthouse-Score finalisieren

### 6.3 Soft-Launch (Woche 25, ca. 6 h)

- [ ] Domain auf Vercel-Production schalten
- [ ] DNS-Propagation prüfen
- [ ] SSL aktiv
- [ ] Erste Test-Nutzer aus Verein einladen
- [ ] Feedback sammeln

### 6.4 Marketing-Vorbereitung (Woche 25, ca. 3 h)

- [ ] Vereins-Newsletter / Aushang
- [ ] Beitrag im mytischtennis-Forum (zurückhaltend, nicht Spam)
- [ ] LinkedIn-Post über Vereinskanal

**Phase-6-Abschluss:** PongSmith ist live unter pongsmith.de.

---

## Nach dem Launch (Phase 7+)

Nicht jetzt planen, aber mental im Hinterkopf:
- Material-Beirat formalisieren
- Englische Version
- Test-Sessions im Verein → strukturierte Reviews → Content
- Newsletter aufbauen
- Weitere Affiliate-Partner

---

*Letzte Änderung: 02.05.2026*
