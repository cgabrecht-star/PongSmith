# PongSmith

Die unabhängige Material-Beratung für Tischtennis-Vereinsspieler.

KI-gestützter Schläger-Berater (Holz + 2 Beläge), Preisvergleich über mehrere Shops, Affiliate-Monetarisierung. Zielgruppe: Q-TTR 1000–1700.

## Tech-Stack

- **Frontend:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui
- **Datenbank:** PostgreSQL via Supabase (Frankfurt), Drizzle ORM
- **KI:** Anthropic Claude API (`claude-opus-4-7` Dialog, `claude-haiku-4-5` Hintergrund-Tasks)
- **Hosting:** Vercel + Supabase
- **Analytics:** Plausible (cookie-frei)

## Lokales Setup

```bash
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen anlegen
cp .env.example .env.local
# .env.local befüllen (DATABASE_URL, ANTHROPIC_API_KEY)

# Entwicklungsserver starten
npm run dev
```

## Datenbankbefehle

```bash
npm run db:push      # Schema auf DB anwenden (Entwicklung)
npm run db:generate  # Migration generieren
npm run db:migrate   # Migrationen anwenden (Produktion)
npm run db:studio    # Drizzle Studio öffnen
```

## Projekt-Dokumentation

Alle strategischen Docs liegen unter `docs/`:

- `docs/FOUNDATION.md` — Strategie, Persona, USP, Roadmap
- `docs/ROADMAP.md` — Technische Phasen und Aufgaben
- `docs/CLAUDE.md` — Arbeitsanweisungen für Claude Code
- `docs/SETUP_INVENTUR.md` — Fragebogen für Vereinsspieler-Interviews

## Ordnerstruktur

```
app/          Next.js App Router (Routen, Layouts, Pages)
components/   React-Komponenten (ui/ für shadcn)
lib/          Hilfsfunktionen, Konfiguration, Empfehlungs-Engine
db/           Drizzle-Schema, Migrationen, DB-Client
types/        TypeScript-Typen
docs/         Projekt-Dokumentation
public/       Statische Assets
```
