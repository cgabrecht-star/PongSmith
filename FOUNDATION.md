# PongSmith — Foundation Document

**Stand:** 04.05.2026 (nach Sync zwischen Strategie-Chat und Claude Code)
**Owner:** Chris (Shakehands e.V. Dresden)
**Projektstart:** Mai 2026
**Realistisches Launch-Ziel:** Mitte/Ende August 2026

---

## 1. Was ist PongSmith?

PongSmith ist die unabhängige Online-Schmiede für Tischtennis-Setups. Vereinsspieler beschreiben ihr Spiel im Dialog mit einer KI, bekommen 2-3 konkret begründete Schläger-Empfehlungen (Holz + 2 Beläge), vergleichen Preise über mehrere Shops und kaufen über Affiliate-Links direkt beim besten Anbieter.

**Kernsatz (an dem jede Entscheidung gemessen wird):**
> Wir sind die unabhängige Material-Beratung für Vereinsspieler bis 1700, die ihren Frust mit unpassendem Material loswerden wollen, und der Ort, an dem sie Pflege- und Klebewissen finden, das die Shops nicht neutral geben.

**Marketing-Pitch (öffentlich):**
> Damit du nie wieder 200 € in ein Setup steckst, das nicht zu dir passt. Dein unabhängiger Schläger-Berater. Ohne Verkaufsdruck, ohne Marken-Bias.

---

## 2. Persona

### Persona A — Marco, der Verzweifelte (Hauptpersona Phase 1)
- **Q-TTR:** 1000-1400
- **Technik:** unsauber, viele Eigenfehler
- **Wunsch ans Material:** "soll mir verzeihen"
- **Frust:** "Material macht meine Fehler schlimmer"
- **Spielstil:** Allround, kontrolliertes Offensivspiel
- **Budget pro Setup:** 100-180 €
- **Kaufzyklus Belag:** 9-12 Monate
- **Wo informiert sich Marco:** YouTube, mytischtennis-Forum, lokaler TT-Shop, Mannschaftskollegen
- **Wow-Moment:** "Endlich versteht das mal jemand"

### Persona B — Tobias, der Ehrgeizige (Sekundär Phase 1, Hauptpersona Phase 2)
- **Q-TTR:** 1400-1700
- **Technik:** solide, will sich weiterentwickeln
- **Wunsch ans Material:** "soll meine Stärken verstärken"
- **Frust:** "Setup limitiert mein Spiel"
- **Spielstil:** Offensiv-Topspin
- **Budget pro Setup:** 180-300 €

### Persona C — Stefan, der Materialspieler (NEU als Phase 1 Persona)
- **Q-TTR:** 1100-1700 (breiterer Range, weil Material-Stil über alle Stärken zieht)
- **Spielsystem:** Lange Noppen, kurze Noppen, Anti-Topspin, Defensiv-Block
- **Wunsch ans Material:** "soll mein Spielsystem unterstützen, nicht stören"
- **Frust:** "Niemand versteht, was wir Materialspieler eigentlich brauchen"
- **Besonderheit:** Sehr kleine Zielgruppe, aber sehr loyal und beratungsbedürftig. Wird von keinem Konkurrenten gut bedient.
- **Sortimentsbedarf:** LP-Beläge (Lange Noppen), KN-Beläge (Kurze Noppen), Anti-Topspin, dazu passende Defensivhölzer
- **Status im Code:** 30 Material-Beläge + 7 Defensivhölzer sind in der DB, Engine taggt korrekt als playStyleTarget = "material"

**Bewusste Phase-1-Erweiterung:** Materialspieler werden voll bedient, sichtbar im Schnell-Check und im KI-Dialog. Marketing-Hauptkommunikation bleibt aber auf Persona A fokussiert (Persona-Schärfe), Persona C wird als Bonus-Zielgruppe organisch mitbedient.

**Bewusst NICHT in Phase 1:**
- Penholder als eigene Empfehlungslogik (Persona-Erweiterung Phase 2)
- Anfänger unter Q-TTR 1000 (KI-Berater gibt DB_ANFAENGER-Hinweis)

---

## 3. USP — vier Differenzierungs-Säulen

