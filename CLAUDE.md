# CLAUDE.md — Arbeitsanweisungen für Claude Code

Diese Datei wird von Claude Code bei jedem Start automatisch gelesen. Sie enthält dauerhafte Anweisungen, wie das Projekt PongSmith zu entwickeln ist.

**Letzter Sync:** 04.05.2026 zwischen Strategie-Chat und Claude Code

---

## Projekt-Kontext (zwingend lesen)

Vor jeder neuen Session bzw. jedem neuen Task lies in dieser Reihenfolge:
1. `FOUNDATION.md` — Strategie, Persona, USP, Konkurrenz, Tech-Stack, Roadmap
2. `ROADMAP.md` — Aktueller Phasen-Status und nächste Aufgaben
3. `PRODUCT_SPEC.md` — Funktions-Übersicht (bei Feature-Fragen)
4. `SETUP_INVENTUR.md` — Nur lesen, wenn der Task mit Erfahrungs-DB oder Spielerdaten zu tun hat

---

## Tech-Stack (final, 04.05.2026)

- **Frontend:** Next.js 16 (App Router) + TypeScript (strict)
- **Styling:** Tailwind v4 + eigene CSS-Utilities (.forge-bg, .card-forged, .ember-btn, .glass-bar)
- **Datenbank:** PostgreSQL via Supabase (Region Frankfurt eu-central-1)
- **ORM:** Drizzle ORM
- **KI Berater-Dialog:** **Claude Opus 4.7** (`claude-opus-4-7`) — für Empathie und Spiegel-Moment
- **KI Schnell-Check + Tool-Use:** **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — für strukturierte Tasks
- **Hosting:** Vercel
- **Analytics:** Plausible (cookie-frei)
- **Cron/Scraping:** Vercel Cron Jobs
- **Repo:** GitHub (private)

**Modellwahl-Faustregel:**
- User-facing Empathie, Beratungs-Dialog, Nuance, Spiegel-Moment → **Opus 4.7**
- Backend-Logik, Tool-Use, Schnell-Check, Datenextraktion → **Haiku 4.5**

Wenn ein Task ein anderes Tool nahelegen würde, frage zuerst den User. Nicht eigenständig wechseln.

---

## Coding-Prinzipien

### Allgemein
- **TypeScript strict.** Alle Funktionen typed, keine `any` ohne Kommentar mit Begründung.
- **Server Components first.** Client Components nur wenn Interaktivität erfordert.
- **Lesbarer Code vor cleverem Code.** Der User pflegt das Projekt langfristig selbst.
- **Kommentare auf Deutsch.** Variablen und Funktionsnamen auf Englisch (Standard). Domain-Begriffe wie "Belag", "Holz", "Schwammhaerte" dürfen deutsch bleiben.
- **Keine Magic Numbers.** Konfiguration in `lib/config.ts` oder Environment-Variablen.
- **Fehlerbehandlung explizit.** Niemals stillschweigend Errors verschlucken.

### Datenbank
- Schema-Änderungen IMMER über Drizzle-Migrationen, niemals direkt in Supabase UI.
- Keine destructive migrations ohne explizite Bestätigung des Users.
- Sensible Daten (API-Keys, Affiliate-IDs) NIE in Migrations oder Seeds.

### Security & Privacy
- Keine API-Keys, Tokens oder Passwörter im Code. Alles über `.env.local` (lokal) oder Vercel Env Vars (Prod).
- DSGVO: User-Daten werden nur in der EU gespeichert (Supabase Frankfurt).
- Affiliate-Click-Outs werden serverseitig getrackt, nicht über Drittanbieter-Tracker.
- Plausible statt Google Analytics. Keine Cookies für Analytics.

### Git-Workflow
- Sprechende Commit-Messages auf Deutsch oder Englisch, Konvention: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Niemals automatisch pushen ohne Bestätigung.
- Branch-Strategie: erstmal alles auf `main`. Bei späterem Bedarf Feature-Branches einführen.

---

## Arbeitsweise mit dem User

### Wer ist der User?
Chris, Vereinsgründer (Shakehands e.V. Dresden), Q-TTR 1280, hat schon mehrere Claude-Code-Projekte umgesetzt (z. B. QuickNote v7). Er ist kein absoluter Anfänger, will aber Schritt-für-Schritt-Anleitungen und überlässt das Coden weitgehend dir. Stellt Fragen, wenn er etwas nicht versteht.

### Kommunikationsstil
- **Auf Deutsch.** Auch in Code-Kommentaren wo sinnvoll.
- **Direkt, ohne Schleifen.** Keine "Soll ich das jetzt machen?" wenn die Aufgabe klar ist. Einfach machen, dann zeigen.
- **Kompakte Erklärungen.** Lange Theorie-Blöcke vermeiden. Wenn Erklärung nötig, dann kurz und mit Begründung.
- **Bei Unsicherheit fragen.** Wenn ein Implementierungs-Detail mehrere sinnvolle Lösungen hat (z. B. Datenmodell-Entscheidung), zeige Optionen mit Trade-offs und frage. Bei reinem Code-Stil entscheide selbst.

### Was der User braucht
- Funktionierende Resultate, nicht Theorie-Vorträge.
- Klare nächste Schritte am Ende jeder Aufgabe.
- Hinweise, wenn etwas in der Cloud / im Browser konfiguriert werden muss (Supabase-Projekt anlegen, Vercel verbinden, etc.) — das macht Chris selbst, du kannst es nicht von der CLI aus.

