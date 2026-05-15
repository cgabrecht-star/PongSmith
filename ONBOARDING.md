# PongSmith — Onboarding für Claude

Stand: 16. Mai 2026. Diese Datei ist der Einstieg für jede neue Claude-Code-Session.
Lies sie KOMPLETT bevor du anfängst zu arbeiten.

---

## 1. Wer ist Chris (der User)

- **Christoph Gabrecht**, Vereinsspieler Q-TTR ~1280, Solo-Gründer von PongSmith
- Hauptberuf: Vertrieb bei VISIOVET Medizintechnik (Tierarzt-Equipment)
- Wohnt in/bei Dresden, fährt regelmäßig nach Berlin (Außendienst)
- Erfahren mit Claude Code, hat schon mehrere Projekte gebaut

**Wie er arbeitet:**
- Will Klartext, keine Lobeshymnen, kein "tolle Idee!"
- Korrigiert dich aktiv wenn du Quatsch sagst — nimm das ernst, kein Wegrationalisieren
- Er will erst nachdenken/abwägen, DANN Code. Sparringspartner, nicht Befehlsausführer.
- Kommunikation: Deutsch, "du", informell aber nicht kumpelhaft
- Bringt regelmäßig Praxis-Feedback rein (Bernd & Martin vom TT-Shop Dresden, Foren, eigene Spielpraxis)
- Mag wenn du **selbst eine Position vertrittst** statt nach Konsens zu fragen
- Wenn du nicht weiterkommst: ehrlich sagen, nicht halluzinieren

---

## 2. Was ist PongSmith

**Produkt:** KI-gestützter Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler.

**URL:** https://pongsmith.de (live in Production seit Mai 2026)

**Kern-Mechanik:** User gibt Profil ein (TTR, Spielstil, aktuelles Setup, Problem) → Claude-Berater (Sonnet 4.6) sondiert per Tool-Use die Datenbank → liefert 2-3 Setup-Empfehlungen mit Preisen + Shop-Links.

**Geschäftsmodell:** Affiliate-Links zu deutschen TT-Shops. Tool ist gratis für User.

**Datenbank:** ~1.400 Beläge + Hölzer mit Specs aus revspin.net, Hersteller-Webseiten, Community-Reviews. Pre-berechnete Synergie-Scores für jede Holz×Belag-Kombi.

---

## 3. Tech-Stack

| Schicht | Tech |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (`@theme`-Direktive), Framer Motion |
| Backend | Next.js API Routes (Edge + Node) |
| Datenbank | Supabase PostgreSQL, Frankfurt (eu-central-1) |
| ORM | Drizzle ORM + postgres-js |
| KI | Anthropic Claude API mit Tool-Use, Modell `claude-sonnet-4-6` |
| Hosting | Vercel (Edge Functions + ISR) |
| Analytics | Vercel Analytics + Speed Insights, plus Custom Events via `@vercel/analytics` |
| Domain | `pongsmith.de`, registriert bei INWX |

---

## 4. Code & Repos

- **Lokal:** `C:\dev\pongsmith` (NIEMALS in OneDrive-Pfade verschieben — siehe Punkt 11)
- **GitHub:** https://github.com/cgabrecht-star/PongSmith (Branch: `main`, Default-Push-Target)
- **Vercel-Projekt:** `cgabrecht-stars-projects/pongsmith`
- **Auto-Deploy:** jeder Push auf `main` → Vercel deployed automatisch (~2 Min)

---

## 5. Accounts & Services (mit Identifiern, NIE Passwörter)

### Vercel
- Account/Team: `cgabrecht-stars-projects`
- Project: `pongsmith`
- Linked via: `npx vercel link` (settings in `.vercel/project.json`)
- ENV-Vars sind in Vercel hinterlegt, lokal via `npx vercel env pull .env.local`