1. **KI-Dialog statt Filterformulare** — Die Konkurrenz hat entweder Filter (TT-Shop, TT-Finder, SOULSPIN) oder manuelle E-Mail-Beratung mit Wartezeit (TT-Spin). Echter Beratungs-Dialog mit Rückfragen existiert nirgendwo.
2. **Holz-Belag-Synergie als algorithmische Logik** — Niemand modelliert die Wechselwirkung Holz + Belag. PongSmith hat 2.635 berechnete Synergien live.
3. **Q-TTR-basierte Empfehlung** — Deutscher Sonderhebel, nutzt niemand für tatsächliche Empfehlungen.
4. **"Verstehen-statt-Filtern"-Spiegel** — KI fasst zusammen, was der Spieler gesagt hat, bevor sie empfiehlt. Genau dieser Moment rechtfertigt den Modell-Aufpreis (Opus 4.7).

---

## 4. Wettbewerbslandschaft

| Konkurrent | Kategorie | Wo wir gewinnen |
|---|---|---|
| TT-Shop.de | Shop-Konfigurator | Markenneutralität, KI-Dialog, Vergleich |
| SOULSPIN | Premium-Hersteller-Konfigurator | Markenneutralität, breiteres Sortiment |
| TT-Spin.de | Manuelle E-Mail-Beratung | Sofortige Antwort, Skalierbarkeit, UI |
| TT-Finder.net | Preisvergleich | Beratung, Tiefe, Spielerverständnis |
| racketinsight.com | EN, Quiz + Reviews | DE-Sprache, Q-TTR, Dialog statt Quiz |
| blade-rubber.com | EN, Algorithmus | Holz+Belag-Kombi, DE, Dialog |
| revspin.net | EN, User-Reviews-DB | Beratung, Empfehlung, DE |

**Größte Bedrohungen:**
1. TT-Spin.de digitalisiert seine Beratung
2. TT-Shop baut einen eigenen Quiz à la racketinsight
3. Internationales Tool kommt auf Deutsch

**Schutz:** Geschwindigkeit, deutsche Verwurzelung (Q-TTR, DTTB, Vereinsspieler-Perspektive), echte Markenneutralität, **eigene Vereinsspieler-Erfahrungs-DB als nicht-kopierbarer Moat**.

---

## 5. Markenidentität

- **Name:** PongSmith
- **Tagline:** Die Tischtennis-Schmiede
- **Domain:** pongsmith.de (Primär), pongsmith.com (defensiv)
- **Tonalität:** sachlich-warm, Vereinsspieler-Augenhöhe, kein Sales-Speech
- **Farbwelt (live im Code):** Anthrazit + Ember Orange als Schmiede-Akzent
- **Fonts (live im Code):** Bebas Neue + Inter + JetBrains Mono
- **Frontend-Status:** Forge/Schmiede-Design vollständig umgesetzt mit `.forge-bg`, `.card-forged`, `.ember-btn`, `.glass-bar` Utility-Klassen

---

## 6. Geschäftsmodell

**Monetarisierung:** Affiliate-Provisionen (5-6%) auf Hölzer und Beläge.

**Geplante Affiliate-Partner (Phase B):**

*Offene Programme (sofort beantragbar):*
- TT-Shop.de via Adcell (5%, ~30 Tage Cookie)
- Tischtennis.biz via Adcell (5%, **90 Tage Cookie** — Trumpf)
- Decathlon DE via Awin (6%, 30 Tage, dünnes TT-Sortiment, später)

*Direkt-Anfrage notwendig:*
- Spinfactory (Köln) — Beratungs-Mentalität passt
- Futurespin (Nürnberg) — ähnlich
- Schöler & Micke (Dortmund) — Marktführer
- Contra Sport (Hamburg) — Eigenmarke Gewo
- Sport Schreiner — Mutterhaus von Donic

**Realistische Ertragsprognose:**
- Jahr 1: 2.000-8.000 €
- Jahr 2: 15.000-40.000 €
- Jahr 3: 50.000-260.000 €

**Bewusst NICHT als Einnahmequelle:**
- Eigener Shop, Bezahlbeiträge, Affiliate für Tische/Roboter/Bekleidung in Phase 1

---

## 7. Tech-Stack (live)

| Schicht | Tool | Status |
|---|---|---|
| Frontend Framework | Next.js 16 (App Router) | ✅ live |
| Sprache | TypeScript strict | ✅ live |
| Styling | Tailwind v4 + eigene Forge-Utilities | ✅ live |
| Datenbank | PostgreSQL via Supabase Frankfurt | ✅ live |
| ORM | Drizzle ORM | ✅ live |
| KI-API | Claude API (siehe Modellwahl unten) | ✅ live |
| Hosting | Vercel | ⚠️ noch lokal, Deploy ausstehend |
| Cron/Scraping | Vercel Cron Jobs | ⏳ Phase B |
| Analytics | Plausible | ⏳ Phase D |
| Repo | GitHub (private) | ✅ live |