### Was der User NICHT will
- Lange Foundation-Diskussionen erneut führen. Strategie steht.
- Tech-Stack erneut hinterfragen. Stack steht.
- Theoretische Vergleiche von Alternativen ohne konkreten Anlass.
- Tools auf Verdacht installieren ("könnte später nützlich sein").

---

## Roadmap-Status (immer aktuell halten)

Vor jeder Aufgabe in `ROADMAP.md` schauen, in welcher Phase wir sind. Nach Erledigung einer Aufgabe in der Roadmap als ✅ markieren und ggf. den Status-Kopf der Datei aktualisieren.

**Aktuelle Phase: A — Vereinsdaten + Deploy** (siehe ROADMAP.md)

---

## Domänen-Wissen (Tischtennis)

Damit du nicht ständig nachfragen musst, hier die Kernbegriffe:

- **Holz / Blade:** Der Schlägergriff mit Furnierschicht. Eigenschaften: Speed, Control, Steifheit, Furnier-Aufbau (z. B. "5+2 Carbon"), Gewicht.
- **Belag / Rubber:** Gummi-Schicht auf jeder Holzseite. Bestandteile: Topsheet (Oberfläche, klebrig oder griffig) + Schwamm (Schwammhärte, meist 35-55 Grad). Eigenschaften: Speed, Spin, Control, Schwammdicke (1.7-2.2mm).
- **Belagtypen:** Noppen innen ("smooth", Standard), Noppen außen kurz ("short_pips", LP), Noppen außen lang ("long_pips", KN), Anti-Topspin ("anti").
- **Q-TTR / LPZ:** Deutsches Spielstärke-Bewertungssystem. Range ca. 800-2800. PongSmith fokussiert 1000-1700.
- **Spielsysteme:** Offensiv-Topspin, Allround, Defensiv (Schupf/Block), Materialspieler (mit Noppen/Anti), Penholder.
- **VH / RH:** Vorhand / Rückhand. Beläge können unterschiedlich sein.
- **Setup:** Komplette Schläger-Konfiguration aus Holz + 2 Belägen.

---

## Persona-Hinweise für Code-Entscheidungen

Wenn UI-Sprache, Empfehlungs-Texte oder Beratungs-Logik entwickelt werden, **immer mit Persona im Kopf:**

- **Persona A (Marco, 1000-1400, Allround/Offensiv):** Hauptpersona. Marketing, Hero, primäre CTA. Sprache: warm, verständnisvoll, "verzeihend", "Sicherheit", "endlich passend".
- **Persona B (Tobias, 1400-1700, Offensiv-Topspin):** Wird gleichberechtigt bedient. Sprache: ambitionierter, "Stärken verstärken", "nächstes Level".
- **Persona C (Werner, Material-Spieler, breite TTR-Range):** Gleichberechtigt seit 04.05.2026. Sprache: respektvoll für die alternative Spielweise, kein Belächeln. "Stil-Brecher", "Sicherheits-Anker", "Spielfluss-Brecher".

Marketing-Pitch zentriert auf Persona A. Empfehlungs-Engine bedient alle drei.

---

## Häufige Aufgaben-Patterns

### Wenn der User sagt "lass uns Phase X starten":
1. ROADMAP.md lesen
2. Aktuellen Phasen-Status prüfen
3. Bestätigen, was als Output erwartet wird
4. Kurz die ersten 3-5 konkreten Schritte vorschlagen
5. Nach Bestätigung loslegen

### Wenn der User Code-Probleme hat:
1. Vollständige Fehlermeldung sehen wollen
2. Logs prüfen
3. Bei DB-Problemen: Drizzle-Migrations-Status prüfen
4. Fix implementieren, kurz erklären was schiefging

### Wenn ein Drittanbieter-Setup nötig ist (Supabase, Vercel, etc.):
1. Konkret sagen, was Chris im Browser/UI tun muss
2. Was er zurückgeben muss (URLs, Keys)
3. Erst nach Erhalt weiter im Code arbeiten

### Wenn KI-Modellwahl relevant wird:
1. Berater-Dialog (`/api/berater`): Opus 4.7
2. Schnell-Check oder Tool-Use-Heavy (`/api/recommend`): Haiku 4.5
3. Bei neuen Endpunkten: Faustregel "Empathie → Opus, Logik → Haiku"

---

## Notfall-Regeln

- Wenn du destructive Operationen vorhast (Datei/DB löschen, force-push), IMMER vorher fragen.
- Wenn du an Code-Architektur wesentlich änderst (Stack-Komponente austauschen, Schema umbauen), IMMER vorher fragen.
- Wenn der Anthropic-API-Key in einem Request mit über 10.000 Tokens verbraucht würde, vorher Hinweis geben (Kosten-Awareness, besonders bei Opus).
- Bei Unklarheit über Zielsetzung: lieber einmal zu viel fragen als in falsche Richtung bauen.

---

## Sync-Protokoll Strategie ↔ Code

Strategie-Chat und Claude-Code-Chat werden vom User aktiv synchron gehalten. Bei größeren Entscheidungen oder Konflikten:

1. User schickt Sync-Update in einen der beiden Chats
2. Anderer Chat aktualisiert FOUNDATION.md, CLAUDE.md, ROADMAP.md entsprechend
3. Datum am Ende der Datei aktualisieren
4. Bei Konflikten: Beide Sichtweisen dokumentieren, Entscheidung markieren

---

## Letzter Hinweis

Dieses Dokument ist living. Wenn du oder Chris feststellt, dass eine Regel nicht funktioniert, ändert sie hier. Datum der letzten Änderung am Ende vermerken.

---

*Letzte Änderung: 04.05.2026 — Sync zwischen Strategie-Chat und Claude Code*