### Supabase
- Project-ID: `zahmmjzdsxmhocfowjch` (Region: aws-1-eu-north-1)
- Connection: pooler.supabase.com:6543 (für serverless), Direct via .env.local
- RLS aktiv auf allen 15 Tabellen (security audit Mai 2026), App nutzt postgres-Role (bypasst RLS)

### Anthropic API
- Modell: `claude-sonnet-4-6` (siehe `lib/config.ts`)
- API-Key in Vercel ENV als `ANTHROPIC_API_KEY`
- Rate-Limit: 20/Stunde, 100/Tag pro IP-Hash (in `app/api/berater/route.ts`)
- Billing-Alarm in Anthropic Console eingerichtet (Chris hat das gesetzt)

### Google Search Console
- Domain-Property `pongsmith.de` verifiziert via DNS TXT (INWX)
- Sitemap.xml submitted, Status "Erfolgreich", 1.412 URLs
- 4 manuelle Indexierungs-Requests gemacht (Home, Berater, Sortiment, Mithelfen)
- Pongsmith.de ist erfolgreich indexiert (ge-checkt via URL-Prüfung)

### Affiliate-Programme
| Programm | Status | ID |
|---|---|---|
| Amazon PartnerNet | aktiv | Tag `pongsmith-21` |
| Awin | Publisher approved | ID `2883847`, einzelne Programme noch nicht |
| Adcell | Publisher approved | ID `315086` in Vercel ENV als `AFFILIATE_ADCELL_PUBLISHER_ID` |
| Tischtennis.biz (via Adcell) | beworben, wartet auf Approval | nach Approval: `AFFILIATE_ADCELL_PROMO_TISCHTENNIS_BIZ` setzen |
| TT-Shop (Matthias Bormann, Dresden) | Direktkontakt offen | Tel `015771682420`, Email `info@tt-shop.de` |

### Vercel Analytics
- Aktiviert, läuft seit ~14. Mai
- Custom Events implementiert: `berater_submitted`, `berater_success`, `berater_failed`, `shop_clicked`

### INWX (Domain-Registrar)
- Domain `pongsmith.de` liegt dort
- DNS verwaltet Chris selbst

---

## 6. Datenbank-Schema (Highlights)

Tabellen-Übersicht:
- `manufacturers` — Hersteller-Stammdaten
- `blades` — Hölzer (699 active, 113 mit Preis), Felder: speedNorm, controlNorm, communitySpeed, communityControl, communityReviewCount, layers, composition, weightMin/Max, stiffness, **priceEur**, isActive
- `rubbers` — Beläge (710 active, 157 mit Preis), Felder: speedNorm, spinNorm, controlNorm, community*, type (smooth/long_pips/short_pips/anti), **topsheetCharacter (sticky/grippy/neutral/hybrid)**, hardnessMin/Max, **priceEur**
- `synergies` — vorberechnete Holz×Belag-Kombis mit Scores (synergyScore, scoreOffensive/Allround/Defensive/Material, tempoMatch, controlReserve, spinPotential, ttrTarget, playStyleTarget)
- `shops` + `shop_products` + `prices` — für Multi-Shop-Affiliate. `prices` aktuell leer (kein Scraper).

**Synergy-Engine v2** (`lib/synergy.ts`): Stil-spezifische Scores, kalibrierte Gauss-Peaks, Härte-Sweet-Spot, Topsheet×Stiffness-Match, Hybrid-Topsheet-Logik.

**Migrationen** in `scripts/`:
- `migrate_price.mjs` — `price_eur` Spalte
- `migrate_hybrid.mjs` — Hybrid-Enum + Tagging
- `seed_prices.mjs` — Top-100 Preise

---

## 7. Was funktioniert (Stand 16.05.2026)