**Erwartete Hosting-Kosten:** Phase 1 ca. 5-15 €/Monat, Phase 3 ca. 215-465 €/Monat.

---

## 8. Modellwahl Claude API (Phase-1-Entscheidung)

Strategischer Sync hat zwei verschiedene Use-Cases identifiziert:

| Endpunkt | Modell | Begründung |
|---|---|---|
| `/api/berater` (KI-Dialog) | **claude-opus-4-7** | Spiegel-Moment ist USP. Opus liefert Nuance, Empathie, kontextuelles Verständnis. Höhere Kosten gerechtfertigt durch Kernfunktion. |
| `/api/recommend` (Schnell-Check) | **claude-haiku-4-5-20251001** | Strukturierte Abfrage, keine Empathie nötig. 25× günstiger als Opus. |
| Tool-Use im Loop | **claude-haiku-4-5-20251001** | DB-Abfragen, schnelle Iterationen, kostengünstig. |

**Kosten-Realität:** Bei 1000 Berater-Dialogen/Monat = ca. 80 € Opus + 3 € Haiku. Skaliert mit Erfolg, kein Phase-1-Problem.

**Eskalations-Logik (Phase 2):** Falls Kosten in Phase 3 explodieren, smartes Modell-Routing einführen — Opus nur für lange Dialoge oder bei explizitem User-Pull, Haiku für kurze Erstberatungen.

---

## 9. Empfehlungs-Engine — Substanz und Wert

Echte Beratungs-Substanz entsteht aus drei Wissens-Quellen, die zusammenfließen:

1. **Hersteller-Daten** (~20% des Werts) — Speed, Spin, Control, Härte, Dicke, Gewicht. Skelett-Ebene. Wird über alle Hersteller normalisiert. **Status:** ✅ live, normiert auf 1-10-Skala.
2. **Aggregierte User-Reviews** (~40% des Werts) — revspin.net wurde gescraped und importiert. Community-Ratings haben Vorrang vor Hersteller-Angaben. **Status:** ✅ live für 85 Beläge und 31 Hölzer.
3. **Eigene Vereinsspieler-Erfahrungs-DB** (~40% des Werts) — Schema fertig, **0 Einträge**. **Status:** ⚠️ kritische Lücke. Quellen 1+2 sind kopierbar, Quelle 3 ist es nicht. Das ist der Moat.

**Strategische Pflicht für Phase A:** Die Vereinsspieler-Quelle ist nicht optional. revspin und Co. haben Konkurrenten genauso. Was PongSmith einzigartig macht, sind die strukturierten lokalen Vereinsspieler-Erfahrungen. Ziel: 10-15 Interviews bis Ende Mai 2026, vor Launch.

**Empfehlungs-Logik (live):**
```
Hersteller-Daten + Community-Reviews → Normalisierte Setup-DB → Synergie-Engine → Claude (Opus 4.7) als Dolmetscher
```

Claude trifft NICHT selbst Empfehlungen aus Bauchgefühl. Die Engine in `lib/synergy.ts` berechnet auf Basis der Quellen, Claude verpackt das Ergebnis menschlich.

**Synergie-Score Holz × Belag (live):**
- Tempo-Match
- Kontroll-Reserve
- Spin-Potential
- Gewichts-Balance
- Spielstil-Fit (inkl. Material)

Output: 0-100 Score plus textuelle Begründung. **2.635 Synergien sind aktuell berechnet** (31 Hölzer × 85 Beläge), Score 43–87, Ø 72.9.

**Q-TTR-Kompatibilitätsmatrix:**
Jedes Holz und jeder Belag hat einen TTR-Korridor. KI-Berater kennt Status-Codes:
- `DB_ANFAENGER` für TTR < 900 (Hinweis statt Empfehlung)
- `DB_KEIN_ERGEBNIS` für leeren Treffer im Korridor

**Hallucination-Guard:** Im System-Prompt verankert — KI darf keine Produkte erfinden, wenn DB nichts liefert.

**Feedback-Schleife:** Schema steht (recommendations, recommendation_feedback), Frontend folgt in Phase D.

---

## 10. Vereins-Datenbasis (PongSmith Unfair Advantage)

**Setup-Inventur (Phase A Pflicht):** 10-15 strukturierte Interviews mit Vereinsspielern bis Ende Mai 2026. Tool: SETUP_INVENTUR.md.

**Test-Sessions:** Ab Phase B/C — Spieler testen empfohlene Setups, geben strukturiertes Feedback. Ziel: 5-10 Sessions vor Launch.

