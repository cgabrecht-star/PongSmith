# Erster Prompt für Claude Code

Diese Datei enthält den Prompt, mit dem du Claude Code in diesem Projekt zum ersten Mal ansprichst. Kopiere den Block unter "PROMPT" komplett in die Claude-Code-CLI.

---

## Vorbereitung (vorher erledigen)

1. Diese 4 Dateien liegen im Projektordner `pongsmith/`:
   - FOUNDATION.md
   - CLAUDE.md
   - ROADMAP.md
   - SETUP_INVENTUR.md

2. Du bist im Terminal in diesem Ordner: `cd C:\Projekte\pongsmith` (oder dein Pfad)

3. Claude Code läuft: `claude`

4. Anthropic API Key ist konfiguriert.

---

## PROMPT (diesen Block komplett kopieren):

```
Hi. Ich starte hiermit das PongSmith-Projekt.

Bitte lies zuerst in dieser Reihenfolge:
1. CLAUDE.md (Arbeitsanweisungen, Tech-Stack, Coding-Prinzipien)
2. FOUNDATION.md (Strategie, Persona, USP, Konkurrenz)
3. ROADMAP.md (Phasen-Plan, aktuell starten wir Phase 1)

SETUP_INVENTUR.md kannst du erstmal überfliegen, brauchst du erst in Woche 5-7.

Wenn du alles gelesen hast, melde dich kurz mit:
- Bestätigung, dass du den Kontext hast
- 2-3 Sätzen, was du als Hauptaufgabe für die nächsten 2 Wochen verstehst
- Ggf. Verständnisfragen, falls etwas unklar ist

DANN, nach meinem OK, starte mit Phase 1.1 (Projekt-Setup) aus der ROADMAP.md:
- Next.js 15 Projekt initialisieren mit TypeScript, Tailwind, App Router, ESLint
- shadcn/ui einrichten (Setup vorbereiten, noch keine Komponenten installieren)
- Drizzle ORM installieren und Grund-Konfiguration
- Prettier konfigurieren
- Ordnerstruktur: app/, components/, lib/, db/, types/, docs/
- .env.example mit Platzhaltern: ANTHROPIC_API_KEY, DATABASE_URL, NEXT_PUBLIC_PLAUSIBLE_DOMAIN
- Korrektes .gitignore
- README.md mit Projekt-Beschreibung in Stichpunkten

Wichtig:
- Lege die 4 Foundation-Dateien (CLAUDE.md, FOUNDATION.md, ROADMAP.md, SETUP_INVENTUR.md) in den Ordner docs/ um, damit sie projektintern sind
- Schreibe noch KEINEN Anwendungs-Code (keine Komponenten, keine Routen außer Default)
- Nach Setup: Zeige mir Ordnerstruktur als Tree und nächste konkrete Schritte

Wenn du etwas nicht selbst entscheiden kannst, frag.
```

---

## Was du nach diesem ersten Prompt erwarten kannst

1. Claude Code liest die Docs (1-2 Min)
2. Bestätigt Kontext und stellt ggf. Fragen
3. Du sagst "OK, leg los"
4. Claude Code initialisiert das Projekt (10-20 Min)
5. Du siehst Ordnerstruktur, kannst `npm run dev` starten und auf localhost:3000 die Default-Next.js-Page sehen

Nach Phase 1.1 sind im ROADMAP.md die nächsten Aufgaben (1.2 Supabase-Setup, 1.3 DB-Schema). Du sagst dann einfach "Lass uns 1.2 angehen" und Claude Code arbeitet weiter.

---

## Wichtige Sätze, die du immer wieder brauchst

**Wenn neue Session startet:**
> "Lies CLAUDE.md, FOUNDATION.md und ROADMAP.md. Wir sind aktuell in Phase X.Y. Lass uns weitermachen."

**Wenn du nicht weiterkommst:**
> "Ich habe folgendes Problem: [Fehlermeldung oder Beschreibung]. Was tun?"

**Wenn etwas schief gegangen ist:**
> "Bevor du fixt, erkläre mir kurz, was schiefging und was deine Vermutung ist. Dann fix."

**Wenn du eine Pause machst:**
> "Bitte fasse zusammen, wo wir stehen, was als nächstes ansteht, und welche Files du gerade geändert hast. Damit ich beim nächsten Start sofort weitermachen kann."

**Wenn du unsicher bist:**
> "Erkläre mir das Konzept hinter [X] in 3-5 Sätzen, bevor du weitermachst."

---

## Faustregel

Foundation steht. Tech-Stack steht. Roadmap steht. **Ab jetzt: bauen, nicht reden.**

Wenn du in 4 Wochen merkst, eine Annahme ist falsch, korrigieren wir das in den Docs. Aber erst wenn echte Daten/Erfahrung uns dazu zwingen, nicht aus dem Bauch heraus.

Viel Erfolg.