✅ Berater-Flow live: 4-Step (Setup → Problem → Beraten → Setups)
✅ Sitemap.xml mit 1.412 URLs, Google indexiert
✅ Setup-Cards mit Holz + Belag + Preis + Synergie-Score + Shop-Pills
✅ 6 Shop-Optionen pro Produkt (TT-Shop, Tischtennis.biz, Contra, Schöler+Micke, JOOLA-Shop, Amazon)
✅ Mehrsprachigkeit DE/EN (EN-Prompt minimaler, könnte erweitert werden)
✅ Vercel Analytics aktiv, Custom Events funktionieren
✅ Rate-Limiting gegen Cost-DoS
✅ XSS-Hardening für Schema.org JSON-LD
✅ Strukturpflicht für KI-Antworten (Setup 1: ... Setup 2: ...)
✅ Frankenstein-Card-Bug gefixt
✅ Disclaimed-Setup-Filter (KI sagt "weglassen" → Card wird nicht gerendert)
✅ Substring-Shadowing (Marder/Marder II nicht doppelt)
✅ Western-Brand-Filter (keine China-Beläge für TTR <1500 wenn Allround)
✅ Preisbewusstsein: budget_max_eur Parameter, Setups über Budget werden gefiltert
✅ Verfügbarkeits-Proxy via review_count >= 10
✅ Hybrid-Belag-Klassifikation + Sweet-Spot-Logik
✅ Confidence-Discount in Sortierung ([Klassiker] vor [bekannt])
✅ System-Prompt 7.000 Zeichen mit Ehrlichkeits-Pakt, Triangulation, Few-Shot

---

## 8. Pending TODOs (Stand 16.05.2026)

### Wartet auf externe Aktion
- Tischtennis.biz Adcell-Programm-Approval (1-7 Tage seit Bewerbung)
- Wenn approved: `AFFILIATE_ADCELL_PROMO_TISCHTENNIS_BIZ` in Vercel ENV setzen
- TT-Shop Bormann anrufen (Direktkontakt für Affiliate-Deal)

### Marketing/Outreach (noch nicht gestartet)
- Foren-Launch: mytischtennis.de, forum.tt-news.de, Reddit r/tabletennis (Posts vorbereitet, siehe Strategie weiter unten)
- Bing Webmaster Tools Setup
- Pongsmith bei mytischtennis-Forum bekannt machen

### Daten-Backlog
- ~85% der Produkte ohne UVP-Preis. Optionen: weiter manuell seeden oder Scraper für TT-Shop bauen
- Discontinued-Liste mit Bernd erstellen (Bernd ist aktuell pausiert auf User-Wunsch)
- Yinhe Pro 13 / Big Dipper Pro / Tibhar K3 (pure) als Hybrid taggen wenn in DB vorhanden (Substring-Suche fand sie nicht)

### Code-Backlog
- EN-System-Prompt auf das Niveau des DE-Prompts heben
- Englische Anti-Patterns + Few-Shot ergänzen
- Preise-Scraper für 1-2 Top-Shops (z.B. TT-Shop, Tischtennis.biz)
- Bernds Override-Layer (manuell taggen "recommended/avoid" pro Produkt) — wartet
- Bug B (Material-Format VH/RH bei mehreren Setups mit identischen Belägen) noch offen
- Bug E (DB-Naming-Mismatch z.B. "Friendship 729 OEM" nicht detected) auf Backlog

---

## 9. Wichtigste Commits (chronologisch rückwärts)

```
e78de26 feat(berater): Hybrid-Belag-Klassifikation + Confidence-Discount
24c1b49 fix(prompt): Trainingspartner als stärkster Technik-Indikator
29e8567 feat(berater-prompt): Ehrlichkeits-Pakt, Triangulation, Tool-Output-Semantik, Few-Shot
b06b02b feat(berater): Preisbewusstsein, Verfügbarkeits-Filter, Fachwissen-Bibliothek
82abd78 fix(grouper): Produkt-Zuordnung nur aus Setup-Titel-Zeile
923e701 fix(detector): Substring-Shadowing (Marder/Marder II)
e9c259a fix(berater): Bug C verfeinert
4897c40 fix(berater): 4 Bug-Fixes nach Test-Session 2
dea312d fix(berater): Setup-Marker robuster + Fallback ohne Frankenstein-Karten
3eca82e fix(db): build-safe DB-Init via Proxy statt null
823ac9f feat: Adcell-Integration vorbereitet (Code-seitig bereit)
defaef5 security: Audit-Fixes — Rate-Limit, Tot-Code, XSS-Hardening
d67e85d security: Row-Level Security auf allen 15 Tabellen aktiviert
9eb2ee2 chore: Berater-Modell von Opus 4.7 auf Sonnet 4.7 (Anm: Sonnet 4.7 existiert nicht, danach auf 4.6 korrigiert)
```