**Material-Beirat:** NICHT in Phase A aktiv recruiten. Wenn aus Setup-Inventur 3-4 motivierte Spieler erkennbar werden, organisch zu Beirat formen ab Phase B.

**Profi-Trainer-Kontakte:** Falls in späteren Phasen Glaubwürdigkeits-Lücke spürbar, mit Sächsischem TTV / Verband sprechen.

---

## 11. Roadmap (live, ersetzt alten 25-Wochen-Plan)

Phase 0 (Fundament), Phase 1 (Datenarchitektur) und Phase 2 (KI-Berater) sind in den ersten beiden Wochen Mai 2026 weitgehend abgeschlossen. Frontend-Design (war Phase 4) ist ebenfalls live. Damit wurde der ursprüngliche 25-Wochen-Plan überholt — neue Struktur:

| Phase | Fokus | Aufwand | Output |
|---|---|---|---|
| **0. Fundament** ✅ | erledigt | Persona, USP, Konkurrenz, Name, Stack |
| **1. Datenarchitektur** ✅ | erledigt | Schema, 85 Beläge, 31 Hölzer, 2.635 Synergien |
| **2. KI-Berater** ✅ | erledigt | /api/berater, /api/recommend, Frontend-Chat |
| **A. Vereinsdaten + Polish** | 3-4 Wochen | 10-15 Interviews, Engine-Kalibrierung, Vercel-Deploy |
| **B. Shop & Affiliate** | 3-4 Wochen | Adcell, Awin, Click-Out-Tracking, Preis-Scraping |
| **C. Detail-Seiten + SEO** | 4-5 Wochen | /holz/[slug], /belag/[slug], Klebe-Guides, Schema.org |
| **D. Launch** | 2-3 Wochen | Plausible, Impressum/DSGVO, Hero-Animation, Soft-Launch |

**Realistisches Launch-Ziel:** Mitte/Ende August 2026.

**Arbeits-Pensum:** 1,5 h/Tag, 6 Tage/Woche = 9 h/Woche. Plus parallel laufende Vereins-Inventur (kein extra Code-Aufwand).

---

## 12. Was beschlossen ist (nicht mehr verhandelbar ohne Anlass)

- ✅ Strategie: Option B (KI + Multi-Shop) gestaffelt entwickelt
- ✅ Persona A (Marco) als Hauptpersona, Persona C (Materialspieler) als gleichberechtigte Phase-1-Erweiterung
- ✅ Markenneutralität als Kern-USP
- ✅ Affiliate als einzige Monetarisierung in Phase 1
- ✅ Deutsch-first, Englisch erst nach Erfolg in DE
- ✅ Klebe-/Pflege-/Tuning-Content gehört dazu (SEO + Vertrauen)
- ✅ Tech-Stack wie unter Punkt 7
- ✅ Opus 4.7 für Berater-Dialog, Haiku 4.5 für Schnell-Check und Tool-Loop
- ✅ Vereinsspieler-Datenquelle ist Pflicht, kein Optional

---

## 13. Offene To-Dos außerhalb der Code-Arbeit

- [ ] Domain pongsmith.de und pongsmith.com registrieren
- [ ] DPMA-Markencheck final dokumentieren
- [ ] Notion / Airtable für Setup-Inventur einrichten
- [ ] Erstes Selbst-Interview als Test des Bogens
- [ ] 10-15 Vereinsspieler-Interviews bis Ende Mai 2026 (Phase A)
- [ ] Vercel-Account verbinden und Deploy einrichten (Phase A)
- [ ] Adcell-Account erstellen (Phase B)
- [ ] Awin-Account erstellen (Phase B)
- [ ] Direkt-Anschreiben an Spinfactory, Futurespin (Phase B)
- [ ] Plausible-Account anlegen (Phase D)
- [ ] Logo-Konzept verfeinern (kann später)
- [ ] Impressum, DSGVO-Texte (Phase D, vor Launch)

---

## 14. Wie wir mit diesem Dokument arbeiten

- Bei jedem neuen Claude-Chatfenster zu PongSmith: dieses Doc als ersten Kontext hochladen.
- Bei jeder größeren Entscheidung: prüfen, ob sie zu Punkt 1 (Kernsatz) und 3 (USP) passt.
- Bei jeder Phasenende-Reflexion: Roadmap aktualisieren, Lerneffekte ergänzen.
- Foundation ist living document — wenn sich Erkenntnisse ändern, ändern wir sie hier zuerst.

---

*Letzte Aktualisierung: 04.05.2026 — Sync zwischen Strategie-Chat und Claude Code, Persona C ergänzt, Modellwahl entschieden, Roadmap überarbeitet*