---

## 10. Wichtige Personen-/Marken-Kontexte

- **Bernd & Martin** vom TT-Shop Dresden: Praxisexperten, lieferten heute (16.05.) das wichtigste Feedback. Aktuell pausiert auf User-Wunsch. Sollten später für Override-Layer eingeladen werden.
- **Matthias Bormann** vom TT-Shop (anderer Shop, NICHT Dresden): hatte sich auf erste Email gemeldet, Affiliate-Direktkontakt offen. Tel `015771682420`.
- **Chris's Q-TTR ~1280**: relevant für seine Selbsteinschätzung als "Marco-Typ" im Spieler-Tendenzen-Schema.

---

## 11. KRITISCHE OPERATIVE HINWEISE

### OneDrive-Falle (mehrfach passiert!)
- Code-Projekte NIE in OneDrive-Pfade verschieben oder erstellen
- Auch nicht in `C:\Users\Gabrecht\Desktop\` (das ist OneDrive-redirected wenn Backup aktiv)
- Code lebt **ausschließlich in `C:\dev\`**
- OneDrive Files-On-Demand virtualisiert sonst Files (auch `.git/`) → Git-Repo wird zerstört
- User hat OneDrive Desktop-Backup deaktiviert, aber Vorsicht bleibt geboten

### Bash-Sandbox-Limits
- Sandbox-Bash hat Probleme mit Pfaden mit Leerzeichen, Tilde, Backslash-Escaping
- Bei Fehlern: forward-slash-Pfad mit `/c/dev/pongsmith` versuchen
- `cd` in Bash bleibt nicht persistent zwischen Calls
- Für komplexe Bash-Befehle: User in PowerShell ausführen lassen

### Build / Deploy Loop
1. `cd /c/dev/pongsmith && npm run build` → muss sauber durch
2. `git add ... && git commit -m "..." && git push`
3. Vercel deployed automatisch (~2 Min)
4. Live-Check via https://pongsmith.de

### Browser-Tests
- Chrome-Extension "Claude in Chrome" ist installiert, kann live testen
- `mcp__Claude_in_Chrome__list_connected_browsers` → `select_browser` → `tabs_context_mcp(createIfEmpty:true)` → loslegen
- Bei vielen Test-Runs auf Anthropic-API-Kosten achten (Rate-Limit greift dann)

---

## 12. Aktueller Mini-Backlog aus heutiger Session

- User hat heute den überarbeiteten System-Prompt komplett gelesen, war einverstanden mit Anwendung
- Diskussion über Spieler-Tendenzen-Block: ich (Claude) habe gemerkt der wirkt etwas redundant. User-Entscheidung dazu offen.
- Hybrid-Tagging hat 15 Produkte gefunden, aber Tibhar K3 (pure), Yinhe Pro 13, Big Dipper Pro fehlten in DB-Substring. Falls in DB anders benannt: nachtaggen.

---

## 13. Wenn du in einem neuen Chat anfängst

1. **Lies diese Datei komplett.**
2. Frag Chris kurz: "Womit fangen wir an?" — er hat klare Prioritäten.
3. NICHT proaktiv große Refactors vorschlagen. Er treibt die Richtung.
4. Bei Code-Änderungen: erst denken, dann committen. Build-Test ist Pflicht vor Push.
5. Stil: Klartext, sachlich, mit Position. Kein Jubel, keine Floskeln.
